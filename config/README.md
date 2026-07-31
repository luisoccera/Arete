# Configuración

Variables actualmente utilizadas por backend:

- `PORT`: puerto HTTP del servidor (`3001` por defecto).

Puedes definirla en sesión de terminal antes de correr `npm start`.

## Appwrite

La web usa solamente valores públicos desde `frontend/assets/js/config/runtime-config.js`: endpoint, project ID, database ID y table ID. No agregues una API key administrativa.

La aplicación Expo usa los mismos valores públicos desde `apps/arete-native/.env`; parte de `apps/arete-native/.env.example`. La configuración detallada está en `appwrite/README.md`.

En Windows también puedes usar:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start.ps1 -Port 3002
```
