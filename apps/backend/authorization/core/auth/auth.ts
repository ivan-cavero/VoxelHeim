import { api, APIError, ErrCode, type Header } from 'encore.dev/api'
import { authHandler } from 'encore.dev/auth'
import { db } from '../db'
import { users } from '~encore/clients'
import log from 'encore.dev/log'
import { hash, verify } from '@node-rs/argon2'
import * as jose from 'jose'
import { Topic } from 'encore.dev/pubsub'

// Secret key for JWT signing - in production, use environment variables
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key')
const JWT_ISSUER = 'your-app-name'
const JWT_AUDIENCE = 'your-app-audience'

interface AuthParams {
	authorization: Header<'Authorization'>
}

interface AuthData {
	userID: string
	role: string
}

interface RegisterParams {
	username: string
	email: string
	password: string
}

interface LoginParams {
	email: string
	password: string
}

interface AuthResponse {
	user: {
		id: number
		username: string
		email: string
	}
	token: string
}

interface PasswordResetRequestParams {
	email: string
}

interface PasswordResetParams {
	token: string
	newPassword: string
}

interface VerifyEmailParams {
	token: string
}

interface OAuthLoginParams {
	provider: 'google' | 'github'
	code: string
}

// Define the email event interface
export interface EmailEvent {
	to: string
	subject: string
	template: 'verification' | 'password_reset'
	data: {
		token: string
		username?: string
	}
}

// Create the email topic in the auth service
export const UserEmailTopic = new Topic<EmailEvent>('user-email', {
	deliveryGuarantee: 'at-least-once'
})

export const auth = authHandler<AuthParams, AuthData>(async ({ authorization }) => {
	try {
		if (!authorization) {
			throw new APIError(ErrCode.Unauthenticated, 'No authorization header')
		}

		const token = authorization.replace('Bearer ', '')
		const { payload } = await jose.jwtVerify(token, JWT_SECRET, {
			issuer: JWT_ISSUER,
			audience: JWT_AUDIENCE
		})

		if (!payload.sub) {
			throw new APIError(ErrCode.Unauthenticated, 'Invalid token')
		}

		const user = await users.getUserById({ userId: Number(payload.sub) })

		return {
			userID: user.id.toString(),
			role: user.role_id === 1 ? 'admin' : 'user'
		}
	} catch (error) {
		log.error('Authentication error', {
			error: error instanceof Error ? error.message : String(error)
		})
		throw new APIError(ErrCode.Unauthenticated, 'Invalid token')
	}
})

async function generateToken(userId: number): Promise<string> {
	const jwt = await new jose.SignJWT({ 'urn:example:claim': true })
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setIssuer(JWT_ISSUER)
		.setAudience(JWT_AUDIENCE)
		.setExpirationTime('2h')
		.setSubject(userId.toString())
		.sign(JWT_SECRET)

	return jwt
}

function generateRandomToken(): string {
	return crypto.randomUUID()
}

export const register = api<RegisterParams, AuthResponse>(
	{
		method: 'POST',
		path: '/register',
		expose: true
	},
	async ({ username, email, password }) => {
		try {
			const existingUser = await db.queryRow`
        SELECT id FROM users WHERE username = ${username} OR email = ${email}
      `
			if (existingUser) {
				throw new APIError(ErrCode.AlreadyExists, 'Username or email already exists')
			}

			const passwordHash = await hash(password)
			const verificationToken = generateRandomToken()

			const defaultRole = await db.queryRow<{ id: number }>`SELECT id FROM roles WHERE name = 'user'`
			const defaultProvider = await db.queryRow<{ id: number }>`SELECT id FROM providers WHERE name = 'local'`

			if (!defaultRole || !defaultProvider) {
				throw new APIError(ErrCode.NotFound, 'Default role or provider not found')
			}

			const newUser = await db.queryRow<AuthResponse['user']>`
				INSERT INTO users (
				username, email, password_hash, role_id, provider_id,
				email_verified, email_verification_token
				)
				VALUES (
				${username}, ${email}, ${passwordHash}, ${defaultRole.id},
				${defaultProvider.id}, false, ${verificationToken}
				)
				RETURNING id, username, email
			`

			if (!newUser) {
				throw new APIError(ErrCode.Internal, 'Failed to create new user')
			}

			// Publish email event
			await UserEmailTopic.publish({
				to: email,
				subject: 'Verify your email',
				template: 'verification',
				data: {
					token: verificationToken,
					username
				}
			})

			const token = await generateToken(newUser.id)

			return { user: newUser, token }
		} catch (error) {
			log.error('Error registering user', { error: error instanceof Error ? error.message : String(error) })
			if (error instanceof APIError) {
				throw error
			}
			throw new APIError(ErrCode.Internal, 'An unexpected error occurred')
		}
	}
)

export const login = api<LoginParams, AuthResponse>(
	{
		method: 'POST',
		path: '/login',
		expose: true
	},
	async ({ email, password }) => {
		try {
			const user = await db.queryRow<AuthResponse['user'] & { password_hash: string; email_verified: boolean }>`
        SELECT id, username, email, password_hash, email_verified
        FROM users
        WHERE email = ${email} AND deleted_at IS NULL
      `

			if (!user) {
				throw new APIError(ErrCode.NotFound, 'Invalid email or password')
			}

			const isPasswordValid = await verify(user.password_hash, password)
			if (!isPasswordValid) {
				throw new APIError(ErrCode.Unauthenticated, 'Invalid email or password')
			}

			if (!user.email_verified) {
				throw new APIError(ErrCode.PermissionDenied, 'Email not verified')
			}

			await users.updateUser({
				userId: user.id,
				updates: { last_login: new Date().toISOString() }
			})

			const token = await generateToken(user.id)
			const { password_hash, email_verified, ...userWithoutSensitive } = user

			return { user: userWithoutSensitive, token }
		} catch (error) {
			log.error('Error logging in user', { error: error instanceof Error ? error.message : String(error) })
			if (error instanceof APIError) {
				throw error
			}
			throw new APIError(ErrCode.Internal, 'An unexpected error occurred')
		}
	}
)

export const requestPasswordReset = api<PasswordResetRequestParams, { success: boolean }>(
	{
		method: 'POST',
		path: '/password-reset-request',
		expose: true
	},
	async ({ email }) => {
		try {
			const resetToken = generateRandomToken()
			const tokenExpiry = new Date()
			tokenExpiry.setHours(tokenExpiry.getHours() + 1) // Token valid for 1 hour

			await db.exec`
				UPDATE users
				SET password_reset_token = ${resetToken},
					password_reset_expires = ${tokenExpiry.toISOString()}
				WHERE email = ${email} AND deleted_at IS NULL
			`

			// Publish email event
			await UserEmailTopic.publish({
				to: email,
				subject: 'Reset your password',
				template: 'password_reset',
				data: {
					token: resetToken
				}
			})

			return { success: true }
		} catch (error) {
			log.error('Error requesting password reset', { error: error instanceof Error ? error.message : String(error) })
			throw new APIError(ErrCode.Internal, 'An unexpected error occurred')
		}
	}
)

export const resetPassword = api<PasswordResetParams, { success: boolean }>(
	{
		method: 'POST',
		path: '/password-reset',
		expose: true
	},
	async ({ token, newPassword }) => {
		try {
			const user = await db.queryRow`
				SELECT id
				FROM users
				WHERE password_reset_token = ${token}
				AND password_reset_expires > CURRENT_TIMESTAMP
				AND deleted_at IS NULL
			`

			if (!user) {
				throw new APIError(ErrCode.InvalidArgument, 'Invalid or expired reset token')
			}

			const passwordHash = await hash(newPassword)

			await db.exec`
				UPDATE users
				SET password_hash = ${passwordHash},
					password_reset_token = NULL,
					password_reset_expires = NULL
				WHERE id = ${user.id}
			`

			return { success: true }
		} catch (error) {
			log.error('Error resetting password', { error: error instanceof Error ? error.message : String(error) })
			if (error instanceof APIError) {
				throw error
			}
			throw new APIError(ErrCode.Internal, 'An unexpected error occurred')
		}
	}
)

export const verifyEmail = api<VerifyEmailParams, { success: boolean }>(
	{
		method: 'POST',
		path: '/verify-email',
		expose: true
	},
	async ({ token }) => {
		try {
			const user = await db.queryRow`
				SELECT id
				FROM users
				WHERE email_verification_token = ${token}
				AND deleted_at IS NULL
			`

			if (!user) {
				throw new APIError(ErrCode.InvalidArgument, 'Invalid verification token')
			}

			await db.exec`
				UPDATE users
				SET email_verified = true,
					email_verification_token = NULL
				WHERE id = ${user.id}
			`

			return { success: true }
		} catch (error) {
			log.error('Error verifying email', { error: error instanceof Error ? error.message : String(error) })
			if (error instanceof APIError) {
				throw error
			}
			throw new APIError(ErrCode.Internal, 'An unexpected error occurred')
		}
	}
)

export const oauthLogin = api<OAuthLoginParams, AuthResponse>(
	{
		method: 'POST',
		path: '/oauth/login',
		expose: true
	},
	async ({ provider, code }): Promise<AuthResponse> => {
		try {
			let userInfo: { id: string; email: string; name: string }

			if (provider === 'google') {
				userInfo = await exchangeGoogleCode(code)
			} else if (provider === 'github') {
				userInfo = await exchangeGithubCode(code)
			} else {
				throw new APIError(ErrCode.InvalidArgument, 'Invalid OAuth provider')
			}

			let user = await db.queryRow<AuthResponse['user']>`
				SELECT u.id, u.username, u.email
				FROM users u
				JOIN providers p ON u.provider_id = p.id
				WHERE u.email = ${userInfo.email} AND p.name = ${provider}
			`

			if (!user) {
				const providerRow = await db.queryRow<{ id: number }>`
					SELECT id FROM providers WHERE name = ${provider}
				`
				if (!providerRow) {
					throw new APIError(ErrCode.NotFound, 'OAuth provider not found')
				}

				user = await db.queryRow<AuthResponse['user']>`
					INSERT INTO users (username, email, email_verified, provider_id, role_id)
					VALUES (${userInfo.name}, ${userInfo.email}, true, ${providerRow.id},
						(SELECT id FROM roles WHERE name = 'user'))
					RETURNING id, username, email
				`

				if (!user) {
					throw new APIError(ErrCode.Internal, 'Failed to create new user')
				}
			}

			const token = await generateToken(user.id)

			return { user, token }
		} catch (error) {
			log.error('OAuth login error', { error: error instanceof Error ? error.message : String(error) })
			if (error instanceof APIError) {
				throw error
			}
			throw new APIError(ErrCode.Internal, 'An unexpected error occurred during OAuth login')
		}
	}
)

async function exchangeGoogleCode(code: string): Promise<{ id: string; email: string; name: string }> {
	// TODO: Implement Google OAuth code exchange and user info fetching
	throw new Error(`Google OAuth not implemented: ${code}`)
}

async function exchangeGithubCode(code: string): Promise<{ id: string; email: string; name: string }> {
	// TODO: Implement GitHub OAuth code exchange and user info fetching
	throw new Error(`GitHub OAuth not implemented: ${code}`)
}
