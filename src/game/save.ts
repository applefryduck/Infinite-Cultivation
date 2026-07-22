import type { GameState } from './types'

const SAVE_KEY = 'infinite-cultivation-save-v1'
export const SAVE_VERSION = 1

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
    lastTick: now,
    createdAt: now,
    log: [
      {
        id: 1,
        time: now,
        text: '你睜開雙眼，靈台一片清明，踏上了漫漫修仙路。',
        kind: 'info',
      },
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
    // localStorage 不可用時忽略（無痕模式等）
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SaveShape
    if (!parsed || parsed.version !== SAVE_VERSION || !parsed.state) return null
    // 合併預設，避免舊存檔缺欄位
    return { ...createInitialState(), ...parsed.state }
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
