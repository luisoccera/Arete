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
  renderPatientHistory();
  resetAppointmentInputs();
  resetPatientMediaInput();
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
  renderPatientMedia();
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
  renderPatientTable();
  renderUpcomingAppointments();
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

function addAppointmentFromUpcomingPlanner() {
  const inputPatientName = stringOrEmpty(el.globalAppointmentPatient?.value);
  const date = stringOrEmpty(el.globalAppointmentDate?.value);
  const startTime = stringOrEmpty(el.globalAppointmentStartTime?.value);
  const endTime = stringOrEmpty(el.globalAppointmentEndTime?.value);
  const reason = stringOrEmpty(el.globalAppointmentReason?.value);
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

  renderPatientTable();
  renderUpcomingAppointments();
  renderUpcomingPlannerForm();
  renderUpcomingPlannerCalendar();
  setActiveUpcomingSubview("planner");
  setUpcomingFabOpen(false);
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
  ensureDraftClinicalFormData();
}

function syncActiveClinicalFormatFieldsFromDom() {
  if (!el.clinicalFormatFields) {
    return;
  }
  ensureDraftClinicalFormData();
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
    bucket[field.id] = stringOrEmpty(input.value);
  }

  draftPatient.clinicalFormData[activeType] = bucket;
}

function syncDraftFromForm() {
  draftPatient.name = stringOrEmpty(el.patientName.value);
  draftPatient.lastNameFather = stringOrEmpty(el.patientLastNameFather.value);
  draftPatient.lastNameMother = stringOrEmpty(el.patientLastNameMother.value);
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
  syncActiveClinicalFormatFieldsFromDom();
  draftPatient.consultationDate = stringOrEmpty(el.consultationDate.value);
  draftPatient.nextConsultationDate = stringOrEmpty(el.nextConsultationDate.value);
  draftPatient.treatmentStart = stringOrEmpty(el.treatmentStart.value);
  draftPatient.brushTimes = numberOrEmpty(el.brushTimes.value);
  draftPatient.flossHabit = stringOrEmpty(el.flossHabit.value);
  draftPatient.otherConditions = stringOrEmpty(el.otherConditions.value);

  const diseaseInputs = el.diseaseChecklist.querySelectorAll("input[type=\"checkbox\"]");
  draftPatient.diseaseIds = Array.from(diseaseInputs)
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => checkbox.value);
}

function hydrateFormFromDraft() {
  el.patientName.value = draftPatient.name || "";
  el.patientLastNameFather.value = draftPatient.lastNameFather || "";
  el.patientLastNameMother.value = draftPatient.lastNameMother || "";
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
  el.otherConditions.value = draftPatient.otherConditions || "";
  renderClinicalFormatFields();
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
    const popup = options?.popup && !options.popup.closed ? options.popup : null;

    if (isLikelyIOSLikeBrowser()) {
      const mode = triggerPdfDownload(blob, `${sanitizeFileName(draftPatient.name || "paciente")}-impresion.pdf`);
      resolve(mode === "opened" ? false : true);
      return;
    }

    const objectUrl = URL.createObjectURL(blob);

    if (popup) {
      try {
        popup.location.href = objectUrl;
      } catch {
        // Si la navegación falla, seguimos con iframe oculto.
      }

      let attempts = 0;
      const maxAttempts = 8;
      const tryAutoPrint = () => {
        attempts += 1;
        try {
          popup.focus();
          popup.print();
          window.setTimeout(() => {
            URL.revokeObjectURL(objectUrl);
          }, 120000);
          resolve(true);
        } catch {
          if (attempts >= maxAttempts) {
            // Dejamos el PDF abierto para impresión manual.
            resolve(false);
            return;
          }
          window.setTimeout(tryAutoPrint, 450);
        }
      };

      window.setTimeout(tryAutoPrint, 550);
      return;
    }

    const frame = document.createElement("iframe");
    frame.style.position = "fixed";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.style.opacity = "0";
    frame.style.border = "0";
    frame.style.left = "-9999px";
    frame.style.bottom = "0";

    let settled = false;
    const finalize = (callback) => {
      if (settled) {
        return;
      }
      settled = true;
      window.setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
      }, 30000);
      if (frame.parentNode) {
        frame.parentNode.removeChild(frame);
      }
      callback();
    };

    frame.onerror = () => {
      finalize(() => reject(new Error("No se pudo cargar el PDF para imprimir.")));
    };

    frame.onload = () => {
      window.setTimeout(() => {
        try {
          const frameWindow = frame.contentWindow;
          if (!frameWindow) {
            finalize(() => reject(new Error("No se pudo abrir el visor de impresion.")));
            return;
          }

          let done = false;
          const complete = () => {
            if (done) {
              return;
            }
            done = true;
            frameWindow.removeEventListener("afterprint", onAfterPrint);
            finalize(() => resolve(true));
          };

          const onAfterPrint = () => {
            complete();
          };

          frameWindow.addEventListener("afterprint", onAfterPrint);
          frameWindow.focus();
          frameWindow.print();
          window.setTimeout(complete, 2200);
        } catch (error) {
          // Último fallback: abrir el PDF para impresión manual.
          try {
            triggerPdfDownload(blob, `${sanitizeFileName(draftPatient.name || "paciente")}-impresion.pdf`);
            finalize(() => resolve(false));
          } catch (fallbackError) {
            finalize(() => reject(fallbackError instanceof Error ? fallbackError : new Error("Error al imprimir el PDF.")));
          }
        }
      }, 220);
    };

    document.body.appendChild(frame);
    frame.src = objectUrl;
  });
}

