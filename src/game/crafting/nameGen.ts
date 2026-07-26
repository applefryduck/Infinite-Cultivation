import type { ItemCategory, ItemDef } from '../content/items'

// 依 tier 挑品質前綴
const QUALITY_PREFIX = [
  ['凡', '粗'],
  ['靈', '青'],
  ['玄', '赤炎'],
  ['地', '玄冰'],
  ['天', '紫雷'],
  ['仙', '太虛'],
  ['混沌', '九天'],
]

const NOUNS: Record<ItemCategory, string[]> = {
  element: ['之源'],
  herb: ['靈草', '仙草', '靈參', '妙花'],
  ore: ['靈礦', '精鐵', '寶晶', '玄石'],
  beast: ['妖材', '獸精', '魂魄'],
  spirit: ['神念', '夢砂', '識晶'],
  material: ['藥泥', '器胚', '靈材', '丹基'],
  essence: ['本源', '精華', '玉髓'],
  pill: ['聚氣丹', '凝元丹', '破境丹', '洗髓丹', '凝神丹', '大還丹', '九轉金丹'],
  artifact: ['飛劍', '法幡', '寶鼎', '靈珠', '寶鏡', '法鈴', '玉符'],
  talisman: ['靈符', '雷符', '護身符', '爆焰符'],
}

export function qualityPrefix(tier: number, seed: number): string {
  const row = QUALITY_PREFIX[Math.min(tier - 1, QUALITY_PREFIX.length - 1)]
  return row[Math.abs(seed) % row.length]
}

/** 生成物品名稱（素材類：品質前綴 + 類別名詞） */
export function genName(category: ItemCategory, tier: number, seed: number): string {
  const nouns = NOUNS[category] ?? ['奇物']
  const noun = nouns[Math.abs(seed) % nouns.length]
  return `${qualityPrefix(tier, seed >> 3)}${noun}`
}

/** 由兩輸入穩定產生 seed（同組合永遠同結果） */
export function seedFromInputs(a: ItemDef, b?: ItemDef): number {
  const s = b ? [a.id, b.id].sort().join('|') : `refine|${a.id}`
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return h
}
