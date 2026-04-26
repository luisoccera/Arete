"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");
const { generateClinicalPdf } = require("./clinical_pdf");

const PORT = Number(process.env.PORT || 3001);
const ROOT_DIR = path.resolve(__dirname, "..");
const LEGACY_DATA_FILE = path.join(ROOT_DIR, "data", "state.json");
const USERS_FILE = path.join(ROOT_DIR, "data", "users.json");
const SESSIONS_FILE = path.join(ROOT_DIR, "data", "sessions.json");
const USER_STATES_DIR = path.join(ROOT_DIR, "data", "states");
const CLINICAL_TEMPLATE_FILE = path.join(ROOT_DIR, "data", "uv-historias.pdf");
const MAX_BODY_BYTES = 5 * 1024 * 1024;
const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const RESET_CODE_TTL_MS = 15 * 60 * 1000;
const DEMO_ACCOUNT = {
  name: "Usuario Prueba Arete",
  email: "demo@arete.app",
  username: "demoarete",
  password: "AreteDemo123!"
};

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf"
};

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,PUT,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  });
  res.end(body);
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(text);
}

function ensureJsonFile(filePath, fallbackValue) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(fallbackValue, null, 2), "utf8");
  }
}

function readJsonFile(filePath, fallbackValue) {
  ensureJsonFile(filePath, fallbackValue);
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallbackValue;
  }
}

function writeJsonFile(filePath, payload) {
  ensureJsonFile(filePath, payload);
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createEmptyData() {
  return {
    patients: [],
    diseases: [],
    toothStatuses: []
  };
}

function createStateEnvelope(data) {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    data: data && typeof data === "object" ? data : createEmptyData()
  };
}

function ensureLegacyDataFile() {
  ensureJsonFile(LEGACY_DATA_FILE, {
    version: 1,
    updatedAt: "",
    data: createEmptyData()
  });
}

function readLegacyStateData() {
  ensureLegacyDataFile();
  try {
    const raw = fs.readFileSync(LEGACY_DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    const data = parsed && typeof parsed === "object"
      ? (parsed.data && typeof parsed.data === "object" ? parsed.data : parsed)
      : null;
    if (!data || typeof data !== "object") {
      return createEmptyData();
    }
    return {
      patients: Array.isArray(data.patients) ? data.patients : [],
      diseases: Array.isArray(data.diseases) ? data.diseases : [],
      toothStatuses: Array.isArray(data.toothStatuses) ? data.toothStatuses : []
    };
  } catch {
    return createEmptyData();
  }
}

function sanitizeIdForFile(value) {
  const clean = String(value || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  return clean || "user";
}

function getUserStateFilePath(userId) {
  return path.join(USER_STATES_DIR, `${sanitizeIdForFile(userId)}.json`);
}

function ensureUserStateFile(userId) {
  const filePath = getUserStateFilePath(userId);
  if (!fs.existsSync(USER_STATES_DIR)) {
    fs.mkdirSync(USER_STATES_DIR, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    const seed = readLegacyStateData();
    writeJsonFile(filePath, createStateEnvelope(deepClone(seed)));
  }
  return filePath;
}

function readStateForUser(userId) {
  const filePath = ensureUserStateFile(userId);
  const parsed = readJsonFile(filePath, createStateEnvelope(createEmptyData()));
  const data = parsed && typeof parsed === "object"
    ? (parsed.data && typeof parsed.data === "object" ? parsed.data : parsed)
    : null;

  return {
    version: 1,
    updatedAt: String(parsed?.updatedAt || ""),
    data: {
      patients: Array.isArray(data?.patients) ? data.patients : [],
      diseases: Array.isArray(data?.diseases) ? data.diseases : [],
      toothStatuses: Array.isArray(data?.toothStatuses) ? data.toothStatuses : []
    }
  };
}

function writeStateForUser(userId, incomingData) {
  const filePath = ensureUserStateFile(userId);
  const safeData = {
    patients: Array.isArray(incomingData?.patients) ? incomingData.patients : [],
    diseases: Array.isArray(incomingData?.diseases) ? incomingData.diseases : [],
    toothStatuses: Array.isArray(incomingData?.toothStatuses) ? incomingData.toothStatuses : []
  };
  const envelope = {
    version: 1,
    updatedAt: new Date().toISOString(),
    data: safeData
  };
  writeJsonFile(filePath, envelope);
  return envelope;
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeName(value) {
  return String(value || "").trim();
}

function isValidEmail(value) {
  const email = normalizeEmail(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function createId(prefix) {
  return `${prefix}-${crypto.randomBytes(9).toString("hex")}`;
}

function hashPassword(password, saltInput) {
  const salt = saltInput || crypto.randomBytes(16).toString("hex");
  const digest = crypto.scryptSync(String(password || ""), salt, 64).toString("hex");
  return { salt, digest };
}

function verifyPassword(password, salt, expectedDigest) {
  if (!salt || !expectedDigest) {
    return false;
  }
  const candidate = crypto.scryptSync(String(password || ""), salt, 64).toString("hex");
  const a = Buffer.from(candidate, "hex");
  const b = Buffer.from(String(expectedDigest), "hex");
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

function createSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

function sanitizeUser(user) {
  return {
    id: String(user?.id || ""),
    name: String(user?.name || ""),
    email: String(user?.email || ""),
    username: String(user?.username || "")
  };
}

function getUsersStore() {
  const parsed = readJsonFile(USERS_FILE, {
    version: 1,
    updatedAt: "",
    users: []
  });
  return {
    version: 1,
    updatedAt: String(parsed?.updatedAt || ""),
    users: Array.isArray(parsed?.users) ? parsed.users : []
  };
}

function writeUsersStore(store) {
  writeJsonFile(USERS_FILE, {
    version: 1,
    updatedAt: new Date().toISOString(),
    users: Array.isArray(store?.users) ? store.users : []
  });
}

function ensureDemoUser() {
  const usersStore = getUsersStore();
  const users = Array.isArray(usersStore.users) ? usersStore.users : [];
  const demoEmail = normalizeEmail(DEMO_ACCOUNT.email);
  const demoUsername = normalizeUsername(DEMO_ACCOUNT.username);
  const existing = users.find((entry) => {
    const email = normalizeEmail(entry?.email);
    const username = normalizeUsername(entry?.username);
    return email === demoEmail || username === demoUsername;
  });
  if (existing) {
    return;
  }

  const pwd = hashPassword(DEMO_ACCOUNT.password);
  users.push({
    id: createId("usr"),
    name: DEMO_ACCOUNT.name,
    email: demoEmail,
    username: demoUsername,
    passwordSalt: pwd.salt,
    passwordDigest: pwd.digest,
    recoveryCode: "",
    recoveryExpiresAt: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  writeUsersStore(usersStore);
}

function getSessionsStore() {
  const parsed = readJsonFile(SESSIONS_FILE, {
    version: 1,
    updatedAt: "",
    sessions: []
  });
  return {
    version: 1,
    updatedAt: String(parsed?.updatedAt || ""),
    sessions: Array.isArray(parsed?.sessions) ? parsed.sessions : []
  };
}

function writeSessionsStore(store) {
  writeJsonFile(SESSIONS_FILE, {
    version: 1,
    updatedAt: new Date().toISOString(),
    sessions: Array.isArray(store?.sessions) ? store.sessions : []
  });
}

function purgeExpiredSessions(store) {
  const now = Date.now();
  const sessions = Array.isArray(store?.sessions) ? store.sessions : [];
  return {
    ...store,
    sessions: sessions.filter((session) => Number(session?.expiresAt || 0) > now)
  };
}

function findUserByIdentifier(usersStore, identifier) {
  const needle = normalizeEmail(identifier);
  if (!needle) {
    return null;
  }
  const users = Array.isArray(usersStore?.users) ? usersStore.users : [];
  return users.find((entry) => {
    const email = normalizeEmail(entry?.email);
    const username = normalizeUsername(entry?.username);
    return email === needle || username === needle;
  }) || null;
}

function getAuthTokenFromRequest(req) {
  const header = String(req.headers.authorization || req.headers.Authorization || "").trim();
  if (header.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim();
  }
  return "";
}

function resolveAuthenticatedUser(req) {
  const token = getAuthTokenFromRequest(req);
  if (!token) {
    return null;
  }

  const sessionsStore = purgeExpiredSessions(getSessionsStore());
  writeSessionsStore(sessionsStore);
  const sessions = Array.isArray(sessionsStore.sessions) ? sessionsStore.sessions : [];
  const session = sessions.find((entry) => String(entry?.token || "") === token);
  if (!session) {
    return null;
  }

  const usersStore = getUsersStore();
  const users = Array.isArray(usersStore.users) ? usersStore.users : [];
  const user = users.find((entry) => String(entry?.id || "") === String(session.userId || ""));
  if (!user) {
    return null;
  }

  return {
    token,
    session,
    user,
    usersStore,
    sessionsStore
  };
}

function requireAuth(req, res) {
  const auth = resolveAuthenticatedUser(req);
  if (!auth) {
    sendJson(res, 401, { error: "No autorizado. Inicia sesión para continuar." });
    return null;
  }
  return auth;
}

function createRecoveryCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function issueSession(userId) {
  const sessionsStore = purgeExpiredSessions(getSessionsStore());
  const token = createSessionToken();
  sessionsStore.sessions.push({
    token,
    userId,
    createdAt: new Date().toISOString(),
    expiresAt: Date.now() + SESSION_TTL_MS
  });
  writeSessionsStore(sessionsStore);
  return token;
}

function removeSessionToken(token) {
  if (!token) {
    return;
  }
  const sessionsStore = purgeExpiredSessions(getSessionsStore());
  sessionsStore.sessions = sessionsStore.sessions.filter((entry) => String(entry?.token || "") !== token);
  writeSessionsStore(sessionsStore);
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;

    req.on("data", (chunk) => {
      total += chunk.length;
      if (total > MAX_BODY_BYTES) {
        reject(new Error("Payload demasiado grande"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      try {
        const text = Buffer.concat(chunks).toString("utf8").trim();
        if (!text) {
          resolve({});
          return;
        }
        resolve(JSON.parse(text));
      } catch (error) {
        reject(error);
      }
    });

    req.on("error", reject);
  });
}

function isPathInsideRoot(targetPath) {
  const relative = path.relative(ROOT_DIR, targetPath);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function serveStatic(req, res, pathname) {
  let filePath = pathname;
  if (filePath === "/") {
    filePath = "/index.html";
  }

  const candidatePath = path.normalize(path.join(ROOT_DIR, filePath));

  if (!isPathInsideRoot(candidatePath)) {
    sendText(res, 403, "Acceso denegado");
    return;
  }

  fs.readFile(candidatePath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT") {
        sendText(res, 404, "No encontrado");
      } else {
        sendText(res, 500, "Error interno");
      }
      return;
    }

    const extension = path.extname(candidatePath).toLowerCase();
    const contentType = MIME_TYPES[extension] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": extension === ".html" ? "no-store" : "public, max-age=300"
    });
    res.end(content);
  });
}

async function handleApi(req, res, pathname) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,PUT,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    });
    res.end();
    return;
  }

  if (pathname === "/api/health" && req.method === "GET") {
    sendJson(res, 200, { ok: true, storage: "file", timestamp: new Date().toISOString() });
    return;
  }

  if (pathname === "/api/auth/register" && req.method === "POST") {
    try {
      const payload = await parseJsonBody(req);
      const name = normalizeName(payload?.name);
      const email = normalizeEmail(payload?.email);
      const username = normalizeUsername(payload?.username);
      const password = String(payload?.password || "");

      if (!name || !email || !username || !password) {
        sendJson(res, 400, { error: "Completa nombre, correo, usuario y contraseña." });
        return;
      }
      if (!isValidEmail(email)) {
        sendJson(res, 400, { error: "El correo no es válido." });
        return;
      }
      if (username.length < 3) {
        sendJson(res, 400, { error: "El usuario debe tener al menos 3 caracteres." });
        return;
      }
      if (password.length < 8) {
        sendJson(res, 400, { error: "La contraseña debe tener al menos 8 caracteres." });
        return;
      }

      const usersStore = getUsersStore();
      const users = usersStore.users;
      const emailUsed = users.some((entry) => normalizeEmail(entry?.email) === email);
      if (emailUsed) {
        sendJson(res, 409, { error: "Ese correo ya está registrado." });
        return;
      }
      const usernameUsed = users.some((entry) => normalizeUsername(entry?.username) === username);
      if (usernameUsed) {
        sendJson(res, 409, { error: "Ese nombre de usuario ya existe." });
        return;
      }

      const pwd = hashPassword(password);
      const nowIso = new Date().toISOString();
      const user = {
        id: createId("usr"),
        name,
        email,
        username,
        passwordSalt: pwd.salt,
        passwordDigest: pwd.digest,
        recoveryCode: "",
        recoveryExpiresAt: 0,
        createdAt: nowIso,
        updatedAt: nowIso
      };

      users.push(user);
      writeUsersStore(usersStore);

      const token = issueSession(user.id);
      sendJson(res, 201, { ok: true, user: sanitizeUser(user), token });
    } catch (error) {
      sendJson(res, 400, { error: "JSON inválido", detail: error.message });
    }
    return;
  }

  if (pathname === "/api/auth/login" && req.method === "POST") {
    try {
      const payload = await parseJsonBody(req);
      const identifier = normalizeEmail(payload?.identifier);
      const password = String(payload?.password || "");

      if (!identifier || !password) {
        sendJson(res, 400, { error: "Escribe usuario/correo y contraseña." });
        return;
      }

      const usersStore = getUsersStore();
      const user = findUserByIdentifier(usersStore, identifier);
      if (!user) {
        sendJson(res, 401, { error: "Credenciales inválidas." });
        return;
      }

      let validPassword = verifyPassword(password, user.passwordSalt, user.passwordDigest);

      if (!validPassword && typeof user.password === "string") {
        validPassword = user.password === password;
        if (validPassword) {
          const migrated = hashPassword(password);
          user.passwordSalt = migrated.salt;
          user.passwordDigest = migrated.digest;
          delete user.password;
          user.updatedAt = new Date().toISOString();
          writeUsersStore(usersStore);
        }
      }

      if (!validPassword) {
        sendJson(res, 401, { error: "Credenciales inválidas." });
        return;
      }

      const token = issueSession(user.id);
      sendJson(res, 200, { ok: true, user: sanitizeUser(user), token });
    } catch (error) {
      sendJson(res, 400, { error: "JSON inválido", detail: error.message });
    }
    return;
  }

  if (pathname === "/api/auth/me" && req.method === "GET") {
    const auth = requireAuth(req, res);
    if (!auth) {
      return;
    }
    sendJson(res, 200, { ok: true, user: sanitizeUser(auth.user) });
    return;
  }

  if (pathname === "/api/auth/logout" && req.method === "POST") {
    const auth = requireAuth(req, res);
    if (!auth) {
      return;
    }
    removeSessionToken(auth.token);
    sendJson(res, 200, { ok: true });
    return;
  }

  if (pathname === "/api/auth/forgot" && req.method === "POST") {
    try {
      const payload = await parseJsonBody(req);
      const identifier = normalizeEmail(payload?.identifier);
      if (!identifier) {
        sendJson(res, 400, { error: "Escribe correo o usuario para recuperar contraseña." });
        return;
      }

      const usersStore = getUsersStore();
      const user = findUserByIdentifier(usersStore, identifier);
      if (!user) {
        sendJson(res, 404, { error: "No existe una cuenta con ese correo/usuario." });
        return;
      }

      const code = createRecoveryCode();
      user.recoveryCode = code;
      user.recoveryExpiresAt = Date.now() + RESET_CODE_TTL_MS;
      user.updatedAt = new Date().toISOString();
      writeUsersStore(usersStore);

      sendJson(res, 200, {
        ok: true,
        recoveryCode: code,
        expiresAt: user.recoveryExpiresAt,
        message: "Código de recuperación generado."
      });
    } catch (error) {
      sendJson(res, 400, { error: "JSON inválido", detail: error.message });
    }
    return;
  }

  if (pathname === "/api/auth/reset" && req.method === "POST") {
    try {
      const payload = await parseJsonBody(req);
      const identifier = normalizeEmail(payload?.identifier);
      const code = String(payload?.code || "").trim();
      const newPassword = String(payload?.newPassword || "");

      if (!identifier || !code || !newPassword) {
        sendJson(res, 400, { error: "Completa correo/usuario, código y nueva contraseña." });
        return;
      }
      if (newPassword.length < 8) {
        sendJson(res, 400, { error: "La nueva contraseña debe tener al menos 8 caracteres." });
        return;
      }

      const usersStore = getUsersStore();
      const user = findUserByIdentifier(usersStore, identifier);
      if (!user) {
        sendJson(res, 404, { error: "No existe una cuenta con ese correo/usuario." });
        return;
      }

      const expectedCode = String(user?.recoveryCode || "").trim();
      const expiresAt = Number(user?.recoveryExpiresAt || 0);
      if (!expectedCode || code !== expectedCode) {
        sendJson(res, 400, { error: "Código de recuperación incorrecto." });
        return;
      }
      if (expiresAt < Date.now()) {
        sendJson(res, 400, { error: "El código de recuperación expiró." });
        return;
      }

      const pwd = hashPassword(newPassword);
      user.passwordSalt = pwd.salt;
      user.passwordDigest = pwd.digest;
      delete user.password;
      user.recoveryCode = "";
      user.recoveryExpiresAt = 0;
      user.updatedAt = new Date().toISOString();
      writeUsersStore(usersStore);

      const sessionsStore = purgeExpiredSessions(getSessionsStore());
      sessionsStore.sessions = sessionsStore.sessions.filter((entry) => String(entry?.userId || "") !== String(user.id));
      writeSessionsStore(sessionsStore);

      const token = issueSession(user.id);
      sendJson(res, 200, { ok: true, user: sanitizeUser(user), token });
    } catch (error) {
      sendJson(res, 400, { error: "JSON inválido", detail: error.message });
    }
    return;
  }

  if (pathname === "/api/state" && req.method === "GET") {
    const auth = requireAuth(req, res);
    if (!auth) {
      return;
    }
    const state = readStateForUser(auth.user.id);
    sendJson(res, 200, state);
    return;
  }

  if (pathname === "/api/state" && (req.method === "PUT" || req.method === "POST")) {
    const auth = requireAuth(req, res);
    if (!auth) {
      return;
    }

    try {
      const payload = await parseJsonBody(req);
      const incomingData = payload && typeof payload === "object" ? (payload.data || payload) : null;
      if (!incomingData || typeof incomingData !== "object") {
        sendJson(res, 400, { error: "Formato inválido" });
        return;
      }

      const nextState = writeStateForUser(auth.user.id, incomingData);
      sendJson(res, 200, { ok: true, updatedAt: nextState.updatedAt });
    } catch (error) {
      sendJson(res, 400, { error: "JSON inválido", detail: error.message });
    }
    return;
  }

  if (pathname === "/api/clinical-pdf" && req.method === "POST") {
    const auth = requireAuth(req, res);
    if (!auth) {
      return;
    }

    try {
      const payload = await parseJsonBody(req);
      const result = await generateClinicalPdf({
        templatePath: CLINICAL_TEMPLATE_FILE,
        formatId: payload?.formatId,
        patient: payload?.patient,
        dictionaries: payload?.dictionaries,
        clinicalContext: payload?.clinicalContext,
        clinicalFillEntries: payload?.clinicalFillEntries
      });

      res.writeHead(200, {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${result.fileName}"`,
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,PUT,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      });
      res.end(Buffer.from(result.pdfBytes));
    } catch (error) {
      sendJson(res, 400, { error: "No se pudo generar el PDF oficial", detail: error.message });
    }
    return;
  }

  sendJson(res, 404, { error: "Ruta API no encontrada" });
}

const server = http.createServer(async (req, res) => {
  try {
    const parsed = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const pathname = parsed.pathname;

    if (pathname.startsWith("/api/")) {
      await handleApi(req, res, pathname);
      return;
    }

    serveStatic(req, res, pathname);
  } catch (error) {
    sendText(res, 500, `Error del servidor: ${error.message}`);
  }
});

ensureDemoUser();

server.listen(PORT, () => {
  console.log(`Arete backend+frontend activo en http://localhost:${PORT}`);
});
