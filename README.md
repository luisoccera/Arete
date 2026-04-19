# Arete

Aplicacion web para consultorio dental con:

- Registro completo de pacientes.
- Agenda de citas por paciente.
- Enfermedades personalizables con color.
- Cuadros de color al lado del nombre en la base de pacientes.
- Odontograma interactivo por diente y por zonas.
- Vistas separadas: Inicio, Registro de pacientes y Citas proximas.
- Respaldo e importacion de datos en JSON.
- Backend local para persistencia en archivo.

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
