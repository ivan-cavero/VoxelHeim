import { createEffect, createSignal } from 'solid-js'
import type { Component } from 'solid-js'
import { userStore } from '@/stores/userStore'

const UserStatus: Component = () => {
	const [isOnline, setIsOnline] = createSignal(userStore.isOnline)

	createEffect(() => {
		setIsOnline(userStore.isOnline)
		console.log('User online status changed:', userStore.isOnline)
	})

	return <div>User is currently {isOnline() ? 'online' : 'offline'}</div>
}

export default UserStatus
