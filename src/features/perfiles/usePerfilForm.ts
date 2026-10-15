import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { perfilesApi } from '@/api/perfiles'
import { usuariosApi } from '@/api/usuarios'
import { direccionesApi } from '@/api/direcciones'
import { telefonosApi } from '@/api/telefonos'
import type { PerfilUsuarioDto } from '@/api/types'
import { useToast } from '@/components/Toast'
import { trim, trimOrNull } from '@/utils/format'
import {
  DIGITS_10,
  direccionCapturada,
  nextDraftKey,
  telefonoCapturado,
  type DireccionDraft,
  type PerfilForm,
  type PerfilTab,
  type TelefonoDraft,
} from './perfilForm.types'

/** Bloques de dirección iniciales a partir del perfil editado. */
function mapDirecciones(perfil: PerfilUsuarioDto | null): DireccionDraft[] {
  return (perfil?.DireccionDtos ?? []).map((dir) => ({
    key: nextDraftKey(),
    Id: dir.Id,
    Calle: dir.Calle ?? '',
    Colonia: dir.Colonia ?? '',
    Municipio: dir.Municipio ?? '',
    NumExterior: dir.NumExterior ?? '',
    NumInterior: dir.NumInterior ?? '',
  }))
}

/** Bloques de teléfono iniciales a partir del perfil editado. */
function mapTelefonos(perfil: PerfilUsuarioDto | null): TelefonoDraft[] {
  return (perfil?.TelefonosDtos ?? []).map((tel) => ({
    key: nextDraftKey(),
    Id: tel.Id,
    Celular: tel.Celular ?? '',
    Casa: tel.Casa ?? '',
    Oficina: tel.Oficina ?? '',
  }))
}

/**
 * Estado, consultas y guardado del formulario de perfil. Mantiene junta la
 * lógica que antes vivía en el componente y expone solo lo que la vista
 * necesita para pintar las pestañas y los bloques.
 */
export function usePerfilForm(perfil: PerfilUsuarioDto | null, onClose: () => void) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [tab, setTab] = useState<PerfilTab>('perfil')
  const [direcciones, setDirecciones] = useState<DireccionDraft[]>(() => mapDirecciones(perfil))
  const [telefonos, setTelefonos] = useState<TelefonoDraft[]>(() => mapTelefonos(perfil))
  const [removedDirecciones, setRemovedDirecciones] = useState<number[]>([])
  const [removedTelefonos, setRemovedTelefonos] = useState<number[]>([])
  // Id con el que se guarda. Al crear un perfil se rellena tras recuperarlo.
  const [perfilId, setPerfilId] = useState<number | null>(perfil?.Id ?? null)
  const isEdit = perfilId !== null

  const usuarios = useQuery({ queryKey: ['usuarios'], queryFn: usuariosApi.list })

  const form = useForm<PerfilForm>({
    defaultValues: {
      nombre: perfil?.Nombre ?? '',
      apellidoPaterno: perfil?.ApellidoPaterno ?? '',
      apellidoMaterno: perfil?.ApellidoMaterno ?? '',
      rfc: perfil?.Rfc ?? '',
      fechaNacimiento: perfil?.FechaNacimiento?.substring(0, 10) ?? '',
      idUsuario: perfil?.IdUsuario ? String(perfil.IdUsuario) : '',
    },
  })

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
          throw new Error(`No se pudo guardar la dirección "${dir.Calle || 'sin calle'}": ${base}`, {
            cause: error,
          })
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
          throw new Error(`No se pudo guardar el teléfono "${tel.Celular}": ${base}`, { cause: error })
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
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar el perfil.')
    },
  })

  const usuariosDisponibles = usuarios.data ?? []

  const submit = form.handleSubmit(async (values) => {
    // Validación manual de los bloques de las pestañas ocultas.
    if (values.idUsuario === '' || Number(values.idUsuario) <= 0) {
      setTab('perfil')
      await form.trigger('idUsuario')
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

  return {
    tab,
    setTab,
    direcciones,
    setDirecciones,
    telefonos,
    setTelefonos,
    usuariosDisponibles,
    form,
    saveMutation,
    submit,
    removeDireccion,
    removeTelefono,
    isEdit,
    perfilId,
  }
}