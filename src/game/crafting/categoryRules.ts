import type { ItemCategory, ItemDef } from '../content/items'

export type CraftOutcome =
  | { ok: true; category: ItemCategory }
  | { ok: false } // 潰散：無效組合

function has(a: ItemDef, b: ItemDef, cat: ItemCategory): ItemDef | undefined {
  if (a.category === cat) return a
  if (b.category === cat) return b
  return undefined
}

function isElement(item: ItemDef, name: string): boolean {
  return item.category === 'element' && item.name === name
}

/**
 * 決定 A + B 的結果類別（合成）。回傳 ok:false 代表潰散。
 * 順序：先看特例（含特定五行元素），再看類別配對表。
 */
export function combineCategory(a: ItemDef, b: ItemDef): CraftOutcome {
  const hasFire = isElement(a, '火') || isElement(b, '火')
  const hasQi = isElement(a, '靈氣') || isElement(b, '靈氣')
  const hasWood = isElement(a, '木') || isElement(b, '木')
  const hasThunder = isElement(a, '雷') || isElement(b, '雷')

  // --- 種子元素造基礎素材 ---
  if (hasWood && hasQi) return { ok: true, category: 'herb' }
  if ((isElement(a, '金') || isElement(b, '金') || isElement(a, '土') || isElement(b, '土')) && hasQi)
    return { ok: true, category: 'ore' }
  if ((isElement(a, '水') || isElement(b, '水')) && hasQi) return { ok: true, category: 'spirit' }

  // --- 煉丹：靈草 + 火/靈氣 → 丹藥；靈草 + 靈草 → 藥泥(material) ---
  if (has(a, b, 'herb')) {
    if (hasFire) return { ok: true, category: 'pill' }
    if (a.category === 'herb' && b.category === 'herb') return { ok: true, category: 'material' }
    if (has(a, b, 'beast')) return { ok: true, category: 'pill' } // 靈草+妖丹→丹藥
    if (has(a, b, 'essence')) return { ok: true, category: 'pill' }
  }

  // --- 煉器：礦石 + 火 → 器胚(material)；器胚 + 靈氣/雷 → 法寶 ---
  if (has(a, b, 'ore') && hasFire) return { ok: true, category: 'material' }
  if (has(a, b, 'material') && (hasQi || hasThunder)) return { ok: true, category: 'artifact' }
  if (has(a, b, 'ore') && (hasThunder || has(a, b, 'essence'))) return { ok: true, category: 'artifact' }

  // --- 符籙：精神/靈草 + 朱砂(此處以 material) ... 簡化：spirit + 靈氣 → 符籙 ---
  if (has(a, b, 'spirit') && hasQi) return { ok: true, category: 'talisman' }

  // --- 催化：essence + 任意可再煉物 → 提升（沿用另一方類別）---
  if (has(a, b, 'essence')) {
    const other = a.category === 'essence' ? b : a
    if (['herb', 'ore', 'material', 'spirit', 'beast'].includes(other.category))
      return { ok: true, category: other.category }
  }

  // --- 同類合成：升為同類（更高階）---
  if (a.category === b.category && ['herb', 'ore', 'spirit', 'beast', 'material'].includes(a.category))
    return { ok: true, category: a.category }

  return { ok: false }
}

/** 提煉（單輸入）：多數 → essence 本源；元素無法提煉 */
export function refineCategory(a: ItemDef): CraftOutcome {
  if (a.category === 'element') return { ok: false }
  return { ok: true, category: 'essence' }
}
