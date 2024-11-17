import { api } from 'encore.dev/api'
import { db } from '../db'
import { version } from '../../package.json'

interface HealthResponse {
	status: 'ok' | 'error'
	database: 'connected' | 'error'
	version: string
}

export const healthCheck = api<void, HealthResponse>(
	{
		method: 'GET',
		path: '/up',
		expose: true
	},
	async () => {
		try {
			// Test database connection
			await db.queryRow`SELECT 1`

			return {
				status: 'ok',
				database: 'connected',
				version: version
			}
		} catch (_error) {
			return {
				status: 'error',
				database: 'error',
				version: version
			}
		}
	}
)
