import { defineConfig } from 'drizzle-kit'
export default defineConfig({
	out: 'migrations',
	schema: './schemas',
	dialect: 'postgresql'
})