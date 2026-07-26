/**
 * OSRS / Melvor 式經驗曲線。
 * XP(L) = ⌊(1/4)·Σ(ℓ=1→L-1)⌊ℓ + 300·2^(ℓ/7)⌋⌋
 * 技能等級與精通等級共用此曲線。
 */

export const MAX_LEVEL = 120

const xpTable: number[] = (() => {
  const table: number[] = [0, 0] // level 0、1 皆為 0 起點
  let points = 0
  for (let level = 1; level < MAX_LEVEL; level++) {
    points += Math.floor(level + 300 * Math.pow(2, level / 7))
    table[level + 1] = Math.floor(points / 4)
  }
  return table
})()

/** 到達等級 L 所需的累積經驗 */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0
  if (level >= MAX_LEVEL) return xpTable[MAX_LEVEL]
  return xpTable[level]
}

/** 依累積經驗換算目前等級 */
export function levelForXp(xp: number): number {
  for (let level = MAX_LEVEL; level >= 1; level--) {
    if (xp >= xpTable[level]) return level
  }
  return 1
}

/** 目前等級的進度 0..1（到下一級） */
export function levelProgress(xp: number): number {
  const level = levelForXp(xp)
  if (level >= MAX_LEVEL) return 1
  const cur = xpForLevel(level)
  const next = xpForLevel(level + 1)
  if (next === cur) return 1
  return (xp - cur) / (next - cur)
}
