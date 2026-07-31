"use strict";

const http = require("http");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const SERVER_FILE = path.join(ROOT, "backend", "src", "index.js");

function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const probe = http.createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      const port = Number(address?.port);
      probe.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve(port);
        }
      });
    });
  });
}

function request(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: 1500 }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        resolve({
          statusCode: Number(res.statusCode || 0),
          body: Buffer.concat(chunks).toString("utf8")
        });
      });
    });
    req.on("timeout", () => req.destroy(new Error("Tiempo de espera agotado")));
    req.on("error", reject);
  });
}

async function waitForServer(baseUrl, child) {
  const deadline = Date.now() + 12000;
  let lastError = null;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`El servidor terminó antes de responder (código ${child.exitCode}).`);
    }
    try {
      const response = await request(`${baseUrl}/api/health`);
      if (response.statusCode === 200) {
        const payload = JSON.parse(response.body);
        if (payload?.ok === true) {
          if (payload?.deploymentMode !== "local" || payload?.authentication !== "not-required") {
            throw new Error("El servidor no inició en el modo local seguro esperado.");
          }
          return;
        }
      }
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw lastError || new Error("El servidor no respondió a tiempo.");
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

async function main() {
  const port = await getAvailablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const output = [];
  const child = spawn(process.execPath, [SERVER_FILE], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true
  });
  child.stdout.on("data", (chunk) => output.push(chunk.toString("utf8")));
  child.stderr.on("data", (chunk) => output.push(chunk.toString("utf8")));

  try {
    await waitForServer(baseUrl, child);
    const home = await request(`${baseUrl}/`);
    if (home.statusCode !== 200 || !home.body.includes("<title>Arete | Gestor Dental</title>")) {
      throw new Error("La página principal no respondió con el contenido esperado.");
    }
    const unauthorized = await request(`${baseUrl}/api/auth/me`);
    if (unauthorized.statusCode !== 409) {
      throw new Error(`El modo local devolvió ${unauthorized.statusCode} en lugar de desactivar las cuentas.`);
    }
    console.log(`Servidor válido: salud, interfaz y modo local sin cuentas comprobados en el puerto temporal ${port}.`);
  } catch (error) {
    const detail = output.join("").trim();
    throw new Error(`${error.message}${detail ? `\n${detail}` : ""}`);
  } finally {
    await stopServer(child);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
