import { useGame } from '../game/store'
import {
  techniqueUpgradeCost,
  spiritRootUpgradeCost,
  spiritRootMultiplier,
  daoOnReincarnation,
  REINCARNATION_MIN_STAGE,
  formatNumber,
} from '../game/formulas'
import { getStageInfo } from '../game/realms'

export function ShopPanel() {
  const state = useGame((s) => s.state)
  const upgradeTechnique = useGame((s) => s.upgradeTechnique)
  const upgradeSpiritRoot = useGame((s) => s.upgradeSpiritRoot)
  const reincarnate = useGame((s) => s.reincarnate)
  const resetGame = useGame((s) => s.resetGame)

  const techCost = techniqueUpgradeCost(state.techniqueLevel)
  const rootCost = spiritRootUpgradeCost(state.spiritRootLevel)

  const canReincarnate = state.maxStageIndex >= REINCARNATION_MIN_STAGE
  const daoGain = daoOnReincarnation(state.maxStageIndex)
  const minRealm = getStageInfo(REINCARNATION_MIN_STAGE)

  return (
    <section className="panel shop-panel">
      <h2>洞府</h2>

      <div className="upgrade-row">
        <div className="upgrade-info">
          <div className="upgrade-name">參悟功法 <span className="lv">Lv.{state.techniqueLevel}</span></div>
          <div className="upgrade-desc">修煉速度 +35% / 級</div>
        </div>
        <button
          className="btn btn-buy"
          disabled={state.spiritStones < techCost}
          onClick={upgradeTechnique}
        >
          {formatNumber(techCost)} 靈石
        </button>
      </div>

      <div className="upgrade-row">
        <div className="upgrade-info">
          <div className="upgrade-name">溫養靈根 <span className="lv">Lv.{state.spiritRootLevel}</span></div>
          <div className="upgrade-desc">
            突破靈石產出 ×{spiritRootMultiplier(state.spiritRootLevel).toFixed(2)}
          </div>
        </div>
        <button
          className="btn btn-buy"
          disabled={state.spiritStones < rootCost}
          onClick={upgradeSpiritRoot}
        >
          {formatNumber(rootCost)} 靈石
        </button>
      </div>

      <div className="reincarnate-box">
        <h3>輪回轉世</h3>
        <p className="reincarnate-desc">
          轉世重修，將此世積累化為<strong>道韻</strong>（永久 +2% 修煉速度 / 點）。
        </p>
        {canReincarnate ? (
          <>
            <p className="reincarnate-gain">
              本次可得道韻 <strong>+{daoGain}</strong>
            </p>
            <button className="btn btn-reincarnate" onClick={reincarnate}>
              轉世重修
            </button>
          </>
        ) : (
          <p className="reincarnate-lock">
            需達 <strong>{minRealm.fullName}</strong> 方可轉世
          </p>
        )}
      </div>

      <button
        className="btn btn-reset"
        onClick={() => {
          if (confirm('確定要重置遊戲嗎？所有進度（含道韻）將清空。')) resetGame()
        }}
      >
        重置遊戲
      </button>
    </section>
  )
}
