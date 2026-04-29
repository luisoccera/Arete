# Arquitectura de Arete

## Capas

1. `frontend/`
- Interfaz web estática (HTML, CSS, JS modular).
- Manejo de estado local y sincronización con backend.
- Render de odontograma, patologías, citas, historial y exportación PDF.

2. `backend/src/`
- API HTTP sin framework (`/api/*`).
- Autenticación de usuarios, sesiones y recuperación de contraseña.
- Persistencia por usuario en archivos JSON.
- Generación de PDF clínico oficial usando `pdf-lib`.

3. `backend/data/`
- Datos persistentes del sistema.
- Plantillas PDF de trabajo para frontend y backend.

## Flujo principal

1. Usuario inicia sesión.
2. Frontend consume `/api/state`.
3. Cambios en pacientes/citas/odontograma se guardan por usuario.
4. Exportación PDF usa `/api/clinical-pdf` o fallback en navegador.
