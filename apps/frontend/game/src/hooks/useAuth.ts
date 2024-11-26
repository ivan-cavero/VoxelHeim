import { createEffect } from 'solid-js'
import { userStore, login as loginAction, logout as logoutAction } from '../stores/userStore'

export function useAuth() {
	createEffect(() => {
		console.log('Auth state changed:', userStore.isAuthenticated)
	})

	return {
		user: () => userStore,
		isAuthenticated: () => userStore.isAuthenticated,
		login: loginAction,
		logout: logoutAction
	}
}
