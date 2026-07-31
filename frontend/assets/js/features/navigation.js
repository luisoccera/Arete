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
  const validViews = new Set(["profile", "odontogram", "pathologies", "media", "history", "updates"]);
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
  const validViews = new Set(["overview", "planner"]);
  const nextView = validViews.has(view) ? view : "planner";
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

  if (nextView !== "planner") {
    setPlannerComposerVisible(false);
  }
}

function setPlannerComposerVisible(visible) {
  if (!el.plannerComposerPanel) {
    return;
  }
  const isOpen = Boolean(visible);
  el.plannerComposerPanel.hidden = !isOpen;
  el.plannerComposerPanel.classList.toggle("is-open", isOpen);
  if (el.openComposerBtn) {
    el.openComposerBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  }
  if (el.openComposerForDayBtn) {
    el.openComposerForDayBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  }
  if (el.openComposerTextBtn) {
    el.openComposerTextBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  }
}

function handleToothNodeClick(event) {
  const partNode = event.target.closest("[data-tooth-part]");
  if (partNode) {
    const toothNode = partNode.closest("[data-tooth-id]");
    if (!toothNode) {
      return;
    }
    const toothId = toothNode.getAttribute("data-tooth-id");
    const partId = partNode.getAttribute("data-tooth-part");
    const markKey = buildOdontoToothMarkKey(toothId, partId);
    if (!markKey) {
      return;
    }
    applyOdontoMark("teeth", markKey);
    return;
  }
  // En odontograma segmentado se marca por zona; evitamos clic general en toda la pieza
  // para no mezclar estados de "pieza completa" con estados por superficie.
  return;
}

