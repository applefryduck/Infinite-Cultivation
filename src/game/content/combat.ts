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
  element?: FiveElement
  unlockRealm: number
  enemies: string[] // enemy id pool（隨機刷）
}

export interface SecretRealm {
  id: string
  name: string
  desc: string
  emoji: string
  /** 秘境主屬性（用於提示相剋策略）；無屬性者不設 */
  element?: FiveElement
  unlockRealm: number
  waves: string[] // enemy id 依序
  boss: string
  reward: { stones: number; items: { itemId: string; qty: number }[] }
  /** 首次通關的額外獎勵 */
  firstClear?: { dao?: number; attrPoints?: number; items?: { itemId: string; qty: number }[] }
}

/**
 * 敵人依「目標境界」設計，數值大致以 3 倍/階梯 成長，
 * 對應玩家體系等級與裝備的成長速度。
 */
export const ENEMIES: Record<string, Enemy> = {
  // ── 練氣期（stage 0-8）──
  e_rabbit: { id: 'e_rabbit', name: '靈氣妖兔', emoji: '🐇', element: '木', hp: 40, atk: 5, def: 1, tier: 1, qiReward: 20, stoneReward: 5, drops: [{ itemId: 'beast_dan_1', chance: 0.4, qty: 1 }] },
  e_wolf: { id: 'e_wolf', name: '玄狼', emoji: '🐺', element: '金', hp: 90, atk: 11, def: 4, tier: 1, qiReward: 45, stoneReward: 12, drops: [{ itemId: 'beast_dan_1', chance: 0.5, qty: 1 }, { itemId: 'beast_blood', chance: 0.2, qty: 1 }] },
  e_toad: { id: 'e_toad', name: '碧水靈蟾', emoji: '🐸', element: '水', hp: 70, atk: 8, def: 6, tier: 1, qiReward: 35, stoneReward: 10, drops: [{ itemId: 'beast_dan_1', chance: 0.45, qty: 1 }, { itemId: 'spirit_1', chance: 0.25, qty: 1 }] },
  e_crane: { id: 'e_crane', name: '青羽仙鶴', emoji: '🕊️', element: '木', hp: 110, atk: 14, def: 3, tier: 1, qiReward: 60, stoneReward: 16, drops: [{ itemId: 'beast_dan_1', chance: 0.5, qty: 1 }, { itemId: 'herb_2', chance: 0.2, qty: 1 }] },

  // ── 築基期（stage 9-12）──
  e_boar: { id: 'e_boar', name: '鐵甲妖豬', emoji: '🐗', element: '土', hp: 160, atk: 16, def: 10, tier: 2, qiReward: 90, stoneReward: 25, drops: [{ itemId: 'beast_dan_2', chance: 0.4, qty: 1 }, { itemId: 'beast_blood', chance: 0.3, qty: 1 }] },
  e_serpent: { id: 'e_serpent', name: '幽冥蛇', emoji: '🐍', element: '水', hp: 260, atk: 26, def: 12, tier: 2, qiReward: 160, stoneReward: 45, drops: [{ itemId: 'beast_dan_2', chance: 0.5, qty: 1 }, { itemId: 'beast_soul', chance: 0.3, qty: 1 }] },
  e_scorpion: { id: 'e_scorpion', name: '赤炎蠍', emoji: '🦂', element: '火', hp: 220, atk: 32, def: 8, tier: 2, qiReward: 150, stoneReward: 42, drops: [{ itemId: 'beast_dan_2', chance: 0.45, qty: 1 }, { itemId: 'herb_3', chance: 0.2, qty: 1 }] },

  // ── 金丹期（stage 13-16）──
  e_tiger: { id: 'e_tiger', name: '白額妖虎', emoji: '🐅', element: '金', hp: 420, atk: 40, def: 20, tier: 3, qiReward: 300, stoneReward: 90, drops: [{ itemId: 'beast_dan_3', chance: 0.4, qty: 1 }, { itemId: 'beast_soul', chance: 0.4, qty: 1 }] },
  e_firebird: { id: 'e_firebird', name: '烈焰雀', emoji: '🔥', element: '火', hp: 500, atk: 62, def: 16, tier: 3, qiReward: 420, stoneReward: 120, drops: [{ itemId: 'beast_dan_3', chance: 0.45, qty: 1 }, { itemId: 'ore_3', chance: 0.25, qty: 1 }] },
  e_stonegolem: { id: 'e_stonegolem', name: '玄石傀儡', emoji: '🗿', element: '土', hp: 900, atk: 45, def: 45, tier: 3, qiReward: 480, stoneReward: 150, drops: [{ itemId: 'beast_dan_3', chance: 0.5, qty: 1 }, { itemId: 'ore_3', chance: 0.35, qty: 1 }] },

  // ── 元嬰期（stage 17-20）──
  e_ghost: { id: 'e_ghost', name: '厲鬼將', emoji: '👺', element: '水', hp: 1400, atk: 110, def: 40, tier: 4, qiReward: 1200, stoneReward: 320, drops: [{ itemId: 'beast_dan_4', chance: 0.35, qty: 1 }, { itemId: 'beast_soul', chance: 0.6, qty: 2 }] },
  e_thunderape: { id: 'e_thunderape', name: '雷霆巨猿', emoji: '🦍', element: '金', hp: 2200, atk: 150, def: 60, tier: 4, qiReward: 1800, stoneReward: 480, drops: [{ itemId: 'beast_dan_4', chance: 0.4, qty: 1 }, { itemId: 'beast_bone', chance: 0.25, qty: 1 }] },

  // ── 化神～合體（stage 21-32）──
  e_voidbeast: { id: 'e_voidbeast', name: '虛空噬獸', emoji: '🕳️', hp: 6000, atk: 320, def: 120, tier: 5, qiReward: 6000, stoneReward: 1400, drops: [{ itemId: 'beast_dan_5', chance: 0.35, qty: 1 }, { itemId: 'spirit_4', chance: 0.3, qty: 1 }] },
  e_bonelord: { id: 'e_bonelord', name: '白骨道君', emoji: '💀', element: '土', hp: 9000, atk: 420, def: 200, tier: 5, qiReward: 9000, stoneReward: 2200, drops: [{ itemId: 'beast_dan_5', chance: 0.4, qty: 1 }, { itemId: 'beast_bone', chance: 0.45, qty: 1 }] },
  e_seadragon: { id: 'e_seadragon', name: '滄溟蛟龍', emoji: '🐊', element: '水', hp: 14000, atk: 600, def: 260, tier: 5, qiReward: 15000, stoneReward: 3600, drops: [{ itemId: 'beast_dan_5', chance: 0.45, qty: 1 }, { itemId: 'beast_scale', chance: 0.2, qty: 1 }] },

  // ── 大乘～渡劫（stage 33-40）──
  e_demonlord: { id: 'e_demonlord', name: '魔道尊者', emoji: '😈', element: '火', hp: 42000, atk: 1500, def: 600, tier: 6, qiReward: 60000, stoneReward: 12000, drops: [{ itemId: 'beast_dan_6', chance: 0.35, qty: 1 }, { itemId: 'spirit_5', chance: 0.3, qty: 1 }] },
  e_swordspirit: { id: 'e_swordspirit', name: '上古劍靈', emoji: '⚔️', element: '金', hp: 60000, atk: 2400, def: 800, tier: 6, qiReward: 90000, stoneReward: 18000, drops: [{ itemId: 'beast_dan_6', chance: 0.4, qty: 1 }, { itemId: 'ore_3', chance: 0.6, qty: 3 }] },

  // ── 仙境（stage 41+）──
  e_immortalguard: { id: 'e_immortalguard', name: '天庭衛', emoji: '🛡️', element: '金', hp: 220000, atk: 7000, def: 2600, tier: 7, qiReward: 450000, stoneReward: 60000, drops: [{ itemId: 'beast_dan_6', chance: 0.6, qty: 2 }, { itemId: 'spirit_5', chance: 0.45, qty: 1 }] },
  e_chaosbeast: { id: 'e_chaosbeast', name: '混沌凶獸', emoji: '🌀', hp: 400000, atk: 12000, def: 4000, tier: 7, qiReward: 900000, stoneReward: 120000, drops: [{ itemId: 'beast_dan_6', chance: 0.7, qty: 3 }, { itemId: 'essence_chaos', chance: 0.12, qty: 1 }] },

  // ── BOSS ──
  b_serpent_king: { id: 'b_serpent_king', name: '幽冥蛇王', emoji: '🐉', element: '水', hp: 1200, atk: 55, def: 30, tier: 3, qiReward: 1200, stoneReward: 400, drops: [{ itemId: 'beast_soul', chance: 1, qty: 3 }, { itemId: 'beast_dan_3', chance: 1, qty: 2 }] },
  b_flame_king: { id: 'b_flame_king', name: '焚天火君', emoji: '🌋', element: '火', hp: 2600, atk: 130, def: 55, tier: 4, qiReward: 3000, stoneReward: 900, drops: [{ itemId: 'beast_dan_4', chance: 1, qty: 2 }, { itemId: 'herb_3', chance: 1, qty: 3 }] },
  b_wood_ancient: { id: 'b_wood_ancient', name: '萬年樹妖', emoji: '🌳', element: '木', hp: 7000, atk: 260, def: 150, tier: 5, qiReward: 9000, stoneReward: 2400, drops: [{ itemId: 'beast_dan_5', chance: 1, qty: 2 }, { itemId: 'herb_3', chance: 1, qty: 5 }] },
  b_sword_saint: { id: 'b_sword_saint', name: '劍冢守靈', emoji: '🗡️', element: '金', hp: 22000, atk: 900, def: 420, tier: 5, qiReward: 30000, stoneReward: 7000, drops: [{ itemId: 'beast_dan_5', chance: 1, qty: 3 }, { itemId: 'ore_3', chance: 1, qty: 5 }] },
  b_earth_dragon: { id: 'b_earth_dragon', name: '厚土龍君', emoji: '🐲', element: '土', hp: 70000, atk: 2200, def: 1400, tier: 6, qiReward: 120000, stoneReward: 26000, drops: [{ itemId: 'beast_scale', chance: 1, qty: 2 }, { itemId: 'beast_dan_6', chance: 1, qty: 2 }] },
  b_dao_ancestor: { id: 'b_dao_ancestor', name: '太初道影', emoji: '☯️', hp: 600000, atk: 16000, def: 6000, tier: 7, qiReward: 1500000, stoneReward: 300000, drops: [{ itemId: 'essence_chaos', chance: 1, qty: 1 }, { itemId: 'beast_dan_6', chance: 1, qty: 5 }] },
}

export const HUNTING_AREAS: HuntingArea[] = [
  { id: 'a_forest', name: '青木林', desc: '低階妖獸出沒的靈木密林，修士入門之地。', emoji: '🌲', element: '木', unlockRealm: 0, enemies: ['e_rabbit', 'e_wolf'] },
  { id: 'a_marsh', name: '寒潭水澤', desc: '霧氣氤氳的沼澤，水屬妖物潛伏其中。', emoji: '🌊', element: '水', unlockRealm: 4, enemies: ['e_toad', 'e_crane'] },
  { id: 'a_mountain', name: '蒼狼嶺', desc: '兇獸盤踞的險峻山嶺。', emoji: '🏔️', element: '土', unlockRealm: 9, enemies: ['e_boar', 'e_serpent'] },
  { id: 'a_desert', name: '赤焰荒漠', desc: '烈日灼燒的死亡之地，火毒橫行。', emoji: '🏜️', element: '火', unlockRealm: 13, enemies: ['e_scorpion', 'e_firebird'] },
  { id: 'a_cliff', name: '虎嘯崖', desc: '妖虎橫行的絕壁。', emoji: '⛰️', element: '金', unlockRealm: 17, enemies: ['e_tiger', 'e_stonegolem'] },
  { id: 'a_netherworld', name: '玄冥鬼域', desc: '陰氣沖天的鬼蜮，厲鬼成群。', emoji: '👻', element: '水', unlockRealm: 21, enemies: ['e_ghost', 'e_thunderape'] },
  { id: 'a_voidrift', name: '虛空裂隙', desc: '空間破碎之地，噬獸自虛無中撲來。', emoji: '🕳️', unlockRealm: 25, enemies: ['e_voidbeast', 'e_bonelord'] },
  { id: 'a_abyss', name: '滄溟深淵', desc: '深不見底的萬丈海淵，蛟龍盤踞。', emoji: '🌑', element: '水', unlockRealm: 29, enemies: ['e_seadragon', 'e_bonelord'] },
  { id: 'a_demonrealm', name: '魔淵魔域', desc: '魔氣滔天之域，尊者與劍靈爭鋒。', emoji: '😈', element: '火', unlockRealm: 33, enemies: ['e_demonlord', 'e_swordspirit'] },
  { id: 'a_heaven', name: '九天雲海', desc: '仙人往來之地，天庭衛巡守四方。', emoji: '☁️', element: '金', unlockRealm: 41, enemies: ['e_immortalguard', 'e_chaosbeast'] },
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
    firstClear: { attrPoints: 2, items: [{ itemId: 'beast_dan_3', qty: 3 }] },
  },
  {
    id: 's_flame_cave',
    name: '烈焰洞天',
    desc: '火屬秘境，火君居於熔岩深處。水屬剋之。',
    emoji: '🌋',
    element: '火',
    unlockRealm: 17,
    waves: ['e_scorpion', 'e_firebird', 'e_firebird'],
    boss: 'b_flame_king',
    reward: { stones: 2400, items: [{ itemId: 'herb_3', qty: 4 }] },
    firstClear: { attrPoints: 3, dao: 1 },
  },
  {
    id: 's_wood_realm',
    name: '萬木秘境',
    desc: '木屬秘境，萬年樹妖以根須纏殺入侵者。金屬剋之。',
    emoji: '🌳',
    element: '木',
    unlockRealm: 21,
    waves: ['e_crane', 'e_ghost', 'e_ghost'],
    boss: 'b_wood_ancient',
    reward: { stones: 6000, items: [{ itemId: 'herb_3', qty: 8 }, { itemId: 'spirit_4', qty: 1 }] },
    firstClear: { attrPoints: 3, dao: 1 },
  },
  {
    id: 's_sword_tomb',
    name: '玄金劍冢',
    desc: '金屬秘境，萬劍長眠之地，守靈以劍氣禦敵。火屬剋之。',
    emoji: '🗡️',
    element: '金',
    unlockRealm: 25,
    waves: ['e_voidbeast', 'e_bonelord', 'e_voidbeast'],
    boss: 'b_sword_saint',
    reward: { stones: 18000, items: [{ itemId: 'ore_3', qty: 10 }, { itemId: 'beast_dan_5', qty: 2 }] },
    firstClear: { attrPoints: 4, dao: 2 },
  },
  {
    id: 's_earth_lair',
    name: '厚土龍窟',
    desc: '土屬秘境，龍君鎮守地脈核心。木屬剋之。',
    emoji: '🐲',
    element: '土',
    unlockRealm: 33,
    waves: ['e_bonelord', 'e_seadragon', 'e_demonlord'],
    boss: 'b_earth_dragon',
    reward: { stones: 60000, items: [{ itemId: 'beast_scale', qty: 3 }, { itemId: 'beast_dan_6', qty: 3 }] },
    firstClear: { attrPoints: 5, dao: 3 },
  },
  {
    id: 's_dao_arena',
    name: '太初道場',
    desc: '傳說中的道之試煉場，太初道影演化萬法。無屬性剋制，唯憑真實力。',
    emoji: '☯️',
    unlockRealm: 41,
    waves: ['e_immortalguard', 'e_chaosbeast', 'e_immortalguard', 'e_chaosbeast'],
    boss: 'b_dao_ancestor',
    reward: { stones: 800000, items: [{ itemId: 'essence_chaos', qty: 2 }, { itemId: 'beast_dan_6', qty: 10 }] },
    firstClear: { attrPoints: 10, dao: 8 },
  },
]

export function getEnemy(id: string): Enemy | undefined {
  return ENEMIES[id]
}

export function getDungeon(id: string): SecretRealm | undefined {
  return SECRET_REALMS.find((d) => d.id === id)
}
