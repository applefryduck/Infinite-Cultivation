/** 技能樹節點效果 */
export type NodeEffect =
  // 採集
  | { kind: 'gatherYield'; pct: number } // 產量加成
  | { kind: 'gatherSpeed'; pct: number } // 週期縮短
  | { kind: 'gatherDouble'; pct: number } // 雙倍產出機率
  | { kind: 'gatherRare'; pct: number } // 額外掉落高一階素材的機率
  | { kind: 'gatherXp'; pct: number } // 技能經驗加成
  | { kind: 'gatherQi'; pct: number } // 採集同時獲得修為（相對於修煉速率）
  // 製作
  | { kind: 'craftYield'; pct: number } // 額外成品機率
  | { kind: 'craftCostReduce'; pct: number } // 煉製靈石費用減免
  | { kind: 'craftTier'; pct: number } // 煉出更高一品階的機率
  | { kind: 'craftMastery'; pct: number } // 配方精通加成

export type BranchId = 'yield' | 'speed' | 'rare' | 'dao'

export interface SkillNode {
  id: string
  skillId: string
  branch: BranchId
  row: number // 0,1,2 — 同分支需前一列點滿才能投入
  name: string
  desc: string
  maxRank: number
  costPerRank: number
  effect: NodeEffect
}

export interface BranchMeta {
  id: BranchId
  name: string
  emoji: string
}

export const GATHER_BRANCHES: BranchMeta[] = [
  { id: 'yield', name: '豐收', emoji: '🌾' },
  { id: 'speed', name: '疾行', emoji: '⚡' },
  { id: 'rare', name: '慧眼', emoji: '💎' },
  { id: 'dao', name: '道法', emoji: '📿' },
]

export const CRAFT_BRANCHES: BranchMeta[] = [
  { id: 'yield', name: '豐產', emoji: '🌾' },
  { id: 'speed', name: '省耗', emoji: '⚡' },
  { id: 'rare', name: '精工', emoji: '💎' },
  { id: 'dao', name: '道法', emoji: '📿' },
]

/** 產生一個採集技能的完整樹（4 分支 × 3 階） */
function gatherTree(skillId: string, capstone: { rare: string; dao: string }): SkillNode[] {
  const n = (
    branch: BranchId,
    row: number,
    name: string,
    desc: string,
    maxRank: number,
    costPerRank: number,
    effect: NodeEffect,
  ): SkillNode => ({ id: `${skillId}_${branch}_${row}`, skillId, branch, row, name, desc, maxRank, costPerRank, effect })

  return [
    // 豐收
    n('yield', 0, '熟稔手法', '每階採集產量 +12%', 3, 1, { kind: 'gatherYield', pct: 0.12 }),
    n('yield', 1, '厚積', '每階採集產量再 +15%', 3, 2, { kind: 'gatherYield', pct: 0.15 }),
    n('yield', 2, '天賜豐饒', '每階 8% 機率雙倍產出', 2, 4, { kind: 'gatherDouble', pct: 0.08 }),
    // 疾行
    n('speed', 0, '身法輕捷', '每階採集週期 -8%', 3, 1, { kind: 'gatherSpeed', pct: 0.08 }),
    n('speed', 1, '心無旁騖', '每階採集週期再 -6%', 3, 2, { kind: 'gatherSpeed', pct: 0.06 }),
    n('speed', 2, '瞬息千里', '每階採集週期再 -10%', 2, 4, { kind: 'gatherSpeed', pct: 0.1 }),
    // 慧眼
    n('rare', 0, '明察秋毫', '每階 6% 機率額外獲得高一階素材', 3, 1, { kind: 'gatherRare', pct: 0.06 }),
    n('rare', 1, '洞幽燭微', '每階再 +8% 稀有機率', 3, 2, { kind: 'gatherRare', pct: 0.08 }),
    n('rare', 2, capstone.rare, '每階再 +12% 稀有機率', 2, 4, { kind: 'gatherRare', pct: 0.12 }),
    // 道法
    n('dao', 0, '勤修不輟', '每階技能經驗 +15%', 3, 1, { kind: 'gatherXp', pct: 0.15 }),
    n('dao', 1, '融會貫通', '每階技能經驗再 +20%', 3, 2, { kind: 'gatherXp', pct: 0.2 }),
    n('dao', 2, capstone.dao, '每階採集時額外獲得 15% 修煉速率的修為', 2, 4, { kind: 'gatherQi', pct: 0.15 }),
  ]
}

/** 產生一個製作技能的完整樹 */
function craftTree(skillId: string, capstone: { rare: string; dao: string }): SkillNode[] {
  const n = (
    branch: BranchId,
    row: number,
    name: string,
    desc: string,
    maxRank: number,
    costPerRank: number,
    effect: NodeEffect,
  ): SkillNode => ({ id: `${skillId}_${branch}_${row}`, skillId, branch, row, name, desc, maxRank, costPerRank, effect })

  return [
    n('yield', 0, '火候得宜', '每階 10% 機率多得一份成品', 3, 1, { kind: 'craftYield', pct: 0.1 }),
    n('yield', 1, '爐火純青', '每階再 +12% 多產機率', 3, 2, { kind: 'craftYield', pct: 0.12 }),
    n('yield', 2, '一爐雙生', '每階再 +20% 多產機率', 2, 4, { kind: 'craftYield', pct: 0.2 }),

    n('speed', 0, '節材', '每階煉製靈石費用 -12%', 3, 1, { kind: 'craftCostReduce', pct: 0.12 }),
    n('speed', 1, '惜物之道', '每階煉製費用再 -10%', 3, 2, { kind: 'craftCostReduce', pct: 0.1 }),
    n('speed', 2, '點石成金', '每階煉製費用再 -15%', 2, 4, { kind: 'craftCostReduce', pct: 0.15 }),

    n('rare', 0, '匠心', '每階 5% 機率煉出高一品階', 3, 1, { kind: 'craftTier', pct: 0.05 }),
    n('rare', 1, '奪天工', '每階再 +6% 提階機率', 3, 2, { kind: 'craftTier', pct: 0.06 }),
    n('rare', 2, capstone.rare, '每階再 +9% 提階機率', 2, 4, { kind: 'craftTier', pct: 0.09 }),

    n('dao', 0, '勤練', '每階配方精通 +20%', 3, 1, { kind: 'craftMastery', pct: 0.2 }),
    n('dao', 1, '心手相應', '每階配方精通再 +25%', 3, 2, { kind: 'craftMastery', pct: 0.25 }),
    n('dao', 2, capstone.dao, '每階配方精通再 +35%', 2, 4, { kind: 'craftMastery', pct: 0.35 }),
  ]
}

export const SKILL_TREES: Record<string, SkillNode[]> = {
  caiyao: gatherTree('caiyao', { rare: '藥王之眼', dao: '草木通靈' }),
  kuang: gatherTree('kuang', { rare: '透山之瞳', dao: '金石有靈' }),
  guanxiang: gatherTree('guanxiang', { rare: '神念感知', dao: '夢中悟道' }),
  liandan: craftTree('liandan', { rare: '丹成九轉', dao: '丹道大成' }),
  lianqi: craftTree('lianqi', { rare: '器成通靈', dao: '器道大成' }),
}

/** 技能等級可得的總點數：每 2 級 1 點 */
export function pointsFromLevel(level: number): number {
  return Math.floor(level / 2)
}

export function getNode(nodeId: string): SkillNode | undefined {
  for (const nodes of Object.values(SKILL_TREES)) {
    const found = nodes.find((n) => n.id === nodeId)
    if (found) return found
  }
  return undefined
}

/** 該技能已花費的點數 */
export function spentPoints(skillId: string, ranks: Record<string, number>): number {
  const nodes = SKILL_TREES[skillId] ?? []
  return nodes.reduce((sum, n) => sum + (ranks[n.id] ?? 0) * n.costPerRank, 0)
}

/** 節點是否可投入（前一列需點滿） */
export function isNodeUnlocked(node: SkillNode, ranks: Record<string, number>): boolean {
  if (node.row === 0) return true
  const nodes = SKILL_TREES[node.skillId] ?? []
  const prev = nodes.find((n) => n.branch === node.branch && n.row === node.row - 1)
  if (!prev) return true
  return (ranks[prev.id] ?? 0) >= prev.maxRank
}
