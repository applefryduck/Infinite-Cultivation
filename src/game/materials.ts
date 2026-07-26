import type { GameState } from './types'
import type { MaterialNeed } from './content/paths'
import { allItems, getItemDef } from './content/items'
import type { ItemDef } from './content/items'

/** 素材品階帶來的效率倍率：品階越高，同樣消耗換得更多修為 */
export function materialEfficiency(tier: number): number {
  return 1 + (tier - 1) * 0.6
}

/** 某個需求可用的素材清單（依品階排序，含儲物袋存量） */
export function candidatesFor(state: GameState, need: MaterialNeed): { def: ItemDef; count: number }[] {
  if (need.itemId) {
    if (need.itemId === 'spiritStones') return []
    const def = getItemDef(need.itemId)
    return def ? [{ def, count: state.inventory[def.id] ?? 0 }] : []
  }
  if (!need.category) return []
  return allItems()
    .filter((d) => d.category === need.category && d.category !== 'element')
    .map((def) => ({ def, count: state.inventory[def.id] ?? 0 }))
    .sort((a, b) => a.def.tier - b.def.tier || a.def.name.localeCompare(b.def.name))
}

/**
 * 決定某需求實際要消耗的素材 id。
 * 優先採用玩家指定的選擇；若未指定或已用盡，退而選擇「有存量中品階最低」的
 * （保留高階素材給玩家自行運用）。
 */
export function resolveMaterial(state: GameState, techId: string, index: number, need: MaterialNeed): string | undefined {
  if (need.itemId) return need.itemId

  const key = `${techId}:${index}`
  const picked = state.materialChoice?.[key]
  if (picked && (state.inventory[picked] ?? 0) > 0) return picked

  const available = candidatesFor(state, need).filter((c) => c.count > 0)
  if (available.length === 0) return picked ?? undefined
  return available[0].def.id
}

/** 需求的顯示名稱（類別型顯示為「靈草（任一）」風格） */
export function needLabel(need: MaterialNeed): string {
  if (need.itemId === 'spiritStones') return '靈石'
  if (need.itemId) return getItemDef(need.itemId)?.name ?? need.itemId
  return CATEGORY_MATERIAL_LABEL[need.category ?? ''] ?? '素材'
}

const CATEGORY_MATERIAL_LABEL: Record<string, string> = {
  herb: '靈草',
  ore: '礦石',
  beast: '獸材',
  spirit: '精神靈材',
  essence: '本源',
  material: '靈材',
  pill: '丹藥',
}
