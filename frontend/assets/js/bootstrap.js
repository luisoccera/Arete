const el = {
  authShell: document.getElementById("authShell"),
  appShell: document.getElementById("appShell"),
  authTabs: Array.from(document.querySelectorAll("[data-auth-tab]")),
  authViews: Array.from(document.querySelectorAll("[data-auth-view]")),
  loginForm: document.getElementById("loginForm"),
  loginIdentifier: document.getElementById("loginIdentifier"),
  loginPassword: document.getElementById("loginPassword"),
  registerForm: document.getElementById("registerForm"),
  registerName: document.getElementById("registerName"),
  registerEmail: document.getElementById("registerEmail"),
  registerUsername: document.getElementById("registerUsername"),
  registerPassword: document.getElementById("registerPassword"),
  registerPasswordConfirm: document.getElementById("registerPasswordConfirm"),
  recoverRequestForm: document.getElementById("recoverRequestForm"),
  recoverIdentifier: document.getElementById("recoverIdentifier"),
  recoverResetForm: document.getElementById("recoverResetForm"),
  recoverCode: document.getElementById("recoverCode"),
  recoverNewPassword: document.getElementById("recoverNewPassword"),
  recoverNewPasswordConfirm: document.getElementById("recoverNewPasswordConfirm"),
  authMessage: document.getElementById("authMessage"),
  authUserBadge: document.getElementById("authUserBadge"),
  authUserLabel: document.getElementById("authUserLabel"),
  logoutBtn: document.getElementById("logoutBtn"),
  newPatientBtn: document.getElementById("newPatientBtn"),
  openPatientWorkspaceBtn: document.getElementById("openPatientWorkspaceBtn"),
  openPathologiesBtn: document.getElementById("openPathologiesBtn"),
  exportBtn: document.getElementById("exportBtn"),
  importFile: document.getElementById("importFile"),
  viewTabs: Array.from(document.querySelectorAll("[data-view-tab]")),
  viewSections: Array.from(document.querySelectorAll("[data-view-section]")),
  patientSubTabs: Array.from(document.querySelectorAll("[data-patient-tab]")),
  patientSubSections: Array.from(document.querySelectorAll("[data-patient-subview]")),
  searchInput: document.getElementById("searchInput"),
  upcomingCount: document.getElementById("upcomingCount"),
  upcomingList: document.getElementById("upcomingList"),
  upcomingPreviewAppointment: document.getElementById("upcomingPreviewAppointment"),
  upcomingSubTabs: Array.from(document.querySelectorAll("[data-upcoming-tab]")),
  upcomingSubSections: Array.from(document.querySelectorAll("[data-upcoming-subview]")),
  globalAppointmentPatient: document.getElementById("globalAppointmentPatient"),
  globalAppointmentPatientOptions: document.getElementById("globalAppointmentPatientOptions"),
  globalAppointmentDate: document.getElementById("globalAppointmentDate"),
  globalAppointmentStartTime: document.getElementById("globalAppointmentStartTime"),
  globalAppointmentEndTime: document.getElementById("globalAppointmentEndTime"),
  globalAppointmentReason: document.getElementById("globalAppointmentReason"),
  quickAppointmentPatient: document.getElementById("quickAppointmentPatient"),
  quickAppointmentDate: document.getElementById("quickAppointmentDate"),
  quickAppointmentStartTime: document.getElementById("quickAppointmentStartTime"),
  quickAppointmentEndTime: document.getElementById("quickAppointmentEndTime"),
  quickAppointmentReason: document.getElementById("quickAppointmentReason"),
  quickAddAppointmentBtn: document.getElementById("quickAddAppointmentBtn"),
  addGlobalAppointmentBtn: document.getElementById("addGlobalAppointmentBtn"),
  openComposerBtn: document.getElementById("openComposerBtn"),
  openComposerForDayBtn: document.getElementById("openComposerForDayBtn"),
  upcomingPlannerSuite: document.getElementById("upcomingPlannerSuite"),
  plannerMonthLabel: document.getElementById("plannerMonthLabel"),
  plannerMonthSub: document.getElementById("plannerMonthSub"),
  upcomingDisplayButtons: Array.from(document.querySelectorAll("[data-upcoming-display]")),
  upcomingCalendarMonth: document.getElementById("upcomingCalendarMonth"),
  upcomingCalendarGrid: document.getElementById("upcomingCalendarGrid"),
  upcomingDayTitle: document.getElementById("upcomingDayTitle"),
  upcomingDayList: document.getElementById("upcomingDayList"),
  scannedDocsList: document.getElementById("scannedDocsList"),
  scanTakePhotoBtn: document.getElementById("scanTakePhotoBtn"),
  scanUploadFileBtn: document.getElementById("scanUploadFileBtn"),
  scanCameraInput: document.getElementById("scanCameraInput"),
  scanFileInput: document.getElementById("scanFileInput"),
  savePatientBtn: document.getElementById("savePatientBtn"),
  deleteCurrentPatientBtn: document.getElementById("deleteCurrentPatientBtn"),
  formTitle: document.getElementById("formTitle"),
  patientForm: document.getElementById("patientForm"),
  pathologiesCard: document.getElementById("pathologiesCard"),
  patientRows: document.getElementById("patientRows"),
  diseaseChecklist: document.getElementById("diseaseChecklist"),
  newDiseaseName: document.getElementById("newDiseaseName"),
  newDiseaseColor: document.getElementById("newDiseaseColor"),
  addDiseaseBtn: document.getElementById("addDiseaseBtn"),
  diseaseCatalog: document.getElementById("diseaseCatalog"),
  jawBackdrop: document.getElementById("jawBackdrop"),
  upperJawArc: document.getElementById("upperJawArc"),
  lowerJawArc: document.getElementById("lowerJawArc"),
  zoneList: document.getElementById("zoneList"),
  dentitionLabel: document.getElementById("dentitionLabel"),
  dentitionStandardHint: document.getElementById("dentitionStandardHint"),
  dentitionSwitchButtons: Array.from(document.querySelectorAll("[data-dentition]")),
  clearOdontogramBtn: document.getElementById("clearOdontogramBtn"),
  quickAddStatusBtn: document.getElementById("quickAddStatusBtn"),
  toothStatusSelect: document.getElementById("toothStatusSelect"),
  statusLegend: document.getElementById("statusLegend"),
  newStatusName: document.getElementById("newStatusName"),
  newStatusColor: document.getElementById("newStatusColor"),
  addStatusBtn: document.getElementById("addStatusBtn"),
  addClinicalNoteBtn: document.getElementById("addClinicalNoteBtn"),
  clinicalRecordType: document.getElementById("clinicalRecordType"),
  clinicalRecordReference: document.getElementById("clinicalRecordReference"),
  clinicalFormatTitle: document.getElementById("clinicalFormatTitle"),
  clinicalFormatFields: document.getElementById("clinicalFormatFields"),
  exportClinicalDocBtn: document.getElementById("exportClinicalDocBtn"),
  printClinicalDocBtn: document.getElementById("printClinicalDocBtn"),
  clinicalNoteDate: document.getElementById("clinicalNoteDate"),
  clinicalNoteTitle: document.getElementById("clinicalNoteTitle"),
  clinicalNoteText: document.getElementById("clinicalNoteText"),
  patientHistoryList: document.getElementById("patientHistoryList"),
  feedbackMessage: document.getElementById("feedbackMessage"),
  patientName: document.getElementById("patientName"),
  patientLastNameFather: document.getElementById("patientLastNameFather"),
  patientLastNameMother: document.getElementById("patientLastNameMother"),
  patientAge: document.getElementById("patientAge"),
  patientSex: document.getElementById("patientSex"),
  patientLocation: document.getElementById("patientLocation"),
  birthDate: document.getElementById("birthDate"),
  phone: document.getElementById("phone"),
  occupation: document.getElementById("occupation"),
  medications: document.getElementById("medications"),
  dentistName: document.getElementById("dentistName"),
  allergies: document.getElementById("allergies"),
  consultationDate: document.getElementById("consultationDate"),
  nextConsultationDate: document.getElementById("nextConsultationDate"),
  treatmentStart: document.getElementById("treatmentStart"),
  appointmentDate: document.getElementById("appointmentDate"),
  appointmentTime: document.getElementById("appointmentTime"),
  appointmentReason: document.getElementById("appointmentReason"),
  addAppointmentBtn: document.getElementById("addAppointmentBtn"),
  appointmentList: document.getElementById("appointmentList"),
  patientImageType: document.getElementById("patientImageType"),
  patientImageInput: document.getElementById("patientImageInput"),
  patientImageList: document.getElementById("patientImageList"),
  brushTimes: document.getElementById("brushTimes"),
  flossHabit: document.getElementById("flossHabit"),
  otherConditions: document.getElementById("otherConditions")
};

let state = loadState();
let draftPatient = createEmptyPatient();
let editingPatientId = null;
let selectedStatusId = "";
let activeView = "home";
let activePatientSubview = "profile";
let activeUpcomingSubview = "overview";
let upcomingCalendarMode = "calendar";
let upcomingCalendarMonth = getTodayInputDate().slice(0, 7);
let upcomingSelectedDate = getTodayInputDate();
let storageMode = "local";
let remotePersistTimer = null;
let remotePersistInFlight = false;
let remotePersistPending = false;
const apiBaseUrl = resolveApiBaseUrl();
let clientPdfModulesPromise = null;
let clientTemplateBytesPromise = null;
let clientTemplateTextPromise = null;
let authToken = stringOrEmpty(localStorage.getItem(AUTH_TOKEN_KEY));
let currentAuthUser = null;
let authBackendEnabled = false;
let authView = "login";


async function init() {
  bindEvents();
  bindAuthEvents();
  setAppLocked(true);
  setAuthView("login");
  setActiveView("home");
  setActiveUpcomingSubview("overview");
  renderAll();
  startNewPatient(false);
  await initializeAuth();
}


void init();
