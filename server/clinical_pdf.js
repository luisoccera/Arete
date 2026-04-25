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

const CLINICAL_IDENTIFICATION_KEYS = new Set([
  "fullName",
  "firstNames",
  "lastNameFather",
  "lastNameMother",
  "ageText",
  "ageYears",
  "ageMonths",
  "sexLabel",
  "birthPlaceDate",
  "birthDay",
  "birthMonth",
  "birthYear",
  "location",
  "locationShort",
  "locationStreet",
  "locationColony",
  "locationMunicipality",
  "locationDelegation",
  "locationState",
  "locationCity",
  "occupation",
  "occupationAlt",
  "civilStatus",
  "phone",
  "doctorPhone",
  "dentistName",
  "consultDateLabel",
  "consultDay",
  "consultMonth",
  "consultYear",
  "lastMedicalConsult"
]);

const IDENTIFICATION_LAYOUT_FORMATS = new Set([
  "f1-estomatologica",
  "f11-odontopediatria"
]);

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

function parseClinicalLocationParts(locationInput) {
  const text = String(locationInput || "").trim();
  if (!text) {
    return {
      street: "",
      colony: "",
      municipality: "",
      delegation: "",
      state: "",
      city: ""
    };
  }

  const tokens = text
    .split(/[,;|/]+/)
    .map((token) => token.trim())
    .filter(Boolean);

  const first = tokens[0] || text;
  const second = tokens[1] || "";
  const third = tokens[2] || "";

  return {
    street: first,
    colony: second,
    municipality: second,
    delegation: second,
    state: third,
    city: second
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
  let explicitFirstNames = String(p.name || "").trim();
  let explicitLastNameFather = String(p.lastNameFather || p.surnameFather || p.apellidoPaterno || "").trim();
  let explicitLastNameMother = String(p.lastNameMother || p.surnameMother || p.apellidoMaterno || "").trim();
  if (!explicitLastNameFather && !explicitLastNameMother && explicitFirstNames) {
    const inferred = splitPatientName(explicitFirstNames);
    if (inferred.lastNameFather || inferred.lastNameMother) {
      explicitFirstNames = inferred.firstNames || explicitFirstNames;
      explicitLastNameFather = inferred.lastNameFather;
      explicitLastNameMother = inferred.lastNameMother;
    }
  }
  const fullName = [explicitFirstNames, explicitLastNameFather, explicitLastNameMother]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  const name = fullName || explicitFirstNames;
  const fallbackParts = splitPatientName(name);
  const nameParts = {
    firstNames: explicitFirstNames || fallbackParts.firstNames,
    lastNameFather: explicitLastNameFather || fallbackParts.lastNameFather,
    lastNameMother: explicitLastNameMother || fallbackParts.lastNameMother
  };
  const consultDate = parseDateParts(p.consultationDate || p.nextConsultationDate || "");
  const birthDate = parseDateParts(p.birthDate || "");
  const locationParts = parseClinicalLocationParts(p.location);

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
    birthDay: birthDate.day,
    birthMonth: birthDate.month,
    birthYear: birthDate.year,
    location: String(p.location || "").trim(),
    locationShort: String(p.location || "").trim(),
    locationStreet: locationParts.street,
    locationColony: locationParts.colony,
    locationMunicipality: locationParts.municipality,
    locationDelegation: locationParts.delegation,
    locationState: locationParts.state,
    locationCity: locationParts.city,
    occupation: String(p.occupation || "").trim(),
    occupationAlt: String(p.occupation || "").trim(),
    civilStatus: "No especificado",
    phone: String(p.phone || "").trim(),
    doctorPhone: String(p.phone || "").trim(),
    dentistName: String(p.dentistName || "").trim(),
    consultDateLabel: consultDate.label,
    consultDay: consultDate.day,
    consultMonth: consultDate.month,
    consultYear: consultDate.year,
    lastMedicalConsult: truncate(
      [
        consultDate.label !== "-" ? consultDate.label : "",
        String(consultationReason || "").trim()
      ]
        .filter(Boolean)
        .join(" - "),
      180
    ),
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

function normalizeFillEntries(rawEntries) {
  if (!Array.isArray(rawEntries)) {
    return [];
  }

  const normalized = [];
  for (const entry of rawEntries) {
    const value = String(entry?.value || "").trim();
    if (!value) {
      continue;
    }
    const matchesRaw = Array.isArray(entry?.matches)
      ? entry.matches
      : (entry?.match ? [entry.match] : []);
    const matches = matchesRaw.map((token) => String(token || "").trim()).filter(Boolean);
    if (matches.length === 0) {
      continue;
    }

    normalized.push({
      id: String(entry?.id || "").trim() || `pdf-entry-${normalized.length + 1}`,
      value,
      matches,
      exact: Boolean(entry?.exact),
      maxPerPage: Math.max(1, Number(entry?.maxPerPage || 1)),
      maxWidth: Number(entry?.maxWidth || 210),
      maxLines: Math.max(1, Number(entry?.maxLines || 2)),
      pageOffset: Number.isFinite(Number(entry?.pageOffset)) ? Number(entry.pageOffset) : null,
      dx: Number.isFinite(Number(entry?.dx)) ? Number(entry.dx) : 6,
      dy: Number.isFinite(Number(entry?.dy)) ? Number(entry.dy) : -1,
      size: Number.isFinite(Number(entry?.size)) ? Number(entry.size) : 7.4,
      lineHeight: Number.isFinite(Number(entry?.lineHeight)) ? Number(entry.lineHeight) : null,
      x: Number.isFinite(Number(entry?.x)) ? Number(entry.x) : null,
      y: Number.isFinite(Number(entry?.y)) ? Number(entry.y) : null,
      align: ["left", "center", "right"].includes(String(entry?.align || "").toLowerCase())
        ? String(entry.align).toLowerCase()
        : "left",
      maxChars: Number.isFinite(Number(entry?.maxChars)) ? Number(entry.maxChars) : null
    });
  }

  return normalized;
}

function drawFillEntriesOnPage(page, font, items, entries, pageOffset) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return;
  }
  const safeItems = Array.isArray(items) ? items : [];
  const usedAnchors = new Set();

  for (const entry of entries) {
    const entryPageOffset = Number.isFinite(Number(entry?.pageOffset)) ? Number(entry.pageOffset) : null;
    if (entryPageOffset !== null && entryPageOffset !== pageOffset) {
      continue;
    }
    const value = String(entry?.value || "").trim();
    if (!value) {
      continue;
    }

    const rule = {
      matches: Array.isArray(entry?.matches) ? entry.matches : [],
      exact: Boolean(entry?.exact),
      maxPerPage: Math.max(1, Number(entry?.maxPerPage || 1)),
      maxWidth: Number(entry?.maxWidth || 210),
      maxLines: Math.max(1, Number(entry?.maxLines || 2)),
      dx: Number.isFinite(Number(entry?.dx)) ? Number(entry.dx) : 6,
      dy: Number.isFinite(Number(entry?.dy)) ? Number(entry.dy) : -1,
      size: Number.isFinite(Number(entry?.size)) ? Number(entry.size) : 7.4,
      lineHeight: Number.isFinite(Number(entry?.lineHeight)) ? Number(entry.lineHeight) : null,
      x: Number.isFinite(Number(entry?.x)) ? Number(entry.x) : null,
      y: Number.isFinite(Number(entry?.y)) ? Number(entry.y) : null,
      align: ["left", "center", "right"].includes(String(entry?.align || "").toLowerCase())
        ? String(entry.align).toLowerCase()
        : "left",
      maxChars: Number.isFinite(Number(entry?.maxChars)) ? Number(entry.maxChars) : null
    };

    if (rule.x !== null && rule.y !== null) {
      drawTextAt(page, font, value, {
        x: rule.x,
        y: rule.y,
        maxWidth: rule.maxWidth,
        maxLines: rule.maxLines,
        size: rule.size,
        lineHeight: rule.lineHeight || undefined,
        align: rule.align,
        maxChars: rule.maxChars || undefined
      });
      continue;
    }

    if (rule.matches.length === 0) {
      continue;
    }

    let hitCount = 0;
    for (const item of safeItems) {
      if (!matchItemWithRule(item.norm, rule)) {
        continue;
      }
      const anchorKey = `${Math.round(Number(item.x || 0))}:${Math.round(Number(item.y || 0))}`;
      if (usedAnchors.has(anchorKey)) {
        continue;
      }
      drawRuleValue(page, font, value, item, rule);
      usedAnchors.add(anchorKey);
      hitCount += 1;
      if (hitCount >= rule.maxPerPage) {
        break;
      }
    }
  }
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

function shrinkTextToWidth(font, text, size, maxWidth) {
  const raw = String(text || "").trim();
  if (!raw || !maxWidth) {
    return raw;
  }
  if (font.widthOfTextAtSize(raw, size) <= maxWidth) {
    return raw;
  }

  let base = raw;
  while (base.length > 1 && font.widthOfTextAtSize(`${base}…`, size) > maxWidth) {
    base = base.slice(0, -1).trimEnd();
  }
  return `${base || raw.slice(0, 1)}…`;
}

function drawTextAt(page, font, value, opts) {
  const raw = String(value || "").trim();
  if (!raw) {
    return;
  }

  const size = Number(opts?.size || 8);
  const maxWidth = Number(opts?.maxWidth || 120);
  const maxLines = Number(opts?.maxLines || 1);
  const lineHeight = Number(opts?.lineHeight || size + 1.1);
  const align = String(opts?.align || "left");
  const x = Number(opts?.x || 0);
  const y = Number(opts?.y || 0);
  const safeText = truncate(raw, Number(opts?.maxChars || 180));

  const lines = maxLines <= 1
    ? [shrinkTextToWidth(font, safeText, size, maxWidth)]
    : wrapText(font, safeText, size, maxWidth).slice(0, maxLines);

  lines.forEach((line, idx) => {
    let drawX = x;
    const width = font.widthOfTextAtSize(line, size);
    if (align === "center") {
      drawX = x + Math.max(0, (maxWidth - width) / 2);
    } else if (align === "right") {
      drawX = x + Math.max(0, maxWidth - width);
    }
    page.drawText(line, {
      x: drawX,
      y: y - idx * lineHeight,
      size,
      font,
      color: rgb(0, 0, 0)
    });
  });
}

function drawMark(page, font, enabled, x, y, size) {
  if (!enabled) {
    return;
  }
  page.drawText("X", {
    x,
    y,
    size: size || 10,
    font,
    color: rgb(0, 0, 0)
  });
}

function shouldSkipRuleOnIdentificationPage(rule) {
  if (!rule) {
    return false;
  }
  if (rule.mark) {
    return true;
  }
  return CLINICAL_IDENTIFICATION_KEYS.has(String(rule.value || ""));
}

function drawIdentificationBlock(page, font, context) {
  const ageValue = String(context.ageYears || context.ageText || "").trim();
  const monthsValue = String(context.ageMonths || "").trim();
  const birthPlace = String(context.locationShort || context.location || "").trim();
  const consultLabel = String(context.consultDateLabel || "").trim();
  const lastConsult = String(context.lastMedicalConsult || "").trim();

  drawTextAt(page, font, context.fullName, { x: 126, y: 397.2, maxWidth: 280, size: 8.2, maxLines: 1, maxChars: 82 });
  drawTextAt(page, font, context.lastNameFather, { x: 186, y: 386.1, maxWidth: 78, size: 8.2, maxLines: 1, maxChars: 28 });
  drawTextAt(page, font, context.lastNameMother, { x: 287, y: 386.1, maxWidth: 86, size: 8.2, maxLines: 1, maxChars: 30 });
  drawTextAt(page, font, context.firstNames, { x: 375, y: 386.1, maxWidth: 172, size: 8.2, maxLines: 1, maxChars: 42 });

  drawTextAt(page, font, ageValue, { x: 447, y: 397.2, maxWidth: 30, size: 8.4, align: "center", maxLines: 1, maxChars: 5 });
  drawTextAt(page, font, monthsValue, { x: 538, y: 397.2, maxWidth: 32, size: 8.4, align: "center", maxLines: 1, maxChars: 4 });

  drawMark(page, font, context.isMale, 250.5, 364.2, 10);
  drawMark(page, font, context.isFemale, 377.5, 364.2, 10);

  drawTextAt(page, font, birthPlace, { x: 197, y: 349.3, maxWidth: 138, size: 8, maxLines: 1, maxChars: 32 });
  drawTextAt(page, font, context.birthDay, { x: 440, y: 338.2, maxWidth: 20, size: 8, align: "center", maxLines: 1, maxChars: 2 });
  drawTextAt(page, font, context.birthMonth, { x: 476, y: 338.2, maxWidth: 20, size: 8, align: "center", maxLines: 1, maxChars: 2 });
  drawTextAt(page, font, context.birthYear, { x: 513, y: 338.2, maxWidth: 34, size: 8, align: "center", maxLines: 1, maxChars: 4 });
  drawTextAt(page, font, context.locationState, { x: 264, y: 338.2, maxWidth: 56, size: 8, maxLines: 1, maxChars: 20 });
  drawTextAt(page, font, context.locationCity, { x: 357, y: 338.2, maxWidth: 62, size: 8, maxLines: 1, maxChars: 22 });

  drawTextAt(page, font, context.occupation, { x: 130, y: 317.2, maxWidth: 134, size: 8.2, maxLines: 1, maxChars: 32 });
  drawTextAt(page, font, context.occupationAlt, { x: 354, y: 317.2, maxWidth: 195, size: 8.2, maxLines: 1, maxChars: 42 });
  drawTextAt(page, font, context.civilStatus, { x: 131, y: 301.2, maxWidth: 120, size: 8.2, maxLines: 1, maxChars: 24 });
  drawTextAt(page, font, context.locationStreet, { x: 292, y: 301.2, maxWidth: 255, size: 8.2, maxLines: 1, maxChars: 68 });

  drawTextAt(page, font, context.locationColony, { x: 392, y: 285.2, maxWidth: 156, size: 8.2, maxLines: 1, maxChars: 34 });
  drawTextAt(page, font, context.locationState, { x: 122, y: 269.2, maxWidth: 130, size: 8.2, maxLines: 1, maxChars: 28 });
  drawTextAt(page, font, context.locationMunicipality, { x: 236, y: 269.2, maxWidth: 112, size: 8.2, maxLines: 1, maxChars: 24 });
  drawTextAt(page, font, context.locationDelegation, { x: 429, y: 269.2, maxWidth: 120, size: 8.2, maxLines: 1, maxChars: 24 });

  drawTextAt(page, font, context.phone, { x: 120, y: 253.2, maxWidth: 82, size: 8.2, maxLines: 1, maxChars: 14 });
  drawTextAt(page, font, context.phone, { x: 305, y: 253.2, maxWidth: 82, size: 8.2, maxLines: 1, maxChars: 14 });
  drawTextAt(page, font, context.dentistName, { x: 246, y: 237.2, maxWidth: 175, size: 8.2, maxLines: 1, maxChars: 36 });
  drawTextAt(page, font, context.doctorPhone || context.phone, { x: 470, y: 237.2, maxWidth: 78, size: 8.2, maxLines: 1, maxChars: 14 });
  drawTextAt(page, font, lastConsult || consultLabel, { x: 304, y: 221.2, maxWidth: 243, size: 8.2, maxLines: 1, maxChars: 78 });

  drawTextAt(page, font, context.consultDay, { x: 486, y: 451.8, maxWidth: 16, size: 8.4, align: "center", maxLines: 1, maxChars: 2 });
  drawTextAt(page, font, context.consultMonth, { x: 511, y: 451.8, maxWidth: 16, size: 8.4, align: "center", maxLines: 1, maxChars: 2 });
  drawTextAt(page, font, context.consultYear, { x: 538, y: 451.8, maxWidth: 30, size: 8.4, align: "center", maxLines: 1, maxChars: 4 });
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
  const clinicalFillEntries = normalizeFillEntries(options?.clinicalFillEntries);

  const sourcePdf = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
  const targetPdf = await PDFDocument.create();
  const sourcePageNumbers = [];
  for (let p = selected.start; p <= selected.end; p += 1) {
    sourcePageNumbers.push(p);
  }

  const copiedPages = await targetPdf.copyPages(sourcePdf, sourcePageNumbers.map((p) => p - 1));
  copiedPages.forEach((page) => targetPdf.addPage(page));

  const regularFont = await targetPdf.embedFont(StandardFonts.Helvetica);

  copiedPages.forEach((targetPage, idx) => {
    const sourcePageNo = sourcePageNumbers[idx];
    const items = textData.pages[sourcePageNo] || [];
    const isIdentificationPage = sourcePageNo === selected.start;
    const pageOffset = sourcePageNo - selected.start;

    if (isIdentificationPage && IDENTIFICATION_LAYOUT_FORMATS.has(selected.formatId)) {
      drawIdentificationBlock(targetPage, regularFont, context);
    }
    drawFillEntriesOnPage(targetPage, regularFont, items, clinicalFillEntries, pageOffset);
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
