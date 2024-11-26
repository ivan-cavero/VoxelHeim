import { createEffect, onMount, onCleanup } from 'solid-js'
import type { Component } from 'solid-js'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js'
import type { Character } from '@/stores/characterStore'

interface GameSceneProps {
	isRotating: boolean
	character: Character | null
}

const GameScene: Component<GameSceneProps> = (props) => {
	let containerRef: HTMLDivElement | undefined
	let scene: THREE.Scene
	let camera: THREE.PerspectiveCamera
	let renderer: THREE.WebGLRenderer
	let controls: OrbitControls
	let characterModel: THREE.Object3D | undefined
	let campingScene: THREE.Object3D | undefined
	let animationMixer: THREE.AnimationMixer | undefined
	let sceneAnimationMixer: THREE.AnimationMixer | undefined
	let lastTime = 0
	const frameInterval = 1000 / 60 // 60 FPS

	onMount(() => {
		initThreeJS()
		animate()
		window.addEventListener('resize', handleResize)
	})

	onCleanup(() => {
		window.removeEventListener('resize', handleResize)
		if (renderer) {
			renderer.dispose()
		}
		if (scene) {
			scene.clear()
		}
	})

	createEffect(() => {
		if (controls) {
			controls.autoRotate = props.isRotating
		}
	})

	createEffect(() => {
		if (props.character) {
			loadCharacterModel()
		}
	})

	const initThreeJS = () => {
		scene = new THREE.Scene()
		camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
		renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
		renderer.setSize(window.innerWidth, window.innerHeight)
		renderer.setClearColor(0x87ceeb)
		renderer.shadowMap.enabled = true
		renderer.shadowMap.type = THREE.PCFSoftShadowMap
		containerRef?.appendChild(renderer.domElement)

		setupLighting()
		setupControls()
		loadCampingScene()
	}

	const setupLighting = () => {
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
		scene.add(ambientLight)

		const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
		directionalLight.position.set(5, 5, 5)
		directionalLight.castShadow = true
		directionalLight.shadow.mapSize.width = 1024
		directionalLight.shadow.mapSize.height = 1024
		scene.add(directionalLight)

		const campfireLight = new THREE.PointLight(0xffd700, 0.5, 100)
		campfireLight.position.set(1.4, -1, 0.9)
		campfireLight.castShadow = true
		scene.add(campfireLight)
	}

	const setupControls = () => {
		controls = new OrbitControls(camera, renderer.domElement)
		controls.enableZoom = false
		controls.enablePan = false
		controls.enableDamping = true
		controls.dampingFactor = 0.05
		controls.autoRotate = props.isRotating
		controls.autoRotateSpeed = 0.5
		controls.minPolarAngle = Math.PI / 4
		controls.maxPolarAngle = Math.PI / 2
	}

	const loadCampingScene = async () => {
		try {
			const loader = new GLTFLoader()
			const gltf = await loader.loadAsync('/assets/scenes/camping_buscraft_ambience/scene.gltf')
			campingScene = gltf.scene
			campingScene.scale.set(0.5, 0.5, 0.5)
			campingScene.position.y = -1
			scene.add(campingScene)

			setupSceneAnimations(gltf)
		} catch (error) {
			console.error('Error loading camping scene:', error)
		}
	}

	const setupSceneAnimations = (gltf: GLTF) => {
		if (campingScene) {
			sceneAnimationMixer = new THREE.AnimationMixer(campingScene)
			gltf.animations.forEach((clip: THREE.AnimationClip) => {
				const action = sceneAnimationMixer?.clipAction(clip)
				action?.play()
			})
		}
	}

	const loadCharacterModel = async () => {
		try {
			if (characterModel) {
				scene.remove(characterModel)
			}

			const loader = new GLTFLoader()
			const gltf = await loader.loadAsync('/assets/characters/adventurers/Characters/gltf/Knight.glb')
			characterModel = gltf.scene
			setupCharacter(gltf)
			scene.add(characterModel)
			setupCamera()
		} catch (error) {
			console.error('Error loading character model:', error)
		}
	}

	const setupCharacter = (gltf: GLTF) => {
		if (characterModel) {
			characterModel.scale.set(0.4, 0.4, 0.4)
			characterModel.position.set(2, -1, 1.3)
			characterModel.rotation.y = Math.PI / 4

			characterModel.traverse((child) => {
				if ((child as THREE.Mesh).isMesh) {
					child.castShadow = true
					child.receiveShadow = true
				}
			})

			setupCharacterAnimations(gltf)
		}
	}

	const setupCharacterAnimations = (gltf: GLTF) => {
		if (characterModel) {
			animationMixer = new THREE.AnimationMixer(characterModel)
			const idleAnimation = gltf.animations.find((anim: THREE.AnimationClip) => anim.name === 'Idle')
			if (idleAnimation) {
				const action = animationMixer.clipAction(idleAnimation)
				action.play()
			}
		}
	}

	const setupCamera = () => {
		if (characterModel) {
			const distance = 3
			const height = 2
			const angle = Math.PI / 4

			const x = characterModel.position.x + distance * Math.sin(angle)
			const y = characterModel.position.y + height
			const z = characterModel.position.z + distance * Math.cos(angle)

			camera.position.set(x, y, z)
			camera.lookAt(characterModel.position)
			controls.target.copy(characterModel.position)
			controls.update()
		}
	}

	const animate = (currentTime = 0) => {
		requestAnimationFrame(animate)

		const deltaTime = currentTime - lastTime
		if (deltaTime < frameInterval) {
			return
		}

		lastTime = currentTime - (deltaTime % frameInterval)

		if (controls) {
			controls.update()
		}
		if (animationMixer) {
			animationMixer.update(frameInterval / 1000)
		}
		if (sceneAnimationMixer) {
			sceneAnimationMixer.update(frameInterval / 1000)
		}

		renderer.render(scene, camera)
	}

	const handleResize = () => {
		if (camera && renderer) {
			camera.aspect = window.innerWidth / window.innerHeight
			camera.updateProjectionMatrix()
			renderer.setSize(window.innerWidth, window.innerHeight)
		}
	}

	return <div ref={containerRef} />
}

export default GameScene
