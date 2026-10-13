import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, X } from 'lucide-react'
import { usuariosApi } from '@/api/usuarios'
import { rolesApi } from '@/api/roles'
import { usuarioRolesApi } from '@/api/usuarioRoles'
import type { UsuariosDto } from '@/api/types'
import { Modal } from '@/components/Modal'
import { Button } from '@/components/Button'
import { useToast } from '@/components/Toast'
import { rules } from '@/utils/validation'
import { trim } from '@/utils/format'
import styles from './UsuarioFormModal.module.css'
import shared from '@/styles/shared.module.css'

interface UsuarioFormModalProps {
  usuario: UsuariosDto | null
  onClose: () => void
}

interface FormValues {
  username: string
  password: string
  suspendido: boolean
}

export function UsuarioFormModal({ usuario, onClose }: UsuarioFormModalProps) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const isEdit = usuario !== null
  const [tab, setTab] = useState<'datos' | 'roles'>('datos')
  const [selectedRole, setSelectedRole] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      username: usuario?.Username ?? '',
      password: '',
      suspendido: usuario?.Suspendido ?? false,
    },
  })

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: rolesApi.list,
  })

  const { data: asignados, refetch: refetchAsignados } = useQuery({
    queryKey: ['usuarioRoles', usuario?.Id],
    queryFn: () => usuarioRolesApi.byUsuario(usuario!.Id),
    enabled: isEdit,
  })

  // Al cambiar a la pestaña de roles se refrescan los asignados.
  useEffect(() => {
    if (tab === 'roles' && isEdit) void refetchAsignados()
  }, [tab, isEdit, refetchAsignados])

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const username = trim(values.username)
      // La contraseña no se recorta: puede contener espacios significativos.
      const password = values.password

      if (isEdit) {
        // La contraseña es opcional al editar: si va vacía, no se envía.
        await usuariosApi.update(usuario.Id, {
          Username: username,
          Suspendido: values.suspendido,
          ...(password ? { Password: password } : {}),
        })
        return
      }

      await usuariosApi.create({ Username: username, Password: password, Suspendido: values.suspendido })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      toast.success(isEdit ? 'Usuario actualizado.' : 'Usuario creado.')
      onClose()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar.')
    },
  })

  const assignMutation = useMutation({
    mutationFn: (idRol: number) =>
      usuarioRolesApi.create({ IdUsuario: usuario!.Id, IdRol: idRol }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      queryClient.invalidateQueries({ queryKey: ['usuarioRoles', usuario?.Id] })
      setSelectedRole('')
      toast.success('Rol asignado.')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo asignar el rol.')
    },
  })

  const removeMutation = useMutation({
    mutationFn: (id: number) => usuarioRolesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      queryClient.invalidateQueries({ queryKey: ['usuarioRoles', usuario?.Id] })
      toast.success('Rol quitado.')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo quitar el rol.')
    },
  })

  const assignedIds = new Set((asignados ?? []).map((item) => item.IdRol))
  const disponibles = (roles ?? []).filter((rol) => !assignedIds.has(rol.Id))

  return (
    <Modal
      open
      title={isEdit ? `Editar usuario #${usuario.Id}` : 'Nuevo usuario'}
      onClose={onClose}
      width={520}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="usuario-form"
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Guardando…' : 'Guardar'}
          </Button>
        </>
      }
    >
      <div className={styles.tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'datos'}
          className={`${styles.tab} ${tab === 'datos' ? styles.tabActive : ''}`}
          onClick={() => setTab('datos')}
        >
          Datos
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'roles'}
          className={`${styles.tab} ${tab === 'roles' ? styles.tabActive : ''}`}
          onClick={() => setTab('roles')}
          disabled={!isEdit}
          title={!isEdit ? 'Guarda el usuario para asignar roles' : undefined}
        >
          Roles
        </button>
      </div>

      <form id="usuario-form" onSubmit={handleSubmit((values) => saveMutation.mutate(values))} noValidate>
        <div className={tab === 'datos' ? styles.panel : styles.hidden}>
            <div className={shared.field}>
              <label className={shared.label} htmlFor="u-username">
                Nombre de usuario
              </label>
              <input
                id="u-username"
                className={shared.input}
                autoComplete="off"
                {...register('username', rules.username)}
              />
              {errors.username && <span className={shared.error}>{errors.username.message}</span>}
            </div>

            <div className={shared.field}>
              <label className={shared.label} htmlFor="u-password">
                Contraseña{' '}
                {isEdit && <span className={shared.labelOptional}>(opcional)</span>}
              </label>
              <input
                id="u-password"
                type="password"
                className={shared.input}
                autoComplete="new-password"
                placeholder={isEdit ? 'Déjala vacía para conservar la actual' : ''}
                {...register(
                  'password',
                  isEdit ? rules.passwordOptional : rules.passwordCreate,
                )}
              />
              {errors.password && <span className={shared.error}>{errors.password.message}</span>}
            </div>

            <label className={styles.checkbox}>
              <input type="checkbox" {...register('suspendido')} />
              Cuenta suspendida
            </label>
        </div>
      </form>

      {tab === 'roles' && isEdit && (
        <div className={styles.panel}>
          <div className={styles.roleList}>
            {(asignados ?? []).length === 0 ? (
              <p className={styles.muted}>Sin roles asignados.</p>
            ) : (
              (asignados ?? []).map((item) => (
                <span key={item.Id} className={styles.roleChip}>
                  {item.RolesDto?.Valor ?? `Rol #${item.IdRol}`}
                  <button
                    type="button"
                    onClick={() => removeMutation.mutate(item.Id)}
                    aria-label="Quitar rol"
                    disabled={removeMutation.isPending}
                  >
                    <X size={13} aria-hidden="true" />
                  </button>
                </span>
              ))
            )}
          </div>

          <div className={styles.assignRow}>
            <select
              className={shared.select}
              value={selectedRole}
              onChange={(event) => setSelectedRole(event.target.value)}
            >
              <option value="">Selecciona un rol</option>
              {disponibles.map((rol) => (
                <option key={rol.Id} value={rol.Id}>
                  {rol.Valor}
                </option>
              ))}
            </select>
            <Button
              variant="secondary"
              disabled={!selectedRole || assignMutation.isPending}
              onClick={() => assignMutation.mutate(Number(selectedRole))}
            >
              <Plus size={15} aria-hidden="true" />
              Asignar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
