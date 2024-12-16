import {
	Color,
	DOTAGameMode,
	DOTAGameState,
	GameRules,
	GameSleeper,
	GameState,
	GUIInfo,
	MathSDK,
	Miniboss,
	MinibossSpawner,
	MinimapSDK,
	Rectangle,
	RendererSDK,
	SoundSDK,
	Vector2
} from "github.com/octarine-public/wrapper/index"

import { GUIHelper } from "../gui"
import { MenuManager } from "../menu"

export class TormentorSpawnerModel {
	public LastSpawnTime = -1
	public NextSpawnTime = 0
	public SpawnTime = 0
	public SpawnOnce = false
	public Tormentor: Nullable<Miniboss>
	protected readonly Sleeper = new GameSleeper()
	private readonly BlipTime = 5 // sec

	private readonly distTormenot = 250

	constructor(
		public readonly Spawner: MinibossSpawner,
		public readonly menu: MenuManager,
		public readonly GUI: GUIHelper
	) {
		this.Spawner = Spawner

		this.NextSpawnTime = this.FirstSpawn
		this.SpawnTime = this.NextSpawn
	}

	public get IsValid() {
		return this.Spawner.IsValid
	}

	public get Position() {
		return this.Spawner.Position
	}

	public get FirstSpawn() {
		let spawnTime = 20 * 60
		if (GameRules?.GameMode === DOTAGameMode.DOTA_GAMEMODE_TURBO) {
			spawnTime = spawnTime / 2
		}
		return spawnTime
	}

	public get NextSpawn() {
		let spawnTime = 10 * 60
		if (GameRules?.GameMode === DOTAGameMode.DOTA_GAMEMODE_TURBO) {
			spawnTime = spawnTime / 2
		}
		return spawnTime
	}

	public get ModuleTime() {
		return Math.max(this.GameTime % this.MaxDuration("seconds"), 0)
	}

	public get Remaining() {
		return Math.round(Math.max(this.NextSpawnTime - this.GameTime, 0))
	}

	protected get SpawnerKey() {
		return `${this.Spawner.Handle}_${this.Spawner.Name}`
	}

	public SentNotification() {
		const menu = this.menu
		const time = menu.DisableNotificatioTime.value
		const isDisableTime = time === 0 || (GameState.RawGameTime - 95) / 60 <= time

		const state = menu.State && menu.PingMiniMap
		if (!state || !isDisableTime || this.Sleeper.Sleeping(this.SpawnerKey)) {
			return
		}

		const remaining = this.Remaining

		if (remaining > menu.MinimalNotificationTime.value || this.IsTormentorAlive) {
			return
		}

		SoundSDK.EmitStartSoundEvent("General.Ping")
		MinimapSDK.DrawPing(
			this.Position,
			Color.White,
			GameState.RawGameTime + this.BlipTime,
			this.SpawnerKey
		)

		this.Sleeper.Sleep(
			menu.MinimalNotificationTime.value * 1000 + 1000,
			this.SpawnerKey
		)
	}

	public OnDraw() {
		if (GameRules === undefined) {
			return
		}

		if (!this.Spawner.IsValid) {
			return
		}

		const w2s = RendererSDK.WorldToScreen(this.Position)
		if (w2s === undefined) {
			return
		}

		if (this.IsTormentorAlive) {
			return
		}

		const time = this.Remaining

		let strTime = time.toString()
		if (time > 60) {
			strTime = MathSDK.FormatTime(time)
		}

		const size = new Vector2(GUIInfo.ScaleWidth(24), GUIInfo.ScaleHeight(24))
		const screenPos = w2s.Subtract(size.DivideScalar(2)).SubtractScalarY(-20)
		const recPos = new Rectangle(screenPos, screenPos.Add(size))

		const text = strTime

		RendererSDK.TextByFlags(text, recPos, Color.White, 0)
	}

	protected get GameTime() {
		if (GameRules === undefined) {
			return 0
		}
		const gameTime = GameRules.GameTime
		switch (GameRules.GameState) {
			case DOTAGameState.DOTA_GAMERULES_STATE_GAME_IN_PROGRESS:
				return gameTime
			default:
				return gameTime
		}
	}

	protected get SpawnsTime(): [number, number] {
		if (GameRules === undefined) {
			return [0, 0]
		}

		let lastSpawnTime = this.LastSpawnTime
		let nextSpawnTime = this.NextSpawnTime

		if (lastSpawnTime < 0) {
			lastSpawnTime = this.NextSpawnTime
		}

		if (nextSpawnTime < 0) {
			nextSpawnTime = lastSpawnTime + this.SpawnTime
		}

		return [lastSpawnTime, nextSpawnTime]
	}

	protected MaxDuration(timeType: "seconds" | "minutes" = "minutes"): number {
		const [lastSpawnTime, nextSpawnTime] = this.SpawnsTime
		const timeFormat = timeType === "seconds" ? 1 : 60
		return Math.max((nextSpawnTime - lastSpawnTime) / timeFormat, 0)
	}

	private checkPosition(tormentor: Miniboss) {
		return (
			this.Position.Equals(tormentor.Position) ||
			this.Position.Distance2D(tormentor.Position) <= this.distTormenot
		)
	}

	public checkTormentor(tormentor: Miniboss) {
		if (this.Tormentor !== undefined && this.Tormentor.IsValid) {
			return false
		}

		if (!this.checkPosition(tormentor)) {
			return false
		}

		this.Tormentor = tormentor
	}

	public UpdateSpawnTime(tormentor: Miniboss) {
		if (!this.checkPosition(tormentor)) {
			return false
		}

		const currentTime = this.GameTime
		this.LastSpawnTime = currentTime
		this.NextSpawnTime = currentTime + this.SpawnTime
	}

	public onDestroyTormentor(tormentor: Miniboss) {
		if (this.Tormentor !== tormentor) {
			return
		}

		this.Tormentor = undefined
	}

	public get IsTormentorAlive(): boolean {
		if (this.Tormentor !== undefined && this.Tormentor.IsValid) {
			return this.Tormentor.IsAlive
		}

		return this.GameTime >= this.NextSpawnTime
	}
}
