"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function loadConstants(root) {
  const constantsPath = path.join(root, "frontend", "assets", "js", "config", "constants.js");
  const source = `${fs.readFileSync(constantsPath, "utf8")}
module.exports = {
  CLINICAL_FORM_SCHEMAS,
  CLINICAL_FIELD_PDF_RULES,
  CLINICAL_FORMAT_START_PAGES,
  CLINICAL_FORMAT_ORDER
};`;
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
  vm.runInContext(source, sandbox, { filename: constantsPath });
  return sandbox.module.exports;
}

function groupTextRows(items) {
  const rows = [];
  const sorted = [...items].sort((left, right) => (
    Math.abs(Number(right.y) - Number(left.y)) > 1.8
      ? Number(right.y) - Number(left.y)
      : Number(left.x) - Number(right.x)
  ));

  for (const item of sorted) {
    const y = Number(item.y);
    let row = rows.find((candidate) => Math.abs(candidate.y - y) <= 1.8);
    if (!row) {
      row = { y, items: [] };
      rows.push(row);
    }
    row.items.push(item);
  }

  return rows
    .map((row) => {
      row.items.sort((left, right) => Number(left.x) - Number(right.x));
      const text = row.items.map((item) => String(item.raw || "").trim()).filter(Boolean).join(" ");
      return {
        y: row.y,
        minX: Math.min(...row.items.map((item) => Number(item.x))),
        maxX: Math.max(...row.items.map((item) => Number(item.x) + Number(item.w || 0))),
        text,
        norm: normalize(text)
      };
    })
    .filter((row) => row.text);
}

function rulePoint(rule) {
  const type = String(rule?.type || "").toLowerCase();
  if (type === "mark-select") {
    const point = rule?.markMap?.si || Object.values(rule?.markMap || {})[0];
    return point ? { x: Number(point.x), y: Number(point.y) } : null;
  }
  const x = Number(rule?.x);
  const y = Number(rule?.y);
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
}

function semanticScore(label, rowText) {
  const ignored = new Set([
    "de", "del", "la", "las", "el", "los", "en", "y", "o", "a", "al",
    "si", "no", "actual", "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8",
    "f9", "f10", "f11"
  ]);
  const labelTokens = normalize(label).split(" ").filter((token) => (
    (/^\d+$/.test(token) || token.length > 2) && !ignored.has(token)
  ));
  const rowTokens = new Set(normalize(rowText).split(" ").filter(Boolean));
  if (!labelTokens.length) {
    return 0;
  }
  return labelTokens.filter((token) => rowTokens.has(token)).length / labelTokens.length;
}

function main() {
  const root = path.resolve(__dirname, "..", "..");
  const constants = loadConstants(root);
  const textMap = JSON.parse(
    fs.readFileSync(path.join(root, "frontend", "data", "uv-historias.textmap.json"), "utf8").replace(/^\uFEFF/, "")
  );
  const verbose = process.argv.includes("--verbose");
  const formatFilter = process.argv
    .find((argument) => argument.startsWith("--format="))
    ?.slice("--format=".length);
  const rowsByPage = new Map(
    Object.entries(textMap.pages || {}).map(([page, items]) => [Number(page), groupTextRows(items || [])])
  );
  const problems = [];
  const report = [];

  for (const formatId of constants.CLINICAL_FORMAT_ORDER) {
    if (formatFilter && formatId !== formatFilter) {
      continue;
    }
    const startPage = Number(constants.CLINICAL_FORMAT_START_PAGES[formatId]);
    const schema = constants.CLINICAL_FORM_SCHEMAS[formatId];
    const rules = constants.CLINICAL_FIELD_PDF_RULES[formatId] || {};

    for (const field of schema.fields) {
      const rule = rules[field.id];
      const point = rulePoint(rule);
      const pageOffset = Number(rule?.pageOffset);
      if (!rule || !point || !Number.isInteger(pageOffset)) {
        problems.push(`${formatId}/${field.id}: regla incompleta`);
        continue;
      }
      if (point.x < 0 || point.x > 607.276 || point.y < 0 || point.y > 765.354) {
        problems.push(`${formatId}/${field.id}: coordenada fuera de página (${point.x}, ${point.y})`);
        continue;
      }

      const sourcePage = startPage + pageOffset;
      const nearbyRows = (rowsByPage.get(sourcePage) || [])
        .map((row) => ({
          ...row,
          distance: Math.abs(row.y - point.y),
          score: semanticScore(rule?.sourceLabel || field.label, row.text)
        }))
        .filter((row) => row.distance <= 24)
        .sort((left, right) => (
          right.score - left.score
          || left.distance - right.distance
          || Math.abs(left.minX - point.x) - Math.abs(right.minX - point.x)
        ))
        .slice(0, 3);

      const best = nearbyRows[0] || null;
      const item = {
        formatId,
        fieldId: field.id,
        label: field.label,
        sourcePage,
        point,
        bestText: best?.text || "",
        bestScore: best?.score || 0,
        distance: best?.distance ?? null
      };
      report.push(item);

      if (!best) {
        problems.push(`${formatId}/${field.id}: no hay texto impreso cerca de p${sourcePage} (${point.x}, ${point.y})`);
      } else if (best.score === 0) {
        problems.push(
          `${formatId}/${field.id}: "${field.label}" no corresponde con la línea cercana "${best.text}"`
        );
      }
    }
  }

  if (verbose) {
    let currentFormat = "";
    for (const item of report) {
      if (item.formatId !== currentFormat) {
        currentFormat = item.formatId;
        console.log(`\n## ${currentFormat}`);
      }
      console.log(
        `${item.fieldId}\tp${item.sourcePage}\t${item.point.x},${item.point.y}`
        + `\t${item.label}\t=> ${item.bestText || "(sin texto cercano)"}`
      );
    }
  }

  console.log(
    `Semántica PDF: ${report.length} campos con coordenadas válidas; ${problems.length} incidencias estructurales.`
  );
  for (const problem of problems) {
    console.log(`- ${problem}`);
  }
  if (problems.length) {
    process.exitCode = 1;
  }
}

main();
