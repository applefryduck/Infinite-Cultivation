import { useGame } from '../../game/store'
import { CATEGORY_LABEL } from '../ui/labels'
import { NAMED_CHAINS } from '../../game/crafting/namedChains'

export function CodexPanel() {
  const state = useGame((s) => s.state)
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
              <div key={def.id} className={'codex-item' + (isNamed ? ' named' : '')} title={def.desc ?? ''}>
                <span className="codex-emoji">{def.emoji}</span>
                <span className="codex-name">{def.name}</span>
                <span className="codex-cat">{CATEGORY_LABEL[def.category]}</span>
                {isNamed && <span className="codex-star">★</span>}
              </div>
            )
          })}
      </div>
    </section>
  )
}
