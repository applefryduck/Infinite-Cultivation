import type { GameState } from './types'
import { PATH_MAP, getTechnique } from './content/paths'
import { getItemDef } from './content/items'
import { levelForXp } from './xp'
import { ATTRIBUTES, attrPoints } from './content/attributes'
import type { AttrId } from './content/attributes'

/** 某屬性的總點數＝鍛鍊所得 + 自由分配 */
export function attrValue(state: GameState, id: AttrId): number {
  return attrPoints(state.attrTrain?.[id] ?? 0) + (state.attrAlloc?.[id] ?? 0)
}

/** 全部屬性點數 */
export function allAttrValues(state: GameState): Record<AttrId, number> {
  const out = {} as Record<AttrId, number>
  for (const a of ATTRIBUTES) out[a.id] = attrValue(state, a.id)
  return out
}

export interface Aggregated {
  speedPct: number // 修煉速度加成（法寶/永久/招牌）
  breakthroughPct: number
  dropPct: number
  stonePct: number
  craftSuccessPct: number
  artifactSlots: number // 額外御寶槽
  atkFlat: number
  defFlat: number
  hpFlat: number
  hpPct: number
  atkPct: number
  failLossReduce: number
}

/** 目前各體系等級 */
export function pathLevel(state: GameState, pathId: string): number {
  return levelForXp(state.pathXp[pathId] ?? 0)
}

/** 加總所有來源的加成 */
export function aggregate(state: GameState): Aggregated {
  const agg: Aggregated = {
    speedPct: state.permaSpeedPct,
    breakthroughPct: state.pendingBreakthroughPct,
    dropPct: 0,
    stonePct: 0,
    craftSuccessPct: 0,
    artifactSlots: 0,
    atkFlat: 0,
    defFlat: 0,
    hpFlat: 0,
    hpPct: 0,
    atkPct: 0,
    failLossReduce: 0,
  }

  // 各體系招牌加成（依等級）
  for (const path of Object.values(PATH_MAP)) {
    const b = path.signature(pathLevel(state, path.id))
    agg.breakthroughPct += b.breakthroughPct ?? 0
    agg.craftSuccessPct += b.craftSuccessPct ?? 0
    agg.dropPct += b.dropPct ?? 0
    agg.artifactSlots += b.artifactSlots ?? 0
    agg.hpPct += b.hpPct ?? 0
    agg.atkPct += b.atkPct ?? 0
    agg.failLossReduce += b.failLossReduce ?? 0
  }

  // 渡劫永久收益
  agg.hpPct += state.permaHpPct ?? 0
  agg.atkPct += state.permaAtkPct ?? 0
  agg.breakthroughPct += state.permaBreakthroughPct ?? 0
  agg.dropPct += state.permaDropPct ?? 0

  // 人物屬性衍生效果
  const attr = allAttrValues(state)
  agg.hpPct += attr.genGu * 0.02
  agg.defFlat += attr.genGu * 1.5
  agg.speedPct += attr.wuXing * 0.012
  agg.craftSuccessPct += attr.shenShi * 0.008
  agg.artifactSlots += Math.floor(attr.shenShi / 20)
  agg.dropPct += attr.qiYun * 0.01
  agg.breakthroughPct += attr.daoXin * 0.005
  agg.failLossReduce += attr.daoXin * 0.01

  // 裝備法寶
  for (const itemId of Object.values(state.equipped)) {
    if (!itemId) continue
    const def = getItemDef(itemId)
    if (!def?.bonus) continue
    agg.speedPct += def.bonus.speedPct ?? 0
    agg.breakthroughPct += def.bonus.breakthroughPct ?? 0
    agg.dropPct += def.bonus.dropPct ?? 0
    agg.stonePct += def.bonus.stonePct ?? 0
    agg.atkFlat += def.bonus.atk ?? 0
    agg.defFlat += def.bonus.def ?? 0
    agg.hpFlat += def.bonus.hp ?? 0
  }

  return agg
}

/** 目前 buff 的速度倍率（1 + Σmult） */
export function buffSpeedMult(state: GameState, now: number): number {
  let mult = 1
  for (const b of state.buffs) {
    if (b.kind === 'speed' && b.expiresAt > now) mult += b.mult
  }
  return mult
}

/** 全域修煉速度倍率 */
export function globalSpeedMult(state: GameState, now: number): number {
  const agg = aggregate(state)
  return (
    (1 + state.techniqueLevel * 0.35) *
    (1 + state.dao * 0.02) *
    (1 + state.stageIndex * 0.12) *
    (1 + agg.speedPct) *
    buffSpeedMult(state, now)
  )
}

/** 目前 active technique 的每秒修為（不含材料是否足夠的判斷） */
export function cultivationRate(state: GameState, now: number): number {
  const tech = getTechnique(state.activePathId, state.activeTechId)
  if (!tech) return 0
  const masteryLv = levelForXp(state.techMastery[tech.id] ?? 0)
  const masteryBonus = 1 + masteryLv * 0.01
  return tech.qiPerSec * globalSpeedMult(state, now) * masteryBonus
}

export interface CombatStats {
  maxHp: number
  atk: number
  def: number
  crit: number
  attackCount: number // 御寶多段
  role: '術法' | '肉搏' | '御劍'
}

/** 依主戰體系與裝備計算戰鬥數值 */
export function combatStats(state: GameState): CombatStats {
  const agg = aggregate(state)
  const tixiuLv = pathLevel(state, 'tixiu')
  const mainId = state.combat.mode === 'idle' ? state.activePathId : state.activePathId
  const path = PATH_MAP[mainId] ?? PATH_MAP['lingxiu']
  const mainLv = pathLevel(state, path.id)

  const maxHp = Math.floor((100 + tixiuLv * 15 + agg.hpFlat) * (1 + agg.hpPct))
  const atkBase = path.combatRole === '肉搏' ? 10 + mainLv * 3 : path.combatRole === '術法' ? 10 + mainLv * 3 : 10 + mainLv * 2
  const atk = Math.floor((atkBase + agg.atkFlat) * (1 + agg.atkPct))
  const def = 5 + tixiuLv * 2 + agg.defFlat
  const shenshiLv = pathLevel(state, 'shenshi')
  const crit = Math.min(0.6, 0.05 + shenshiLv * 0.003 + attrValue(state, 'shenShi') * 0.003)
  const attackCount = 1 + agg.artifactSlots

  return { maxHp, atk, def, crit, attackCount, role: path.combatRole }
}
