import type { Component } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import styles from './Unauthorized.module.css'

const UnauthorizedPage: Component = () => {
	const navigate = useNavigate()

	const handleHomeClick = () => {
		navigate('/')
	}

	return (
		<main class={styles.unauthorized_container}>
			<div class={styles.background_overlay} aria-hidden="true" />
			<div class={styles.unauthorized_panel}>
				<h1 class={styles.error_code} aria-label="Error 403">
					403
				</h1>
				<p class={styles.error_message}>Halt! You've encountered a magical barrier.</p>
				<p class={styles.error_description}>
					The arcane forces guarding this realm have deemed you unworthy to pass. Your current enchantments lack the power to
					breach this mystical defense.
				</p>
				<div class={styles.magic_barrier} aria-hidden="true">
					<div class={styles.magic_barrier_inner} />
					<svg
						class={styles.shield_icon}
						xmlns="http://www.w3.org/2000/svg"
						width="100"
						height="100"
						fill="none"
						viewBox="0 0 24 24"
					>
						<title>Magical Shield</title>
						<path stroke="currentColor" stroke-linecap="round" stroke-width="1.5" d="M12 8v4" />
						<circle cx="12" cy="15" r="1" fill="currentColor" />
						<path
							stroke="currentColor"
							stroke-linecap="round"
							stroke-width="1.5"
							d="M3 10.42c0-3.2 0-4.8.38-5.34S5.26 4.03 8.26 3l.58-.2C10.4 2.27 11.19 2 12 2s1.6.27 3.16.8l.58.2c3 1.03 4.5 1.54 4.88 2.08.38.54.38 2.14.38 5.34v1.57a9.3 9.3 0 0 1-2 5.91M3.2 14c.85 4.3 4.38 6.51 6.7 7.53.72.31 1.08.47 2.1.47s1.38-.16 2.1-.47c.58-.26 1.23-.58 1.9-1"
						/>
					</svg>
				</div>
				<p class={styles.error_description}>
					Fear not, brave adventurer! Return to familiar lands and seek the knowledge required to unlock this path.
				</p>
				<button class={styles.home_button} onClick={handleHomeClick} type="button">
					Return to the Kingdom
				</button>
			</div>
		</main>
	)
}

export default UnauthorizedPage
