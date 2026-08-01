import type { GameState } from './types'
import { SKILL_TREES } from './content/skillTrees'
import type { NodeEffect } from './content/skillTrees'

export interface SkillBonuses {
  gatherYield: number
  gatherSpeed: number
  gatherDouble: number
  gatherRare: number
  gatherXp: number
  gatherQi: number
  craftYield: number
  craftCostReduce: number
  craftTier: number
  craftMastery: number
}

const EMPTY: SkillBonuses = {
  gatherYield: 0,
  gatherSpeed: 0,
  gatherDouble: 0,
  gatherRare: 0,
  gatherXp: 0,
  gatherQi: 0,
  craftYield: 0,
  craftCostReduce: 0,
  craftTier: 0,
  craftMastery: 0,
}

/** 加總某技能已投入節點的效果 */
export function skillBonuses(state: GameState, skillId: string): SkillBonuses {
  const out = { ...EMPTY }
  const nodes = SKILL_TREES[skillId]
  if (!nodes) return out
  const ranks = state.skillNodes ?? {}
  for (const node of nodes) {
    const rank = ranks[node.id] ?? 0
    if (rank <= 0) continue
    apply(out, node.effect, rank)
  }
  return out
}

function apply(out: SkillBonuses, e: NodeEffect, rank: number): void {
  switch (e.kind) {
    case 'gatherYield':
      out.gatherYield += e.pct * rank
      break
    case 'gatherSpeed':
      out.gatherSpeed += e.pct * rank
      break
    case 'gatherDouble':
      out.gatherDouble += e.pct * rank
      break
    case 'gatherRare':
      out.gatherRare += e.pct * rank
      break
    case 'gatherXp':
      out.gatherXp += e.pct * rank
      break
    case 'gatherQi':
      out.gatherQi += e.pct * rank
      break
    case 'craftYield':
      out.craftYield += e.pct * rank
      break
    case 'craftCostReduce':
      out.craftCostReduce += e.pct * rank
      break
    case 'craftTier':
      out.craftTier += e.pct * rank
      break
    case 'craftMastery':
      out.craftMastery += e.pct * rank
      break
  }
}

/** 週期縮短有上限，避免速度趨近 0 */
export function effectiveCycle(baseSec: number, speedPct: number): number {
  return baseSec * Math.max(0.25, 1 - speedPct)
}
