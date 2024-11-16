/* @refresh reload */
import { render } from 'solid-js/web'
import { Router } from '@solidjs/router'
import { AppRoutes } from './routes'

// Import global styles
import './styles/normalize.css'
import './styles/theme.css'
import './styles/global.css'

const root = document.getElementById('root')

if (root) {
	render(
		() => (
			<Router>
				<AppRoutes />
			</Router>
		),
		root
	)
} else {
	console.error('Root element not found')
}
