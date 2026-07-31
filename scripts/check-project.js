"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const FRONTEND_DIR = path.join(ROOT, "frontend");
const INDEX_FILE = path.join(FRONTEND_DIR, "index.html");
const OPTIONAL_HTML_IDS = new Set([
  "quickAppointmentPatient",
  "quickAppointmentDate",
  "quickAppointmentStartTime",
  "quickAppointmentEndTime",
  "quickAppointmentReason",
  "quickAddAppointmentBtn",
  "scannedDocsList",
  "scanTakePhotoBtn",
  "scanUploadFileBtn",
  "scanCameraInput",
  "scanFileInput"
]);

function fail(message) {
  throw new Error(message);
}

function listFiles(directory, predicate) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(fullPath, predicate));
    } else if (predicate(fullPath)) {
      files.push(fullPath);
    }
  }
  return files;
}

function relative(filePath) {
  return path.relative(ROOT, filePath).replaceAll("\\", "/");
}

function hashFile(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function assertFilesExist(filePaths) {
  const missing = filePaths.filter((filePath) => !fs.existsSync(filePath));
  if (missing.length > 0) {
    fail(`Faltan archivos requeridos:\n${missing.map(relative).join("\n")}`);
  }
}

function checkJavaScriptSyntax() {
  const roots = [
    path.join(ROOT, "backend", "src"),
    path.join(ROOT, "frontend", "assets", "js"),
    path.join(ROOT, "scripts")
  ];
  const files = roots.flatMap((directory) => listFiles(directory, (filePath) => filePath.endsWith(".js")));
  const failures = [];

  for (const filePath of files) {
    const result = spawnSync(process.execPath, ["--check", filePath], {
      cwd: ROOT,
      encoding: "utf8"
    });
    if (result.status !== 0) {
      failures.push(`${relative(filePath)}\n${String(result.stderr || result.stdout || "").trim()}`);
    }
  }

  if (failures.length > 0) {
    fail(`Errores de sintaxis:\n${failures.join("\n\n")}`);
  }
  return files.length;
}

function checkJsonFiles() {
  const files = [
    path.join(ROOT, "package.json"),
    path.join(ROOT, "package-lock.json"),
    path.join(ROOT, "backend", "data", "state.json"),
    path.join(ROOT, "backend", "data", "uv-historias.textmap.json"),
    path.join(ROOT, "frontend", "data", "uv-historias.textmap.json"),
    path.join(ROOT, "docs", "clinical", "pdf-coverage-report.json"),
    path.join(ROOT, "docs", "pdf-fill-map.json"),
    path.join(ROOT, "capacitor.config.json"),
    path.join(FRONTEND_DIR, "manifest.webmanifest")
  ];

  for (const filePath of files) {
    try {
      JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
    } catch (error) {
      fail(`JSON inválido en ${relative(filePath)}: ${error.message}`);
    }
  }
  return files.length;
}

function checkHtmlContracts() {
  const html = fs.readFileSync(INDEX_FILE, "utf8");
  if (/\brel=["']manifest["']/i.test(html) || html.includes("installAppBtn") || html.includes("Instalar Arete")) {
    fail("La interfaz todavía ofrece instalar o descargar el software.");
  }
  if (!html.includes("¿Olvidaste tu contraseña? Restablecer contraseña")) {
    fail("Falta el acceso visible para restablecer la contraseña.");
  }
  const ids = Array.from(html.matchAll(/\bid="([^"]+)"/g), (match) => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length > 0) {
    fail(`Hay identificadores HTML duplicados: ${Array.from(new Set(duplicates)).join(", ")}`);
  }

  const idSet = new Set(ids);
  const frontendScripts = listFiles(path.join(FRONTEND_DIR, "assets", "js"), (filePath) => filePath.endsWith(".js"));
  const referencedIds = new Set();
  for (const scriptFile of frontendScripts) {
    const source = fs.readFileSync(scriptFile, "utf8");
    for (const match of source.matchAll(/getElementById\(\s*["']([^"']+)["']\s*\)/g)) {
      referencedIds.add(match[1]);
    }
  }
  const missingIds = Array.from(referencedIds)
    .filter((id) => !idSet.has(id) && !OPTIONAL_HTML_IDS.has(id))
    .sort();
  if (missingIds.length > 0) {
    fail(`JavaScript referencia IDs que no existen en index.html: ${missingIds.join(", ")}`);
  }

  const localAssets = [];
  for (const match of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
    const value = match[1];
    if (!value.startsWith("./") && !value.startsWith("../")) {
      continue;
    }
    const localPath = value.split(/[?#]/, 1)[0];
    localAssets.push(path.resolve(FRONTEND_DIR, localPath));
  }
  assertFilesExist(localAssets);

  return {
    ids: ids.length,
    referencedIds: referencedIds.size,
    localAssets: localAssets.length
  };
}

function checkMirroredPdfAssets() {
  const frontendPdf = path.join(ROOT, "frontend", "data", "uv-historias.pdf");
  const backendPdf = path.join(ROOT, "backend", "data", "uv-historias.pdf");
  const frontendMap = path.join(ROOT, "frontend", "data", "uv-historias.textmap.json");
  const backendMap = path.join(ROOT, "backend", "data", "uv-historias.textmap.json");
  assertFilesExist([frontendPdf, backendPdf, frontendMap, backendMap]);

  if (hashFile(frontendPdf) !== hashFile(backendPdf)) {
    fail("Las copias frontend/backend de uv-historias.pdf no son idénticas.");
  }
  if (hashFile(frontendMap) !== hashFile(backendMap)) {
    fail("Las copias frontend/backend del mapa de texto PDF no son idénticas.");
  }
}

function checkClinicalFormPersistence() {
  const scriptPaths = [
    path.join(FRONTEND_DIR, "assets", "js", "config", "constants.js"),
    path.join(FRONTEND_DIR, "assets", "js", "core", "helpers.js"),
    path.join(FRONTEND_DIR, "assets", "js", "data", "state-models.js"),
    path.join(FRONTEND_DIR, "assets", "js", "pdf", "clinical-pdf.js")
  ];
  const source = `${scriptPaths.map((filePath) => fs.readFileSync(filePath, "utf8")).join("\n")}
module.exports = { normalizePatient, buildClinicalPdfContext, buildClinicalPdfFillEntries };`;
  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    crypto: crypto.webcrypto,
    structuredClone,
    Date,
    Math,
    String,
    Number,
    Boolean,
    Array,
    Object,
    Set,
    Map,
    JSON
  };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: "frontend-state-models.js" });

  const normalized = sandbox.module.exports.normalizePatient({
    id: "pt-pdf-persistence",
    name: "Paciente",
    clinicalRecordType: "f1-estomatologica",
    clinicalFormData: {
      "f1-estomatologica": {
        hereditarios_madre: "Diabetes materna"
      },
      "f8-periodoncia": {
        auxiliares_laboratorio_f8: "Biometria hematica"
      }
    }
  });

  if (normalized.clinicalFormData?.["f1-estomatologica"]?.hereditarios_madre !== "Diabetes materna") {
    fail("La normalización del paciente borró respuestas del Formato 1.");
  }
  if (normalized.clinicalFormData?.["f8-periodoncia"]?.auxiliares_laboratorio_f8 !== "Biometria hematica") {
    fail("La normalización del paciente borró respuestas del Formato 8.");
  }

  const pdfContext = sandbox.module.exports.buildClinicalPdfContext(
    normalized,
    { diseases: [], toothStatuses: [] },
    "f1-estomatologica"
  );
  const fillEntries = sandbox.module.exports.buildClinicalPdfFillEntries(
    normalized,
    "f1-estomatologica",
    pdfContext
  );
  const motherEntry = fillEntries.find((entry) => entry.id === "field-f1-estomatologica-hereditarios_madre");
  if (motherEntry?.value !== "Diabetes materna") {
    fail("El payload PDF no conservó la respuesta del cuestionario activo.");
  }
}

function checkOdontogramLayout() {
  const scriptFile = path.join(ROOT, "scripts", "check-odontogram-layout.js");
  const result = spawnSync(process.execPath, [scriptFile], {
    cwd: ROOT,
    encoding: "utf8"
  });
  if (result.status !== 0) {
    fail(`El odontograma no superó la auditoría:\n${String(result.stderr || result.stdout || "").trim()}`);
  }
  return String(result.stdout || "").trim();
}

function main() {
  const requiredFiles = [
    INDEX_FILE,
    path.join(ROOT, "backend", "src", "index.js"),
    path.join(ROOT, "backend", "src", "clinical_pdf.js"),
    path.join(ROOT, "frontend", "assets", "css", "main.css"),
    path.join(ROOT, "frontend", "service-worker.js"),
    path.join(ROOT, "frontend", "assets", "icons", "arete-icon-192.png"),
    path.join(ROOT, "frontend", "assets", "icons", "arete-icon-512.png"),
    path.join(ROOT, "Iniciar Arete - Estable con registro.cmd"),
    path.join(ROOT, "Iniciar Arete - Pruebas locales.cmd"),
    path.join(ROOT, "Detener Arete - Pruebas.cmd"),
    path.join(ROOT, "Abrir codigo Arete.cmd"),
    path.join(ROOT, "scripts", "open-code.ps1"),
    path.join(ROOT, "scripts", "start-test.ps1"),
    path.join(ROOT, "scripts", "stop-test.ps1"),
    path.join(ROOT, "scripts", "smoke-cloud-server.js"),
    path.join(ROOT, "scripts", "check-odontogram-layout.js"),
    path.join(ROOT, "package.json"),
    path.join(ROOT, "package-lock.json")
  ];
  assertFilesExist(requiredFiles);

  const syntaxCount = checkJavaScriptSyntax();
  const jsonCount = checkJsonFiles();
  const html = checkHtmlContracts();
  checkMirroredPdfAssets();
  checkClinicalFormPersistence();
  const odontogramResult = checkOdontogramLayout();

  console.log(`Proyecto válido: ${syntaxCount} JS, ${jsonCount} JSON, ${html.ids} IDs y ${html.localAssets} recursos locales.`);
  console.log(odontogramResult);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
