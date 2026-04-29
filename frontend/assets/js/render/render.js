function renderAll() {
  renderStatusSelect();
  renderDentitionSwitch();
  renderDiseaseChecklist();
  renderDiseaseCatalog();
  renderStatusCatalog();
  renderOdontogram();
  renderClinicalFormatFields();
  renderAppointmentList();
  renderPatientMedia();
  renderPatientTable();
  renderUpcomingPlannerForm();
  renderUpcomingAppointments();
  renderUpcomingPlannerCalendar();
  renderPatientHistory();
  setActivePatientSubview(activePatientSubview);
  setActiveUpcomingSubview(activeUpcomingSubview);
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
      const fullName = getPatientFullName(patient);
      const diseaseNames = patient.diseaseIds
        .map((id) => getDiseaseById(id)?.name || "")
        .join(" ");
      const haystack = [
        fullName,
        patient.name,
        patient.lastNameFather,
        patient.lastNameMother,
        patient.phone,
        patient.location,
        patient.dentistName,
        diseaseNames
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    })
    .sort((a, b) => getPatientFullName(a).localeCompare(getPatientFullName(b), "es", { sensitivity: "base" }));

  if (patients.length === 0) {
    el.patientRows.innerHTML = "<tr><td colspan=\"5\">No hay pacientes para mostrar.</td></tr>";
    renderUpcomingPlannerForm();
    renderUpcomingAppointments();
    renderUpcomingPlannerCalendar();
    return;
  }

  const rowsHtml = patients
    .map((patient) => {
      const fullName = getPatientFullName(patient);
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
        ? `${formatDate(nextAppointment.date)}${formatAppointmentTimeRange(nextAppointment) ? ` ${formatAppointmentTimeRange(nextAppointment)}` : ""}`
        : nextConsultationDate
          ? formatDate(nextConsultationDate)
          : formatDate(patient.consultationDate);

      return `
        <tr class="${patient.id === editingPatientId ? "active" : ""}">
          <td>
            <div class="patient-name-cell">
              <strong>${escapeHtml(fullName || "Sin nombre")}</strong>
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
  renderUpcomingPlannerForm();
  renderUpcomingAppointments();
  renderUpcomingPlannerCalendar();
}

function getAppointmentStartTime(appointment) {
  return stringOrEmpty(appointment?.startTime || appointment?.time);
}

function getAppointmentEndTime(appointment) {
  return stringOrEmpty(appointment?.endTime);
}

function formatAppointmentTimeRange(appointment) {
  const start = getAppointmentStartTime(appointment);
  const end = getAppointmentEndTime(appointment);
  if (start && end) {
    return `${start} - ${end}`;
  }
  return start || end || "";
}

function collectUpcomingEntries(options = {}) {
  const includePast = Boolean(options?.includePast);
  const includeFallback = options?.includeFallback !== false;
  const monthKey = stringOrEmpty(options?.monthKey);
  const day = stringOrEmpty(options?.day);
  const now = Date.now();
  const todayStart = getStartOfToday().getTime();
  const entries = [];

  for (const patient of state.patients) {
    const appointments = normalizeAppointments(patient.appointments);
    if (appointments.length > 0) {
      for (const appointment of appointments) {
        const date = stringOrEmpty(appointment.date);
        const startTime = getAppointmentStartTime(appointment);
        const endTime = getAppointmentEndTime(appointment);
        if (!date) {
          continue;
        }
        if (monthKey && !date.startsWith(`${monthKey}-`)) {
          continue;
        }
        if (day && date !== day) {
          continue;
        }

        const info = getAppointmentDateInfo(date, startTime);
        if (!info) {
          continue;
        }
        if (!includePast) {
          const threshold = info.hasTime ? now : todayStart;
          if (info.timestamp < threshold) {
            continue;
          }
        }

        entries.push({
          kind: "appointment",
          patientId: patient.id,
          patientName: getPatientFullName(patient) || "Sin nombre",
          date,
          startTime,
          endTime,
          dentistName: patient.dentistName || "Sin dentista",
          reason: appointment.reason || "Sin motivo",
          sortTimestamp: info.timestamp,
          appointmentId: appointment.id
        });
      }
      continue;
    }

    if (!includeFallback) {
      continue;
    }

    const fallbackCandidates = [
      { date: stringOrEmpty(patient.nextConsultationDate), reason: "Proxima consulta" },
      { date: stringOrEmpty(patient.consultationDate), reason: "Consulta general" }
    ];

    for (const fallback of fallbackCandidates) {
      if (!fallback.date) {
        continue;
      }
      if (monthKey && !fallback.date.startsWith(`${monthKey}-`)) {
        continue;
      }
      if (day && fallback.date !== day) {
        continue;
      }
      const fallbackInfo = getAppointmentDateInfo(fallback.date, "");
      if (!fallbackInfo || (!includePast && fallbackInfo.timestamp < todayStart)) {
        continue;
      }
      entries.push({
        kind: "fallback",
        patientId: patient.id,
        patientName: getPatientFullName(patient) || "Sin nombre",
        date: fallback.date,
        startTime: "",
        endTime: "",
        dentistName: patient.dentistName || "Sin dentista",
        reason: fallback.reason,
        sortTimestamp: fallbackInfo.timestamp,
        appointmentId: ""
      });
      break;
    }
  }

  entries.sort((a, b) => {
    if (a.sortTimestamp !== b.sortTimestamp) {
      return a.sortTimestamp - b.sortTimestamp;
    }
    return a.patientName.localeCompare(b.patientName, "es", { sensitivity: "base" });
  });

  return entries;
}

function renderUpcomingPreviewCard(entries) {
  if (!el.upcomingPreviewAppointment) {
    return;
  }
  const first = Array.isArray(entries) && entries.length > 0 ? entries[0] : null;
  if (!first) {
    el.upcomingPreviewAppointment.innerHTML = "<div class=\"history-empty\">Sin previsualización de cita próxima.</div>";
    return;
  }

  const timeRange = formatAppointmentTimeRange(first);
  const when = `${formatDate(first.date)}${timeRange ? ` ${timeRange}` : ""}`;
  const actionHtml = first.patientId
    ? `<button type="button" class="table-btn" data-open-id="${first.patientId}">Abrir</button>`
    : "<span class=\"patient-meta\">Sin expediente</span>";
  el.upcomingPreviewAppointment.innerHTML = `
    <article class="upcoming-next-card">
      <p class="upcoming-next-kicker">Cita más próxima</p>
      <strong class="upcoming-next-name">${escapeHtml(first.patientName)}</strong>
      <span class="upcoming-next-meta">${escapeHtml(when)} | ${escapeHtml(first.reason)} | ${escapeHtml(first.dentistName)}</span>
      ${actionHtml}
    </article>
  `;
}

function renderUpcomingAppointments() {
  const upcoming = collectUpcomingEntries({ includePast: false, includeFallback: true }).slice(0, 80);
  el.upcomingCount.textContent = String(upcoming.length);
  renderUpcomingPreviewCard(upcoming);

  if (upcoming.length === 0) {
    el.upcomingList.innerHTML = "<div class=\"history-empty\">No hay citas registradas.</div>";
    return;
  }

  el.upcomingList.innerHTML = upcoming
    .map((entry) => {
      const timeRange = formatAppointmentTimeRange(entry);
      const actionHtml = entry.patientId
        ? `<button type="button" class="table-btn" data-open-id="${entry.patientId}">Abrir</button>`
        : "<span class=\"patient-meta\">Sin expediente</span>";
      return `
        <div class="upcoming-item">
          <div class="upcoming-main">
            <span class="upcoming-name">${escapeHtml(entry.patientName)}</span>
            <span class="upcoming-meta">${escapeHtml(formatDate(entry.date))}${timeRange ? ` - ${escapeHtml(timeRange)}` : ""} | ${escapeHtml(entry.reason)} | ${escapeHtml(entry.dentistName)}</span>
          </div>
          ${actionHtml}
        </div>
      `;
    })
    .join("");
}

function renderUpcomingPlannerForm() {
  if (!el.globalAppointmentPatient) {
    return;
  }

  const patients = state.patients
    .slice()
    .sort((a, b) => getPatientFullName(a).localeCompare(getPatientFullName(b), "es", { sensitivity: "base" }));
  if (el.addGlobalAppointmentBtn) {
    el.addGlobalAppointmentBtn.disabled = false;
  }

  const previous = stringOrEmpty(el.globalAppointmentPatient.value);
  if (el.globalAppointmentPatientOptions) {
    el.globalAppointmentPatientOptions.innerHTML = patients
      .map((patient) => `<option value="${escapeHtml(getPatientFullName(patient) || "Sin nombre")}"></option>`)
      .join("");
  }

  if (previous) {
    el.globalAppointmentPatient.value = previous;
  } else if (editingPatientId && patients.some((patient) => patient.id === editingPatientId)) {
    const current = patients.find((patient) => patient.id === editingPatientId);
    el.globalAppointmentPatient.value = current ? getPatientFullName(current) : "";
  } else {
    el.globalAppointmentPatient.value = "";
  }

  if (el.globalAppointmentDate && !stringOrEmpty(el.globalAppointmentDate.value)) {
    // keep current selection
  } else if (el.globalAppointmentDate) {
    el.globalAppointmentDate.value = getTodayInputDate();
  }
  if (el.globalAppointmentDate) {
    const currentDate = stringOrEmpty(el.globalAppointmentDate.value);
    if (currentDate) {
      upcomingSelectedDate = currentDate;
      upcomingCalendarMonth = currentDate.slice(0, 7);
    }
  }
  if (el.upcomingCalendarMonth) {
    el.upcomingCalendarMonth.value = upcomingCalendarMonth;
  }
  renderPlannerMonthLabel();
  applyUpcomingFilterSettings();
}

function normalizePatientNameToken(value) {
  return stringOrEmpty(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function findPatientByPlannerName(nameInput) {
  const token = normalizePatientNameToken(nameInput);
  if (!token) {
    return;
  }
  return state.patients.find((patient) => normalizePatientNameToken(getPatientFullName(patient)) === token) || null;
}

function syncGlobalAppointmentPatientInput() {
  if (!el.globalAppointmentPatient) {
    return null;
  }
  const found = findPatientByPlannerName(el.globalAppointmentPatient.value);
  if (found) {
    el.globalAppointmentPatient.value = getPatientFullName(found);
  }
  return found;
}

function renderPlannerMonthLabel() {
  if (!el.plannerMonthLabel) {
    return;
  }
  const safeMonth = normalizeMonthInputValue(upcomingCalendarMonth);
  const monthDate = parseDateValue(`${safeMonth}-01`);
  if (!monthDate) {
    el.plannerMonthLabel.textContent = "Calendario";
    return;
  }
  el.plannerMonthLabel.textContent = monthDate.toLocaleDateString("es-MX", {
    month: "short",
    year: "numeric"
  });
}

function applyUpcomingFilterSettings() {
  const showCalendarName = el.upcomingShowCalendarName ? Boolean(el.upcomingShowCalendarName.checked) : true;
  if (el.plannerMonthSub) {
    el.plannerMonthSub.hidden = !showCalendarName;
  }
  const rowValue = Number(el.upcomingFilterRows?.value || 2);
  if (el.upcomingPlannerSuite) {
    el.upcomingPlannerSuite.style.setProperty("--planner-filter-rows", String(Math.min(Math.max(rowValue, 1), 3)));
  }
}

function setUpcomingFilterPanelOpen(isOpen) {
  upcomingFilterPanelOpen = Boolean(isOpen);
  if (el.upcomingFilterPanel) {
    el.upcomingFilterPanel.hidden = !upcomingFilterPanelOpen;
  }
}

function setUpcomingFabOpen(isOpen) {
  upcomingFabOpen = Boolean(isOpen);
  if (el.upcomingFabMenu) {
    el.upcomingFabMenu.hidden = !upcomingFabOpen;
  }
  if (el.upcomingFabToggle) {
    el.upcomingFabToggle.setAttribute("aria-expanded", upcomingFabOpen ? "true" : "false");
  }
}

function normalizeMonthInputValue(value) {
  const raw = stringOrEmpty(value);
  const match = raw.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    return getTodayInputDate().slice(0, 7);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return getTodayInputDate().slice(0, 7);
  }
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
}

function formatDateKeyFromDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function renderUpcomingPlannerCalendar() {
  if (!el.upcomingCalendarGrid || !el.upcomingDayList || !el.upcomingDayTitle) {
    return;
  }

  for (const button of el.upcomingDisplayButtons || []) {
    const isActive = button.getAttribute("data-upcoming-display") === upcomingCalendarMode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  }

  upcomingCalendarMonth = normalizeMonthInputValue(upcomingCalendarMonth);
  if (el.upcomingCalendarMonth) {
    el.upcomingCalendarMonth.value = upcomingCalendarMonth;
  }
  renderPlannerMonthLabel();
  if (!upcomingSelectedDate || !/^\d{4}-\d{2}-\d{2}$/.test(upcomingSelectedDate)) {
    upcomingSelectedDate = `${upcomingCalendarMonth}-01`;
  }

  const monthEntries = collectUpcomingEntries({
    includePast: true,
    includeFallback: true,
    monthKey: upcomingCalendarMonth
  });
  const byDate = new Map();
  for (const entry of monthEntries) {
    if (!byDate.has(entry.date)) {
      byDate.set(entry.date, []);
    }
    byDate.get(entry.date).push(entry);
  }
  for (const list of byDate.values()) {
    list.sort((a, b) => a.sortTimestamp - b.sortTimestamp);
  }

  const [yearText, monthText] = upcomingCalendarMonth.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  const firstDay = new Date(year, monthIndex, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(year, monthIndex, 1 - startOffset);
  const todayKey = getTodayInputDate();

  if (upcomingCalendarMode === "list") {
    el.upcomingCalendarGrid.classList.add("is-list-mode");
    el.upcomingCalendarGrid.innerHTML = monthEntries.length === 0
      ? "<div class=\"history-empty\">No hay citas para este mes.</div>"
      : monthEntries.map((entry) => {
        const timeRange = formatAppointmentTimeRange(entry);
        const actionHtml = entry.patientId
          ? `<button type="button" class="table-btn" data-open-id="${entry.patientId}">Abrir</button>`
          : "<span class=\"patient-meta\">Sin expediente</span>";
        return `
          <article class="appointment-item">
            <div class="appointment-main">
              <div class="appointment-title">${escapeHtml(formatDate(entry.date))}${timeRange ? ` - ${escapeHtml(timeRange)}` : ""}</div>
              <div class="appointment-meta">${escapeHtml(entry.patientName)} | ${escapeHtml(entry.reason)}</div>
            </div>
            ${actionHtml}
          </article>
        `;
      }).join("");
  } else {
    el.upcomingCalendarGrid.classList.remove("is-list-mode");
    const weekLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
      .map((label) => `<div class="upcoming-weekday">${label}</div>`)
      .join("");
    const cells = [];
    for (let idx = 0; idx < 42; idx += 1) {
      const current = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + idx);
      const key = formatDateKeyFromDate(current);
      const isCurrentMonth = current.getMonth() === monthIndex;
      const isSelected = key === upcomingSelectedDate;
      const isToday = key === todayKey;
      const entries = byDate.get(key) || [];
      const next = entries[0] || null;
      const preview = next
        ? `${formatAppointmentTimeRange(next) || "Sin hora"} · ${next.patientName}`
        : "";
      cells.push(`
        <button type="button" class="upcoming-day-cell${isCurrentMonth ? "" : " is-muted"}${isSelected ? " is-selected" : ""}${isToday ? " is-today" : ""}" data-calendar-date="${key}">
          <span class="upcoming-day-num">${current.getDate()}</span>
          <span class="upcoming-day-count">${entries.length > 0 ? `${entries.length} cita${entries.length === 1 ? "" : "s"}` : "Sin citas"}</span>
          <span class="upcoming-day-preview">${escapeHtml(preview || "—")}</span>
        </button>
      `);
    }
    el.upcomingCalendarGrid.innerHTML = `
      <div class="upcoming-month-banner">${escapeHtml(firstDay.toLocaleDateString("es-MX", { month: "long", year: "numeric" }))}</div>
      <div class="upcoming-calendar-head">${weekLabels}</div>
      <div class="upcoming-calendar-body">${cells.join("")}</div>
    `;
  }

  const selectedList = byDate.get(upcomingSelectedDate) || [];
  const selectedDateValue = parseDateValue(upcomingSelectedDate);
  el.upcomingDayTitle.textContent = selectedDateValue
    ? `Citas del día ${selectedDateValue.toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}`
    : "Citas del día";

  if (selectedList.length === 0) {
    el.upcomingDayList.innerHTML = "<div class=\"history-empty\">No hay citas registradas para este día.</div>";
    return;
  }

  el.upcomingDayList.innerHTML = selectedList
    .map((entry) => {
      const timeRange = formatAppointmentTimeRange(entry);
      const removeBtn = entry.kind === "appointment"
        ? `<button type="button" class="catalog-btn" data-remove-upcoming-patient-id="${entry.patientId}" data-remove-upcoming-appointment-id="${entry.appointmentId}">Quitar</button>`
        : entry.kind === "external-appointment"
          ? `<button type="button" class="catalog-btn" data-remove-upcoming-external-id="${entry.appointmentId}">Quitar</button>`
          : "";
      const openBtn = entry.patientId
        ? `<button type="button" class="table-btn" data-open-id="${entry.patientId}">Abrir</button>`
        : "<span class=\"patient-meta\">Sin expediente</span>";
      return `
        <article class="appointment-item">
          <div class="appointment-main">
            <div class="appointment-title">${timeRange ? escapeHtml(timeRange) : "Sin horario"} · ${escapeHtml(entry.patientName)}</div>
            <div class="appointment-meta">${escapeHtml(entry.reason)} | ${escapeHtml(entry.dentistName)}</div>
          </div>
          <div class="table-actions">
            ${openBtn}
            ${removeBtn}
          </div>
        </article>
      `;
    })
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

  el.appointmentList.innerHTML = sorted
    .map((appointment) => `
      <article class="appointment-item">
        <div class="appointment-main">
          <div class="appointment-title">${escapeHtml(formatDate(appointment.date))}${formatAppointmentTimeRange(appointment) ? ` - ${escapeHtml(formatAppointmentTimeRange(appointment))}` : ""}</div>
          <div class="appointment-meta">${escapeHtml(appointment.reason || "Sin motivo especificado.")}</div>
        </div>
        <button type="button" class="catalog-btn" data-remove-appointment-id="${appointment.id}">Quitar</button>
      </article>
    `)
    .join("");
}

function renderPatientMedia() {
  if (!el.patientImageList) {
    return;
  }

  const entries = normalizePatientMediaEntries(draftPatient.mediaEntries);
  draftPatient.mediaEntries = entries;

  if (entries.length === 0) {
    el.patientImageList.innerHTML = "<div class=\"history-empty\">Aun no hay imagenes cargadas para este paciente.</div>";
    return;
  }

  el.patientImageList.innerHTML = entries
    .map((entry) => `
      <article class="media-item">
        <img src="${entry.dataUrl}" alt="${escapeHtml(entry.name || "Imagen clinica")}">
        <div class="media-item-body">
          <div class="media-item-title">${escapeHtml(entry.name || "Imagen clinica")}</div>
          <div class="media-item-meta">${escapeHtml(entry.type === "fotografia" ? "Fotografia" : "Radiografia")} | ${escapeHtml(formatDateTime(entry.createdAt))}</div>
          <button type="button" class="catalog-btn" data-remove-media-id="${entry.id}">Eliminar</button>
        </div>
      </article>
    `)
    .join("");
}

async function handlePatientImageUpload(event) {
  const files = Array.from(event.target.files || []);
  if (files.length === 0) {
    return;
  }

  const selectedType = stringOrEmpty(el.patientImageType.value).toLowerCase() === "fotografia"
    ? "fotografia"
    : "radiografia";
  const maxFileSize = 8 * 1024 * 1024;
  let loadedCount = 0;

  if (!Array.isArray(draftPatient.mediaEntries)) {
    draftPatient.mediaEntries = [];
  }

  for (const file of files) {
    if (!String(file.type || "").toLowerCase().startsWith("image/")) {
      continue;
    }
    if (Number(file.size || 0) > maxFileSize) {
      continue;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      draftPatient.mediaEntries.unshift({
        id: generateId("img"),
        type: selectedType,
        name: stringOrEmpty(file.name) || "imagen-clinica",
        dataUrl,
        createdAt: new Date().toISOString()
      });
      loadedCount += 1;
    } catch {
      continue;
    }
  }

  draftPatient.mediaEntries = normalizePatientMediaEntries(draftPatient.mediaEntries);
  renderPatientMedia();
  persistDraftPatientIfEditing();
  resetPatientMediaInput();

  if (loadedCount > 0) {
    setFeedback(`${loadedCount} imagen(es) agregadas al expediente del paciente.`);
  } else {
    setFeedback("No se pudo cargar ninguna imagen. Verifica formato y tamano (max 8MB).", "error");
  }
}

function removePatientMediaEntry(mediaId) {
  if (!Array.isArray(draftPatient.mediaEntries)) {
    return;
  }

  const found = draftPatient.mediaEntries.find((entry) => entry.id === mediaId);
  if (!found) {
    return;
  }

  const approved = window.confirm(`Se eliminara la imagen "${found.name || "sin nombre"}". Deseas continuar?`);
  if (!approved) {
    return;
  }

  draftPatient.mediaEntries = draftPatient.mediaEntries.filter((entry) => entry.id !== mediaId);
  renderPatientMedia();
  persistDraftPatientIfEditing();
  setFeedback("Imagen eliminada del expediente.");
}

function resetPatientMediaInput() {
  if (el.patientImageInput) {
    el.patientImageInput.value = "";
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });
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

function ensureDraftClinicalFormData() {
  if (!draftPatient.clinicalFormData || typeof draftPatient.clinicalFormData !== "object") {
    draftPatient.clinicalFormData = createEmptyClinicalFormData();
  }
  draftPatient.clinicalFormData = normalizeClinicalFormData(draftPatient.clinicalFormData);
}

function renderClinicalFormatFields() {
  if (!el.clinicalFormatFields) {
    return;
  }

  ensureDraftClinicalFormData();
  const activeType = normalizeClinicalRecordType(
    el.clinicalRecordType?.value || draftPatient.clinicalRecordType
  );
  draftPatient.clinicalRecordType = activeType;
  const schema = getClinicalFormSchema(activeType);
  const values = draftPatient.clinicalFormData[activeType] || {};

  if (el.clinicalFormatTitle) {
    el.clinicalFormatTitle.textContent = `Campos de ${schema.title}`;
  }

  el.clinicalFormatFields.innerHTML = schema.fields
    .map((field) => {
      const fieldValue = values[field.id] || "";
      const inputType = field.type || "text";
      if (inputType === "textarea") {
        return `
          <label class="field field-full format-field format-field-wide">
            <span>${escapeHtml(field.label)}</span>
            <textarea data-clinical-field="${escapeHtml(field.id)}" rows="${Number(field.rows || 2)}" placeholder="${escapeHtml(field.placeholder || "")}">${escapeHtml(fieldValue)}</textarea>
          </label>
        `;
      }
      return `
        <label class="field format-field">
          <span>${escapeHtml(field.label)}</span>
          <input
            type="${escapeHtml(inputType)}"
            data-clinical-field="${escapeHtml(field.id)}"
            value="${escapeHtml(fieldValue)}"
            placeholder="${escapeHtml(field.placeholder || "")}"
          >
        </label>
      `;
    })
    .join("");
}

function handleClinicalFormatFieldInput(event) {
  const input = event.target.closest("[data-clinical-field]");
  if (!input) {
    return;
  }
  ensureDraftClinicalFormData();
  const activeType = normalizeClinicalRecordType(
    el.clinicalRecordType?.value || draftPatient.clinicalRecordType
  );
  const fieldId = input.getAttribute("data-clinical-field");
  if (!fieldId) {
    return;
  }

  const value = stringOrEmpty(input.value);
  const bucket = draftPatient.clinicalFormData[activeType] || {};
  bucket[fieldId] = value;
  draftPatient.clinicalFormData[activeType] = bucket;
  persistDraftPatientIfEditing();
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
  el.jawBackdrop.classList.toggle("is-adult", mode === "adult");
  el.jawBackdrop.classList.toggle("is-child", mode === "child");

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
  const splitIndex = Math.floor(toothNumbers.length / 2);
  const rightQuadrant = toothNumbers.slice(0, splitIndex);
  const leftQuadrant = toothNumbers.slice(splitIndex);

  const renderToothNode = (toothNumber) => {
    const toothId = String(toothNumber);
    const statusIds = getMarkIds("teeth", toothId);
    const statusColors = statusIds
      .map((statusId) => getStatusById(statusId)?.color)
      .filter(Boolean);
    const previewIds = statusIds.slice(0, 24);
    const overflowCount = Math.max(0, statusIds.length - previewIds.length);
    const toothSpec = getToothRenderSpec(toothNumber, mode);
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
        class="tooth-node ${mode === "child" ? "child" : ""} jaw-${arcPosition} ${toothSpec.mirror ? "mirror" : ""} ${statusIds.length > 0 ? "has-marks" : ""}"
        data-tooth-id="${toothId}"
        title="Diente ${toothId}: ${escapeHtml(titleText)}"
        style="--tooth-w:${toothSpec.width}px; --tooth-h:${toothSpec.height}px;"
      >
        <span class="tooth-art" aria-hidden="true">
          <svg viewBox="0 0 48 52" class="tooth-svg">
            ${fillConfig.defs}
            <path class="tooth-fill-shape" d="${TOOTH_PATHS[toothSpec.path]}" fill="${fillConfig.fill}"></path>
            <path class="tooth-outline-shape" d="${TOOTH_PATHS[toothSpec.path]}"></path>
          </svg>
        </span>
        <span class="tooth-id">${toothId}</span>
        <span class="tooth-color-grid">${chips}</span>
        ${overflowCount > 0 ? `<span class="tooth-more">+${overflowCount}</span>` : ""}
      </button>
    `;
  };

  container.innerHTML = `
    <div class="jaw-quadrant jaw-quadrant-right">
      ${rightQuadrant.map(renderToothNode).join("")}
    </div>
    <div class="jaw-divider-vertical" aria-hidden="true"></div>
    <div class="jaw-quadrant jaw-quadrant-left">
      ${leftQuadrant.map(renderToothNode).join("")}
    </div>
  `;
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
    setFeedback(`Estado ${statusName} agregado. Esta pieza ya puede tener multiples colores al mismo tiempo.`);
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

  setActiveView("patient");
  setActivePatientSubview("profile");
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
  resetPatientMediaInput();
  resetClinicalNoteInputs();
  updateDeleteCurrentButtonState();
  setFeedback(`Editando expediente de ${getPatientFullName(found)}.`);
}

