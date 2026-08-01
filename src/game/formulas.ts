import type { GameState } from './types'
import { getStageInfo } from './realms'

/**
 * 突破到「下一境界」所需的修為。隨境界指數成長 —— 這就是掛機的爬坡曲線。
 */
export function breakthroughCost(currentStageIndex: number): number {
  const target = currentStageIndex + 1
  const base = 50
  const growth = 1.55
  return Math.floor(base * Math.pow(growth, target))
}

/**
 * 每秒修煉速度（修為/秒）。
 * 受功法等級、輪回道韻、當前境界加成影響。
 */
export function cultivationSpeed(state: GameState): number {
  const techniqueBonus = 1 + state.techniqueLevel * 0.35
  const daoBonus = 1 + state.dao * 0.02 // 每點道韻 +2% 全域修煉速度
  const realmBonus = 1 + state.stageIndex * 0.12 // 境界越高，吐納越快（但需求漲更快）
  return 1 * techniqueBonus * daoBonus * realmBonus
}

/**
 * 突破成功率。大境界（跨大境界）更難；靈石充足時可略微保底。
 */
export function breakthroughChance(currentStageIndex: number): number {
  const next = getStageInfo(currentStageIndex + 1)
  let chance = 0.9
  if (next.isMajorBoundary) chance = 0.55 // 跨大境界更凶險
  // 境界越高越難一點點
  chance -= Math.min(0.25, currentStageIndex * 0.004)
  return Math.max(0.2, chance)
}

/**
 * 突破成功獲得的靈石。
 */
export function breakthroughReward(currentStageIndex: number): number {
  const next = getStageInfo(currentStageIndex + 1)
  const base = 10 * Math.pow(1.4, currentStageIndex + 1)
  const rootBonus = 1 + state_spiritRootBonus(currentStageIndex)
  const majorMult = next.isMajorBoundary ? 5 : 1
  return Math.floor(base * majorMult * rootBonus)
}

// 靈根加成佔位（實際靈根加成在 store 內結合等級計算，這裡僅保留擴充點）
function state_spiritRootBonus(_: number): number {
  return 0
}

/** 靈根等級對靈石產出的加成倍率 */
export function spiritRootMultiplier(spiritRootLevel: number): number {
  return 1 + spiritRootLevel * 0.25
}

/** 功法升級費用（靈石） */
export function techniqueUpgradeCost(level: number): number {
  return Math.floor(30 * Math.pow(1.8, level))
}

/** 靈根升級費用（靈石） */
export function spiritRootUpgradeCost(level: number): number {
  return Math.floor(50 * Math.pow(2.0, level))
}

/**
 * 煉製費用（靈石）。首次發現免費，之後重複煉製需付費。
 * 隨品階與境界成長，與靈石產出同步，避免免費無限量產素材／丹藥。
 */
export function craftCost(tier: number, stageIndex: number): number {
  // 成長率 1.45 必須高於靈石收入成長率（breakthroughReward 的 1.4），
  // 否則後期靈石收入會反超煉製成本，讓「煉丹刷境界」的無限迴圈復活。
  return Math.floor(15 * tier * Math.pow(1.45, stageIndex))
}

/**
 * 聚氣丹等「增修為」丹藥的固定藥效，在煉成當下依品階與境界烘焙。
 * 固定值避免舊丹隨境界水漲船高（原設計會讓丹藥永遠等於下次突破的固定比例）。
 */
export function pillQiAmount(tier: number, stageIndex: number): number {
  return Math.floor(0.15 * tier * breakthroughCost(stageIndex))
}

/**
 * 輪回轉世可獲得的道韻。境界越高，轉世收益越大。
 * 需達到一定境界才能轉世。
 */
export const REINCARNATION_MIN_STAGE = 12 // 約金丹後期起可輪回

export function daoOnReincarnation(maxStageIndex: number): number {
  if (maxStageIndex < REINCARNATION_MIN_STAGE) return 0
  return Math.floor(Math.pow(maxStageIndex - REINCARNATION_MIN_STAGE + 1, 1.3))
}

/** 大數字格式化：練氣期用整數，之後用單位（萬/億/兆…）與科學記號 */
const UNITS = ['', '萬', '億', '兆', '京', '垓']
export function formatNumber(n: number): number | string {
  if (n < 10000) return Math.floor(n)
  let unitIndex = 0
  let value = n
  while (value >= 10000 && unitIndex < UNITS.length - 1) {
    value /= 10000
    unitIndex++
  }
  if (unitIndex === UNITS.length - 1 && value >= 10000) {
    return n.toExponential(2)
  }
  return value.toFixed(2) + UNITS[unitIndex]
}
