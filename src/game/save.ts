import type { GameState } from './types'
import { registerItem } from './content/items'

const SAVE_KEY = 'infinite-cultivation-save-v2'
export const SAVE_VERSION = 2

export function createInitialState(): GameState {
  const now = Date.now()
  return {
    qi: 0,
    spiritStones: 0,
    dao: 0,
    stageIndex: 0,
    maxStageIndex: 0,
    techniqueLevel: 0,
    spiritRootLevel: 0,
    reincarnations: 0,
    gatherXp: {},
    craftXp: {},
    pathXp: {},
    techMastery: {},
    recipeMastery: {},
    activePathId: 'lingxiu',
    activeTechId: 'lx_tuna',
    activeGatherId: undefined,
    discovered: {},
    discoveredItems: {},
    inventory: {},
    equipped: {},
    buffs: [],
    permaSpeedPct: 0,
    pendingBreakthroughPct: 0,
    combat: {
      mode: 'idle',
      waveIndex: 0,
      enemyHp: 0,
      playerHp: 100,
      cooldownUntil: 0,
    },
    lastTick: now,
    createdAt: now,
    log: [
      { id: 1, time: now, text: '你睜開雙眼，靈台一片清明，踏上了漫漫修仙路。', kind: 'info' },
    ],
  }
}

interface SaveShape {
  version: number
  state: GameState
}

export function saveGame(state: GameState): void {
  try {
    const payload: SaveShape = { version: SAVE_VERSION, state: { ...state, lastTick: Date.now() } }
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload))
  } catch {
    // ignore
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SaveShape
    if (!parsed || parsed.version !== SAVE_VERSION || !parsed.state) return null
    const state = { ...createInitialState(), ...parsed.state }
    // 重新登錄玩家發現的物品，讓 getItemDef 能查到
    for (const def of Object.values(state.discoveredItems ?? {})) registerItem(def)
    return state
  } catch {
    return null
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY)
  } catch {
    // ignore
  }
}
