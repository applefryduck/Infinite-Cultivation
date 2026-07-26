import { useGame } from '../game/store'
import { getTribulation, tribulationChance } from '../game/content/tribulations'
import type { TribulationDef } from '../game/content/tribulations'
import { allAttrValues } from '../game/stats'
import { getStageInfo } from '../game/realms'
import { ATTR_MAP } from '../game/content/attributes'
import { formatNumber } from '../game/formulas'

export function TribulationModal() {
  const state = useGame((s) => s.state)
  const attempt = useGame((s) => s.attemptTribulation)

  const pending = state.pendingTribulation
  if (!pending) return null

  const nextStage = getStageInfo(state.stageIndex + 1)
  const attrs = allAttrValues(state)
  const choices = pending.choices.map(getTribulation).filter((t): t is TribulationDef => !!t)

  return (
    <div className="modal-overlay">
      <div className="modal trib-modal" onClick={(e) => e.stopPropagation()}>
        <div className="trib-head">
          <div className="trib-lightning">⚡</div>
          <h2>天劫將至</h2>
          <p className="trib-sub">
            欲入 <strong>{nextStage.realmName}</strong>，須渡此劫。擇一而戰，成則脫胎換骨，敗則重傷損修為。
          </p>
        </div>

        <div className="trib-list">
          {choices.map((t) => {
            const chance = tribulationChance(t, attrs, nextStage.majorIndex)
            const risky = chance < 0.5
            return (
              <div key={t.id} className={'trib-card ' + rarityClass(t.rarity)}>
                <div className="trib-card-head">
                  <span className="trib-emoji">{t.emoji}</span>
                  <div className="trib-title">
                    <span className="trib-name">{t.name}</span>
                    <span className={'trib-rarity ' + rarityClass(t.rarity)}>{t.rarity}</span>
                  </div>
                  <span className={'trib-chance' + (risky ? ' risky' : '')}>{Math.round(chance * 100)}%</span>
                </div>

                <p className="trib-desc">{t.desc}</p>

                <div className="trib-tests">
                  考驗：
                  {t.tests.map((a) => (
                    <span key={a} className="trib-test" style={{ color: ATTR_MAP[a].color }}>
                      {ATTR_MAP[a].emoji} {ATTR_MAP[a].name} {attrs[a]}
                    </span>
                  ))}
                </div>

                <div className="trib-rewards">{describeReward(t)}</div>

                <button className="btn btn-trib" onClick={() => attempt(t.id)}>
                  渡此劫
                </button>
              </div>
            )
          })}
        </div>

        <p className="trib-foot">
          天劫當前，避無可避。渡劫需耗盡當前修為 {formatNumber(Math.floor(state.qi))}。
        </p>
      </div>
    </div>
  )
}

function rarityClass(r: TribulationDef['rarity']): string {
  return r === '傳說' ? 'legend' : r === '稀有' ? 'rare' : r === '罕見' ? 'uncommon' : 'common'
}

function describeReward(t: TribulationDef): string {
  const r = t.reward
  const parts: string[] = []
  if (r.permaSpeedPct) parts.push(`修煉速度 +${Math.round(r.permaSpeedPct * 100)}%`)
  if (r.hpPct) parts.push(`氣血 +${Math.round(r.hpPct * 100)}%`)
  if (r.atkPct) parts.push(`攻擊 +${Math.round(r.atkPct * 100)}%`)
  if (r.breakthroughPct) parts.push(`突破率 +${Math.round(r.breakthroughPct * 100)}%`)
  if (r.dropPct) parts.push(`掉率 +${Math.round(r.dropPct * 100)}%`)
  if (r.attrPoints) parts.push(`屬性點 ${r.attrPoints}`)
  if (r.dao) parts.push(`道韻 ${r.dao}`)
  if (r.stones) parts.push(`靈石 ${r.stones}`)
  return '成功獎勵：' + parts.join('、')
}
