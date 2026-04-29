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
assets/
  css/
    main.css
  js/
    bootstrap.js
    config/
      constants.js
    core/
      helpers.js
    data/
      state-models.js
    features/
      events.js
      navigation.js
      patient-actions.js
    pdf/
      clinical-pdf.js
    render/
      render.js
index.html
server/
  index.js
  clinical_pdf.js
data/
  state.json
```

## Ejecutar con backend (recomendado)

1. Instala Node.js (si aun no lo tienes).
2. En esta carpeta ejecuta:
   - `npm start`
3. Abre:
   - `http://localhost:3001`

El backend guarda los datos en:

- `data/state.json`

## Modo solo frontend

Si abres solo `index.html`, la app funciona en modo local (localStorage).

## Notas

- Los datos se guardan en `localStorage` del navegador bajo la llave `arete_data_v1`.
- Si el backend esta disponible, la app sincroniza contra `/api/state`.
- Si cambias de navegador/equipo, importa un respaldo JSON para recuperar datos.
