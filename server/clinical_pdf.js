"use strict";

const fs = require("fs");
const path = require("path");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

const FORMAT_START_PAGES = {
  "f1-estomatologica": 1,
  "f2-preventiva": 13,
  "f3-operatoria": 17,
  "f4-protesis-fija": 21,
  "f5-protesis-removible": 23,
  "f6-prostodoncia": 25,
  "f7-cirugia-bucal": 27,
  "f8-periodoncia": 31,
  "f9-endodoncia": 37,
  "f10-ortodoncia": 41,
  "f11-odontopediatria": 53
};

const FORMAT_ORDER = Object.keys(FORMAT_START_PAGES);

const LABEL_RULES = [
  { matches: ["apellido paterno"], value: "lastNameFather" },
  { matches: ["apellido materno"], value: "lastNameMother" },
  { matches: ["nombre(s)"], value: "firstNames" },
  { matches: ["nombre del paciente"], value: "fullName", maxPerPage: 2 },
  { matches: ["nombre completo"], value: "fullName", maxPerPage: 2 },
  { matches: ["folio"], value: "recordReference", maxPerPage: 2, maxWidth: 180 },
  { matches: ["referencia"], value: "recordReference", maxPerPage: 2, maxWidth: 180 },
  { matches: ["paciente"], value: "fullName", exact: true, maxPerPage: 1, dx: 28 },
  { matches: ["edad"], value: "ageText", exact: true, maxPerPage: 2 },
  { matches: ["anos"], value: "ageYears", exact: true, maxPerPage: 2 },
  { matches: ["meses"], value: "ageMonths", exact: true, maxPerPage: 2 },
  { matches: ["genero"], value: "sexLabel", exact: true, maxPerPage: 2 },
  { matches: ["sexo"], value: "sexLabel", exact: true, maxPerPage: 2 },
  { matches: ["masculino"], mark: (ctx) => ctx.isMale, exact: true, dx: -10, dy: 1, size: 10, maxPerPage: 1 },
  { matches: ["femenino"], mark: (ctx) => ctx.isFemale, exact: true, dx: -10, dy: 1, size: 10, maxPerPage: 1 },
  { matches: ["lugar y fecha de nacimiento"], value: "birthPlaceDate", maxWidth: 230, maxLines: 2 },
  { matches: ["(estado)"], value: "locationShort", maxPerPage: 1 },
  { matches: ["(ciudad)"], value: "locationShort", maxPerPage: 1 },
  { matches: ["ocupacion"], value: "occupation", maxPerPage: 2 },
  { matches: ["escolaridad"], value: "occupationAlt", maxPerPage: 1 },
  { matches: ["estado civil"], value: "civilStatus", maxPerPage: 1 },
  { matches: ["domicilio: calle"], value: "location", maxWidth: 220, maxLines: 2 },
  { matches: ["direccion"], value: "location", maxWidth: 220, maxLines: 2 },
  { matches: ["domicilio"], value: "location", maxPerPage: 1, maxWidth: 220, maxLines: 2 },
  { matches: ["colonia"], value: "locationShort", maxPerPage: 1 },
  { matches: ["estado"], value: "locationShort", exact: true, maxPerPage: 1 },
  { matches: ["mpio"], value: "locationShort", maxPerPage: 1 },
  { matches: ["delegacion"], value: "locationShort", maxPerPage: 1 },
  { matches: ["telefono de oficina"], value: "phone", maxPerPage: 1 },
  { matches: ["telefono"], value: "phone", maxPerPage: 2 },
  { matches: ["fecha"], value: "consultDateLabel", maxPerPage: 2 },
  { matches: ["dia"], value: "consultDay", exact: true, maxPerPage: 2 },
  { matches: ["mes"], value: "consultMonth", exact: true, maxPerPage: 2 },
  { matches: ["ano"], value: "consultYear", exact: true, maxPerPage: 2 },
  { matches: ["nombre del medico familiar"], value: "dentistName", maxPerPage: 1, maxWidth: 200 },
  { matches: ["nombre del solicitante"], value: "dentistName", maxPerPage: 1, maxWidth: 200 },
  { matches: ["nombre de doctor"], value: "dentistName", maxPerPage: 1, maxWidth: 200 },
  { matches: ["diagnostico"], value: "diagnosis", maxWidth: 235, maxLines: 3, maxPerPage: 2 },
  { matches: ["pronostico"], value: "prognosis", maxWidth: 220, maxLines: 2, maxPerPage: 1 },
  { matches: ["plan de tratamiento"], value: "treatmentPlan", maxWidth: 240, maxLines: 3, maxPerPage: 2 },
  { matches: ["motivo de consulta"], value: "consultReason", maxWidth: 220, maxLines: 3, maxPerPage: 1 },
  { matches: ["padecimiento actual"], value: "consultReason", maxWidth: 220, maxLines: 3, maxPerPage: 1 },
  { matches: ["medicamentos"], value: "medications", maxWidth: 210, maxLines: 2, maxPerPage: 1 },
  { matches: ["alergias"], value: "allergies", maxWidth: 210, maxLines: 2, maxPerPage: 2 },
  { matches: ["antecedentes"], value: "background", maxWidth: 230, maxLines: 3, maxPerPage: 2 },
  { matches: ["observaciones"], value: "notes", maxWidth: 230, maxLines: 3, maxPerPage: 2 },
  { matches: ["odontograma"], value: "odontoSummary", maxWidth: 230, maxLines: 2, maxPerPage: 1 }
];

let pdfjsImportPromise = null;
const textCacheByTemplate = new Map();

function getPdfjs() {
  if (!pdfjsImportPromise) {
    pdfjsImportPromise = import("pdfjs-dist/legacy/build/pdf.mjs");
  }
  return pdfjsImportPromise;
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

function parseDateParts(value) {
  const text = String(value || "").trim();
  if (!text) {
    return { day: "", month: "", year: "", label: "-" };
  }

  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const day = iso[3];
    const month = iso[2];
    const year = iso[1];
    return { day, month, year, label: `${day}/${month}/${year}` };
  }

  const latin = text.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/);
  if (latin) {
    const day = latin[1].padStart(2, "0");
    const month = latin[2].padStart(2, "0");
    const year = latin[3];
    return { day, month, year, label: `${day}/${month}/${year}` };
  }

  return { day: "", month: "", year: "", label: text };
}

function splitPatientName(fullName) {
  const words = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return { firstNames: "", lastNameFather: "", lastNameMother: "" };
  }
  if (words.length === 1) {
    return { firstNames: words[0], lastNameFather: "", lastNameMother: "" };
  }
  if (words.length === 2) {
    return { firstNames: words[0], lastNameFather: words[1], lastNameMother: "" };
  }
  return {
    firstNames: words.slice(0, -2).join(" "),
    lastNameFather: words[words.length - 2],
    lastNameMother: words[words.length - 1]
  };
}

function truncate(value, max) {
  const text = String(value || "").trim();
  if (!max || text.length <= max) {
    return text;
  }
  return `${text.slice(0, max - 1)}…`;
}

function summarizeList(items, maxItems) {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  if (list.length === 0) {
    return "";
  }
  const shown = list.slice(0, maxItems || list.length);
  const suffix = list.length > shown.length ? ` (+${list.length - shown.length})` : "";
  return `${shown.join(", ")}${suffix}`;
}

function summarizeOdontogram(patient, statusMap) {
  const marks = [];
  const teeth = patient?.odontogram?.teeth || {};
  const zones = patient?.odontogram?.zones || {};

  for (const key of Object.keys(teeth)) {
    const statuses = Array.isArray(teeth[key]) ? teeth[key] : [];
    const names = statuses.map((id) => statusMap.get(id) || id).filter(Boolean);
    if (names.length > 0) {
      marks.push(`Pieza ${key}: ${names.join("/")}`);
    }
  }
  for (const key of Object.keys(zones)) {
    const statuses = Array.isArray(zones[key]) ? zones[key] : [];
    const names = statuses.map((id) => statusMap.get(id) || id).filter(Boolean);
    if (names.length > 0) {
      marks.push(`Zona ${key}: ${names.join("/")}`);
    }
  }

  return summarizeList(marks, 4);
}

function summarizeNotes(patient) {
  const entries = Array.isArray(patient?.historyEntries) ? patient.historyEntries : [];
  const texts = entries
    .filter((entry) => String(entry?.type || "") === "clinical-note")
    .slice(0, 3)
    .map((entry) => {
      const t = String(entry?.title || "").trim();
      const d = String(entry?.description || "").trim();
      return [t, d].filter(Boolean).join(": ");
    })
    .filter(Boolean);
  return summarizeList(texts, 3);
}

function normalizeClinicalContext(rawContext) {
  const source = rawContext && typeof rawContext === "object" ? rawContext : {};
  const byKey = source.byKey && typeof source.byKey === "object" ? source.byKey : {};
  const details = Array.isArray(source.details) ? source.details : [];
  const normalizedByKey = {};

  for (const [key, value] of Object.entries(byKey)) {
    const clean = String(value || "").trim();
    if (!clean) {
      continue;
    }
    normalizedByKey[key] = clean;
  }

  return {
    byKey: normalizedByKey,
    details: details.map((value) => String(value || "").trim()).filter(Boolean)
  };
}

function buildContext(patient, dictionaries, formatId, clinicalContextInput) {
  const p = patient && typeof patient === "object" ? patient : {};
  const name = String(p.name || "").trim();
  const nameParts = splitPatientName(name);
  const consultDate = parseDateParts(p.consultationDate || p.nextConsultationDate || "");
  const birthDate = parseDateParts(p.birthDate || "");

  const diseaseMap = new Map((dictionaries?.diseases || []).map((item) => [item.id, item.name]));
  const statusMap = new Map((dictionaries?.toothStatuses || []).map((item) => [item.id, item.name]));

  const diseaseNames = (Array.isArray(p.diseaseIds) ? p.diseaseIds : [])
    .map((id) => diseaseMap.get(id) || "")
    .filter(Boolean);
  const diseaseSummary = summarizeList(diseaseNames, 6);
  const odontoSummary = summarizeOdontogram(p, statusMap);
  const notes = summarizeNotes(p);

  const sexText = String(p.sex || "").toLowerCase();
  const isMale = sexText.includes("masc");
  const isFemale = sexText.includes("fem");

  const consultationReason = String(p.otherConditions || "").trim() || String(p.medications || "").trim();
  const background = [p.allergies, p.medications].map((x) => String(x || "").trim()).filter(Boolean).join(" | ");
  const clinicalContext = normalizeClinicalContext(clinicalContextInput);

  const context = {
    formatId,
    fullName: name,
    firstNames: nameParts.firstNames,
    lastNameFather: nameParts.lastNameFather,
    lastNameMother: nameParts.lastNameMother,
    recordReference: String(p.clinicalRecordReference || "").trim(),
    ageText: String(p.age || "").trim(),
    ageYears: String(p.age || "").trim(),
    ageMonths: "",
    sexLabel: String(p.sex || "").trim(),
    isMale,
    isFemale,
    birthPlaceDate: [String(p.location || "").trim(), birthDate.label !== "-" ? birthDate.label : ""].filter(Boolean).join(" - "),
    location: String(p.location || "").trim(),
    locationShort: String(p.location || "").trim(),
    occupation: String(p.occupation || "").trim(),
    occupationAlt: String(p.occupation || "").trim(),
    civilStatus: "No especificado",
    phone: String(p.phone || "").trim(),
    dentistName: String(p.dentistName || "").trim(),
    consultDateLabel: consultDate.label,
    consultDay: consultDate.day,
    consultMonth: consultDate.month,
    consultYear: consultDate.year,
    diagnosis: truncate(diseaseSummary || "Sin patologias generales registradas", 180),
    prognosis: truncate(String(p.otherConditions || "").trim() || "Reservado", 120),
    treatmentPlan: truncate(
      [String(p.treatmentStart || "").trim() ? `Inicio: ${p.treatmentStart}` : "", String(p.otherConditions || "").trim()]
        .filter(Boolean)
        .join(" | ") || "Segun valoracion clinica.",
      180
    ),
    consultReason: truncate(consultationReason || "Control clinico", 170),
    medications: truncate(String(p.medications || "").trim(), 170),
    allergies: truncate(String(p.allergies || "").trim(), 170),
    background: truncate(background || "Sin antecedentes relevantes.", 180),
    notes: truncate(notes || "Sin observaciones clinicas adicionales.", 170),
    odontoSummary: truncate(odontoSummary || "Sin marcas registradas.", 170)
  };

  const maxByKey = {
    consultReason: 170,
    diagnosis: 180,
    treatmentPlan: 180,
    prognosis: 120,
    medications: 170,
    allergies: 170,
    background: 180,
    notes: 170,
    odontoSummary: 170
  };

  for (const [key, value] of Object.entries(clinicalContext.byKey)) {
    const max = maxByKey[key] || 180;
    context[key] = truncate(value, max);
  }

  if (clinicalContext.details.length > 0) {
    const detailsText = truncate(clinicalContext.details.join(" | "), 260);
    context.notes = truncate(context.notes ? `${context.notes} | ${detailsText}` : detailsText, 170);
  }

  return context;
}

function resolveFormatRange(formatId, totalPages) {
  const id = FORMAT_START_PAGES[formatId] ? formatId : FORMAT_ORDER[0];
  const start = FORMAT_START_PAGES[id];
  const currentIdx = FORMAT_ORDER.indexOf(id);
  const nextId = FORMAT_ORDER[currentIdx + 1];
  const end = nextId ? FORMAT_START_PAGES[nextId] - 1 : totalPages;
  return { formatId: id, start, end };
}

function matchItemWithRule(itemNorm, rule) {
  for (const rawMatch of rule.matches || []) {
    const token = normalizeText(rawMatch);
    if (!token) {
      continue;
    }
    if (rule.exact) {
      if (itemNorm === token) {
        return true;
      }
    } else if (itemNorm.includes(token)) {
      return true;
    }
  }
  return false;
}

function wrapText(font, text, size, maxWidth) {
  if (!maxWidth) {
    return [text];
  }
  const words = String(text || "").split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [];
  }

  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    const width = font.widthOfTextAtSize(candidate, size);
    if (width <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines;
}

function drawRuleValue(page, font, value, item, rule) {
  const pageWidth = page.getWidth();
  const size = rule.size || 7.4;
  let x = (item.x || 0) + (item.w || 0) + (rule.dx || 6);
  const y = (item.y || 0) + (rule.dy || -1);

  const maxWidth = rule.maxWidth || 190;
  if (x > pageWidth - 40) {
    x = Math.max(40, pageWidth - (maxWidth + 16));
  }

  const lines = wrapText(font, String(value || ""), size, rule.maxWidth || 0);
  const maxLines = rule.maxLines || 2;
  const lineHeight = rule.lineHeight || size + 1.1;

  if (!rule.maxWidth) {
    page.drawText(lines[0] || "", { x, y, size, font, color: rgb(0, 0, 0) });
    return;
  }

  const visibleLines = lines.slice(0, maxLines);
  visibleLines.forEach((line, idx) => {
    page.drawText(line, {
      x,
      y: y - idx * lineHeight,
      size,
      font,
      color: rgb(0, 0, 0)
    });
  });
}

async function getTemplateTextData(templatePath) {
  const stats = fs.statSync(templatePath);
  const cacheKey = `${templatePath}:${stats.mtimeMs}`;
  if (textCacheByTemplate.has(cacheKey)) {
    return textCacheByTemplate.get(cacheKey);
  }

  const data = new Uint8Array(fs.readFileSync(templatePath));
  const pdfjsLib = await getPdfjs();
  const doc = await pdfjsLib.getDocument({ data, useSystemFonts: true }).promise;

  const pages = {};
  for (let pageNo = 1; pageNo <= doc.numPages; pageNo += 1) {
    const page = await doc.getPage(pageNo);
    const textContent = await page.getTextContent();
    pages[pageNo] = textContent.items
      .map((item) => {
        const raw = String(item?.str || "").trim();
        if (!raw) {
          return null;
        }
        return {
          raw,
          norm: normalizeText(raw),
          x: Number(item.transform?.[4] || 0),
          y: Number(item.transform?.[5] || 0),
          w: Number(item.width || 0)
        };
      })
      .filter(Boolean);
  }

  const result = { totalPages: doc.numPages, pages };
  textCacheByTemplate.clear();
  textCacheByTemplate.set(cacheKey, result);
  return result;
}

function sanitizeFileName(value) {
  return String(value || "paciente")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70) || "paciente";
}

async function generateClinicalPdf(options) {
  const templatePath = path.resolve(options?.templatePath || "");
  if (!templatePath || !fs.existsSync(templatePath)) {
    throw new Error("Plantilla PDF oficial no encontrada en el servidor.");
  }

  const [textData, templateBytes] = await Promise.all([
    getTemplateTextData(templatePath),
    fs.promises.readFile(templatePath)
  ]);

  const selected = resolveFormatRange(options?.formatId, textData.totalPages);
  const patient = options?.patient && typeof options.patient === "object" ? options.patient : {};
  const dictionaries = options?.dictionaries && typeof options.dictionaries === "object" ? options.dictionaries : {};
  const context = buildContext(patient, dictionaries, selected.formatId, options?.clinicalContext);

  const sourcePdf = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
  const targetPdf = await PDFDocument.create();
  const sourcePageNumbers = [];
  for (let p = selected.start; p <= selected.end; p += 1) {
    sourcePageNumbers.push(p);
  }

  const copiedPages = await targetPdf.copyPages(sourcePdf, sourcePageNumbers.map((p) => p - 1));
  copiedPages.forEach((page) => targetPdf.addPage(page));

  const regularFont = await targetPdf.embedFont(StandardFonts.Helvetica);
  const rules = LABEL_RULES;

  copiedPages.forEach((targetPage, idx) => {
    const sourcePageNo = sourcePageNumbers[idx];
    const items = textData.pages[sourcePageNo] || [];

    for (const rule of rules) {
      const rawValue = rule.mark ? Boolean(rule.mark(context)) : context[rule.value];
      const value = rule.mark ? (rawValue ? "X" : "") : String(rawValue || "").trim();
      if (!value) {
        continue;
      }

      let hitCount = 0;
      const maxPerPage = rule.maxPerPage || 1;
      for (const item of items) {
        if (!matchItemWithRule(item.norm, rule)) {
          continue;
        }
        drawRuleValue(targetPage, regularFont, value, item, rule);
        hitCount += 1;
        if (hitCount >= maxPerPage) {
          break;
        }
      }
    }
  });

  const pdfBytes = await targetPdf.save();
  const fileName = `${sanitizeFileName(context.fullName)}-${selected.formatId}.pdf`;

  return {
    pdfBytes,
    fileName,
    selected
  };
}

module.exports = {
  generateClinicalPdf
};
