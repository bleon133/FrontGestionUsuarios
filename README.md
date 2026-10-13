# FrontGestionUsuarios

Aplicación web (SPA) para administrar usuarios, roles, perfiles, direcciones y teléfonos. Consume la API REST `apigestionusuarios`.

## Requisitos

- Node.js 18 o superior
- npm 9 o superior

## Instalación

```bash
npm install
```

## Variables de entorno

Copia `.env.example` a `.env` y ajusta la URL de la API:

```
VITE_API_URL=https://apigestionusuarios.brayandeveloper.online/api/v1
```

`VITE_API_URL` es la única variable. No hay URLs fijas en el código.

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo en `http://localhost:5173` |
| `npm run build` | Compila TypeScript y genera el bundle en `dist/` |
| `npm run preview` | Sirve el bundle de producción localmente |
| `npm run typecheck` | Revisa tipos sin generar archivos |

## Estructura

```
src/
├── api/            Cliente HTTP y recursos tipados por entidad
├── components/     Componentes reutilizables (Modal, DataTable, Toast, Pagination…)
├── features/       Una carpeta por pantalla (usuarios, roles, perfiles,
│                   direcciones, listado, dashboard, auth)
├── styles/         Design tokens y estilos globales
└── utils/          Formato y reglas de validación
```

## Sesión

El backend no emite token ni sesión propia. El login es una llamada a
`POST /Usuarios/login` que valida las credenciales en el servidor y devuelve el
usuario. Del resultado solo se guarda en `sessionStorage` el `{ id, username }`.
La contraseña nunca se persiste ni se muestra.

Cuando el backend implemente autenticación real (JWT o cookies), el módulo
`src/features/auth/session.ts` debe reemplazar el almacenamiento local por el
token que devuelva el login.

## Despliegue

El proyecto incluye `vercel.json` con un rewrite a `/index.html` para que las
rutas del cliente funcionen al recargar. La variable `VITE_API_URL` se define en
el panel del proveedor.
