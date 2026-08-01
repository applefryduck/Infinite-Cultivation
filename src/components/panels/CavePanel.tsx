import { useGame } from '../../game/store'
import {
  techniqueUpgradeCost,
  spiritRootUpgradeCost,
  spiritRootMultiplier,
  daoOnReincarnation,
  REINCARNATION_MIN_STAGE,
  formatNumber,
} from '../../game/formulas'
import { getStageInfo } from '../../game/realms'
import { CRAFT_SKILLS } from '../../game/content/gathering'
import { levelForXp, levelProgress } from '../../game/xp'
import { SkillTree } from '../SkillTree'
import { pointsFromLevel, spentPoints } from '../../game/content/skillTrees'

export function CavePanel() {
  const state = useGame((s) => s.state)
  const upgradeTechnique = useGame((s) => s.upgradeTechnique)
  const upgradeSpiritRoot = useGame((s) => s.upgradeSpiritRoot)
  const reincarnate = useGame((s) => s.reincarnate)

  const techCost = techniqueUpgradeCost(state.techniqueLevel)
  const rootCost = spiritRootUpgradeCost(state.spiritRootLevel)
  const canReincarnate = state.maxStageIndex >= REINCARNATION_MIN_STAGE
  const daoGain = daoOnReincarnation(state.maxStageIndex)
  const minRealm = getStageInfo(REINCARNATION_MIN_STAGE)

  return (
    <>
      <section className="panel">
        <h2>洞府 · 道基</h2>
        <div className="upgrade-row">
          <div className="upgrade-info">
            <div className="upgrade-name">
              參悟功法 <span className="lv">Lv.{state.techniqueLevel}</span>
            </div>
            <div className="upgrade-desc">全域修煉速度 +35% / 級</div>
          </div>
          <button className="btn btn-buy" disabled={state.spiritStones < techCost} onClick={upgradeTechnique}>
            {formatNumber(techCost)} 靈石
          </button>
        </div>
        <div className="upgrade-row">
          <div className="upgrade-info">
            <div className="upgrade-name">
              溫養靈根 <span className="lv">Lv.{state.spiritRootLevel}</span>
            </div>
            <div className="upgrade-desc">突破靈石產出 ×{spiritRootMultiplier(state.spiritRootLevel).toFixed(2)}</div>
          </div>
          <button className="btn btn-buy" disabled={state.spiritStones < rootCost} onClick={upgradeSpiritRoot}>
            {formatNumber(rootCost)} 靈石
          </button>
        </div>
      </section>

      {CRAFT_SKILLS.map((cs) => {
        const xp = state.craftXp[cs.id] ?? 0
        const lv = levelForXp(xp)
        const avail = pointsFromLevel(lv) - spentPoints(cs.id, state.skillNodes ?? {})
        return (
          <section key={cs.id} className="panel">
            <div className="skill-head">
              <span className="skill-title">
                {cs.emoji} {cs.name}
              </span>
              <span className="skill-lv">Lv.{lv}</span>
            </div>
            <div className="skill-xp-track">
              <div className="skill-xp-fill" style={{ width: `${levelProgress(xp) * 100}%` }} />
            </div>
            <details className="skill-tree">
              <summary className="skill-tree-head">
                🌳 {cs.name}·技能樹
                {avail > 0 && <span className="soon-tag point-tag">{avail} 點可用</span>}
              </summary>
              <SkillTree skillId={cs.id} kind="craft" />
            </details>
          </section>
        )
      })}

      <section className="panel">
        <div className="reincarnate-box">
          <h3>輪回轉世</h3>
          <p className="reincarnate-desc">
            轉世重修，將此世積累化為<strong>道韻</strong>（永久 +2% 修煉速度 / 點）。圖鑑與道韻永久保留。
          </p>
          {canReincarnate ? (
            <>
              <p className="reincarnate-gain">
                本次可得道韻 <strong>+{daoGain}</strong>
              </p>
              <button
                className="btn btn-reincarnate"
                onClick={() => {
                  if (confirm('確定轉世？本世修為、技能、儲物將重置，道韻與圖鑑保留。')) reincarnate()
                }}
              >
                轉世重修
              </button>
            </>
          ) : (
            <p className="reincarnate-lock">
              需達 <strong>{minRealm.fullName}</strong> 方可轉世
            </p>
          )}
        </div>
        <p className="hint settings-pointer">存檔匯出／匯入、音訊與重置請至右上角 ⚙️ 設定。</p>
      </section>
    </>
  )
}
