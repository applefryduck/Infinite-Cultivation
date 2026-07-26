import { useState } from 'react'
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
import { levelForXp } from '../../game/xp'

export function CavePanel() {
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

      <section className="panel">
        <h2>技藝精通</h2>
        <div className="craft-skill-row">
          {CRAFT_SKILLS.map((cs) => (
            <div key={cs.id} className="craft-skill">
              <span>
                {cs.emoji} {cs.name}
              </span>
              <span className="skill-lv">Lv.{levelForXp(state.craftXp[cs.id] ?? 0)}</span>
            </div>
          ))}
        </div>
      </section>

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
        <button
          className="btn btn-reset"
          onClick={() => {
            if (confirm('確定要重置遊戲嗎？所有進度（含道韻與圖鑑）將清空。')) resetGame()
          }}
        >
          重置遊戲
        </button>
      </section>

      <SaveManager />
    </>
  )
}

function SaveManager() {
  const exportSaveCode = useGame((s) => s.exportSaveCode)
  const importSaveCode = useGame((s) => s.importSaveCode)
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  function handleExport() {
    const data = exportSaveCode()
    setCode(data)
    navigator.clipboard?.writeText(data).then(
      () => setMsg({ text: '存檔代碼已複製到剪貼簿。', ok: true }),
      () => setMsg({ text: '已產生存檔代碼，請手動複製。', ok: true }),
    )
  }

  function handleDownload() {
    const data = exportSaveCode()
    const blob = new Blob([data], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const stamp = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `無限修仙-存檔-${stamp}.txt`
    a.click()
    URL.revokeObjectURL(url)
    setMsg({ text: '存檔檔案已下載。', ok: true })
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    setCode(text.trim())
    setMsg({ text: '已讀入檔案，請按「匯入存檔」套用。', ok: true })
    e.target.value = ''
  }

  function handleImport() {
    if (!confirm('匯入將覆蓋目前進度，確定要繼續嗎？')) return
    const result = importSaveCode(code)
    if (result.ok) {
      setMsg({ text: '匯入成功！進度已還原。', ok: true })
      setCode('')
    } else {
      setMsg({ text: result.error ?? '匯入失敗。', ok: false })
    }
  }

  return (
    <section className="panel">
      <h2>存檔管理</h2>
      <p className="hint">
        存檔平時存在此瀏覽器。匯出後可備份或搬到其他裝置／瀏覽器繼續玩。
      </p>

      <div className="save-actions">
        <button className="btn btn-buy" onClick={handleExport}>
          匯出（複製）
        </button>
        <button className="btn btn-buy" onClick={handleDownload}>
          下載存檔
        </button>
        <label className="btn btn-buy file-label">
          選擇檔案
          <input type="file" accept=".txt,.json,text/plain" onChange={handleFile} hidden />
        </label>
      </div>

      <textarea
        className="save-textarea"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="在此貼上存檔代碼以匯入，或先按上方「匯出」產生代碼。"
        spellCheck={false}
        rows={4}
      />

      <button className="btn btn-reincarnate" disabled={!code.trim()} onClick={handleImport}>
        匯入存檔
      </button>

      {msg && <p className={'save-msg ' + (msg.ok ? 'ok' : 'err')}>{msg.text}</p>}
    </section>
  )
}
