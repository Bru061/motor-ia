# MotorIA Frontend

Frontend de MotorIA, construido con React, Vite, React Router DOM, Axios y React Flow.

## Requisitos

- Node.js compatible con Vite
- Backend de MotorIA disponible
- Variable de entorno `VITE_API_URL` apuntando al prefijo base de la API

Ejemplo:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

## Scripts

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Estructura principal

- `src/api`: servicios Axios por dominio.
- `src/components`: componentes compartidos de layout y UI.
- `src/context`: proveedores de autenticación y notificaciones.
- `src/hooks`: hooks compartidos.
- `src/layouts`: layouts público, estudiante y administrador.
- `src/modules`: vistas por módulo funcional.
- `src/routes`: rutas protegidas y autorización por rol.
- `src/styles`: estilos centralizados de toda la aplicación.

## Notas de mantenimiento

- No crear endpoints desde el frontend; usar únicamente contratos expuestos por el backend.
- Mantener los estilos dentro de `src/styles`.
- Reutilizar `PageLoader`, `EmptyState`, `LoadingButton` y `ToastProvider` para estados UX comunes.
- Ejecutar `npm run lint` y `npm run build` antes de entregar cambios.
