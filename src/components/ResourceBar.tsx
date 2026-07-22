import { useGame } from '../game/store'
import { cultivationSpeed, formatNumber } from '../game/formulas'

export function ResourceBar() {
  const state = useGame((s) => s.state)
  const speed = cultivationSpeed(state)

  return (
    <div className="resource-bar">
      <div className="res">
        <span className="res-label">靈石</span>
        <span className="res-value stones">{formatNumber(state.spiritStones)}</span>
      </div>
      <div className="res">
        <span className="res-label">道韻</span>
        <span className="res-value dao">{formatNumber(state.dao)}</span>
      </div>
      <div className="res">
        <span className="res-label">修煉速度</span>
        <span className="res-value">{formatNumber(speed)}/秒</span>
      </div>
      <div className="res">
        <span className="res-label">轉世</span>
        <span className="res-value">{state.reincarnations} 世</span>
      </div>
    </div>
  )
}
