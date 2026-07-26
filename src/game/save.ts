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
    materialChoice: {},
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

// ---- 匯出 / 匯入存檔 ----

/** UTF-8 安全的 base64 編碼（存檔含中文） */
function toBase64(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary)
}

function fromBase64(b64: string): string {
  const binary = atob(b64.trim())
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/** 匯出成一段可複製/存檔的代碼字串 */
export function exportSave(state: GameState): string {
  const payload: SaveShape = { version: SAVE_VERSION, state: { ...state, lastTick: Date.now() } }
  return toBase64(JSON.stringify(payload))
}

export interface ImportResult {
  ok: boolean
  state?: GameState
  error?: string
}

/** 從代碼字串還原存檔，含格式與版本檢查 */
export function importSave(code: string): ImportResult {
  const trimmed = code.trim()
  if (!trimmed) return { ok: false, error: '存檔代碼是空的。' }

  let json: string
  try {
    // 相容直接貼上 JSON 的情況
    json = trimmed.startsWith('{') ? trimmed : fromBase64(trimmed)
  } catch {
    return { ok: false, error: '存檔代碼格式錯誤，無法解碼。' }
  }

  let parsed: SaveShape
  try {
    parsed = JSON.parse(json) as SaveShape
  } catch {
    return { ok: false, error: '存檔內容毀損，無法解析。' }
  }

  if (!parsed || typeof parsed !== 'object' || !parsed.state) {
    return { ok: false, error: '這不是有效的存檔資料。' }
  }
  if (parsed.version !== SAVE_VERSION) {
    return { ok: false, error: `存檔版本不符（存檔 v${parsed.version}，目前 v${SAVE_VERSION}）。` }
  }
  if (typeof parsed.state.stageIndex !== 'number') {
    return { ok: false, error: '存檔缺少必要欄位，可能已毀損。' }
  }

  const state: GameState = { ...createInitialState(), ...parsed.state }
  for (const def of Object.values(state.discoveredItems ?? {})) registerItem(def)
  return { ok: true, state }
}
