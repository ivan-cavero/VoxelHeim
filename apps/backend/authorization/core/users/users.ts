import { api, APIError, ErrCode } from 'encore.dev/api'
import log from 'encore.dev/log'
import { db } from '../db'

interface User {
	id: number
	uuid: string
	username: string
	email: string
	email_verified: boolean
	email_verification_token: string | null
	role_id: number
	two_factor_enabled: boolean
	last_login: string | null
	is_online: boolean
	provider_id: number
	created_at: string
	updated_at: string
}

interface GetUsersParams {
	page?: number
	limit?: number
}

interface UpdateUserParams {
	userId: number
	updates: Partial<User>
}

export const getUsers = api<GetUsersParams, { users: User[]; total: number }>(
	{
		method: 'GET',
		path: '/users',
		expose: false
	},
	async ({ page = 1, limit = 100 }) => {
		try {
			const offset = (page - 1) * limit

			log.info('Fetching users', { page, limit, offset })

			const usersResult = await db.query<User>`
				SELECT id, uuid, username, email, email_verified, email_verification_token, role_id, two_factor_enabled, last_login, provider_id, created_at, updated_at
				FROM users
				WHERE deleted_at IS NULL
				ORDER BY created_at DESC
				LIMIT ${limit} OFFSET ${offset}
			`

			const users: User[] = []
			for await (const user of usersResult) {
				users.push(user)
			}

			const countResult = db.query<{ count: string }>`
				SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL
			`

			let total = 0
			for await (const row of countResult) {
				total = Number.parseInt(row.count, 10)
				break
			}

			log.info('Users fetched', { userCount: usersResult })

			return { users, total }
		} catch (error) {
			log.error('Error fetching users', { error: error instanceof Error ? error.message : String(error) })
			throw new APIError(ErrCode.Internal, 'An unexpected error occurred while fetching users')
		}
	}
)

export const getUserById = api<{ userId: number }, User>(
	{
		method: 'GET',
		path: '/users/:userId',
		expose: false
	},
	async ({ userId }) => {
		try {
			const userResult = await db.query<User>`
				SELECT id, uuid, username, email, email_verified, email_verification_token, role_id, two_factor_enabled, last_login, provider_id, created_at, updated_at
				FROM users
				WHERE id = ${userId} AND deleted_at IS NULL
			`

			let user: User | null = null
			for await (const row of userResult) {
				user = row
				break
			}

			if (!user) {
				throw new APIError(ErrCode.NotFound, 'User not found')
			}

			return user
		} catch (error) {
			log.error('Error fetching user', { userId, error: error instanceof Error ? error.message : String(error) })
			if (error instanceof APIError) {
				throw error
			}
			throw new APIError(ErrCode.Internal, 'An unexpected error occurred while fetching the user')
		}
	}
)

export const updateUser = api<UpdateUserParams, User>(
	{
		method: 'PUT',
		path: '/users/:userId',
		expose: false
	},
	async ({ userId, updates }) => {
		try {
			const updateFields: string[] = []
			const values: unknown[] = []

			Object.entries(updates).forEach(([key, value]) => {
				if (value !== undefined) {
					updateFields.push(`${key} = ?`)
					values.push(value)
				}
			})

			if (updateFields.length === 0) {
				throw new APIError(ErrCode.InvalidArgument, 'No valid fields to update')
			}

			values.push(userId)

			const updatedUserResult = await db.query<User>`
				UPDATE users
				SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
				WHERE id = ? AND deleted_at IS NULL
				RETURNING id, uuid, username, email, role_id, two_factor_enabled, last_login, provider_id, created_at, updated_at
			`

			let updatedUser: User | null = null
			for await (const row of updatedUserResult) {
				updatedUser = row
				break
			}

			if (!updatedUser) {
				throw new APIError(ErrCode.NotFound, 'User not found')
			}

			return updatedUser
		} catch (error) {
			log.error('Error updating user', { userId, error: error instanceof Error ? error.message : String(error) })
			if (error instanceof APIError) {
				throw error
			}
			throw new APIError(ErrCode.Internal, 'An unexpected error occurred while updating the user')
		}
	}
)
