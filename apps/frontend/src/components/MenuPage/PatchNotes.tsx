import type { Component } from 'solid-js'
import styles from './PatchNotes.module.css'

const PatchNotes: Component = () => {
	return (
		<div class={styles.patch_notes}>
			<div class={styles.panel_header}>
				<svg class={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
					<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
					<path d="M14 2v6h6" />
					<line x1="16" y1="13" x2="8" y2="13" />
					<line x1="16" y1="17" x2="8" y2="17" />
					<line x1="10" y1="9" x2="8" y2="9" />
				</svg>
				Latest Updates
			</div>
			<div class={styles.patch_content}>
				<div class={styles.patch_version}>
					<h4>Version 1.2.0</h4>
					<ul>
						<li>New dungeon: The Crystal Caverns</li>
						<li>Level cap increased to 60</li>
						<li>New class abilities unlocked</li>
						<li>Performance improvements</li>
					</ul>
				</div>
			</div>
		</div>
	)
}

export default PatchNotes
