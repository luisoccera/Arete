function bindEvents() {
  el.newPatientBtn.addEventListener("click", () => {
    setActiveView("patient");
    startNewPatient(true);
  });
  for (const button of el.viewTabs) {
    button.addEventListener("click", () => {
      const targetView = button.getAttribute("data-view-tab");
      setActiveView(targetView);
      if (targetView === "patient") {
        setActivePatientSubview("profile");
        return;
      }
      if (targetView === "upcoming") {
        setActiveUpcomingSubview("planner");
      }
    });
  }
  for (const button of el.upcomingSubTabs) {
    button.addEventListener("click", () => {
      const targetSubview = button.getAttribute("data-upcoming-tab");
      setActiveUpcomingSubview(targetSubview);
    });
  }
  for (const button of el.patientSubTabs) {
    button.addEventListener("click", () => {
      const targetSubview = button.getAttribute("data-patient-tab");
      setActivePatientSubview(targetSubview);
    });
  }
  const openPatientFromSwitcher = () => {
    const found = findPatientByPlannerName(el.patientSwitcherInput?.value);
    if (!found) {
      setFeedback("Selecciona un paciente de los resultados de búsqueda.", "error");
      el.patientSwitcherInput?.focus();
      return;
    }
    openPatient(found.id, activePatientSubview);
  };
  if (el.openSelectedPatientBtn) {
    el.openSelectedPatientBtn.addEventListener("click", openPatientFromSwitcher);
  }
  if (el.patientSwitcherInput) {
    el.patientSwitcherInput.addEventListener("change", () => {
      const found = findPatientByPlannerName(el.patientSwitcherInput.value);
      if (found) {
        openPatient(found.id, activePatientSubview);
      }
    });
    el.patientSwitcherInput.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") {
        return;
      }
      event.preventDefault();
      openPatientFromSwitcher();
    });
  }
  el.savePatientBtn.addEventListener("click", savePatient);
  if (el.openPatientHistoryBtn) {
    el.openPatientHistoryBtn.addEventListener("click", () => {
      openClinicalHistoryForCurrentPatient(false);
    });
  }
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
  el.patientImageInput.addEventListener("change", handlePatientImageUpload);
  el.exportClinicalDocBtn.addEventListener("click", downloadClinicalDocument);
  el.exportAllClinicalDocsBtn.addEventListener("click", downloadCompleteClinicalHistory);
  el.printClinicalDocBtn.addEventListener("click", printClinicalDocument);
  el.addClinicalNoteBtn.addEventListener("click", addClinicalNote);
  if (el.clinicalNotePatient) {
    const refreshClinicalNotes = () => {
      const found = findPatientByPlannerName(el.clinicalNotePatient.value);
      if (found) {
        el.clinicalNotePatient.value = getPatientFullName(found);
      }
      renderClinicalNotesInCalendar();
    };
    el.clinicalNotePatient.addEventListener("change", refreshClinicalNotes);
    el.clinicalNotePatient.addEventListener("blur", refreshClinicalNotes);
  }
  if (el.openClinicalHistoryBtn) {
    el.openClinicalHistoryBtn.addEventListener("click", () => {
      openClinicalHistoryForCurrentPatient(false);
    });
  }
  if (el.renewClinicalHistoryBtn) {
    el.renewClinicalHistoryBtn.addEventListener("click", () => {
      openClinicalHistoryForCurrentPatient(true);
    });
  }
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
    renderClinicalFormatFields();
    persistDraftPatientIfEditing();
  });

  el.clinicalRecordReference.addEventListener("input", () => {
    syncDraftClinicalRecordFields();
    persistDraftPatientIfEditing();
  });
  el.clinicalFormatFields.addEventListener("input", handleClinicalFormatFieldInput);
  el.clinicalFormatFields.addEventListener("change", handleClinicalFormatFieldInput);

  el.diseaseChecklist.addEventListener("change", () => {
    syncDraftFromForm();
  });

  const syncAgeFromBirthDate = () => {
    const birthValue = stringOrEmpty(el.birthDate.value);
    if (!birthValue) {
      el.patientAge.value = "";
      if (el.patientAgeMonths) {
        el.patientAgeMonths.value = "";
      }
      syncDraftFromForm();
      return;
    }
    const ageBreakdown = calculateAgeBreakdownFromDate(birthValue);
    if (ageBreakdown) {
      el.patientAge.value = String(ageBreakdown.years);
      if (el.patientAgeMonths) {
        el.patientAgeMonths.value = String(ageBreakdown.months);
      }
    } else {
      el.patientAge.value = "";
      if (el.patientAgeMonths) {
        el.patientAgeMonths.value = "";
      }
    }
    syncDraftFromForm();
  };

  el.birthDate.addEventListener("change", syncAgeFromBirthDate);
  el.birthDate.addEventListener("input", syncAgeFromBirthDate);

  el.patientRows.addEventListener("click", (event) => {
    const openHistoryBtn = event.target.closest("[data-open-history-id]");
    if (openHistoryBtn) {
      openPatient(openHistoryBtn.getAttribute("data-open-history-id"), "history");
      return;
    }

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
    const openHistoryBtn = event.target.closest("[data-open-history-id]");
    if (openHistoryBtn) {
      openPatient(openHistoryBtn.getAttribute("data-open-history-id"), "history");
      return;
    }

    const openBtn = event.target.closest("[data-open-id]");
    if (!openBtn) {
      return;
    }
    openPatient(openBtn.getAttribute("data-open-id"));
  });
  if (el.upcomingPreviewAppointment) {
    el.upcomingPreviewAppointment.addEventListener("click", (event) => {
      const openHistoryBtn = event.target.closest("[data-open-history-id]");
      if (openHistoryBtn) {
        openPatient(openHistoryBtn.getAttribute("data-open-history-id"), "history");
        return;
      }

      const openBtn = event.target.closest("[data-open-id]");
      if (!openBtn) {
        return;
      }
      openPatient(openBtn.getAttribute("data-open-id"));
    });
  }
  if (el.addGlobalAppointmentBtn) {
    el.addGlobalAppointmentBtn.addEventListener("click", addAppointmentFromUpcomingPlanner);
  }
  const openPlannerComposer = () => {
    setActiveUpcomingSubview("planner");
    if (el.globalAppointmentDate) {
      el.globalAppointmentDate.value = upcomingSelectedDate || getTodayInputDate();
    }
    setPlannerComposerVisible(true);
    const preferredFocus = el.globalAppointmentTitle || el.globalAppointmentPatient;
    preferredFocus?.focus();
  };
  if (el.openComposerTextBtn) {
    el.openComposerTextBtn.addEventListener("click", openPlannerComposer);
  }
  if (el.openComposerBtn) {
    el.openComposerBtn.addEventListener("click", openPlannerComposer);
  }
  if (el.openComposerForDayBtn) {
    el.openComposerForDayBtn.addEventListener("click", openPlannerComposer);
  }
  if (el.closeComposerBtn) {
    el.closeComposerBtn.addEventListener("click", () => {
      setPlannerComposerVisible(false);
    });
  }
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }
    if (activeView === "upcoming" && !el.plannerComposerPanel?.hidden) {
      setPlannerComposerVisible(false);
    }
  });
  if (el.globalAppointmentPatient) {
    el.globalAppointmentPatient.addEventListener("change", () => {
      syncGlobalAppointmentPatientInput();
    });
    el.globalAppointmentPatient.addEventListener("blur", () => {
      syncGlobalAppointmentPatientInput();
    });
  }
  if (el.quickAppointmentPatient) {
    el.quickAppointmentPatient.addEventListener("blur", () => {
      syncQuickAppointmentPatientInput();
    });
    el.quickAppointmentPatient.addEventListener("change", () => {
      syncQuickAppointmentPatientInput();
    });
  }
  if (el.quickAddAppointmentBtn) {
    el.quickAddAppointmentBtn.addEventListener("click", addQuickAppointmentFromPlanner);
  }
  if (el.scanCameraInput) {
    el.scanCameraInput.addEventListener("change", () => {
      void handleScannedFileInputChange(el.scanCameraInput, "foto");
    });
  }
  if (el.scanFileInput) {
    el.scanFileInput.addEventListener("change", () => {
      void handleScannedFileInputChange(el.scanFileInput, "archivo");
    });
  }
  if (el.globalAppointmentDate) {
    el.globalAppointmentDate.addEventListener("change", () => {
      const value = stringOrEmpty(el.globalAppointmentDate.value);
      if (!value) {
        return;
      }
      upcomingSelectedDate = value;
      upcomingCalendarMonth = value.slice(0, 7);
      renderUpcomingPlannerCalendar();
    });
  }
  if (el.upcomingCalendarMonth) {
    el.upcomingCalendarMonth.addEventListener("change", () => {
      const value = stringOrEmpty(el.upcomingCalendarMonth.value);
      if (!value) {
        return;
      }
      upcomingCalendarMonth = value;
      const monthPrefix = `${value}-`;
      if (!stringOrEmpty(upcomingSelectedDate).startsWith(monthPrefix)) {
        upcomingSelectedDate = `${value}-01`;
      }
      renderUpcomingPlannerCalendar();
    });
  }
  for (const button of el.upcomingDisplayButtons || []) {
    button.addEventListener("click", () => {
      const mode = button.getAttribute("data-upcoming-display");
      if (mode !== "calendar" && mode !== "day" && mode !== "list") {
        return;
      }
      upcomingCalendarMode = mode === "list" ? "day" : mode;
      renderUpcomingPlannerCalendar();
    });
  }
  if (el.upcomingCalendarGrid) {
    el.upcomingCalendarGrid.addEventListener("click", (event) => {
      const shiftBtn = event.target.closest("[data-day-shift]");
      if (shiftBtn) {
        const delta = Number(shiftBtn.getAttribute("data-day-shift"));
        if (Number.isFinite(delta) && delta !== 0 && typeof shiftUpcomingSelectedDate === "function") {
          shiftUpcomingSelectedDate(delta);
          renderUpcomingPlannerCalendar();
        }
        return;
      }
      const dayBtn = event.target.closest("[data-calendar-date]");
      if (!dayBtn) {
        return;
      }
      const day = stringOrEmpty(dayBtn.getAttribute("data-calendar-date"));
      if (!day) {
        return;
      }
      upcomingSelectedDate = day;
      upcomingCalendarMonth = day.slice(0, 7);
      upcomingCalendarMode = "day";
      if (el.globalAppointmentDate) {
        el.globalAppointmentDate.value = day;
      }
      if (el.quickAppointmentDate) {
        el.quickAppointmentDate.value = day;
      }
      renderUpcomingPlannerCalendar();
    });
  }
  if (el.upcomingDayList) {
    el.upcomingDayList.addEventListener("click", (event) => {
      const openHistoryBtn = event.target.closest("[data-open-history-id]");
      if (openHistoryBtn) {
        openPatient(openHistoryBtn.getAttribute("data-open-history-id"), "history");
        return;
      }

      const openBtn = event.target.closest("[data-open-id]");
      if (openBtn) {
        openPatient(openBtn.getAttribute("data-open-id"));
        return;
      }
      const removeBtn = event.target.closest("[data-remove-upcoming-appointment-id]");
      if (removeBtn) {
        const patientId = removeBtn.getAttribute("data-remove-upcoming-patient-id");
        const appointmentId = removeBtn.getAttribute("data-remove-upcoming-appointment-id");
        removeAppointmentFromPlanner(patientId, appointmentId);
        return;
      }
      const removeExternalBtn = event.target.closest("[data-remove-upcoming-external-id]");
      if (!removeExternalBtn) {
        return;
      }
      const externalAppointmentId = removeExternalBtn.getAttribute("data-remove-upcoming-external-id");
      removeExternalAppointmentFromPlanner(externalAppointmentId);
    });
  }
  if (el.scannedDocsList) {
    el.scannedDocsList.addEventListener("click", (event) => {
      const openBtn = event.target.closest("[data-open-scan-id]");
      if (openBtn) {
        openScannedDocument(openBtn.getAttribute("data-open-scan-id"));
        return;
      }
      const removeBtn = event.target.closest("[data-remove-scan-id]");
      if (removeBtn) {
        removeScannedDocument(removeBtn.getAttribute("data-remove-scan-id"));
      }
    });
  }

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
  if (el.clinicalCycleList) {
    el.clinicalCycleList.addEventListener("click", (event) => {
      const openBtn = event.target.closest("[data-open-cycle-id]");
      if (!openBtn) {
        return;
      }
      openClinicalCycleById(openBtn.getAttribute("data-open-cycle-id"));
    });
  }

  el.appointmentList.addEventListener("click", (event) => {
    const removeBtn = event.target.closest("[data-remove-appointment-id]");
    if (!removeBtn) {
      return;
    }
    removeAppointmentFromPatient(removeBtn.getAttribute("data-remove-appointment-id"));
  });

  el.patientImageList.addEventListener("click", (event) => {
    const removeBtn = event.target.closest("[data-remove-media-id]");
    if (!removeBtn) {
      return;
    }
    removePatientMediaEntry(removeBtn.getAttribute("data-remove-media-id"));
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
      persistDraftPatientIfEditing();
      renderDentitionSwitch();
      renderOdontogram();
      setFeedback(`Visualizando ${DENTITION_LAYOUTS[mode].label.toLowerCase()}.`);
    });
  }

  if (el.odontogramTemplateSelect) {
    el.odontogramTemplateSelect.addEventListener("change", () => {
      const template = stringOrEmpty(el.odontogramTemplateSelect.value);
      if (!isValidOdontogramTemplate(template)) {
        return;
      }
      if (draftPatient.odontogramTemplate === template) {
        return;
      }
      draftPatient.odontogramTemplate = template;
      persistDraftPatientIfEditing();
      renderOdontogramTemplateSelect();
      renderOdontogram();
      const label = getOdontogramTemplatesMap()[template]?.label || template;
      setFeedback(`Plantilla de odontograma: ${label}.`);
    });
  }
}

function bindAuthEvents() {
  if (!el.authShell) {
    return;
  }

  for (const button of el.authTabs) {
    button.addEventListener("click", () => {
      const view = button.getAttribute("data-auth-tab");
      setAuthView(view || "login");
    });
  }

  if (el.logoutBtn) {
    el.logoutBtn.addEventListener("click", () => {
      void logoutCurrentUser();
    });
  }

  if (el.loginForm) {
    el.loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      void loginWithAuthForm();
    });
  }
  if (el.registerForm) {
    el.registerForm.addEventListener("submit", (event) => {
      event.preventDefault();
      void registerWithAuthForm();
    });
  }
  if (el.recoverRequestForm) {
    el.recoverRequestForm.addEventListener("submit", (event) => {
      event.preventDefault();
      void requestPasswordRecovery();
    });
  }
  if (el.recoverResetForm) {
    el.recoverResetForm.addEventListener("submit", (event) => {
      event.preventDefault();
      void resetPasswordFromRecoveryCode();
    });
  }
}

function setAuthView(view) {
  const validViews = new Set(["login", "register", "recover"]);
  authView = validViews.has(view) ? view : "login";

  for (const button of el.authTabs || []) {
    const isActive = button.getAttribute("data-auth-tab") === authView;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  }

  for (const section of el.authViews || []) {
    const isActive = section.getAttribute("data-auth-view") === authView;
    section.classList.toggle("is-active", isActive);
    section.hidden = !isActive;
  }
}

function setAuthMessage(message, mode) {
  if (!el.authMessage) {
    return;
  }
  const text = stringOrEmpty(message);
  el.authMessage.textContent = text;
  el.authMessage.dataset.mode = mode || (text ? "ok" : "");
}

function setAppLocked(locked) {
  const isLocked = Boolean(locked);
  if (el.appShell) {
    el.appShell.classList.toggle("is-locked", isLocked);
  }
  if (el.authShell) {
    el.authShell.classList.toggle("is-hidden", !isLocked);
  }
  if (isLocked) {
    setFeedback("Inicia sesión para acceder a los datos sincronizados.");
  }
}

function setAuthenticatedUser(user, token) {
  authToken = stringOrEmpty(token);
  currentAuthUser = user && typeof user === "object" ? user : null;

  if (authToken) {
    localStorage.setItem(AUTH_TOKEN_KEY, authToken);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }

  const displayName = stringOrEmpty(currentAuthUser?.name)
    || stringOrEmpty(currentAuthUser?.username)
    || stringOrEmpty(currentAuthUser?.email)
    || "Usuario";

  if (el.authUserBadge) {
    el.authUserBadge.hidden = !currentAuthUser || authMode === "local";
  }
  if (el.authUserLabel) {
    el.authUserLabel.textContent = displayName;
  }
  if (el.logoutBtn) {
    el.logoutBtn.hidden = authMode === "local" || !currentAuthUser;
  }
}

function getAuthRequestErrorMessage(error, fallbackMessage) {
  const rawMessage = stringOrEmpty(error?.message);
  if (
    error?.name === "AbortError"
    || /failed to fetch|networkerror|network request failed/i.test(rawMessage)
  ) {
    if (authMode === "appwrite") {
      return "No pudimos comunicarnos con el servicio seguro de Arete. Revisa la conexión y la plataforma Web configurada en Appwrite.";
    }
    return "No se pudo conectar con el servidor de cuentas. Abre “Iniciar Arete - Estable con registro.cmd” y vuelve a intentarlo.";
  }
  return rawMessage || fallbackMessage;
}

async function initializeAuth() {
  if (isAppwriteConfigured()) {
    authMode = "appwrite";
    authBackendEnabled = false;
    updateStorageModePresentation("cloud");
    const appwriteCallbackHandled = await hydrateAppwriteCallbackFromUrl();
    try {
      const user = await getCurrentAppwriteAccount();
      setAuthenticatedUser(user, "");
      setAppLocked(false);
      await initializeAppwriteStorage();
      setAuthMessage("");
      setFeedback(`Sesión activa: ${stringOrEmpty(user?.name) || stringOrEmpty(user?.username)}.`);
      return;
    } catch (error) {
      if (Number(error?.status || 0) !== 401) {
        console.error("No se pudo restaurar la sesión de Appwrite.", error);
      }
    }
    setAuthenticatedUser(null, "");
    setAppLocked(true);
    if (!appwriteCallbackHandled) {
      setAuthMessage("Acceso seguro de Arete. Inicia sesión o crea tu cuenta para sincronizar tus expedientes.", "ok");
    }
    return;
  }

  backendRuntime = await detectBackendRuntime();
  authMode = backendRuntime.reachable && backendRuntime.deploymentMode === "cloud"
    ? "cloud"
    : "local";
  authBackendEnabled = authMode === "cloud";

  if (authMode === "cloud") {
    updateStorageModePresentation("cloud");
    const restored = await tryRestoreBackendSession();
    if (restored) {
      setAppLocked(false);
      await initializeBackendStorage();
      setAuthMessage("");
      setFeedback(`Sesión activa: ${stringOrEmpty(currentAuthUser?.name) || stringOrEmpty(currentAuthUser?.username)}.`);
      return;
    }
    setAuthenticatedUser(null, "");
    setAppLocked(true);
    setAuthMessage("Acceso seguro de Arete. Inicia sesión o crea una cuenta para sincronizar tus expedientes.", "ok");
    return;
  }

  activateLocalWorkspace();
}

async function hydrateAppwriteCallbackFromUrl() {
  const params = new URLSearchParams(window.location.search);
  appwriteRecoveryUserId = stringOrEmpty(params.get("userId"));
  appwriteRecoverySecret = stringOrEmpty(params.get("secret"));
  if (!appwriteRecoveryUserId || !appwriteRecoverySecret) {
    return false;
  }
  if (params.get("mode") === "verify") {
    try {
      await completeAppwriteVerification(appwriteRecoveryUserId, appwriteRecoverySecret);
      window.history.replaceState({}, document.title, window.location.pathname);
      appwriteRecoveryUserId = "";
      appwriteRecoverySecret = "";
      setAuthMessage("Correo confirmado correctamente. Tu cuenta Arete ya está verificada.", "ok");
    } catch (error) {
      setAuthMessage(getAuthRequestErrorMessage(error, "No pudimos verificar este enlace."), "error");
    }
    return true;
  }
  setAuthView("recover");
  if (el.recoverCode) {
    el.recoverCode.value = appwriteRecoverySecret;
  }
  setAuthMessage("Enlace verificado. Escribe y confirma tu nueva contraseña.", "ok");
  return true;
}

async function detectBackendRuntime() {
  if (!apiBaseUrl) {
    return { reachable: false, deploymentMode: "local", storage: "browser-local" };
  }
  try {
    const response = await apiRequest("/api/health", { method: "GET" }, 3200);
    if (!response.ok) {
      return { reachable: false, deploymentMode: "local", storage: "browser-local" };
    }
    const payload = await response.json().catch(() => ({}));
    return {
      reachable: true,
      deploymentMode: payload?.deploymentMode === "cloud" ? "cloud" : "local",
      storage: stringOrEmpty(payload?.storage) || "browser-local"
    };
  } catch {
    return { reachable: false, deploymentMode: "local", storage: "browser-local" };
  }
}

function activateLocalWorkspace() {
  authMode = "local";
  authBackendEnabled = false;
  storageMode = "local";
  setAuthenticatedUser(null, "");
  setAppLocked(false);
  setAuthMessage("");
  updateStorageModePresentation("local");
  setFeedback("Modo local activo. Los expedientes se guardan solo en este dispositivo; exporta respaldos con frecuencia.");
}

function updateStorageModePresentation(mode) {
  const isCloud = mode === "cloud";
  if (el.storageModeTitle) {
    el.storageModeTitle.textContent = isCloud
      ? "Datos sincronizados con tu cuenta"
      : "Datos guardados en este dispositivo";
  }
  if (el.storageModeDescription) {
    el.storageModeDescription.textContent = isCloud
      ? "Los expedientes se almacenan en el servidor configurado y están disponibles al iniciar sesión."
      : "No necesitas cuenta. Este navegador conserva los expedientes localmente; usa Exportar respaldo para protegerlos.";
  }
}

async function tryRestoreBackendSession() {
  if (!authToken || !apiBaseUrl) {
    return false;
  }
  try {
    const response = await apiRequest(
      "/api/auth/me",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      },
      5000
    );
    if (!response.ok) {
      return false;
    }
    const payload = await response.json();
    if (!payload?.user) {
      return false;
    }
    setAuthenticatedUser(payload.user, authToken);
    return true;
  } catch {
    return false;
  }
}

async function loginWithAuthForm() {
  if (authMode === "appwrite") {
    const email = stringOrEmpty(el.loginIdentifier?.value).toLowerCase();
    const password = stringOrEmpty(el.loginPassword?.value);
    if (!email || !password) {
      setAuthMessage("Escribe tu correo y contraseña.", "error");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setAuthMessage("Para iniciar sesión con Appwrite usa el correo asociado a tu cuenta.", "error");
      return;
    }
    setAuthMessage("Verificando tus datos de acceso...");
    try {
      const user = await createAppwriteSession(email, password);
      setAuthenticatedUser(user, "");
      setAppLocked(false);
      await initializeAppwriteStorage();
      el.loginForm?.reset();
      setAuthMessage("");
      setFeedback(`Bienvenido, ${stringOrEmpty(user?.name) || stringOrEmpty(user?.username)}.`);
    } catch (error) {
      setAuthMessage(getAuthRequestErrorMessage(error, "No pudimos iniciar sesión. Revisa tu correo y contraseña."), "error");
    }
    return;
  }
  if (!authBackendEnabled || authMode !== "cloud") {
    activateLocalWorkspace();
    return;
  }
  const identifier = stringOrEmpty(el.loginIdentifier?.value);
  const password = stringOrEmpty(el.loginPassword?.value);
  if (!identifier || !password) {
    setAuthMessage("Escribe usuario/correo y contraseña.", "error");
    return;
  }

  setAuthMessage("Validando acceso...");
  try {
    const response = await apiRequest(
      "/api/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password })
      },
      10000
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || payload?.detail || "No se pudo iniciar sesión.");
    }
    setAuthenticatedUser(payload.user, payload.token);

    setAppLocked(false);
    await initializeBackendStorage();
    setAuthMessage("");
    setFeedback(`Bienvenido, ${stringOrEmpty(currentAuthUser?.name) || stringOrEmpty(currentAuthUser?.username)}.`);
    if (el.loginForm) {
      el.loginForm.reset();
    }
  } catch (error) {
    setAuthMessage(getAuthRequestErrorMessage(error, "Acceso inválido."), "error");
  }
}

async function registerWithAuthForm() {
  if (authMode !== "appwrite" && (!authBackendEnabled || authMode !== "cloud")) {
    activateLocalWorkspace();
    return;
  }
  const name = stringOrEmpty(el.registerName?.value);
  const email = stringOrEmpty(el.registerEmail?.value).toLowerCase();
  const username = stringOrEmpty(el.registerUsername?.value).toLowerCase();
  const password = stringOrEmpty(el.registerPassword?.value);
  const confirmPassword = stringOrEmpty(el.registerPasswordConfirm?.value);

  if (!name || !email || !username || !password) {
    setAuthMessage("Completa nombre, correo, usuario y contraseña.", "error");
    return;
  }
  if (password.length < 8) {
    setAuthMessage("La contraseña debe tener al menos 8 caracteres.", "error");
    return;
  }
  if (password !== confirmPassword) {
    setAuthMessage("La confirmación de contraseña no coincide.", "error");
    return;
  }

  setAuthMessage("Creando cuenta...");
  try {
    if (authMode === "appwrite") {
      const user = await createAppwriteAccount({ name, email, username, password });
      setAuthenticatedUser(user, "");
      setAppLocked(false);
      await initializeAppwriteStorage();
      el.registerForm?.reset();
      setAuthMessage("");
      setFeedback("Tu cuenta Arete fue creada. Revisa tu correo para confirmar la dirección y conservar el acceso.");
      return;
    }
    const response = await apiRequest(
      "/api/auth/register",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, username, password })
      },
      10000
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || payload?.detail || "No se pudo crear la cuenta.");
    }
    setAuthenticatedUser(payload.user, payload.token);

    setAppLocked(false);
    await initializeBackendStorage();
    if (el.registerForm) {
      el.registerForm.reset();
    }
    setAuthMessage("");
    setFeedback(`Cuenta creada para ${stringOrEmpty(currentAuthUser?.name)}.`);
  } catch (error) {
    setAuthMessage(getAuthRequestErrorMessage(error, "No se pudo registrar la cuenta."), "error");
  }
}

async function requestPasswordRecovery() {
  if (authMode !== "appwrite" && (!authBackendEnabled || authMode !== "cloud")) {
    activateLocalWorkspace();
    return;
  }
  const identifier = stringOrEmpty(el.recoverIdentifier?.value);
  if (!identifier) {
    setAuthMessage("Escribe el correo asociado a tu cuenta.", "error");
    return;
  }

  setAuthMessage("Preparando tu correo de recuperación...");
  try {
    if (authMode === "appwrite") {
      await createAppwriteRecovery(identifier.toLowerCase());
      setAuthMessage("Te enviamos un enlace seguro de Arete. Revisa también la carpeta de correo no deseado.", "ok");
      return;
    }
    const response = await apiRequest(
      "/api/auth/forgot",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier })
      },
      10000
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || payload?.detail || "No se pudo generar el código.");
    }
    const helperCode = stringOrEmpty(payload?.recoveryCode);
    if (helperCode) {
      setAuthMessage(`Código generado: ${helperCode}. Úsalo abajo para restablecer contraseña.`, "ok");
    } else {
      setAuthMessage("Código de recuperación enviado. Revisa tu método configurado.", "ok");
    }
  } catch (error) {
    setAuthMessage(getAuthRequestErrorMessage(error, "No se pudo generar el código de recuperación."), "error");
  }
}

async function resetPasswordFromRecoveryCode() {
  if (authMode !== "appwrite" && (!authBackendEnabled || authMode !== "cloud")) {
    activateLocalWorkspace();
    return;
  }
  const identifier = stringOrEmpty(el.recoverIdentifier?.value);
  const code = stringOrEmpty(el.recoverCode?.value) || appwriteRecoverySecret;
  const newPassword = stringOrEmpty(el.recoverNewPassword?.value);
  const confirmPassword = stringOrEmpty(el.recoverNewPasswordConfirm?.value);

  if ((authMode !== "appwrite" && !identifier) || !code || !newPassword) {
    setAuthMessage("Abre el enlace recibido y completa la nueva contraseña.", "error");
    return;
  }
  if (newPassword.length < 8) {
    setAuthMessage("La nueva contraseña debe tener al menos 8 caracteres.", "error");
    return;
  }
  if (newPassword !== confirmPassword) {
    setAuthMessage("La confirmación de la nueva contraseña no coincide.", "error");
    return;
  }

  setAuthMessage("Actualizando contraseña...");
  try {
    if (authMode === "appwrite") {
      if (!appwriteRecoveryUserId) {
        setAuthMessage("Abre el enlace completo que enviamos a tu correo para continuar.", "error");
        return;
      }
      await completeAppwriteRecovery(appwriteRecoveryUserId, code, newPassword);
      el.recoverResetForm?.reset();
      appwriteRecoveryUserId = "";
      appwriteRecoverySecret = "";
      window.history.replaceState({}, document.title, window.location.pathname);
      setAuthView("login");
      setAuthMessage("Tu contraseña fue actualizada. Ya puedes iniciar sesión con tu correo.", "ok");
      return;
    }
    const response = await apiRequest(
      "/api/auth/reset",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, code, newPassword })
      },
      10000
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || payload?.detail || "No se pudo restablecer la contraseña.");
    }
    setAuthenticatedUser(payload.user, payload.token);

    setAppLocked(false);
    await initializeBackendStorage();
    if (el.recoverResetForm) {
      el.recoverResetForm.reset();
    }
    setAuthMessage("Contraseña restablecida correctamente.", "ok");
    setFeedback("Contraseña actualizada. Sesión iniciada.");
  } catch (error) {
    setAuthMessage(getAuthRequestErrorMessage(error, "No se pudo restablecer la contraseña."), "error");
  }
}

async function logoutCurrentUser() {
  if (authMode === "local") {
    activateLocalWorkspace();
    return;
  }
  try {
    if (authMode === "appwrite") {
      await deleteCurrentAppwriteSession();
    }
    if (authBackendEnabled && authToken) {
      await apiRequest(
        "/api/auth/logout",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${authToken}` }
        },
        4500
      );
    }
  } catch {
    // No bloquear cierre local si falla backend
  }

  setAuthenticatedUser(null, "");
  setAppLocked(true);
  setAuthView("login");
  setAuthMessage("Sesión cerrada. Vuelve a iniciar sesión para continuar.", "ok");
  setFeedback("Sesión cerrada.");
}

