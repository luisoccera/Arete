"use strict";

const STORAGE_KEY = "arete_data_v1";
const DENTITION_LAYOUTS = {
  adult: {
    label: "Denticion adulta",
    upper: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
    lower: [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]
  },
  child: {
    label: "Denticion infantil",
    upper: [55, 54, 53, 52, 51, 61, 62, 63, 64, 65],
    lower: [85, 84, 83, 82, 81, 71, 72, 73, 74, 75]
  }
};

const ODONTO_ZONES = [
  { id: "maxilar-superior", name: "Maxilar superior" },
  { id: "mandibula-inferior", name: "Mandibula inferior" },
  { id: "hemiarco-derecho", name: "Hemiarco derecho" },
  { id: "hemiarco-izquierdo", name: "Hemiarco izquierdo" },
  { id: "encias", name: "Encias" },
  { id: "paladar", name: "Paladar" }
];

const TOOTH_PATHS = {
  incisor: "M12 15 C12 8 17 4 24 4 C31 4 36 8 36 15 L34 34 C33 41 29 46 24 46 C19 46 15 41 14 34 Z",
  canine: "M24 3 L31 8 C34 10 36 14 36 19 L34 34 C33 41 29 46 24 46 C19 46 15 41 14 34 L12 19 C12 14 14 10 17 8 Z",
  premolar: "M10 16 C10 9 15 4 22 4 L26 4 C33 4 38 9 38 16 L36 34 C35 41 30 46 24 46 C18 46 13 41 12 34 Z",
  molar: "M8 18 C8 10 14 4 22 4 L26 4 C34 4 40 10 40 18 L38 34 C37 41 31 46 24 46 C17 46 11 41 10 34 Z"
};

const DEFAULT_DISEASES = [
  { id: "dis-hipertension", name: "Hipertension", color: "#f59e0b" },
  { id: "dis-diabetes", name: "Diabetes", color: "#ef4444" },
  { id: "dis-cardiaca", name: "Enfermedad cardiaca", color: "#0ea5e9" },
  { id: "dis-embarazo", name: "Embarazo", color: "#22c55e" }
];

const DEFAULT_TOOTH_STATUSES = [
  { id: "st-caries", name: "Caries", color: "#ef4444" },
  { id: "st-fractura", name: "Fractura", color: "#f97316" },
  { id: "st-resina", name: "Resina", color: "#22d3ee" },
  { id: "st-ausente", name: "Ausente", color: "#94a3b8" },
  { id: "st-sano", name: "Sano", color: "#10b981" }
];

const el = {
  newPatientBtn: document.getElementById("newPatientBtn"),
  exportBtn: document.getElementById("exportBtn"),
  importFile: document.getElementById("importFile"),
  searchInput: document.getElementById("searchInput"),
  savePatientBtn: document.getElementById("savePatientBtn"),
  formTitle: document.getElementById("formTitle"),
  patientForm: document.getElementById("patientForm"),
  patientRows: document.getElementById("patientRows"),
  diseaseChecklist: document.getElementById("diseaseChecklist"),
  newDiseaseName: document.getElementById("newDiseaseName"),
  newDiseaseColor: document.getElementById("newDiseaseColor"),
  addDiseaseBtn: document.getElementById("addDiseaseBtn"),
  diseaseCatalog: document.getElementById("diseaseCatalog"),
  upperJawArc: document.getElementById("upperJawArc"),
  lowerJawArc: document.getElementById("lowerJawArc"),
  zoneList: document.getElementById("zoneList"),
  dentitionLabel: document.getElementById("dentitionLabel"),
  dentitionSwitchButtons: Array.from(document.querySelectorAll("[data-dentition]")),
  clearOdontogramBtn: document.getElementById("clearOdontogramBtn"),
  toothStatusSelect: document.getElementById("toothStatusSelect"),
  statusLegend: document.getElementById("statusLegend"),
  newStatusName: document.getElementById("newStatusName"),
  newStatusColor: document.getElementById("newStatusColor"),
  addStatusBtn: document.getElementById("addStatusBtn"),
  feedbackMessage: document.getElementById("feedbackMessage"),
  patientName: document.getElementById("patientName"),
  patientAge: document.getElementById("patientAge"),
  patientSex: document.getElementById("patientSex"),
  patientLocation: document.getElementById("patientLocation"),
  birthDate: document.getElementById("birthDate"),
  phone: document.getElementById("phone"),
  occupation: document.getElementById("occupation"),
  medications: document.getElementById("medications"),
  dentistName: document.getElementById("dentistName"),
  allergies: document.getElementById("allergies"),
  consultationDate: document.getElementById("consultationDate"),
  treatmentStart: document.getElementById("treatmentStart"),
  brushTimes: document.getElementById("brushTimes"),
  flossHabit: document.getElementById("flossHabit"),
  hasCaries: document.getElementById("hasCaries"),
  otherConditions: document.getElementById("otherConditions")
};

let state = loadState();
let draftPatient = createEmptyPatient();
let editingPatientId = null;
let selectedStatusId = "none";

init();

function init() {
  bindEvents();
  renderAll();
  startNewPatient(false);
}

function bindEvents() {
  el.newPatientBtn.addEventListener("click", () => startNewPatient(true));
  el.savePatientBtn.addEventListener("click", savePatient);
  el.exportBtn.addEventListener("click", exportData);
  el.importFile.addEventListener("change", importData);
  el.searchInput.addEventListener("input", renderPatientTable);
  el.addDiseaseBtn.addEventListener("click", addDisease);
  el.addStatusBtn.addEventListener("click", addToothStatus);
  el.clearOdontogramBtn.addEventListener("click", clearDraftOdontogram);

  el.toothStatusSelect.addEventListener("change", () => {
    selectedStatusId = el.toothStatusSelect.value || "none";
    setFeedback(
      selectedStatusId === "none"
        ? "Modo limpiar activo: al hacer clic se borran todos los colores de la pieza."
        : "Estado activo actualizado. Haz clic en dientes o zonas para agregar/quitar color."
    );
  });

  el.patientForm.addEventListener("submit", (event) => {
    event.preventDefault();
    savePatient();
  });

  el.patientForm.addEventListener("input", () => {
    syncDraftFromForm();
  });

  el.diseaseChecklist.addEventListener("change", () => {
    syncDraftFromForm();
  });

  el.birthDate.addEventListener("change", () => {
    if (!el.birthDate.value) {
      return;
    }
    const age = calculateAgeFromDate(el.birthDate.value);
    if (!Number.isNaN(age) && age >= 0) {
      el.patientAge.value = String(age);
      syncDraftFromForm();
    }
  });

  el.patientRows.addEventListener("click", (event) => {
    const openBtn = event.target.closest("[data-open-id]");
    if (openBtn) {
      openPatient(openBtn.getAttribute("data-open-id"));
      return;
    }

    const deleteBtn = event.target.closest("[data-delete-id]");
    if (deleteBtn) {
      deletePatient(deleteBtn.getAttribute("data-delete-id"));
    }
  });

  el.diseaseCatalog.addEventListener("click", (event) => {
    const removeBtn = event.target.closest("[data-remove-disease-id]");
    if (removeBtn) {
      removeDisease(removeBtn.getAttribute("data-remove-disease-id"));
    }
  });

  el.statusLegend.addEventListener("click", (event) => {
    const removeBtn = event.target.closest("[data-remove-status-id]");
    if (removeBtn) {
      removeToothStatus(removeBtn.getAttribute("data-remove-status-id"));
    }
  });

  el.zoneList.addEventListener("click", (event) => {
    const zoneBtn = event.target.closest("[data-zone-id]");
    if (!zoneBtn) {
      return;
    }
    applyOdontoMark("zones", zoneBtn.getAttribute("data-zone-id"));
  });

  el.upperJawArc.addEventListener("click", (event) => {
    handleToothNodeClick(event);
  });

  el.lowerJawArc.addEventListener("click", (event) => {
    handleToothNodeClick(event);
  });

  for (const button of el.dentitionSwitchButtons) {
    button.addEventListener("click", () => {
      const mode = button.getAttribute("data-dentition");
      if (!isValidDentitionMode(mode) || draftPatient.odontogramMode === mode) {
        return;
      }
      draftPatient.odontogramMode = mode;
      renderDentitionSwitch();
      renderOdontogram();
      setFeedback(`Visualizando ${DENTITION_LAYOUTS[mode].label.toLowerCase()}.`);
    });
  }
}

function handleToothNodeClick(event) {
  const toothBtn = event.target.closest("[data-tooth-id]");
  if (!toothBtn) {
    return;
  }
  applyOdontoMark("teeth", toothBtn.getAttribute("data-tooth-id"));
}

function createBaseState() {
  return {
    diseases: deepClone(DEFAULT_DISEASES),
    toothStatuses: deepClone(DEFAULT_TOOTH_STATUSES),
    patients: []
  };
}

function createEmptyPatient() {
  return {
    id: null,
    name: "",
    age: "",
    sex: "",
    location: "",
    birthDate: "",
    phone: "",
    occupation: "",
    medications: "",
    dentistName: "",
    allergies: "",
    consultationDate: "",
    treatmentStart: "",
    brushTimes: "",
    flossHabit: "",
    hasCaries: "",
    otherConditions: "",
    diseaseIds: [],
    odontogramMode: "adult",
    odontogram: {
      teeth: {},
      zones: {}
    },
    createdAt: "",
    updatedAt: ""
  };
}

function normalizeState(raw) {
  const base = createBaseState();
  const diseases = normalizeCatalog(raw?.diseases, "dis", "#d97706", base.diseases);
  const toothStatuses = normalizeCatalog(raw?.toothStatuses, "st", "#ef4444", base.toothStatuses);
  const patients = Array.isArray(raw?.patients) ? raw.patients.map(normalizePatient) : [];

  return {
    diseases,
    toothStatuses,
    patients
  };
}

function normalizeCatalog(items, prefix, fallbackColor, fallbackItems) {
  if (!Array.isArray(items) || items.length === 0) {
    return deepClone(fallbackItems);
  }

  const seen = new Set();
  const normalized = [];

  for (const item of items) {
    const name = typeof item?.name === "string" ? item.name.trim() : "";
    if (!name) {
      continue;
    }

    const key = name.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    normalized.push({
      id: typeof item.id === "string" && item.id.trim() ? item.id : generateId(prefix),
      name,
      color: sanitizeColor(item.color, fallbackColor)
    });
  }

  return normalized.length > 0 ? normalized : deepClone(fallbackItems);
}

function normalizePatient(rawPatient) {
  const empty = createEmptyPatient();
  const patient = {
    ...empty,
    ...rawPatient
  };

  patient.name = stringOrEmpty(patient.name);
  patient.sex = stringOrEmpty(patient.sex);
  patient.location = stringOrEmpty(patient.location);
  patient.birthDate = stringOrEmpty(patient.birthDate);
  patient.phone = stringOrEmpty(patient.phone);
  patient.occupation = stringOrEmpty(patient.occupation);
  patient.medications = stringOrEmpty(patient.medications);
  patient.dentistName = stringOrEmpty(patient.dentistName);
  patient.allergies = stringOrEmpty(patient.allergies);
  patient.consultationDate = stringOrEmpty(patient.consultationDate);
  patient.treatmentStart = stringOrEmpty(patient.treatmentStart);
  patient.flossHabit = stringOrEmpty(patient.flossHabit);
  patient.hasCaries = stringOrEmpty(patient.hasCaries);
  patient.otherConditions = stringOrEmpty(patient.otherConditions);
  patient.createdAt = stringOrEmpty(patient.createdAt);
  patient.updatedAt = stringOrEmpty(patient.updatedAt);
  patient.age = numberOrEmpty(patient.age);
  patient.brushTimes = numberOrEmpty(patient.brushTimes);

  if (!patient.id || typeof patient.id !== "string") {
    patient.id = generateId("pt");
  }

  patient.diseaseIds = Array.isArray(patient.diseaseIds)
    ? patient.diseaseIds.filter((id) => typeof id === "string")
    : [];

  patient.odontogramMode = isValidDentitionMode(patient.odontogramMode) ? patient.odontogramMode : "adult";

  patient.odontogram = {
    teeth: normalizeMarks(patient.odontogram?.teeth),
    zones: normalizeMarks(patient.odontogram?.zones)
  };

  return patient;
}

function normalizeMarks(rawMarks) {
  if (!rawMarks || typeof rawMarks !== "object") {
    return {};
  }

  const marks = {};
  for (const [key, value] of Object.entries(rawMarks)) {
    const list = normalizeMarkList(value);
    if (list.length > 0) {
      marks[String(key)] = list;
    }
  }
  return marks;
}

function normalizeMarkList(value) {
  if (typeof value === "string") {
    const v = value.trim();
    return v ? [v] : [];
  }

  if (!Array.isArray(value)) {
    return [];
  }

  const out = [];
  const seen = new Set();
  for (const item of value) {
    if (typeof item !== "string") {
      continue;
    }
    const v = item.trim();
    if (!v || seen.has(v)) {
      continue;
    }
    seen.add(v);
    out.push(v);
  }
  return out;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createBaseState();
    }
    return normalizeState(JSON.parse(raw));
  } catch (error) {
    console.error("No se pudo cargar datos:", error);
    return createBaseState();
  }
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function renderAll() {
  renderStatusSelect();
  renderDentitionSwitch();
  renderDiseaseChecklist();
  renderDiseaseCatalog();
  renderStatusCatalog();
  renderOdontogram();
  renderPatientTable();
  setFormTitle();
}

function renderPatientTable() {
  const query = el.searchInput.value.trim().toLowerCase();
  const patients = state.patients
    .filter((patient) => {
      if (!query) {
        return true;
      }
      const diseaseNames = patient.diseaseIds
        .map((id) => getDiseaseById(id)?.name || "")
        .join(" ");
      const haystack = [
        patient.name,
        patient.phone,
        patient.location,
        patient.dentistName,
        diseaseNames
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    })
    .sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));

  if (patients.length === 0) {
    el.patientRows.innerHTML = "<tr><td colspan=\"5\">No hay pacientes para mostrar.</td></tr>";
    return;
  }

  const rowsHtml = patients
    .map((patient) => {
      const diseaseBoxes = patient.diseaseIds
        .map((id) => {
          const disease = getDiseaseById(id);
          if (!disease) {
            return "";
          }
          return `<span class="color-box" style="background:${disease.color}" title="${escapeHtml(disease.name)}"></span>`;
        })
        .join("");

      return `
        <tr class="${patient.id === editingPatientId ? "active" : ""}">
          <td>
            <div class="patient-name-cell">
              <strong>${escapeHtml(patient.name || "Sin nombre")}</strong>
              <div class="color-boxes">${diseaseBoxes || "<span class=\"patient-meta\">Sin enfermedades seleccionadas</span>"}</div>
              <span class="patient-meta">${escapeHtml(patient.location || "Sin ubicacion")}</span>
            </div>
          </td>
          <td>${formatDate(patient.consultationDate)}</td>
          <td>${escapeHtml(patient.dentistName || "-")}</td>
          <td>${escapeHtml(patient.phone || "-")}</td>
          <td>
            <div class="table-actions">
              <button type="button" class="table-btn" data-open-id="${patient.id}">Abrir</button>
              <button type="button" class="table-btn warn" data-delete-id="${patient.id}">Eliminar</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  el.patientRows.innerHTML = rowsHtml;
}

function renderDiseaseChecklist() {
  if (state.diseases.length === 0) {
    el.diseaseChecklist.innerHTML = "<p>No hay enfermedades creadas.</p>";
    return;
  }

  const selected = new Set(draftPatient.diseaseIds || []);
  el.diseaseChecklist.innerHTML = state.diseases
    .map((disease) => {
      const isChecked = selected.has(disease.id) ? "checked" : "";
      return `
        <label class="tag-label">
          <input type="checkbox" value="${disease.id}" ${isChecked}>
          <span class="tag-color" style="background:${disease.color}"></span>
          <span>${escapeHtml(disease.name)}</span>
        </label>
      `;
    })
    .join("");
}

function renderDiseaseCatalog() {
  if (state.diseases.length === 0) {
    el.diseaseCatalog.innerHTML = "";
    return;
  }

  el.diseaseCatalog.innerHTML = state.diseases
    .map(
      (disease) => `
        <div class="catalog-item">
          <span class="catalog-name">
            <span class="tag-color" style="background:${disease.color}"></span>
            ${escapeHtml(disease.name)}
          </span>
          <button type="button" class="catalog-btn" data-remove-disease-id="${disease.id}">Quitar</button>
        </div>
      `
    )
    .join("");
}

function renderStatusSelect() {
  const previous = selectedStatusId;
  const options = [
    "<option value=\"none\">Limpiar pieza / zona</option>",
    ...state.toothStatuses.map((status) => `<option value="${status.id}">${escapeHtml(status.name)}</option>`)
  ];

  el.toothStatusSelect.innerHTML = options.join("");
  const exists = previous === "none" || state.toothStatuses.some((status) => status.id === previous);
  selectedStatusId = exists ? previous : "none";
  el.toothStatusSelect.value = selectedStatusId;
}

function renderStatusCatalog() {
  if (state.toothStatuses.length === 0) {
    el.statusLegend.innerHTML = "";
    return;
  }

  el.statusLegend.innerHTML = state.toothStatuses
    .map(
      (status) => `
        <div class="catalog-item">
          <span class="catalog-name">
            <span class="tag-color" style="background:${status.color}"></span>
            ${escapeHtml(status.name)}
          </span>
          <button type="button" class="catalog-btn" data-remove-status-id="${status.id}">Quitar</button>
        </div>
      `
    )
    .join("");
}

function renderDentitionSwitch() {
  for (const button of el.dentitionSwitchButtons) {
    const mode = button.getAttribute("data-dentition");
    button.classList.toggle("is-active", mode === draftPatient.odontogramMode);
  }
}

function renderOdontogram() {
  const mode = getCurrentDentitionMode();
  const layout = DENTITION_LAYOUTS[mode];
  el.dentitionLabel.textContent = layout.label;

  renderJawArc(el.upperJawArc, layout.upper, "upper", mode);
  renderJawArc(el.lowerJawArc, layout.lower, "lower", mode);

  el.zoneList.innerHTML = ODONTO_ZONES.map((zone) => {
    const statusIds = getMarkIds("zones", zone.id);
    const colors = statusIds
      .map((statusId) => getStatusById(statusId)?.color)
      .filter(Boolean);

    const colorStyle = buildMultiColorBackground(colors);
    const label = statusIds.length > 0
      ? statusIds.map((id) => getStatusById(id)?.name).filter(Boolean).join(", ")
      : "sin marca";

    return `
      <button type="button" class="zone-btn" data-zone-id="${zone.id}" style="--mark-color:${colorStyle}" title="${escapeHtml(zone.name)}: ${escapeHtml(label)}">
        <span>${escapeHtml(zone.name)}</span>
      </button>
    `;
  }).join("");
}

function renderJawArc(container, toothNumbers, arcPosition, mode) {
  const total = toothNumbers.length;
  const isAdult = mode === "adult";
  const centerX = 380;
  const centerY = isAdult ? 230 : 236;
  const radiusX = isAdult ? 292 : 248;
  const radiusY = isAdult ? 170 : 145;

  const startDeg = arcPosition === "upper" ? 200 : 160;
  const endDeg = arcPosition === "upper" ? 340 : 20;

  const pieces = toothNumbers.map((toothNumber, index) => {
    const t = total === 1 ? 0.5 : index / (total - 1);
    const degrees = startDeg + (endDeg - startDeg) * t;
    const radians = degrees * (Math.PI / 180);

    const x = centerX + radiusX * Math.cos(radians);
    const y = centerY + radiusY * Math.sin(radians);

    const toothId = String(toothNumber);
    const statusIds = getMarkIds("teeth", toothId);
    const statusColors = statusIds
      .map((statusId) => getStatusById(statusId)?.color)
      .filter(Boolean);
    const previewIds = statusIds.slice(0, 24);
    const overflowCount = Math.max(0, statusIds.length - previewIds.length);
    const shapeType = getToothShapeType(toothNumber, mode);
    const dims = getToothDimensions(shapeType, mode);
    const gradientId = `grad-${mode}-${arcPosition}-${toothId}`;
    const fillConfig = buildToothFill(statusColors, gradientId);

    const chips = previewIds
      .map((statusId) => {
        const status = getStatusById(statusId);
        if (!status) {
          return "";
        }
        return `<span class="tooth-color-chip" style="background:${status.color}" title="${escapeHtml(status.name)}"></span>`;
      })
      .join("");

    const titleText = statusIds.length > 0
      ? statusIds.map((id) => getStatusById(id)?.name).filter(Boolean).join(", ")
      : "Sin marcas";

    return `
      <button
        type="button"
        class="tooth-node ${mode === "child" ? "child" : ""} shape-${shapeType} ${statusIds.length > 0 ? "has-marks" : ""}"
        data-tooth-id="${toothId}"
        title="Diente ${toothId}: ${escapeHtml(titleText)}"
        style="left:${Math.round(x - dims.width / 2)}px; top:${Math.round(y - dims.height / 2)}px; --tooth-w:${dims.width}px; --tooth-h:${dims.height}px;"
      >
        <span class="tooth-art" aria-hidden="true">
          <svg viewBox="0 0 48 52" class="tooth-svg">
            ${fillConfig.defs}
            <path class="tooth-fill-shape" d="${TOOTH_PATHS[shapeType]}" fill="${fillConfig.fill}"></path>
            <path class="tooth-outline-shape" d="${TOOTH_PATHS[shapeType]}"></path>
          </svg>
        </span>
        <span class="tooth-id">${toothId}</span>
        <span class="tooth-kind">${escapeHtml(getToothKindLabel(toothNumber, mode))}</span>
        <span class="tooth-color-grid">${chips}</span>
        ${overflowCount > 0 ? `<span class="tooth-more">+${overflowCount}</span>` : ""}
      </button>
    `;
  });

  container.innerHTML = pieces.join("");
}

function buildToothFill(colors, gradientId) {
  if (!Array.isArray(colors) || colors.length === 0) {
    return { defs: "", fill: "#f8fafc" };
  }

  if (colors.length === 1) {
    return { defs: "", fill: colors[0] };
  }

  const step = 100 / colors.length;
  const stops = colors
    .map((color, index) => {
      const start = (index * step).toFixed(2);
      const end = ((index + 1) * step).toFixed(2);
      return `<stop offset="${start}%" stop-color="${color}"></stop><stop offset="${end}%" stop-color="${color}"></stop>`;
    })
    .join("");

  const defs = `<defs><linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="0%">${stops}</linearGradient></defs>`;
  return { defs, fill: `url(#${gradientId})` };
}

function applyOdontoMark(bucket, key) {
  ensureDraftOdontogram();

  const current = getMarkIds(bucket, key);

  if (selectedStatusId === "none") {
    if (current.length === 0) {
      setFeedback("La pieza ya estaba limpia.");
      return;
    }
    delete draftPatient.odontogram[bucket][key];
    setFeedback(`Se limpiaron todas las marcas de ${bucket === "teeth" ? "la pieza" : "la zona"}.`);
    renderOdontogram();
    return;
  }

  const statusName = getStatusById(selectedStatusId)?.name || "estado";
  const next = current.slice();
  const existingIndex = next.indexOf(selectedStatusId);

  if (existingIndex >= 0) {
    next.splice(existingIndex, 1);
    if (next.length === 0) {
      delete draftPatient.odontogram[bucket][key];
    } else {
      draftPatient.odontogram[bucket][key] = next;
    }
    setFeedback(`Estado ${statusName} removido de ${bucket === "teeth" ? "la pieza" : "la zona"}.`);
  } else {
    next.push(selectedStatusId);
    draftPatient.odontogram[bucket][key] = next;
    setFeedback(`Estado ${statusName} agregado. Esta pieza ya puede tener multiples colores en filas.`);
  }

  renderOdontogram();
}

function ensureDraftOdontogram() {
  if (!draftPatient.odontogram || typeof draftPatient.odontogram !== "object") {
    draftPatient.odontogram = { teeth: {}, zones: {} };
  }
  draftPatient.odontogram.teeth = normalizeMarks(draftPatient.odontogram.teeth);
  draftPatient.odontogram.zones = normalizeMarks(draftPatient.odontogram.zones);
}

function getMarkIds(bucket, key) {
  const marks = draftPatient.odontogram?.[bucket];
  if (!marks || typeof marks !== "object") {
    return [];
  }
  return normalizeMarkList(marks[key]);
}

function clearDraftOdontogram() {
  ensureDraftOdontogram();
  const hasMarks = Object.keys(draftPatient.odontogram.teeth).length > 0 || Object.keys(draftPatient.odontogram.zones).length > 0;
  if (!hasMarks) {
    setFeedback("El odontograma ya esta limpio.");
    return;
  }

  const approved = window.confirm("Se limpiaran todas las marcas del odontograma en este borrador. Continuar?");
  if (!approved) {
    return;
  }

  draftPatient.odontogram.teeth = {};
  draftPatient.odontogram.zones = {};
  renderOdontogram();
  setFeedback("Odontograma del borrador limpiado.");
}

function openPatient(id) {
  const found = state.patients.find((patient) => patient.id === id);
  if (!found) {
    return;
  }

  editingPatientId = id;
  draftPatient = deepClone(found);
  draftPatient = normalizePatient(draftPatient);
  hydrateFormFromDraft();
  setFormTitle();
  renderPatientTable();
  renderDentitionSwitch();
  renderDiseaseChecklist();
  renderOdontogram();
  setFeedback(`Editando expediente de ${found.name}.`);
}

function startNewPatient(showMessage) {
  editingPatientId = null;
  draftPatient = createEmptyPatient();
  hydrateFormFromDraft();
  setFormTitle();
  renderPatientTable();
  renderDentitionSwitch();
  renderDiseaseChecklist();
  renderOdontogram();

  if (showMessage) {
    setFeedback("Formulario listo para un nuevo paciente.");
  }
}

function savePatient() {
  syncDraftFromForm();
  ensureDraftOdontogram();

  if (!draftPatient.name) {
    setFeedback("El nombre del paciente es obligatorio.", "error");
    el.patientName.focus();
    return;
  }

  const now = new Date().toISOString();
  if (!draftPatient.id) {
    draftPatient.id = generateId("pt");
    draftPatient.createdAt = now;
  } else if (!draftPatient.createdAt) {
    draftPatient.createdAt = now;
  }
  draftPatient.updatedAt = now;

  const normalized = normalizePatient(draftPatient);
  const index = state.patients.findIndex((patient) => patient.id === normalized.id);
  if (index >= 0) {
    state.patients[index] = normalized;
  } else {
    state.patients.unshift(normalized);
  }

  persistState();
  editingPatientId = normalized.id;
  draftPatient = deepClone(normalized);
  renderPatientTable();
  renderDentitionSwitch();
  setFormTitle();
  setFeedback(`Paciente ${normalized.name} guardado correctamente.`);
}

function deletePatient(id) {
  const patient = state.patients.find((entry) => entry.id === id);
  if (!patient) {
    return;
  }

  const approved = window.confirm(`Se eliminara el paciente "${patient.name}". Esta accion no se puede deshacer.`);
  if (!approved) {
    return;
  }

  state.patients = state.patients.filter((entry) => entry.id !== id);
  persistState();

  if (editingPatientId === id) {
    startNewPatient(false);
  }
  renderPatientTable();
  setFeedback(`Paciente ${patient.name} eliminado.`);
}

function addDisease() {
  syncDraftFromForm();

  const name = el.newDiseaseName.value.trim();
  const color = sanitizeColor(el.newDiseaseColor.value, "#d97706");

  if (!name) {
    setFeedback("Escribe el nombre de la enfermedad.", "error");
    el.newDiseaseName.focus();
    return;
  }

  const exists = state.diseases.some((disease) => disease.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    setFeedback("Esa enfermedad ya existe.", "error");
    return;
  }

  const newDisease = {
    id: generateId("dis"),
    name,
    color
  };

  state.diseases.push(newDisease);
  draftPatient.diseaseIds = Array.from(new Set([...(draftPatient.diseaseIds || []), newDisease.id]));
  persistState();
  renderDiseaseChecklist();
  renderDiseaseCatalog();
  renderPatientTable();

  el.newDiseaseName.value = "";
  el.newDiseaseColor.value = color;
  setFeedback(`Enfermedad "${name}" agregada con color.`);
}

function removeDisease(id) {
  const disease = getDiseaseById(id);
  if (!disease) {
    return;
  }

  const approved = window.confirm(`Se eliminara la etiqueta "${disease.name}" de todos los pacientes.`);
  if (!approved) {
    return;
  }

  state.diseases = state.diseases.filter((entry) => entry.id !== id);
  state.patients = state.patients.map((patient) => ({
    ...patient,
    diseaseIds: patient.diseaseIds.filter((diseaseId) => diseaseId !== id)
  }));
  draftPatient.diseaseIds = (draftPatient.diseaseIds || []).filter((diseaseId) => diseaseId !== id);

  persistState();
  renderDiseaseChecklist();
  renderDiseaseCatalog();
  renderPatientTable();
  setFeedback(`Etiqueta "${disease.name}" eliminada.`);
}

function addToothStatus() {
  const name = el.newStatusName.value.trim();
  const color = sanitizeColor(el.newStatusColor.value, "#ef4444");

  if (!name) {
    setFeedback("Escribe un nombre para el estado dental.", "error");
    el.newStatusName.focus();
    return;
  }

  const exists = state.toothStatuses.some((status) => status.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    setFeedback("Ese estado dental ya existe.", "error");
    return;
  }

  state.toothStatuses.push({
    id: generateId("st"),
    name,
    color
  });

  persistState();
  renderStatusSelect();
  renderStatusCatalog();
  renderOdontogram();
  setFeedback(`Estado dental "${name}" agregado.`);
  el.newStatusName.value = "";
  el.newStatusColor.value = color;
}

function removeToothStatus(statusId) {
  const status = getStatusById(statusId);
  if (!status) {
    return;
  }

  const approved = window.confirm(`Se eliminara "${status.name}" del odontograma de todos los pacientes.`);
  if (!approved) {
    return;
  }

  state.toothStatuses = state.toothStatuses.filter((entry) => entry.id !== statusId);

  for (const patient of state.patients) {
    clearStatusFromMarks(patient.odontogram?.teeth, statusId);
    clearStatusFromMarks(patient.odontogram?.zones, statusId);
  }
  clearStatusFromMarks(draftPatient.odontogram?.teeth, statusId);
  clearStatusFromMarks(draftPatient.odontogram?.zones, statusId);

  persistState();
  renderStatusSelect();
  renderStatusCatalog();
  renderOdontogram();
  setFeedback(`Estado "${status.name}" eliminado.`);
}

function clearStatusFromMarks(marks, statusId) {
  if (!marks || typeof marks !== "object") {
    return;
  }

  for (const key of Object.keys(marks)) {
    const filtered = normalizeMarkList(marks[key]).filter((id) => id !== statusId);
    if (filtered.length === 0) {
      delete marks[key];
    } else {
      marks[key] = filtered;
    }
  }
}

function exportData() {
  const payload = {
    version: 2,
    exportedAt: new Date().toISOString(),
    data: state
  };

  const text = JSON.stringify(payload, null, 2);
  const blob = new Blob([text], { type: "application/json" });
  const link = document.createElement("a");
  const now = new Date().toISOString().slice(0, 10);
  link.href = URL.createObjectURL(blob);
  link.download = `respaldo-arete-${now}.json`;
  link.click();
  URL.revokeObjectURL(link.href);

  setFeedback("Respaldo exportado en formato JSON.");
}

function importData(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || "{}"));
      const imported = normalizeState(parsed.data || parsed);

      const approved = window.confirm(
        "Se reemplazaran los datos actuales por el respaldo importado. Deseas continuar?"
      );
      if (!approved) {
        return;
      }

      state = imported;
      persistState();
      startNewPatient(false);
      renderAll();
      setFeedback("Respaldo importado correctamente.");
    } catch (error) {
      console.error(error);
      setFeedback("No se pudo importar el archivo. Verifica que sea JSON valido.", "error");
    } finally {
      el.importFile.value = "";
    }
  };
  reader.readAsText(file, "utf-8");
}

function syncDraftFromForm() {
  draftPatient.name = stringOrEmpty(el.patientName.value);
  draftPatient.age = numberOrEmpty(el.patientAge.value);
  draftPatient.sex = stringOrEmpty(el.patientSex.value);
  draftPatient.location = stringOrEmpty(el.patientLocation.value);
  draftPatient.birthDate = stringOrEmpty(el.birthDate.value);
  draftPatient.phone = stringOrEmpty(el.phone.value);
  draftPatient.occupation = stringOrEmpty(el.occupation.value);
  draftPatient.medications = stringOrEmpty(el.medications.value);
  draftPatient.dentistName = stringOrEmpty(el.dentistName.value);
  draftPatient.allergies = stringOrEmpty(el.allergies.value);
  draftPatient.consultationDate = stringOrEmpty(el.consultationDate.value);
  draftPatient.treatmentStart = stringOrEmpty(el.treatmentStart.value);
  draftPatient.brushTimes = numberOrEmpty(el.brushTimes.value);
  draftPatient.flossHabit = stringOrEmpty(el.flossHabit.value);
  draftPatient.hasCaries = stringOrEmpty(el.hasCaries.value);
  draftPatient.otherConditions = stringOrEmpty(el.otherConditions.value);

  const diseaseInputs = el.diseaseChecklist.querySelectorAll("input[type=\"checkbox\"]");
  draftPatient.diseaseIds = Array.from(diseaseInputs)
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => checkbox.value);
}

function hydrateFormFromDraft() {
  el.patientName.value = draftPatient.name || "";
  el.patientAge.value = toInputNumber(draftPatient.age);
  el.patientSex.value = draftPatient.sex || "";
  el.patientLocation.value = draftPatient.location || "";
  el.birthDate.value = draftPatient.birthDate || "";
  el.phone.value = draftPatient.phone || "";
  el.occupation.value = draftPatient.occupation || "";
  el.medications.value = draftPatient.medications || "";
  el.dentistName.value = draftPatient.dentistName || "";
  el.allergies.value = draftPatient.allergies || "";
  el.consultationDate.value = draftPatient.consultationDate || "";
  el.treatmentStart.value = draftPatient.treatmentStart || "";
  el.brushTimes.value = toInputNumber(draftPatient.brushTimes);
  el.flossHabit.value = draftPatient.flossHabit || "";
  el.hasCaries.value = draftPatient.hasCaries || "";
  el.otherConditions.value = draftPatient.otherConditions || "";
}

function setFormTitle() {
  if (editingPatientId) {
    el.formTitle.textContent = `Editando paciente: ${draftPatient.name || "Sin nombre"}`;
  } else {
    el.formTitle.textContent = "Nuevo paciente";
  }
}

function getDiseaseById(id) {
  return state.diseases.find((disease) => disease.id === id) || null;
}

function getStatusById(id) {
  return state.toothStatuses.find((status) => status.id === id) || null;
}

function setFeedback(text, mode) {
  el.feedbackMessage.textContent = text;
  el.feedbackMessage.dataset.mode = mode || "ok";
}

function calculateAgeFromDate(dateString) {
  const birthDate = new Date(dateString);
  if (Number.isNaN(birthDate.valueOf())) {
    return NaN;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const pendingBirthday = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate());
  if (pendingBirthday) {
    age -= 1;
  }
  return age;
}

function sanitizeColor(value, fallback) {
  const hex = typeof value === "string" ? value.trim() : "";
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex) ? hex : fallback;
}

function formatDate(dateString) {
  if (!dateString) {
    return "-";
  }
  const date = new Date(dateString);
  if (Number.isNaN(date.valueOf())) {
    return "-";
  }
  return date.toLocaleDateString("es-MX");
}

function getCurrentDentitionMode() {
  return isValidDentitionMode(draftPatient.odontogramMode) ? draftPatient.odontogramMode : "adult";
}

function isValidDentitionMode(mode) {
  return mode === "adult" || mode === "child";
}

function getToothShapeType(toothNumber, mode) {
  const n = Number(toothNumber);
  const unit = Number.isFinite(n) ? n % 10 : 0;

  if (unit === 1 || unit === 2) {
    return "incisor";
  }
  if (unit === 3) {
    return "canine";
  }
  if (mode === "adult" && (unit === 4 || unit === 5)) {
    return "premolar";
  }
  return "molar";
}

function getToothDimensions(shapeType, mode) {
  const scale = mode === "child" ? 1.06 : 1;

  if (shapeType === "incisor") {
    return { width: Math.round(32 * scale), height: Math.round(45 * scale) };
  }
  if (shapeType === "canine") {
    return { width: Math.round(36 * scale), height: Math.round(47 * scale) };
  }
  if (shapeType === "premolar") {
    return { width: Math.round(40 * scale), height: Math.round(48 * scale) };
  }
  return { width: Math.round(44 * scale), height: Math.round(49 * scale) };
}

function getToothKindLabel(toothNumber, mode) {
  const n = Number(toothNumber);
  const unit = Number.isFinite(n) ? n % 10 : 0;

  if (mode === "child") {
    if (unit === 1) {
      return "Inc. central";
    }
    if (unit === 2) {
      return "Inc. lateral";
    }
    if (unit === 3) {
      return "Canino";
    }
    if (unit === 4) {
      return "1er molar";
    }
    if (unit === 5) {
      return "2do molar";
    }
    return "Temporal";
  }

  if (unit === 1) {
    return "Inc. central";
  }
  if (unit === 2) {
    return "Inc. lateral";
  }
  if (unit === 3) {
    return "Canino";
  }
  if (unit === 4) {
    return "1er premolar";
  }
  if (unit === 5) {
    return "2do premolar";
  }
  if (unit === 6) {
    return "1er molar";
  }
  if (unit === 7) {
    return "2do molar";
  }
  if (unit === 8) {
    return "3er molar";
  }
  return "Pieza";
}

function buildMultiColorBackground(colors) {
  const filtered = colors.filter((color) => typeof color === "string" && color.trim());
  if (filtered.length === 0) {
    return "transparent";
  }
  if (filtered.length === 1) {
    return filtered[0];
  }

  const stop = 100 / filtered.length;
  const gradientStops = filtered
    .map((color, index) => {
      const start = (index * stop).toFixed(2);
      const end = ((index + 1) * stop).toFixed(2);
      return `${color} ${start}%, ${color} ${end}%`;
    })
    .join(", ");

  return `linear-gradient(90deg, ${gradientStops})`;
}

function stringOrEmpty(value) {
  return typeof value === "string" ? value.trim() : "";
}

function numberOrEmpty(value) {
  if (value === "" || value === null || value === undefined) {
    return "";
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : "";
}

function toInputNumber(value) {
  return value === "" || value === null || value === undefined ? "" : String(value);
}

function deepClone(data) {
  return JSON.parse(JSON.stringify(data));
}

function generateId(prefix) {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
