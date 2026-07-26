import { useState } from 'react'
import { useGame } from '../../game/store'
import { getStageInfo } from '../../game/realms'
import { breakthroughCost, breakthroughChance, formatNumber } from '../../game/formulas'
import { aggregate, cultivationRate, pathLevel } from '../../game/stats'
import { PATHS } from '../../game/content/paths'
import type { Technique } from '../../game/content/paths'
import { candidatesFor, needLabel, materialEfficiency, resolveMaterial } from '../../game/materials'
import type { GameState } from '../../game/types'
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
                {path.techniques.map((tech) => (
                  <TechniqueRow
                    key={tech.id}
                    tech={tech}
                    pathId={path.id}
                    state={state}
                    onSelect={() => setTech(path.id, tech.id)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </section>
    </>
  )
}

function TechniqueRow({
  tech,
  pathId,
  state,
  onSelect,
}: {
  tech: Technique
  pathId: string
  state: GameState
  onSelect: () => void
}) {
  const setMaterialChoice = useGame((s) => s.setMaterialChoice)
  const [open, setOpen] = useState(false)

  const locked = tech.unlockRealm > state.stageIndex
  const active = state.activePathId === pathId && state.activeTechId === tech.id
  const hasChoice = tech.inputs.some((n) => n.category)

  return (
    <div className={'tech-wrap' + (active ? ' active' : '')}>
      <button
        className={'tech-btn' + (active ? ' active' : '') + (locked ? ' locked' : '')}
        disabled={locked}
        onClick={onSelect}
        title={tech.desc}
      >
        <span className="tech-name">{tech.name}</span>
        <span className="tech-info">
          {locked ? `需 ${getStageInfo(tech.unlockRealm).fullName}` : `${tech.qiPerSec}/秒基礎`}
        </span>
      </button>

      {!locked &&
        tech.inputs.map((need, i) => {
          const usingId = resolveMaterial(state, tech.id, i, need)
          const usingDef = usingId && usingId !== 'spiritStones' ? getItemDef(usingId) : undefined
          const stock =
            usingId === 'spiritStones'
              ? state.spiritStones
              : usingId
                ? (state.inventory[usingId] ?? 0)
                : 0
          const seconds = need.perSec > 0 ? stock / need.perSec : 0
          const options = candidatesFor(state, need)

          return (
            <div key={i} className="mat-row">
              <div className="mat-current">
                <span className="mat-label">耗</span>
                {usingDef ? (
                  <span className="mat-name">
                    {usingDef.emoji} {usingDef.name}
                  </span>
                ) : (
                  <span className="mat-name none">無 {needLabel(need)}</span>
                )}
                <span className="mat-rate">×{need.perSec}/秒</span>
                <span className={'mat-stock' + (stock <= 0 ? ' empty' : '')}>
                  存量 {formatNumber(Math.floor(stock))}
                  {stock > 0 && <span className="mat-eta">（約 {formatEta(Math.floor(seconds))}）</span>}
                </span>
              </div>

              {hasChoice && need.category && (
                <>
                  <button className="mat-toggle" onClick={() => setOpen(!open)}>
                    {open ? '收合' : `更換${needLabel(need)}`} ▾
                  </button>
                  {open && (
                    <div className="mat-options">
                      {options.length === 0 && <p className="hint">尚無可用的{needLabel(need)}。</p>}
                      {options.map(({ def, count }) => {
                        const chosen = usingId === def.id
                        return (
                          <button
                            key={def.id}
                            className={
                              'mat-option' + (chosen ? ' chosen' : '') + (count <= 0 ? ' disabled' : '')
                            }
                            disabled={count <= 0}
                            onClick={() => {
                              setMaterialChoice(tech.id, i, def.id)
                              setOpen(false)
                            }}
                          >
                            <span className="mo-emoji">{def.emoji}</span>
                            <span className="mo-name">{def.name}</span>
                            <span className="mo-tier">{tierName(def.tier)}</span>
                            <span className="mo-eff">效率 ×{materialEfficiency(def.tier).toFixed(1)}</span>
                            <span className="mo-count">{Math.floor(count)}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
    </div>
  )
}

const TIERS = ['凡品', '靈品', '玄品', '地品', '天品', '仙品', '神品']
function tierName(tier: number): string {
  return TIERS[Math.min(tier - 1, TIERS.length - 1)] ?? `${tier}階`
}

function formatEta(sec: number): string {
  if (sec <= 0) return '就緒'
  if (sec < 60) return `${sec} 秒`
  if (sec < 3600) return `${Math.floor(sec / 60)} 分 ${sec % 60} 秒`
  const h = Math.floor(sec / 3600)
  return `${h} 小時 ${Math.floor((sec % 3600) / 60)} 分`
}
