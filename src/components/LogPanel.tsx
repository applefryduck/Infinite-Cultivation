import { useGame } from '../game/store'

export function LogPanel() {
  const log = useGame((s) => s.state.log)

  return (
    <section className="panel log-panel">
      <h2>修行手札</h2>
      <ul className="log-list">
        {log.map((entry) => (
          <li key={entry.id} className={`log-entry log-${entry.kind}`}>
            {entry.text}
          </li>
        ))}
      </ul>
    </section>
  )
}
