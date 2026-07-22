import type { GameState } from './types'
import { breakthroughCost } from './formulas'

export interface EventResult {
  text: string
  kind: 'good' | 'bad' | 'info'
  apply: (s: GameState) => void
}

interface RandomEvent {
  weight: number
  roll: (s: GameState) => EventResult
}

// 每秒觸發奇遇的機率
export const EVENT_CHANCE_PER_SECOND = 1 / 45

const EVENTS: RandomEvent[] = [
  {
    weight: 3,
    roll: (s) => {
      const gain = Math.floor(breakthroughCost(s.stageIndex) * 0.4)
      return {
        text: `你偶入一處靈脈洞天，吐納間修為大進（+${gain} 修為）。`,
        kind: 'good',
        apply: (st) => {
          st.qi += gain
        },
      }
    },
  },
  {
    weight: 3,
    roll: (s) => {
      const gain = Math.floor(20 * Math.pow(1.4, s.stageIndex))
      return {
        text: `你於坊市尋得一樁機緣，換得靈石 ${gain} 枚。`,
        kind: 'good',
        apply: (st) => {
          st.spiritStones += gain
        },
      }
    },
  },
  {
    weight: 2,
    roll: (s) => {
      const loss = Math.floor(s.qi * 0.15)
      return {
        text: `一縷心魔悄然滋生，你心神動盪，修為略有損耗（-${loss} 修為）。`,
        kind: 'bad',
        apply: (st) => {
          st.qi = Math.max(0, st.qi - loss)
        },
      }
    },
  },
  {
    weight: 1,
    roll: () => ({
      text: '有前輩真人路過，見你資質不凡，傳你一句道訣，令你茅塞頓開。',
      kind: 'good',
      apply: (st) => {
        st.qi += breakthroughCost(st.stageIndex) * 0.8
      },
    }),
  },
  {
    weight: 2,
    roll: () => ({
      text: '天地靈氣今日格外充盈，你只覺呼吸間皆是玄妙。',
      kind: 'info',
      apply: (st) => {
        st.qi += breakthroughCost(st.stageIndex) * 0.2
      },
    }),
  },
]

const TOTAL_WEIGHT = EVENTS.reduce((a, e) => a + e.weight, 0)

export function rollRandomEvent(state: GameState): EventResult {
  let r = Math.random() * TOTAL_WEIGHT
  for (const e of EVENTS) {
    r -= e.weight
    if (r <= 0) return e.roll(state)
  }
  return EVENTS[0].roll(state)
}
