import { http } from '@/api/client'
import type {
  LoginDto,
  LoginResponse,
  UsuarioCreatePayload,
  UsuarioUpdatePayload,
  UsuariosDto,
} from '@/api/types'

export const usuariosApi = {
  list: () => http.get<UsuariosDto[]>('/Usuarios'),
  create: (payload: UsuarioCreatePayload) => http.post<boolean>('/Usuarios', payload),
  update: (id: number, payload: UsuarioUpdatePayload) =>
    http.put<boolean>(`/Usuarios/${id}`, payload),
  remove: (id: number) => http.delete<boolean>(`/Usuarios/${id}`),
  toggleSuspendido: (id: number) =>
    http.patch<boolean>(`/Usuarios/${id}/toggle-suspendido`),
  login: (payload: LoginDto) =>
    http.post<LoginResponse>('/Usuarios/login', payload, { anonymous: true }),
}
