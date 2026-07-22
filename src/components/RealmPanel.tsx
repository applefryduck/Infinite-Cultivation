import { useGame } from '../game/store'
import { getStageInfo } from '../game/realms'
import {
  breakthroughCost,
  breakthroughChance,
  cultivationSpeed,
  formatNumber,
} from '../game/formulas'

export function RealmPanel() {
  const state = useGame((s) => s.state)
  const doBreakthrough = useGame((s) => s.breakthrough)

  const current = getStageInfo(state.stageIndex)
  const next = getStageInfo(state.stageIndex + 1)
  const cost = breakthroughCost(state.stageIndex)
  const chance = breakthroughChance(state.stageIndex)
  const progress = Math.min(1, state.qi / cost)
  const ready = state.qi >= cost
  const speed = cultivationSpeed(state)
  const etaSec = ready ? 0 : Math.ceil((cost - state.qi) / speed)

  return (
    <section className="panel realm-panel">
      <div className="realm-current">
        <div className="realm-badge">{current.realmName}</div>
        <div className="realm-stage">{current.stageName}</div>
      </div>

      <div className="cultivation-progress">
        <div className="progress-head">
          <span>修為</span>
          <span>
            {formatNumber(state.qi)} / {formatNumber(cost)}
          </span>
        </div>
        <div className="progress-track">
          <div
            className={'progress-fill' + (ready ? ' ready' : '')}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="progress-sub">
          {ready ? (
            <span className="ready-text">修為圓滿，可嘗試突破</span>
          ) : (
            <span>距圓滿約 {formatEta(etaSec)}</span>
          )}
        </div>
      </div>

      <button className="btn btn-breakthrough" disabled={!ready} onClick={doBreakthrough}>
        突破 → {next.fullName}
      </button>
      <div className="breakthrough-chance">
        突破成功率 <strong>{Math.round(chance * 100)}%</strong>
        {next.isMajorBoundary && <span className="major-tag">跨大境界·凶險</span>}
      </div>
    </section>
  )
}

function formatEta(sec: number): string {
  if (sec <= 0) return '就緒'
  if (sec < 60) return `${sec} 秒`
  if (sec < 3600) return `${Math.floor(sec / 60)} 分 ${sec % 60} 秒`
  const h = Math.floor(sec / 3600)
  return `${h} 小時 ${Math.floor((sec % 3600) / 60)} 分`
}
