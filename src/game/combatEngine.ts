import type { GameState, LogEntry } from './types'
import { getEnemy, HUNTING_AREAS, SECRET_REALMS } from './content/combat'
import type { Enemy } from './content/combat'
import { getItemDef } from './content/items'
import { PATH_MAP } from './content/paths'
import { elementMultiplier, type FiveElement } from './elements'
import { combatStats, aggregate } from './stats'
import { applyConsumable } from './effects'
import { playSfx } from './audio'

export interface CombatLog {
  text: string
  kind: LogEntry['kind']
}

const REVIVE_COOLDOWN_MS = 30_000

function playerElement(state: GameState): FiveElement | undefined {
  const sword = state.equipped['劍']
  if (sword) {
    const def = getItemDef(sword)
    if (def?.element) return def.element
  }
  return PATH_MAP[state.activePathId]?.element
}

function addItem(state: GameState, itemId: string, qty: number): void {
  state.inventory[itemId] = (state.inventory[itemId] ?? 0) + qty
}

function findHealPill(state: GameState): string | undefined {
  for (const [id, count] of Object.entries(state.inventory)) {
    if (count <= 0) continue
    const def = getItemDef(id)
    if (def?.effect?.kind === 'heal') return id
  }
  return undefined
}

function spawnHuntEnemy(state: GameState): Enemy | undefined {
  const area = HUNTING_AREAS.find((a) => a.id === state.combat.areaId)
  if (!area) return undefined
  const pick = area.enemies[Math.floor(Math.random() * area.enemies.length)]
  return getEnemy(pick)
}

function currentDungeonEnemy(state: GameState): Enemy | undefined {
  const dj = SECRET_REALMS.find((d) => d.id === state.combat.dungeonId)
  if (!dj) return undefined
  if (state.combat.waveIndex < dj.waves.length) return getEnemy(dj.waves[state.combat.waveIndex])
  if (state.combat.waveIndex === dj.waves.length) return getEnemy(dj.boss)
  return undefined
}

function grantKillRewards(state: GameState, enemy: Enemy): void {
  const agg = aggregate(state)
  state.qi += enemy.qiReward
  state.spiritStones += Math.floor(enemy.stoneReward * (1 + agg.stonePct))
  for (const drop of enemy.drops) {
    if (Math.random() < Math.min(0.95, drop.chance * (1 + agg.dropPct))) {
      addItem(state, drop.itemId, drop.qty)
    }
  }
}

/**
 * 逐 tick 推進戰鬥（獵場/秘境），支援離線大 delta 的多場結算。
 */
export function combatTick(state: GameState, seconds: number, now: number, live = true): CombatLog[] {
  const logs: CombatLog[] = []
  let kills = 0
  const c = state.combat
  if (c.mode === 'idle') return logs

  // 重傷冷卻中
  if (c.playerHp <= 0) {
    if (now < c.cooldownUntil) return logs
    c.playerHp = combatStats(state).maxHp // 恢復出關
  }

  let remaining = seconds
  let guard = 0
  const pElem = playerElement(state)

  while (remaining > 0 && guard++ < 300) {
    const cs = combatStats(state)
    if (c.playerHp <= 0) c.playerHp = cs.maxHp

    // 確保有敵人
    let enemy = c.enemyId ? getEnemy(c.enemyId) : undefined
    if (!enemy || c.enemyHp <= 0) {
      enemy = c.mode === 'dungeon' ? currentDungeonEnemy(state) : spawnHuntEnemy(state)
      if (!enemy) break
      c.enemyId = enemy.id
      c.enemyHp = enemy.hp
    }

    const toEnemy = Math.max(1, cs.atk - enemy.def) * cs.attackCount * elementMultiplier(pElem, enemy.element) * (1 + cs.crit * 0.5)
    const toPlayer = Math.max(1, enemy.atk - cs.def) * elementMultiplier(enemy.element, pElem)

    const ttkEnemy = c.enemyHp / toEnemy
    const ttkPlayer = c.playerHp / toPlayer
    const step = Math.min(ttkEnemy, ttkPlayer, remaining)

    c.enemyHp -= toEnemy * step
    c.playerHp -= toPlayer * step
    remaining -= step

    if (c.enemyHp <= 0) {
      grantKillRewards(state, enemy)
      if (live && kills++ < 3) playSfx('hit') // 離線批次結算不播、連擊也僅前幾次

      if (c.mode === 'dungeon') {
        const dj = SECRET_REALMS.find((d) => d.id === c.dungeonId)!
        if (c.waveIndex >= dj.waves.length) {
          // 擊敗 BOSS，通關
          state.spiritStones += dj.reward.stones
          for (const it of dj.reward.items) addItem(state, it.itemId, it.qty)
          logs.push({ text: `秘境「${dj.name}」通關！斬殺 ${enemy.name}，獲得豐厚獎勵。`, kind: 'combat' })
          c.mode = 'idle'
          c.dungeonId = undefined
          c.enemyId = undefined
          c.waveIndex = 0
          break
        } else {
          c.waveIndex += 1
          c.enemyId = undefined
          c.enemyHp = 0
        }
      } else {
        c.enemyId = undefined
        c.enemyHp = 0
      }

      // 血量偏低則自動服用回血丹
      if (c.playerHp < cs.maxHp * 0.4) {
        const healId = findHealPill(state)
        if (healId) {
          state.inventory[healId] -= 1
          if (state.inventory[healId] <= 0) delete state.inventory[healId]
          applyConsumable(state, getItemDef(healId)!, now)
        }
      }
    } else if (c.playerHp <= 0) {
      c.playerHp = 0
      c.cooldownUntil = now + REVIVE_COOLDOWN_MS
      logs.push({ text: `你不敵 ${enemy.name}，重傷撤退，需靜養片刻。`, kind: 'bad' })
      if (live) playSfx('defeat')
      c.enemyId = undefined
      c.enemyHp = 0
      break
    }
  }

  return logs
}
