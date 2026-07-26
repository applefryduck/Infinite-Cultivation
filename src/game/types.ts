import type { ItemDef, EquipSlot } from './content/items'

export interface LogEntry {
  id: number
  time: number
  text: string
  kind: 'info' | 'good' | 'bad' | 'breakthrough' | 'combat'
}

export interface Buff {
  id: number
  kind: 'speed'
  mult: number // 附加倍率（0.5 = +50%）
  expiresAt: number
}

export type CombatMode = 'idle' | 'hunt' | 'dungeon'

export interface CombatState {
  mode: CombatMode
  areaId?: string
  dungeonId?: string
  waveIndex: number
  enemyId?: string
  enemyHp: number
  playerHp: number
  cooldownUntil: number // 重傷冷卻結束時間戳
}

export interface GameState {
  // 核心資源
  qi: number
  spiritStones: number
  dao: number

  // 境界
  stageIndex: number
  maxStageIndex: number

  // 全域升級（沿用）
  techniqueLevel: number
  spiritRootLevel: number

  // 輪回
  reincarnations: number

  // 技能經驗
  gatherXp: Record<string, number> // caiyao/kuang/guanxiang
  craftXp: Record<string, number> // liandan/lianqi
  pathXp: Record<string, number> // lingxiu/tixiu/shenshi
  techMastery: Record<string, number> // techId -> xp
  recipeMastery: Record<string, number> // itemId -> xp

  // active 動作
  activePathId: string
  activeTechId: string
  activeGatherId?: string // 可與修煉並行

  // 煉製發現
  discovered: Record<string, string> // recipeKey -> resultItemId
  discoveredItems: Record<string, ItemDef> // 發現物品定義（持久）

  // 儲物 / 裝備
  inventory: Record<string, number>
  equipped: Partial<Record<EquipSlot, string>>

  // buff / 永久
  buffs: Buff[]
  permaSpeedPct: number
  pendingBreakthroughPct: number // 破境丹：下次突破加成

  // 戰鬥
  combat: CombatState

  // 系統
  lastTick: number
  createdAt: number
  log: LogEntry[]
}

export interface StageInfo {
  index: number
  realmName: string
  stageName: string
  fullName: string
  majorIndex: number
  isMajorBoundary: boolean
}
