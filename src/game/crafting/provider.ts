import type { ItemCategory, ItemDef, ItemEffect, ArtifactBonus, EquipSlot } from '../content/items'
import { getItemDef } from '../content/items'
import { combineCategory, refineCategory } from './categoryRules'
import { genName, qualityPrefix, seedFromInputs } from './nameGen'
import { pickEmoji } from './emojiMap'
import { lookupNamedChain } from './namedChains'

export interface CraftResult {
  item: ItemDef
  named?: { stones?: number; dao?: number } // 招牌鏈首發獎勵
}

/** 煉製提供者介面：日後接真 LLM 只需換一個實作 */
export interface CraftProvider {
  combine(aId: string, bId: string, realmCap: number): CraftResult | null
  refine(aId: string, realmCap: number): CraftResult | null
}

function recipeKey(aId: string, bId?: string): string {
  return bId ? [aId, bId].sort().join('+') : `refine|${aId}`
}

function stableId(key: string): string {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0
  return 'craft_' + (h >>> 0).toString(36)
}

function computeTier(a: ItemDef, b: ItemDef | undefined, category: ItemCategory, realmCap: number): number {
  const maxIn = b ? Math.max(a.tier, b.tier) : a.tier
  let bump = 0
  if (b && a.category === b.category) bump += 1 // 同類合成
  if (a.category === 'essence' || b?.category === 'essence') bump += 1 // 催化
  if (category === 'essence') bump += 1 // 提煉濃縮
  return Math.max(1, Math.min(maxIn + bump, realmCap))
}

// 依 tier 產生丹藥效果（數值烘焙進去）
function pillEffect(seed: number, tier: number): { effect: ItemEffect; noun: string } {
  const types: { effect: ItemEffect; noun: string }[] = [
    { noun: '聚氣丹', effect: { kind: 'qi', k: 0.4 * tier } },
    { noun: '破境丹', effect: { kind: 'breakthrough', pct: Math.min(0.4, 0.05 * tier) } },
    { noun: '凝神丹', effect: { kind: 'speedBuff', mult: 0.2 * tier, durationSec: 300 } },
    { noun: '洗髓丹', effect: { kind: 'permaSpeed', pct: 0.005 * tier } },
    { noun: '回血丹', effect: { kind: 'heal', pct: Math.min(0.9, 0.3 + 0.1 * tier) } },
  ]
  return types[Math.abs(seed) % types.length]
}

// 依 tier 產生法寶槽位與加成
function artifactBonus(seed: number, tier: number): { slot: EquipSlot; bonus: ArtifactBonus; noun: string } {
  const types: { slot: EquipSlot; bonus: ArtifactBonus; noun: string }[] = [
    { slot: '劍', noun: '飛劍', bonus: { atk: 20 * tier, speedPct: 0.02 * tier } },
    { slot: '防', noun: '寶鎧', bonus: { def: 8 * tier, hp: 30 * tier, breakthroughPct: 0.02 * tier } },
    { slot: '器', noun: '寶鼎', bonus: { speedPct: 0.04 * tier, dropPct: 0.03 * tier } },
    { slot: '陣', noun: '陣盤', bonus: { stonePct: 0.08 * tier, speedPct: 0.02 * tier } },
  ]
  return types[Math.abs(seed) % types.length]
}

function build(a: ItemDef, b: ItemDef | undefined, category: ItemCategory, realmCap: number): CraftResult {
  const key = recipeKey(a.id, b?.id)
  const named = lookupNamedChain(key)
  const id = stableId(key)

  if (named) {
    const item: ItemDef = { ...named, id }
    return { item, named: named.firstDiscoveryReward }
  }

  const seed = seedFromInputs(a, b)
  const tier = computeTier(a, b, category, realmCap)
  const element = a.element ?? b?.element

  const base: ItemDef = {
    id,
    name: genName(category, tier, seed),
    emoji: pickEmoji(category, seed),
    category,
    tier,
    element,
  }

  const prefix = qualityPrefix(tier, seed >> 3)

  if (category === 'pill' || category === 'talisman') {
    const { effect, noun } = pillEffect(seed, tier)
    base.effect = effect
    base.name = prefix + noun
  } else if (category === 'artifact') {
    const { slot, bonus, noun } = artifactBonus(seed, tier)
    base.slot = slot
    base.bonus = bonus
    base.name = prefix + noun
  }

  return { item: base }
}

export const offlineProvider: CraftProvider = {
  combine(aId, bId, realmCap) {
    const a = getItemDef(aId)
    const b = getItemDef(bId)
    if (!a || !b) return null
    const outcome = combineCategory(a, b)
    if (!outcome.ok) return null
    return build(a, b, outcome.category, realmCap)
  },
  refine(aId, realmCap) {
    const a = getItemDef(aId)
    if (!a) return null
    const outcome = refineCategory(a)
    if (!outcome.ok) return null
    return build(a, undefined, outcome.category, realmCap)
  },
}

export { recipeKey }
