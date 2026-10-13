import { http } from '@/api/client'
import type { UsuarioRolesDto, UsuarioRolesPayload } from '@/api/types'

export const usuarioRolesApi = {
  list: () => http.get<UsuarioRolesDto[]>('/UsuarioRoles'),
  get: (id: number) => http.get<UsuarioRolesDto>(`/UsuarioRoles/${id}`),
  byUsuario: (idUsuario: number) =>
    http.get<UsuarioRolesDto[]>(`/UsuarioRoles/usuario/${idUsuario}`),
  create: (payload: UsuarioRolesPayload) => http.post<boolean>('/UsuarioRoles', payload),
  remove: (id: number) => http.delete<boolean>(`/UsuarioRoles/${id}`),
}
