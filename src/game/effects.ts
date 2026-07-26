import type { GameState } from './types'
import type { ItemDef } from './content/items'
import { breakthroughCost } from './formulas'
import { combatStats } from './stats'

let buffCounter = 1

/**
 * 套用一顆丹藥/符籙的效果，回傳給玩家看的訊息。會直接修改 state。
 */
export function applyConsumable(state: GameState, item: ItemDef, now: number): string {
  const e = item.effect
  if (!e) return `${item.name} 沒有任何效果。`

  switch (e.kind) {
    case 'qi': {
      const gain = Math.floor(e.k * breakthroughCost(state.stageIndex))
      state.qi += gain
      return `服下 ${item.name}，修為大進（+${gain}）。`
    }
    case 'breakthrough': {
      state.pendingBreakthroughPct += e.pct
      return `服下 ${item.name}，下次突破成功率 +${Math.round(e.pct * 100)}%。`
    }
    case 'speedBuff': {
      state.buffs.push({ id: ++buffCounter, kind: 'speed', mult: e.mult, expiresAt: now + e.durationSec * 1000 })
      return `服下 ${item.name}，修煉速度 +${Math.round(e.mult * 100)}% 持續 ${Math.floor(e.durationSec / 60)} 分鐘。`
    }
    case 'permaSpeed': {
      state.permaSpeedPct += e.pct
      return `服下 ${item.name}，脫胎換骨，永久修煉速度 +${(e.pct * 100).toFixed(1)}%。`
    }
    case 'heal': {
      const max = combatStats(state).maxHp
      state.combat.playerHp = Math.min(max, state.combat.playerHp + Math.floor(max * e.pct))
      return `服下 ${item.name}，氣血回復。`
    }
  }
}

/** 清除過期 buff */
export function pruneBuffs(state: GameState, now: number): void {
  state.buffs = state.buffs.filter((b) => b.expiresAt > now)
}
