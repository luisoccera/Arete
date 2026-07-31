# Ejecución y publicación de Arete

## Dónde se guardan los datos

Arete distingue dos modos explícitos:

- **Pruebas locales:** no solicita cuenta. Los expedientes se guardan en el almacenamiento del navegador. No aparecen automáticamente en otra computadora o teléfono. Usa **Exportar respaldo** y conserva el JSON en un lugar seguro.
- **Estable con registro:** solicita registro/inicio de sesión. Usuarios, sesiones y expedientes se guardan en el volumen persistente indicado por `ARETE_DATA_DIR` en el servidor. Cada estado queda separado por usuario.

El almacenamiento JSON del servidor sirve para una primera instalación controlada o de bajo volumen. Antes de operar a escala o con múltiples instancias debe migrarse a una base de datos transaccional, almacenamiento de archivos y copias de seguridad administradas.

## Computadoras

Ejecuta `Iniciar Arete - Estable con registro.cmd` para la versión con cuentas o `Iniciar Arete - Pruebas locales.cmd` para la versión local.

La versión web no incluye manifiesto de instalación ni botón para descargar/instalar el software.

Para iniciar manualmente la versión estable:

```powershell
npm install
powershell -ExecutionPolicy Bypass -File scripts/start.ps1 -Port 3001 -DeploymentMode cloud -DataDir "$env:LOCALAPPDATA\Arete\estable"
```

La versión estable abre `http://localhost:3001`. La versión de pruebas abre `http://localhost:3002` en segundo plano. En pruebas locales, borrar los datos del navegador elimina los expedientes no respaldados. Al terminar, ejecuta `Detener Arete - Pruebas.cmd`.

Para revisar o modificar el proyecto ejecuta `Abrir codigo Arete.cmd`.

## Servidor con cuentas

Configura variables en el proveedor de alojamiento:

```text
ARETE_DEPLOYMENT_MODE=cloud
ARETE_DATA_DIR=/ruta/de/volumen/persistente
```

`ARETE_DATA_DIR` es el punto actual de conexión del almacenamiento persistente. En una instalación local estable se usa `%LOCALAPPDATA%\Arete\estable`; en un proveedor de nube debe apuntar a un volumen persistente montado. Actualmente el adaptador guarda JSON en `users.json`, `sessions.json` y `states/*.json`. Para conectar PostgreSQL, MySQL o SQL Server, sustituye las funciones de lectura/escritura del repositorio en `backend/src/index.js` por un adaptador transaccional, manteniendo las rutas HTTP existentes.

El servidor debe publicarse exclusivamente por HTTPS. En `frontend/assets/js/config/runtime-config.js`, establece `apiBaseUrl` con la URL HTTPS pública del servidor antes de sincronizar los proyectos móviles.

## Android

```powershell
npm install
npm run mobile:sync
npm run mobile:open:android
```

Android Studio genera y firma el Android App Bundle (`.aab`). Para sincronización entre dispositivos, configura primero la URL de nube.

## iPhone y iPad

```text
npm install
npm run mobile:sync
npm run mobile:open:ios
```

El proyecto iOS puede prepararse desde este repositorio, pero compilar, firmar y enviar a App Store Connect requiere una Mac con Xcode y una cuenta activa del Apple Developer Program.

## Antes de una publicación real

- HTTPS obligatorio y secretos fuera del repositorio.
- Política de privacidad y consentimiento para datos de salud.
- Exportación, corrección y eliminación de cuentas/expedientes.
- Copias de seguridad cifradas y restauración probada.
- Control de acceso, auditoría, retención y respuesta a incidentes.
- Correo real para recuperación de contraseña; el código de desarrollo no debe mostrarse al usuario.
- Íconos, capturas, ficha de tienda, clasificación de contenido y formularios de privacidad.
- Firma de producción, pruebas en dispositivos y revisión legal aplicable.
