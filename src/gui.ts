import {
	DOTAGameState,
	DOTAGameUIState,
	GameRules,
	GameState,
	GUIInfo
} from "github.com/octarine-public/wrapper/index"

export class GUIHelper {
	public get IsReady() {
		return GUIInfo !== undefined && GUIInfo.TopBar !== undefined
	}

	public get IsGameInProgress() {
		return this.gameState === DOTAGameState.DOTA_GAMERULES_STATE_GAME_IN_PROGRESS
	}

	public get IsPostGame() {
		return this.gameState === DOTAGameState.DOTA_GAMERULES_STATE_POST_GAME
	}

	public get IsUIGame() {
		return GameState.UIState === DOTAGameUIState.DOTA_GAME_UI_DOTA_INGAME
	}

	private get gameState() {
		return GameRules?.GameState ?? DOTAGameState.DOTA_GAMERULES_STATE_INIT
	}
}
