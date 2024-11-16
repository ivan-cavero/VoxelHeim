import { api } from 'encore.dev/api'
import { SQLDatabase } from 'encore.dev/storage/sqldb'
import log from 'encore.dev/log'

const db = new SQLDatabase('auth', {
	migrations: './migrations'
})

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

interface GetUsersResponse {
	users: User[]
}

export const getUsers = api<void, GetUsersResponse>(
	{
		method: 'GET',
		path: '/users',
		expose: true
	},
	async () => {
		try {
			log.info('Fetching all users')
			const usersQuery = db.query<User>`
                SELECT id, uuid, username, email, role_id, two_factor_enabled,
                       last_login, is_online, provider_id, created_at, updated_at
                FROM users
            `

			log.info('Executing query', usersQuery)

			const users: User[] = []
			for await (const user of usersQuery) {
				users.push(user)
			}

			log.info(`Retrieved ${users.length} users`)

			return { users }
		} catch (error) {
			log.error('Error fetching users', { error: error instanceof Error ? error.message : String(error) })
			throw new Error('Failed to fetch users')
		}
	}
)
