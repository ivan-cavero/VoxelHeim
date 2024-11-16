import { createStore } from 'solid-js/store'

// Define the ConnectionHistory type
type ConnectionHistory = {
	date: Date
	ip: string
	country: string
	city: string
	region: string
	isp: string
	org: string
	as: string
	connectionType: string
	speed: number
	latency: number
}

// Define the SecurityNotification type
type SecurityNotification = {
	id: number
	title: string
	description: string
	severity: 'info' | 'warning' | 'critical'
	date: Date
}

// Define the UserStore type
export type UserStore = {
	isAuthenticated: boolean
	isOnline: boolean
	region: string
	username: string
	role: string
	createdAt: Date | null
	lastLogin: Date | null
	twoFactorEnabled: boolean
	connectionHistory: ConnectionHistory[]
	securityNotifications: SecurityNotification[]
}

// Function to load the state from localStorage
const loadState = (): UserStore => {
	try {
		const serializedState = localStorage.getItem('userStore')
		if (serializedState === null) {
			return createInitialState()
		}
		return JSON.parse(serializedState, (key, value) => {
			if (key === 'createdAt' || key === 'lastLogin' || key === 'date') {
				return value ? new Date(value) : null
			}
			return value
		})
	} catch (err) {
		console.error('Error loading state:', err)
		return createInitialState()
	}
}

// Function to save the state to localStorage
const saveState = (state: UserStore) => {
	try {
		const serializedState = JSON.stringify(state)
		localStorage.setItem('userStore', serializedState)
	} catch (err) {
		console.error('Error saving state:', err)
	}
}

// Create the initial state
const createInitialState = (): UserStore => ({
	isAuthenticated: false,
	isOnline: false,
	region: '',
	username: '',
	role: '',
	createdAt: null,
	lastLogin: null,
	twoFactorEnabled: false,
	connectionHistory: [],
	securityNotifications: []
})

// Create and export the store
export const [userStore, setUserStore] = createStore<UserStore>(loadState())

// Helper functions to update the store
export const login = (userData: Partial<UserStore>) => {
	setUserStore((prev) => {
		const newState = {
			...prev,
			...userData,
			isAuthenticated: true,
			isOnline: true,
			lastLogin: new Date()
		}
		saveState(newState)
		return newState
	})
}

export const logout = () => {
	console.log('Logging out, resetting user store')
	const initialState = createInitialState()
	setUserStore(initialState)
	saveState(initialState)
	console.log('User store reset:', userStore)
}

export const updateUserData = (data: Partial<UserStore>) => {
	console.log('Updating user data:', data)
	setUserStore((prev) => {
		const newState = { ...prev, ...data }
		saveState(newState)
		return newState
	})
	console.log('Updated user store:', userStore)
}

export const addConnectionHistory = (connection: ConnectionHistory) => {
	console.log('Adding connection history:', connection)
	setUserStore('connectionHistory', (prev) => {
		const newHistory = [...prev, connection]
		saveState({ ...userStore, connectionHistory: newHistory })
		return newHistory
	})
	console.log('Updated connection history:', userStore.connectionHistory)
}

export const addSecurityNotification = (notification: SecurityNotification) => {
	console.log('Adding security notification:', notification)
	setUserStore('securityNotifications', (prev) => {
		const newNotifications = [...prev, notification]
		saveState({ ...userStore, securityNotifications: newNotifications })
		return newNotifications
	})
	console.log('Updated security notifications:', userStore.securityNotifications)
}
