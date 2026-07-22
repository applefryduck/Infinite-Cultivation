import { useGameLoop } from './game/useGameLoop'
import { ResourceBar } from './components/ResourceBar'
import { RealmPanel } from './components/RealmPanel'
import { ShopPanel } from './components/ShopPanel'
import { LogPanel } from './components/LogPanel'
import { OfflineModal } from './components/OfflineModal'

export default function App() {
  useGameLoop()

  return (
    <div className="app">
      <header className="app-header">
        <h1>無限修仙</h1>
        <p className="subtitle">吐納天地靈氣，一步步踏破境界，證道飛升</p>
      </header>

      <ResourceBar />

      <main className="app-main">
        <div className="col col-left">
          <RealmPanel />
          <ShopPanel />
        </div>
        <div className="col col-right">
          <LogPanel />
        </div>
      </main>

      <OfflineModal />
    </div>
  )
}
