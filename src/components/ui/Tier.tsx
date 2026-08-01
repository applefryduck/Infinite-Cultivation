const TIER_NAMES = ['凡品', '靈品', '玄品', '地品', '天品', '仙品', '神品', '道品']

/** 品階名稱（統一來源，避免各處重複定義） */
export function tierName(tier: number): string {
  return TIER_NAMES[Math.min(Math.max(tier, 1) - 1, TIER_NAMES.length - 1)] ?? `${tier}階`
}

/** 品階對應的樣式類名，用於著色 */
export function tierClass(tier: number): string {
  return `t${Math.min(Math.max(tier, 1), TIER_NAMES.length)}`
}

/** 品階徽章 */
export function TierBadge({ tier, compact }: { tier: number; compact?: boolean }) {
  return (
    <span className={`tier-badge ${tierClass(tier)}${compact ? ' compact' : ''}`} title={`品階 ${tier}`}>
      {compact ? tierName(tier).slice(0, 1) : tierName(tier)}
    </span>
  )
}
