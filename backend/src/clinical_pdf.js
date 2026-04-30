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

function toOptionalNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
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
  const hasSecondOrThird = Boolean(second || third);

  return {
    street: first,
    colony: second || first,
    municipality: second || first,
    delegation: second || first,
    state: third || "",
    city: hasSecondOrThird ? second : first
  };
}

function truncate(value, max) {
  const text = String(value || "").trim();
  if (!max || text.length <= max) {
    return text;
  }
  return `${text.slice(0, max - 1)}…`;
}

function normalizeNumericText(value, maxLength) {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }
  const digits = text.replace(/\D+/g, "");
  if (!digits) {
    return "";
  }
  return digits.slice(0, Math.max(1, Number(maxLength || digits.length)));
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
  const birthPlace = String(p.birthPlace || p.cityName || "").trim();
  const streetAddress = String(p.streetAddress || "").trim() || locationParts.street;
  const exteriorNumber = String(p.exteriorNumber || "").trim();
  const interiorNumber = String(p.interiorNumber || "").trim();
  const neighborhood = String(p.neighborhood || "").trim() || locationParts.colony;
  const municipality = String(p.municipality || "").trim() || locationParts.municipality;
  const delegation = String(p.delegation || "").trim() || locationParts.delegation;
  const stateName = String(p.stateName || "").trim() || locationParts.state;
  const cityName = String(p.cityName || "").trim() || locationParts.city;
  const officePhone = String(p.officePhone || p.clinicPhone || "").trim();
  const familyDoctorName = String(p.familyDoctorName || p.familyDoctor || "").trim();
  const familyDoctorPhone = String(p.familyDoctorPhone || p.doctorPhone || "").trim();
  const educationLevel = String(p.educationLevel || p.schooling || "").trim();
  const civilStatus = String(p.civilStatus || "").trim();
  const lastMedicalDate = parseDateParts(p.lastMedicalConsultDate || "");
  const lastMedicalReason = String(p.lastMedicalConsultReason || "").trim();

  const sexText = String(p.sex || "").toLowerCase();
  const isMale = sexText.includes("masc");
  const isFemale = sexText.includes("fem");

  const consultationReason = String(p.otherConditions || "").trim() || String(p.medications || "").trim();
  const background = [p.allergies, p.medications].map((x) => String(x || "").trim()).filter(Boolean).join(" | ");
  const clinicalContext = normalizeClinicalContext(clinicalContextInput);

  const rawAgeMonths = String(p.ageMonths || p.months || "").trim();
  const parsedAgeMonths = /^\d{1,2}$/.test(rawAgeMonths) ? Number(rawAgeMonths) : NaN;
  const ageMonths = Number.isFinite(parsedAgeMonths) && parsedAgeMonths >= 0 && parsedAgeMonths <= 11
    ? String(parsedAgeMonths)
    : "";

  const context = {
    formatId,
    fullName: name,
    firstNames: nameParts.firstNames,
    lastNameFather: nameParts.lastNameFather,
    lastNameMother: nameParts.lastNameMother,
    recordReference: String(p.clinicalRecordReference || "").trim(),
    ageText: String(p.age || "").trim(),
    ageYears: String(p.age || "").trim(),
    ageMonths,
    sexLabel: String(p.sex || "").trim(),
    isMale,
    isFemale,
    birthPlace,
    birthPlaceDate: [birthPlace, birthDate.label !== "-" ? birthDate.label : ""].filter(Boolean).join(" - "),
    birthDay: birthDate.day,
    birthMonth: birthDate.month,
    birthYear: birthDate.year,
    location: String(p.location || "").trim(),
    locationShort: cityName || stateName || String(p.location || "").trim(),
    locationStreet: streetAddress,
    locationExterior: exteriorNumber,
    locationInterior: interiorNumber,
    locationColony: neighborhood,
    locationMunicipality: municipality,
    locationDelegation: delegation,
    locationState: stateName,
    locationCity: cityName,
    occupation: String(p.occupation || "").trim(),
    occupationAlt: educationLevel,
    civilStatus,
    phone: String(p.phone || "").trim(),
    officePhone,
    doctorPhone: familyDoctorPhone,
    familyDoctorName,
    familyDoctorPhone,
    dentistName: String(p.dentistName || "").trim(),
    consultDateLabel: consultDate.label,
    consultDay: consultDate.day,
    consultMonth: consultDate.month,
    consultYear: consultDate.year,
    lastMedicalConsult: truncate(
      [
        lastMedicalDate.label !== "-" ? lastMedicalDate.label : "",
        lastMedicalReason
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

function getPdfMatchScore(itemNormInput, rule) {
  const itemNorm = normalizeText(itemNormInput);
  if (!itemNorm) {
    return 0;
  }

  const tokens = Array.isArray(rule?.matches) ? rule.matches : [];
  if (tokens.length === 0) {
    return 0;
  }

  let score = 0;
  let matchedCount = 0;
  for (const rawMatch of tokens) {
    const token = normalizeText(rawMatch);
    if (!token) {
      continue;
    }

    let localScore = 0;
    const tokenWords = token.split(" ").filter(Boolean);
    const genericSingleWord = tokenWords.length === 1 && token.length <= 8;

    if (rule.exact) {
      if (itemNorm === token) {
        localScore = 8 + Math.min(3, token.length * 0.08);
      }
    } else if (itemNorm === token) {
      localScore = 7 + Math.min(3, token.length * 0.08);
    } else if (itemNorm.startsWith(token)) {
      localScore = 6 + Math.min(2, token.length * 0.06);
    } else if (!genericSingleWord && itemNorm.includes(token)) {
      localScore = 5 + Math.min(2, token.length * 0.04);
    } else if (!genericSingleWord) {
      const overlappingWords = tokenWords.filter((word) => word.length > 2 && itemNorm.includes(word)).length;
      if (overlappingWords >= 2) {
        localScore = 3 + Math.min(2, overlappingWords * 0.5);
      }
    }

    if (localScore > 0) {
      matchedCount += 1;
      score += localScore;
    }
  }

  if (matchedCount === 0) {
    return 0;
  }
  const coverageBonus = (matchedCount / tokens.length) * 4;
  return score + coverageBonus;
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
      x: toOptionalNumber(entry?.x),
      y: toOptionalNumber(entry?.y),
      lockPosition: Boolean(entry?.lockPosition),
      align: ["left", "center", "right"].includes(String(entry?.align || "").toLowerCase())
        ? String(entry.align).toLowerCase()
        : "left",
      maxChars: Number.isFinite(Number(entry?.maxChars)) ? Number(entry.maxChars) : null
    });
  }

  return normalized;
}

function doRectsOverlap(a, b) {
  return !(
    a.right <= b.left ||
    b.right <= a.left ||
    a.top <= b.bottom ||
    b.top <= a.bottom
  );
}

function getRectOverlapArea(a, b) {
  const left = Math.max(a.left, b.left);
  const right = Math.min(a.right, b.right);
  const top = Math.min(a.top, b.top);
  const bottom = Math.max(a.bottom, b.bottom);
  if (right <= left || top <= bottom) {
    return 0;
  }
  return (right - left) * (top - bottom);
}

function sumRectOverlapArea(rect, others) {
  if (!rect || !Array.isArray(others) || others.length === 0) {
    return 0;
  }
  let area = 0;
  for (const other of others) {
    area += getRectOverlapArea(rect, other);
  }
  return area;
}

function createTemplateOccupiedRects(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  const rects = [];
  for (const item of items) {
    const raw = String(item?.raw || "").trim();
    if (!raw) {
      continue;
    }
    const x = Number(item?.x || 0);
    const y = Number(item?.y || 0);
    const w = Number(item?.w || 0);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || x < 10 || y < 10 || w <= 0.8) {
      continue;
    }
    rects.push({
      left: x - 1,
      right: x + w + 1,
      top: y + 7.2,
      bottom: y - 2.4
    });
  }
  return rects;
}

function createEntryTextMetrics(font, value, rule) {
  const size = Number(rule?.size || 7.4);
  const maxWidth = Number(rule?.maxWidth || 210);
  const maxLines = Math.max(1, Number(rule?.maxLines || 2));
  const maxChars = Number.isFinite(Number(rule?.maxChars)) ? Number(rule.maxChars) : 180;
  const lineHeight = Number(rule?.lineHeight || size + 1.1);
  const safeText = truncate(String(value || ""), maxChars);
  const lines = maxLines <= 1
    ? [shrinkTextToWidth(font, safeText, size, maxWidth)]
    : wrapText(font, safeText, size, maxWidth).slice(0, maxLines);

  const lineWidths = lines.map((line) => font.widthOfTextAtSize(line, size));
  const widestLine = lineWidths.reduce((max, width) => Math.max(max, width), 0);
  const effectiveWidth = Math.max(1, Math.min(maxWidth || widestLine || 1, widestLine || 1));

  return {
    lines,
    size,
    lineHeight,
    effectiveWidth
  };
}

function findBestAnchorPlacement(rule, items) {
  if (!rule || !Array.isArray(rule.matches) || rule.matches.length === 0 || !Array.isArray(items) || items.length === 0) {
    return null;
  }

  const scored = [];
  for (const item of items) {
    const score = getPdfMatchScore(item?.norm, rule);
    if (score <= 0) {
      continue;
    }
    const x = Number(item?.x || 0);
    const y = Number(item?.y || 0);
    const w = Number(item?.w || 0);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || x < 16 || y < 16) {
      continue;
    }
    scored.push({
      score,
      x: x + w + Number(rule?.dx || 0),
      y: y + Number(rule?.dy || 0)
    });
  }

  if (scored.length === 0) {
    return null;
  }
  scored.sort((a, b) => b.score - a.score || b.y - a.y || a.x - b.x);
  return scored[0];
}

function createTextRect(x, y, metrics) {
  return {
    left: x - 1,
    right: x + metrics.effectiveWidth + 2,
    top: y + metrics.size,
    bottom: y - ((metrics.lines.length - 1) * metrics.lineHeight) - (metrics.size * 0.28)
  };
}

function placeRuleWithoutOverlap(page, font, value, rule, occupiedRects, templateRects, items) {
  const x = Number(rule?.x || 0);
  const baseY = Number(rule?.y || 0);
  if (!Number.isFinite(x) || !Number.isFinite(baseY) || x < 20 || baseY < 20) {
    return false;
  }

  const metrics = createEntryTextMetrics(font, value, rule);
  if (!Array.isArray(metrics.lines) || metrics.lines.length === 0) {
    return false;
  }

  if (rule?.lockPosition) {
    let drawX = x;
    let drawY = baseY;
    let chosenRect = createTextRect(drawX, drawY, metrics);
    const fixedOverlap = sumRectOverlapArea(chosenRect, templateRects);

    const anchor = findBestAnchorPlacement(rule, items);
    if (anchor && Number.isFinite(anchor.x) && Number.isFinite(anchor.y)) {
      const anchoredRect = createTextRect(anchor.x, anchor.y, metrics);
      const anchorOverlap = sumRectOverlapArea(anchoredRect, templateRects);
      const farFromAnchor = Math.abs(anchor.x - x) + Math.abs(anchor.y - baseY) > 90;
      if (anchorOverlap + 10 < fixedOverlap || (farFromAnchor && anchorOverlap <= fixedOverlap + 1)) {
        drawX = anchor.x;
        drawY = anchor.y;
        chosenRect = anchoredRect;
      }
    }

    drawTextAt(page, font, value, {
      ...rule,
      x: drawX,
      y: drawY,
      lineHeight: metrics.lineHeight
    });
    occupiedRects.push(chosenRect);
    return true;
  }

  const pageTopLimit = Math.max(30, page.getHeight() - 24);
  const pageBottomLimit = 24;
  const attempts = [0, 1, 2, 3, 4, 5, 6, -1, -2, -3, -4];
  const collisionRects = Array.isArray(templateRects) && templateRects.length > 0
    ? [...templateRects, ...occupiedRects]
    : [...occupiedRects];
  let chosenY = null;
  let chosenRect = null;
  let minOverlap = Number.POSITIVE_INFINITY;

  for (const delta of attempts) {
    const candidateY = baseY - (delta * metrics.lineHeight);
    const top = candidateY + metrics.size;
    const bottom = candidateY - ((metrics.lines.length - 1) * metrics.lineHeight) - (metrics.size * 0.28);
    if (top > pageTopLimit || bottom < pageBottomLimit) {
      continue;
    }
    const rect = createTextRect(x, candidateY, metrics);
    let overlapArea = 0;
    for (const other of collisionRects) {
      overlapArea += getRectOverlapArea(rect, other);
    }
    if (overlapArea < minOverlap) {
      minOverlap = overlapArea;
      chosenY = candidateY;
      chosenRect = rect;
      if (overlapArea <= 0.0001) {
        break;
      }
    }
  }

  if (!chosenRect || !Number.isFinite(chosenY)) {
    if (!Number.isFinite(baseY)) {
      return false;
    }
    chosenY = baseY;
    chosenRect = createTextRect(x, baseY, metrics);
  }

  if (minOverlap > 2400) {
    const fallbackY = baseY - (metrics.lineHeight * 3);
    const top = fallbackY + metrics.size;
    const bottom = fallbackY - ((metrics.lines.length - 1) * metrics.lineHeight) - (metrics.size * 0.28);
    if (top <= pageTopLimit && bottom >= pageBottomLimit) {
      chosenY = fallbackY;
      chosenRect = createTextRect(x, fallbackY, metrics);
    }
  }

  drawTextAt(page, font, value, {
    ...rule,
    x,
    y: chosenY,
    lineHeight: metrics.lineHeight
  });
  occupiedRects.push(chosenRect);
  return true;
}

function resolveEntryCoordinates(entry, items) {
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
    x: toOptionalNumber(entry?.x),
    y: toOptionalNumber(entry?.y),
    lockPosition: Boolean(entry?.lockPosition),
    align: ["left", "center", "right"].includes(String(entry?.align || "").toLowerCase())
      ? String(entry.align).toLowerCase()
      : "left",
    maxChars: Number.isFinite(Number(entry?.maxChars)) ? Number(entry.maxChars) : null
  };

  if (rule.x !== null && rule.y !== null) {
    return [{
      ...rule,
      lockPosition: rule.lockPosition || (rule.x !== null && rule.y !== null)
    }];
  }
  if (!Array.isArray(rule.matches) || rule.matches.length === 0) {
    return [];
  }

  const safeItems = Array.isArray(items) ? items : [];
  const candidates = [];
  for (const item of safeItems) {
    const score = getPdfMatchScore(item.norm, rule);
    if (score <= 0) {
      continue;
    }
    const x = Number(item.x || 0);
    const y = Number(item.y || 0);
    const w = Number(item.w || 0);
    if (x < 20 || y < 20) {
      continue;
    }
    const resolvedX = x + w + rule.dx;
    const resolvedY = y + rule.dy;
    if (!Number.isFinite(resolvedX) || !Number.isFinite(resolvedY)) {
      continue;
    }
    candidates.push({
      score,
      x: resolvedX,
      y: resolvedY,
      anchorKey: `${Math.round(x)}:${Math.round(y)}`
    });
  }

  candidates.sort((a, b) => b.score - a.score || b.y - a.y || a.x - b.x);
  if (candidates.length === 0) {
    return [];
  }

  const usedAnchorKeys = new Set();
  const resolvedRules = [];
  for (const candidate of candidates) {
    if (usedAnchorKeys.has(candidate.anchorKey)) {
      continue;
    }
    usedAnchorKeys.add(candidate.anchorKey);
    resolvedRules.push({
      ...rule,
      x: candidate.x,
      y: candidate.y
    });
    if (resolvedRules.length >= rule.maxPerPage) {
      break;
    }
  }
  return resolvedRules;
}

function drawFillEntriesOnPage(page, font, items, entries, pageOffset, renderedEntryIds) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return;
  }
  const rendered = renderedEntryIds instanceof Set ? renderedEntryIds : new Set();
  const occupiedRects = [];
  const templateRects = createTemplateOccupiedRects(items);

  for (const entry of entries) {
    const entryId = String(entry?.id || "").trim();
    if (entryId && rendered.has(entryId)) {
      continue;
    }
    const entryPageOffset = Number.isFinite(Number(entry?.pageOffset)) ? Number(entry.pageOffset) : null;
    if (entryPageOffset !== null && entryPageOffset !== pageOffset) {
      continue;
    }
    const value = String(entry?.value || "").trim();
    if (!value) {
      continue;
    }

    const resolvedRules = resolveEntryCoordinates(entry, items);
    let hitCount = 0;
    for (const resolvedRule of resolvedRules) {
      const drawn = placeRuleWithoutOverlap(page, font, value, resolvedRule, occupiedRects, templateRects, items);
      if (drawn) {
        hitCount += 1;
      }
    }
    if (hitCount > 0 && entryId) {
      rendered.add(entryId);
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
  const ageValue = normalizeNumericText(context.ageYears || context.ageText, 3);
  const monthsValue = normalizeNumericText(context.ageMonths, 2);
  const birthPlace = String(context.birthPlace || context.locationCity || context.locationShort || "").trim();
  const consultLabel = String(context.consultDateLabel || "").trim();
  const lastConsult = String(context.lastMedicalConsult || "").trim();
  const consultDay = normalizeNumericText(context.consultDay, 2);
  const consultMonth = normalizeNumericText(context.consultMonth, 2);
  const consultYear = normalizeNumericText(context.consultYear, 4);
  const locationState = String(context.locationState || "").trim();
  const locationCity = String(context.locationCity || "").trim();
  const officePhone = String(context.officePhone || "").trim();
  const familyDoctorName = String(context.familyDoctorName || "").trim();
  const familyDoctorPhone = String(context.familyDoctorPhone || "").trim();
  const locationExterior = String(context.locationExterior || "").trim();
  const locationInterior = String(context.locationInterior || "").trim();

  drawTextAt(page, font, context.fullName, { x: 126, y: 397.2, maxWidth: 280, size: 8.2, maxLines: 1, maxChars: 82 });
  drawTextAt(page, font, context.lastNameFather, { x: 186, y: 386.1, maxWidth: 78, size: 8.2, maxLines: 1, maxChars: 28 });
  drawTextAt(page, font, context.lastNameMother, { x: 287, y: 386.1, maxWidth: 86, size: 8.2, maxLines: 1, maxChars: 30 });
  drawTextAt(page, font, context.firstNames, { x: 375, y: 386.1, maxWidth: 172, size: 8.2, maxLines: 1, maxChars: 42 });

  drawTextAt(page, font, ageValue, { x: 441, y: 397.2, maxWidth: 22, size: 8.2, align: "center", maxLines: 1, maxChars: 3 });
  drawTextAt(page, font, monthsValue, { x: 521, y: 397.2, maxWidth: 22, size: 8.2, align: "center", maxLines: 1, maxChars: 2 });

  drawMark(page, font, context.isMale, 250.5, 364.2, 10);
  drawMark(page, font, context.isFemale, 377.5, 364.2, 10);

  drawTextAt(page, font, birthPlace, { x: 197, y: 349.3, maxWidth: 104, size: 8, maxLines: 1, maxChars: 18 });
  drawTextAt(page, font, context.birthDay, { x: 440, y: 338.2, maxWidth: 20, size: 8, align: "center", maxLines: 1, maxChars: 2 });
  drawTextAt(page, font, context.birthMonth, { x: 476, y: 338.2, maxWidth: 20, size: 8, align: "center", maxLines: 1, maxChars: 2 });
  drawTextAt(page, font, context.birthYear, { x: 513, y: 338.2, maxWidth: 34, size: 8, align: "center", maxLines: 1, maxChars: 4 });
  if (locationState && locationState !== birthPlace) {
    drawTextAt(page, font, locationState, { x: 264, y: 338.2, maxWidth: 56, size: 8, maxLines: 1, maxChars: 14 });
  }
  if (locationCity && locationCity !== birthPlace) {
    drawTextAt(page, font, locationCity, { x: 357, y: 338.2, maxWidth: 62, size: 8, maxLines: 1, maxChars: 18 });
  }

  drawTextAt(page, font, context.occupation, { x: 130, y: 317.2, maxWidth: 134, size: 8.2, maxLines: 1, maxChars: 32 });
  drawTextAt(page, font, context.occupationAlt, { x: 354, y: 317.2, maxWidth: 195, size: 8.2, maxLines: 1, maxChars: 42 });
  drawTextAt(page, font, context.civilStatus, { x: 131, y: 301.2, maxWidth: 120, size: 8.2, maxLines: 1, maxChars: 24 });
  drawTextAt(page, font, context.locationStreet, { x: 292, y: 301.2, maxWidth: 232, size: 8.2, maxLines: 1, maxChars: 52 });

  drawTextAt(page, font, locationExterior, { x: 122, y: 285.2, maxWidth: 98, size: 8.2, maxLines: 1, maxChars: 18 });
  drawTextAt(page, font, locationInterior, { x: 285, y: 285.2, maxWidth: 98, size: 8.2, maxLines: 1, maxChars: 18 });
  drawTextAt(page, font, context.locationColony, { x: 392, y: 285.2, maxWidth: 132, size: 8.2, maxLines: 1, maxChars: 28 });
  drawTextAt(page, font, locationState || context.locationState, { x: 122, y: 269.2, maxWidth: 112, size: 8.2, maxLines: 1, maxChars: 20 });
  drawTextAt(page, font, context.locationMunicipality, { x: 236, y: 269.2, maxWidth: 108, size: 8.2, maxLines: 1, maxChars: 20 });
  drawTextAt(page, font, context.locationDelegation, { x: 429, y: 269.2, maxWidth: 92, size: 8.2, maxLines: 1, maxChars: 18 });

  drawTextAt(page, font, context.phone, { x: 120, y: 253.2, maxWidth: 82, size: 8.2, maxLines: 1, maxChars: 14 });
  drawTextAt(page, font, officePhone, { x: 305, y: 253.2, maxWidth: 82, size: 8.2, maxLines: 1, maxChars: 14 });
  drawTextAt(page, font, familyDoctorName, { x: 246, y: 237.2, maxWidth: 175, size: 8.2, maxLines: 1, maxChars: 36 });
  drawTextAt(page, font, familyDoctorPhone, { x: 470, y: 237.2, maxWidth: 78, size: 8.2, maxLines: 1, maxChars: 14 });
  drawTextAt(page, font, lastConsult || consultLabel, { x: 304, y: 221.2, maxWidth: 228, size: 8.2, maxLines: 1, maxChars: 58 });

  drawTextAt(page, font, consultDay, { x: 487.2, y: 451.1, maxWidth: 12, size: 7.1, align: "center", maxLines: 1, maxChars: 2 });
  drawTextAt(page, font, consultMonth, { x: 512.4, y: 451.1, maxWidth: 12, size: 7.1, align: "center", maxLines: 1, maxChars: 2 });
  drawTextAt(page, font, consultYear, { x: 538.8, y: 451.1, maxWidth: 18, size: 7.1, align: "center", maxLines: 1, maxChars: 4 });
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
  const renderedEntryIds = new Set();

  copiedPages.forEach((targetPage, idx) => {
    const sourcePageNo = sourcePageNumbers[idx];
    const items = textData.pages[sourcePageNo] || [];
    const isIdentificationPage = sourcePageNo === selected.start;
    const pageOffset = sourcePageNo - selected.start;

    if (isIdentificationPage && IDENTIFICATION_LAYOUT_FORMATS.has(selected.formatId)) {
      drawIdentificationBlock(targetPage, regularFont, context);
    }
    drawFillEntriesOnPage(targetPage, regularFont, items, clinicalFillEntries, pageOffset, renderedEntryIds);
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
