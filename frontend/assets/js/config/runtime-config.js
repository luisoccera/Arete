"use strict";

// En una compilación móvil con sincronización, establece aquí la URL HTTPS
// pública del servidor, por ejemplo: "https://api.arete.example".
// Vacío significa modo local: los expedientes permanecen en este dispositivo.
window.ARETE_CONFIG = Object.freeze({
  apiBaseUrl: "",
  appwrite: Object.freeze({
    enabled: false,
    endpoint: "https://<REGION>.cloud.appwrite.io/v1",
    projectId: "",
    databaseId: "",
    stateTableId: "arete_state",
    recoveryUrl: "http://localhost:3001/?mode=recovery",
    verificationUrl: "http://localhost:3001/?mode=verify"
  })
});
