import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { rolesApi } from '@/api/roles'
import type { RolesDto } from '@/api/types'
import { Modal } from '@/components/Modal'
import { Button } from '@/components/Button'
import { useToast } from '@/components/Toast'
import { rules } from '@/utils/validation'
import { trim, trimOrNull } from '@/utils/format'
import shared from '@/styles/shared.module.css'

interface RolFormModalProps {
  rol: RolesDto | null
  onClose: () => void
}

interface RolForm {
  valor: string
  descripcion: string
}

export function RolFormModal({ rol, onClose }: RolFormModalProps) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const isEdit = rol !== null

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RolForm>({
    defaultValues: {
      valor: rol?.Valor ?? '',
      descripcion: rol?.Descripcion ?? '',
    },
  })

  const mutation = useMutation({
    mutationFn: (values: RolForm) => {
      const payload = {
        Valor: trim(values.valor),
        Descripcion: trimOrNull(values.descripcion),
      }
      return isEdit ? rolesApi.update(rol.Id, payload) : rolesApi.create(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success(isEdit ? 'Rol actualizado.' : 'Rol creado.')
      onClose()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar.')
    },
  })

  return (
    <Modal
      open
      title={isEdit ? `Editar rol #${rol.Id}` : 'Nuevo rol'}
      onClose={onClose}
      width={460}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="rol-form" disabled={mutation.isPending}>
            {mutation.isPending ? 'Guardando…' : 'Guardar'}
          </Button>
        </>
      }
    >
      <form id="rol-form" onSubmit={handleSubmit((values) => mutation.mutate(values))} noValidate>
        <div className={shared.field}>
          <label className={shared.label} htmlFor="rol-valor">
            Valor
          </label>
          <input
            id="rol-valor"
            className={shared.input}
            autoComplete="off"
            {...register('valor', rules.rolValor)}
          />
          {errors.valor && <span className={shared.error}>{errors.valor.message}</span>}
        </div>

        <div className={shared.field}>
          <label className={shared.label} htmlFor="rol-desc">
            Descripción <span className={shared.labelOptional}>(opcional)</span>
          </label>
          <textarea
            id="rol-desc"
            className={shared.textarea}
            {...register('descripcion', rules.descripcion)}
          />
          {errors.descripcion && <span className={shared.error}>{errors.descripcion.message}</span>}
        </div>
      </form>
    </Modal>
  )
}
