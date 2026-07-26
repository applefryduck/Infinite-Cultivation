import type { FiveElement } from '../elements'

export interface Enemy {
  id: string
  name: string
  emoji: string
  element?: FiveElement
  hp: number
  atk: number
  def: number
  tier: number
  qiReward: number
  stoneReward: number
  drops: { itemId: string; chance: number; qty: number }[]
}

export interface HuntingArea {
  id: string
  name: string
  desc: string
  emoji: string
  unlockRealm: number
  enemies: string[] // enemy id pool（隨機刷）
}

export interface SecretRealm {
  id: string
  name: string
  desc: string
  emoji: string
  element: FiveElement
  unlockRealm: number
  waves: string[] // enemy id 依序
  boss: string
  reward: { stones: number; items: { itemId: string; qty: number }[] }
}

export const ENEMIES: Record<string, Enemy> = {
  e_rabbit: { id: 'e_rabbit', name: '靈氣妖兔', emoji: '🐇', element: '木', hp: 40, atk: 5, def: 1, tier: 1, qiReward: 20, stoneReward: 5, drops: [{ itemId: 'beast_dan_1', chance: 0.4, qty: 1 }] },
  e_wolf: { id: 'e_wolf', name: '玄狼', emoji: '🐺', element: '金', hp: 90, atk: 11, def: 4, tier: 1, qiReward: 45, stoneReward: 12, drops: [{ itemId: 'beast_dan_1', chance: 0.5, qty: 1 }, { itemId: 'beast_blood', chance: 0.2, qty: 1 }] },
  e_boar: { id: 'e_boar', name: '鐵甲妖豬', emoji: '🐗', element: '土', hp: 160, atk: 16, def: 10, tier: 2, qiReward: 90, stoneReward: 25, drops: [{ itemId: 'beast_dan_2', chance: 0.4, qty: 1 }, { itemId: 'beast_blood', chance: 0.3, qty: 1 }] },
  e_serpent: { id: 'e_serpent', name: '幽冥蛇', emoji: '🐍', element: '水', hp: 260, atk: 26, def: 12, tier: 2, qiReward: 160, stoneReward: 45, drops: [{ itemId: 'beast_dan_2', chance: 0.5, qty: 1 }, { itemId: 'beast_soul', chance: 0.3, qty: 1 }] },
  e_tiger: { id: 'e_tiger', name: '白額妖虎', emoji: '🐅', element: '金', hp: 420, atk: 40, def: 20, tier: 3, qiReward: 300, stoneReward: 90, drops: [{ itemId: 'beast_dan_3', chance: 0.4, qty: 1 }, { itemId: 'beast_soul', chance: 0.4, qty: 1 }] },
  // BOSS
  b_serpent_king: { id: 'b_serpent_king', name: '幽冥蛇王', emoji: '🐉', element: '水', hp: 1200, atk: 55, def: 30, tier: 3, qiReward: 1200, stoneReward: 400, drops: [{ itemId: 'beast_soul', chance: 1, qty: 3 }, { itemId: 'beast_dan_3', chance: 1, qty: 2 }] },
}

export const HUNTING_AREAS: HuntingArea[] = [
  { id: 'a_forest', name: '青木林', desc: '低階妖獸出沒的靈木密林。', emoji: '🌲', unlockRealm: 0, enemies: ['e_rabbit', 'e_wolf'] },
  { id: 'a_mountain', name: '蒼狼嶺', desc: '兇獸盤踞的險峻山嶺。', emoji: '🏔️', unlockRealm: 9, enemies: ['e_boar', 'e_serpent'] },
  { id: 'a_cliff', name: '虎嘯崖', desc: '妖虎橫行的絕壁。', emoji: '⛰️', unlockRealm: 17, enemies: ['e_serpent', 'e_tiger'] },
]

export const SECRET_REALMS: SecretRealm[] = [
  {
    id: 's_water_cave',
    name: '幽冥水府',
    desc: '水屬秘境，蛇王盤踞。以剋水之土屬配置更利。',
    emoji: '🌊',
    element: '水',
    unlockRealm: 13,
    waves: ['e_serpent', 'e_serpent', 'e_boar'],
    boss: 'b_serpent_king',
    reward: { stones: 800, items: [{ itemId: 'essence_soul', qty: 1 }] },
  },
]

export function getEnemy(id: string): Enemy | undefined {
  return ENEMIES[id]
}
