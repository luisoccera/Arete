# Arete (MVP)

Aplicacion web para consultorio dental con:

- Registro completo de pacientes.
- Enfermedades personalizables con color.
- Cuadros de color al lado del nombre en la base de pacientes.
- Odontograma interactivo por diente y por zonas.
- Respaldo e importacion de datos en JSON.

## Abrir la app

1. Abre el archivo `index.html` en tu navegador.
2. Tambien puedes servir la carpeta con cualquier servidor estatico local.

## Flujo sugerido

1. Crea o ajusta tus enfermedades en la seccion "Enfermedades del paciente (con color)".
2. Registra paciente con sus datos clinicos.
3. Elige un "Estado activo" en odontograma y marca dientes o zonas.
4. Pulsa "Guardar paciente".
5. Usa "Exportar respaldo" para guardar copia de seguridad.

## Notas

- Los datos se guardan en `localStorage` del navegador bajo la llave `arete_data_v1`.
- Si cambias de navegador/equipo, importa un respaldo JSON para recuperar datos.
