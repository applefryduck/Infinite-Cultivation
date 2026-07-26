import { useState } from 'react'
import { useGame } from '../game/store'
import {
  getAudioSettings,
  setMuted,
  setVolume,
  setMusicMuted,
  setMusicVolume,
  playSfx,
} from '../game/audio'

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'audio' | 'save' | 'danger'>('audio')

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-head">
          <h2>設定</h2>
          <button className="settings-close" onClick={onClose} aria-label="關閉">
            ✕
          </button>
        </div>

        <div className="settings-tabs">
          <button className={'settings-tab' + (tab === 'audio' ? ' active' : '')} onClick={() => setTab('audio')}>
            🔊 音訊
          </button>
          <button className={'settings-tab' + (tab === 'save' ? ' active' : '')} onClick={() => setTab('save')}>
            💾 存檔
          </button>
          <button className={'settings-tab' + (tab === 'danger' ? ' active' : '')} onClick={() => setTab('danger')}>
            ⚠️ 其他
          </button>
        </div>

        <div className="settings-body">
          {tab === 'audio' && <AudioSettings />}
          {tab === 'save' && <SaveSettings />}
          {tab === 'danger' && <DangerSettings onClose={onClose} />}
        </div>
      </div>
    </div>
  )
}

function AudioSettings() {
  const initial = getAudioSettings()
  const [sfxMuted, setSfxMuted] = useState(initial.muted)
  const [sfxVol, setSfxVol] = useState(initial.volume)
  const [bgmMuted, setBgmMuted] = useState(initial.musicMuted)
  const [bgmVol, setBgmVol] = useState(initial.musicVolume)

  return (
    <>
      <div className="setting-row">
        <div className="setting-info">
          <div className="setting-name">背景音樂</div>
          <div className="setting-desc">Bamboo Mist Path · 循環播放</div>
        </div>
        <div className="setting-ctrl">
          <button
            className="audio-btn"
            onClick={() => {
              const next = !bgmMuted
              setMusicMuted(next)
              setBgmMuted(next)
            }}
          >
            {bgmMuted ? '🔇' : '🎵'}
          </button>
          <input
            className="audio-slider"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={bgmVol}
            disabled={bgmMuted}
            onChange={(e) => {
              const v = Number(e.target.value)
              setMusicVolume(v)
              setBgmVol(v)
            }}
          />
        </div>
      </div>

      <div className="setting-row">
        <div className="setting-info">
          <div className="setting-name">音效</div>
          <div className="setting-desc">突破、煉製、戰鬥等提示音</div>
        </div>
        <div className="setting-ctrl">
          <button
            className="audio-btn"
            onClick={() => {
              const next = !sfxMuted
              setMuted(next)
              setSfxMuted(next)
              if (!next) playSfx('click')
            }}
          >
            {sfxMuted ? '🔇' : '🔊'}
          </button>
          <input
            className="audio-slider"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={sfxVol}
            disabled={sfxMuted}
            onChange={(e) => {
              const v = Number(e.target.value)
              setVolume(v)
              setSfxVol(v)
            }}
            onMouseUp={() => !sfxMuted && playSfx('click')}
          />
        </div>
      </div>
    </>
  )
}

function SaveSettings() {
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
    a.href = url
    a.download = `無限修仙-存檔-${new Date().toISOString().slice(0, 10)}.txt`
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
    <>
      <p className="hint">存檔平時存在此瀏覽器。匯出後可備份或搬到其他裝置／瀏覽器繼續玩。</p>
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
    </>
  )
}

function DangerSettings({ onClose }: { onClose: () => void }) {
  const resetGame = useGame((s) => s.resetGame)
  return (
    <>
      <p className="hint">重置將清空所有進度，包含道韻與圖鑑，且無法復原。建議先到「存檔」分頁備份。</p>
      <button
        className="btn btn-reset danger"
        onClick={() => {
          if (confirm('確定要重置遊戲嗎？所有進度（含道韻與圖鑑）將清空。')) {
            resetGame()
            onClose()
          }
        }}
      >
        重置遊戲
      </button>
    </>
  )
}
