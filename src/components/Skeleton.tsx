import styles from './Skeleton.module.css'

interface SkeletonProps {
  rows?: number
  variant?: 'table' | 'card'
}

/** Marcador de carga. Evita mostrar una tabla vacía mientras llegan los datos. */
export function Skeleton({ rows = 6, variant = 'table' }: SkeletonProps) {
  if (variant === 'card') {
    return (
      <div className={styles.cardRow}>
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className={styles.card} />
        ))}
      </div>
    )
  }

  return (
    <div className={styles.table} aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className={styles.row} />
      ))}
    </div>
  )
}
