import type { GameState } from './types'
import type { ItemDef } from './content/items'
import { getItemDef } from './content/items'
import { PATHS } from './content/paths'
import { materialEfficiency } from './materials'
import { breakthroughCost, craftCost } from './formulas'
import { ATTR_MAP } from './content/attributes'

/** 配方來源：合成兩素材或提煉單素材 */
export interface RecipeInfo {
  kind: 'combine' | 'refine'
  inputs: ItemDef[]
}

/** 找出產出此物品的已知配方 */
export function findRecipe(state: GameState, itemId: string): RecipeInfo | undefined {
  const entry = Object.entries(state.discovered).find(([, id]) => id === itemId)
  if (!entry) return undefined
  const [key] = entry
  if (key.startsWith('refine|')) {
    const def = getItemDef(key.slice('refine|'.length))
    return def ? { kind: 'refine', inputs: [def] } : undefined
  }
  const defs = key.split('+').map(getItemDef).filter((d): d is ItemDef => !!d)
  return defs.length ? { kind: 'combine', inputs: defs } : undefined
}

/** 重複煉製所需靈石（首次發現免費） */
export function craftFeeFor(state: GameState, itemId: string, tier: number): number {
  const entry = Object.entries(state.discovered).find(([, id]) => id === itemId)
  if (!entry) return 0
  return craftCost(tier, state.stageIndex)
}

/** 此物品是否有足夠素材可製作 */
export function canCraft(state: GameState, recipe: RecipeInfo): { ok: boolean; missing: string[] } {
  const need: Record<string, number> = {}
  for (const d of recipe.inputs) {
    if (d.category === 'element') continue
    need[d.id] = (need[d.id] ?? 0) + 1
  }
  const missing: string[] = []
  for (const [id, n] of Object.entries(need)) {
    if ((state.inventory[id] ?? 0) < n) missing.push(getItemDef(id)?.name ?? id)
  }
  return { ok: missing.length === 0, missing }
}

export interface UseInfo {
  label: string
  detail: string
}

/**
 * 這個物品能派上什麼用場：服用效果、裝備加成、
 * 以及拿去修練時（作為素材）的效率與鍛鍊屬性。
 */
export function itemUses(_state: GameState, def: ItemDef): UseInfo[] {
  const uses: UseInfo[] = []

  // 消耗品效果
  if (def.effect) {
    const e = def.effect
    switch (e.kind) {
      case 'qi': {
        const amt = e.amount ?? Math.floor(e.k * breakthroughCost(Math.min(def.tier * 2, 12)))
        uses.push({ label: '服用', detail: `立即增加修為 ${amt}（煉成時固定）` })
        break
      }
      case 'breakthrough':
        uses.push({ label: '服用', detail: `下次突破成功率 +${Math.round(e.pct * 100)}%` })
        break
      case 'speedBuff':
        uses.push({
          label: '服用',
          detail: `修煉速度 +${Math.round(e.mult * 100)}%，持續 ${Math.floor(e.durationSec / 60)} 分鐘`,
        })
        break
      case 'permaSpeed':
        uses.push({ label: '服用', detail: `永久修煉速度 +${(e.pct * 100).toFixed(1)}%` })
        break
      case 'heal':
        uses.push({ label: '服用', detail: `戰鬥中回復 ${Math.round(e.pct * 100)}% 氣血（自動使用）` })
        break
    }
  }

  // 裝備加成
  if (def.slot && def.bonus) {
    const b = def.bonus
    const parts: string[] = []
    if (b.speedPct) parts.push(`修煉速度 +${Math.round(b.speedPct * 100)}%`)
    if (b.breakthroughPct) parts.push(`突破率 +${Math.round(b.breakthroughPct * 100)}%`)
    if (b.dropPct) parts.push(`掉率 +${Math.round(b.dropPct * 100)}%`)
    if (b.stonePct) parts.push(`靈石產出 +${Math.round(b.stonePct * 100)}%`)
    if (b.atk) parts.push(`攻擊 +${b.atk}`)
    if (b.def) parts.push(`防禦 +${b.def}`)
    if (b.hp) parts.push(`氣血 +${b.hp}`)
    uses.push({ label: `裝備（${def.slot}）`, detail: parts.join('、') })
  }

  // 作為修練素材
  const eff = materialEfficiency(def.tier)
  for (const path of PATHS) {
    for (const tech of path.techniques) {
      const matches = tech.inputs.some(
        (need) => need.category === def.category || need.itemId === def.id,
      )
      if (!matches) continue
      const qi = (tech.qiPerSec * eff).toFixed(1)
      const trains = tech.trains
        .map((t) => `${ATTR_MAP[t.attr].name} +${(t.per * eff).toFixed(1)}/秒`)
        .join('、')
      uses.push({
        label: `${path.name}·${tech.name}`,
        detail: `效率 ×${eff.toFixed(1)} → 約 ${qi} 修為/秒（基礎）；鍛鍊 ${trains}`,
      })
    }
  }

  // 可作為煉製素材
  if (['herb', 'ore', 'beast', 'spirit', 'material', 'essence', 'element'].includes(def.category)) {
    uses.push({ label: '煉製', detail: '可投入丹爐與其他素材合成或提煉' })
  }

  return uses
}
