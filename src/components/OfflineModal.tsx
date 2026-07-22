import { useGame } from '../game/store'
import { formatNumber } from '../game/formulas'

export function OfflineModal() {
  const report = useGame((s) => s.offlineReport)
  const dismiss = useGame((s) => s.dismissOfflineReport)

  if (!report) return null

  return (
    <div className="modal-overlay" onClick={dismiss}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>閉關出關</h2>
        <p>你閉關了約 <strong>{formatDuration(report.seconds)}</strong>。</p>
        <p className="offline-gain">
          坐忘之間，修為增進 <strong>+{formatNumber(report.qi)}</strong>
        </p>
        <button className="btn btn-breakthrough" onClick={dismiss}>
          繼續修行
        </button>
      </div>
    </div>
  )
}

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec} 秒`
  if (sec < 3600) return `${Math.floor(sec / 60)} 分鐘`
  return `${Math.floor(sec / 3600)} 小時 ${Math.floor((sec % 3600) / 60)} 分鐘`
}
