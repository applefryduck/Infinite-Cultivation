import { useGame } from '../../game/store'
import { GATHER_SKILLS } from '../../game/content/gathering'
import { getItemDef } from '../../game/content/items'
import { levelForXp, levelProgress, xpForLevel, MAX_LEVEL } from '../../game/xp'
import { formatNumber } from '../../game/formulas'
import { SkillTree } from '../SkillTree'
import { skillBonuses, effectiveCycle } from '../../game/skillEffects'
import { pointsFromLevel, spentPoints } from '../../game/content/skillTrees'

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
        const curLevelXp = xpForLevel(lv)
        const nextLevelXp = xpForLevel(lv + 1)
        const intoLevel = Math.floor(xp - curLevelXp)
        const levelSpan = Math.floor(nextLevelXp - curLevelXp)
        const remaining = Math.max(0, Math.ceil(nextLevelXp - xp))
        const maxed = lv >= MAX_LEVEL
        const sb = skillBonuses(state, skill.id)
        const avail = pointsFromLevel(lv) - spentPoints(skill.id, state.skillNodes ?? {})

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
            <div className="skill-xp-info">
              {maxed ? (
                <span>已達最高等級</span>
              ) : (
                <>
                  <span>
                    {formatNumber(intoLevel)} / {formatNumber(levelSpan)} xp（{Math.floor(prog * 100)}%）
                  </span>
                  <span>距 Lv.{lv + 1} 還需 {formatNumber(remaining)} xp</span>
                </>
              )}
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
                      {locked
                        ? `需 Lv.${a.unlockLevel}`
                        : `產 ${produced?.emoji ?? ''}${produced?.name} · ${effectiveCycle(a.cycleSec, sb.gatherSpeed).toFixed(1)}秒/次 · +${Math.round(a.xp * (1 + sb.gatherXp))}xp`}
                    </span>
                  </button>
                )
              })}
            </div>

            <details className="skill-tree">
              <summary className="skill-tree-head">
                🌳 {skill.name}·技能樹
                {avail > 0 && <span className="soon-tag point-tag">{avail} 點可用</span>}
              </summary>
              <SkillTree skillId={skill.id} kind="gather" />
            </details>
          </section>
        )
      })}
    </>
  )
}
