function setActiveView(view) {
  const validViews = new Set(["home", "patient", "registry", "upcoming"]);
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

function setActivePatientSubview(view) {
  const validViews = new Set(["profile", "odontogram", "pathologies", "media", "history"]);
  const nextView = validViews.has(view) ? view : "profile";
  activePatientSubview = nextView;

  for (const button of el.patientSubTabs) {
    const isActive = button.getAttribute("data-patient-tab") === nextView;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  }

  for (const section of el.patientSubSections) {
    const isActive = section.getAttribute("data-patient-subview") === nextView;
    section.classList.toggle("is-active", isActive);
    section.hidden = !isActive;
  }
}

function setActiveUpcomingSubview(view) {
  const validViews = new Set(["overview", "planner", "composer"]);
  const nextView = validViews.has(view) ? view : "overview";
  activeUpcomingSubview = nextView;

  for (const button of el.upcomingSubTabs || []) {
    const isActive = button.getAttribute("data-upcoming-tab") === nextView;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  }

  for (const section of el.upcomingSubSections || []) {
    const isActive = section.getAttribute("data-upcoming-subview") === nextView;
    section.classList.toggle("is-active", isActive);
    section.hidden = !isActive;
  }

  if (nextView === "composer" && el.globalAppointmentDate) {
    el.globalAppointmentDate.value = upcomingSelectedDate || getTodayInputDate();
  }
}

function handleToothNodeClick(event) {
  const toothBtn = event.target.closest("[data-tooth-id]");
  if (!toothBtn) {
    return;
  }
  applyOdontoMark("teeth", toothBtn.getAttribute("data-tooth-id"));
}

