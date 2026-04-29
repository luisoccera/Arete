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
