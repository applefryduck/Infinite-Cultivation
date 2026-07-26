import type { FiveElement } from '../elements'

export type ItemCategory =
  | 'element' // 五行之源（種子）
  | 'herb' // 靈草
  | 'ore' // 礦石
  | 'beast' // 獸材（妖丹/獸血/妖魂）
  | 'spirit' // 精神類（夢境本源/魂玉）
  | 'material' // 中間靈材（藥泥/器胚）
  | 'essence' // 本源/精華（提煉產物，催化）
  | 'pill' // 丹藥（消耗品）
  | 'artifact' // 法寶（裝備）
  | 'talisman' // 符籙

export type EquipSlot = '劍' | '防' | '器' | '陣'

/** 丹藥/消耗品效果 */
export type ItemEffect =
  | { kind: 'qi'; k: number } // +修為 = k · tier · breakthroughCost
  | { kind: 'breakthrough'; pct: number } // 下次突破 +成功率
  | { kind: 'speedBuff'; mult: number; durationSec: number } // 限時提速
  | { kind: 'permaSpeed'; pct: number } // 永久提速
  | { kind: 'heal'; pct: number } // 戰鬥回血（回血丹）

/** 法寶加成 */
export interface ArtifactBonus {
  speedPct?: number
  breakthroughPct?: number
  dropPct?: number
  stonePct?: number
  atk?: number
  def?: number
  hp?: number
}

export interface ItemDef {
  id: string
  name: string
  emoji: string
  category: ItemCategory
  tier: number
  element?: FiveElement
  effect?: ItemEffect // pill/talisman
  slot?: EquipSlot // artifact
  bonus?: ArtifactBonus // artifact
  desc?: string
}

// ---- 執行期物品登錄表：靜態物品 + 玩家煉製發現的物品 ----
const registry = new Map<string, ItemDef>()

export function registerItem(def: ItemDef): void {
  registry.set(def.id, def)
}

export function getItemDef(id: string): ItemDef | undefined {
  return registry.get(id)
}

export function allItems(): ItemDef[] {
  return [...registry.values()]
}

// ---- 種子元素（開局解鎖、無限取用、不消耗）----
export const SEED_ELEMENTS: ItemDef[] = [
  { id: 'el_qi', name: '靈氣', emoji: '🌫️', category: 'element', tier: 1, desc: '天地間無處不在的修行之本。' },
  { id: 'el_metal', name: '金', emoji: '🪙', category: 'element', tier: 1, element: '金' },
  { id: 'el_wood', name: '木', emoji: '🌿', category: 'element', tier: 1, element: '木' },
  { id: 'el_water', name: '水', emoji: '💧', category: 'element', tier: 1, element: '水' },
  { id: 'el_fire', name: '火', emoji: '🔥', category: 'element', tier: 1, element: '火' },
  { id: 'el_earth', name: '土', emoji: '🪨', category: 'element', tier: 1, element: '土' },
  { id: 'el_thunder', name: '雷', emoji: '⚡', category: 'element', tier: 1, desc: '天威難測，煉器淬體之極。' },
]

// ---- 採集/戰鬥產出的基礎素材 ----
export const BASE_MATERIALS: ItemDef[] = [
  // 採藥：靈草
  { id: 'herb_1', name: '凝露草', emoji: '🌱', category: 'herb', tier: 1, element: '木' },
  { id: 'herb_2', name: '九葉靈芝', emoji: '🍀', category: 'herb', tier: 2, element: '木' },
  { id: 'herb_3', name: '赤血蓮', emoji: '🌺', category: 'herb', tier: 3, element: '火' },
  // 採礦：礦石
  { id: 'ore_1', name: '靈鐵', emoji: '🪨', category: 'ore', tier: 1, element: '金' },
  { id: 'ore_2', name: '玄鐵', emoji: '⛏️', category: 'ore', tier: 2, element: '金' },
  { id: 'ore_3', name: '寒玉晶', emoji: '💎', category: 'ore', tier: 3, element: '水' },
  // 觀想：精神類
  { id: 'spirit_1', name: '夢境碎片', emoji: '🌙', category: 'spirit', tier: 1 },
  { id: 'spirit_2', name: '夢境本源', emoji: '🔮', category: 'spirit', tier: 2 },
  { id: 'spirit_3', name: '精神靈砂', emoji: '✨', category: 'spirit', tier: 3 },
  // 戰鬥掉落：獸材
  { id: 'beast_dan_1', name: '低階妖丹', emoji: '🔴', category: 'beast', tier: 1 },
  { id: 'beast_dan_2', name: '中階妖丹', emoji: '🟠', category: 'beast', tier: 2 },
  { id: 'beast_dan_3', name: '上階妖丹', emoji: '🟣', category: 'beast', tier: 3 },
  { id: 'beast_blood', name: '妖獸精血', emoji: '🩸', category: 'beast', tier: 2 },
  { id: 'beast_soul', name: '妖魂', emoji: '👻', category: 'beast', tier: 2 },
  // 提煉催化
  { id: 'essence_soul', name: '魂玉', emoji: '🫧', category: 'essence', tier: 3, desc: '妖魂提煉之精，神識修煉聖品。' },
]

// 立即登錄所有靜態物品
for (const def of [...SEED_ELEMENTS, ...BASE_MATERIALS]) registerItem(def)

export const SEED_ELEMENT_IDS = SEED_ELEMENTS.map((e) => e.id)
