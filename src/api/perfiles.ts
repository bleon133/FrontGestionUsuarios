import { http } from '@/api/client'
import type { PerfilPayload, PerfilUsuarioDto } from '@/api/types'

export const perfilesApi = {
  list: () => http.get<PerfilUsuarioDto[]>('/PerfilesUsuarios'),
  byUsuario: (idUsuario: number) =>
    http.get<PerfilUsuarioDto>(`/PerfilesUsuarios/usuario/${idUsuario}`),
  create: (payload: PerfilPayload) => http.post<boolean>('/PerfilesUsuarios', payload),
  update: (id: number, payload: PerfilPayload) =>
    http.put<boolean>(`/PerfilesUsuarios/${id}`, payload),
  remove: (id: number) => http.delete<boolean>(`/PerfilesUsuarios/${id}`),
}
