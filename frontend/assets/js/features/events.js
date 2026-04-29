function bindEvents() {
  el.newPatientBtn.addEventListener("click", () => {
    setActiveView("patient");
    startNewPatient(true);
  });
  if (el.openPatientWorkspaceBtn) {
    el.openPatientWorkspaceBtn.addEventListener("click", () => {
      setActiveView("patient");
      startNewPatient(true);
    });
  }
  if (el.openPathologiesBtn) {
    el.openPathologiesBtn.addEventListener("click", focusPathologiesSection);
  }
  for (const button of el.viewTabs) {
    button.addEventListener("click", () => {
      const targetView = button.getAttribute("data-view-tab");
      setActiveView(targetView);
      if (targetView === "patient") {
        setActivePatientSubview("profile");
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
  el.patientImageInput.addEventListener("change", handlePatientImageUpload);
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
  if (el.upcomingPreviewAppointment) {
    el.upcomingPreviewAppointment.addEventListener("click", (event) => {
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
  if (el.upcomingFabToggle) {
    el.upcomingFabToggle.addEventListener("click", () => {
      setUpcomingFabOpen(!upcomingFabOpen);
    });
  }
  if (el.upcomingFabAddPlan) {
    el.upcomingFabAddPlan.addEventListener("click", () => {
      setActiveUpcomingSubview("composer");
      setUpcomingFabOpen(false);
    });
  }
  if (el.upcomingFabScan) {
    el.upcomingFabScan.addEventListener("click", () => {
      setActiveUpcomingSubview("planner");
      setUpcomingFabOpen(false);
      setUpcomingScanPanelOpen(true);
    });
  }
  if (el.upcomingScanCloseBtn) {
    el.upcomingScanCloseBtn.addEventListener("click", () => {
      setUpcomingScanPanelOpen(false);
    });
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
  if (el.upcomingScanPanel) {
    el.upcomingScanPanel.addEventListener("click", (event) => {
      if (event.target === el.upcomingScanPanel) {
        setUpcomingScanPanelOpen(false);
      }
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
      if (mode !== "calendar" && mode !== "list") {
        return;
      }
      upcomingCalendarMode = mode;
      renderUpcomingPlannerCalendar();
    });
  }
  if (el.upcomingCalendarGrid) {
    el.upcomingCalendarGrid.addEventListener("click", (event) => {
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
    setFeedback("Inicia sesión para acceder al sistema.");
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
    el.authUserBadge.hidden = !currentAuthUser;
  }
  if (el.authUserLabel) {
    el.authUserLabel.textContent = displayName;
  }
}

async function initializeAuth() {
  authBackendEnabled = await isBackendAuthReachable();

  if (authBackendEnabled) {
    const restored = await tryRestoreBackendSession();
    if (restored) {
      setAppLocked(false);
      await initializeBackendStorage();
      setAuthMessage("");
      setFeedback(`Sesión activa: ${stringOrEmpty(currentAuthUser?.name) || stringOrEmpty(currentAuthUser?.username)}.`);
      return;
    }
  } else {
    ensureLocalDemoAccounts();
    const restoredLocal = tryRestoreLocalSession();
    if (restoredLocal) {
      setAppLocked(false);
      await initializeBackendStorage();
      setAuthMessage("");
      setFeedback(`Sesión local activa: ${stringOrEmpty(currentAuthUser?.name) || stringOrEmpty(currentAuthUser?.username)}.`);
      return;
    }
    setAuthMessage("Modo local activo (sin backend). Usuarios demo: demoarete, demoarete2 y demoarete3.", "ok");
  }

  setAuthenticatedUser(null, "");
  setAppLocked(true);
}

async function isBackendAuthReachable() {
  if (!apiBaseUrl) {
    return false;
  }
  try {
    const response = await apiRequest("/api/health", { method: "GET" }, 3200);
    return response.ok;
  } catch {
    return false;
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

function tryRestoreLocalSession() {
  const token = stringOrEmpty(localStorage.getItem(AUTH_TOKEN_KEY));
  if (!token) {
    return false;
  }
  const users = readLocalAuthUsers();
  const found = users.find((entry) => entry.id === token);
  if (!found) {
    return false;
  }
  setAuthenticatedUser(sanitizeLocalUser(found), token);
  return true;
}

async function loginWithAuthForm() {
  const identifier = stringOrEmpty(el.loginIdentifier?.value);
  const password = stringOrEmpty(el.loginPassword?.value);
  if (!identifier || !password) {
    setAuthMessage("Escribe usuario/correo y contraseña.", "error");
    return;
  }

  setAuthMessage("Validando acceso...");
  try {
    if (authBackendEnabled) {
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
    } else {
      const localResult = localLogin(identifier, password);
      setAuthenticatedUser(localResult.user, localResult.token);
    }

    setAppLocked(false);
    await initializeBackendStorage();
    setAuthMessage("");
    setFeedback(`Bienvenido, ${stringOrEmpty(currentAuthUser?.name) || stringOrEmpty(currentAuthUser?.username)}.`);
    if (el.loginForm) {
      el.loginForm.reset();
    }
  } catch (error) {
    setAuthMessage(error?.message || "Acceso inválido.", "error");
  }
}

async function registerWithAuthForm() {
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
    if (authBackendEnabled) {
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
    } else {
      const localResult = localRegister({ name, email, username, password });
      setAuthenticatedUser(localResult.user, localResult.token);
    }

    setAppLocked(false);
    await initializeBackendStorage();
    if (el.registerForm) {
      el.registerForm.reset();
    }
    setAuthMessage("");
    setFeedback(`Cuenta creada para ${stringOrEmpty(currentAuthUser?.name)}.`);
  } catch (error) {
    setAuthMessage(error?.message || "No se pudo registrar la cuenta.", "error");
  }
}

async function requestPasswordRecovery() {
  const identifier = stringOrEmpty(el.recoverIdentifier?.value);
  if (!identifier) {
    setAuthMessage("Escribe correo o usuario para recuperar contraseña.", "error");
    return;
  }

  setAuthMessage("Generando código de recuperación...");
  try {
    if (authBackendEnabled) {
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
    } else {
      const localCode = localRequestRecoveryCode(identifier);
      setAuthMessage(`Código local de recuperación: ${localCode}.`, "ok");
    }
  } catch (error) {
    setAuthMessage(error?.message || "No se pudo generar el código de recuperación.", "error");
  }
}

async function resetPasswordFromRecoveryCode() {
  const identifier = stringOrEmpty(el.recoverIdentifier?.value);
  const code = stringOrEmpty(el.recoverCode?.value);
  const newPassword = stringOrEmpty(el.recoverNewPassword?.value);
  const confirmPassword = stringOrEmpty(el.recoverNewPasswordConfirm?.value);

  if (!identifier || !code || !newPassword) {
    setAuthMessage("Completa correo/usuario, código y nueva contraseña.", "error");
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
    if (authBackendEnabled) {
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
    } else {
      const localResult = localResetPassword({ identifier, code, newPassword });
      setAuthenticatedUser(localResult.user, localResult.token);
    }

    setAppLocked(false);
    await initializeBackendStorage();
    if (el.recoverResetForm) {
      el.recoverResetForm.reset();
    }
    setAuthMessage("Contraseña restablecida correctamente.", "ok");
    setFeedback("Contraseña actualizada. Sesión iniciada.");
  } catch (error) {
    setAuthMessage(error?.message || "No se pudo restablecer la contraseña.", "error");
  }
}

async function logoutCurrentUser() {
  try {
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

function readLocalAuthUsers() {
  try {
    const raw = localStorage.getItem(AUTH_LOCAL_USERS_KEY);
    const parsed = JSON.parse(raw || "[]");
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((entry) => entry && typeof entry === "object");
  } catch {
    return [];
  }
}

function ensureLocalDemoAccounts() {
  const users = readLocalAuthUsers();
  let changed = false;

  for (const account of DEMO_TEST_ACCOUNTS) {
    const demoEmail = String(account.email || "").toLowerCase();
    const demoUsername = String(account.username || "").toLowerCase();
    const alreadyExists = users.some((entry) => {
      const email = stringOrEmpty(entry?.email).toLowerCase();
      const username = stringOrEmpty(entry?.username).toLowerCase();
      return email === demoEmail || username === demoUsername;
    });
    if (alreadyExists) {
      continue;
    }

    users.push({
      id: generateId("usr"),
      name: String(account.name || "").trim(),
      email: demoEmail,
      username: demoUsername,
      password: String(account.password || ""),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    changed = true;
  }

  if (changed) {
    writeLocalAuthUsers(users);
  }
}

function writeLocalAuthUsers(users) {
  localStorage.setItem(AUTH_LOCAL_USERS_KEY, JSON.stringify(Array.isArray(users) ? users : []));
}

function sanitizeLocalUser(user) {
  return {
    id: stringOrEmpty(user?.id),
    name: stringOrEmpty(user?.name),
    email: stringOrEmpty(user?.email).toLowerCase(),
    username: stringOrEmpty(user?.username).toLowerCase()
  };
}

function localRegister({ name, email, username, password }) {
  const users = readLocalAuthUsers();
  const hasEmail = users.some((entry) => stringOrEmpty(entry.email).toLowerCase() === email);
  if (hasEmail) {
    throw new Error("Ese correo ya está registrado.");
  }
  const hasUsername = users.some((entry) => stringOrEmpty(entry.username).toLowerCase() === username);
  if (hasUsername) {
    throw new Error("Ese nombre de usuario ya existe.");
  }

  const user = {
    id: generateId("usr"),
    name,
    email,
    username,
    password,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  users.push(user);
  writeLocalAuthUsers(users);
  return {
    user: sanitizeLocalUser(user),
    token: user.id
  };
}

function localLogin(identifier, password) {
  const users = readLocalAuthUsers();
  const needle = identifier.toLowerCase();
  const found = users.find((entry) => {
    const email = stringOrEmpty(entry.email).toLowerCase();
    const username = stringOrEmpty(entry.username).toLowerCase();
    return email === needle || username === needle;
  });
  if (!found || stringOrEmpty(found.password) !== password) {
    throw new Error("Credenciales inválidas.");
  }
  return {
    user: sanitizeLocalUser(found),
    token: found.id
  };
}

function readLocalRecoveryStore() {
  try {
    const raw = localStorage.getItem(AUTH_LOCAL_RESET_KEY);
    const parsed = JSON.parse(raw || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocalRecoveryStore(store) {
  localStorage.setItem(AUTH_LOCAL_RESET_KEY, JSON.stringify(store && typeof store === "object" ? store : {}));
}

function localRequestRecoveryCode(identifier) {
  const users = readLocalAuthUsers();
  const needle = identifier.toLowerCase();
  const found = users.find((entry) => {
    const email = stringOrEmpty(entry.email).toLowerCase();
    const username = stringOrEmpty(entry.username).toLowerCase();
    return email === needle || username === needle;
  });
  if (!found) {
    throw new Error("No existe una cuenta con ese correo/usuario.");
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const store = readLocalRecoveryStore();
  store[found.id] = {
    code,
    expiresAt: Date.now() + 15 * 60 * 1000
  };
  writeLocalRecoveryStore(store);
  return code;
}

function localResetPassword({ identifier, code, newPassword }) {
  const users = readLocalAuthUsers();
  const needle = identifier.toLowerCase();
  const foundIndex = users.findIndex((entry) => {
    const email = stringOrEmpty(entry.email).toLowerCase();
    const username = stringOrEmpty(entry.username).toLowerCase();
    return email === needle || username === needle;
  });
  if (foundIndex < 0) {
    throw new Error("No existe una cuenta con ese correo/usuario.");
  }

  const found = users[foundIndex];
  const store = readLocalRecoveryStore();
  const recovery = store[found.id];
  if (!recovery || String(recovery.code) !== String(code)) {
    throw new Error("Código de recuperación incorrecto.");
  }
  if (Number(recovery.expiresAt || 0) < Date.now()) {
    throw new Error("El código de recuperación expiró.");
  }

  users[foundIndex] = {
    ...found,
    password: newPassword,
    updatedAt: new Date().toISOString()
  };
  writeLocalAuthUsers(users);
  delete store[found.id];
  writeLocalRecoveryStore(store);

  return {
    user: sanitizeLocalUser(users[foundIndex]),
    token: users[foundIndex].id
  };
}

