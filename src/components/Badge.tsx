import type { ReactNode } from 'react'
import styles from './Badge.module.css'

type Tone = 'neutral' | 'ok' | 'danger' | 'warn' | 'accent'

interface BadgeProps {
  children: ReactNode
  tone?: Tone
}

export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>
}
