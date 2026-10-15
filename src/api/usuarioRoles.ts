import { http } from '@/api/client'
import type { UsuarioRolesDto, UsuarioRolesPayload } from '@/api/types'

export const usuarioRolesApi = {
  byUsuario: (idUsuario: number) =>
    http.get<UsuarioRolesDto[]>(`/UsuarioRoles/usuario/${idUsuario}`),
  create: (payload: UsuarioRolesPayload) => http.post<boolean>('/UsuarioRoles', payload),
  remove: (id: number) => http.delete<boolean>(`/UsuarioRoles/${id}`),
}
