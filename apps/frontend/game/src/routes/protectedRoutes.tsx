import type { Component } from 'solid-js'
import { createMemo } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute(WrappedComponent: Component, allowedRoles: string[]) {
	return (props: Record<string, unknown>) => {
		const { user, isAuthenticated } = useAuth()
		const navigate = useNavigate()

		const hasPermission = createMemo(() => {
			const currentUser = user()
			return isAuthenticated() && currentUser && allowedRoles.includes(currentUser.role)
		})

		if (!hasPermission()) {
			navigate('/login')
			return <div>Redirecting to login...</div>
		}

		return <WrappedComponent {...props} />
	}
}
