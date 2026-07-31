"use strict";

const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const SERVER_FILE = path.join(ROOT, "backend", "src", "index.js");

function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const probe = http.createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const port = Number(probe.address()?.port);
      probe.close((error) => error ? reject(error) : resolve(port));
    });
  });
}

function request(baseUrl, pathname, options) {
  const config = options && typeof options === "object" ? options : {};
  const body = config.body === undefined ? null : Buffer.from(JSON.stringify(config.body));
  return new Promise((resolve, reject) => {
    const req = http.request(`${baseUrl}${pathname}`, {
      method: config.method || "GET",
      timeout: config.timeout || 30000,
      headers: {
        ...(body ? {
          "Content-Type": "application/json",
          "Content-Length": String(body.length)
        } : {}),
        ...(config.token ? { Authorization: `Bearer ${config.token}` } : {})
      }
    }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve({
        statusCode: Number(res.statusCode || 0),
        headers: res.headers,
        body: Buffer.concat(chunks)
      }));
    });
    req.on("timeout", () => req.destroy(new Error("Tiempo de espera agotado")));
    req.on("error", reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function waitForCloudServer(baseUrl, child) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`El servidor estable terminó antes de responder (${child.exitCode}).`);
    }
    try {
      const response = await request(baseUrl, "/api/health", { timeout: 1500 });
      const payload = JSON.parse(response.body.toString("utf8"));
      if (
        response.statusCode === 200
        && payload?.ok === true
        && payload?.deploymentMode === "cloud"
        && payload?.authentication === "required"
      ) {
        return;
      }
    } catch {
      // Continua durante el periodo de arranque.
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error("El servidor estable con registro no respondió a tiempo.");
}

async function stopServer(child) {
  if (!child || child.exitCode !== null) {
    return;
  }
  child.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, 3000))
  ]);
  if (child.exitCode === null) {
    child.kill("SIGKILL");
  }
}

function parseJson(response) {
  return JSON.parse(response.body.toString("utf8"));
}

async function main() {
  const port = await getAvailablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "arete-cloud-smoke-"));
  const output = [];
  const child = spawn(process.execPath, [SERVER_FILE], {
    cwd: ROOT,
    env: {
      ...process.env,
      PORT: String(port),
      ARETE_DEPLOYMENT_MODE: "cloud",
      ARETE_DATA_DIR: dataDir,
      ARETE_EXPOSE_RECOVERY_CODE: "true"
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true
  });
  child.stdout.on("data", (chunk) => output.push(chunk.toString("utf8")));
  child.stderr.on("data", (chunk) => output.push(chunk.toString("utf8")));

  try {
    await waitForCloudServer(baseUrl, child);
    const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const email = `prueba-${unique}@arete.local`;
    const username = `prueba${unique.replace(/\D/g, "").slice(-10)}`;
    const password = "PruebaArete2026!";
    const registration = await request(baseUrl, "/api/auth/register", {
      method: "POST",
      body: { name: "Cuenta de prueba", email, username, password }
    });
    if (registration.statusCode !== 201) {
      throw new Error(`Registro devolvió ${registration.statusCode}: ${registration.body.toString("utf8")}`);
    }
    const registrationPayload = parseJson(registration);
    const token = String(registrationPayload?.token || "");
    if (!token) {
      throw new Error("El registro no devolvió una sesión válida.");
    }

    const statePayload = {
      diseases: [],
      toothStatuses: [],
      patients: [],
      externalAppointments: [],
      scannedDocuments: []
    };
    const savedState = await request(baseUrl, "/api/state", {
      method: "PUT",
      token,
      body: { data: statePayload }
    });
    if (savedState.statusCode !== 200 || parseJson(savedState)?.ok !== true) {
      throw new Error("No se pudo guardar el estado de la cuenta de prueba.");
    }
    const loadedState = await request(baseUrl, "/api/state", { token });
    if (loadedState.statusCode !== 200 || !Array.isArray(parseJson(loadedState)?.data?.patients)) {
      throw new Error("No se pudo recuperar el estado de la cuenta de prueba.");
    }

    const pdfResponse = await request(baseUrl, "/api/clinical-pdf", {
      method: "POST",
      token,
      timeout: 60000,
      body: {
        formatId: "f1-estomatologica",
        patient: { name: "Paciente", lastNameFather: "Prueba", clinicalFormData: {} },
        dictionaries: { diseases: [], toothStatuses: [] },
        clinicalContext: {},
        clinicalFillEntries: []
      }
    });
    if (
      pdfResponse.statusCode !== 200
      || pdfResponse.headers["content-type"] !== "application/pdf"
      || pdfResponse.body.subarray(0, 5).toString("ascii") !== "%PDF-"
    ) {
      throw new Error("La versión estable no devolvió un cuestionario PDF descargable.");
    }

    console.log(`Versión estable válida: registro, sesión, almacenamiento por cuenta y PDF comprobados en el puerto temporal ${port}.`);
  } catch (error) {
    const detail = output.join("").trim();
    throw new Error(`${error.message}${detail ? `\n${detail}` : ""}`);
  } finally {
    await stopServer(child);
    const resolvedTemp = path.resolve(dataDir);
    if (resolvedTemp.startsWith(path.resolve(os.tmpdir()) + path.sep)) {
      fs.rmSync(resolvedTemp, { recursive: true, force: true });
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
