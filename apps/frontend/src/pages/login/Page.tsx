import { createSignal, onMount } from 'solid-js'
import type { Component } from 'solid-js'
import { A, useNavigate } from '@solidjs/router'
import styles from '@/pages/login/Login.module.css'
import { useAuth } from '@/hooks/useAuth'

const LoginPage: Component = () => {
	const [email, setEmail] = createSignal('')
	const [password, setPassword] = createSignal('')
	const [errorMessage, setErrorMessage] = createSignal('')
	const [isLoggingIn, setIsLoggingIn] = createSignal(false)
	const { login, isAuthenticated } = useAuth()
	const navigate = useNavigate()

	onMount(() => {
		if (isAuthenticated()) {
			console.log('User is already authenticated, redirecting to game')
			navigate('/game', { replace: true })
		}
	})

	const handleLogin = async (e: Event) => {
		e.preventDefault()
		console.log('Login attempt started')

		if (!email() || !password()) {
			console.log('Login failed: Email or password missing')
			setErrorMessage('Please enter both email and password')
			return
		}

		try {
			console.log('Attempting to login with:', email())
			setIsLoggingIn(true)

			// Here you would typically call your authentication service
			await new Promise((resolve) => setTimeout(resolve, 1500))

			console.log('Login successful, updating user store')
			login({
				username: email(),
				role: 'user',
				createdAt: new Date()
			})

			console.log('Login successful, user will be redirected by effect')

			navigate('/game', { replace: true })
		} catch (error) {
			console.error('Login failed:', error)
			setErrorMessage('Login failed. Please try again.')
		} finally {
			setIsLoggingIn(false)
		}
	}

	const handleSocialLogin = async (provider: string) => {
		console.log(`Attempting to login with ${provider}`)
		try {
			setIsLoggingIn(true)
			// Here you would typically call your social authentication service
			await new Promise((resolve) => setTimeout(resolve, 1500))

			login({
				username: `${provider}_user`,
				role: 'user',
				createdAt: new Date()
			})

			console.log(`${provider} login successful`)
		} catch (error) {
			console.error(`Login failed with ${provider}:`, error)
			setErrorMessage(`Login with ${provider} failed. Please try again.`)
		} finally {
			setIsLoggingIn(false)
		}
	}

	return (
		<main class={styles.login_container}>
			<div class={styles.background_overlay} aria-hidden="true" />
			<div class={styles.login_panel} aria-labelledby="login-title">
				<h1 id="login-title" class={styles.game_title}>
					Chronicles of Aetheria
				</h1>

				<form class={styles.login_form} onSubmit={handleLogin} novalidate>
					<div class={styles.input_group}>
						<label for="email" class={styles.sr_only}>
							Email
						</label>
						<input
							type="email"
							id="email"
							placeholder="Email"
							required
							aria-required="true"
							autocomplete="email"
							value={email()}
							onInput={(e) => {
								console.log('Email input changed:', e.currentTarget.value)
								setEmail(e.currentTarget.value)
							}}
							disabled={isLoggingIn()}
						/>
						<svg class={styles.input_icon} viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
							<path
								fill="currentColor"
								d="M20,4H4C2.9,4,2,4.9,2,6v12c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V6C22,4.9,21.1,4,20,4z M20,8l-8,5L4,8V6l8,5l8-5V8z"
							/>
						</svg>
					</div>
					<div class={styles.input_group}>
						<label for="password" class={styles.sr_only}>
							Password
						</label>
						<input
							type="password"
							id="password"
							placeholder="Password"
							required
							aria-required="true"
							autocomplete="current-password"
							value={password()}
							onInput={(e) => {
								console.log('Password input changed')
								setPassword(e.currentTarget.value)
							}}
							disabled={isLoggingIn()}
						/>
						<svg class={styles.input_icon} viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
							<path
								fill="currentColor"
								d="M18,8h-1V6c0-2.8-2.2-5-5-5S7,3.2,7,6v2H6c-1.1,0-2,0.9-2,2v10c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V10C20,8.9,19.1,8,18,8z M9,6c0-1.7,1.3-3,3-3s3,1.3,3,3v2H9V6z"
							/>
						</svg>
					</div>
					<div class={styles.forgot_password_error_container}>
						<A href="/forgot-password" class={styles.forgot_password} aria-label="Forgot your password?">
							Forgot Password?
						</A>
						<div id="errorMessage" class={styles.error_message} aria-live="polite">
							{errorMessage()}
						</div>
					</div>
					<button type="submit" class={styles.login_button} disabled={isLoggingIn()}>
						{isLoggingIn() ? 'Signing In...' : 'Sign In'}
					</button>
				</form>

				<div class={styles.divider}>
					<span>or continue with</span>
				</div>

				<div class={styles.social_buttons}>
					<button
						type="button"
						class={styles.social_button}
						onClick={() => handleSocialLogin('google')}
						aria-label="Sign in with Google"
						disabled={isLoggingIn()}
					>
						<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
							<path
								fill="currentColor"
								d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
							/>
						</svg>
						Google
					</button>
					<button
						type="button"
						class={styles.social_button}
						onClick={() => handleSocialLogin('github')}
						aria-label="Sign in with GitHub"
						disabled={isLoggingIn()}
					>
						<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
							<path
								fill="currentColor"
								d="M12,2A10,10,0,0,0,8.84,21.5c.5.08.66-.23.66-.5V19.31C6.73,19.91,6.14,18,6.14,18A2.69,2.69,0,0,0,5,16.5c-.91-.62.07-.6.07-.6a2.1,2.1,0,0,1,1.53,1,2.15,2.15,0,0,0,2.91.83,2.16,2.16,0,0,1,.63-1.34C8,16.17,5.62,15.31,5.62,11.5a3.87,3.87,0,0,1,1-2.71,3.58,3.58,0,0,1,.1-2.64s.84-.27,2.75,1a9.63,9.63,0,0,1,5,0c1.91-1.29,2.75-1,2.75-1a3.58,3.58,0,0,1,.1,2.64,3.87,3.87,0,0,1,1,2.71c0,3.82-2.34,4.66-4.57,4.91a2.39,2.39,0,0,1,.69,1.85V21c0,.27.16.59.67.5A10,10,0,0,0,12,2Z"
							/>
						</svg>
						GitHub
					</button>
				</div>

				<button
					type="button"
					class={styles.create_account_button}
					onClick={() => navigate('/register')}
					aria-label="Create new account"
				>
					Create Account
				</button>
			</div>

			<nav class={styles.footer} aria-label="Legal">
				<A href="/terms">Terms</A>
				<A href="/privacy">Privacy</A>
				<A href="/support">Support</A>
			</nav>
			<div class={styles.status_bar} aria-label="Game status">
				<span class={styles.version}>v0.1.0</span>
				<A href="/status" class={styles.server_status}>
					<span class={styles.status_indicator} aria-hidden="true" />
					<span>Servers Online</span>
				</A>
			</div>
		</main>
	)
}

export default LoginPage
