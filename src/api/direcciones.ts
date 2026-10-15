import { http } from '@/api/client'
import type { DireccionDto, DireccionPayload } from '@/api/types'

export const direccionesApi = {
  list: () => http.get<DireccionDto[]>('/Direcciones'),
  create: (payload: DireccionPayload) => http.post<boolean>('/Direcciones', payload),
  update: (id: number, payload: DireccionPayload) =>
    http.put<boolean>(`/Direcciones/${id}`, payload),
  remove: (id: number) => http.delete<boolean>(`/Direcciones/${id}`),
}
