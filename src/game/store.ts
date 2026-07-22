import { create } from 'zustand'
import type { GameState, LogEntry } from './types'
import { createInitialState, loadGame, saveGame, clearSave } from './save'
import {
  breakthroughCost,
  breakthroughChance,
  breakthroughReward,
  cultivationSpeed,
  spiritRootMultiplier,
  techniqueUpgradeCost,
  spiritRootUpgradeCost,
  daoOnReincarnation,
  REINCARNATION_MIN_STAGE,
} from './formulas'
import { rollRandomEvent, EVENT_CHANCE_PER_SECOND } from './events'

const MAX_LOG = 40
let logCounter = 1000

interface Store {
  state: GameState
  offlineReport: { seconds: number; qi: number } | null
  tick: (deltaMs: number) => void
  breakthrough: () => void
  upgradeTechnique: () => void
  upgradeSpiritRoot: () => void
  reincarnate: () => void
  resetGame: () => void
  dismissOfflineReport: () => void
}

function pushLog(state: GameState, text: string, kind: LogEntry['kind']): void {
  state.log.unshift({ id: ++logCounter, time: Date.now(), text, kind })
  if (state.log.length > MAX_LOG) state.log.length = MAX_LOG
}

// 結算一段時間的修煉（掛機/離線共用）。回傳實際獲得修為。
function accrue(state: GameState, seconds: number, allowEvents: boolean): number {
  const speed = cultivationSpeed(state)
  const gained = speed * seconds
  state.qi += gained

  if (allowEvents) {
    // 依秒數決定觸發幾次奇遇（離線僅少量）
    const expected = seconds * EVENT_CHANCE_PER_SECOND
    let events = Math.floor(expected)
    if (Math.random() < expected - events) events++
    events = Math.min(events, 8)
    for (let i = 0; i < events; i++) {
      const ev = rollRandomEvent(state)
      ev.apply(state)
      pushLog(state, ev.text, ev.kind === 'info' ? 'info' : ev.kind)
    }
  }
  return gained
}

function computeOffline(state: GameState): { seconds: number; qi: number } | null {
  const now = Date.now()
  const elapsedSec = Math.max(0, (now - state.lastTick) / 1000)
  state.lastTick = now
  if (elapsedSec < 5) return null
  const capped = Math.min(elapsedSec, 12 * 3600) // 離線最多結算 12 小時
  const qi = accrue(state, capped, false) // 離線不觸發劇情事件，避免洗版
  return { seconds: Math.floor(capped), qi }
}

const initial = (() => {
  const loaded = loadGame()
  if (loaded) return loaded
  return createInitialState()
})()

const initialOffline = (() => {
  // 對載入的存檔計算離線收益
  const s = { ...initial, log: [...initial.log] }
  const report = computeOffline(s)
  if (report && report.qi > 0) {
    pushLog(s, `閉關結束，你在坐忘中度過了約 ${formatDuration(report.seconds)}。`, 'info')
  }
  // 用結算後的狀態覆蓋 initial
  Object.assign(initial, s)
  return report
})()

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec} 秒`
  if (sec < 3600) return `${Math.floor(sec / 60)} 分鐘`
  return `${Math.floor(sec / 3600)} 小時 ${Math.floor((sec % 3600) / 60)} 分鐘`
}

export const useGame = create<Store>((set) => ({
  state: initial,
  offlineReport: initialOffline,

  tick: (deltaMs) => {
    set((store) => {
      const state = { ...store.state, log: store.state.log }
      const seconds = deltaMs / 1000
      accrue(state, seconds, true)
      state.lastTick = Date.now()
      return { state }
    })
  },

  breakthrough: () => {
    set((store) => {
      const state = { ...store.state, log: [...store.state.log] }
      const cost = breakthroughCost(state.stageIndex)
      if (state.qi < cost) return {}

      const chance = breakthroughChance(state.stageIndex)
      state.qi -= cost
      if (Math.random() < chance) {
        state.stageIndex += 1
        state.maxStageIndex = Math.max(state.maxStageIndex, state.stageIndex)
        const reward = Math.floor(
          breakthroughReward(state.stageIndex - 1) * spiritRootMultiplier(state.spiritRootLevel),
        )
        state.spiritStones += reward
        pushLog(
          state,
          `突破成功！你的境界更進一步，獲得靈石 ${reward} 枚。`,
          'breakthrough',
        )
      } else {
        // 走火入魔，額外損失部分修為
        const extraLoss = Math.floor(cost * 0.3)
        state.qi = Math.max(0, state.qi - extraLoss)
        pushLog(state, '突破失敗，你走火入魔，修為受損，還需再接再厲。', 'bad')
      }
      return { state }
    })
  },

  upgradeTechnique: () => {
    set((store) => {
      const state = { ...store.state, log: [...store.state.log] }
      const cost = techniqueUpgradeCost(state.techniqueLevel)
      if (state.spiritStones < cost) return {}
      state.spiritStones -= cost
      state.techniqueLevel += 1
      pushLog(state, `你參悟功法，修煉之法更臻圓熟（功法 Lv.${state.techniqueLevel}）。`, 'good')
      return { state }
    })
  },

  upgradeSpiritRoot: () => {
    set((store) => {
      const state = { ...store.state, log: [...store.state.log] }
      const cost = spiritRootUpgradeCost(state.spiritRootLevel)
      if (state.spiritStones < cost) return {}
      state.spiritStones -= cost
      state.spiritRootLevel += 1
      pushLog(state, `你以靈石溫養靈根，靈石感悟更深（靈根 Lv.${state.spiritRootLevel}）。`, 'good')
      return { state }
    })
  },

  reincarnate: () => {
    set((store) => {
      const state = { ...store.state, log: [...store.state.log] }
      if (state.maxStageIndex < REINCARNATION_MIN_STAGE) return {}
      const gainedDao = daoOnReincarnation(state.maxStageIndex)
      if (gainedDao <= 0) return {}

      const fresh = createInitialState()
      fresh.dao = state.dao + gainedDao
      fresh.reincarnations = state.reincarnations + 1
      fresh.log = state.log
      pushLog(
        fresh,
        `你參透一世輪回，轉世重修。此世積累化為道韻 +${gainedDao}，銘刻於道基之上。`,
        'breakthrough',
      )
      return { state: fresh }
    })
  },

  resetGame: () => {
    clearSave()
    set({ state: createInitialState(), offlineReport: null })
  },

  dismissOfflineReport: () => set({ offlineReport: null }),
}))

// 自動存檔
let saveTimer: ReturnType<typeof setInterval> | null = null
export function startAutoSave(): void {
  if (saveTimer) return
  saveTimer = setInterval(() => saveGame(useGame.getState().state), 5000)
  window.addEventListener('beforeunload', () => saveGame(useGame.getState().state))
}
