import { createStore, produce } from 'solid-js/store'
import { userStore } from './userStore'

export interface Character {
	id: number
	level: number
	name: string
	class: string
	isSelected: boolean
	xp: number
	xpToNextLevel: number
	health: number
	maxHealth: number
	mana: number
	maxMana: number
	gold: number
	modelUrl: string
}

interface CharacterStoreState {
	characters: Character[]
	currentCharacter: Character | null
	maxSlots: number
}

const [characterStore, setCharacterStore] = createStore<CharacterStoreState>({
	characters: [],
	currentCharacter: null,
	maxSlots: 4
})

const saveToLocalStorage = () => {
	localStorage.setItem('characters', JSON.stringify(characterStore.characters))
	localStorage.setItem('currentCharacter', JSON.stringify(characterStore.currentCharacter))
}

const loadFromLocalStorage = () => {
	const savedCharacters = localStorage.getItem('characters')
	const savedCurrentCharacter = localStorage.getItem('currentCharacter')

	if (savedCharacters) {
		setCharacterStore('characters', JSON.parse(savedCharacters))
	}
	if (savedCurrentCharacter) {
		setCharacterStore('currentCharacter', JSON.parse(savedCurrentCharacter))
	}
}

const fetchCharactersFromBackend = async () => {
	// Simulating a backend API call
	await new Promise((resolve) => setTimeout(resolve, 1000))

	const defaultCharacters: Character[] = [
		{
			id: 1,
			level: 1,
			name: 'Default Character',
			class: 'Warrior',
			isSelected: true,
			xp: 0,
			xpToNextLevel: 1000,
			health: 100,
			maxHealth: 100,
			mana: 50,
			maxMana: 50,
			gold: 100,
			modelUrl: '/assets/characters/warrior.glb'
		}
	]

	return defaultCharacters
}

export const initializeCharacterStore = async () => {
	loadFromLocalStorage()

	if (characterStore.characters.length === 0) {
		const characters = await fetchCharactersFromBackend()
		setCharacterStore(
			produce((state) => {
				state.characters = characters
				state.currentCharacter = characters[0]
			})
		)
		saveToLocalStorage()
	} else if (!characterStore.currentCharacter) {
		const lastPlayedCharacter = characterStore.characters.find((char) => char.isSelected) || characterStore.characters[0]
		setCharacterStore('currentCharacter', lastPlayedCharacter)
		saveToLocalStorage()
	}

	updateMaxSlots()
}

const updateMaxSlots = () => {
	let maxSlots = 4
	if (userStore.role === 'admin') {
		maxSlots = 8
	} else if (userStore.role === 'premium') {
		maxSlots = 6
	}
	setCharacterStore('maxSlots', maxSlots)
}

export const selectCharacter = (id: number) => {
	setCharacterStore(
		produce((state) => {
			state.characters = state.characters.map((char) => ({
				...char,
				isSelected: char.id === id
			}))
			state.currentCharacter = state.characters.find((char) => char.id === id) || null
		})
	)
	saveToLocalStorage()
}

export const createCharacter = (name: string, characterClass: string) => {
	if (characterStore.characters.length >= characterStore.maxSlots) {
		console.error('Maximum character slots reached')
		return
	}

	const newId = Math.max(...characterStore.characters.map((char) => char.id), 0) + 1
	const newCharacter: Character = {
		id: newId,
		level: 1,
		name,
		class: characterClass,
		isSelected: false,
		xp: 0,
		xpToNextLevel: 1000,
		health: 100,
		maxHealth: 100,
		mana: 50,
		maxMana: 50,
		gold: 0,
		modelUrl: `/assets/characters/${characterClass.toLowerCase()}.glb`
	}
	setCharacterStore(
		produce((state) => {
			state.characters.push(newCharacter)
		})
	)
	saveToLocalStorage()
}

export const deleteCharacter = (id: number) => {
	setCharacterStore(
		produce((state) => {
			state.characters = state.characters.filter((char) => char.id !== id)
			if (state.currentCharacter?.id === id) {
				state.currentCharacter = state.characters[0] || null
			}
		})
	)
	saveToLocalStorage()
}

export { characterStore }
