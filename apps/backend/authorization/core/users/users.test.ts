import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getUsers, getUserById, updateUser } from './users'
import { db } from '../db'

describe('Users Service', () => {
	beforeEach(async () => {
		// Clean up the database before each test
		await db.exec`DELETE FROM users`
		await db.exec`DELETE FROM roles`
		await db.exec`DELETE FROM providers`

		// Insert necessary data
		await db.exec`INSERT INTO roles (name, priority) VALUES ('user', 1)`
		await db.exec`INSERT INTO providers (name) VALUES ('local')`

		// Insert test users
		await db.exec`
      INSERT INTO users (username, email, role_id, provider_id)
      VALUES
        ('user1', 'user1@example.com', (SELECT id FROM roles WHERE name = 'user'), (SELECT id FROM providers WHERE name = 'local')),
        ('user2', 'user2@example.com', (SELECT id FROM roles WHERE name = 'user'), (SELECT id FROM providers WHERE name = 'local'))
    `
	})

	afterEach(async () => {
		// Clean up the database after each test
		await db.exec`DELETE FROM users`
		await db.exec`DELETE FROM roles`
		await db.exec`DELETE FROM providers`
	})

	it('should get users', async () => {
		const result = await getUsers({ page: 1, limit: 10 })
		expect(result.users).toHaveLength(2)
		expect(result.total).toBe(2)
		expect(result.users[0].username).toBe('user1')
		expect(result.users[1].username).toBe('user2')
	})

	it('should get user by id', async () => {
		const users = await db.query`SELECT * FROM users`
		const user = await users.next()
		if (user.value) {
			const result = await getUserById({ userId: user.value.id })
			expect(result.username).toBe(user.value.username)
			expect(result.email).toBe(user.value.email)
		}
	})

	it('should update user', async () => {
		const users = await db.query`SELECT * FROM users`
		const user = await users.next()
		if (user.value) {
			const result = await updateUser({
				userId: user.value.id,
				updates: {
					username: 'updateduser',
					email: 'updated@example.com'
				}
			})

			expect(result.username).toBe('updateduser')
			expect(result.email).toBe('updated@example.com')

			const updatedUser = await db.queryRow`
      SELECT * FROM users WHERE id = ${user.value.id}
    `
			if (updatedUser) {
				expect(updatedUser.username).toBe('updateduser')
				expect(updatedUser.email).toBe('updated@example.com')
			}
		}
	})
})
