import { useGame } from '../../game/store'
import { getItemDef } from '../../game/content/items'
import type { ItemDef } from '../../game/content/items'
import { CATEGORY_LABEL, EFFECT_LABEL } from '../ui/labels'

export function InventoryPanel() {
  const state = useGame((s) => s.state)
  const useItem = useGame((s) => s.useItem)
  const equip = useGame((s) => s.equip)
  const unequip = useGame((s) => s.unequip)

  const items = Object.entries(state.inventory)
    .filter(([, n]) => n >= 1)
    .map(([id, n]) => ({ def: getItemDef(id), count: Math.floor(n) }))
    .filter((x): x is { def: ItemDef; count: number } => !!x.def)
    .sort((a, b) => a.def.category.localeCompare(b.def.category) || b.def.tier - a.def.tier)

  return (
    <>
      <section className="panel">
        <h2>法寶欄</h2>
        <div className="equip-slots">
          {(['劍', '防', '器', '陣'] as const).map((slot) => {
            const id = state.equipped[slot]
            const def = id ? getItemDef(id) : undefined
            return (
              <div key={slot} className="equip-slot">
                <div className="equip-slot-label">{slot}</div>
                {def ? (
                  <button className="equip-filled" onClick={() => unequip(slot)} title="點擊卸下">
                    <span>{def.emoji}</span>
                    <span className="equip-name">{def.name}</span>
                    <span className="equip-bonus">{describeBonus(def)}</span>
                  </button>
                ) : (
                  <div className="equip-empty">空</div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <section className="panel">
        <h2>儲物袋</h2>
        {items.length === 0 && <p className="hint">空空如也，去採集或戰鬥獲取素材吧。</p>}
        <div className="inv-grid">
          {items.map(({ def, count }) => (
            <div key={def.id} className="inv-item">
              <div className="inv-top">
                <span className="inv-emoji">{def.emoji}</span>
                <span className="inv-count">×{count}</span>
              </div>
              <div className="inv-name">{def.name}</div>
              <div className="inv-cat">
                {CATEGORY_LABEL[def.category]}·{tierName(def.tier)}
              </div>
              {def.effect && <div className="inv-effect">{EFFECT_LABEL[def.effect.kind]}</div>}
              <div className="inv-actions">
                {def.effect && (
                  <button className="btn-mini" onClick={() => useItem(def.id)}>
                    服用
                  </button>
                )}
                {def.slot && (
                  <button className="btn-mini" onClick={() => equip(def.id)}>
                    裝備
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

function describeBonus(def: ItemDef): string {
  const b = def.bonus
  if (!b) return ''
  const parts: string[] = []
  if (b.speedPct) parts.push(`速+${Math.round(b.speedPct * 100)}%`)
  if (b.breakthroughPct) parts.push(`破+${Math.round(b.breakthroughPct * 100)}%`)
  if (b.dropPct) parts.push(`掉+${Math.round(b.dropPct * 100)}%`)
  if (b.stonePct) parts.push(`石+${Math.round(b.stonePct * 100)}%`)
  if (b.atk) parts.push(`攻+${b.atk}`)
  if (b.def) parts.push(`防+${b.def}`)
  if (b.hp) parts.push(`血+${b.hp}`)
  return parts.join(' ')
}

const TIERS = ['凡品', '靈品', '玄品', '地品', '天品', '仙品', '神品']
function tierName(tier: number): string {
  return TIERS[Math.min(tier - 1, TIERS.length - 1)] ?? `${tier}階`
}
