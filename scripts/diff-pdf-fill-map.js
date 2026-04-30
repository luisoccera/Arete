"use strict";

const fs = require("fs");
const path = require("path");

async function loadPdfItems(pdfPath) {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const bytes = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await pdfjsLib.getDocument({ data: bytes, useSystemFonts: true }).promise;
  const pages = {};

  for (let pageNo = 1; pageNo <= doc.numPages; pageNo += 1) {
    const page = await doc.getPage(pageNo);
    const textContent = await page.getTextContent();
    pages[pageNo] = textContent.items
      .map((item) => {
        const text = String(item?.str || "").trim();
        if (!text) {
          return null;
        }
        return {
          text,
          norm: normalizeText(text),
          x: Number(item.transform?.[4] || 0),
          y: Number(item.transform?.[5] || 0),
          w: Number(item.width || 0)
        };
      })
      .filter(Boolean);
  }

  return { totalPages: doc.numPages, pages };
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9()\/\s.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isSameTokenAtPosition(a, b) {
  if (!a || !b) {
    return false;
  }
  if (!a.norm || !b.norm) {
    return false;
  }
  if (a.norm !== b.norm) {
    return false;
  }
  return Math.abs(a.x - b.x) <= 1.6 && Math.abs(a.y - b.y) <= 1.6;
}

function isLikelyHumanEntry(item) {
  if (!item || !item.text) {
    return false;
  }
  const text = String(item.text || "").trim();
  if (!text) {
    return false;
  }
  // Descarta glifos/ruido de fuentes incrustadas.
  if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]/.test(text)) {
    return false;
  }
  if (/^[xX]+$/.test(text)) {
    return false;
  }
  return true;
}

function collectAddedItems(blankItems, filledItems) {
  const safeBlank = Array.isArray(blankItems) ? blankItems : [];
  const safeFilled = Array.isArray(filledItems) ? filledItems : [];
  const blankNormCount = new Map();

  for (const item of safeBlank) {
    const key = item.norm;
    if (!key) {
      continue;
    }
    blankNormCount.set(key, (blankNormCount.get(key) || 0) + 1);
  }

  const exactPositionAdded = [];
  const frequencyAdded = [];
  const consumedBlankByNorm = new Map(blankNormCount);

  for (const item of safeFilled) {
    if (!isLikelyHumanEntry(item)) {
      continue;
    }

    const existsAtPosition = safeBlank.some((entry) => isSameTokenAtPosition(entry, item));
    if (!existsAtPosition) {
      exactPositionAdded.push(item);
      continue;
    }

    const norm = item.norm;
    if (!norm) {
      continue;
    }
    const remaining = consumedBlankByNorm.get(norm) || 0;
    if (remaining > 0) {
      consumedBlankByNorm.set(norm, remaining - 1);
    } else {
      frequencyAdded.push(item);
    }
  }

  const merged = [...exactPositionAdded, ...frequencyAdded];
  const dedup = [];
  const seen = new Set();
  for (const item of merged) {
    const key = `${item.norm}|${Math.round(item.x * 10)}|${Math.round(item.y * 10)}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    dedup.push(item);
  }

  return dedup.sort((a, b) => b.y - a.y || a.x - b.x);
}

function summarizeInteresting(items) {
  return items
    .filter((item) => isLikelyHumanEntry(item))
    .slice(0, 40)
    .map((item) => ({
      text: item.text,
      x: Number(item.x.toFixed(2)),
      y: Number(item.y.toFixed(2)),
      w: Number(item.w.toFixed(2))
    }));
}

function collectAllInteresting(items) {
  const safe = Array.isArray(items) ? items : [];
  const seen = new Set();
  const out = [];
  for (const item of safe) {
    if (!isLikelyHumanEntry(item)) {
      continue;
    }
    const key = `${item.norm}|${Math.round(item.x * 10)}|${Math.round(item.y * 10)}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push({
      text: item.text,
      x: Number(item.x.toFixed(2)),
      y: Number(item.y.toFixed(2)),
      w: Number(item.w.toFixed(2))
    });
  }
  return out.sort((a, b) => b.y - a.y || a.x - b.x);
}

function pickTopPagesByAddedCount(resultPages, limit) {
  const entries = Object.entries(resultPages).map(([page, items]) => ({
    page: Number(page),
    count: Array.isArray(items?.added) ? items.added.length : 0
  }));
  entries.sort((a, b) => b.count - a.count || a.page - b.page);
  return entries.slice(0, limit).map((entry) => entry.page);
}

function collectAddedItemsLegacy(blankItems, filledItems) {
  const added = [];
  const safeBlank = Array.isArray(blankItems) ? blankItems : [];
  const safeFilled = Array.isArray(filledItems) ? filledItems : [];

  for (const item of safeFilled) {
    const exists = safeBlank.some((entry) => isSameTokenAtPosition(entry, item));
    if (exists) {
      continue;
    }
    added.push(item);
  }

  return added.sort((a, b) => b.y - a.y || a.x - b.x);
}

async function main() {
  const root = path.resolve(__dirname, "..");
  const blankPath = process.argv[2] || path.join(root, "backend", "data", "uv-historias.pdf");
  const filledPath = process.argv[3] || path.join(process.env.USERPROFILE || "", "Downloads", "Tipos_de_historias_clinicas_para_cada_ar-1 (1).pdf");
  const outPath = process.argv[4] || path.join(root, "docs", "pdf-fill-map.json");

  if (!fs.existsSync(blankPath)) {
    throw new Error(`No existe PDF base: ${blankPath}`);
  }
  if (!fs.existsSync(filledPath)) {
    throw new Error(`No existe PDF llenado: ${filledPath}`);
  }

  const [blank, filled] = await Promise.all([loadPdfItems(blankPath), loadPdfItems(filledPath)]);
  const total = Math.min(blank.totalPages, filled.totalPages);
  const result = { source: { blankPath, filledPath }, pages: {} };

  for (let page = 1; page <= total; page += 1) {
    const added = collectAddedItems(blank.pages[page], filled.pages[page]);
    result.pages[page] = {
      added: summarizeInteresting(added),
      allFilledText: collectAllInteresting(filled.pages[page])
    };
  }

  const topPages = pickTopPagesByAddedCount(result.pages, 10);
  result.topPagesByAddedText = topPages;
  result.focus = {};
  for (const page of topPages) {
    result.focus[page] = result.pages[page];
  }

  const outDir = path.dirname(outPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), "utf8");

  // Resumen corto para terminal
  for (let page = 1; page <= total; page += 1) {
    const count = Array.isArray(result.pages[page]?.added) ? result.pages[page].added.length : 0;
    if (count > 0) {
      console.log(`Pagina ${page}: ${count} textos nuevos detectados`);
    }
  }
  console.log(`Mapa guardado en: ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
