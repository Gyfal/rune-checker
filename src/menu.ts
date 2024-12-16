import { ImageData, Menu } from "github.com/octarine-public/wrapper/index"

export class MenuManager {
	public readonly State: Menu.Toggle
	private readonly baseNode = Menu.AddEntry("Visual")

	private readonly tree = this.baseNode.AddNode(
		"Tormentor ESP",
		ImageData.GetSpellTexture("miniboss_unyielding_shield"),
		"Tormentor ESP"
	)
	public readonly DisableNotificatioTime: Menu.Slider
	public readonly MinimalNotificationTime: Menu.Slider
	protected readonly IPingMiniMap: Menu.Toggle

	constructor() {
		this.State = this.tree.AddToggle("State")

		this.IPingMiniMap = this.tree.AddToggle(
			"Ping_Minimap",
			false,
			"Tormentor_notif_tooltip"
		)

		this.MinimalNotificationTime = this.tree.AddSlider(
			"Tormentor_Before_Spawn_Timer",
			5,
			5,
			60,
			0,
			"Tormentor_Before_Spawn_Timer_Tooltip"
		)

		this.DisableNotificatioTime = this.tree.AddSlider(
			"Ping_Minimap_Turn_Off_By_Time",
			60,
			5,
			60,
			0,
			"Ping_Minimap_Turn_Off_By_Time_Tooltip"
		)

		this.IPingMiniMap.OnActivate(() => {
			this.DisableNotificatioTime.IsHidden = false
			this.MinimalNotificationTime.IsHidden = false
		})

		this.IPingMiniMap.OnDeactivate(() => {
			this.DisableNotificatioTime.IsHidden = true
			this.MinimalNotificationTime.IsHidden = true
		})
	}

	public get PingMiniMap() {
		return this.IPingMiniMap.value
	}
}
