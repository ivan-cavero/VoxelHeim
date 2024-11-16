import { lazy, createEffect } from 'solid-js'
import type { Component } from 'solid-js'
import { Route, Navigate, useNavigate } from '@solidjs/router'
import { useAuth } from '@/hooks/useAuth'

const LoginPage = lazy(() => import('@/pages/login/Page'))
const Register = lazy(() => import('@/pages/Register'))
const Game = lazy(() => import('@/pages/Game'))
const Menu = lazy(() => import('@/pages/menu/Page'))
const Admin = lazy(() => import('@/pages/Admin'))
const UnauthorizedPage = lazy(() => import('@/pages/unauthorized/Page'))

const ProtectedRoute: Component<{ component: Component; roles?: string[] }> = (props) => {
	const { user, isAuthenticated } = useAuth()
	const navigate = useNavigate()

	createEffect(() => {
		console.log('ProtectedRoute - Auth status:', { isAuthenticated: isAuthenticated(), user: user() })
		if (!isAuthenticated()) {
			console.log('User not authenticated, redirecting to login')
			navigate('/login', { replace: true })
		} else if (props.roles && (!user().role || !props.roles.includes(user().role))) {
			console.log('User lacks required role, redirecting to unauthorized')
			navigate('/unauthorized', { replace: true })
		}
	})

	return <props.component />
}

const AuthRedirect: Component = () => {
	const { isAuthenticated } = useAuth()
	const navigate = useNavigate()

	createEffect(() => {
		console.log('AuthRedirect - Auth status:', isAuthenticated())
		if (isAuthenticated()) {
			navigate('/menu', { replace: true })
		} else {
			navigate('/login', { replace: true })
		}
	})

	return null
}

export function AppRoutes() {
	return (
		<>
			<Route path="/" component={AuthRedirect} />
			<Route path="/login" component={LoginPage} />
			<Route path="/register" component={Register} />
			<Route path="/menu" component={() => <ProtectedRoute component={Menu} />} />
			<Route path="/game" component={() => <ProtectedRoute component={Game} roles={['user']} />} />
			<Route path="/admin" component={() => <ProtectedRoute component={Admin} roles={['admin']} />} />
			<Route path="/unauthorized" component={UnauthorizedPage} />
			<Route path="*" component={() => <Navigate href="/" />} />
		</>
	)
}
