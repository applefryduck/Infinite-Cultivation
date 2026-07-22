import { useEffect } from 'react'
import { useGame, startAutoSave } from './store'

const TICK_MS = 250

/**
 * 驅動遊戲主迴圈：固定間隔結算修煉，並在頁面重新可見時補算時間。
 */
export function useGameLoop(): void {
  const tick = useGame((s) => s.tick)

  useEffect(() => {
    startAutoSave()
    let last = performance.now()
    const id = setInterval(() => {
      const now = performance.now()
      const delta = now - last
      last = now
      tick(delta)
    }, TICK_MS)

    const onVisible = () => {
      last = performance.now()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [tick])
}
