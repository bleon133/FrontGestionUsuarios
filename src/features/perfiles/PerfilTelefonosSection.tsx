import type { Dispatch, SetStateAction } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/Button'
import { emptyTelefono, type TelefonoDraft } from './perfilForm.types'
import styles from './PerfilFormModal.module.css'
import shared from '@/styles/shared.module.css'

interface PerfilTelefonosSectionProps {
  active: boolean
  telefonos: TelefonoDraft[]
  setTelefonos: Dispatch<SetStateAction<TelefonoDraft[]>>
  onRemove: (tel: TelefonoDraft) => void
}

/** Pestaña "Teléfonos": lista editable de bloques de teléfono. */
export function PerfilTelefonosSection({
  active,
  telefonos,
  setTelefonos,
  onRemove,
}: PerfilTelefonosSectionProps) {
  return (
    <div className={active ? styles.listSection : styles.hidden} role="tabpanel">
      <p className={styles.note}>
        Cada bloque es un registro de teléfonos. El celular es obligatorio si el bloque se captura.
      </p>
      {telefonos.map((tel, index) => (
        <div key={tel.key} className={styles.block}>
          <div className={styles.blockHead}>
            <span className={styles.blockTitle}>Teléfono {index + 1}</span>
            <button
              type="button"
              className={styles.removeBtn}
              onClick={() => onRemove(tel)}
              aria-label={`Quitar teléfono ${index + 1}`}
            >
              <Trash2 size={15} aria-hidden="true" />
            </button>
          </div>
          <div className={styles.phoneRow}>
            <div className={shared.field}>
              <label className={shared.label} htmlFor={`t-cel-${tel.key}`}>
                Celular
              </label>
              <input
                id={`t-cel-${tel.key}`}
                className={shared.input}
                inputMode="numeric"
                maxLength={10}
                value={tel.Celular}
                onChange={(event) =>
                  setTelefonos((list) =>
                    list.map((item) =>
                      item.key === tel.key
                        ? { ...item, Celular: event.target.value.replace(/\D/g, '') }
                        : item,
                    ),
                  )
                }
              />
            </div>
            <div className={shared.field}>
              <label className={shared.label} htmlFor={`t-casa-${tel.key}`}>
                Casa <span className={shared.labelOptional}>(opcional)</span>
              </label>
              <input
                id={`t-casa-${tel.key}`}
                className={shared.input}
                inputMode="numeric"
                maxLength={10}
                value={tel.Casa}
                onChange={(event) =>
                  setTelefonos((list) =>
                    list.map((item) =>
                      item.key === tel.key
                        ? { ...item, Casa: event.target.value.replace(/\D/g, '') }
                        : item,
                    ),
                  )
                }
              />
            </div>
            <div className={shared.field}>
              <label className={shared.label} htmlFor={`t-ofi-${tel.key}`}>
                Oficina <span className={shared.labelOptional}>(opcional)</span>
              </label>
              <input
                id={`t-ofi-${tel.key}`}
                className={shared.input}
                inputMode="numeric"
                maxLength={10}
                value={tel.Oficina}
                onChange={(event) =>
                  setTelefonos((list) =>
                    list.map((item) =>
                      item.key === tel.key
                        ? { ...item, Oficina: event.target.value.replace(/\D/g, '') }
                        : item,
                    ),
                  )
                }
              />
            </div>
          </div>
        </div>
      ))}
      <Button variant="secondary" onClick={() => setTelefonos((list) => [...list, emptyTelefono()])}>
        <Plus size={15} aria-hidden="true" />
        Agregar teléfono
      </Button>
    </div>
  )
}
