import { For } from 'solid-js'
import type { Component } from 'solid-js'
import styles from './CharacterList.module.css'
import type { Character } from '@/stores/characterStore'
import { FiPlus, FiTrash2 } from 'solid-icons/fi'

interface CharacterListProps {
	characters: Character[]
	maxSlots: number
	onSelect: (id: number) => void
	onCreate: () => void
	onDelete: (id: number) => void
	isAdmin: boolean
}

const CharacterList: Component<CharacterListProps> = (props) => {
	const handleKeyDown = (event: KeyboardEvent, id: number) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault()
			handleSelect(id)
		}
	}

	const handleSelect = (id: number) => {
		const character = props.characters.find((char) => char.id === id)
		if (character && !character.isSelected) {
			props.onSelect(id)
		}
	}

	const renderCharacterContent = (character: Character | null) => {
		if (!character) {
			return (
				<div class={styles.empty_content}>
					<span class={styles.empty_name}>Empty Slot</span>
				</div>
			)
		}

		return (
			<>
				<div class={styles.character_header}>
					<span class={styles.character_level}>Lv {character.level}</span>
				</div>
				<span class={styles.character_name}>{character.name}</span>
				<span class={styles.character_class}>{character.class}</span>
			</>
		)
	}

	return (
		<div class={styles.character_list}>
			<For each={Array(props.maxSlots)}>
				{(_, index) => {
					const character = () => props.characters[index()] || null
					const isSelected = () => character()?.isSelected || false
					const isEmpty = () => !character()

					return (
						<button
							type="button"
							class={`${styles.character_slot} ${isSelected() ? styles.selected : ''} ${isEmpty() ? styles.empty : ''}`}
							onClick={() => {
								const char = character()
								if (char) {
									handleSelect(char.id)
								}
							}}
							onKeyDown={(e) => {
								const char = character()
								if (char) {
									handleKeyDown(e, char.id)
								}
							}}
							disabled={isEmpty()}
							aria-disabled={isEmpty()}
						>
							<div class={styles.slot_content}>
								<div class={styles.character_preview}>
									{!isEmpty() && character() && (
										<img
											src={`/assets/characters/${character()?.class.toLowerCase()}.png`}
											alt={`${character()?.name} preview`}
											loading="lazy"
										/>
									)}
								</div>
								<div class={styles.character_info}>{renderCharacterContent(character())}</div>
							</div>
						</button>
					)
				}}
			</For>
			<div class={styles.character_actions}>
				<button
					type="button"
					class={`${styles.action_btn} ${styles.new_character}`}
					onClick={props.onCreate}
					disabled={props.characters.length >= props.maxSlots}
				>
					<FiPlus class={styles.icon} />
					<span class={styles.btn_text}>New Character</span>
				</button>
				<button
					type="button"
					class={`${styles.action_btn} ${styles.delete_character}`}
					onClick={() => {
						const selectedCharacter = props.characters.find((char) => char.isSelected)
						if (selectedCharacter) {
							props.onDelete(selectedCharacter.id)
						}
					}}
					disabled={!props.characters.some((char) => char.isSelected) || props.characters.length <= 1}
				>
					<FiTrash2 class={styles.icon} />
					<span class={styles.btn_text}>Delete</span>
				</button>
			</div>
		</div>
	)
}

export default CharacterList
