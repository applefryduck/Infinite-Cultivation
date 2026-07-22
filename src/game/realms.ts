import type { StageInfo } from './types'

/**
 * 大境界定義。前段為固定命名境界，飛升之後進入程序化生成的「仙境」，
 * 讓境界可以無限延伸 —— 這是「無限修仙」的核心。
 */
interface MajorRealm {
  name: string
  stages: string[]
}

const FIXED_REALMS: MajorRealm[] = [
  { name: '練氣', stages: ['一層', '二層', '三層', '四層', '五層', '六層', '七層', '八層', '九層'] },
  { name: '築基', stages: ['初期', '中期', '後期', '大圓滿'] },
  { name: '金丹', stages: ['初期', '中期', '後期', '大圓滿'] },
  { name: '元嬰', stages: ['初期', '中期', '後期', '大圓滿'] },
  { name: '化神', stages: ['初期', '中期', '後期', '大圓滿'] },
  { name: '煉虛', stages: ['初期', '中期', '後期', '大圓滿'] },
  { name: '合體', stages: ['初期', '中期', '後期', '大圓滿'] },
  { name: '大乘', stages: ['初期', '中期', '後期', '大圓滿'] },
  { name: '渡劫', stages: ['初期', '中期', '後期', '大圓滿'] },
]

// 飛升後的仙境等級名（循環使用，配合「第 N 重天」無限延伸）
const IMMORTAL_TIERS = ['地仙', '天仙', '金仙', '太乙', '大羅', '道祖']
const HEAVEN_STAGES = ['初境', '中境', '上境', '極境']

const CN_NUM = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
function cnNumber(n: number): string {
  if (n <= 10) return CN_NUM[n]
  if (n < 20) return '十' + (n % 10 === 0 ? '' : CN_NUM[n % 10])
  if (n < 100) {
    const tens = Math.floor(n / 10)
    const ones = n % 10
    return CN_NUM[tens] + '十' + (ones === 0 ? '' : CN_NUM[ones])
  }
  return String(n)
}

// 固定境界的總小境界數
const FIXED_STAGE_COUNT = FIXED_REALMS.reduce((sum, r) => sum + r.stages.length, 0)

/**
 * 取得任意索引的境界資訊，支援無限延伸。
 */
export function getStageInfo(index: number): StageInfo {
  if (index < 0) index = 0

  // 固定命名境界階段
  let cursor = 0
  for (let m = 0; m < FIXED_REALMS.length; m++) {
    const realm = FIXED_REALMS[m]
    if (index < cursor + realm.stages.length) {
      const localStage = index - cursor
      return {
        index,
        realmName: realm.name,
        stageName: realm.stages[localStage],
        fullName: `${realm.name}${realm.stages[localStage]}`,
        majorIndex: m,
        isMajorBoundary: localStage === 0 && m > 0,
      }
    }
    cursor += realm.stages.length
  }

  // 飛升之後 —— 程序化生成的無限仙境
  const beyond = index - FIXED_STAGE_COUNT // 0-based
  const majorInImmortal = Math.floor(beyond / HEAVEN_STAGES.length)
  const localStage = beyond % HEAVEN_STAGES.length

  const tier = IMMORTAL_TIERS[majorInImmortal % IMMORTAL_TIERS.length]
  const heavenNumber = Math.floor(majorInImmortal / IMMORTAL_TIERS.length) + 1
  const realmName = `${tier}·${cnNumber(heavenNumber)}重天`

  return {
    index,
    realmName,
    stageName: HEAVEN_STAGES[localStage],
    fullName: `${realmName}${HEAVEN_STAGES[localStage]}`,
    majorIndex: FIXED_REALMS.length + majorInImmortal,
    isMajorBoundary: localStage === 0,
  }
}

export { FIXED_STAGE_COUNT }
