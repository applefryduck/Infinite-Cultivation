import type { ItemCategory } from '../../game/content/items'

export const CATEGORY_LABEL: Record<ItemCategory, string> = {
  element: '五行之源',
  herb: '靈草',
  ore: '礦石',
  beast: '獸材',
  spirit: '精神',
  material: '靈材',
  essence: '本源',
  pill: '丹藥',
  artifact: '法寶',
  talisman: '符籙',
}

export const EFFECT_LABEL: Record<string, string> = {
  qi: '增修為',
  breakthrough: '助突破',
  speedBuff: '限時提速',
  permaSpeed: '永久提速',
  heal: '戰鬥回血',
}
