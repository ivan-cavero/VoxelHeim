import { describe, it, expect, vi } from 'vitest'
import { healthCheck } from './health'
import { db } from '../db'

describe('Health Service', () => {
	it('should return ok status when database is connected', async () => {
		const result = await healthCheck()
		expect(result).toEqual({
			status: 'ok',
			database: 'connected',
			version: expect.any(String)
		})
	})

	it('should return error status when database connection fails', async () => {
		// Temporarily break the database connection
		const originalQuery = db.queryRow
		db.queryRow = vi.fn().mockRejectedValueOnce(new Error('Database connection error'))

		const result = await healthCheck()
		expect(result).toEqual({
			status: 'error',
			database: 'error',
			version: expect.any(String)
		})

		// Restore the original query function
		db.queryRow = originalQuery
	})
})
