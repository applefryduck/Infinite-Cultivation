import { useState, type ReactNode } from 'react'

/**
 * 可摺疊區塊。狀態記在 localStorage，讓玩家的收合偏好跨次保留。
 */
export function Collapsible({
  id,
  title,
  badge,
  defaultOpen = false,
  children,
}: {
  id: string
  title: ReactNode
  badge?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}) {
  const key = `ic-collapse-${id}`
  const [open, setOpen] = useState(() => {
    try {
      const saved = localStorage.getItem(key)
      return saved === null ? defaultOpen : saved === '1'
    } catch {
      return defaultOpen
    }
  })

  function toggle() {
    setOpen((prev) => {
      const next = !prev
      try {
        localStorage.setItem(key, next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }

  return (
    <section className="panel collapsible">
      <button className="collapse-head" onClick={toggle} aria-expanded={open}>
        <span className={'collapse-arrow' + (open ? ' open' : '')}>▸</span>
        <span className="collapse-title">{title}</span>
        {badge && <span className="collapse-badge">{badge}</span>}
      </button>
      {open && <div className="collapse-body">{children}</div>}
    </section>
  )
}
