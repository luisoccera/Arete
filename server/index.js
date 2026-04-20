"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const { generateClinicalPdf } = require("./clinical_pdf");

const PORT = Number(process.env.PORT || 3001);
const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_FILE = path.join(ROOT_DIR, "data", "state.json");
const CLINICAL_TEMPLATE_FILE = path.join(ROOT_DIR, "data", "uv-historias.pdf");
const MAX_BODY_BYTES = 5 * 1024 * 1024;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
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
    "Access-Control-Allow-Headers": "Content-Type"
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

function ensureDataFile() {
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    const initial = {
      version: 1,
      updatedAt: "",
      data: {
        patients: [],
        diseases: [],
        toothStatuses: []
      }
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), "utf8");
  }
}

function readStateFile() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, "utf8");
  try {
    return JSON.parse(raw);
  } catch {
    return {
      version: 1,
      updatedAt: "",
      data: {
        patients: [],
        diseases: [],
        toothStatuses: []
      }
    };
  }
}

function writeStateFile(payload) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), "utf8");
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
      "Access-Control-Allow-Headers": "Content-Type"
    });
    res.end();
    return;
  }

  if (pathname === "/api/health" && req.method === "GET") {
    sendJson(res, 200, { ok: true, storage: "file", timestamp: new Date().toISOString() });
    return;
  }

  if (pathname === "/api/state" && req.method === "GET") {
    const state = readStateFile();
    sendJson(res, 200, state);
    return;
  }

  if (pathname === "/api/state" && (req.method === "PUT" || req.method === "POST")) {
    try {
      const payload = await parseJsonBody(req);
      const incomingData = payload && typeof payload === "object" ? (payload.data || payload) : null;
      if (!incomingData || typeof incomingData !== "object") {
        sendJson(res, 400, { error: "Formato invalido" });
        return;
      }

      const nextState = {
        version: 1,
        updatedAt: new Date().toISOString(),
        data: incomingData
      };

      writeStateFile(nextState);
      sendJson(res, 200, { ok: true, updatedAt: nextState.updatedAt });
    } catch (error) {
      sendJson(res, 400, { error: "JSON invalido", detail: error.message });
    }
    return;
  }

  if (pathname === "/api/clinical-pdf" && req.method === "POST") {
    try {
      const payload = await parseJsonBody(req);
      const result = await generateClinicalPdf({
        templatePath: CLINICAL_TEMPLATE_FILE,
        formatId: payload?.formatId,
        patient: payload?.patient,
        dictionaries: payload?.dictionaries
      });

      res.writeHead(200, {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${result.fileName}"`,
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,PUT,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
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

server.listen(PORT, () => {
  console.log(`Arete backend+frontend activo en http://localhost:${PORT}`);
});
