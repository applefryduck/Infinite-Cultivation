import type { FiveElement } from '../elements'

/** 修煉方式（technique）：消耗素材、產修為、各自累積精通 */
export interface Technique {
  id: string
  name: string
  desc: string
  /** 每秒消耗的素材（itemId → 每秒數量）；'spiritStones' 為特殊貨幣 */
  inputs: { itemId: string; perSec: number }[]
  qiPerSec: number // 基礎修為/秒（再乘上全域倍率）
  unlockRealm: number // 需達到的境界 stageIndex
  free?: boolean // 免費保底（不耗素材）
}

/** 修練體系招牌側加成（依體系等級給） */
export interface PathBonus {
  breakthroughPct?: number // 突破成功率加成
  failLossReduce?: number // 突破失敗損失減免（體修）
  craftSuccessPct?: number // 煉製成功率（神識）
  dropPct?: number // 掉率（神識）
  artifactSlots?: number // 額外御寶槽（神識）
  hpPct?: number // 氣血（體修）
  atkPct?: number // 攻擊（依風味）
}

export interface PathDef {
  id: string
  name: string
  desc: string
  element?: FiveElement
  combatRole: '術法' | '肉搏' | '御劍'
  techniques: Technique[]
  /** 依體系等級計算招牌加成 */
  signature: (level: number) => PathBonus
}

export const PATHS: PathDef[] = [
  {
    id: 'lingxiu',
    name: '靈修',
    desc: '正統靈氣修煉，均衡而穩健，突破最穩。',
    combatRole: '術法',
    techniques: [
      { id: 'lx_tuna', name: '吐納打坐', desc: '吐納天地靈氣，緩慢而不竭。', inputs: [], qiPerSec: 1, unlockRealm: 0, free: true },
      { id: 'lx_herb', name: '服食靈草', desc: '服食靈草化為修為。', inputs: [{ itemId: 'herb_1', perSec: 0.15 }], qiPerSec: 4, unlockRealm: 0 },
      { id: 'lx_stone', name: '靈石淬煉', desc: '碾碎靈石吸納其中靈氣。', inputs: [{ itemId: 'spiritStones', perSec: 2 }], qiPerSec: 9, unlockRealm: 9 },
    ],
    signature: (lv) => ({ breakthroughPct: Math.min(0.25, lv * 0.004) }),
  },
  {
    id: 'tixiu',
    name: '體修',
    desc: '煉體鍛骨，肉身強橫，突破抗反噬、戰力雄厚。',
    element: '土',
    combatRole: '肉搏',
    techniques: [
      { id: 'tx_forge', name: '鍛骨', desc: '以苦修錘鍊肉身。', inputs: [], qiPerSec: 0.8, unlockRealm: 0, free: true },
      { id: 'tx_dan', name: '吞噬妖丹', desc: '吞服妖丹淬鍊肉身。', inputs: [{ itemId: 'beast_dan_1', perSec: 0.1 }], qiPerSec: 5, unlockRealm: 0 },
      { id: 'tx_blood', name: '淬血洗髓', desc: '以妖獸精血洗練骨血。', inputs: [{ itemId: 'beast_blood', perSec: 0.05 }], qiPerSec: 8, unlockRealm: 9 },
    ],
    signature: (lv) => ({ hpPct: lv * 0.03, atkPct: lv * 0.02, failLossReduce: Math.min(0.6, lv * 0.01) }),
  },
  {
    id: 'shenshi',
    name: '神識',
    desc: '溫養識海，神識強則煉製精、御寶多、感知銳。',
    combatRole: '御劍',
    techniques: [
      { id: 'ss_guan', name: '入定觀想', desc: '靜觀識海，神念漸長。', inputs: [], qiPerSec: 0.9, unlockRealm: 0, free: true },
      { id: 'ss_dream', name: '神念淬煉', desc: '以夢境碎片淬鍊神念。', inputs: [{ itemId: 'spirit_1', perSec: 0.1 }], qiPerSec: 5, unlockRealm: 0 },
      { id: 'ss_soul', name: '煉魂', desc: '煉化妖魂壯大神識。', inputs: [{ itemId: 'beast_soul', perSec: 0.05 }], qiPerSec: 8, unlockRealm: 9 },
    ],
    signature: (lv) => ({
      craftSuccessPct: Math.min(0.4, lv * 0.008),
      dropPct: lv * 0.01,
      artifactSlots: Math.floor(lv / 25),
    }),
  },
]

export const PATH_MAP: Record<string, PathDef> = Object.fromEntries(PATHS.map((p) => [p.id, p]))

export function getTechnique(pathId: string, techId: string): Technique | undefined {
  return PATH_MAP[pathId]?.techniques.find((t) => t.id === techId)
}
