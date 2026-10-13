import type { ReactNode } from 'react'
import styles from './DataTable.module.css'

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  /** Oculta la columna en pantallas angostas. */
  hideOnMobile?: boolean
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string | number
  empty?: ReactNode
  /** Acciones de fila (menú "..."). */
  actions?: (row: T) => ReactNode
}

/**
 * Tabla oscura con encabezado y, en móvil, cada fila pasa a una tarjeta
 * apilada. Las columnas se etiquetan con `data-label` para ese modo.
 */
export function DataTable<T>({ columns, rows, rowKey, empty, actions }: DataTableProps<T>) {
  if (rows.length === 0 && empty) {
    return <>{empty}</>
  }

  const allColumns = actions
    ? [...columns, { key: '__actions', header: 'Acciones', render: () => null }]
    : columns

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {allColumns.map((column) => (
              <th
                key={column.key}
                className={column.hideOnMobile ? styles.hideMobile : undefined}
                scope="col"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  data-label={column.header}
                  className={column.hideOnMobile ? styles.hideMobile : undefined}
                >
                  {column.render(row)}
                </td>
              ))}
              {actions && (
                <td className={styles.actionsCell}>
                  <div className={styles.actionsWrap}>{actions(row)}</div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
