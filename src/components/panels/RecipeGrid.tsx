import { useState } from 'react'
import { useGame } from '../../game/store'
import { SEED_ELEMENTS, getItemDef } from '../../game/content/items'
import type { ItemDef } from '../../game/content/items'
import { recipeKey } from '../../game/crafting/provider'
import { TierBadge } from '../ui/Tier'
import { ItemDetailModal } from '../ItemDetailModal'

/**
 * 合成表：已知素材兩兩組合的網格。
 * 已探索的組合顯示結果（解除迷霧），未探索顯示 ？，點擊即嘗試合成。
 */
export function RecipeGrid() {
  const state = useGame((s) => s.state)
  const combine = useGame((s) => s.combine)
  const [detail, setDetail] = useState<string | null>(null)
  const [onlyKnown, setOnlyKnown] = useState(false)

  // 軸上的素材：種子元素 + 持有中 + 已發現（可作為原料者）
  const axisIds = Array.from(
    new Set([
      ...SEED_ELEMENTS.map((e) => e.id),
      ...Object.keys(state.inventory).filter((id) => (state.inventory[id] ?? 0) >= 1),
      ...Object.values(state.discovered),
    ]),
  )
    .map((id) => getItemDef(id))
    .filter((d): d is ItemDef => !!d && d.category !== 'artifact')
    .sort((a, b) => a.tier - b.tier || a.category.localeCompare(b.category))

  const pairs = axisIds.length
  const knownCount = Object.keys(state.discovered).length
  const totalPairs = (pairs * (pairs + 1)) / 2

  return (
    <>
      <div className="grid-toolbar">
        <span className="grid-stat">
          已探索 <strong>{knownCount}</strong> / {totalPairs} 組合
        </span>
        <label className="grid-filter">
          <input type="checkbox" checked={onlyKnown} onChange={(e) => setOnlyKnown(e.target.checked)} />
          僅顯示已知
        </label>
      </div>

      {axisIds.length === 0 && <p className="hint">尚無素材，先去採集或以種子元素嘗試合成。</p>}

      <div className="rg-scroll">
        <table className="recipe-grid">
          <thead>
            <tr>
              <th className="rg-corner" />
              {axisIds.map((col) => (
                <th key={col.id} className="rg-col" title={`${col.name}（${col.category}）`}>
                  <span className="rg-emoji">{col.emoji}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {axisIds.map((row) => (
              <tr key={row.id}>
                <th className="rg-row" title={row.name}>
                  <span className="rg-emoji">{row.emoji}</span>
                  <span className="rg-rowname">{row.name}</span>
                </th>
                {axisIds.map((col) => {
                  const key = recipeKey(row.id, col.id)
                  const resultId = state.discovered[key]
                  const result = resultId ? getItemDef(resultId) : undefined
                  if (onlyKnown && !result) return <td key={col.id} className="rg-cell hidden" />
                  return (
                    <td key={col.id} className="rg-cell">
                      {result ? (
                        <button
                          className="rg-known"
                          title={`${row.name} + ${col.name} → ${result.name}`}
                          onClick={() => setDetail(result.id)}
                        >
                          {result.emoji}
                        </button>
                      ) : (
                        <button
                          className="rg-fog"
                          title={`嘗試 ${row.name} + ${col.name}`}
                          onClick={() => combine(row.id, col.id)}
                        >
                          ？
                        </button>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="hint rg-hint">
        點 <span className="rg-fog inline">？</span> 直接嘗試該組合；已知組合點擊可看詳情與批量煉製。
      </p>

      {/* 已發現配方列表 */}
      {knownCount > 0 && (
        <div className="known-list">
          <h4>已發現配方</h4>
          {Object.entries(state.discovered).map(([key, id]) => {
            const result = getItemDef(id)
            if (!result) return null
            const inputs = key.startsWith('refine|')
              ? [getItemDef(key.slice('refine|'.length))]
              : key.split('+').map(getItemDef)
            return (
              <button key={key} className="known-row" onClick={() => setDetail(id)}>
                <span className="known-inputs">
                  {inputs.map((i, n) => (
                    <span key={n}>
                      {n > 0 && ' + '}
                      {i?.emoji} {i?.name}
                    </span>
                  ))}
                </span>
                <span className="known-arrow">→</span>
                <span className="known-result">
                  {result.emoji} {result.name}
                </span>
                <TierBadge tier={result.tier} compact />
              </button>
            )
          })}
        </div>
      )}

      {detail && <ItemDetailModal itemId={detail} onClose={() => setDetail(null)} />}
    </>
  )
}
