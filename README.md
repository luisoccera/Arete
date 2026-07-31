# Arete

Aplicacion web para consultorio dental con:

- Registro completo de pacientes.
- Agenda de citas por paciente.
- Agenda global de citas con calendario.
- Enfermedades personalizables con color.
- Cuadros de color al lado del nombre en la base de pacientes.
- Odontograma interactivo por diente y por zonas.
- Vistas separadas: Inicio, Ficha del paciente, Registro de pacientes y Citas.
- Respaldo e importacion de datos en JSON.
- Modo local sin cuenta y respaldo en JSON.
- Modo nube con cuentas y datos separados por usuario.
- Web clínica estable y base Expo/React Native Web para Android, iOS y navegador.
- Integración opcional con Appwrite Auth y una fila privada de expedientes por cuenta.

## Estructura del proyecto

```text
frontend/
  index.html
  .nojekyll
  assets/
    css/
      main.css
    js/
      bootstrap.js
      config/
      core/
      data/
      features/
      pdf/
      render/
  vendor/
  data/
    uv-historias.pdf
    uv-historias.textmap.json
backend/
  src/
    index.js
    clinical_pdf.js
  data/
    state.json
    users.json
    sessions.json
    states/
  logs/
docs/
  ARCHITECTURE.md
apps/
  arete-native/       # Expo + React Native Web
appwrite/
  templates/          # Correos de verificación y recuperación con identidad Arete
scripts/
  dev.ps1
tests/
  README.md
config/
  README.md
```

## Inicio rápido en Windows

Requisito: [Node.js](https://nodejs.org/) 20.19 o superior.

1. Haz doble clic en `Iniciar Arete - Estable con registro.cmd`.
2. La primera ejecución instala las dependencias exactas, valida el proyecto y abre el navegador.
3. Arete queda disponible en `http://localhost:3001`.
4. Para detenerlo, cierra la ventana del servidor o presiona `Ctrl+C`.

También puedes validar la instalación en cualquier momento con `Verificar Arete.cmd`.

### Accesos para pruebas y código

- `Iniciar Arete - Estable con registro.cmd`: modo estable con cuentas, en `http://localhost:3001`; guarda en `%LOCALAPPDATA%\Arete\estable`.
- `Iniciar Arete - Pruebas locales.cmd`: inicia en segundo plano `http://localhost:3002` sin cuenta y conserva los datos de prueba solo en ese navegador.
- `Detener Arete - Pruebas.cmd`: detiene el servidor local de pruebas cuando termines.
- `Abrir codigo Arete.cmd`: abre todo el proyecto en Visual Studio Code. Si `code` no está disponible, abre la carpeta del proyecto.

## Ejecución desde terminal

Preparación inicial:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1
```

Arranque:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start.ps1
```

Verificación completa:

```powershell
npm run verify
```

La verificación revisa sintaxis, archivos JSON, contratos entre HTML y JavaScript, recursos locales, copias de la plantilla, cobertura y maquetación de los 11 PDF, y arranque real del servidor.

## Descargas clínicas

- `Descargar cuestionario actual` genera únicamente el formato seleccionado.
- `Descargar historial PDF completo` reúne los 11 cuestionarios en un archivo de 58 páginas útiles.
- Las respuestas permanecen separadas por cuestionario y se colocan mediante coordenadas verificadas contra cada línea del PDF oficial.

## Datos, cuentas y dispositivos

La versión **Pruebas locales** no solicita iniciar sesión. Los expedientes permanecen en el navegador y deben respaldarse con **Exportar respaldo**.

La versión **Estable con registro** usa `ARETE_DEPLOYMENT_MODE=cloud`. El servidor guarda cuentas y expedientes en el volumen configurado por `ARETE_DATA_DIR`:

- `backend/data/state.json`
- `backend/data/users.json`
- `backend/data/sessions.json`
- `backend/data/states/*.json`

Para la versión conectada a Appwrite, completa los identificadores públicos en `frontend/assets/js/config/runtime-config.js`. Arete usará Appwrite Auth y la tabla privada configurada en lugar de los JSON del servidor. La guía exacta, columnas y correos de marca están en [appwrite/README.md](appwrite/README.md).

## React Native y Expo

La migración ya tiene una aplicación Expo independiente en `apps/arete-native`. Su acceso funciona en React Native y React Native Web, conserva el nombre de usuario en el perfil Appwrite y usa el correo para inicio y recuperación segura.

```powershell
npm run native:install
npm run native:web
```

La web clínica actual sigue siendo la versión completa para pruebas mientras las pantallas clínicas se trasladan gradualmente a componentes nativos. La capa nativa usa la API REST pública de Appwrite para evitar incluir su SDK React Native beta y sus dependencias incompatibles con Expo 57.

## Versiones para computadora

- `Iniciar Arete - Estable con registro.cmd`: puerto 3001, cuentas activas y datos en `%LOCALAPPDATA%\Arete\estable`.
- `Iniciar Arete - Pruebas locales.cmd`: puerto 3002, sin cuenta y datos aislados en el navegador.

La interfaz web no ofrece instalación ni descarga del software. Los proyectos Android/iOS permanecen como código de preparación y no se distribuyen desde la web.

Para preparar Android en una etapa posterior:

```powershell
npm run mobile:sync
npm run mobile:open:android
```

La compilación y firma iOS requiere macOS y Xcode. Consulta [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) para configurar nube, Android, iOS y los requisitos previos a publicar.

## Modo solo frontend

Puedes abrir `frontend/index.html`; funcionará en modo local (`localStorage`) sin cuenta. La generación oficial de PDF usa el backend local o de nube.

## Notas

- Los datos se guardan en `localStorage` del navegador bajo la llave `arete_data_v1`.
- La app solo sincroniza contra `/api/state` cuando el backend declara explícitamente el modo nube.
- Si cambias de navegador/equipo, importa un respaldo JSON para recuperar datos.
- Los archivos de pacientes y sesiones se conservan en `backend/data/` y están excluidos de Git.
