// core/user/user.interface.ts
export interface UserDto {
	/** ID of the user */
	id: number
	/** UUID of the user */
	uuid: string
	/** Email of the user */
	email: string
	/** Username of the user (not unique, allows for tag system) */
	username: string
	/** Timestamp of when the user was created */
	created_at: Date
}

export interface CreateUserDto {
	/** Email of the user */
	email: string
	/** Username of the user */
	username: string
	/** Password of the user */
	password: string
}

export interface UpdateUserDto {
	/** Email of the user */
	email?: string
	/** Username of the user */
	username?: string
	/** Password of the user */
	password?: string
}

export interface Response {
	/** Indicates if the request was successful */
	success: boolean
	/** Error message if the request was not successful */
	message?: string
	/** The result of the request */
	result?: string | number
}

export interface Paginated {
	/** Total number of results */
	count: number
	/** Number of results per page */
	pageSize: number
	/** Total number of pages */
	totalPages: number
	/** Current page number */
	current: number
}

export interface UserResponse {
	/** Indicates if the request was successful */
	success: boolean
	/** Error message if the request was not successful */
	message?: string
	/** User data */
	result?: UserDto | UserDto[]
	/** Pagination data */
	pagination?: Paginated
}
