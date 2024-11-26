import type { Component } from 'solid-js'
import styles from './ServerStatus.module.css'

interface ServerStatusProps {
	status: 'online' | 'offline'
}

const ServerStatus: Component<ServerStatusProps> = (props) => {
	return (
		<div class={styles.server_status}>
			<div class={styles.panel_header}>
				<svg class={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
					<path d="M20 16V7a2 2 0 00-2-2H6a2 2 0 00-2 2v9m16 0H4m16 0l1.28 2.55a1 1 0 01-.9 1.45H3.62a1 1 0 01-.9-1.45L4 16" />
				</svg>
				Server Status
				<span class={`${styles.server_status_icon} ${styles[props.status]}`} aria-label={`Server ${props.status}`} />
			</div>
			<div class={styles.server_info}>
				<div class={styles.server_name}>Celestial Hills</div>
				<div class={styles.players_online}>Players Online: 1,234</div>
			</div>
		</div>
	)
}

export default ServerStatus
