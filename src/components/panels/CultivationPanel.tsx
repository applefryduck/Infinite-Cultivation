import { useGame } from '../../game/store'
import { getStageInfo } from '../../game/realms'
import { breakthroughCost, breakthroughChance, formatNumber } from '../../game/formulas'
import { aggregate, cultivationRate, pathLevel } from '../../game/stats'
import { PATHS } from '../../game/content/paths'
import { getItemDef } from '../../game/content/items'

export function CultivationPanel() {
  const state = useGame((s) => s.state)
  const doBreakthrough = useGame((s) => s.breakthrough)
  const setTech = useGame((s) => s.setActiveTechnique)

  const current = getStageInfo(state.stageIndex)
  const next = getStageInfo(state.stageIndex + 1)
  const cost = breakthroughCost(state.stageIndex)
  const chance = Math.min(0.99, breakthroughChance(state.stageIndex) + aggregate(state).breakthroughPct)
  const progress = Math.min(1, state.qi / cost)
  const ready = state.qi >= cost
  const rate = cultivationRate(state, Date.now())
  const etaSec = ready || rate <= 0 ? 0 : Math.ceil((cost - state.qi) / rate)

  return (
    <>
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
            <div className={'progress-fill' + (ready ? ' ready' : '')} style={{ width: `${progress * 100}%` }} />
          </div>
          <div className="progress-sub">
            {ready ? <span className="ready-text">修為圓滿，可嘗試突破</span> : <span>距圓滿約 {formatEta(etaSec)}</span>}
          </div>
        </div>

        <button className="btn btn-breakthrough" disabled={!ready} onClick={doBreakthrough}>
          突破 → {next.fullName}
        </button>
        <div className="breakthrough-chance">
          突破成功率 <strong>{Math.round(chance * 100)}%</strong>
          {next.isMajorBoundary && <span className="major-tag">跨大境界·凶險</span>}
          {state.pendingBreakthroughPct > 0 && <span className="buff-tag">破境丹 +{Math.round(state.pendingBreakthroughPct * 100)}%</span>}
        </div>
      </section>

      <section className="panel">
        <h2>修練體系</h2>
        <p className="hint">選擇修煉方式掛機吐納。消耗素材者速度更快，素材耗盡自動退回打坐。</p>
        {PATHS.map((path) => {
          const lv = pathLevel(state, path.id)
          return (
            <div key={path.id} className="path-block">
              <div className="path-head">
                <span className="path-name">{path.name}</span>
                <span className="path-lv">Lv.{lv}</span>
                <span className="path-role">{path.combatRole}</span>
              </div>
              <div className="tech-list">
                {path.techniques.map((tech) => {
                  const locked = tech.unlockRealm > state.stageIndex
                  const active = state.activePathId === path.id && state.activeTechId === tech.id
                  return (
                    <button
                      key={tech.id}
                      className={'tech-btn' + (active ? ' active' : '') + (locked ? ' locked' : '')}
                      disabled={locked}
                      onClick={() => setTech(path.id, tech.id)}
                      title={tech.desc}
                    >
                      <span className="tech-name">{tech.name}</span>
                      <span className="tech-info">
                        {locked ? (
                          `需 ${getStageInfo(tech.unlockRealm).fullName}`
                        ) : (
                          <>
                            {tech.qiPerSec}/秒基礎
                            {tech.inputs.length > 0 && (
                              <span className="tech-cost">
                                {' · 耗 '}
                                {tech.inputs.map((i) => `${inputName(i.itemId)}×${i.perSec}/s`).join('、')}
                              </span>
                            )}
                          </>
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </section>
    </>
  )
}

function inputName(itemId: string): string {
  if (itemId === 'spiritStones') return '靈石'
  return getItemDef(itemId)?.name ?? itemId
}

function formatEta(sec: number): string {
  if (sec <= 0) return '就緒'
  if (sec < 60) return `${sec} 秒`
  if (sec < 3600) return `${Math.floor(sec / 60)} 分 ${sec % 60} 秒`
  const h = Math.floor(sec / 3600)
  return `${h} 小時 ${Math.floor((sec % 3600) / 60)} 分`
}
