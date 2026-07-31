"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const sourceFiles = [
  path.join(ROOT, "frontend", "assets", "js", "config", "constants.js"),
  path.join(ROOT, "frontend", "assets", "js", "core", "helpers.js"),
  path.join(ROOT, "frontend", "assets", "js", "data", "state-models.js")
];
const source = `${sourceFiles.map((filePath) => fs.readFileSync(filePath, "utf8")).join("\n")}
module.exports = {
  DENTITION_LAYOUTS,
  ODONTOGRAM_TEMPLATES,
  TOOTH_PATHS,
  getOdontoSurfaceParts,
  getPeriodontalToothParts,
  getToothMorphologyKind,
  getToothPositionInfo,
  getToothRenderSpec,
  migrateLegacyOdontogramSurfaceMarks,
  removeInvalidAnteriorCenterMarks
};`;
const sandbox = {
  module: { exports: {} },
  exports: {},
  console,
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
vm.runInContext(source, sandbox, { filename: "odontogram-layout-audit.js" });

const {
  DENTITION_LAYOUTS,
  ODONTOGRAM_TEMPLATES,
  TOOTH_PATHS,
  getOdontoSurfaceParts,
  getPeriodontalToothParts,
  getToothMorphologyKind,
  getToothPositionInfo,
  getToothRenderSpec,
  migrateLegacyOdontogramSurfaceMarks,
  removeInvalidAnteriorCenterMarks
} = sandbox.module.exports;

const failures = [];
let checkedTeeth = 0;

for (const [mode, layout] of Object.entries(DENTITION_LAYOUTS)) {
  const teeth = [...layout.upper, ...layout.lower];
  const expectedCount = mode === "adult" ? 32 : 20;
  if (teeth.length !== expectedCount || new Set(teeth).size !== expectedCount) {
    failures.push(`${mode}: numeración incompleta o duplicada.`);
  }

  for (const toothNumber of teeth) {
    checkedTeeth += 1;
    const info = getToothPositionInfo(toothNumber);
    const morphology = getToothMorphologyKind(toothNumber);
    const parts = getOdontoSurfaceParts(toothNumber);
    const periodontalParts = getPeriodontalToothParts(toothNumber);
    const labels = Object.fromEntries(parts.map((part) => [part.id, part.label]));
    const isAnterior = morphology === "incisor" || morphology === "canine";
    const expectedPartCount = isAnterior ? 4 : 5;
    const expectedInner = info.isUpper ? "Palatina / palatal" : "Lingual";
    const expectedLeft = info.isLeft ? "Mesial" : "Distal";
    const expectedRight = info.isLeft ? "Distal" : "Mesial";

    if (parts.length !== expectedPartCount || new Set(parts.map((part) => part.id)).size !== expectedPartCount) {
      failures.push(`${toothNumber}: debe tener exactamente cinco superficies únicas.`);
    }
    if (
      periodontalParts.length !== expectedPartCount + 1
      || periodontalParts.at(-1)?.id !== "root"
      || periodontalParts.at(-1)?.label !== "Raiz / raices"
    ) {
      failures.push(`${toothNumber}: falta la raiz marcable independiente.`);
    }
    if (
      labels.top !== "Vestibular"
      || labels.bottom !== expectedInner
      || labels.left !== expectedLeft
      || labels.right !== expectedRight
      || (isAnterior ? Object.hasOwn(labels, "center") : labels.center !== "Oclusal")
    ) {
      failures.push(`${toothNumber}: orientación de superficies incorrecta.`);
    }

    const renderSpec = getToothRenderSpec(toothNumber, mode);
    if (!renderSpec || !TOOTH_PATHS[renderSpec.path]) {
      failures.push(`${toothNumber}: no tiene silueta anatómica válida.`);
    }
  }
}

for (const key of ["anatomic", "grid", "classic"]) {
  if (!ODONTOGRAM_TEMPLATES[key]?.label || !ODONTOGRAM_TEMPLATES[key]?.hint) {
    failures.push(`Plantilla ${key}: falta nombre o explicación.`);
  }
}

const renderSource = fs.readFileSync(
  path.join(ROOT, "frontend", "assets", "js", "render", "render.js"),
  "utf8"
);
if (!renderSource.includes("getOdontoSurfaceParts(toothNumber)")) {
  failures.push("El render no consume las superficies orientadas por pieza.");
}
if (!renderSource.includes("buildAnatomicToothArt")) {
  failures.push("Falta el odontograma anatómico de tres vistas.");
}

if (!renderSource.includes("getPeriodontalToothParts(toothNumber)")) {
  failures.push("La plantilla periodontal no agrega la raiz marcable.");
}

if (!renderSource.includes('data-tooth-part="${part.id}"')) {
  failures.push("Las superficies validas no exponen un objetivo de marcado independiente.");
}

const cssSource = fs.readFileSync(
  path.join(ROOT, "frontend", "assets", "css", "main.css"),
  "utf8"
);
for (const selector of [
  ".tooth-node.template-anatomic.jaw-upper .tooth-part-top",
  ".tooth-node.template-anatomic.jaw-lower .tooth-part-top",
  ".tooth-node.template-anatomic.jaw-upper .tooth-part-root",
  ".tooth-node.template-anatomic.jaw-lower .tooth-part-root",
  ".tooth-node.template-classic.jaw-upper .tooth-part-map",
  ".tooth-node.template-classic.jaw-lower .tooth-part-map"
]) {
  if (!cssSource.includes(selector)) {
    failures.push(`Falta limitar el marcado a la corona: ${selector}.`);
  }
}

const legacyMarks = {
  "11|top": ["caries"],
  "11|center": ["sano"],
  "11|left": ["mesial"],
  "11|right": ["distal"],
  "21|left": ["mesial-izquierda"],
  "21|right": ["distal-derecha"]
};
const migratedMarks = removeInvalidAnteriorCenterMarks(
  migrateLegacyOdontogramSurfaceMarks(legacyMarks)
);
const expectedMigration = {
  "11|top": "sano",
  "11|right": "mesial",
  "11|left": "distal",
  "21|left": "mesial-izquierda",
  "21|right": "distal-derecha"
};
for (const [key, statusId] of Object.entries(expectedMigration)) {
  if (!Array.isArray(migratedMarks[key]) || migratedMarks[key][0] !== statusId) {
    failures.push(`La migracion de marcas previas no conserva ${key}.`);
  }
}
if (Object.hasOwn(migratedMarks, "11|center") || Object.hasOwn(migratedMarks, "21|center")) {
  failures.push("La migracion conserva centros invalidos en dientes anteriores.");
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Odontogramas válidos: ${checkedTeeth} dientes, cuatro superficies anteriores, cinco posteriores y tres plantillas coherentes.`);
}
