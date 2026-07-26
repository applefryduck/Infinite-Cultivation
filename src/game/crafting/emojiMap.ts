import type { ItemCategory } from '../content/items'

const POOL: Record<ItemCategory, string[]> = {
  element: ['🌫️'],
  herb: ['🌿', '🍀', '🌺', '🌷', '☘️', '🪷'],
  ore: ['🪨', '⛏️', '💎', '🧱', '🪙'],
  beast: ['🔴', '🩸', '👻', '🐾', '🦴'],
  spirit: ['🌙', '🔮', '✨', '💫', '🌌'],
  material: ['🧪', '🫙', '🧵', '🪵', '🔩'],
  essence: ['🫧', '💠', '🌀'],
  pill: ['💊', '🟢', '🔵', '🟡', '🟣', '⚪'],
  artifact: ['⚔️', '🛡️', '🏺', '🔱', '🪄', '🔔', '📿'],
  talisman: ['🎴', '📜', '🧧'],
}

/** 依類別與種子挑一個穩定 emoji */
export function pickEmoji(category: ItemCategory, seed: number): string {
  const pool = POOL[category] ?? ['❔']
  return pool[Math.abs(seed) % pool.length]
}
