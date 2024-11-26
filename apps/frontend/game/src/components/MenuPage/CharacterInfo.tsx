import type { Component } from 'solid-js'
import styles from './CharacterInfo.module.css'
import type { Character } from '@/stores/characterStore'
import { FiUser } from 'solid-icons/fi'

interface CharacterInfoProps {
	character: Character | null
}

const CharacterInfo: Component<CharacterInfoProps> = (props) => {
	return (
		<div class={styles.info_panel}>
			<div class={styles.panel_header}>
				<FiUser class={styles.icon} />
				<span>Character Info</span>
			</div>
			{props.character ? (
				props.character.level !== null ? (
					<div class={styles.character_details}>
						<div class={styles.detail_item}>
							<span class={styles.label}>Guild</span>
							<span class={styles.value}>{props.character.class}</span>
						</div>
						<div class={styles.detail_item}>
							<span class={styles.label}>Gold</span>
							<span class={styles.value}>{props.character.gold}</span>
						</div>
					</div>
				) : (
					<div class={styles.no_character}>This slot is empty. Create a new character to see details.</div>
				)
			) : (
				<div class={styles.no_character}>No character selected</div>
			)}
		</div>
	)
}

export default CharacterInfo
