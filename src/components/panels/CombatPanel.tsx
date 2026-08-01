import { useGame } from '../../game/store'
import { getStageInfo } from '../../game/realms'
import { HUNTING_AREAS, SECRET_REALMS, getEnemy } from '../../game/content/combat'
import { combatStats } from '../../game/stats'
import { PATH_MAP } from '../../game/content/paths'
import { ELEMENT_COLOR } from '../../game/elements'
import { formatNumber } from '../../game/formulas'
import { Collapsible } from '../ui/Collapsible'

export function CombatPanel() {
  const state = useGame((s) => s.state)
  const startHunt = useGame((s) => s.startHunt)
  const startDungeon = useGame((s) => s.startDungeon)
  const stopCombat = useGame((s) => s.stopCombat)

  const cs = combatStats(state)
  const c = state.combat
  const enemy = c.enemyId ? getEnemy(c.enemyId) : undefined
  const now = Date.now()
  const onCooldown = c.playerHp <= 0 && now < c.cooldownUntil
  const role = PATH_MAP[state.activePathId]?.combatRole ?? '術法'

  return (
    <>
      <section className="panel">
        <h2>戰鬥狀態</h2>
        <div className="combat-stats">
          <Stat label="主戰" value={`${PATH_MAP[state.activePathId]?.name}（${role}）`} />
          <Stat label="氣血" value={`${Math.max(0, Math.ceil(c.playerHp))}/${cs.maxHp}`} />
          <Stat label="攻擊" value={`${formatNumber(cs.atk)} ×${cs.attackCount}`} />
          <Stat label="防禦" value={`${cs.def}`} />
          <Stat label="暴擊" value={`${Math.round(cs.crit * 100)}%`} />
        </div>
        <div className="hp-track">
          <div className="hp-fill" style={{ width: `${Math.max(0, Math.min(1, c.playerHp / cs.maxHp)) * 100}%` }} />
        </div>

        {c.mode !== 'idle' && (
          <div className="combat-live">
            {onCooldown ? (
              <p className="cooldown">重傷靜養中…（{Math.ceil((c.cooldownUntil - now) / 1000)} 秒）</p>
            ) : enemy ? (
              <div className="enemy-card">
                <span className="enemy-emoji">{enemy.emoji}</span>
                <div className="enemy-info">
                  <div className="enemy-name">
                    {enemy.name}
                    {enemy.element && (
                      <span className="elem-tag" style={{ color: ELEMENT_COLOR[enemy.element] }}>
                        {enemy.element}
                      </span>
                    )}
                  </div>
                  <div className="enemy-hp-track">
                    <div className="enemy-hp-fill" style={{ width: `${Math.max(0, Math.min(1, c.enemyHp / enemy.hp)) * 100}%` }} />
                  </div>
                </div>
              </div>
            ) : (
              <p className="hint">搜尋敵蹤…</p>
            )}
            <button className="btn btn-reset" onClick={stopCombat}>
              收兵歸洞
            </button>
          </div>
        )}
      </section>

      <Collapsible
        id="hunt-areas"
        title="獵場"
        badge={`${HUNTING_AREAS.filter((a) => a.unlockRealm <= state.stageIndex).length}/${HUNTING_AREAS.length} 開放`}
        defaultOpen
      >
        {HUNTING_AREAS.map((area) => {
          const locked = area.unlockRealm > state.stageIndex
          const active = c.mode === 'hunt' && c.areaId === area.id
          return (
            <div key={area.id} className="area-row">
              <div className="area-info">
                <div className="area-name">
                  {area.emoji} {area.name}
                  {area.element && (
                    <span className="elem-tag" style={{ color: ELEMENT_COLOR[area.element] }}>
                      {area.element}
                    </span>
                  )}
                </div>
                <div className="area-desc">{area.desc}</div>
                <div className="area-enemies">
                  {area.enemies.map((e) => getEnemy(e)?.emoji).join(' ')}
                </div>
              </div>
              <button
                className={'btn ' + (active ? 'btn-reset' : 'btn-buy')}
                disabled={locked}
                onClick={() => (active ? stopCombat() : startHunt(area.id))}
              >
                {locked ? `需 ${getStageInfo(area.unlockRealm).fullName}` : active ? '狩獵中' : '前往狩獵'}
              </button>
            </div>
          )
        })}
      </Collapsible>

      <Collapsible
        id="dungeons"
        title="秘境"
        badge={`${Object.keys(state.clearedDungeons ?? {}).length}/${SECRET_REALMS.length} 已通關`}
      >
        {SECRET_REALMS.map((dj) => {
          const locked = dj.unlockRealm > state.stageIndex
          const active = c.mode === 'dungeon' && c.dungeonId === dj.id
          return (
            <div key={dj.id} className="area-row">
              <div className="area-info">
                <div className="area-name">
                  {dj.emoji} {dj.name}
                  {dj.element && (
                    <span className="elem-tag" style={{ color: ELEMENT_COLOR[dj.element] }}>
                      {dj.element}屬
                    </span>
                  )}
                </div>
                <div className="area-desc">{dj.desc}</div>
                <div className="area-desc">
                  波次 {dj.waves.length} + BOSS · 通關得靈石 {formatNumber(dj.reward.stones)}
                </div>
                {(() => {
                  const clears = state.clearedDungeons?.[dj.id] ?? 0
                  return clears > 0 ? (
                    <div className="area-desc cleared">✔ 已通關 {clears} 次</div>
                  ) : dj.firstClear ? (
                    <div className="area-desc first-clear">
                      首通額外：
                      {dj.firstClear.attrPoints ? `屬性點 ${dj.firstClear.attrPoints}` : ''}
                      {dj.firstClear.dao ? ` 道韻 ${dj.firstClear.dao}` : ''}
                    </div>
                  ) : null
                })()}
                {active && <div className="area-desc">進度：第 {Math.min(c.waveIndex + 1, dj.waves.length + 1)} 關</div>}
              </div>
              <button
                className={'btn ' + (active ? 'btn-reset' : 'btn-reincarnate')}
                disabled={locked}
                onClick={() => (active ? stopCombat() : startDungeon(dj.id))}
              >
                {locked ? `需 ${getStageInfo(dj.unlockRealm).fullName}` : active ? '闖關中' : '進入秘境'}
              </button>
            </div>
          )
        })}
      </Collapsible>
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="cstat">
      <span className="cstat-label">{label}</span>
      <span className="cstat-value">{value}</span>
    </div>
  )
}
