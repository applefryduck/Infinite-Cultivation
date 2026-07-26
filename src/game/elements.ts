/** 五行 */
export type FiveElement = '金' | '木' | '水' | '火' | '土'

export const FIVE_ELEMENTS: FiveElement[] = ['金', '木', '水', '火', '土']

// 相剋：金克木、木克土、土克水、水克火、火克金
const OVERCOMES: Record<FiveElement, FiveElement> = {
  金: '木',
  木: '土',
  土: '水',
  水: '火',
  火: '金',
}

export const ELEMENT_COLOR: Record<FiveElement, string> = {
  金: '#e8c469',
  木: '#5fd6a3',
  水: '#6db3f2',
  火: '#e0605e',
  土: '#c9a06b',
}

/**
 * 攻方對守方的相剋倍率。
 * 剋制 ×1.5，被剋 ×0.67，同屬/無關 ×1。
 */
export function elementMultiplier(attacker?: FiveElement, defender?: FiveElement): number {
  if (!attacker || !defender) return 1
  if (OVERCOMES[attacker] === defender) return 1.5
  if (OVERCOMES[defender] === attacker) return 0.67
  return 1
}
