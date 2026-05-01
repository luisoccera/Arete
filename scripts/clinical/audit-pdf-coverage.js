"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadClinicalConstants(constantsPath) {
  const src = fs.readFileSync(constantsPath, "utf8");
  const wrapped = `${src}\nmodule.exports = { CLINICAL_FORM_SCHEMAS, CLINICAL_FIELD_PDF_RULES, CLINICAL_FORMAT_ORDER };`;
  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    Set,
    Map,
    Date,
    Math,
    String,
    Number,
    Array,
    Object
  };
  vm.createContext(sandbox);
  vm.runInContext(wrapped, sandbox, { filename: "constants.js" });
  return sandbox.module.exports;
}

function buildCoverageReport(schemas, rules, formatOrder) {
  const rows = [];
  for (const formatId of formatOrder) {
    const schema = schemas[formatId] || { fields: [] };
    const fieldIds = Array.isArray(schema.fields) ? schema.fields.map((f) => String(f.id || "").trim()).filter(Boolean) : [];
    const formatRules = rules[formatId] && typeof rules[formatId] === "object" ? rules[formatId] : {};
    const ruleIds = Object.keys(formatRules);
    const missingIds = fieldIds.filter((id) => !ruleIds.includes(id));

    rows.push({
      formatId,
      totalFields: fieldIds.length,
      mappedFields: ruleIds.length,
      effectiveMappedFields: fieldIds.length,
      missingCount: missingIds.length,
      missingIds
    });
  }
  return rows;
}

function toMarkdown(rows) {
  const lines = [];
  lines.push("# Auditoría de Cobertura PDF por Formato");
  lines.push("");
  lines.push("| Formato | Campos frontend | Campos con regla manual | Cobertura efectiva (manual+fallback) | Faltantes manuales |");
  lines.push("|---|---:|---:|---:|");
  for (const row of rows) {
    lines.push(`| ${row.formatId} | ${row.totalFields} | ${row.mappedFields} | ${row.effectiveMappedFields} | ${row.missingCount} |`);
  }
  lines.push("");
  for (const row of rows) {
    if (!row.missingCount) {
      continue;
    }
    lines.push(`## ${row.formatId} - faltantes (${row.missingCount})`);
    lines.push("");
    for (const fieldId of row.missingIds) {
      lines.push(`- ${fieldId}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

function main() {
  const root = path.resolve(__dirname, "..", "..");
  const constantsPath = path.join(root, "frontend", "assets", "js", "config", "constants.js");
  const outDir = path.join(root, "docs", "clinical");
  const outJson = path.join(outDir, "pdf-coverage-report.json");
  const outMd = path.join(outDir, "pdf-coverage-report.md");

  const { CLINICAL_FORM_SCHEMAS, CLINICAL_FIELD_PDF_RULES, CLINICAL_FORMAT_ORDER } = loadClinicalConstants(constantsPath);
  const rows = buildCoverageReport(CLINICAL_FORM_SCHEMAS, CLINICAL_FIELD_PDF_RULES, CLINICAL_FORMAT_ORDER);

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outJson, JSON.stringify({ generatedAt: new Date().toISOString(), rows }, null, 2), "utf8");
  fs.writeFileSync(outMd, toMarkdown(rows), "utf8");

  for (const row of rows) {
    console.log(`${row.formatId}: manual ${row.mappedFields}/${row.totalFields}; efectivo ${row.effectiveMappedFields}/${row.totalFields}; faltan manuales ${row.missingCount}`);
  }
  console.log(`Reporte JSON: ${outJson}`);
  console.log(`Reporte MD: ${outMd}`);
}

main();
