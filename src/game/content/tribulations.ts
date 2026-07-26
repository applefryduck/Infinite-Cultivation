import type { AttrId } from './attributes'

/** 渡劫成功後的永久收益 */
export interface TribulationReward {
  permaSpeedPct?: number // 永久修煉速度
  attrPoints?: number // 自由屬性點
  dao?: number // 道韻
  stones?: number // 靈石
  hpPct?: number // 永久氣血
  atkPct?: number // 永久攻擊
  breakthroughPct?: number // 永久突破率
  dropPct?: number // 永久掉率
}

export interface TribulationDef {
  id: string
  name: string
  emoji: string
  desc: string
  /** 考驗的屬性（各屬性提供抗性） */
  tests: AttrId[]
  /** 基礎難度：越高越難（與屬性對抗） */
  difficulty: number
  /** 出現此劫所需的最低氣運（氣運高才會出現好劫） */
  minLuck: number
  reward: TribulationReward
  /** 失敗懲罰倍率（1 = 標準：損失大量修為並停留原境界） */
  penalty: number
  /** 稀有度（顯示用）*/
  rarity: '常見' | '罕見' | '稀有' | '傳說'
}

export const TRIBULATIONS: TribulationDef[] = [
  {
    id: 't_small',
    name: '三九小雷劫',
    emoji: '⚡',
    desc: '二十七道天雷淬體，最為尋常穩妥的雷劫。',
    tests: ['daoXin'],
    difficulty: 10,
    minLuck: 0,
    reward: { permaSpeedPct: 0.05, attrPoints: 2, stones: 200 },
    penalty: 0.6,
    rarity: '常見',
  },
  {
    id: 't_heart',
    name: '心魔劫',
    emoji: '👁️',
    desc: '心魔叢生，映照前塵舊怨。唯有道心通明者可破。',
    tests: ['daoXin', 'wuXing'],
    difficulty: 16,
    minLuck: 0,
    reward: { permaSpeedPct: 0.12, attrPoints: 3, breakthroughPct: 0.03 },
    penalty: 1,
    rarity: '常見',
  },
  {
    id: 't_fire',
    name: '業火焚身劫',
    emoji: '🔥',
    desc: '業火煆燒血肉，肉身不堅者化為飛灰。',
    tests: ['genGu'],
    difficulty: 18,
    minLuck: 0,
    reward: { hpPct: 0.15, atkPct: 0.1, attrPoints: 3 },
    penalty: 1.2,
    rarity: '罕見',
  },
  {
    id: 't_nine',
    name: '九重天雷劫',
    emoji: '🌩️',
    desc: '九道天雷貫頂，凶險異常，然渡過者脫胎換骨。',
    tests: ['genGu', 'daoXin'],
    difficulty: 28,
    minLuck: 6,
    reward: { permaSpeedPct: 0.2, hpPct: 0.2, atkPct: 0.15, attrPoints: 5, dao: 2 },
    penalty: 1.5,
    rarity: '稀有',
  },
  {
    id: 't_soul',
    name: '神魂劫',
    emoji: '🔮',
    desc: '天威直擊識海，神識薄弱者神魂俱滅。',
    tests: ['shenShi', 'daoXin'],
    difficulty: 24,
    minLuck: 4,
    reward: { permaSpeedPct: 0.1, attrPoints: 4, dropPct: 0.1, stones: 800 },
    penalty: 1.2,
    rarity: '罕見',
  },
  {
    id: 't_fortune',
    name: '造化天劫',
    emoji: '🌟',
    desc: '傳說中的機緣之劫，天道垂憐，渡之可得大造化。',
    tests: ['qiYun', 'daoXin'],
    difficulty: 22,
    minLuck: 12,
    reward: { permaSpeedPct: 0.25, attrPoints: 6, dao: 5, stones: 3000, dropPct: 0.15 },
    penalty: 1,
    rarity: '傳說',
  },
]

/**
 * 依玩家氣運與境界，挑出可供選擇的劫種（3 個）。
 * 氣運越高，越可能出現稀有的高報酬劫。
 */
export function rollTribulationChoices(luck: number, majorIndex: number): TribulationDef[] {
  const eligible = TRIBULATIONS.filter((t) => t.minLuck <= luck)
  const pool = [...eligible]
  const picked: TribulationDef[] = []

  // 必定包含一個穩健選項
  const safe = pool.find((t) => t.id === 't_small')
  if (safe) {
    picked.push(safe)
    pool.splice(pool.indexOf(safe), 1)
  }

  // 其餘隨機挑選，氣運高時偏好稀有
  const weight = (t: TribulationDef) => {
    const rare = t.rarity === '傳說' ? 4 : t.rarity === '稀有' ? 3 : t.rarity === '罕見' ? 2 : 1
    return 1 + (luck / 10) * rare
  }
  while (picked.length < 3 && pool.length > 0) {
    const total = pool.reduce((sum, t) => sum + weight(t), 0)
    let r = Math.random() * total
    let idx = 0
    for (let i = 0; i < pool.length; i++) {
      r -= weight(pool[i])
      if (r <= 0) {
        idx = i
        break
      }
    }
    picked.push(pool[idx])
    pool.splice(idx, 1)
  }

  // 境界越高，難度隨之提升（於成功率計算時反映）
  void majorIndex
  return picked
}

/**
 * 渡劫成功率：屬性對抗難度。
 * 考驗的屬性總和越高越容易；境界越高越難。
 */
export function tribulationChance(
  trib: TribulationDef,
  attrs: Record<AttrId, number>,
  majorIndex: number,
): number {
  const power = trib.tests.reduce((sum, a) => sum + (attrs[a] ?? 0), 0)
  const difficulty = trib.difficulty * (1 + majorIndex * 0.35)
  const raw = power / (power + difficulty)
  // 保底 10%、上限 95%
  return Math.max(0.1, Math.min(0.95, raw))
}

export function getTribulation(id: string): TribulationDef | undefined {
  return TRIBULATIONS.find((t) => t.id === id)
}
