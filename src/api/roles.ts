import { http } from '@/api/client'
import type { RolesDto, RolPayload } from '@/api/types'

export const rolesApi = {
  list: () => http.get<RolesDto[]>('/roles'),
  get: (id: number) => http.get<RolesDto>(`/roles/${id}`),
  byNombre: (valor: string) => http.get<RolesDto>(`/roles/nombre/${encodeURIComponent(valor)}`),
  create: (payload: RolPayload) => http.post<boolean>('/roles', payload),
  update: (id: number, payload: RolPayload) => http.put<boolean>(`/roles/${id}`, payload),
  remove: (id: number) => http.delete<boolean>(`/roles/${id}`),
}
