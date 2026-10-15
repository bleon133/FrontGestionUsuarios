import type { Dispatch, SetStateAction } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/Button'
import { emptyDireccion, type DireccionDraft } from './perfilForm.types'
import styles from './PerfilFormModal.module.css'
import shared from '@/styles/shared.module.css'

interface PerfilDireccionesSectionProps {
  active: boolean
  direcciones: DireccionDraft[]
  setDirecciones: Dispatch<SetStateAction<DireccionDraft[]>>
  onRemove: (dir: DireccionDraft) => void
}

/** Pestaña "Direcciones": lista editable de bloques de dirección. */
export function PerfilDireccionesSection({
  active,
  direcciones,
  setDirecciones,
  onRemove,
}: PerfilDireccionesSectionProps) {
  return (
    <div className={active ? styles.listSection : styles.hidden} role="tabpanel">
      {direcciones.map((dir, index) => (
        <div key={dir.key} className={styles.block}>
          <div className={styles.blockHead}>
            <span className={styles.blockTitle}>Dirección {index + 1}</span>
            <button
              type="button"
              className={styles.removeBtn}
              onClick={() => onRemove(dir)}
              aria-label={`Quitar dirección ${index + 1}`}
            >
              <Trash2 size={15} aria-hidden="true" />
            </button>
          </div>
          <div className={shared.gridTwo}>
            <div className={shared.field}>
              <label className={shared.label} htmlFor={`d-calle-${dir.key}`}>
                Calle
              </label>
              <input
                id={`d-calle-${dir.key}`}
                className={shared.input}
                value={dir.Calle}
                onChange={(event) =>
                  setDirecciones((list) =>
                    list.map((item) =>
                      item.key === dir.key ? { ...item, Calle: event.target.value } : item,
                    ),
                  )
                }
              />
            </div>
            <div className={shared.field}>
              <label className={shared.label} htmlFor={`d-colonia-${dir.key}`}>
                Colonia
              </label>
              <input
                id={`d-colonia-${dir.key}`}
                className={shared.input}
                value={dir.Colonia}
                onChange={(event) =>
                  setDirecciones((list) =>
                    list.map((item) =>
                      item.key === dir.key ? { ...item, Colonia: event.target.value } : item,
                    ),
                  )
                }
              />
            </div>
            <div className={shared.field}>
              <label className={shared.label} htmlFor={`d-municipio-${dir.key}`}>
                Municipio
              </label>
              <input
                id={`d-municipio-${dir.key}`}
                className={shared.input}
                value={dir.Municipio}
                onChange={(event) =>
                  setDirecciones((list) =>
                    list.map((item) =>
                      item.key === dir.key ? { ...item, Municipio: event.target.value } : item,
                    ),
                  )
                }
              />
            </div>
            <div className={shared.field}>
              <label className={shared.label} htmlFor={`d-ext-${dir.key}`}>
                Núm. exterior <span className={shared.labelOptional}>(opcional)</span>
              </label>
              <input
                id={`d-ext-${dir.key}`}
                className={shared.input}
                value={dir.NumExterior}
                onChange={(event) =>
                  setDirecciones((list) =>
                    list.map((item) =>
                      item.key === dir.key ? { ...item, NumExterior: event.target.value } : item,
                    ),
                  )
                }
              />
            </div>
            <div className={shared.field}>
              <label className={shared.label} htmlFor={`d-int-${dir.key}`}>
                Núm. interior <span className={shared.labelOptional}>(opcional)</span>
              </label>
              <input
                id={`d-int-${dir.key}`}
                className={shared.input}
                value={dir.NumInterior}
                onChange={(event) =>
                  setDirecciones((list) =>
                    list.map((item) =>
                      item.key === dir.key ? { ...item, NumInterior: event.target.value } : item,
                    ),
                  )
                }
              />
            </div>
          </div>
        </div>
      ))}
      <Button variant="secondary" onClick={() => setDirecciones((list) => [...list, emptyDireccion()])}>
        <Plus size={15} aria-hidden="true" />
        Agregar dirección
      </Button>
    </div>
  )
}
