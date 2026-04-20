"use strict";

const STORAGE_KEY = "arete_data_v1";
const DENTITION_LAYOUTS = {
  adult: {
    label: "Denticion adulta comun",
    centerLabel: "Odontograma adulto comun",
    commonHint: "Formato comun FDI: adulto de 32 piezas.",
    upper: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
    lower: [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]
  },
  child: {
    label: "Denticion infantil comun",
    centerLabel: "Odontograma infantil comun",
    commonHint: "Formato comun FDI: infantil de 20 piezas.",
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

const CLINICAL_RECORD_TYPES = [
  {
    id: "f1-estomatologica",
    label: "Formato 1 - Historia clinica estomatologica",
    focus: ["Interrogatorio general", "Antecedentes", "Exploracion estomatognatica", "Odontograma diagnostico"]
  },
  {
    id: "f2-preventiva",
    label: "Formato 2 - Estomatologia preventiva",
    focus: ["Control de higiene", "Indice de placa", "Tecnica de cepillado", "Aplicacion de fluor"]
  },
  {
    id: "f3-operatoria",
    label: "Formato 3 - Operatoria dental",
    focus: ["Diagnostico de caries", "Tratamiento restaurador", "Odontograma y evolucion", "Ruta clinica"]
  },
  {
    id: "f4-protesis-fija",
    label: "Formato 4 - Protesis fija",
    focus: ["Evaluacion clinica", "Pilares y soporte", "Interpretacion radiografica", "Plan de tratamiento"]
  },
  {
    id: "f5-protesis-removible",
    label: "Formato 5 - Protesis removible",
    focus: ["Clasificacion de Kennedy", "Conectores y ganchos", "Area desdentada", "Evolucion de tratamiento"]
  },
  {
    id: "f6-prostodoncia",
    label: "Formato 6 - Prostodoncia total/parcial",
    focus: ["Estado del reborde", "Plan protetico", "Pruebas de oclusion", "Entrega y controles"]
  },
  {
    id: "f7-cirugia-bucal",
    label: "Formato 7 - Cirugia bucal",
    focus: ["Padecimiento actual", "Exploracion de zona", "Diagnostico y pronostico", "Notas posquirurgicas"]
  },
  {
    id: "f8-periodoncia",
    label: "Formato 8 - Periodoncia",
    focus: ["Antecedentes periodontales", "Indice de higiene", "Bolsas y movilidad", "Plan periodontal"]
  },
  {
    id: "f9-endodoncia",
    label: "Formato 9 - Endodoncia",
    focus: ["Motivo de consulta", "Pruebas de sensibilidad", "Diagnostico pulpar", "Tratamiento de conductos"]
  },
  {
    id: "f10-ortodoncia",
    label: "Formato 10 - Ortodoncia y ortopedia maxilar",
    focus: ["Antecedentes de crecimiento", "Analisis facial y oclusal", "Plan ortodontico", "Consentimiento"]
  },
  {
    id: "f11-odontopediatria",
    label: "Formato 11 - Odontopediatria",
    focus: ["Antecedentes pediatricos", "Denticion temporal/mixta", "Prevencion y control", "Seguimiento con tutor"]
  }
];

const el = {
  newPatientBtn: document.getElementById("newPatientBtn"),
  openPathologiesBtn: document.getElementById("openPathologiesBtn"),
  exportBtn: document.getElementById("exportBtn"),
  importFile: document.getElementById("importFile"),
  viewTabs: Array.from(document.querySelectorAll("[data-view-tab]")),
  viewSections: Array.from(document.querySelectorAll("[data-view-section]")),
  searchInput: document.getElementById("searchInput"),
  upcomingCount: document.getElementById("upcomingCount"),
  upcomingList: document.getElementById("upcomingList"),
  savePatientBtn: document.getElementById("savePatientBtn"),
  deleteCurrentPatientBtn: document.getElementById("deleteCurrentPatientBtn"),
  formTitle: document.getElementById("formTitle"),
  patientForm: document.getElementById("patientForm"),
  pathologiesCard: document.getElementById("pathologiesCard"),
  patientRows: document.getElementById("patientRows"),
  diseaseChecklist: document.getElementById("diseaseChecklist"),
  newDiseaseName: document.getElementById("newDiseaseName"),
  newDiseaseColor: document.getElementById("newDiseaseColor"),
  addDiseaseBtn: document.getElementById("addDiseaseBtn"),
  diseaseCatalog: document.getElementById("diseaseCatalog"),
  jawBackdrop: document.getElementById("jawBackdrop"),
  upperJawArc: document.getElementById("upperJawArc"),
  lowerJawArc: document.getElementById("lowerJawArc"),
  zoneList: document.getElementById("zoneList"),
  dentitionLabel: document.getElementById("dentitionLabel"),
  dentitionStandardHint: document.getElementById("dentitionStandardHint"),
  dentitionSwitchButtons: Array.from(document.querySelectorAll("[data-dentition]")),
  clearOdontogramBtn: document.getElementById("clearOdontogramBtn"),
  quickAddStatusBtn: document.getElementById("quickAddStatusBtn"),
  toothStatusSelect: document.getElementById("toothStatusSelect"),
  statusLegend: document.getElementById("statusLegend"),
  newStatusName: document.getElementById("newStatusName"),
  newStatusColor: document.getElementById("newStatusColor"),
  addStatusBtn: document.getElementById("addStatusBtn"),
  addClinicalNoteBtn: document.getElementById("addClinicalNoteBtn"),
  clinicalRecordType: document.getElementById("clinicalRecordType"),
  clinicalRecordReference: document.getElementById("clinicalRecordReference"),
  exportClinicalDocBtn: document.getElementById("exportClinicalDocBtn"),
  printClinicalDocBtn: document.getElementById("printClinicalDocBtn"),
  clinicalNoteDate: document.getElementById("clinicalNoteDate"),
  clinicalNoteTitle: document.getElementById("clinicalNoteTitle"),
  clinicalNoteText: document.getElementById("clinicalNoteText"),
  patientHistoryList: document.getElementById("patientHistoryList"),
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
  nextConsultationDate: document.getElementById("nextConsultationDate"),
  treatmentStart: document.getElementById("treatmentStart"),
  appointmentDate: document.getElementById("appointmentDate"),
  appointmentTime: document.getElementById("appointmentTime"),
  appointmentReason: document.getElementById("appointmentReason"),
  addAppointmentBtn: document.getElementById("addAppointmentBtn"),
  appointmentList: document.getElementById("appointmentList"),
  brushTimes: document.getElementById("brushTimes"),
  flossHabit: document.getElementById("flossHabit"),
  hasCaries: document.getElementById("hasCaries"),
  otherConditions: document.getElementById("otherConditions")
};

let state = loadState();
let draftPatient = createEmptyPatient();
let editingPatientId = null;
let selectedStatusId = "";
let activeView = "home";
let storageMode = "local";
let remotePersistTimer = null;
let remotePersistInFlight = false;
let remotePersistPending = false;
const apiBaseUrl = resolveApiBaseUrl();

init();

function init() {
  bindEvents();
  setActiveView("home");
  renderAll();
  startNewPatient(false);
  initializeBackendStorage();
}

function bindEvents() {
  el.newPatientBtn.addEventListener("click", () => {
    setActiveView("home");
    startNewPatient(true);
  });
  el.openPathologiesBtn.addEventListener("click", focusPathologiesSection);
  for (const button of el.viewTabs) {
    button.addEventListener("click", () => {
      const targetView = button.getAttribute("data-view-tab");
      setActiveView(targetView);
    });
  }
  el.savePatientBtn.addEventListener("click", savePatient);
  el.deleteCurrentPatientBtn.addEventListener("click", () => {
    if (!editingPatientId) {
      setFeedback("Primero abre un paciente para poder eliminarlo.", "error");
      return;
    }
    deletePatient(editingPatientId);
  });
  el.exportBtn.addEventListener("click", exportData);
  el.importFile.addEventListener("change", importData);
  el.searchInput.addEventListener("input", renderPatientTable);
  el.addDiseaseBtn.addEventListener("click", addDisease);
  el.addStatusBtn.addEventListener("click", addToothStatus);
  el.addAppointmentBtn.addEventListener("click", addAppointmentToPatient);
  el.exportClinicalDocBtn.addEventListener("click", downloadClinicalDocument);
  el.printClinicalDocBtn.addEventListener("click", printClinicalDocument);
  el.addClinicalNoteBtn.addEventListener("click", addClinicalNote);
  el.clearOdontogramBtn.addEventListener("click", clearDraftOdontogram);
  el.quickAddStatusBtn.addEventListener("click", () => {
    el.newStatusName.scrollIntoView({ behavior: "smooth", block: "center" });
    el.newStatusName.focus();
    setFeedback("Escribe la nueva enfermedad/estado y elige su color.");
  });

  el.toothStatusSelect.addEventListener("change", () => {
    selectedStatusId = el.toothStatusSelect.value || "none";
    updateStatusSelectAppearance();
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

  el.clinicalRecordType.addEventListener("change", () => {
    syncDraftClinicalRecordFields();
    persistDraftPatientIfEditing();
  });

  el.clinicalRecordReference.addEventListener("input", () => {
    syncDraftClinicalRecordFields();
    persistDraftPatientIfEditing();
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

  el.upcomingList.addEventListener("click", (event) => {
    const openBtn = event.target.closest("[data-open-id]");
    if (!openBtn) {
      return;
    }
    openPatient(openBtn.getAttribute("data-open-id"));
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

  el.patientHistoryList.addEventListener("click", (event) => {
    const removeBtn = event.target.closest("[data-remove-history-id]");
    if (!removeBtn) {
      return;
    }
    removeHistoryEntry(removeBtn.getAttribute("data-remove-history-id"));
  });

  el.appointmentList.addEventListener("click", (event) => {
    const removeBtn = event.target.closest("[data-remove-appointment-id]");
    if (!removeBtn) {
      return;
    }
    removeAppointmentFromPatient(removeBtn.getAttribute("data-remove-appointment-id"));
  });

  el.zoneList.addEventListener("click", (event) => {
    const zoneBtn = event.target.closest("[data-zone-id]");
    if (!zoneBtn) {
      return;
    }
    applyOdontoMark("zones", zoneBtn.getAttribute("data-zone-id"));
  });

  el.jawBackdrop.addEventListener("click", (event) => {
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

function setActiveView(view) {
  const validViews = new Set(["home", "registry", "upcoming"]);
  const nextView = validViews.has(view) ? view : "home";
  activeView = nextView;

  for (const button of el.viewTabs) {
    const isActive = button.getAttribute("data-view-tab") === nextView;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  }

  for (const section of el.viewSections) {
    const isActive = section.getAttribute("data-view-section") === nextView;
    section.classList.toggle("is-active", isActive);
    section.hidden = !isActive;
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
    clinicalRecordType: CLINICAL_RECORD_TYPES[0].id,
    clinicalRecordReference: "",
    consultationDate: "",
    nextConsultationDate: "",
    treatmentStart: "",
    brushTimes: "",
    flossHabit: "",
    hasCaries: "",
    otherConditions: "",
    diseaseIds: [],
    appointments: [],
    odontogramMode: "adult",
    odontogram: {
      teeth: {},
      zones: {}
    },
    historyEntries: [],
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
  patient.clinicalRecordType = normalizeClinicalRecordType(
    patient.clinicalRecordType || patient.recordType || patient.historyType
  );
  patient.clinicalRecordReference = stringOrEmpty(
    patient.clinicalRecordReference || patient.recordReference || patient.folio
  );
  patient.consultationDate = stringOrEmpty(patient.consultationDate);
  patient.nextConsultationDate = stringOrEmpty(
    patient.nextConsultationDate || patient.nextConsultation || patient.followUpDate
  );
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
  patient.appointments = normalizeAppointments(patient.appointments);

  patient.odontogramMode = isValidDentitionMode(patient.odontogramMode) ? patient.odontogramMode : "adult";

  patient.odontogram = {
    teeth: normalizeMarks(patient.odontogram?.teeth),
    zones: normalizeMarks(patient.odontogram?.zones)
  };
  patient.historyEntries = normalizeHistoryEntries(
    patient.historyEntries || patient.clinicalHistory || patient.odontogramHistory
  );

  return patient;
}

function normalizeAppointments(rawAppointments) {
  if (!Array.isArray(rawAppointments)) {
    return [];
  }

  const appointments = [];
  for (const item of rawAppointments) {
    const date = stringOrEmpty(item?.date);
    if (!date) {
      continue;
    }

    appointments.push({
      id: stringOrEmpty(item?.id) || generateId("apt"),
      date,
      time: stringOrEmpty(item?.time),
      reason: stringOrEmpty(item?.reason)
    });
  }

  appointments.sort((a, b) => {
    const aTs = getAppointmentTimestamp(a.date, a.time);
    const bTs = getAppointmentTimestamp(b.date, b.time);
    if (aTs === null && bTs === null) {
      return 0;
    }
    if (aTs === null) {
      return 1;
    }
    if (bTs === null) {
      return -1;
    }
    return aTs - bTs;
  });
  return appointments;
}

function normalizeClinicalRecordType(value) {
  const candidate = stringOrEmpty(value);
  if (!candidate) {
    return CLINICAL_RECORD_TYPES[0].id;
  }
  const exists = CLINICAL_RECORD_TYPES.some((type) => type.id === candidate);
  return exists ? candidate : CLINICAL_RECORD_TYPES[0].id;
}

function normalizeHistoryEntries(rawEntries) {
  if (!Array.isArray(rawEntries)) {
    return [];
  }

  const normalized = [];
  for (const entry of rawEntries) {
    const title = stringOrEmpty(entry?.title);
    const description = stringOrEmpty(entry?.description);
    const createdAt = stringOrEmpty(entry?.createdAt);

    if (!title && !description) {
      continue;
    }

    normalized.push({
      id: stringOrEmpty(entry?.id) || generateId("hist"),
      type: stringOrEmpty(entry?.type) || "clinical-note",
      title: title || "Registro clinico",
      description,
      createdAt: isValidDate(createdAt) ? createdAt : new Date().toISOString(),
      statusIds: normalizeHistoryStatusIds(entry?.statusIds)
    });
  }

  normalized.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return normalized;
}

function normalizeHistoryStatusIds(rawStatusIds) {
  if (!Array.isArray(rawStatusIds)) {
    return [];
  }

  const out = [];
  const seen = new Set();
  for (const statusId of rawStatusIds) {
    if (typeof statusId !== "string") {
      continue;
    }
    const clean = statusId.trim();
    if (!clean || seen.has(clean)) {
      continue;
    }
    seen.add(clean);
    out.push(clean);
  }
  return out;
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
  if (storageMode === "backend") {
    queueRemotePersist();
  }
}

function resolveApiBaseUrl() {
  const queryApi = stringOrEmpty(new URLSearchParams(window.location.search).get("api"));
  if (queryApi) {
    localStorage.setItem("arete_api_base", queryApi);
    return queryApi.replace(/\/$/, "");
  }

  const storedApi = stringOrEmpty(localStorage.getItem("arete_api_base"));
  if (storedApi) {
    return storedApi.replace(/\/$/, "");
  }

  if (window.location.protocol === "file:" || window.location.hostname.endsWith("github.io")) {
    return "";
  }

  return window.location.origin;
}

async function initializeBackendStorage() {
  if (!apiBaseUrl) {
    return;
  }

  try {
    const healthResponse = await apiRequest("/api/health", { method: "GET" }, 3500);
    if (!healthResponse.ok) {
      return;
    }

    storageMode = "backend";
    const stateResponse = await apiRequest("/api/state", { method: "GET" }, 5000);
    if (!stateResponse.ok) {
      setFeedback("Backend detectado, pero no se pudo leer el estado inicial.", "error");
      return;
    }

    const payload = await stateResponse.json();
    state = normalizeState(payload?.data || payload);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    renderAll();
    if (!editingPatientId) {
      startNewPatient(false);
    }
    setFeedback("Backend conectado. Datos sincronizados correctamente.");
  } catch (error) {
    console.error("Backend no disponible. Continuando en modo local.", error);
  }
}

function queueRemotePersist() {
  remotePersistPending = true;
  if (remotePersistTimer) {
    clearTimeout(remotePersistTimer);
  }
  remotePersistTimer = window.setTimeout(() => {
    void flushRemotePersist();
  }, 180);
}

async function flushRemotePersist() {
  if (remotePersistInFlight || !remotePersistPending || storageMode !== "backend") {
    return;
  }

  remotePersistPending = false;
  remotePersistInFlight = true;
  try {
    const response = await apiRequest(
      "/api/state",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: state })
      },
      9000
    );

    if (!response.ok) {
      throw new Error(`Backend respondio ${response.status}`);
    }
  } catch (error) {
    console.error("No se pudo guardar en backend.", error);
    storageMode = "local";
    setFeedback("Fallo el backend. La app continuo en modo local para no perder cambios.", "error");
  } finally {
    remotePersistInFlight = false;
  }

  if (remotePersistPending) {
    void flushRemotePersist();
  }
}

async function apiRequest(pathname, options, timeoutMs) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs || 5000);
  try {
    return await fetch(`${apiBaseUrl}${pathname}`, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

function renderAll() {
  renderStatusSelect();
  renderDentitionSwitch();
  renderDiseaseChecklist();
  renderDiseaseCatalog();
  renderStatusCatalog();
  renderOdontogram();
  renderAppointmentList();
  renderPatientTable();
  renderUpcomingAppointments();
  renderPatientHistory();
  updateDeleteCurrentButtonState();
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
    renderUpcomingAppointments();
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
      const nextAppointment = getNextAppointmentForPatient(patient);
      const nextConsultationDate = getNextConsultationDateForPatient(patient);
      const consultationText = nextAppointment
        ? `${formatDate(nextAppointment.date)}${nextAppointment.time ? ` ${nextAppointment.time}` : ""}`
        : nextConsultationDate
          ? formatDate(nextConsultationDate)
          : formatDate(patient.consultationDate);

      return `
        <tr class="${patient.id === editingPatientId ? "active" : ""}">
          <td>
            <div class="patient-name-cell">
              <strong>${escapeHtml(patient.name || "Sin nombre")}</strong>
              <div class="color-boxes">${diseaseBoxes || "<span class=\"patient-meta\">Sin enfermedades seleccionadas</span>"}</div>
              <span class="patient-meta">${escapeHtml(patient.location || "Sin ubicacion")}</span>
            </div>
          </td>
          <td>${escapeHtml(consultationText)}</td>
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
  renderUpcomingAppointments();
}

function renderUpcomingAppointments() {
  const now = Date.now();
  const todayStart = getStartOfToday().getTime();
  const entries = [];

  for (const patient of state.patients) {
    const appointments = normalizeAppointments(patient.appointments);
    if (appointments.length > 0) {
      for (const appointment of appointments) {
        const info = getAppointmentDateInfo(appointment.date, appointment.time);
        if (!info) {
          continue;
        }
        const threshold = info.hasTime ? now : todayStart;
        if (info.timestamp >= threshold) {
          entries.push({
            patientId: patient.id,
            patientName: patient.name || "Sin nombre",
            date: appointment.date,
            time: appointment.time || "",
            dentistName: patient.dentistName || "Sin dentista",
            reason: appointment.reason || "Sin motivo",
            sortTimestamp: info.timestamp
          });
        }
      }
      continue;
    }

    const nextConsultationInfo = getAppointmentDateInfo(patient.nextConsultationDate, "");
    if (nextConsultationInfo && nextConsultationInfo.timestamp >= todayStart) {
      entries.push({
        patientId: patient.id,
        patientName: patient.name || "Sin nombre",
        date: patient.nextConsultationDate,
        time: "",
        dentistName: patient.dentistName || "Sin dentista",
        reason: "Proxima consulta",
        sortTimestamp: nextConsultationInfo.timestamp
      });
      continue;
    }

    const consultationInfo = getAppointmentDateInfo(patient.consultationDate, "");
    if (consultationInfo && consultationInfo.timestamp >= todayStart) {
      entries.push({
        patientId: patient.id,
        patientName: patient.name || "Sin nombre",
        date: patient.consultationDate,
        time: "",
        dentistName: patient.dentistName || "Sin dentista",
        reason: "Consulta general",
        sortTimestamp: consultationInfo.timestamp
      });
    }
  }

  entries.sort((a, b) => {
    if (a.sortTimestamp !== b.sortTimestamp) {
      return a.sortTimestamp - b.sortTimestamp;
    }
    return a.patientName.localeCompare(b.patientName, "es", { sensitivity: "base" });
  });

  const upcoming = entries.slice(0, 40);
  el.upcomingCount.textContent = String(upcoming.length);

  if (upcoming.length === 0) {
    el.upcomingList.innerHTML = "<div class=\"history-empty\">No hay citas proximas registradas.</div>";
    return;
  }

  el.upcomingList.innerHTML = upcoming
    .map((entry) => `
      <div class="upcoming-item">
        <div class="upcoming-main">
          <span class="upcoming-name">${escapeHtml(entry.patientName)}</span>
          <span class="upcoming-meta">${escapeHtml(formatDate(entry.date))}${entry.time ? ` - ${escapeHtml(entry.time)}` : ""} | ${escapeHtml(entry.reason)} | ${escapeHtml(entry.dentistName)}</span>
        </div>
        <button type="button" class="table-btn" data-open-id="${entry.patientId}">Abrir</button>
      </div>
    `)
    .join("");
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
    "<option value=\"none\" style=\"color:#dbeafe;font-weight:700;\">○ Limpiar pieza / zona</option>",
    ...state.toothStatuses.map(
      (status) => `<option value="${status.id}" style="color:${status.color};font-weight:700;">■ ${escapeHtml(status.name)}</option>`
    )
  ];

  el.toothStatusSelect.innerHTML = options.join("");
  const exists = state.toothStatuses.some((status) => status.id === previous);
  if (exists) {
    selectedStatusId = previous;
  } else if (previous === "none") {
    selectedStatusId = "none";
  } else if (state.toothStatuses.length > 0) {
    selectedStatusId = state.toothStatuses[0].id;
  } else {
    selectedStatusId = "none";
  }
  el.toothStatusSelect.value = selectedStatusId;
  updateStatusSelectAppearance();
}

function updateStatusSelectAppearance() {
  if (selectedStatusId === "none") {
    el.toothStatusSelect.style.color = "#e7f3fb";
    return;
  }
  const color = getStatusById(selectedStatusId)?.color || "#e7f3fb";
  el.toothStatusSelect.style.color = color;
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

function renderAppointmentList() {
  const appointments = Array.isArray(draftPatient.appointments) ? draftPatient.appointments : [];
  if (appointments.length === 0) {
    el.appointmentList.innerHTML = "<div class=\"history-empty\">Este paciente aun no tiene citas agendadas.</div>";
    return;
  }

  const sorted = appointments
    .slice()
    .sort((a, b) => {
      const aTs = getAppointmentTimestamp(a.date, a.time);
      const bTs = getAppointmentTimestamp(b.date, b.time);
      if (aTs === null && bTs === null) {
        return 0;
      }
      if (aTs === null) {
        return 1;
      }
      if (bTs === null) {
        return -1;
      }
      return aTs - bTs;
    });

  el.appointmentList.innerHTML = sorted
    .map((appointment) => `
      <article class="appointment-item">
        <div class="appointment-main">
          <div class="appointment-title">${escapeHtml(formatDate(appointment.date))}${appointment.time ? ` - ${escapeHtml(appointment.time)}` : ""}</div>
          <div class="appointment-meta">${escapeHtml(appointment.reason || "Sin motivo especificado.")}</div>
        </div>
        <button type="button" class="catalog-btn" data-remove-appointment-id="${appointment.id}">Quitar</button>
      </article>
    `)
    .join("");
}

function renderPatientHistory() {
  const entries = Array.isArray(draftPatient.historyEntries) ? draftPatient.historyEntries : [];
  if (entries.length === 0) {
    el.patientHistoryList.innerHTML = "<div class=\"history-empty\">Aun no hay historial guardado para este paciente.</div>";
    return;
  }

  const sorted = entries
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  el.patientHistoryList.innerHTML = sorted
    .map((entry) => {
      const statusBadges = renderHistoryStatusBadges(entry.statusIds);
      return `
      <article class="history-item">
        <div class="history-head">
          <span class="history-type">${escapeHtml(getHistoryTypeLabel(entry.type))}</span>
          <span class="history-date">${escapeHtml(formatDateTime(entry.createdAt))}</span>
        </div>
        ${statusBadges}
        <div class="history-title">${escapeHtml(entry.title || "Registro clinico")}</div>
        <div class="history-body">${escapeHtml(entry.description || "")}</div>
        <div class="history-actions">
          <button type="button" class="catalog-btn" data-remove-history-id="${entry.id}">Eliminar registro</button>
        </div>
      </article>
    `;
    })
    .join("");
}

function renderHistoryStatusBadges(statusIds) {
  const list = normalizeHistoryStatusIds(statusIds);
  if (list.length === 0) {
    return "";
  }

  const chips = list
    .map((statusId) => {
      const status = getStatusById(statusId);
      if (!status) {
        return "";
      }
      return `
        <span class="history-status-chip">
          <span class="tag-color" style="background:${status.color}"></span>
          <span>${escapeHtml(status.name)}</span>
        </span>
      `;
    })
    .join("");

  if (!chips.trim()) {
    return "";
  }

  return `<div class="history-status-row">${chips}</div>`;
}

function updateDeleteCurrentButtonState() {
  el.deleteCurrentPatientBtn.disabled = !editingPatientId;
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
  el.dentitionLabel.textContent = layout.centerLabel || layout.label;
  if (el.dentitionStandardHint) {
    el.dentitionStandardHint.textContent = layout.commonHint || "";
  }

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
      <button type="button" class="zone-btn ${statusIds.length > 0 ? "has-marks" : ""}" data-zone-id="${zone.id}" style="--mark-color:${colorStyle}" title="${escapeHtml(zone.name)}: ${escapeHtml(label)}">
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
  const targetLabel = getOdontoTargetLabel(bucket, key);

  if (selectedStatusId === "none") {
    if (current.length === 0) {
      setFeedback("La pieza ya estaba limpia.");
      return;
    }
    const previousStatuses = current
      .map((statusId) => getStatusById(statusId)?.name)
      .filter(Boolean)
      .join(", ");
    delete draftPatient.odontogram[bucket][key];
    addHistoryEntry({
      type: "odontogram-change",
      title: `Limpieza de ${targetLabel}`,
      description: `Se limpiaron todas las marcas de ${targetLabel}. Estados previos: ${previousStatuses || "sin detalle"}.`,
      statusIds: current
    });
    persistDraftPatientIfEditing();
    setFeedback(`Se limpiaron todas las marcas de ${bucket === "teeth" ? "la pieza" : "la zona"}.`);
    renderPatientHistory();
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
    addHistoryEntry({
      type: "odontogram-change",
      title: `Estado removido en ${targetLabel}`,
      description: `Se removio "${statusName}" de ${targetLabel}.`,
      statusIds: [selectedStatusId]
    });
    setFeedback(`Estado ${statusName} removido de ${bucket === "teeth" ? "la pieza" : "la zona"}.`);
  } else {
    next.push(selectedStatusId);
    draftPatient.odontogram[bucket][key] = next;
    addHistoryEntry({
      type: "odontogram-change",
      title: `Estado agregado en ${targetLabel}`,
      description: `Se agrego "${statusName}" en ${targetLabel}.`,
      statusIds: [selectedStatusId]
    });
    setFeedback(`Estado ${statusName} agregado. Esta pieza ya puede tener multiples colores en filas.`);
  }

  persistDraftPatientIfEditing();
  renderPatientHistory();
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
  const toothCount = Object.keys(draftPatient.odontogram.teeth).length;
  const zoneCount = Object.keys(draftPatient.odontogram.zones).length;
  const statusIds = collectOdontogramStatusIds(draftPatient.odontogram);
  const hasMarks = toothCount > 0 || zoneCount > 0;
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
  addHistoryEntry({
    type: "odontogram-change",
    title: "Limpieza total de odontograma",
    description: `Se limpiaron ${toothCount} pieza(s) y ${zoneCount} zona(s) del odontograma.`,
    statusIds
  });
  persistDraftPatientIfEditing();
  renderPatientHistory();
  renderOdontogram();
  setFeedback("Odontograma del borrador limpiado.");
}

function collectOdontogramStatusIds(odontogram) {
  const set = new Set();
  const buckets = [odontogram?.teeth, odontogram?.zones];
  for (const marks of buckets) {
    if (!marks || typeof marks !== "object") {
      continue;
    }
    for (const value of Object.values(marks)) {
      for (const statusId of normalizeMarkList(value)) {
        set.add(statusId);
      }
    }
  }
  return Array.from(set);
}

function openPatient(id) {
  const found = state.patients.find((patient) => patient.id === id);
  if (!found) {
    return;
  }

  setActiveView("home");
  editingPatientId = id;
  draftPatient = deepClone(found);
  draftPatient = normalizePatient(draftPatient);
  hydrateFormFromDraft();
  setFormTitle();
  renderPatientTable();
  renderUpcomingAppointments();
  renderDentitionSwitch();
  renderDiseaseChecklist();
  renderOdontogram();
  renderAppointmentList();
  renderPatientHistory();
  resetAppointmentInputs();
  resetClinicalNoteInputs();
  updateDeleteCurrentButtonState();
  setFeedback(`Editando expediente de ${found.name}.`);
}

function startNewPatient(showMessage) {
  editingPatientId = null;
  draftPatient = createEmptyPatient();
  hydrateFormFromDraft();
  setFormTitle();
  renderPatientTable();
  renderUpcomingAppointments();
  renderDentitionSwitch();
  renderDiseaseChecklist();
  renderOdontogram();
  renderAppointmentList();
  renderPatientHistory();
  resetAppointmentInputs();
  resetClinicalNoteInputs();
  updateDeleteCurrentButtonState();

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
  draftPatient = normalizePatient(draftPatient);
  renderPatientTable();
  renderUpcomingAppointments();
  renderDentitionSwitch();
  renderAppointmentList();
  renderPatientHistory();
  resetAppointmentInputs();
  updateDeleteCurrentButtonState();
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
  renderUpcomingAppointments();
  renderPatientHistory();
  updateDeleteCurrentButtonState();
  setFeedback(`Paciente ${patient.name} eliminado.`);
}

function addAppointmentToPatient() {
  const date = stringOrEmpty(el.appointmentDate.value);
  const time = stringOrEmpty(el.appointmentTime.value);
  const reason = stringOrEmpty(el.appointmentReason.value);

  if (!date) {
    setFeedback("Selecciona la fecha para agendar la cita.", "error");
    el.appointmentDate.focus();
    return;
  }

  if (!Array.isArray(draftPatient.appointments)) {
    draftPatient.appointments = [];
  }

  draftPatient.appointments.push({
    id: generateId("apt"),
    date,
    time,
    reason
  });
  draftPatient.appointments = normalizeAppointments(draftPatient.appointments);
  renderAppointmentList();
  persistDraftPatientIfEditing();
  setFeedback(`Cita agendada para ${formatDate(date)}${time ? ` a las ${time}` : ""}.`);

  el.appointmentTime.value = "";
  el.appointmentReason.value = "";
}

function removeAppointmentFromPatient(appointmentId) {
  if (!Array.isArray(draftPatient.appointments)) {
    return;
  }

  const found = draftPatient.appointments.find((entry) => entry.id === appointmentId);
  if (!found) {
    return;
  }

  const approved = window.confirm("Se eliminara esta cita agendada. Deseas continuar?");
  if (!approved) {
    return;
  }

  draftPatient.appointments = draftPatient.appointments.filter((entry) => entry.id !== appointmentId);
  renderAppointmentList();
  persistDraftPatientIfEditing();
  setFeedback("Cita eliminada del paciente.");
}

function addClinicalNote() {
  const rawTitle = stringOrEmpty(el.clinicalNoteTitle.value);
  const rawText = stringOrEmpty(el.clinicalNoteText.value);
  if (!rawTitle && !rawText) {
    setFeedback("Escribe un titulo o una nota clinica antes de guardar.", "error");
    return;
  }

  const noteDate = stringOrEmpty(el.clinicalNoteDate.value);
  let createdAt = new Date().toISOString();
  if (noteDate) {
    const now = new Date();
    const custom = new Date(noteDate);
    if (!Number.isNaN(custom.valueOf())) {
      custom.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0);
      createdAt = custom.toISOString();
    }
  }

  addHistoryEntry({
    type: "clinical-note",
    title: rawTitle || "Nota clinica",
    description: rawText || "Sin detalle adicional.",
    createdAt
  });
  persistDraftPatientIfEditing();
  renderPatientHistory();
  resetClinicalNoteInputs();
  setFeedback("Nota clinica agregada al historial del paciente.");
}

function removeHistoryEntry(entryId) {
  const entries = Array.isArray(draftPatient.historyEntries) ? draftPatient.historyEntries : [];
  const entry = entries.find((item) => item.id === entryId);
  if (!entry) {
    return;
  }

  const approved = window.confirm("Se eliminara este registro del historial clinico. Deseas continuar?");
  if (!approved) {
    return;
  }

  draftPatient.historyEntries = entries.filter((item) => item.id !== entryId);
  persistDraftPatientIfEditing();
  renderPatientHistory();
  setFeedback("Registro de historial eliminado.");
}

function persistDraftPatientIfEditing() {
  if (!editingPatientId || !draftPatient.id) {
    return;
  }

  const index = state.patients.findIndex((patient) => patient.id === editingPatientId);
  if (index < 0) {
    return;
  }

  draftPatient.updatedAt = new Date().toISOString();
  const normalized = normalizePatient(draftPatient);
  state.patients[index] = normalized;
  draftPatient = deepClone(normalized);
  persistState();
  renderPatientTable();
  renderUpcomingAppointments();
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
    version: 3,
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

function syncDraftClinicalRecordFields() {
  draftPatient.clinicalRecordType = normalizeClinicalRecordType(el.clinicalRecordType.value);
  draftPatient.clinicalRecordReference = stringOrEmpty(el.clinicalRecordReference.value);
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
  syncDraftClinicalRecordFields();
  draftPatient.consultationDate = stringOrEmpty(el.consultationDate.value);
  draftPatient.nextConsultationDate = stringOrEmpty(el.nextConsultationDate.value);
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
  el.clinicalRecordType.value = normalizeClinicalRecordType(draftPatient.clinicalRecordType);
  el.clinicalRecordReference.value = draftPatient.clinicalRecordReference || "";
  el.consultationDate.value = draftPatient.consultationDate || "";
  el.nextConsultationDate.value = draftPatient.nextConsultationDate || "";
  el.treatmentStart.value = draftPatient.treatmentStart || "";
  el.brushTimes.value = toInputNumber(draftPatient.brushTimes);
  el.flossHabit.value = draftPatient.flossHabit || "";
  el.hasCaries.value = draftPatient.hasCaries || "";
  el.otherConditions.value = draftPatient.otherConditions || "";
}

function focusPathologiesSection() {
  setActiveView("home");
  if (!el.pathologiesCard) {
    return;
  }
  el.pathologiesCard.scrollIntoView({ behavior: "smooth", block: "start" });
  el.pathologiesCard.classList.remove("focus-flash");
  void el.pathologiesCard.offsetWidth;
  el.pathologiesCard.classList.add("focus-flash");
  window.setTimeout(() => {
    el.pathologiesCard.classList.remove("focus-flash");
  }, 1300);
  setFeedback("Seccion de patologias lista para editar.");
}

async function downloadClinicalDocument() {
  syncDraftFromForm();
  ensureDraftOdontogram();

  if (!draftPatient.name) {
    setFeedback("Primero captura el nombre del paciente para generar el PDF.", "error");
    el.patientName.focus();
    return;
  }

  try {
    const { blob, fileName, recordType } = await requestOfficialClinicalPdf();
    const link = document.createElement("a");
    const objectUrl = URL.createObjectURL(blob);
    link.href = objectUrl;
    link.download = fileName || `${sanitizeFileName(draftPatient.name || "paciente")}-${recordType.id}.pdf`;
    link.click();
    URL.revokeObjectURL(objectUrl);
    persistDraftPatientIfEditing();
    setFeedback(`PDF oficial "${recordType.label}" generado correctamente.`);
  } catch (error) {
    console.error(error);
    setFeedback(error.message || "No se pudo generar el PDF oficial.", "error");
  }
}

async function printClinicalDocument() {
  syncDraftFromForm();
  ensureDraftOdontogram();

  if (!draftPatient.name) {
    setFeedback("Primero captura el nombre del paciente para imprimir el PDF.", "error");
    el.patientName.focus();
    return;
  }

  let objectUrl = "";
  const recordType = getClinicalRecordTypeById(draftPatient.clinicalRecordType);
  try {
    const result = await requestOfficialClinicalPdf();
    objectUrl = URL.createObjectURL(result.blob);
    const printWindow = window.open(objectUrl, "_blank", "noopener,noreferrer");
    if (!printWindow) {
      URL.revokeObjectURL(objectUrl);
      setFeedback("No se pudo abrir la ventana de impresion. Revisa el bloqueo de ventanas emergentes.", "error");
      return;
    }

    window.setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch (error) {
        console.error(error);
      } finally {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
      }
    }, 650);

    persistDraftPatientIfEditing();
    setFeedback(`PDF oficial de ${recordType.label} abierto para impresion.`);
  } catch (error) {
    console.error(error);
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
    setFeedback(error.message || "No se pudo preparar el PDF para imprimir.", "error");
  }
}

function getClinicalRecordTypeById(id) {
  return CLINICAL_RECORD_TYPES.find((type) => type.id === id) || CLINICAL_RECORD_TYPES[0];
}

async function requestOfficialClinicalPdf() {
  if (!apiBaseUrl) {
    throw new Error("Para llenar el PDF oficial debes abrir la app desde el backend (http://localhost:3001).");
  }

  const recordType = getClinicalRecordTypeById(draftPatient.clinicalRecordType);
  const payload = {
    formatId: recordType.id,
    patient: normalizePatient(draftPatient),
    dictionaries: {
      diseases: Array.isArray(state.diseases) ? state.diseases : [],
      toothStatuses: Array.isArray(state.toothStatuses) ? state.toothStatuses : []
    }
  };

  const response = await apiRequest(
    "/api/clinical-pdf",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    },
    35000
  );

  if (!response.ok) {
    let detail = "";
    try {
      const data = await response.json();
      detail = data?.error || data?.detail || "";
    } catch {
      detail = await response.text();
    }
    throw new Error(detail || "El backend no pudo generar el PDF oficial.");
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get("content-disposition") || "";
  const fileName = extractFilenameFromDisposition(contentDisposition);
  return { blob, fileName, recordType };
}

function extractFilenameFromDisposition(disposition) {
  const value = String(disposition || "");
  const utfMatch = value.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch && utfMatch[1]) {
    try {
      return decodeURIComponent(utfMatch[1]).replace(/["']/g, "");
    } catch {
      return utfMatch[1].replace(/["']/g, "");
    }
  }
  const match = value.match(/filename=\"?([^\";]+)\"?/i);
  return match && match[1] ? match[1].trim() : "";
}

function sanitizeFileName(value) {
  return String(value || "archivo")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "archivo";
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
  const date = parseDateValue(dateString);
  if (!date) {
    return "-";
  }
  return date.toLocaleDateString("es-MX");
}

function formatDateTime(dateString) {
  if (!dateString) {
    return "-";
  }
  const date = new Date(dateString);
  if (Number.isNaN(date.valueOf())) {
    return "-";
  }
  return date.toLocaleString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getTodayInputDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getStartOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function getNextAppointmentForPatient(patient) {
  const appointments = normalizeAppointments(patient?.appointments);
  const now = Date.now();
  const todayStart = getStartOfToday().getTime();
  for (const appointment of appointments) {
    const info = getAppointmentDateInfo(appointment.date, appointment.time);
    if (!info) {
      continue;
    }
    const threshold = info.hasTime ? now : todayStart;
    if (info.timestamp >= threshold) {
      return appointment;
    }
  }
  return null;
}

function getNextConsultationDateForPatient(patient) {
  const dateValue = stringOrEmpty(patient?.nextConsultationDate);
  if (!dateValue) {
    return "";
  }
  const info = getAppointmentDateInfo(dateValue, "");
  if (!info) {
    return "";
  }
  const todayStart = getStartOfToday().getTime();
  return info.timestamp >= todayStart ? dateValue : "";
}

function parseDateValue(value) {
  const raw = stringOrEmpty(value);
  if (!raw) {
    return null;
  }

  const text = raw.trim();

  const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:$|[T\s].*)/);
  if (isoMatch) {
    return buildLocalDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
  }

  const latinMatch = text.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})(?:$|[T\s].*)/);
  if (latinMatch) {
    return buildLocalDate(Number(latinMatch[3]), Number(latinMatch[2]), Number(latinMatch[1]));
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.valueOf())) {
    return null;
  }
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function buildLocalDate(year, month, day) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function parseTimeParts(value) {
  const raw = stringOrEmpty(value);
  if (!raw) {
    return { hours: 0, minutes: 0, hasTime: false };
  }

  const match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return { hours: 0, minutes: 0, hasTime: false };
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return { hours: 0, minutes: 0, hasTime: false };
  }
  return { hours, minutes, hasTime: true };
}

function getAppointmentDateInfo(dateValue, timeValue) {
  const date = parseDateValue(dateValue);
  if (!date) {
    return null;
  }

  const time = parseTimeParts(timeValue);
  const dateTime = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    time.hours,
    time.minutes,
    0,
    0
  );

  return {
    timestamp: dateTime.getTime(),
    hasTime: time.hasTime
  };
}

function getAppointmentTimestamp(dateValue, timeValue) {
  const info = getAppointmentDateInfo(dateValue, timeValue);
  return info ? info.timestamp : null;
}

function isValidDate(value) {
  if (!value) {
    return false;
  }
  const date = new Date(value);
  return !Number.isNaN(date.valueOf());
}

function addHistoryEntry(entry) {
  if (!Array.isArray(draftPatient.historyEntries)) {
    draftPatient.historyEntries = [];
  }

  const normalizedEntry = {
    id: generateId("hist"),
    type: stringOrEmpty(entry?.type) || "clinical-note",
    title: stringOrEmpty(entry?.title) || "Registro clinico",
    description: stringOrEmpty(entry?.description),
    createdAt: isValidDate(entry?.createdAt) ? entry.createdAt : new Date().toISOString(),
    statusIds: normalizeHistoryStatusIds(entry?.statusIds)
  };

  draftPatient.historyEntries.unshift(normalizedEntry);

  if (draftPatient.historyEntries.length > 900) {
    draftPatient.historyEntries = draftPatient.historyEntries.slice(0, 900);
  }
}

function getHistoryTypeLabel(type) {
  if (type === "odontogram-change") {
    return "Odontograma";
  }
  if (type === "clinical-note") {
    return "Nota clinica";
  }
  return "Historial";
}

function getOdontoTargetLabel(bucket, key) {
  if (bucket === "teeth") {
    return `pieza ${key}`;
  }
  const zone = ODONTO_ZONES.find((entry) => entry.id === key);
  return zone ? `zona ${zone.name}` : `zona ${key}`;
}

function resetClinicalNoteInputs() {
  el.clinicalNoteDate.value = getTodayInputDate();
  el.clinicalNoteTitle.value = "";
  el.clinicalNoteText.value = "";
}

function resetAppointmentInputs() {
  el.appointmentDate.value = getTodayInputDate();
  el.appointmentTime.value = "";
  el.appointmentReason.value = "";
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
