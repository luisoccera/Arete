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
- Backend local para persistencia en archivo.

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
scripts/
  dev.ps1
tests/
  README.md
config/
  README.md
```

## Ejecutar con backend (recomendado)

1. Instala Node.js (si aun no lo tienes).
2. En esta carpeta ejecuta:
   - `npm start`
3. Abre:
   - `http://localhost:3001`

El backend guarda los datos en:

- `backend/data/state.json`
- `backend/data/users.json`
- `backend/data/sessions.json`
- `backend/data/states/*.json`

## Modo solo frontend

Puedes abrir `frontend/index.html` y funcionara en modo local (localStorage).

## GitHub Pages

El deploy de Pages toma como artefacto la carpeta:

- `frontend/`

## Notas

- Los datos se guardan en `localStorage` del navegador bajo la llave `arete_data_v1`.
- Si el backend esta disponible, la app sincroniza contra `/api/state`.
- Si cambias de navegador/equipo, importa un respaldo JSON para recuperar datos.
