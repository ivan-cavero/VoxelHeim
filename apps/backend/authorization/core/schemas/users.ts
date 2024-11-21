import { pgTable, serial, uuid, varchar, timestamp } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
	id: serial('id').primaryKey(),
	uuid: uuid('uuid').defaultRandom().notNull().unique(),
	email: varchar('email', { length: 255 }).notNull().unique(),
	username: varchar('username', { length: 255 }).notNull(),
	password_hash: varchar('password_hash', { length: 255 }).notNull(),
	created_at: timestamp('created_at').defaultNow().notNull()
})
