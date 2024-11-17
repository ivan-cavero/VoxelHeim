import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { register, login, requestPasswordReset, resetPassword, verifyEmail, oauthLogin } from './auth'
import { db } from '../db'
import { UserEmailTopic } from './auth'
import * as jose from 'jose'

// Mock external services
vi.mock('@node-rs/argon2', () => ({
	hash: vi.fn().mockResolvedValue('hashed_password'),
	verify: vi.fn().mockResolvedValue(true)
}))

vi.mock('jose', () => ({
	SignJWT: vi.fn().mockReturnValue({
		setProtectedHeader: vi.fn().mockReturnThis(),
		setIssuedAt: vi.fn().mockReturnThis(),
		setIssuer: vi.fn().mockReturnThis(),
		setAudience: vi.fn().mockReturnThis(),
		setExpirationTime: vi.fn().mockReturnThis(),
		setSubject: vi.fn().mockReturnThis(),
		sign: vi.fn().mockResolvedValue('mocked_token')
	}),
	jwtVerify: vi.fn().mockResolvedValue({ payload: { sub: '1' } })
}))

describe('Auth Service', () => {
	beforeEach(async () => {
		// Clean up the database before each test
		await db.exec`DELETE FROM users`
		await db.exec`DELETE FROM roles`
		await db.exec`DELETE FROM providers`

		// Insert necessary data
		await db.exec`INSERT INTO roles (name) VALUES ('user')`
		await db.exec`INSERT INTO providers (name) VALUES ('local')`

		// Reset mocks
		vi.clearAllMocks()
	})

	afterEach(async () => {
		// Clean up the database after each test
		await db.exec`DELETE FROM users`
		await db.exec`DELETE FROM roles`
		await db.exec`DELETE FROM providers`
	})

	it('should register a new user', async () => {
		vi.spyOn(UserEmailTopic, 'publish').mockResolvedValue('mocked_message_id')

		const result = await register({
			username: 'testuser',
			email: 'test@example.com',
			password: 'password123'
		})

		expect(result.user).toBeDefined()
		expect(result.user.username).toBe('testuser')
		expect(result.user.email).toBe('test@example.com')
		expect(result.token).toBeDefined()

		const dbUser = await db.queryRow`
      SELECT * FROM users WHERE email = ${'test@example.com'}
    `
		expect(dbUser).toBeDefined()
		if (dbUser) {
			expect(dbUser.username).toBe('testuser')
		}
		expect(UserEmailTopic.publish).toHaveBeenCalled()
	})

	it('should login a registered user', async () => {
		await register({
			username: 'testuser',
			email: 'test@example.com',
			password: 'password123'
		})

		await db.exec`UPDATE users SET email_verified = true WHERE email = ${'test@example.com'}`

		const result = await login({
			email: 'test@example.com',
			password: 'password123'
		})

		expect(result.user).toBeDefined()
		expect(result.user.email).toBe('test@example.com')
		expect(result.token).toBeDefined()
	})

	it('should request a password reset', async () => {
		vi.spyOn(UserEmailTopic, 'publish').mockResolvedValue('mocked_message_id')

		await register({
			username: 'testuser',
			email: 'test@example.com',
			password: 'password123'
		})

		const result = await requestPasswordReset({ email: 'test@example.com' })
		expect(result.success).toBe(true)
		expect(UserEmailTopic.publish).toHaveBeenCalled()

		const dbUser = await db.queryRow`
      SELECT * FROM users WHERE email = ${'test@example.com'}
    `
		if (dbUser) {
			expect(dbUser.password_reset_token).toBeDefined()
			expect(dbUser.password_reset_expires).toBeDefined()
		}
	})

	it('should reset password', async () => {
		await register({
			username: 'testuser',
			email: 'test@example.com',
			password: 'password123'
		})

		await requestPasswordReset({ email: 'test@example.com' })

		const dbUser = await db.queryRow`
      SELECT * FROM users WHERE email = ${'test@example.com'}
    `

		if (dbUser?.password_reset_token) {
			const result = await resetPassword({ token: dbUser.password_reset_token, newPassword: 'new_password123' })
			expect(result.success).toBe(true)

			const updatedUser = await db.queryRow`
        SELECT * FROM users WHERE email = ${'test@example.com'}
      `
			if (updatedUser) {
				expect(updatedUser.password_reset_token).toBeNull()
				expect(updatedUser.password_reset_expires).toBeNull()
			}
		}
	})

	it('should verify email', async () => {
		await register({
			username: 'testuser',
			email: 'test@example.com',
			password: 'password123'
		})

		const dbUser = await db.queryRow`
      SELECT * FROM users WHERE email = ${'test@example.com'}
    `

		if (dbUser?.email_verification_token) {
			const result = await verifyEmail({ token: dbUser.email_verification_token })
			expect(result.success).toBe(true)

			const verifiedUser = await db.queryRow`
        SELECT * FROM users WHERE email = ${'test@example.com'}
      `
			if (verifiedUser) {
				expect(verifiedUser.email_verified).toBe(true)
				expect(verifiedUser.email_verification_token).toBeNull()
			}
		}
	})

	it('should perform OAuth login', async () => {
		vi.mocked(jose.jwtVerify).mockResolvedValue({
			payload: { sub: '12345', email: 'oauth@example.com', name: 'OAuth User' },
			protectedHeader: { alg: 'HS256' },
			key: {} as jose.KeyLike
		} as jose.JWTVerifyResult & jose.ResolvedKey)

		const result = await oauthLogin({ provider: 'google', code: 'valid_code' })
		expect(result.user).toBeDefined()
		expect(result.user.email).toBe('oauth@example.com')
		expect(result.token).toBeDefined()

		const dbUser = await db.queryRow`
      SELECT * FROM users WHERE email = ${'oauth@example.com'}
    `
		if (dbUser) {
			expect(dbUser.username).toBe('OAuth User')
		}
	})
})
