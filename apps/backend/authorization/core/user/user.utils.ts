import type { Paginated } from './user.interface'
import crypto from 'node:crypto'

type PaginatedParams = {
	size: number
	page: number
	count: number
}

export const getOffset = (page: number, size: number): number => {
	return size * (page - 1)
}

export const paginatedData = (params: PaginatedParams): Paginated => {
	const response = {
		current: params.page,
		pageSize: params.size,
		totalPages: Math.ceil(params.count / params.size),
		count: params.count
	}
	return response
}

// Password hashing
export const hashPassword = (password: string): string => {
	const salt = crypto.randomBytes(16).toString('hex')
	const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
	return `${salt}:${hash}`
}

// Password verification
export const verifyPassword = (storedPassword: string, suppliedPassword: string): boolean => {
	const [salt, storedHash] = storedPassword.split(':')
	const hash = crypto.pbkdf2Sync(suppliedPassword, salt, 1000, 64, 'sha512').toString('hex')
	return storedHash === hash
}
