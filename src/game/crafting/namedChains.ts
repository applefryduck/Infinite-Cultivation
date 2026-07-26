import type { ItemDef } from '../content/items'

/**
 * 手工策劃的招牌發現鏈：以無序 key（輸入 id 排序後 join '+'）對應一個完整結果覆寫。
 * 命中時優先於程序化生成，用來製造彩蛋與成就感。
 */
export interface NamedResult extends Omit<ItemDef, 'id'> {
  firstDiscoveryReward?: { stones?: number; dao?: number }
}

export const NAMED_CHAINS: Record<string, NamedResult> = {
  // 妖魂 + 魂玉 → 元嬰雛形（神識聖物 · 法寶）
  'beast_soul+essence_soul': {
    name: '元嬰雛形',
    emoji: '👶',
    category: 'artifact',
    tier: 5,
    slot: '器',
    bonus: { speedPct: 0.3, dropPct: 0.15 },
    desc: '以魂玉溫養妖魂而成的元嬰雛形，神識大進。',
    firstDiscoveryReward: { dao: 3, stones: 5000 },
  },
  // 玄鐵 + 雷 → 紫霄神雷劍（招牌飛劍）
  'el_thunder+ore_2': {
    name: '紫霄神雷劍',
    emoji: '⚡',
    category: 'artifact',
    tier: 4,
    slot: '劍',
    element: '金',
    bonus: { atk: 120, speedPct: 0.1 },
    desc: '玄鐵引天雷淬煉三千次而成的本命飛劍。',
    firstDiscoveryReward: { stones: 3000 },
  },
  // 九葉靈芝 + 赤血蓮 → 九轉金丹（頂級聚氣丹）
  'herb_2+herb_3': {
    name: '九轉金丹',
    emoji: '🟡',
    category: 'pill',
    tier: 5,
    effect: { kind: 'qi', k: 3 },
    desc: '傳說中的九轉金丹，服之修為暴漲。',
    firstDiscoveryReward: { stones: 2000 },
  },
}

export function lookupNamedChain(key: string): NamedResult | undefined {
  return NAMED_CHAINS[key]
}
