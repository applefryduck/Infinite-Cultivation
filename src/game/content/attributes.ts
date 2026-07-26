export type AttrId = 'genGu' | 'wuXing' | 'shenShi' | 'qiYun' | 'daoXin'

export interface AttrDef {
  id: AttrId
  name: string
  emoji: string
  desc: string
  /** 該屬性影響的衍生數值說明（顯示用） */
  effects: string[]
  color: string
}

export const ATTRIBUTES: AttrDef[] = [
  {
    id: 'genGu',
    name: '根骨',
    emoji: '🦴',
    desc: '肉身根基，決定體魄強度與承受力。',
    effects: ['氣血上限 +2%/點', '防禦 +1.5/點', '體修修為 +1%/點'],
    color: '#c9a06b',
  },
  {
    id: 'wuXing',
    name: '悟性',
    emoji: '📖',
    desc: '領悟天地至理的資質，修行事半功倍。',
    effects: ['修為速率 +1.2%/點', '技能經驗 +1%/點'],
    color: '#6db3f2',
  },
  {
    id: 'shenShi',
    name: '神識',
    emoji: '🔮',
    desc: '識海之力，御使法寶與洞察萬物之本。',
    effects: ['煉製成功率 +0.8%/點', '暴擊 +0.3%/點', '每 20 點 +1 御寶槽'],
    color: '#b48ce8',
  },
  {
    id: 'qiYun',
    name: '氣運',
    emoji: '🍀',
    desc: '冥冥中的天命，機緣與造化皆繫於此。',
    effects: ['掉落率 +1%/點', '奇遇機率 +1.5%/點', '雷劫選項品質提升'],
    color: '#5fd6a3',
  },
  {
    id: 'daoXin',
    name: '道心',
    emoji: '☯️',
    desc: '道途堅定之心，抗心魔、渡雷劫的憑仗。',
    effects: ['突破成功率 +0.5%/點', '突破失敗減損 -1%/點', '雷劫承受 +2%/點'],
    color: '#e8c469',
  },
]

export const ATTR_MAP: Record<AttrId, AttrDef> = Object.fromEntries(
  ATTRIBUTES.map((a) => [a.id, a]),
) as Record<AttrId, AttrDef>

/**
 * 屬性等級曲線：以累積鍛鍊值換算屬性點。
 * 採平方根遞減，避免長期掛機無限線性膨脹。
 * 10 練值 = 1 點，之後遞增。
 */
export function attrPoints(trainValue: number): number {
  if (trainValue <= 0) return 0
  return Math.floor(Math.sqrt(trainValue / 10))
}

/** 距離下一點所需的累積鍛鍊值 */
export function trainForPoints(points: number): number {
  return points * points * 10
}

/** 目前這一點的進度 0..1 */
export function attrProgress(trainValue: number): number {
  const p = attrPoints(trainValue)
  const cur = trainForPoints(p)
  const next = trainForPoints(p + 1)
  if (next === cur) return 1
  return Math.min(1, Math.max(0, (trainValue - cur) / (next - cur)))
}
