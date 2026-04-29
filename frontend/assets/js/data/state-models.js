function createBaseState() {
  return {
    diseases: deepClone(DEFAULT_DISEASES),
    toothStatuses: deepClone(DEFAULT_TOOTH_STATUSES),
    patients: [],
    externalAppointments: []
  };
}

function createEmptyClinicalFormData() {
  const data = {};
  for (const recordType of CLINICAL_RECORD_TYPES) {
    data[recordType.id] = {};
  }
  return data;
}

function createEmptyPatient() {
  return {
    id: null,
    name: "",
    lastNameFather: "",
    lastNameMother: "",
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
    otherConditions: "",
    clinicalFormData: createEmptyClinicalFormData(),
    diseaseIds: [],
    appointments: [],
    mediaEntries: [],
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
  const cleaned = removeDeprecatedDiseases(diseases, patients);

  return {
    diseases: cleaned.diseases,
    toothStatuses,
    patients: cleaned.patients,
    externalAppointments: normalizeExternalAppointments(raw?.externalAppointments)
  };
}

function normalizeDiseaseFilterToken(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function removeDeprecatedDiseases(diseases, patients) {
  const blockedIds = new Set();
  const filteredDiseases = [];

  for (const disease of Array.isArray(diseases) ? diseases : []) {
    const token = normalizeDiseaseFilterToken(disease?.name);
    if (REMOVED_DISEASE_NAME_TOKENS.has(token)) {
      if (typeof disease?.id === "string" && disease.id.trim()) {
        blockedIds.add(disease.id.trim());
      }
      continue;
    }
    filteredDiseases.push(disease);
  }

  if (blockedIds.size === 0) {
    return {
      diseases: filteredDiseases,
      patients: Array.isArray(patients) ? patients : []
    };
  }

  const filteredPatients = (Array.isArray(patients) ? patients : []).map((patient) => ({
    ...patient,
    diseaseIds: Array.isArray(patient?.diseaseIds)
      ? patient.diseaseIds.filter((diseaseId) => !blockedIds.has(diseaseId))
      : []
  }));

  return {
    diseases: filteredDiseases,
    patients: filteredPatients
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
  patient.lastNameFather = stringOrEmpty(patient.lastNameFather || patient.surnameFather || patient.apellidoPaterno);
  patient.lastNameMother = stringOrEmpty(patient.lastNameMother || patient.surnameMother || patient.apellidoMaterno);
  if (!patient.lastNameFather && !patient.lastNameMother && patient.name) {
    const inferredName = splitClinicalFullName(patient.name);
    if (inferredName.lastNameFather || inferredName.lastNameMother) {
      patient.name = inferredName.firstNames || patient.name;
      patient.lastNameFather = inferredName.lastNameFather;
      patient.lastNameMother = inferredName.lastNameMother;
    }
  }
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
  patient.clinicalFormData = normalizeClinicalFormData(
    patient.clinicalFormData || patient.clinicalForms || patient.formDataByType
  );
  patient.consultationDate = stringOrEmpty(patient.consultationDate);
  patient.nextConsultationDate = stringOrEmpty(
    patient.nextConsultationDate || patient.nextConsultation || patient.followUpDate
  );
  patient.treatmentStart = stringOrEmpty(patient.treatmentStart);
  patient.flossHabit = stringOrEmpty(patient.flossHabit);
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
  patient.mediaEntries = normalizePatientMediaEntries(patient.mediaEntries || patient.images || patient.media);

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
    const startTime = stringOrEmpty(item?.startTime || item?.time);
    const endTime = stringOrEmpty(item?.endTime);

    appointments.push({
      id: stringOrEmpty(item?.id) || generateId("apt"),
      date,
      time: startTime,
      startTime,
      endTime,
      reason: stringOrEmpty(item?.reason)
    });
  }

  appointments.sort((a, b) => {
    const aTs = getAppointmentTimestamp(a.date, getAppointmentStartTime(a));
    const bTs = getAppointmentTimestamp(b.date, getAppointmentStartTime(b));
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


function normalizeExternalAppointments(rawAppointments) {
  if (!Array.isArray(rawAppointments)) {
    return [];
  }

  const entries = [];
  for (const item of rawAppointments) {
    const date = stringOrEmpty(item?.date);
    const patientName = stringOrEmpty(item?.patientName);
    if (!date || !patientName) {
      continue;
    }
    const startTime = stringOrEmpty(item?.startTime || item?.time);
    const endTime = stringOrEmpty(item?.endTime);

    entries.push({
      id: stringOrEmpty(item?.id) || generateId("ext-apt"),
      patientName,
      dentistName: stringOrEmpty(item?.dentistName),
      date,
      time: startTime,
      startTime,
      endTime,
      reason: stringOrEmpty(item?.reason)
    });
  }

  entries.sort((a, b) => {
    const aTs = getAppointmentTimestamp(a.date, getAppointmentStartTime(a));
    const bTs = getAppointmentTimestamp(b.date, getAppointmentStartTime(b));
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

  return entries;
}
function normalizePatientMediaEntries(rawEntries) {
  if (!Array.isArray(rawEntries)) {
    return [];
  }

  const normalized = [];
  for (const entry of rawEntries) {
    const dataUrl = stringOrEmpty(entry?.dataUrl || entry?.url);
    if (!dataUrl || !dataUrl.startsWith("data:image/")) {
      continue;
    }
    const type = stringOrEmpty(entry?.type).toLowerCase() === "fotografia" ? "fotografia" : "radiografia";
    normalized.push({
      id: stringOrEmpty(entry?.id) || generateId("img"),
      type,
      name: stringOrEmpty(entry?.name) || "imagen-clinica",
      dataUrl,
      createdAt: isValidDate(entry?.createdAt) ? String(entry.createdAt) : new Date().toISOString()
    });
  }

  normalized.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return normalized.slice(0, 80);
}

function normalizeClinicalRecordType(value) {
  const candidate = stringOrEmpty(value);
  if (!candidate) {
    return CLINICAL_RECORD_TYPES[0].id;
  }
  const exists = CLINICAL_RECORD_TYPES.some((type) => type.id === candidate);
  return exists ? candidate : CLINICAL_RECORD_TYPES[0].id;
}

function getClinicalFormSchema(formatId) {
  const safeId = normalizeClinicalRecordType(formatId);
  return CLINICAL_FORM_SCHEMAS[safeId] || CLINICAL_FORM_SCHEMAS[CLINICAL_RECORD_TYPES[0].id];
}

function normalizeClinicalFormData(rawData) {
  const base = createEmptyClinicalFormData();
  const source = rawData && typeof rawData === "object" ? rawData : {};

  for (const type of CLINICAL_RECORD_TYPES) {
    const typeId = type.id;
    const schema = getClinicalFormSchema(typeId);
    const entry = source[typeId];
    const normalized = {};

    for (const field of schema.fields) {
      normalized[field.id] = stringOrEmpty(entry?.[field.id]);
    }
    base[typeId] = normalized;
  }

  return base;
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

function resolveStaticAssetUrl(relativePath) {
  const asset = String(relativePath || "").replace(/^\.?\//, "");
  if (!asset) {
    return window.location.href;
  }

  if (window.location.hostname.endsWith("github.io")) {
    const parts = String(window.location.pathname || "/").split("/").filter(Boolean);
    const repoSegment = parts.length > 0 ? parts[0] : "";
    const basePath = repoSegment ? `/${repoSegment}/` : "/";
    return `${window.location.origin}${basePath}${asset}`;
  }

  return new URL(asset, document.baseURI).toString();
}

async function initializeBackendStorage() {
  if (!apiBaseUrl) {
    return;
  }
  if (!authToken) {
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
      if (stateResponse.status === 401 || stateResponse.status === 403) {
        storageMode = "local";
        setFeedback("Tu sesión no está autorizada para leer datos del backend.", "error");
        return;
      }
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
    const requestOptions = options && typeof options === "object" ? { ...options } : {};
    const headers = new Headers(requestOptions.headers || {});
    if (authToken && pathname.startsWith("/api/") && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${authToken}`);
    }
    requestOptions.headers = headers;

    return await fetch(`${apiBaseUrl}${pathname}`, {
      ...requestOptions,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}
