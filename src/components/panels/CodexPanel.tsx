import { useState } from 'react'
import { useGame } from '../../game/store'
import { ItemDetailModal } from '../ItemDetailModal'
import { CATEGORY_LABEL } from '../ui/labels'
import { TierBadge } from '../ui/Tier'
import { NAMED_CHAINS } from '../../game/crafting/namedChains'

export function CodexPanel() {
  const state = useGame((s) => s.state)
  const [selected, setSelected] = useState<string | null>(null)
  const discoveredItems = Object.values(state.discoveredItems)
  const discoveredCount = discoveredItems.length
  const namedTotal = Object.keys(NAMED_CHAINS).length
  const namedFound = discoveredItems.filter((d) => Object.values(NAMED_CHAINS).some((n) => n.name === d.name)).length

  return (
    <section className="panel">
      <h2>藏經閣 · 圖鑑</h2>
      <p className="hint">
        已發現配方 <strong>{discoveredCount}</strong> 種 · 招牌秘物 <strong>{namedFound}/{namedTotal}</strong>
      </p>
      {discoveredCount === 0 && <p className="hint">尚無發現。到丹爐嘗試組合素材吧。</p>}
      <div className="codex-grid">
        {discoveredItems
          .sort((a, b) => b.tier - a.tier)
          .map((def) => {
            const isNamed = Object.values(NAMED_CHAINS).some((n) => n.name === def.name)
            return (
              <button
                key={def.id}
                className={'codex-item' + (isNamed ? ' named' : '')}
                title={def.desc ?? '點擊查看詳情'}
                onClick={() => setSelected(def.id)}
              >
                <span className="codex-emoji">{def.emoji}</span>
                <span className="codex-name">{def.name}</span>
                <span className="codex-cat">{CATEGORY_LABEL[def.category]}</span>
                <TierBadge tier={def.tier} compact />
                {isNamed && <span className="codex-star">★</span>}
              </button>
            )
          })}
      </div>
      {selected && <ItemDetailModal itemId={selected} onClose={() => setSelected(null)} />}
    </section>
  )
}
