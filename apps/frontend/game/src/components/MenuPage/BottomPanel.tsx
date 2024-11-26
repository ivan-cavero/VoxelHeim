import type { Component } from 'solid-js'
import styles from './BottomPanel.module.css'

import { FiPlay, FiRotateCcw } from 'solid-icons/fi'

interface BottomPanelProps {
	onPlay: () => void
	onToggleAnimation: () => void
	isRotating: boolean
}

const BottomPanel: Component<BottomPanelProps> = (props) => {
	return (
		<div class={styles.bottom_panel}>
			<div class={styles.left_buttons}>
				<span class={styles.game_version}>v0.1.0</span>
			</div>
			<button type="button" class={styles.play_btn} onClick={props.onPlay}>
				<FiPlay class={styles.icon} />
				Play
			</button>
			<div class={styles.right_buttons}>
				<button type="button" class={styles.bottom_btn} onClick={props.onToggleAnimation}>
					<FiRotateCcw class={styles.icon} />
					{props.isRotating ? 'Stop' : 'Rotate'}
				</button>
			</div>
		</div>
	)
}

export default BottomPanel
