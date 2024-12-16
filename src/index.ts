import "./translations"

import {
	Entity,
	EntityManager,
	EventsSDK,
	GameRules,
	GameState,
	Miniboss,
	MinibossSpawner
} from "github.com/octarine-public/wrapper/index"

import { GUIHelper } from "./gui"
import { MenuManager } from "./menu"
import { TormentorSpawnerModel } from "./model/TormentorSpawner"

new (class TormentorESP {
	private readonly GUI = new GUIHelper()
	private readonly menu = new MenuManager()
	private Tormentors: Miniboss[] = []

	protected readonly TormentorSpawnerModel = new Map<
		MinibossSpawner,
		TormentorSpawnerModel
	>()

	constructor() {
		EventsSDK.on("Draw", this.onDraw.bind(this))
		EventsSDK.on("EntityCreated", this.OnEntityCreated.bind(this))
		EventsSDK.on("EntityDestroyed", this.OnEntityDestroyed.bind(this))
		EventsSDK.on("GameEvent", this.GameEvent.bind(this))
		EventsSDK.on("EntityVisibleChanged", this.onEntityVisibleChanged.bind(this))
		EventsSDK.on("Tick", this.onTick.bind(this))
	}

	private get State() {
		return this.menu.State.value
	}

	protected onEntityVisibleChanged(entity: Entity) {
		if (!this.isTormentor(entity)) {
			return
		}

		if (entity instanceof Miniboss) {
			if (this.Tormentors.includes(entity)) {
				return
			}

			this.Tormentors.push(entity)

			this.Tormentors.forEach(tormentor => {
				this.TormentorSpawnerModel.forEach(data => data.checkTormentor(tormentor))
			})
		}
	}

	protected onDraw() {
		if (!GameState.IsConnected || !this.State || !this.GUI.IsUIGame) {
			return
		}

		if (!this.GUI.IsReady || !this.GUI.IsGameInProgress) {
			return
		}

		this.TormentorSpawnerModel.forEach(data => data.OnDraw())
	}

	protected onTick(_dt: number): void {
		if (GameRules === undefined) {
			return
		}

		const spawners = [...this.TormentorSpawnerModel.values()]

		if (!GameState.IsConnected || !this.State || !this.GUI.IsUIGame) {
			return
		}

		for (let index = spawners.length - 1; index > -1; index--) {
			const spawnerData = spawners[index]

			spawnerData.SentNotification()
		}
	}

	protected GameEvent(eventName: string, obj: any) {
		if (eventName !== "entity_killed") {
			return
		}

		const entity = EntityManager.EntityByIndex(obj.entindex_killed)

		if (!(entity instanceof Miniboss)) {
			return
		}

		this.TormentorSpawnerModel.forEach(data => data.UpdateSpawnTime(entity))
	}

	private isTormentor(entity: Entity) {
		return entity instanceof Miniboss || entity instanceof MinibossSpawner
	}

	protected OnEntityCreated(entity: Entity) {
		if (entity instanceof Miniboss) {
			if (this.Tormentors.includes(entity)) {
				return
			}

			this.Tormentors.push(entity)
		}

		if (entity instanceof MinibossSpawner) {
			this.TormentorSpawnerModel.set(
				entity,
				new TormentorSpawnerModel(entity, this.menu, this.GUI)
			)

			this.Tormentors.forEach(tormentor => {
				this.TormentorSpawnerModel.forEach(data => data.checkTormentor(tormentor))
			})
		}
	}

	protected OnEntityDestroyed(entity: Entity) {
		if (entity instanceof Miniboss) {
			const index = this.Tormentors.findIndex(
				tormentor => tormentor.Index === entity.Index
			)
			if (index !== -1) {
				this.Tormentors.splice(index, 1)
			}

			this.TormentorSpawnerModel.forEach(data => data.onDestroyTormentor(entity))
		}

		if (entity instanceof MinibossSpawner) {
			this.TormentorSpawnerModel.delete(entity)
		}
	}
})()
