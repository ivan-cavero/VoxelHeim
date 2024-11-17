import { api, APIError, ErrCode } from 'encore.dev/api'
import { db } from './db'
import log from 'encore.dev/log'
import { hash, verify } from '@node-rs/argon2'

interface User {
	id: number
	uuid: string
	username: string
	email: string
	role_id: number
	two_factor_enabled: boolean
	last_login: string | null
	is_online: boolean
	provider_id: number
	created_at: string
	updated_at: string
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
	user: Omit<User, 'password_hash'>
	token: string
}

export const register = api<RegisterParams, AuthResponse>(
	{
		method: 'POST',
		path: '/register',
		expose: true
	},
	async ({ username, email, password }) => {
		try {
			log.info('Registering new user', { username, email })

			const existingUser = await db.queryRow`
                SELECT id FROM users WHERE username = ${username} OR email = ${email}
            `
			if (existingUser) {
				throw new APIError(ErrCode.AlreadyExists, 'Username or email already exists')
			}

			const passwordHash = await hash(password)

			const defaultRole = await db.queryRow<{ id: number }>`SELECT id FROM roles WHERE name = 'user'`
			const defaultProvider = await db.queryRow<{ id: number }>`SELECT id FROM providers WHERE name = 'local'`

			if (!defaultRole || !defaultProvider) {
				throw new APIError(ErrCode.NotFound, 'Default role or provider not found')
			}

			const newUser = await db.queryRow<User>`
                INSERT INTO users (username, email, password_hash, role_id, provider_id)
                VALUES (${username}, ${email}, ${passwordHash}, ${defaultRole.id}, ${defaultProvider.id})
                RETURNING id, uuid, username, email, role_id, two_factor_enabled, last_login, is_online, provider_id, created_at, updated_at
            `

			if (!newUser) {
				throw new APIError(ErrCode.Internal, 'Failed to create new user')
			}

			log.info('User registered successfully', { userId: newUser.id })

			const token = `token_${newUser.id}_${Date.now()}`

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
			log.info('Attempting user login', { email })

			const user = await db.queryRow<User & { password_hash: string }>`
                SELECT id, uuid, username, email, password_hash, role_id, two_factor_enabled, last_login, is_online, provider_id, created_at, updated_at
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

			log.info('User logged in successfully', { userId: user.id })

			await db.exec`
                UPDATE users
                SET last_login = CURRENT_TIMESTAMP
                WHERE id = ${user.id} AND deleted_at IS NULL
            `

			const token = `token_${user.id}_${Date.now()}`

			const { password_hash, ...userWithoutPassword } = user
			return { user: userWithoutPassword, token }
		} catch (error) {
			log.error('Error logging in user', { error: error instanceof Error ? error.message : String(error) })
			if (error instanceof APIError) {
				throw error
			}
			throw new APIError(ErrCode.Internal, 'An unexpected error occurred')
		}
	}
)

export const logout = api<{ userId: number }, { success: boolean }>(
	{
		method: 'POST',
		path: '/logout',
		expose: true
	},
	async ({ userId }) => {
		try {
			log.info('Attempting user logout', { userId })

			await db.exec`
                UPDATE users
                SET last_login = CURRENT_TIMESTAMP
                WHERE id = ${userId} AND deleted_at IS NULL
            `

			// Check if the user exists and was updated
			const updatedUser = await db.queryRow<{ id: number }>`
                SELECT id
                FROM users
                WHERE id = ${userId} AND deleted_at IS NULL
            `

			if (!updatedUser) {
				throw new APIError(ErrCode.NotFound, 'User not found')
			}

			log.info('User logged out successfully', { userId })

			return { success: true }
		} catch (error) {
			log.error('Error logging out user', { userId, error: error instanceof Error ? error.message : String(error) })
			if (error instanceof APIError) {
				throw error
			}
			throw new APIError(ErrCode.Internal, 'An unexpected error occurred')
		}
	}
)
