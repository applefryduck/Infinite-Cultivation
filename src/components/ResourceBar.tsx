import { useGame } from '../game/store'
import { formatNumber } from '../game/formulas'
import { cultivationRate } from '../game/stats'
import { getStageInfo } from '../game/realms'

export function ResourceBar() {
  const state = useGame((s) => s.state)
  const rate = cultivationRate(state, Date.now())
  const stage = getStageInfo(state.stageIndex)

  return (
    <div className="resource-bar">
      <div className="res">
        <span className="res-label">境界</span>
        <span className="res-value jade">{stage.fullName}</span>
      </div>
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
        <span className="res-value">{formatNumber(rate)}/秒</span>
      </div>
    </div>
  )
}
