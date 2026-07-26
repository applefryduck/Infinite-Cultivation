import { create } from 'zustand'
import type { GameState, LogEntry } from './types'
import { createInitialState, loadGame, saveGame, clearSave } from './save'
import {
  breakthroughCost,
  breakthroughChance,
  breakthroughReward,
  spiritRootMultiplier,
  techniqueUpgradeCost,
  spiritRootUpgradeCost,
  daoOnReincarnation,
  REINCARNATION_MIN_STAGE,
} from './formulas'
import { getStageInfo } from './realms'
import { PATH_MAP, getTechnique } from './content/paths'
import { getGatherAction } from './content/gathering'
import { getItemDef, registerItem } from './content/items'
import type { ItemDef } from './content/items'
import { levelForXp } from './xp'
import { globalSpeedMult, aggregate, combatStats } from './stats'
import { offlineProvider, recipeKey } from './crafting/provider'
import { applyConsumable, pruneBuffs } from './effects'
import { combatTick } from './combatEngine'
import { rollRandomEvent, EVENT_CHANCE_PER_SECOND } from './events'

const MAX_LOG = 50
let logCounter = 1000

function pushLog(state: GameState, text: string, kind: LogEntry['kind']): void {
  state.log.unshift({ id: ++logCounter, time: Date.now(), text, kind })
  if (state.log.length > MAX_LOG) state.log.length = MAX_LOG
}

function clone(s: GameState): GameState {
  return structuredClone(s)
}

/** 目前境界可煉製的最高品階 */
export function realmCap(state: GameState): number {
  return Math.max(2, getStageInfo(state.stageIndex).majorIndex + 2)
}

function isElement(id: string): boolean {
  return getItemDef(id)?.category === 'element'
}

function invCount(state: GameState, id: string): number {
  return state.inventory[id] ?? 0
}

function addItem(state: GameState, id: string, qty: number): void {
  state.inventory[id] = (state.inventory[id] ?? 0) + qty
  if (state.inventory[id] <= 0) delete state.inventory[id]
}

// ---- 修煉結算 ----
function accrueCultivation(state: GameState, seconds: number, now: number): void {
  const path = PATH_MAP[state.activePathId]
  if (!path) return
  let tech = getTechnique(state.activePathId, state.activeTechId)
  if (!tech) {
    tech = path.techniques.find((t) => t.free) ?? path.techniques[0]
    state.activeTechId = tech.id
  }

  const mult = globalSpeedMult(state, now)
  const rateOf = (qiPerSec: number, techId: string) =>
    qiPerSec * mult * (1 + levelForXp(state.techMastery[techId] ?? 0) * 0.01)

  let sustained = seconds
  if (tech.inputs.length > 0) {
    // 計算素材能支撐幾秒
    for (const inp of tech.inputs) {
      const avail = inp.itemId === 'spiritStones' ? state.spiritStones : invCount(state, inp.itemId)
      sustained = Math.min(sustained, avail / inp.perSec)
    }
    sustained = Math.max(0, sustained)
    // 消耗素材
    for (const inp of tech.inputs) {
      const used = inp.perSec * sustained
      if (inp.itemId === 'spiritStones') state.spiritStones = Math.max(0, state.spiritStones - used)
      else addItem(state, inp.itemId, -used)
    }
    const gained = rateOf(tech.qiPerSec, tech.id) * sustained
    state.qi += gained
    state.pathXp[path.id] = (state.pathXp[path.id] ?? 0) + tech.qiPerSec * sustained * 0.5
    state.techMastery[tech.id] = (state.techMastery[tech.id] ?? 0) + tech.qiPerSec * sustained * 0.5

    const leftover = seconds - sustained
    if (leftover > 0.001) {
      // 素材耗盡 → 自動退回免費 technique
      const free = path.techniques.find((t) => t.free)
      if (free) {
        state.qi += rateOf(free.qiPerSec, free.id) * leftover
        if (state.activeTechId !== free.id) {
          state.activeTechId = free.id
          pushLog(state, `素材耗盡，自動退回「${free.name}」。`, 'info')
        }
      }
    }
  } else {
    const gained = rateOf(tech.qiPerSec, tech.id) * seconds
    state.qi += gained
    state.pathXp[path.id] = (state.pathXp[path.id] ?? 0) + tech.qiPerSec * seconds * 0.5
    state.techMastery[tech.id] = (state.techMastery[tech.id] ?? 0) + tech.qiPerSec * seconds * 0.5
  }
}

// ---- 採集結算 ----
function accrueGathering(state: GameState, seconds: number): void {
  if (!state.activeGatherId) return
  const found = getGatherAction(state.activeGatherId)
  if (!found) return
  const { skill, action } = found
  const skillLevel = levelForXp(state.gatherXp[skill.id] ?? 0)
  if (skillLevel < action.unlockLevel) return
  const cycles = seconds / action.cycleSec
  addItem(state, action.produces, action.qtyPerCycle * cycles)
  state.gatherXp[skill.id] = (state.gatherXp[skill.id] ?? 0) + action.xp * cycles
}

// ---- 隨機奇遇 ----
function rollEvents(state: GameState, seconds: number): void {
  const expected = seconds * EVENT_CHANCE_PER_SECOND
  let n = Math.floor(expected)
  if (Math.random() < expected - n) n++
  n = Math.min(n, 6)
  for (let i = 0; i < n; i++) {
    const ev = rollRandomEvent(state)
    ev.apply(state)
    pushLog(state, ev.text, ev.kind === 'info' ? 'info' : ev.kind)
  }
}

function computeOffline(state: GameState): { seconds: number; qi: number } | null {
  const now = Date.now()
  const elapsed = Math.max(0, (now - state.lastTick) / 1000)
  state.lastTick = now
  if (elapsed < 5) return null
  const capped = Math.min(elapsed, 12 * 3600)
  const before = state.qi
  accrueCultivation(state, capped, now)
  accrueGathering(state, capped)
  combatTick(state, capped, now)
  return { seconds: Math.floor(capped), qi: state.qi - before }
}

// ---- 初始化 + 離線結算 ----
const initial = loadGame() ?? createInitialState()
const initialOffline = (() => {
  const report = computeOffline(initial)
  if (report && report.qi > 0) {
    pushLog(initial, `閉關結束，你在坐忘中度過了約 ${formatDuration(report.seconds)}。`, 'info')
  }
  return report
})()

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec} 秒`
  if (sec < 3600) return `${Math.floor(sec / 60)} 分鐘`
  return `${Math.floor(sec / 3600)} 小時 ${Math.floor((sec % 3600) / 60)} 分鐘`
}

interface Store {
  state: GameState
  offlineReport: { seconds: number; qi: number } | null
  tick: (deltaMs: number) => void
  setActiveTechnique: (pathId: string, techId: string) => void
  setActiveGather: (actionId: string | undefined) => void
  breakthrough: () => void
  combine: (aId: string, bId: string) => void
  refine: (aId: string) => void
  useItem: (itemId: string) => void
  equip: (itemId: string) => void
  unequip: (slot: string) => void
  startHunt: (areaId: string) => void
  startDungeon: (dungeonId: string) => void
  stopCombat: () => void
  upgradeTechnique: () => void
  upgradeSpiritRoot: () => void
  reincarnate: () => void
  resetGame: () => void
  dismissOfflineReport: () => void
}

export const useGame = create<Store>((set) => ({
  state: initial,
  offlineReport: initialOffline,

  tick: (deltaMs) => {
    set((store) => {
      const s = clone(store.state)
      const now = Date.now()
      const seconds = deltaMs / 1000
      pruneBuffs(s, now)
      accrueCultivation(s, seconds, now)
      accrueGathering(s, seconds)
      const clogs = combatTick(s, seconds, now)
      for (const l of clogs) pushLog(s, l.text, l.kind)
      rollEvents(s, seconds)
      s.lastTick = now
      return { state: s }
    })
  },

  setActiveTechnique: (pathId, techId) =>
    set((store) => {
      const s = clone(store.state)
      const tech = getTechnique(pathId, techId)
      if (!tech) return {}
      if (tech.unlockRealm > s.stageIndex) return {}
      s.activePathId = pathId
      s.activeTechId = techId
      return { state: s }
    }),

  setActiveGather: (actionId) =>
    set((store) => {
      const s = clone(store.state)
      s.activeGatherId = actionId
      return { state: s }
    }),

  breakthrough: () =>
    set((store) => {
      const s = clone(store.state)
      const cost = breakthroughCost(s.stageIndex)
      if (s.qi < cost) return {}
      let chance = breakthroughChance(s.stageIndex)
      // 招牌 + 破境丹 + 法寶加成
      const agg = aggregate(s)
      chance = Math.min(0.99, chance + agg.breakthroughPct)
      const failLossReduce = agg.failLossReduce
      s.qi -= cost
      s.pendingBreakthroughPct = 0
      if (Math.random() < chance) {
        s.stageIndex += 1
        s.maxStageIndex = Math.max(s.maxStageIndex, s.stageIndex)
        const reward = Math.floor(breakthroughReward(s.stageIndex - 1) * spiritRootMultiplier(s.spiritRootLevel))
        s.spiritStones += reward
        pushLog(s, `突破成功！境界更進一步，獲得靈石 ${reward} 枚。`, 'breakthrough')
      } else {
        const extraLoss = Math.floor(cost * 0.3 * (1 - failLossReduce))
        s.qi = Math.max(0, s.qi - extraLoss)
        pushLog(s, '突破失敗，你走火入魔，修為受損。', 'bad')
      }
      return { state: s }
    }),

  combine: (aId, bId) =>
    set((store) => {
      const s = clone(store.state)
      // 檢查素材（元素免費、無限）
      const need: Record<string, number> = {}
      for (const id of [aId, bId]) if (!isElement(id)) need[id] = (need[id] ?? 0) + 1
      for (const [id, n] of Object.entries(need)) if (invCount(s, id) < n) return {}

      const res = offlineProvider.combine(aId, bId, realmCap(s))
      if (!res) {
        pushLog(s, '靈氣潰散，這兩樣東西未能相融。', 'bad')
        return { state: s }
      }
      // 消耗
      for (const [id, n] of Object.entries(need)) addItem(s, id, -n)
      finishCraft(s, res.item, res.named, 'combine', aId, bId)
      return { state: s }
    }),

  refine: (aId) =>
    set((store) => {
      const s = clone(store.state)
      if (!isElement(aId) && invCount(s, aId) < 1) return {}
      const res = offlineProvider.refine(aId, realmCap(s))
      if (!res) {
        pushLog(s, '此物無可提煉之處。', 'bad')
        return { state: s }
      }
      if (!isElement(aId)) addItem(s, aId, -1)
      finishCraft(s, res.item, res.named, 'refine', aId)
      return { state: s }
    }),

  useItem: (itemId) =>
    set((store) => {
      const s = clone(store.state)
      if (invCount(s, itemId) < 1) return {}
      const def = getItemDef(itemId)
      if (!def?.effect) return {}
      addItem(s, itemId, -1)
      const msg = applyConsumable(s, def, Date.now())
      pushLog(s, msg, 'good')
      return { state: s }
    }),

  equip: (itemId) =>
    set((store) => {
      const s = clone(store.state)
      const def = getItemDef(itemId)
      if (!def?.slot || invCount(s, itemId) < 1) return {}
      // 卸下原本的
      const prev = s.equipped[def.slot]
      if (prev) addItem(s, prev, 1)
      addItem(s, itemId, -1)
      s.equipped[def.slot] = itemId
      pushLog(s, `裝備了 ${def.name}。`, 'good')
      return { state: s }
    }),

  unequip: (slot) =>
    set((store) => {
      const s = clone(store.state)
      const id = s.equipped[slot as keyof typeof s.equipped]
      if (!id) return {}
      addItem(s, id, 1)
      delete s.equipped[slot as keyof typeof s.equipped]
      return { state: s }
    }),

  startHunt: (areaId) =>
    set((store) => {
      const s = clone(store.state)
      s.combat = { mode: 'hunt', areaId, waveIndex: 0, enemyId: undefined, enemyHp: 0, playerHp: combatMaxHp(s), cooldownUntil: 0 }
      return { state: s }
    }),

  startDungeon: (dungeonId) =>
    set((store) => {
      const s = clone(store.state)
      s.combat = { mode: 'dungeon', dungeonId, waveIndex: 0, enemyId: undefined, enemyHp: 0, playerHp: combatMaxHp(s), cooldownUntil: 0 }
      return { state: s }
    }),

  stopCombat: () =>
    set((store) => {
      const s = clone(store.state)
      s.combat = { ...s.combat, mode: 'idle', enemyId: undefined, enemyHp: 0 }
      return { state: s }
    }),

  upgradeTechnique: () =>
    set((store) => {
      const s = clone(store.state)
      const cost = techniqueUpgradeCost(s.techniqueLevel)
      if (s.spiritStones < cost) return {}
      s.spiritStones -= cost
      s.techniqueLevel += 1
      return { state: s }
    }),

  upgradeSpiritRoot: () =>
    set((store) => {
      const s = clone(store.state)
      const cost = spiritRootUpgradeCost(s.spiritRootLevel)
      if (s.spiritStones < cost) return {}
      s.spiritStones -= cost
      s.spiritRootLevel += 1
      return { state: s }
    }),

  reincarnate: () =>
    set((store) => {
      const s = store.state
      if (s.maxStageIndex < REINCARNATION_MIN_STAGE) return {}
      const gainedDao = daoOnReincarnation(s.maxStageIndex)
      if (gainedDao <= 0) return {}
      const fresh = createInitialState()
      // 保留：道韻、轉世數、圖鑑（發現的配方與物品）
      fresh.dao = s.dao + gainedDao
      fresh.reincarnations = s.reincarnations + 1
      fresh.discovered = s.discovered
      fresh.discoveredItems = s.discoveredItems
      fresh.log = s.log
      pushLog(fresh, `你參透一世輪回，轉世重修。道韻 +${gainedDao}，銘刻道基。`, 'breakthrough')
      return { state: fresh }
    }),

  resetGame: () => {
    clearSave()
    set({ state: createInitialState(), offlineReport: null })
  },

  dismissOfflineReport: () => set({ offlineReport: null }),
}))

// finishCraft：登錄發現、給經驗、加入儲物、首發獎勵
function finishCraft(
  s: GameState,
  item: ItemDef,
  named: { stones?: number; dao?: number } | undefined,
  _kind: 'combine' | 'refine',
  aId: string,
  bId?: string,
): void {
  const key = recipeKey(aId, bId)
  const firstTime = !s.discovered[key]

  registerItem(item)
  s.discoveredItems[item.id] = item
  s.discovered[key] = item.id

  // 技能經驗
  const craftSkill = item.category === 'artifact' ? 'lianqi' : 'liandan'
  const xpGain = 10 * item.tier
  s.craftXp[craftSkill] = (s.craftXp[craftSkill] ?? 0) + xpGain
  s.recipeMastery[item.id] = (s.recipeMastery[item.id] ?? 0) + xpGain

  // 產量：受配方精通加成
  const masteryLv = levelForXp(s.recipeMastery[item.id] ?? 0)
  const yieldQty = 1 + Math.floor(masteryLv / 25)
  addItem(s, item.id, yieldQty)

  if (firstTime) {
    let reward = named?.stones ?? 20 * item.tier
    s.spiritStones += reward
    if (named?.dao) s.dao += named.dao
    pushLog(s, `【新發現】${item.emoji} ${item.name}！首次煉成，獲得靈石 ${reward}${named?.dao ? `、道韻 ${named.dao}` : ''}。`, 'breakthrough')
  } else {
    pushLog(s, `煉成 ${item.emoji} ${item.name} ×${yieldQty}。`, 'good')
  }
}

function combatMaxHp(s: GameState): number {
  return combatStats(s).maxHp
}

// 自動存檔
let saveTimer: ReturnType<typeof setInterval> | null = null
export function startAutoSave(): void {
  if (saveTimer) return
  saveTimer = setInterval(() => saveGame(useGame.getState().state), 5000)
  window.addEventListener('beforeunload', () => saveGame(useGame.getState().state))
}
