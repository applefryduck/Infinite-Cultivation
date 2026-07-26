/** 採集技能與動作 */
export interface GatherAction {
  id: string
  name: string
  produces: string // itemId
  qtyPerCycle: number
  cycleSec: number // 一輪採集秒數
  unlockLevel: number // 需要的採集技能等級
  xp: number // 每輪給的技能 XP
}

export interface GatherSkill {
  id: string
  name: string
  emoji: string
  desc: string
  actions: GatherAction[]
}

export const GATHER_SKILLS: GatherSkill[] = [
  {
    id: 'caiyao',
    name: '採藥',
    emoji: '🌿',
    desc: '上山採摘靈草，煉丹之本。',
    actions: [
      { id: 'gy_1', name: '採凝露草', produces: 'herb_1', qtyPerCycle: 1, cycleSec: 3, unlockLevel: 1, xp: 8 },
      { id: 'gy_2', name: '採九葉靈芝', produces: 'herb_2', qtyPerCycle: 1, cycleSec: 6, unlockLevel: 15, xp: 22 },
      { id: 'gy_3', name: '採赤血蓮', produces: 'herb_3', qtyPerCycle: 1, cycleSec: 11, unlockLevel: 35, xp: 55 },
    ],
  },
  {
    id: 'kuang',
    name: '採礦',
    emoji: '⛏️',
    desc: '開採靈脈礦石，煉器之基。',
    actions: [
      { id: 'gk_1', name: '採靈鐵', produces: 'ore_1', qtyPerCycle: 1, cycleSec: 3, unlockLevel: 1, xp: 8 },
      { id: 'gk_2', name: '採玄鐵', produces: 'ore_2', qtyPerCycle: 1, cycleSec: 6, unlockLevel: 15, xp: 22 },
      { id: 'gk_3', name: '採寒玉晶', produces: 'ore_3', qtyPerCycle: 1, cycleSec: 11, unlockLevel: 35, xp: 55 },
    ],
  },
  {
    id: 'guanxiang',
    name: '觀想',
    emoji: '🌙',
    desc: '入定觀星，凝聚精神靈材。',
    actions: [
      { id: 'gg_1', name: '拾夢境碎片', produces: 'spirit_1', qtyPerCycle: 1, cycleSec: 4, unlockLevel: 1, xp: 10 },
      { id: 'gg_2', name: '凝夢境本源', produces: 'spirit_2', qtyPerCycle: 1, cycleSec: 8, unlockLevel: 20, xp: 30 },
      { id: 'gg_3', name: '煉精神靈砂', produces: 'spirit_3', qtyPerCycle: 1, cycleSec: 14, unlockLevel: 40, xp: 70 },
    ],
  },
]

export const GATHER_SKILL_MAP: Record<string, GatherSkill> = Object.fromEntries(
  GATHER_SKILLS.map((s) => [s.id, s]),
)

export function getGatherAction(id: string): { skill: GatherSkill; action: GatherAction } | undefined {
  for (const skill of GATHER_SKILLS) {
    const action = skill.actions.find((a) => a.id === id)
    if (action) return { skill, action }
  }
  return undefined
}

/** 製作技能（煉丹/煉器）僅有等級，用於精通與解鎖 */
export const CRAFT_SKILLS = [
  { id: 'liandan', name: '煉丹', emoji: '⚗️' },
  { id: 'lianqi', name: '煉器', emoji: '🔨' },
] as const
