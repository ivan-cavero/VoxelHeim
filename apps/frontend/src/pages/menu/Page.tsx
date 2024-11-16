import { onMount, createSignal } from 'solid-js'
import type { Component } from 'solid-js'
import styles from './MenuPage.module.css'
import CharacterList from '@/components/MenuPage/CharacterList'
import ServerStatus from '@/components/MenuPage/ServerStatus'
import CharacterInfo from '@/components/MenuPage/CharacterInfo'
import PatchNotes from '@/components/MenuPage/PatchNotes'
import BottomPanel from '@/components/MenuPage/BottomPanel'
import GameScene from '@/scenes/MenuPage/GameScene'
import { characterStore, initializeCharacterStore, selectCharacter, createCharacter, deleteCharacter } from '@/stores/characterStore'
import { userStore } from '@/stores/userStore'
import { FiServer } from 'solid-icons/fi'

const MenuPage: Component = () => {
	const [isRotating, setIsRotating] = createSignal(true)

	onMount(() => {
		initializeCharacterStore()
	})

	const handleSelectCharacter = (id: number) => {
		selectCharacter(id)
	}

	const handleCreateCharacter = () => {
		const newName = `Character ${characterStore.characters.length + 1}`
		const classes = ['Warrior', 'Mage', 'Rogue']
		const randomClass = classes[Math.floor(Math.random() * classes.length)]
		createCharacter(newName, randomClass)
	}

	const handleDeleteCharacter = (id: number) => {
		deleteCharacter(id)
	}

	const startGame = () => {
		if (characterStore.currentCharacter) {
			console.log(`Starting game with character: ${characterStore.currentCharacter.name}`)
		} else {
			console.log('Please select a character first')
		}
	}

	const toggleAnimation = () => {
		setIsRotating(!isRotating())
	}

	const showServerList = () => {
		console.log('Showing server list')
	}

	return (
		<main class={styles.menu_container}>
			<GameScene isRotating={isRotating()} character={characterStore.currentCharacter} />
			<div class={styles.overlay_content}>
				<div class={styles.menu_content}>
					<div class={styles.left_panel}>
						<CharacterList
							characters={characterStore.characters}
							maxSlots={4}
							onSelect={handleSelectCharacter}
							onCreate={handleCreateCharacter}
							onDelete={handleDeleteCharacter}
							isAdmin={userStore.role === 'admin'}
						/>
						<button type="button" class={styles.server_list_btn} onClick={showServerList}>
							<FiServer class={styles.icon} />
							Server List
						</button>
					</div>
					<div class={styles.right_panel}>
						<ServerStatus status="online" />
						<CharacterInfo character={characterStore.currentCharacter} />
						<PatchNotes />
					</div>
				</div>
				<BottomPanel onPlay={startGame} onToggleAnimation={toggleAnimation} isRotating={isRotating()} />
			</div>
		</main>
	)
}

export default MenuPage
