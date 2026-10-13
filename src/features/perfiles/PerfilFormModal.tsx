import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { perfilesApi } from '@/api/perfiles'
import { usuariosApi } from '@/api/usuarios'
import { direccionesApi } from '@/api/direcciones'
import { telefonosApi } from '@/api/telefonos'
import type { PerfilUsuarioDto } from '@/api/types'
import { Modal } from '@/components/Modal'
import { Button } from '@/components/Button'
import { useToast } from '@/components/Toast'
import { rules } from '@/utils/validation'
import { trim, trimOrNull } from '@/utils/format'
import styles from './PerfilFormModal.module.css'
import shared from '@/styles/shared.module.css'

interface PerfilFormModalProps {
  perfil: PerfilUsuarioDto | null
  onClose: () => void
}

interface DireccionDraft {
  key: number
  Id?: number
  Calle: string
  Colonia: string
  Municipio: string
  NumExterior: string
  NumInterior: string
}

interface TelefonoDraft {
  key: number
  Id?: number
  Celular: string
  Casa: string
  Oficina: string
}

interface PerfilForm {
  nombre: string
  apellidoPaterno: string
  apellidoMaterno: string
  rfc: string
  fechaNacimiento: string
  idUsuario: string
}

let draftKey = 0
const nextKey = () => draftKey++

function emptyDireccion(): DireccionDraft {
  return { key: nextKey(), Calle: '', Colonia: '', Municipio: '', NumExterior: '', NumInterior: '' }
}

function emptyTelefono(): TelefonoDraft {
  return { key: nextKey(), Celular: '', Casa: '', Oficina: '' }
}

/** Indica si el bloque tiene algún dato capturado. */
function direccionCapturada(dir: DireccionDraft): boolean {
  return Boolean(dir.Calle.trim() || dir.Colonia.trim() || dir.Municipio.trim())
}

function telefonoCapturado(tel: TelefonoDraft): boolean {
  return Boolean(tel.Celular.trim() || tel.Casa.trim() || tel.Oficina.trim())
}

const DIGITS_10 = /^[0-9]{10}$/

export function PerfilFormModal({ perfil, onClose }: PerfilFormModalProps) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [tab, setTab] = useState<'perfil' | 'direcciones' | 'telefonos'>('perfil')
  const [direcciones, setDirecciones] = useState<DireccionDraft[]>([])
  const [telefonos, setTelefonos] = useState<TelefonoDraft[]>([])
  const [removedDirecciones, setRemovedDirecciones] = useState<number[]>([])
  const [removedTelefonos, setRemovedTelefonos] = useState<number[]>([])
  // Id con el que se guarda. Al crear un perfil se rellena tras recuperarlo.
  const [perfilId, setPerfilId] = useState<number | null>(perfil?.Id ?? null)
  const isEdit = perfilId !== null

  const usuarios = useQuery({ queryKey: ['usuarios'], queryFn: usuariosApi.list })

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<PerfilForm>({
    defaultValues: {
      nombre: perfil?.Nombre ?? '',
      apellidoPaterno: perfil?.ApellidoPaterno ?? '',
      apellidoMaterno: perfil?.ApellidoMaterno ?? '',
      rfc: perfil?.Rfc ?? '',
      fechaNacimiento: perfil?.FechaNacimiento?.substring(0, 10) ?? '',
      idUsuario: perfil?.IdUsuario ? String(perfil.IdUsuario) : '',
    },
  })

  useEffect(() => {
    if (!perfil) {
      setDirecciones([])
      setTelefonos([])
      return
    }
    setDirecciones(
      (perfil.DireccionDtos ?? []).map((dir) => ({
        key: nextKey(),
        Id: dir.Id,
        Calle: dir.Calle ?? '',
        Colonia: dir.Colonia ?? '',
        Municipio: dir.Municipio ?? '',
        NumExterior: dir.NumExterior ?? '',
        NumInterior: dir.NumInterior ?? '',
      })),
    )
    setTelefonos(
      (perfil.TelefonosDtos ?? []).map((tel) => ({
        key: nextKey(),
        Id: tel.Id,
        Celular: tel.Celular ?? '',
        Casa: tel.Casa ?? '',
        Oficina: tel.Oficina ?? '',
      })),
    )
  }, [perfil])

  const saveMutation = useMutation({
    mutationFn: async (values: PerfilForm) => {
      const payload = {
        Nombre: trim(values.nombre),
        ApellidoPaterno: trim(values.apellidoPaterno),
        ApellidoMaterno: trimOrNull(values.apellidoMaterno),
        Rfc: trimOrNull(values.rfc)?.toUpperCase() ?? null,
        FechaNacimiento: values.fechaNacimiento,
        IdUsuario: Number(values.idUsuario),
      }

      // 1. Perfil. Al crear, el backend responde solo `true`: el Id se recupera
      //    consultando por usuario. Ese endpoint devuelve un único perfil.
      let id = perfilId
      if (id === null) {
        await perfilesApi.create(payload)
        const creado = await perfilesApi.byUsuario(payload.IdUsuario)
        if (!creado || !creado.Id) {
          throw new Error('El perfil se creó pero no se pudo recuperar su Id.')
        }
        id = creado.Id
        setPerfilId(id)
      } else {
        await perfilesApi.update(id, payload)
      }

      // 2. Direcciones quitadas: se eliminan del servidor.
      for (const idDir of removedDirecciones) {
        await direccionesApi.remove(idDir)
      }
      setRemovedDirecciones([])

      // 3. Direcciones nuevas o editadas.
      for (const dir of direcciones) {
        if (!direccionCapturada(dir)) continue
        const dirPayload = {
          Calle: trim(dir.Calle),
          Colonia: trim(dir.Colonia),
          Municipio: trim(dir.Municipio),
          NumExterior: trimOrNull(dir.NumExterior),
          NumInterior: trimOrNull(dir.NumInterior),
          IdPerfilUsuario: id,
        }
        try {
          if (dir.Id) await direccionesApi.update(dir.Id, dirPayload)
          else await direccionesApi.create(dirPayload)
        } catch (error) {
          const base = error instanceof Error ? error.message : 'error desconocido'
          throw new Error(`No se pudo guardar la dirección "${dir.Calle || 'sin calle'}": ${base}`)
        }
      }

      // 4. Teléfonos quitados.
      for (const idTel of removedTelefonos) {
        await telefonosApi.remove(idTel)
      }
      setRemovedTelefonos([])

      // 5. Teléfonos nuevos o editados.
      for (const tel of telefonos) {
        if (!telefonoCapturado(tel)) continue
        const telPayload = {
          Celular: trim(tel.Celular),
          Casa: trimOrNull(tel.Casa),
          Oficina: trimOrNull(tel.Oficina),
          IdPerfilUsuario: id,
        }
        try {
          if (tel.Id) await telefonosApi.update(tel.Id, telPayload)
          else await telefonosApi.create(telPayload)
        } catch (error) {
          const base = error instanceof Error ? error.message : 'error desconocido'
          throw new Error(`No se pudo guardar el teléfono "${tel.Celular}": ${base}`)
        }
      }

      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['perfiles'] })
      queryClient.invalidateQueries({ queryKey: ['direcciones'] })
      queryClient.invalidateQueries({ queryKey: ['telefonos'] })
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      toast.success(isEdit ? 'Perfil actualizado.' : 'Perfil creado.')
      onClose()
    },
    onError: (error) => {
      // Si la creación del perfil tuvo éxito parcial (el perfil ya existe),
      // se marca para que un reintento actualice en vez de crear otro.
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar el perfil.')
    },
  })

  const usuariosDisponibles = usuarios.data ?? []

  const submit = handleSubmit(async (values) => {
    // Validación manual de los bloques de las pestañas ocultas.
    if (values.idUsuario === '' || Number(values.idUsuario) <= 0) {
      setTab('perfil')
      await trigger('idUsuario')
      return
    }

    for (const dir of direcciones) {
      if (!direccionCapturada(dir)) continue
      if (!dir.Calle.trim() || !dir.Colonia.trim() || !dir.Municipio.trim()) {
        setTab('direcciones')
        toast.error('Completa calle, colonia y municipio en cada dirección capturada.')
        return
      }
    }

    for (const tel of telefonos) {
      if (!telefonoCapturado(tel)) continue
      if (!DIGITS_10.test(tel.Celular.trim())) {
        setTab('telefonos')
        toast.error('Cada teléfono capturado necesita un celular de 10 dígitos.')
        return
      }
    }

    saveMutation.mutate(values)
  })

  const removeDireccion = (dir: DireccionDraft) => {
    if (dir.Id) setRemovedDirecciones((list) => [...list, dir.Id as number])
    setDirecciones((list) => list.filter((item) => item.key !== dir.key))
  }

  const removeTelefono = (tel: TelefonoDraft) => {
    if (tel.Id) setRemovedTelefonos((list) => [...list, tel.Id as number])
    setTelefonos((list) => list.filter((item) => item.key !== tel.key))
  }

  return (
    <Modal
      open
      title={isEdit && perfilId && perfilId > 0 ? `Editar perfil #${perfilId}` : 'Nuevo perfil'}
      onClose={onClose}
      width={640}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="perfil-form" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Guardando…' : 'Guardar'}
          </Button>
        </>
      }
    >
      <div className={styles.tabs} role="tablist">
        {[
          { id: 'perfil' as const, label: 'Perfil' },
          { id: 'direcciones' as const, label: `Direcciones${direcciones.length ? ` (${direcciones.length})` : ''}` },
          { id: 'telefonos' as const, label: `Teléfonos${telefonos.length ? ` (${telefonos.length})` : ''}` },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={`${styles.tab} ${tab === item.id ? styles.tabActive : ''}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <form id="perfil-form" onSubmit={submit} noValidate>
        <div
          className={tab === 'perfil' ? styles.listSection : styles.hidden}
          role="tabpanel"
          aria-label="Perfil"
        >
          <div className={shared.gridTwo}>
            <div className={shared.field}>
              <label className={shared.label} htmlFor="p-nombre">
                Nombre
              </label>
              <input id="p-nombre" className={shared.input} {...register('nombre', rules.nombre)} />
              {errors.nombre && <span className={shared.error}>{errors.nombre.message}</span>}
            </div>
            <div className={shared.field}>
              <label className={shared.label} htmlFor="p-pat">
                Apellido paterno
              </label>
              <input id="p-pat" className={shared.input} {...register('apellidoPaterno', rules.nombre)} />
              {errors.apellidoPaterno && (
                <span className={shared.error}>{errors.apellidoPaterno.message}</span>
              )}
            </div>
            <div className={shared.field}>
              <label className={shared.label} htmlFor="p-mat">
                Apellido materno <span className={shared.labelOptional}>(opcional)</span>
              </label>
              <input
                id="p-mat"
                className={shared.input}
                {...register('apellidoMaterno', rules.nombreOpcional)}
              />
              {errors.apellidoMaterno && (
                <span className={shared.error}>{errors.apellidoMaterno.message}</span>
              )}
            </div>
            <div className={shared.field}>
              <label className={shared.label} htmlFor="p-rfc">
                RFC <span className={shared.labelOptional}>(opcional)</span>
              </label>
              <input
                id="p-rfc"
                className={shared.input}
                maxLength={13}
                style={{ textTransform: 'uppercase' }}
                {...register('rfc', rules.rfc)}
              />
              {errors.rfc && <span className={shared.error}>{errors.rfc.message}</span>}
            </div>
            <div className={shared.field}>
              <label className={shared.label} htmlFor="p-fecha">
                Fecha de nacimiento
              </label>
              <input
                id="p-fecha"
                type="date"
                className={shared.input}
                {...register('fechaNacimiento', rules.fechaNoFutura)}
              />
              {errors.fechaNacimiento && (
                <span className={shared.error}>{errors.fechaNacimiento.message}</span>
              )}
            </div>
            <div className={shared.field}>
              <label className={shared.label} htmlFor="p-usuario">
                Usuario
              </label>
              <select
                id="p-usuario"
                className={shared.select}
                {...register('idUsuario', { required: 'Selecciona un usuario.' })}
              >
                <option value="">Selecciona un usuario</option>
                {usuariosDisponibles.map((usuario) => (
                  <option key={usuario.Id} value={usuario.Id}>
                    {usuario.Username}
                  </option>
                ))}
              </select>
              {errors.idUsuario && <span className={shared.error}>{errors.idUsuario.message}</span>}
            </div>
          </div>
        </div>

        <div className={tab === 'direcciones' ? styles.listSection : styles.hidden} role="tabpanel">
          {direcciones.map((dir, index) => (
            <div key={dir.key} className={styles.block}>
              <div className={styles.blockHead}>
                <span className={styles.blockTitle}>Dirección {index + 1}</span>
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeDireccion(dir)}
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

        <div className={tab === 'telefonos' ? styles.listSection : styles.hidden} role="tabpanel">
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
                  onClick={() => removeTelefono(tel)}
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
      </form>
    </Modal>
  )
}
