import { useState } from 'react'
import { useGame } from '../game/store'
import { getItemDef } from '../game/content/items'
import { findRecipe, canCraft, itemUses, craftFeeFor } from '../game/itemInfo'
import { CATEGORY_LABEL } from './ui/labels'
import { TierBadge } from './ui/Tier'

export function ItemDetailModal({ itemId, onClose }: { itemId: string; onClose: () => void }) {
  const state = useGame((s) => s.state)
  const craftKnown = useGame((s) => s.craftKnown)
  const useItem = useGame((s) => s.useItem)
  const equip = useGame((s) => s.equip)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  const def = getItemDef(itemId)
  if (!def) return null

  const owned = Math.floor(state.inventory[itemId] ?? 0)
  const recipe = findRecipe(state, itemId)
  const craftable = recipe ? canCraft(state, recipe) : { ok: false, missing: [] }
  const fee = craftFeeFor(state, itemId, def.tier)
  const affordable = state.spiritStones >= fee
  const uses = itemUses(state, def)

  function handleCraft(qty: number) {
    const r = craftKnown(itemId, qty)
    setMsg(
      r.ok
        ? { text: `煉製成功 ×${r.made ?? qty}！`, ok: true }
        : { text: r.error ?? '煉製失敗。', ok: false },
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal item-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-head">
          <h2>物品詳情</h2>
          <button className="settings-close" onClick={onClose} aria-label="關閉">
            ✕
          </button>
        </div>

        <div className="item-hero">
          <span className="item-hero-emoji">{def.emoji}</span>
          <div className="item-hero-info">
            <div className="item-hero-name">{def.name}</div>
            <div className="item-hero-meta">
              <TierBadge tier={def.tier} />
              {CATEGORY_LABEL[def.category]}
              {def.element && ` · ${def.element}屬`}
            </div>
            <div className="item-hero-owned">持有 {owned}</div>
          </div>
        </div>

        {def.desc && <p className="item-desc">{def.desc}</p>}

        {/* 配方 */}
        <div className="item-section">
          <h3>配方</h3>
          {recipe ? (
            <>
              <div className="recipe-row">
                {recipe.inputs.map((inp, i) => (
                  <span key={i} className="recipe-item">
                    {i > 0 && <span className="recipe-plus">+</span>}
                    <span className="recipe-chip">
                      {inp.emoji} {inp.name}
                      <span className="recipe-have">
                        {inp.category === 'element' ? '∞' : Math.floor(state.inventory[inp.id] ?? 0)}
                      </span>
                    </span>
                  </span>
                ))}
                <span className="recipe-arrow">→</span>
                <span className="recipe-chip result">
                  {def.emoji} {def.name}
                </span>
              </div>
              <div className="recipe-kind">{recipe.kind === 'refine' ? '提煉' : '合成'}</div>

              {fee > 0 && (
                <div className="craft-fee">
                  重複煉製耗費 <strong>{fee}</strong> 靈石（持有 {Math.floor(state.spiritStones)}）
                </div>
              )}
              {!craftable.ok ? (
                <button className="btn btn-breakthrough" disabled>
                  素材不足：{craftable.missing.join('、')}
                </button>
              ) : !affordable ? (
                <button className="btn btn-breakthrough" disabled>
                  靈石不足（需 {fee}）
                </button>
              ) : (
                <div className="craft-batch">
                  {[1, 5, 10].map((q) => (
                    <button key={q} className="btn btn-breakthrough" onClick={() => handleCraft(q)}>
                      煉製 ×{q}
                    </button>
                  ))}
                  <button className="btn btn-buy" onClick={() => handleCraft(999)}>
                    最大
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="hint">此物並非煉製所得（採集或戰鬥獲得）。</p>
          )}
        </div>

        {/* 功效 */}
        <div className="item-section">
          <h3>用途與功效</h3>
          {uses.length === 0 && <p className="hint">暫無特殊用途。</p>}
          <div className="use-list">
            {uses.map((u, i) => (
              <div key={i} className="use-row">
                <span className="use-label">{u.label}</span>
                <span className="use-detail">{u.detail}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 快捷操作 */}
        {owned > 0 && (def.effect || def.slot) && (
          <div className="item-actions">
            {def.effect && (
              <button
                className="btn btn-buy"
                onClick={() => {
                  useItem(itemId)
                  setMsg({ text: '已服用。', ok: true })
                }}
              >
                服用一個
              </button>
            )}
            {def.slot && (
              <button
                className="btn btn-buy"
                onClick={() => {
                  equip(itemId)
                  setMsg({ text: '已裝備。', ok: true })
                }}
              >
                裝備
              </button>
            )}
          </div>
        )}

        {msg && <p className={'save-msg ' + (msg.ok ? 'ok' : 'err')}>{msg.text}</p>}
      </div>
    </div>
  )
}
