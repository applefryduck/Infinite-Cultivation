export interface LogEntry {
  id: number
  time: number
  text: string
  kind: 'info' | 'good' | 'bad' | 'breakthrough'
}

export interface GameState {
  // 核心資源
  qi: number // 當前修為
  spiritStones: number // 靈石
  dao: number // 道韻（輪回永久貨幣）

  // 進度
  stageIndex: number // 目前所在境界（扁平化索引）
  maxStageIndex: number // 歷史最高境界（本世）

  // 功法 / 升級
  techniqueLevel: number // 功法等級，提升修煉速度
  spiritRootLevel: number // 靈根等級，提升靈石產出

  // 輪回
  reincarnations: number

  // 系統
  lastTick: number // 上次結算時間戳（ms）
  createdAt: number
  log: LogEntry[]
}

export interface StageInfo {
  index: number
  realmName: string // 大境界，如「築基」
  stageName: string // 小境界，如「後期」
  fullName: string // 「築基後期」
  majorIndex: number // 第幾個大境界
  isMajorBoundary: boolean // 是否為跨大境界的突破（更難）
}
