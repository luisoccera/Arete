function setFormTitle() {
  if (editingPatientId) {
    el.formTitle.textContent = `Editando paciente: ${getPatientFullName(draftPatient) || "Sin nombre"}`;
  } else {
    el.formTitle.textContent = "Nuevo paciente";
  }
}

function getPatientFullName(patientInput) {
  const patient = patientInput || {};
  const firstNames = stringOrEmpty(patient.name);
  const lastFather = stringOrEmpty(patient.lastNameFather);
  const lastMother = stringOrEmpty(patient.lastNameMother);
  const full = [firstNames, lastFather, lastMother].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  if (full) {
    return full;
  }
  return firstNames || stringOrEmpty(patient.fullName) || "Sin nombre";
}

function getDiseaseById(id) {
  return state.diseases.find((disease) => disease.id === id) || null;
}

function getStatusById(id) {
  return state.toothStatuses.find((status) => status.id === id) || null;
}

function shouldReuseClinicalContextKey(key) {
  const safeKey = stringOrEmpty(key);
  return Boolean(safeKey) && CLINICAL_REUSABLE_CONTEXT_KEYS.has(safeKey);
}

function setFeedback(text, mode) {
  el.feedbackMessage.textContent = text;
  el.feedbackMessage.dataset.mode = mode || "ok";
}

function calculateAgeBreakdownFromDate(dateString) {
  const birthDate = parseDateValue(dateString);
  if (!birthDate) {
    return null;
  }

  const today = new Date();
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const birthOnly = new Date(birthDate.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  if (birthOnly.getTime() > todayOnly.getTime()) {
    return null;
  }

  let years = todayOnly.getFullYear() - birthOnly.getFullYear();
  let months = todayOnly.getMonth() - birthOnly.getMonth();
  if (todayOnly.getDate() < birthOnly.getDate()) {
    months -= 1;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years < 0) {
    return null;
  }

  return { years, months };
}

function calculateAgeFromDate(dateString) {
  const breakdown = calculateAgeBreakdownFromDate(dateString);
  return breakdown ? breakdown.years : NaN;
}

function capitalizeFirstLetter(text, locale = "es-MX") {
  const safe = String(text || "").trim();
  if (!safe) {
    return "";
  }
  return safe.charAt(0).toLocaleUpperCase(locale) + safe.slice(1);
}

function formatMonthYearLabel(date, locale = "es-MX") {
  if (!(date instanceof Date) || Number.isNaN(date.valueOf())) {
    return "";
  }
  const raw = date.toLocaleDateString(locale, {
    month: "long",
    year: "numeric"
  });
  return capitalizeFirstLetter(raw, locale);
}

function formatFullDateLabel(date, locale = "es-MX") {
  if (!(date instanceof Date) || Number.isNaN(date.valueOf())) {
    return "";
  }
  const raw = date.toLocaleDateString(locale, {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
  return capitalizeFirstLetter(raw, locale);
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

function formatDateToInputValue(date) {
  if (!(date instanceof Date) || Number.isNaN(date.valueOf())) {
    return "";
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function normalizeDateInputValue(value) {
  const parsed = parseDateValue(value);
  if (!parsed) {
    return "";
  }
  return formatDateToInputValue(parsed);
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
    const info = getAppointmentDateInfo(appointment.date, getAppointmentStartTime(appointment));
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

function getOdontogramTemplatesMap() {
  const fallback = {
    anatomic: {
      label: "Anatomico por pieza",
      centerSuffix: "anatomico",
      hint: "Plantilla anatomica por pieza con morfologia individual."
    },
    grid: {
      label: "Indice de higiene (cuadros)",
      centerSuffix: "indice de higiene",
      hint: "Plantilla en cuadros tipo indice de higiene para marcado rapido."
    },
    classic: {
      label: "Clinico lineal",
      centerSuffix: "clinico lineal",
      hint: "Plantilla lineal clasica con lineado clinico tradicional."
    }
  };

  if (typeof ODONTOGRAM_TEMPLATES === "undefined" || !ODONTOGRAM_TEMPLATES || typeof ODONTOGRAM_TEMPLATES !== "object") {
    return fallback;
  }
  const keys = Object.keys(ODONTOGRAM_TEMPLATES);
  if (keys.length === 0) {
    return fallback;
  }
  return ODONTOGRAM_TEMPLATES;
}

function isValidOdontogramTemplate(template) {
  const templates = getOdontogramTemplatesMap();
  return Object.prototype.hasOwnProperty.call(templates, template);
}

function getCurrentOdontogramTemplate() {
  const templates = getOdontogramTemplatesMap();
  const template = stringOrEmpty(draftPatient.odontogramTemplate || "anatomic");
  if (isValidOdontogramTemplate(template)) {
    return template;
  }
  const firstKey = Object.keys(templates)[0];
  return firstKey || "anatomic";
}

function getToothPositionInfo(toothNumber) {
  const n = Number(toothNumber);
  const quadrant = Number.isFinite(n) ? Math.floor(n / 10) : 0;
  const unit = Number.isFinite(n) ? n % 10 : 0;
  const isUpper = quadrant === 1 || quadrant === 2 || quadrant === 5 || quadrant === 6;
  const isLeft = quadrant === 2 || quadrant === 3 || quadrant === 6 || quadrant === 7;
  return { quadrant, unit, isUpper, isLeft };
}

function getToothRenderSpec(toothNumber, mode) {
  const info = getToothPositionInfo(toothNumber);
  const map = mode === "child" ? CHILD_TOOTH_RENDER_MAP : ADULT_TOOTH_RENDER_MAP;
  const unitSpec = map[info.unit] || map[1];
  const sideSpec = info.isUpper ? unitSpec.upper : unitSpec.lower;

  return {
    path: sideSpec.path,
    width: sideSpec.width,
    height: sideSpec.height,
    mirror: info.isLeft
  };
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
