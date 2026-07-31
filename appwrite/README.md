# Conectar Arete con Appwrite

Arete usa Appwrite Auth para cuentas y una fila privada por usuario para el estado clínico completo. No pongas una API key administrativa en `runtime-config.js`, en Expo ni en Git.

## 1. Plataformas

En Appwrite, agrega estas plataformas al proyecto:

- Web: `http://localhost:3001` para desarrollo y el dominio HTTPS final.
- Android: paquete `mx.arete.dental`.
- Apple: bundle ID `mx.arete.dental`.

## 2. Base de datos

Crea una base de datos y una tabla con ID `arete_state`. Agrega:

| Columna | Tipo | Requerida |
| --- | --- | --- |
| `ownerId` | varchar, 36 | sí |
| `payload` | mediumtext | sí |
| `schemaVersion` | integer | sí |

Permite `CREATE` a usuarios autenticados. No concedas lectura global. Cada fila usa como ID el ID del usuario y Appwrite conserva permisos privados para el creador.

## 3. Web clínica

Edita `frontend/assets/js/config/runtime-config.js`:

```js
appwrite: {
  enabled: true,
  endpoint: "https://<REGION>.cloud.appwrite.io/v1",
  projectId: "TU_PROJECT_ID",
  databaseId: "TU_DATABASE_ID",
  stateTableId: "arete_state",
  recoveryUrl: "https://tu-dominio.example/?mode=recovery",
  verificationUrl: "https://tu-dominio.example/?mode=verify"
}
```

Al activarlo, la web deja de usar las cuentas JSON locales y sincroniza el estado con Appwrite. El inicio de sesión de Appwrite usa correo; el nombre de usuario queda guardado en las preferencias privadas del perfil.

## 4. Expo / React Native

Copia `apps/arete-native/.env.example` como `.env`, completa los identificadores públicos y ejecuta:

```powershell
npm run native:install
npm run native:web
```

Para Android usa `npm run native:android`. iOS necesita macOS/Xcode para compilar y firmar.

La aplicación nativa consume los endpoints públicos de Appwrite sobre HTTPS con sesión de cuenta; no incluye claves administrativas ni el SDK React Native beta.

## 5. Correos con identidad Arete

Configura SMTP propio en Appwrite, después abre **Auth > Templates**, elige español y pega las plantillas de `appwrite/templates`. Usa como remitente `Arete | Acceso seguro` y una dirección de tu dominio, por ejemplo `acceso@tu-dominio.example`.

El SMTP propio es obligatorio para que Appwrite permita personalizar remitente y contenido. Registra las URL de recuperación y verificación como plataformas Web válidas.
