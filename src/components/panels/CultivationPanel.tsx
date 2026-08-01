import { useState } from 'react'
import { useGame } from '../../game/store'
import { getStageInfo } from '../../game/realms'
import { formatNumber } from '../../game/formulas'
import { cultivationRate, pathLevel } from '../../game/stats'
import { PATHS } from '../../game/content/paths'
import type { Technique } from '../../game/content/paths'
import { candidatesFor, needLabel, materialEfficiency, resolveMaterial } from '../../game/materials'
import type { GameState } from '../../game/types'
import { getItemDef } from '../../game/content/items'
import { ATTR_MAP } from '../../game/content/attributes'
import { Collapsible } from '../ui/Collapsible'
import { tierName } from '../ui/Tier'

export function CultivationPanel() {
  const state = useGame((s) => s.state)
  const setTech = useGame((s) => s.setActiveTechnique)
  const rate = cultivationRate(state, Date.now())

  return (
    <>
      <section className="panel">
        <h2>修練</h2>
        <p className="hint">
          選擇修煉方式掛機吐納。消耗素材者速度更快、鍛鍊屬性更多，素材耗盡自動退回免費功法。
        </p>
        <div className="cur-rate">
          目前修為速率 <strong>{formatNumber(rate)}/秒</strong>
        </div>
      </section>

      {PATHS.map((path) => {
        const lv = pathLevel(state, path.id)
        const isActive = state.activePathId === path.id
        return (
          <Collapsible
            key={path.id}
            id={`path-${path.id}`}
            defaultOpen={isActive}
            title={
              <span className="path-head-inline">
                <span className="path-name">{path.name}</span>
                <span className="path-lv">Lv.{lv}</span>
                <span className="path-role">{path.combatRole}</span>
              </span>
            }
            badge={isActive ? '修練中' : undefined}
          >
            <p className="path-desc">{path.desc}</p>
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
          </Collapsible>
        )
      })}
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
        {!locked && tech.trains.length > 0 && (
          <span className="tech-trains">
            {tech.trains.map((t) => {
              const def = ATTR_MAP[t.attr]
              return (
                <span key={t.attr} className="train-tag" style={{ color: def.color, borderColor: def.color }}>
                  {def.emoji} {def.name} +{t.per}/秒
                </span>
              )
            })}
          </span>
        )}
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

function formatEta(sec: number): string {
  if (sec <= 0) return '就緒'
  if (sec < 60) return `${sec} 秒`
  if (sec < 3600) return `${Math.floor(sec / 60)} 分 ${sec % 60} 秒`
  const h = Math.floor(sec / 3600)
  return `${h} 小時 ${Math.floor((sec % 3600) / 60)} 分`
}
