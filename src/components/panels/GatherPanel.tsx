import { useGame } from '../../game/store'
import { GATHER_SKILLS } from '../../game/content/gathering'
import { getItemDef } from '../../game/content/items'
import { levelForXp, levelProgress } from '../../game/xp'

export function GatherPanel() {
  const state = useGame((s) => s.state)
  const setGather = useGame((s) => s.setActiveGather)

  return (
    <>
      <section className="panel">
        <h2>採集</h2>
        <p className="hint">採集可與修煉並行掛機。選擇一項動作開始採集，再次點擊可停止。</p>
      </section>

      {GATHER_SKILLS.map((skill) => {
        const xp = state.gatherXp[skill.id] ?? 0
        const lv = levelForXp(xp)
        const prog = levelProgress(xp)
        return (
          <section key={skill.id} className="panel">
            <div className="skill-head">
              <span className="skill-title">
                {skill.emoji} {skill.name}
              </span>
              <span className="skill-lv">Lv.{lv}</span>
            </div>
            <div className="skill-xp-track">
              <div className="skill-xp-fill" style={{ width: `${prog * 100}%` }} />
            </div>
            <div className="tech-list">
              {skill.actions.map((a) => {
                const locked = lv < a.unlockLevel
                const active = state.activeGatherId === a.id
                const produced = getItemDef(a.produces)
                return (
                  <button
                    key={a.id}
                    className={'tech-btn' + (active ? ' active' : '') + (locked ? ' locked' : '')}
                    disabled={locked}
                    onClick={() => setGather(active ? undefined : a.id)}
                  >
                    <span className="tech-name">
                      {a.name} {active && <span className="live-dot">採集中</span>}
                    </span>
                    <span className="tech-info">
                      {locked ? `需 Lv.${a.unlockLevel}` : `產 ${produced?.emoji ?? ''}${produced?.name} · ${a.cycleSec}秒/次 · +${a.xp}xp`}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        )
      })}
    </>
  )
}
