import { useState } from 'react'
import { useGame, realmCap } from '../../game/store'
import { SEED_ELEMENTS, getItemDef } from '../../game/content/items'
import { CATEGORY_LABEL } from '../ui/labels'

export function CraftPanel() {
  const state = useGame((s) => s.state)
  const combine = useGame((s) => s.combine)
  const refine = useGame((s) => s.refine)
  const [slotA, setSlotA] = useState<string | undefined>()
  const [slotB, setSlotB] = useState<string | undefined>()

  // 可用素材：種子元素（無限）＋ 儲物中的非裝備物品
  const owned = Object.entries(state.inventory)
    .filter(([, n]) => n >= 1)
    .map(([id]) => id)
  const palette = [...SEED_ELEMENTS.map((e) => e.id), ...owned]

  function pick(id: string) {
    if (slotA === undefined) setSlotA(id)
    else if (slotB === undefined) setSlotB(id)
    else setSlotA(id)
  }

  function doCombine() {
    if (slotA && slotB) {
      combine(slotA, slotB)
      setSlotA(undefined)
      setSlotB(undefined)
    }
  }
  function doRefine() {
    if (slotA) {
      refine(slotA)
      setSlotA(undefined)
      setSlotB(undefined)
    }
  }

  return (
    <>
      <section className="panel">
        <h2>丹爐 · 萬物煉製</h2>
        <p className="hint">
          將兩樣素材投入丹爐<b>合成</b>，或以單一素材<b>提煉</b>出本源。自由組合，無限發現。（可煉最高品階：{realmCap(state)}）
        </p>
        <div className="craft-slots">
          <Slot id={slotA} onClear={() => setSlotA(undefined)} />
          <span className="craft-plus">+</span>
          <Slot id={slotB} onClear={() => setSlotB(undefined)} />
        </div>
        <div className="craft-actions">
          <button className="btn btn-breakthrough" disabled={!slotA || !slotB} onClick={doCombine}>
            合成
          </button>
          <button className="btn btn-buy" disabled={!slotA || !!slotB} onClick={doRefine}>
            提煉
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>素材</h2>
        <div className="palette">
          {palette.map((id) => {
            const def = getItemDef(id)
            if (!def) return null
            const count = def.category === 'element' ? '∞' : Math.floor(state.inventory[id] ?? 0)
            return (
              <button key={id} className="palette-item" onClick={() => pick(id)} title={CATEGORY_LABEL[def.category]}>
                <span className="pi-emoji">{def.emoji}</span>
                <span className="pi-name">{def.name}</span>
                <span className="pi-count">{count}</span>
              </button>
            )
          })}
        </div>
      </section>
    </>
  )
}

function Slot({ id, onClear }: { id?: string; onClear: () => void }) {
  const def = id ? getItemDef(id) : undefined
  return (
    <button className={'craft-slot' + (def ? ' filled' : '')} onClick={onClear}>
      {def ? (
        <>
          <span className="slot-emoji">{def.emoji}</span>
          <span className="slot-name">{def.name}</span>
        </>
      ) : (
        <span className="slot-empty">點選素材</span>
      )}
    </button>
  )
}
