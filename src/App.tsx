import { useEffect, useState } from 'react'
import { useGameLoop } from './game/useGameLoop'
import { initAudioUnlock } from './game/audio'
import { SettingsModal } from './components/SettingsModal'
import { ResourceBar } from './components/ResourceBar'
import { LogPanel } from './components/LogPanel'
import { OfflineModal } from './components/OfflineModal'
import { CultivationPanel } from './components/panels/CultivationPanel'
import { CombatPanel } from './components/panels/CombatPanel'
import { GatherPanel } from './components/panels/GatherPanel'
import { CraftPanel } from './components/panels/CraftPanel'
import { InventoryPanel } from './components/panels/InventoryPanel'
import { CodexPanel } from './components/panels/CodexPanel'
import { CavePanel } from './components/panels/CavePanel'

type TabId = 'cultivate' | 'combat' | 'gather' | 'craft' | 'inventory' | 'codex' | 'cave'

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'cultivate', label: '修煉', icon: '☯️' },
  { id: 'combat', label: '鬥戰', icon: '⚔️' },
  { id: 'gather', label: '採集', icon: '🌿' },
  { id: 'craft', label: '煉製', icon: '⚗️' },
  { id: 'inventory', label: '儲物', icon: '🎒' },
  { id: 'codex', label: '圖鑑', icon: '📖' },
  { id: 'cave', label: '洞府', icon: '🏯' },
]

export default function App() {
  useGameLoop()
  const [tab, setTab] = useState<TabId>('cultivate')
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    initAudioUnlock()
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <button
          className="gear-btn"
          onClick={() => setSettingsOpen(true)}
          title="設定"
          aria-label="設定"
        >
          ⚙️
        </button>
        <h1>無限修仙</h1>
        <p className="subtitle">吐納天地靈氣，一步步踏破境界，證道飛升</p>
      </header>

      <ResourceBar />

      <nav className="tab-nav">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={'tab-btn' + (tab === t.id ? ' active' : '')}
            onClick={() => setTab(t.id)}
          >
            <span className="tab-icon">{t.icon}</span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </nav>

      <main className="app-main">
        <div className="col col-left">
          {tab === 'cultivate' && <CultivationPanel />}
          {tab === 'combat' && <CombatPanel />}
          {tab === 'gather' && <GatherPanel />}
          {tab === 'craft' && <CraftPanel />}
          {tab === 'inventory' && <InventoryPanel />}
          {tab === 'codex' && <CodexPanel />}
          {tab === 'cave' && <CavePanel />}
        </div>
        <div className="col col-right">
          <LogPanel />
        </div>
      </main>

      <OfflineModal />
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
