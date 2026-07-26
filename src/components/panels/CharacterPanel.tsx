import { useGame } from '../../game/store'
import { getStageInfo } from '../../game/realms'
import { breakthroughCost, breakthroughChance, formatNumber } from '../../game/formulas'
import { aggregate, cultivationRate, combatStats, pathLevel } from '../../game/stats'
import { ATTRIBUTES, attrPoints, attrProgress, trainForPoints } from '../../game/content/attributes'
import { PATHS, PATH_MAP, getTechnique } from '../../game/content/paths'

export function CharacterPanel() {
  const state = useGame((s) => s.state)
  const doBreakthrough = useGame((s) => s.breakthrough)
  const allocAttr = useGame((s) => s.allocAttr)

  const current = getStageInfo(state.stageIndex)
  const next = getStageInfo(state.stageIndex + 1)
  const cost = breakthroughCost(state.stageIndex)
  const agg = aggregate(state)
  const chance = Math.min(0.99, breakthroughChance(state.stageIndex) + agg.breakthroughPct)
  const progress = Math.min(1, state.qi / cost)
  const ready = state.qi >= cost
  const rate = cultivationRate(state, Date.now())
  const etaSec = ready || rate <= 0 ? 0 : Math.ceil((cost - state.qi) / rate)
  const cs = combatStats(state)
  const activePath = PATH_MAP[state.activePathId]
  const activeTech = getTechnique(state.activePathId, state.activeTechId)

  return (
    <>
      {/* 境界與突破 */}
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

        <button
          className={'btn btn-breakthrough' + (next.isMajorBoundary ? ' trib' : '')}
          disabled={!ready}
          onClick={doBreakthrough}
        >
          {next.isMajorBoundary ? `渡劫 → ${next.fullName}` : `突破 → ${next.fullName}`}
        </button>
        <div className="breakthrough-chance">
          突破成功率 <strong>{Math.round(chance * 100)}%</strong>
          {next.isMajorBoundary && <span className="major-tag">跨大境界·需渡雷劫</span>}
          {state.pendingBreakthroughPct > 0 && (
            <span className="buff-tag">破境丹 +{Math.round(state.pendingBreakthroughPct * 100)}%</span>
          )}
        </div>
        <p className="hint current-training">
          目前修練：<strong>{activePath?.name}</strong> · {activeTech?.name ?? '—'}（{formatNumber(rate)} 修為/秒）
        </p>
      </section>

      {/* 五維屬性 */}
      <section className="panel">
        <div className="attr-head">
          <h2>人物屬性</h2>
          {state.freeAttrPoints > 0 && (
            <span className="free-points">可分配 {state.freeAttrPoints} 點</span>
          )}
        </div>
        <p className="hint">修練會自然鍛鍊對應屬性；突破另有自由分配點。</p>

        {ATTRIBUTES.map((a) => {
          const trained = attrPoints(state.attrTrain[a.id] ?? 0)
          const alloc = state.attrAlloc[a.id] ?? 0
          const total = trained + alloc
          const prog = attrProgress(state.attrTrain[a.id] ?? 0)
          const nextAt = trainForPoints(trained + 1)
          return (
            <div key={a.id} className="attr-row">
              <div className="attr-main">
                <span className="attr-emoji">{a.emoji}</span>
                <div className="attr-info">
                  <div className="attr-name-line">
                    <span className="attr-name" style={{ color: a.color }}>
                      {a.name}
                    </span>
                    <span className="attr-total">{total}</span>
                    {alloc > 0 && <span className="attr-alloc">（鍛鍊 {trained} + 分配 {alloc}）</span>}
                  </div>
                  <div className="attr-bar">
                    <div className="attr-bar-fill" style={{ width: `${prog * 100}%`, background: a.color }} />
                  </div>
                  <div className="attr-effects">{a.effects.join(' · ')}</div>
                  <div className="attr-next">
                    鍛鍊 {formatNumber(Math.floor(state.attrTrain[a.id] ?? 0))} / {formatNumber(nextAt)}
                  </div>
                </div>
              </div>
              {state.freeAttrPoints > 0 && (
                <button className="attr-plus" onClick={() => allocAttr(a.id)} title={`分配 1 點至${a.name}`}>
                  ＋
                </button>
              )}
            </div>
          )
        })}
      </section>

      {/* 衍生數值 */}
      <section className="panel">
        <h2>衍生數值</h2>
        <div className="derived-grid">
          <Derived label="氣血上限" value={formatNumber(cs.maxHp)} />
          <Derived label="攻擊" value={`${formatNumber(cs.atk)} ×${cs.attackCount}`} />
          <Derived label="防禦" value={formatNumber(cs.def)} />
          <Derived label="暴擊率" value={`${Math.round(cs.crit * 100)}%`} />
          <Derived label="修煉速度" value={`${formatNumber(rate)}/秒`} />
          <Derived label="突破加成" value={`+${Math.round(agg.breakthroughPct * 100)}%`} />
          <Derived label="煉製成功" value={`+${Math.round(agg.craftSuccessPct * 100)}%`} />
          <Derived label="掉落加成" value={`+${Math.round(agg.dropPct * 100)}%`} />
        </div>
      </section>

      {/* 體系等級一覽 */}
      <section className="panel">
        <h2>修練體系</h2>
        <div className="path-summary">
          {PATHS.map((p) => (
            <div key={p.id} className={'path-sum' + (state.activePathId === p.id ? ' active' : '')}>
              <span className="ps-name">{p.name}</span>
              <span className="ps-lv">Lv.{pathLevel(state, p.id)}</span>
              <span className="ps-role">{p.combatRole}</span>
            </div>
          ))}
        </div>
        <div className="char-meta">
          <span>轉世 {state.reincarnations} 世</span>
          <span>道韻 {formatNumber(state.dao)}</span>
          <span>最高境界 {getStageInfo(state.maxStageIndex).fullName}</span>
        </div>
      </section>
    </>
  )
}

function Derived({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="derived">
      <span className="derived-label">{label}</span>
      <span className="derived-value">{value}</span>
    </div>
  )
}

function formatEta(sec: number): string {
  if (sec <= 0) return '就緒'
  if (sec < 60) return `${sec} 秒`
  if (sec < 3600) return `${Math.floor(sec / 60)} 分 ${sec % 60} 秒`
  return `${Math.floor(sec / 3600)} 小時 ${Math.floor((sec % 3600) / 60)} 分`
}