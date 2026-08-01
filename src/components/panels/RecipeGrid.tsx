import { useState } from 'react'
import { useGame } from '../../game/store'
import { SEED_ELEMENTS, getItemDef } from '../../game/content/items'
import type { ItemDef } from '../../game/content/items'
import { recipeKey } from '../../game/crafting/provider'
import { TierBadge, tierClass } from '../ui/Tier'
import { ItemDetailModal } from '../ItemDetailModal'

type Filter = 'all' | 'known' | 'untried'

/**
 * 探索台：選一個素材，列出它與其他素材的所有組合。
 * 已探索顯示結果，未試顯示 ？ 並可直接嘗試（首次發現免靈石）。
 * 規模為線性 O(N)，素材再多也不會失控。
 */
export function RecipeGrid() {
  const state = useGame((s) => s.state)
  const combine = useGame((s) => s.combine)
  const [picked, setPicked] = useState<string | null>(null)
  const [detail, setDetail] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')

  // 可用於組合的素材：種子元素 + 持有中 + 已發現（法寶不能再合成）
  const materials = Array.from(
    new Set([
      ...SEED_ELEMENTS.map((e) => e.id),
      ...Object.keys(state.inventory).filter((id) => (state.inventory[id] ?? 0) >= 1),
      ...Object.values(state.discovered),
    ]),
  )
    .map((id) => getItemDef(id))
    .filter((d): d is ItemDef => !!d && d.category !== 'artifact')
    .sort((a, b) => a.tier - b.tier || a.category.localeCompare(b.category))

  const pickedDef = picked ? getItemDef(picked) : undefined
  const knownCount = Object.keys(state.discovered).length

  // 選定素材與所有素材的配對
  const pairings = pickedDef
    ? materials.map((partner) => {
        const key = recipeKey(pickedDef.id, partner.id)
        const resultId = state.discovered[key]
        return { partner, result: resultId ? getItemDef(resultId) : undefined }
      })
    : []

  const shown = pairings.filter((p) =>
    filter === 'known' ? !!p.result : filter === 'untried' ? !p.result : true,
  )
  const knownHere = pairings.filter((p) => p.result).length

  function countOf(def: ItemDef): string {
    return def.category === 'element' ? '∞' : String(Math.floor(state.inventory[def.id] ?? 0))
  }

  return (
    <>
      <p className="hint">
        選一個素材，查看它的所有組合。已探索 <strong className="ok-num">{knownCount}</strong> 種配方。
        未試組合<b>首次發現免靈石</b>。
      </p>

      {/* 素材選擇 */}
      <div className="mat-picker">
        {materials.map((def) => (
          <button
            key={def.id}
            className={'mat-chip ' + tierClass(def.tier) + (picked === def.id ? ' picked' : '')}
            onClick={() => setPicked(picked === def.id ? null : def.id)}
            title={def.name}
          >
            <span className="mc-emoji">{def.emoji}</span>
            <span className="mc-name">{def.name}</span>
            <span className="mc-count">{countOf(def)}</span>
          </button>
        ))}
      </div>

      {!pickedDef && <p className="hint pick-hint">↑ 點選一個素材開始探索</p>}

      {pickedDef && (
        <div className="pairing-panel">
          <div className="pairing-head">
            <span className="ph-title">
              {pickedDef.emoji} {pickedDef.name} <TierBadge tier={pickedDef.tier} compact /> 的搭配
            </span>
            <span className="ph-stat">
              已知 {knownHere} / {pairings.length}
            </span>
          </div>

          <div className="pairing-filters">
            {(
              [
                ['all', '全部'],
                ['known', '已知'],
                ['untried', '未試'],
              ] as [Filter, string][]
            ).map(([f, label]) => (
              <button
                key={f}
                className={'pf-btn' + (filter === f ? ' active' : '')}
                onClick={() => setFilter(f)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="pairing-list">
            {shown.length === 0 && <p className="hint">沒有符合條件的組合。</p>}
            {shown.map(({ partner, result }) => (
              <button
                key={partner.id}
                className={'pair-row' + (result ? ' known' : '')}
                onClick={() => (result ? setDetail(result.id) : combine(pickedDef.id, partner.id))}
                title={
                  result
                    ? `${pickedDef.name} + ${partner.name} → ${result.name}（點擊看詳情）`
                    : `嘗試 ${pickedDef.name} + ${partner.name}`
                }
              >
                <span className="pr-plus">＋</span>
                <span className="pr-partner">
                  {partner.emoji} {partner.name}
                </span>
                <span className="pr-count">{countOf(partner)}</span>
                <span className="pr-arrow">→</span>
                {result ? (
                  <span className="pr-result">
                    {result.emoji} {result.name}
                    <TierBadge tier={result.tier} compact />
                  </span>
                ) : (
                  <span className="pr-unknown">？ 未試</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {detail && <ItemDetailModal itemId={detail} onClose={() => setDetail(null)} />}
    </>
  )
}
