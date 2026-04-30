function startNewPatient(showMessage) {
  editingPatientId = null;
  draftPatient = createEmptyPatient();
  setActivePatientSubview("profile");
  hydrateFormFromDraft();
  setFormTitle();
  renderPatientTable();
  renderUpcomingAppointments();
  renderDentitionSwitch();
  renderDiseaseChecklist();
  renderOdontogram();
  renderAppointmentList();
  renderPatientMedia();
  renderClinicalCyclePanel();
  renderPatientHistory();
  resetAppointmentInputs();
  resetPatientMediaInput();
  resetClinicalNoteInputs();
  updateDeleteCurrentButtonState();

  if (showMessage) {
    setFeedback("Formulario listo para un nuevo paciente.");
  }
}

function ensureDraftClinicalEpisodeState() {
  draftPatient.clinicalRecordType = normalizeClinicalRecordType(
    draftPatient.clinicalRecordType || el.clinicalRecordType?.value
  );
  draftPatient.clinicalEpisodes = normalizeClinicalEpisodes(draftPatient.clinicalEpisodes);
  draftPatient.activeClinicalEpisodeId = stringOrEmpty(draftPatient.activeClinicalEpisodeId);

  if (draftPatient.clinicalEpisodes.length === 0) {
    draftPatient.activeClinicalEpisodeId = "";
    return;
  }

  const hasActive = draftPatient.clinicalEpisodes.some(
    (episode) => episode.id === draftPatient.activeClinicalEpisodeId
  );
  if (!hasActive) {
    const fallbackEpisode = getMostRelevantClinicalEpisode(draftPatient.clinicalEpisodes) || draftPatient.clinicalEpisodes[0];
    draftPatient.activeClinicalEpisodeId = fallbackEpisode ? fallbackEpisode.id : "";
  }
}

function getDraftActiveClinicalEpisode() {
  ensureDraftClinicalEpisodeState();
  if (!draftPatient.activeClinicalEpisodeId) {
    return null;
  }
  return draftPatient.clinicalEpisodes.find((episode) => episode.id === draftPatient.activeClinicalEpisodeId) || null;
}

function createClinicalEpisode(formatId, openedAtInput) {
  ensureDraftClinicalEpisodeState();
  const safeFormatId = normalizeClinicalRecordType(formatId || draftPatient.clinicalRecordType);
  const openedAt = isValidDate(openedAtInput) ? String(openedAtInput) : new Date().toISOString();
  const expiresAt = addMonthsToIsoDate(openedAt, 6);
  const typeLabel = getClinicalRecordTypeById(safeFormatId).label;

  const newEpisode = {
    id: generateId("cycle"),
    formatId: safeFormatId,
    openedAt,
    expiresAt,
    status: "activa",
    title: typeLabel
  };

  draftPatient.clinicalEpisodes = [newEpisode, ...draftPatient.clinicalEpisodes].slice(0, 6);
  draftPatient.activeClinicalEpisodeId = newEpisode.id;
  draftPatient.clinicalRecordType = safeFormatId;
  if (el.clinicalRecordType) {
    el.clinicalRecordType.value = safeFormatId;
  }
  return newEpisode;
}

function ensureClinicalEpisodeForCurrentPatient(options = {}) {
  ensureDraftClinicalEpisodeState();
  const forceRenew = Boolean(options.forceRenew);
  const preferredFormat = normalizeClinicalRecordType(
    options.preferredFormatId || el.clinicalRecordType?.value || draftPatient.clinicalRecordType
  );

  let activeEpisode = getDraftActiveClinicalEpisode();
  const wasExpired = activeEpisode ? isClinicalEpisodeExpired(activeEpisode, Date.now()) : false;
  let created = false;

  if (forceRenew || !activeEpisode || wasExpired) {
    activeEpisode = createClinicalEpisode(preferredFormat);
    created = true;
  }

  if (activeEpisode) {
    draftPatient.activeClinicalEpisodeId = activeEpisode.id;
    draftPatient.clinicalRecordType = normalizeClinicalRecordType(activeEpisode.formatId || preferredFormat);
    if (el.clinicalRecordType) {
      el.clinicalRecordType.value = draftPatient.clinicalRecordType;
    }
  }

  return {
    episode: activeEpisode,
    created,
    wasExpired
  };
}

function openClinicalHistoryForCurrentPatient(forceRenew) {
  syncDraftFromForm();

  if (!draftPatient.name) {
    setActivePatientSubview("profile");
    setFeedback("Primero captura el nombre del paciente para abrir su historia clínica.", "error");
    el.patientName.focus();
    return;
  }

  const result = ensureClinicalEpisodeForCurrentPatient({ forceRenew: Boolean(forceRenew) });
  if (!result.episode) {
    setFeedback("No se pudo abrir la historia clínica del paciente.", "error");
    return;
  }

  if (result.created) {
    const formatLabel = getClinicalRecordTypeById(result.episode.formatId).label;
    addHistoryEntry({
      type: "clinical-note",
      title: `Historia clínica iniciada (${formatLabel})`,
      description: `Se abrió un ciclo con vigencia de 6 meses (hasta ${formatDate(result.episode.expiresAt)}).`
    });
  }

  renderClinicalFormatFields();
  renderClinicalCyclePanel();
  renderPatientHistory();
  setActivePatientSubview("history");
  persistDraftPatientIfEditing();
  setFeedback(
    result.created
      ? `Historia clínica abierta. Vigencia hasta ${formatDate(result.episode.expiresAt)}.`
      : `Historia clínica activa (${getClinicalRecordTypeById(result.episode.formatId).label}).`
  );
}

function openClinicalCycleById(cycleId) {
  const safeCycleId = stringOrEmpty(cycleId);
  if (!safeCycleId) {
    return;
  }

  syncDraftFromForm();
  ensureDraftClinicalEpisodeState();
  const target = draftPatient.clinicalEpisodes.find((episode) => episode.id === safeCycleId);
  if (!target) {
    setFeedback("No se encontró el ciclo clínico seleccionado.", "error");
    return;
  }

  draftPatient.activeClinicalEpisodeId = target.id;
  draftPatient.clinicalRecordType = normalizeClinicalRecordType(target.formatId || draftPatient.clinicalRecordType);
  if (el.clinicalRecordType) {
    el.clinicalRecordType.value = draftPatient.clinicalRecordType;
  }

  renderClinicalFormatFields();
  renderClinicalCyclePanel();
  setActivePatientSubview("history");
  persistDraftPatientIfEditing();
  const expired = isClinicalEpisodeExpired(target, Date.now());
  setFeedback(
    expired
      ? `Ciclo abierto (vencido desde ${formatDate(target.expiresAt)}). Puedes renovarlo para un nuevo periodo de 6 meses.`
      : `Ciclo clínico vigente abierto (hasta ${formatDate(target.expiresAt)}).`
  );
}

function savePatient() {
  syncDraftFromForm();
  ensureDraftOdontogram();
  ensureDraftClinicalEpisodeState();

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
  renderHomeOverview();
  renderPatientTable();
  renderUpcomingAppointments();
  renderDentitionSwitch();
  renderAppointmentList();
  renderPatientMedia();
  renderClinicalCyclePanel();
  renderPatientHistory();
  resetAppointmentInputs();
  resetPatientMediaInput();
  updateDeleteCurrentButtonState();
  setFormTitle();
  setFeedback(`Paciente ${getPatientFullName(normalized)} guardado correctamente.`);
}

function deletePatient(id) {
  const patient = state.patients.find((entry) => entry.id === id);
  if (!patient) {
    return;
  }

  const approved = window.confirm(`Se eliminara el paciente "${getPatientFullName(patient)}". Esta accion no se puede deshacer.`);
  if (!approved) {
    return;
  }

  state.patients = state.patients.filter((entry) => entry.id !== id);
  persistState();

  if (editingPatientId === id) {
    startNewPatient(false);
  }
  renderHomeOverview();
  renderPatientTable();
  renderUpcomingAppointments();
  renderClinicalCyclePanel();
  renderPatientHistory();
  updateDeleteCurrentButtonState();
  setFeedback(`Paciente ${getPatientFullName(patient)} eliminado.`);
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
    startTime: time,
    endTime: "",
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

function splitPlannerPatientName(fullNameInput) {
  const safe = stringOrEmpty(fullNameInput).replace(/\s+/g, " ").trim();
  if (!safe) {
    return {
      firstNames: "",
      lastNameFather: "",
      lastNameMother: ""
    };
  }
  const words = safe.split(" ").filter(Boolean);
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

function countAllScheduledAppointments() {
  return state.patients.reduce((total, patient) => {
    const count = Array.isArray(patient?.appointments) ? patient.appointments.length : 0;
    return total + count;
  }, 0);
}

function addQuickAppointmentFromPlanner() {
  if (!el.quickAppointmentPatient || !el.quickAppointmentDate || !el.quickAppointmentStartTime || !el.quickAppointmentEndTime) {
    return;
  }

  const patientName = stringOrEmpty(el.quickAppointmentPatient.value);
  const date = stringOrEmpty(el.quickAppointmentDate.value);
  const start = stringOrEmpty(el.quickAppointmentStartTime.value);
  const end = stringOrEmpty(el.quickAppointmentEndTime.value);
  const reason = stringOrEmpty(el.quickAppointmentReason?.value);

  if (!patientName || !date || !start || !end) {
    setFeedback("Completa paciente, fecha, inicio y fin para guardar la cita.", "error");
    return;
  }

  const before = countAllScheduledAppointments();
  el.globalAppointmentPatient.value = patientName;
  el.globalAppointmentDate.value = date;
  el.globalAppointmentStartTime.value = start;
  el.globalAppointmentEndTime.value = end;
  if (el.globalAppointmentReason) {
    el.globalAppointmentReason.value = reason;
  }

  addAppointmentFromUpcomingPlanner();

  const after = countAllScheduledAppointments();
  if (after > before) {
    el.quickAppointmentStartTime.value = "";
    el.quickAppointmentEndTime.value = "";
    if (el.quickAppointmentReason) {
      el.quickAppointmentReason.value = "";
    }
    syncQuickAppointmentPatientInput();
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) {
        reject(new Error("No se pudo leer el archivo."));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => {
      reject(new Error("No se pudo leer el archivo seleccionado."));
    };
    reader.readAsDataURL(file);
  });
}

async function handleScannedFileInputChange(inputElement, sourceLabel) {
  const input = inputElement;
  if (!input || !input.files || input.files.length === 0) {
    return;
  }
  const file = input.files[0];
  input.value = "";
  await addScannedDocumentFromFile(file, sourceLabel);
}

async function addScannedDocumentFromFile(file, sourceLabel) {
  if (!file) {
    return;
  }
  if (file.size > 12 * 1024 * 1024) {
    setFeedback("El archivo es muy grande. Máximo permitido: 12 MB.", "error");
    return;
  }

  try {
    const dataUrl = await readFileAsDataUrl(file);
    if (!Array.isArray(state.scannedDocuments)) {
      state.scannedDocuments = [];
    }

    state.scannedDocuments.unshift({
      id: generateId("scan"),
      name: stringOrEmpty(file.name) || `documento-${new Date().toISOString().slice(0, 10)}`,
      mimeType: stringOrEmpty(file.type) || "application/octet-stream",
      size: Number(file.size) || 0,
      dataUrl,
      source: stringOrEmpty(sourceLabel) || "archivo",
      createdAt: new Date().toISOString()
    });
    state.scannedDocuments = normalizeScannedDocuments(state.scannedDocuments);
    persistState();
    renderScannedDocuments();
    setFeedback(`Documento guardado: ${file.name}`);
  } catch (error) {
    console.error(error);
    setFeedback("No se pudo guardar el documento escaneado.", "error");
  }
}

function openScannedDocument(documentId) {
  const safeId = stringOrEmpty(documentId);
  if (!safeId || !Array.isArray(state.scannedDocuments)) {
    return;
  }
  const doc = state.scannedDocuments.find((entry) => entry.id === safeId);
  if (!doc || !stringOrEmpty(doc.dataUrl)) {
    return;
  }
  const link = document.createElement("a");
  link.href = doc.dataUrl;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.download = stringOrEmpty(doc.name) || "documento";
  link.click();
}

function removeScannedDocument(documentId) {
  const safeId = stringOrEmpty(documentId);
  if (!safeId || !Array.isArray(state.scannedDocuments)) {
    return;
  }
  const found = state.scannedDocuments.find((entry) => entry.id === safeId);
  if (!found) {
    return;
  }

  const approved = window.confirm(`Se eliminará "${found.name}". ¿Deseas continuar?`);
  if (!approved) {
    return;
  }

  state.scannedDocuments = state.scannedDocuments.filter((entry) => entry.id !== safeId);
  persistState();
  renderScannedDocuments();
  setFeedback("Documento eliminado.");
}

function addAppointmentFromUpcomingPlanner() {
  const title = stringOrEmpty(el.globalAppointmentTitle?.value);
  const inputPatientName = stringOrEmpty(el.globalAppointmentPatient?.value);
  const date = stringOrEmpty(el.globalAppointmentDate?.value);
  const startTime = stringOrEmpty(el.globalAppointmentStartTime?.value);
  const endTime = stringOrEmpty(el.globalAppointmentEndTime?.value);
  const reason = stringOrEmpty(el.globalAppointmentReason?.value) || title;
  let createdFromPlanner = false;
  let targetPatientId = "";

  if (!inputPatientName) {
    setFeedback("Escribe el nombre del paciente para agendar la cita.", "error");
    el.globalAppointmentPatient?.focus();
    return;
  }
  if (!date) {
    setFeedback("Selecciona la fecha de la cita.", "error");
    el.globalAppointmentDate?.focus();
    return;
  }
  if (!startTime) {
    setFeedback("Define la hora de inicio de la cita.", "error");
    el.globalAppointmentStartTime?.focus();
    return;
  }
  if (!endTime) {
    setFeedback("Define la hora de finalización de la cita.", "error");
    el.globalAppointmentEndTime?.focus();
    return;
  }

  const startParts = parseTimeParts(startTime);
  const endParts = parseTimeParts(endTime);
  if (!startParts.hasTime || !endParts.hasTime) {
    setFeedback("El formato de hora no es válido.", "error");
    return;
  }
  const startMinutes = startParts.hours * 60 + startParts.minutes;
  const endMinutes = endParts.hours * 60 + endParts.minutes;
  if (endMinutes <= startMinutes) {
    setFeedback("La hora de finalización debe ser mayor a la hora de inicio.", "error");
    el.globalAppointmentEndTime?.focus();
    return;
  }

  const matchedPatient = syncGlobalAppointmentPatientInput();
  if (matchedPatient?.id) {
    targetPatientId = matchedPatient.id;
  } else {
    const parsedName = splitPlannerPatientName(inputPatientName);
    if (!parsedName.firstNames) {
      setFeedback("No se pudo interpretar el nombre del paciente.", "error");
      el.globalAppointmentPatient?.focus();
      return;
    }
    const now = new Date().toISOString();
    const newPatient = normalizePatient({
      ...createEmptyPatient(),
      id: generateId("pt"),
      name: parsedName.firstNames,
      lastNameFather: parsedName.lastNameFather,
      lastNameMother: parsedName.lastNameMother,
      consultationDate: date,
      nextConsultationDate: date,
      createdAt: now,
      updatedAt: now
    });
    state.patients.unshift(newPatient);
    targetPatientId = newPatient.id;
    createdFromPlanner = true;
    el.globalAppointmentPatient.value = getPatientFullName(newPatient);
  }

  const patientIndex = state.patients.findIndex((entry) => entry.id === targetPatientId);
  if (patientIndex < 0) {
    setFeedback("No se encontró el paciente seleccionado.", "error");
    return;
  }

  const patient = normalizePatient(state.patients[patientIndex]);
  if (!Array.isArray(patient.appointments)) {
    patient.appointments = [];
  }
  patient.appointments.push({
    id: generateId("apt"),
    date,
    time: startTime,
    startTime,
    endTime,
    reason
  });
  patient.appointments = normalizeAppointments(patient.appointments);
  patient.updatedAt = new Date().toISOString();

  state.patients[patientIndex] = patient;
  persistState();

  if (editingPatientId === patient.id) {
    draftPatient = deepClone(patient);
    hydrateFormFromDraft();
    renderAppointmentList();
  }

  upcomingSelectedDate = date;
  upcomingCalendarMonth = date.slice(0, 7);
  if (el.upcomingCalendarMonth) {
    el.upcomingCalendarMonth.value = upcomingCalendarMonth;
  }
  if (el.globalAppointmentDate) {
    el.globalAppointmentDate.value = date;
  }
  if (el.globalAppointmentStartTime) {
    el.globalAppointmentStartTime.value = "";
  }
  if (el.globalAppointmentEndTime) {
    el.globalAppointmentEndTime.value = "";
  }
  if (el.globalAppointmentReason) {
    el.globalAppointmentReason.value = "";
  }
  if (el.globalAppointmentTitle) {
    el.globalAppointmentTitle.value = "";
  }

  renderHomeOverview();
  renderPatientTable();
  renderUpcomingAppointments();
  renderUpcomingPlannerForm();
  renderUpcomingPlannerCalendar();
  setActiveUpcomingSubview("planner");
  setPlannerComposerVisible(false);
  if (createdFromPlanner) {
    setFeedback(`Paciente creado y cita agendada para ${getPatientFullName(patient)} el ${formatDate(date)} (${startTime} - ${endTime}).`);
    return;
  }
  setFeedback(`Cita agregada para ${getPatientFullName(patient)} el ${formatDate(date)} (${startTime} - ${endTime}).`);
}

function removeAppointmentFromPlanner(patientId, appointmentId) {
  const safePatientId = stringOrEmpty(patientId);
  const safeAppointmentId = stringOrEmpty(appointmentId);
  if (!safePatientId || !safeAppointmentId) {
    return;
  }

  const patientIndex = state.patients.findIndex((entry) => entry.id === safePatientId);
  if (patientIndex < 0) {
    return;
  }

  const patient = normalizePatient(state.patients[patientIndex]);
  const found = patient.appointments.find((entry) => entry.id === safeAppointmentId);
  if (!found) {
    return;
  }

  const approved = window.confirm("Se eliminará esta cita de la agenda central. ¿Deseas continuar?");
  if (!approved) {
    return;
  }

  patient.appointments = patient.appointments.filter((entry) => entry.id !== safeAppointmentId);
  patient.updatedAt = new Date().toISOString();
  state.patients[patientIndex] = patient;
  persistState();

  if (editingPatientId === patient.id) {
    draftPatient = deepClone(patient);
    hydrateFormFromDraft();
    renderAppointmentList();
  }

  renderHomeOverview();
  renderPatientTable();
  renderUpcomingAppointments();
  renderUpcomingPlannerForm();
  renderUpcomingPlannerCalendar();
  setFeedback("Cita eliminada de la agenda.");
}

function removeExternalAppointmentFromPlanner(appointmentId) {
  const safeAppointmentId = stringOrEmpty(appointmentId);
  if (!safeAppointmentId) {
    return;
  }
  if (!Array.isArray(state.externalAppointments)) {
    return;
  }

  const found = state.externalAppointments.find((entry) => entry.id === safeAppointmentId);
  if (!found) {
    return;
  }

  const approved = window.confirm("Se eliminará esta cita de paciente no registrado. ¿Deseas continuar?");
  if (!approved) {
    return;
  }

  state.externalAppointments = state.externalAppointments.filter((entry) => entry.id !== safeAppointmentId);
  persistState();

  renderHomeOverview();
  renderUpcomingAppointments();
  renderUpcomingPlannerForm();
  renderUpcomingPlannerCalendar();
  setFeedback("Cita de paciente no registrado eliminada.");
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
  renderHomeOverview();
  renderPatientTable();
  renderUpcomingAppointments();
  renderClinicalCyclePanel();
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
  ensureDraftClinicalFormData();
  ensureDraftClinicalSharedValues();
  ensureDraftClinicalEpisodeState();
  const activeEpisode = getDraftActiveClinicalEpisode();
  if (activeEpisode) {
    activeEpisode.formatId = draftPatient.clinicalRecordType;
    activeEpisode.title = getClinicalRecordTypeById(draftPatient.clinicalRecordType).label;
  }
}

function syncActiveClinicalFormatFieldsFromDom() {
  if (!el.clinicalFormatFields) {
    return;
  }
  ensureDraftClinicalFormData();
  ensureDraftClinicalSharedValues();
  const activeType = normalizeClinicalRecordType(
    el.clinicalRecordType?.value || draftPatient.clinicalRecordType
  );
  const bucket = draftPatient.clinicalFormData[activeType] || {};
  const schema = getClinicalFormSchema(activeType);

  for (const field of schema.fields) {
    const input = el.clinicalFormatFields.querySelector(`[data-clinical-field="${field.id}"]`);
    if (!input) {
      continue;
    }
    const value = stringOrEmpty(input.value);
    bucket[field.id] = value;
    const contextKey = stringOrEmpty(field?.contextKey);
    if (contextKey && shouldReuseClinicalContextKey(contextKey)) {
      if (value) {
        draftPatient.clinicalSharedValues[contextKey] = value;
      } else if (stringOrEmpty(draftPatient.clinicalSharedValues[contextKey])) {
        delete draftPatient.clinicalSharedValues[contextKey];
      }
    }
  }

  draftPatient.clinicalFormData[activeType] = bucket;
}

function syncDraftFromForm() {
  draftPatient.name = stringOrEmpty(el.patientName.value);
  draftPatient.lastNameFather = stringOrEmpty(el.patientLastNameFather.value);
  draftPatient.lastNameMother = stringOrEmpty(el.patientLastNameMother.value);
  draftPatient.age = numberOrEmpty(el.patientAge.value);
  draftPatient.ageMonths = numberOrEmpty(el.patientAgeMonths?.value);
  draftPatient.sex = stringOrEmpty(el.patientSex.value);
  draftPatient.location = stringOrEmpty(el.patientLocation.value);
  draftPatient.birthDate = stringOrEmpty(el.birthDate.value);
  draftPatient.birthPlace = stringOrEmpty(el.birthPlace?.value);
  draftPatient.phone = stringOrEmpty(el.phone.value);
  draftPatient.officePhone = stringOrEmpty(el.officePhone?.value);
  draftPatient.occupation = stringOrEmpty(el.occupation.value);
  draftPatient.educationLevel = stringOrEmpty(el.educationLevel?.value);
  draftPatient.civilStatus = stringOrEmpty(el.civilStatus?.value);
  draftPatient.streetAddress = stringOrEmpty(el.streetAddress?.value);
  draftPatient.exteriorNumber = stringOrEmpty(el.exteriorNumber?.value);
  draftPatient.interiorNumber = stringOrEmpty(el.interiorNumber?.value);
  draftPatient.neighborhood = stringOrEmpty(el.neighborhood?.value);
  draftPatient.municipality = stringOrEmpty(el.municipality?.value);
  draftPatient.delegation = stringOrEmpty(el.delegation?.value);
  draftPatient.stateName = stringOrEmpty(el.stateName?.value);
  draftPatient.cityName = stringOrEmpty(el.cityName?.value);
  draftPatient.medications = stringOrEmpty(el.medications.value);
  draftPatient.dentistName = stringOrEmpty(el.dentistName.value);
  draftPatient.familyDoctorName = stringOrEmpty(el.familyDoctorName?.value);
  draftPatient.familyDoctorPhone = stringOrEmpty(el.familyDoctorPhone?.value);
  draftPatient.allergies = stringOrEmpty(el.allergies.value);
  syncDraftClinicalRecordFields();
  syncActiveClinicalFormatFieldsFromDom();
  draftPatient.consultationDate = stringOrEmpty(el.consultationDate.value);
  draftPatient.nextConsultationDate = stringOrEmpty(el.nextConsultationDate.value);
  draftPatient.treatmentStart = stringOrEmpty(el.treatmentStart.value);
  draftPatient.lastMedicalConsultDate = stringOrEmpty(el.lastMedicalConsultDate?.value);
  draftPatient.lastMedicalConsultReason = stringOrEmpty(el.lastMedicalConsultReason?.value);
  draftPatient.brushTimes = numberOrEmpty(el.brushTimes.value);
  draftPatient.flossHabit = stringOrEmpty(el.flossHabit.value);
  draftPatient.otherConditions = stringOrEmpty(el.otherConditions.value);

  const diseaseInputs = el.diseaseChecklist.querySelectorAll("input[type=\"checkbox\"]");
  draftPatient.diseaseIds = Array.from(diseaseInputs)
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => checkbox.value);
}

function hydrateFormFromDraft() {
  ensureDraftClinicalEpisodeState();
  el.patientName.value = draftPatient.name || "";
  el.patientLastNameFather.value = draftPatient.lastNameFather || "";
  el.patientLastNameMother.value = draftPatient.lastNameMother || "";
  el.patientAge.value = toInputNumber(draftPatient.age);
  if (el.patientAgeMonths) {
    el.patientAgeMonths.value = toInputNumber(draftPatient.ageMonths);
  }
  el.patientSex.value = draftPatient.sex || "";
  el.patientLocation.value = draftPatient.location || "";
  el.birthDate.value = draftPatient.birthDate || "";
  if (el.birthPlace) {
    el.birthPlace.value = draftPatient.birthPlace || "";
  }
  el.phone.value = draftPatient.phone || "";
  if (el.officePhone) {
    el.officePhone.value = draftPatient.officePhone || "";
  }
  el.occupation.value = draftPatient.occupation || "";
  if (el.educationLevel) {
    el.educationLevel.value = draftPatient.educationLevel || "";
  }
  if (el.civilStatus) {
    el.civilStatus.value = draftPatient.civilStatus || "";
  }
  if (el.streetAddress) {
    el.streetAddress.value = draftPatient.streetAddress || "";
  }
  if (el.exteriorNumber) {
    el.exteriorNumber.value = draftPatient.exteriorNumber || "";
  }
  if (el.interiorNumber) {
    el.interiorNumber.value = draftPatient.interiorNumber || "";
  }
  if (el.neighborhood) {
    el.neighborhood.value = draftPatient.neighborhood || "";
  }
  if (el.municipality) {
    el.municipality.value = draftPatient.municipality || "";
  }
  if (el.delegation) {
    el.delegation.value = draftPatient.delegation || "";
  }
  if (el.stateName) {
    el.stateName.value = draftPatient.stateName || "";
  }
  if (el.cityName) {
    el.cityName.value = draftPatient.cityName || "";
  }
  el.medications.value = draftPatient.medications || "";
  el.dentistName.value = draftPatient.dentistName || "";
  if (el.familyDoctorName) {
    el.familyDoctorName.value = draftPatient.familyDoctorName || "";
  }
  if (el.familyDoctorPhone) {
    el.familyDoctorPhone.value = draftPatient.familyDoctorPhone || "";
  }
  el.allergies.value = draftPatient.allergies || "";
  el.clinicalRecordType.value = normalizeClinicalRecordType(draftPatient.clinicalRecordType);
  el.clinicalRecordReference.value = draftPatient.clinicalRecordReference || "";
  el.consultationDate.value = draftPatient.consultationDate || "";
  el.nextConsultationDate.value = draftPatient.nextConsultationDate || "";
  el.treatmentStart.value = draftPatient.treatmentStart || "";
  if (el.lastMedicalConsultDate) {
    el.lastMedicalConsultDate.value = draftPatient.lastMedicalConsultDate || "";
  }
  if (el.lastMedicalConsultReason) {
    el.lastMedicalConsultReason.value = draftPatient.lastMedicalConsultReason || "";
  }
  el.brushTimes.value = toInputNumber(draftPatient.brushTimes);
  el.flossHabit.value = draftPatient.flossHabit || "";
  el.otherConditions.value = draftPatient.otherConditions || "";
  renderClinicalFormatFields();
  renderClinicalCyclePanel();
  renderPatientMedia();
}

function focusPathologiesSection() {
  setActiveView("patient");
  setActivePatientSubview("pathologies");
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
    setActivePatientSubview("profile");
    el.patientName.focus();
    return;
  }

  const cycleResult = ensureClinicalEpisodeForCurrentPatient({ forceRenew: false });
  if (cycleResult.created && cycleResult.episode) {
    addHistoryEntry({
      type: "clinical-note",
      title: "Renovación automática de historia clínica",
      description: `Se abrió un nuevo ciclo de 6 meses (vigente hasta ${formatDate(cycleResult.episode.expiresAt)}).`
    });
    renderPatientHistory();
  }
  renderClinicalCyclePanel();

  setPdfActionState(true, "download");
  setFeedback("Generando PDF oficial. Espera un momento...");
  try {
    const { blob, fileName, recordType } = await requestOfficialClinicalPdf();
    const mode = triggerPdfDownload(blob, fileName || `${sanitizeFileName(draftPatient.name || "paciente")}-${recordType.id}.pdf`);
    persistDraftPatientIfEditing();
    if (mode === "opened") {
      setFeedback(`PDF oficial "${recordType.label}" abierto en una nueva pestana para guardar/compartir.`);
    } else {
      setFeedback(`PDF oficial "${recordType.label}" generado correctamente.`);
    }
  } catch (error) {
    console.error(error);
    const message = error.message || "No se pudo generar el PDF oficial.";
    setFeedback(message, "error");
    window.alert(message);
  } finally {
    setPdfActionState(false);
  }
}

async function printClinicalDocument() {
  syncDraftFromForm();
  ensureDraftOdontogram();

  if (!draftPatient.name) {
    setFeedback("Primero captura el nombre del paciente para imprimir el PDF.", "error");
    setActivePatientSubview("profile");
    el.patientName.focus();
    return;
  }

  const cycleResult = ensureClinicalEpisodeForCurrentPatient({ forceRenew: false });
  if (cycleResult.created && cycleResult.episode) {
    addHistoryEntry({
      type: "clinical-note",
      title: "Renovación automática de historia clínica",
      description: `Se abrió un nuevo ciclo de 6 meses (vigente hasta ${formatDate(cycleResult.episode.expiresAt)}).`
    });
    renderPatientHistory();
  }
  renderClinicalCyclePanel();

  setPdfActionState(true, "print");
  setFeedback("Preparando PDF para impresion...");
  const printPopup = openPrintPopupWindow();
  try {
    const result = await requestOfficialClinicalPdf();
    const printed = await printPdfBlob(result.blob, { popup: printPopup });
    persistDraftPatientIfEditing();
    if (printed) {
      setFeedback(`PDF oficial de ${result.recordType.label} listo para impresion.`);
    } else {
      setFeedback(`PDF oficial de ${result.recordType.label} abierto para impresion manual.`);
    }
  } catch (error) {
    console.error(error);
    const message = error.message || "No se pudo preparar el PDF para imprimir.";
    setFeedback(message, "error");
    window.alert(message);
  } finally {
    setPdfActionState(false);
  }
}

function openPrintPopupWindow() {
  try {
    const popup = window.open("", "_blank");
    if (popup) {
      popup.document.write("<!doctype html><title>Impresion PDF</title><p style=\"font-family:Arial,sans-serif;padding:16px;\">Preparando PDF para impresion...</p>");
      popup.document.close();
    }
    return popup || null;
  } catch {
    return null;
  }
}

function printPdfBlob(blob, options) {
  return new Promise((resolve, reject) => {
    if (!(blob instanceof Blob) || blob.size < 5) {
      reject(new Error("No se pudo imprimir porque el archivo PDF es inválido."));
      return;
    }

    const objectUrl = URL.createObjectURL(blob);
    const popup = options?.popup && !options.popup.closed
      ? options.popup
      : null;
    let settled = false;

    const cleanup = () => {
      window.setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
      }, 120000);
    };
    const resolveOnce = (ok) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      resolve(Boolean(ok));
    };
    const rejectOnce = (error) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      reject(error instanceof Error ? error : new Error("No se pudo imprimir el PDF."));
    };

    if (isLikelyIOSLikeBrowser()) {
      const mode = triggerPdfDownload(blob, `${sanitizeFileName(draftPatient.name || "paciente")}-impresion.pdf`);
      resolveOnce(mode === "opened" ? false : true);
      return;
    }

    const openManualPreview = () => {
      try {
        if (popup && !popup.closed) {
          popup.location.href = objectUrl;
          resolveOnce(false);
          return;
        }
      } catch {
        // Continuar con fallback.
      }
      const manual = window.open(objectUrl, "_blank", "noopener,noreferrer");
      if (!manual) {
        rejectOnce(new Error("No se pudo abrir la vista previa de impresion. Revisa el bloqueador de ventanas emergentes."));
        return;
      }
      resolveOnce(false);
    };

    const tryHiddenFramePrint = () => {
      const frame = document.createElement("iframe");
      frame.style.position = "fixed";
      frame.style.right = "0";
      frame.style.bottom = "0";
      frame.style.width = "1px";
      frame.style.height = "1px";
      frame.style.opacity = "0";
      frame.style.pointerEvents = "none";
      frame.style.border = "0";

      const finish = (ok) => {
        frame.remove();
        resolveOnce(ok);
      };

      frame.onload = () => {
        window.setTimeout(() => {
          try {
            const frameWindow = frame.contentWindow;
            if (!frameWindow) {
              openManualPreview();
              return;
            }
            frameWindow.focus();
            frameWindow.print();
            finish(true);
          } catch {
            openManualPreview();
          }
        }, 520);
      };
      frame.onerror = () => {
        frame.remove();
        openManualPreview();
      };

      document.body.appendChild(frame);
      frame.src = objectUrl;
      window.setTimeout(() => {
        if (!settled) {
          frame.remove();
          openManualPreview();
        }
      }, 7000);
    };

    try {
      tryHiddenFramePrint();
    } catch (error) {
      rejectOnce(error);
    }
  });
}

