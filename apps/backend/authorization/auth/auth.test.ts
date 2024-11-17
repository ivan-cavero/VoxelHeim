import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { register, login, logout } from './auth'
import { db } from './db'

describe('Auth Service', () => {
	let userId: number

	it('should register a new user', async () => {
		const result = await register({
			username: 'testuser',
			email: 'test@example.com',
			password: 'password123'
		})

		expect(result.user).toBeDefined()
		expect(result.user.username).toBe('testuser')
		expect(result.user.email).toBe('test@example.com')
		expect(result.token).toBeDefined()

		userId = result.user.id
	})

	it('should not register a user with existing username or email', async () => {
		await expect(
			register({
				username: 'testuser',
				email: 'another@example.com',
				password: 'password123'
			})
		).rejects.toThrow('Username or email already exists')

		await expect(
			register({
				username: 'anotheruser',
				email: 'test@example.com',
				password: 'password123'
			})
		).rejects.toThrow('Username or email already exists')
	})

	it('should login a registered user', async () => {
		const result = await login({
			email: 'test@example.com',
			password: 'password123'
		})

		expect(result.user).toBeDefined()
		expect(result.user.email).toBe('test@example.com')
		expect(result.token).toBeDefined()
	})

	it('should not login with incorrect credentials', async () => {
		await expect(
			login({
				email: 'test@example.com',
				password: 'wrongpassword'
			})
		).rejects.toThrow('Invalid email or password')

		await expect(
			login({
				email: 'nonexistent@example.com',
				password: 'password123'
			})
		).rejects.toThrow('Invalid email or password')
	})

	it('should logout a user', async () => {
		const previousLastLogin = await db.queryRow<{ last_login: string | null }>`
            SELECT last_login
            FROM users
            WHERE id = ${userId}
        `

		const result = await logout({ userId })

		expect(result.success).toBe(true)

		const user = await db.queryRow<{ last_login: string | null }>`
            SELECT last_login
            FROM users
            WHERE id = ${userId}
        `

		expect(user).not.toBeNull()
		if (user) {
			expect(user.last_login).not.toBeNull()
			expect(user.last_login).not.toBe(previousLastLogin?.last_login)
		} else {
			throw new Error('User not found after logout')
		}
	})

	it('should not logout a non-existent user', async () => {
		await expect(logout({ userId: 9999 })).rejects.toThrow('User not found')
	})
})
