"use strict";

function getAppwriteConfig() {
  const raw = window.ARETE_CONFIG?.appwrite || {};
  return {
    enabled: raw.enabled === true,
    endpoint: stringOrEmpty(raw.endpoint).replace(/\/$/, ""),
    projectId: stringOrEmpty(raw.projectId),
    databaseId: stringOrEmpty(raw.databaseId),
    stateTableId: stringOrEmpty(raw.stateTableId),
    recoveryUrl: stringOrEmpty(raw.recoveryUrl),
    verificationUrl: stringOrEmpty(raw.verificationUrl)
  };
}

function isAppwriteConfigured(options) {
  const config = getAppwriteConfig();
  const needsDatabase = options?.database === true;
  return Boolean(config.enabled && config.endpoint && config.projectId
    && (!needsDatabase || (config.databaseId && config.stateTableId)));
}

async function appwriteRequest(pathname, options, timeoutMs) {
  const config = getAppwriteConfig();
  if (!isAppwriteConfigured()) {
    throw new Error("Appwrite todavía no está configurado para este despliegue.");
  }
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs || 10000);
  try {
    const requestOptions = options && typeof options === "object" ? { ...options } : {};
    const headers = new Headers(requestOptions.headers || {});
    headers.set("X-Appwrite-Project", config.projectId);
    headers.set("X-Appwrite-Response-Format", "1.9.5");
    if (requestOptions.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    return await fetch(`${config.endpoint}${pathname}`, {
      ...requestOptions,
      headers,
      credentials: "include",
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

async function readAppwriteResponse(response, fallbackMessage) {
  if (response.status === 204) {
    return {};
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(stringOrEmpty(payload?.message) || stringOrEmpty(payload?.error)
      || fallbackMessage || `Appwrite respondió ${response.status}.`);
    error.status = response.status;
    error.code = payload?.code;
    error.type = payload?.type;
    throw error;
  }
  return payload;
}

function createAppwriteId() {
  const random = typeof crypto?.randomUUID === "function"
    ? crypto.randomUUID().replace(/-/g, "")
    : `${Date.now()}${Math.random().toString(36).slice(2)}`;
  return `arete_${random}`.slice(0, 36);
}

function normalizeAppwriteUser(user) {
  if (!user || typeof user !== "object") {
    return null;
  }
  const prefs = user.prefs && typeof user.prefs === "object" ? user.prefs : {};
  return {
    id: stringOrEmpty(user.$id || user.id),
    name: stringOrEmpty(user.name),
    email: stringOrEmpty(user.email),
    username: stringOrEmpty(prefs.username),
    emailVerification: Boolean(user.emailVerification)
  };
}

async function getCurrentAppwriteAccount() {
  const response = await appwriteRequest("/account", { method: "GET" }, 7000);
  return normalizeAppwriteUser(await readAppwriteResponse(response, "No hay una sesión activa."));
}

async function createAppwriteSession(email, password) {
  const response = await appwriteRequest("/account/sessions/email", {
    method: "POST",
    body: JSON.stringify({ email, password })
  }, 10000);
  await readAppwriteResponse(response, "Correo o contraseña incorrectos.");
  return getCurrentAppwriteAccount();
}

async function createAppwriteAccount({ name, email, username, password }) {
  const accountResponse = await appwriteRequest("/account", {
    method: "POST",
    body: JSON.stringify({ userId: createAppwriteId(), email, password, name })
  }, 12000);
  await readAppwriteResponse(accountResponse, "No se pudo crear la cuenta.");
  await createAppwriteSession(email, password);

  const prefsResponse = await appwriteRequest("/account/prefs", {
    method: "PATCH",
    body: JSON.stringify({ prefs: { username } })
  }, 8000);
  await readAppwriteResponse(prefsResponse, "La cuenta se creó, pero no se pudo guardar el usuario.");

  const verificationUrl = getAppwriteConfig().verificationUrl;
  if (verificationUrl) {
    try {
      const verificationResponse = await appwriteRequest("/account/verification", {
        method: "POST",
        body: JSON.stringify({ url: verificationUrl })
      }, 10000);
      await readAppwriteResponse(verificationResponse, "No se pudo enviar el correo de verificación.");
    } catch (error) {
      console.warn("La cuenta fue creada, pero el correo de verificación no pudo enviarse.", error);
    }
  }
  return getCurrentAppwriteAccount();
}

async function deleteCurrentAppwriteSession() {
  const response = await appwriteRequest("/account/sessions/current", { method: "DELETE" }, 7000);
  return readAppwriteResponse(response, "No se pudo cerrar la sesión.");
}

async function createAppwriteRecovery(email) {
  const config = getAppwriteConfig();
  const url = config.recoveryUrl || `${window.location.origin}${window.location.pathname}`;
  const response = await appwriteRequest("/account/recovery", {
    method: "POST",
    body: JSON.stringify({ email, url })
  }, 10000);
  return readAppwriteResponse(response, "No se pudo enviar el correo de recuperación.");
}

async function completeAppwriteRecovery(userId, secret, password) {
  const response = await appwriteRequest("/account/recovery", {
    method: "PUT",
    body: JSON.stringify({ userId, secret, password })
  }, 10000);
  return readAppwriteResponse(response, "El enlace de recuperación no es válido o ya expiró.");
}

async function completeAppwriteVerification(userId, secret) {
  const response = await appwriteRequest("/account/verification", {
    method: "PUT",
    body: JSON.stringify({ userId, secret })
  }, 10000);
  return readAppwriteResponse(response, "El enlace de verificación no es válido o ya expiró.");
}

async function getAppwriteState(userId) {
  const config = getAppwriteConfig();
  if (!isAppwriteConfigured({ database: true })) {
    throw new Error("Faltan databaseId o stateTableId en la configuración de Appwrite.");
  }
  const response = await appwriteRequest(
    `/tablesdb/${encodeURIComponent(config.databaseId)}/tables/${encodeURIComponent(config.stateTableId)}/rows/${encodeURIComponent(userId)}`,
    { method: "GET" },
    10000
  );
  if (response.status === 404) {
    return null;
  }
  const row = await readAppwriteResponse(response, "No se pudieron leer los expedientes.");
  const rawPayload = typeof row?.payload === "string" ? row.payload : "";
  return rawPayload ? JSON.parse(rawPayload) : null;
}

async function upsertAppwriteState(userId, value) {
  const config = getAppwriteConfig();
  if (!isAppwriteConfigured({ database: true })) {
    throw new Error("Faltan databaseId o stateTableId en la configuración de Appwrite.");
  }
  const response = await appwriteRequest(
    `/tablesdb/${encodeURIComponent(config.databaseId)}/tables/${encodeURIComponent(config.stateTableId)}/rows/${encodeURIComponent(userId)}`,
    {
      method: "PUT",
      body: JSON.stringify({ data: {
        ownerId: userId,
        payload: JSON.stringify(value),
        schemaVersion: 1
      } })
    },
    15000
  );
  return readAppwriteResponse(response, "No se pudieron guardar los expedientes.");
}
