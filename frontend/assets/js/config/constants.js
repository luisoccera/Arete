"use strict";

const STORAGE_KEY = "arete_data_v1";
const AUTH_TOKEN_KEY = "arete_auth_token_v1";
const AUTH_LOCAL_USERS_KEY = "arete_auth_local_users_v1";
const AUTH_LOCAL_RESET_KEY = "arete_auth_local_reset_v1";
const DEMO_TEST_ACCOUNTS = [
  {
    name: "Usuario Prueba Arete 1",
    email: "demo@arete.app",
    username: "demoarete",
    password: "AreteDemo123!"
  },
  {
    name: "Usuario Prueba Arete 2",
    email: "demo2@arete.app",
    username: "demoarete2",
    password: "AreteDemo456!"
  },
  {
    name: "Usuario Prueba Arete 3",
    email: "demo3@arete.app",
    username: "demoarete3",
    password: "AreteDemo789!"
  }
];
const DENTITION_LAYOUTS = {
  adult: {
    label: "Denticion adulta comun",
    centerLabel: "Odontograma adulto comun",
    commonHint: "Formato FDI permanente: 32 piezas con morfologia por pieza dental.",
    upper: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
    lower: [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]
  },
  child: {
    label: "Denticion infantil comun",
    centerLabel: "Odontograma infantil comun",
    commonHint: "Formato FDI temporal: 20 piezas (55-65 y 85-75) con morfologia por pieza.",
    upper: [55, 54, 53, 52, 51, 61, 62, 63, 64, 65],
    lower: [85, 84, 83, 82, 81, 71, 72, 73, 74, 75]
  }
};

const ODONTO_ZONES = [
  { id: "maxilar-superior", name: "Maxilar superior" },
  { id: "mandibula-inferior", name: "Mandibula inferior" },
  { id: "hemiarco-derecho", name: "Hemiarco derecho" },
  { id: "hemiarco-izquierdo", name: "Hemiarco izquierdo" },
  { id: "encias", name: "Encias" },
  { id: "paladar", name: "Paladar" }
];

const TOOTH_PATHS = {
  "adult-upper-incisor-central": "M14 8 C14 4 17 2 24 2 C31 2 34 4 34 8 C34 14 33 19 32 23 L30 35 C29 43 27 48 24 50 C21 48 19 43 18 35 L16 23 C15 19 14 14 14 8 Z",
  "adult-upper-incisor-lateral": "M15 9 C15 5 18 3 24 3 C30 3 33 5 33 9 C33 14 32 19 31 24 L29 36 C28 44 26 48 24 49 C22 48 20 44 19 36 L17 24 C16 19 15 14 15 9 Z",
  "adult-lower-incisor-central": "M18 8 C18 4 20 3 24 3 C28 3 30 4 30 8 C30 13 29 17 28 21 L27 36 C26 45 25 49 24 50 C23 49 22 45 21 36 L20 21 C19 17 18 13 18 8 Z",
  "adult-lower-incisor-lateral": "M17 8 C17 4 20 2 24 2 C29 2 31 4 31 8 C31 13 30 17 29 21 L28 35 C27 44 25 48 23.5 49 C22 48 20 44 19 35 L18 21 C17 17 17 13 17 8 Z",
  "adult-upper-canine": "M24 2 L30 7 C33 10 34 14 33 19 L31 28 C30 36 27 44 24 50 C21 44 18 36 17 28 L15 19 C14 14 15 10 18 7 Z",
  "adult-lower-canine": "M24 2 L29 8 C31 11 31 15 30 20 L28 31 C27 39 25.5 46 24 50 C22.5 46 21 39 20 31 L18 20 C17 15 17 11 19 8 Z",
  "adult-upper-premolar-1": "M12 10 C12 5 16 3 24 3 C32 3 36 5 36 10 C36 16 34 21 33 26 L31 36 C29 44 27 49 24 50 C21 49 19 44 17 36 L15 26 C14 21 12 16 12 10 Z",
  "adult-upper-premolar-2": "M13 11 C13 6 17 4 24 4 C31 4 35 6 35 11 C35 16 33 21 32 26 L30 36 C28 44 26 49 24 49 C22 49 20 44 18 36 L16 26 C15 21 13 16 13 11 Z",
  "adult-lower-premolar-1": "M14 11 C14 6 18 4 24 4 C30 4 34 6 34 11 C34 17 32 22 31 27 L29 36 C27 44 25 49 23.5 50 C22 49 20 44 19 36 L17 27 C16 22 14 17 14 11 Z",
  "adult-lower-premolar-2": "M15 11 C15 7 18 5 24 5 C30 5 33 7 33 11 C33 17 31 22 30 27 L28 36 C26 44 25 49 24 50 C23 49 22 44 20 36 L18 27 C17 22 15 17 15 11 Z",
  "adult-upper-molar-1": "M9 12 C9 6 15 3 24 3 C33 3 39 6 39 12 C39 18 37 23 35 28 L33 36 C30 44 27 49 24 50 C21 49 18 44 15 36 L13 28 C11 23 9 18 9 12 Z",
  "adult-upper-molar-2": "M10 12 C10 7 15 4 24 4 C33 4 38 7 38 12 C38 18 36 23 34 28 L32 36 C29 44 26 49 24 49 C22 49 19 44 16 36 L14 28 C12 23 10 18 10 12 Z",
  "adult-upper-molar-3": "M12 13 C12 8 16 6 24 6 C32 6 36 8 36 13 C36 18 34 23 32 27 L30 35 C28 42 26 47 24 48 C22 47 20 42 18 35 L16 27 C14 23 12 18 12 13 Z",
  "adult-lower-molar-1": "M10 11 C10 6 15 3 24 3 C33 3 38 6 38 11 C38 16 36 21 34 25 L32 33 C30 42 27 48 24 50 C21 48 18 42 16 33 L14 25 C12 21 10 16 10 11 Z",
  "adult-lower-molar-2": "M11 11 C11 7 15 4 24 4 C33 4 37 7 37 11 C37 17 35 22 33 26 L31 34 C29 42 26 48 24 49 C22 48 19 42 17 34 L15 26 C13 22 11 17 11 11 Z",
  "adult-lower-molar-3": "M13 12 C13 8 17 6 24 6 C31 6 35 8 35 12 C35 17 33 22 31 26 L29 33 C27 40 25 46 24 48 C23 46 21 40 19 33 L17 26 C15 22 13 17 13 12 Z",
  "child-upper-incisor-central": "M16 9 C16 5 19 3 24 3 C29 3 32 5 32 9 C32 14 31 18 30 22 L28 31 C27 37 26 42 24 46 C22 42 21 37 20 31 L18 22 C17 18 16 14 16 9 Z",
  "child-upper-incisor-lateral": "M17 10 C17 6 20 4 24 4 C28 4 31 6 31 10 C31 14 30 18 29 22 L27 30 C26 36 25 41 24 44 C23 41 22 36 21 30 L19 22 C18 18 17 14 17 10 Z",
  "child-lower-incisor-central": "M19 10 C19 6 21 4 24 4 C27 4 29 6 29 10 C29 14 28 18 27 22 L26 31 C25 38 24.5 43 24 46 C23.5 43 23 38 22 31 L21 22 C20 18 19 14 19 10 Z",
  "child-lower-incisor-lateral": "M18 10 C18 6 21 4 24 4 C28 4 30 6 30 10 C30 14 29 18 28 22 L27 31 C26 38 24.8 43 24 46 C23.2 43 22 38 21 31 L20 22 C19 18 18 14 18 10 Z",
  "child-upper-canine": "M24 3 L29 8 C31 11 32 15 31 19 L29 27 C28 33 26 40 24 46 C22 40 20 33 19 27 L17 19 C16 15 17 11 19 8 Z",
  "child-lower-canine": "M24 3 L28 8 C30 11 30 15 29 19 L27 27 C26 34 25 40 24 46 C23 40 22 34 21 27 L19 19 C18 15 18 11 20 8 Z",
  "child-upper-molar-1": "M12 11 C12 6 16 4 24 4 C32 4 36 6 36 11 C36 16 34 20 33 24 L31 31 C29 38 27 43 24 46 C21 43 19 38 17 31 L15 24 C14 20 12 16 12 11 Z",
  "child-upper-molar-2": "M11 11 C11 6 16 3 24 3 C32 3 37 6 37 11 C37 16 35 21 34 25 L32 32 C30 39 27.5 44 24 47 C20.5 44 18 39 16 32 L14 25 C13 21 11 16 11 11 Z",
  "child-lower-molar-1": "M13 11 C13 7 17 4 24 4 C31 4 35 7 35 11 C35 16 33 20 32 24 L30 31 C28 39 26 44 24 47 C22 44 20 39 18 31 L16 24 C15 20 13 16 13 11 Z",
  "child-lower-molar-2": "M12 11 C12 6 17 3 24 3 C31 3 36 6 36 11 C36 16 34 21 33 25 L31 32 C29 40 26.5 45 24 47 C21.5 45 19 40 17 32 L15 25 C14 21 12 16 12 11 Z"
};

const ADULT_TOOTH_RENDER_MAP = {
  1: { upper: { path: "adult-upper-incisor-central", width: 34, height: 52 }, lower: { path: "adult-lower-incisor-central", width: 30, height: 52 } },
  2: { upper: { path: "adult-upper-incisor-lateral", width: 33, height: 51 }, lower: { path: "adult-lower-incisor-lateral", width: 31, height: 51 } },
  3: { upper: { path: "adult-upper-canine", width: 36, height: 52 }, lower: { path: "adult-lower-canine", width: 34, height: 52 } },
  4: { upper: { path: "adult-upper-premolar-1", width: 39, height: 51 }, lower: { path: "adult-lower-premolar-1", width: 37, height: 52 } },
  5: { upper: { path: "adult-upper-premolar-2", width: 38, height: 50 }, lower: { path: "adult-lower-premolar-2", width: 36, height: 51 } },
  6: { upper: { path: "adult-upper-molar-1", width: 44, height: 51 }, lower: { path: "adult-lower-molar-1", width: 42, height: 52 } },
  7: { upper: { path: "adult-upper-molar-2", width: 42, height: 51 }, lower: { path: "adult-lower-molar-2", width: 40, height: 52 } },
  8: { upper: { path: "adult-upper-molar-3", width: 39, height: 50 }, lower: { path: "adult-lower-molar-3", width: 37, height: 50 } }
};

const CHILD_TOOTH_RENDER_MAP = {
  1: { upper: { path: "child-upper-incisor-central", width: 31, height: 45 }, lower: { path: "child-lower-incisor-central", width: 29, height: 46 } },
  2: { upper: { path: "child-upper-incisor-lateral", width: 30, height: 44 }, lower: { path: "child-lower-incisor-lateral", width: 30, height: 45 } },
  3: { upper: { path: "child-upper-canine", width: 33, height: 46 }, lower: { path: "child-lower-canine", width: 31, height: 46 } },
  4: { upper: { path: "child-upper-molar-1", width: 38, height: 45 }, lower: { path: "child-lower-molar-1", width: 37, height: 46 } },
  5: { upper: { path: "child-upper-molar-2", width: 40, height: 46 }, lower: { path: "child-lower-molar-2", width: 39, height: 47 } }
};

const DEFAULT_DISEASES = [
  { id: "dis-cardiaca", name: "Enfermedad cardiaca", color: "#0ea5e9" },
  { id: "dis-embarazo", name: "Embarazo", color: "#22c55e" }
];

const REMOVED_DISEASE_NAME_TOKENS = new Set(["hipertension", "diabetes"]);

const DEFAULT_TOOTH_STATUSES = [
  { id: "st-caries", name: "Caries", color: "#ef4444" },
  { id: "st-fractura", name: "Fractura", color: "#f97316" },
  { id: "st-resina", name: "Resina", color: "#22d3ee" },
  { id: "st-ausente", name: "Ausente", color: "#94a3b8" },
  { id: "st-sano", name: "Sano", color: "#10b981" }
];

const CLINICAL_RECORD_TYPES = [
  {
    id: "f1-estomatologica",
    label: "Formato 1 - Historia clinica estomatologica",
    focus: ["Interrogatorio general", "Antecedentes", "Exploracion estomatognatica", "Odontograma diagnostico"]
  },
  {
    id: "f2-preventiva",
    label: "Formato 2 - Estomatologia preventiva",
    focus: ["Control de higiene", "Indice de placa", "Tecnica de cepillado", "Aplicacion de fluor"]
  },
  {
    id: "f3-operatoria",
    label: "Formato 3 - Operatoria dental",
    focus: ["Diagnostico de caries", "Tratamiento restaurador", "Odontograma y evolucion", "Ruta clinica"]
  },
  {
    id: "f4-protesis-fija",
    label: "Formato 4 - Protesis fija",
    focus: ["Evaluacion clinica", "Pilares y soporte", "Interpretacion radiografica", "Plan de tratamiento"]
  },
  {
    id: "f5-protesis-removible",
    label: "Formato 5 - Protesis removible",
    focus: ["Clasificacion de Kennedy", "Conectores y ganchos", "Area desdentada", "Evolucion de tratamiento"]
  },
  {
    id: "f6-prostodoncia",
    label: "Formato 6 - Prostodoncia total/parcial",
    focus: ["Estado del reborde", "Plan protetico", "Pruebas de oclusion", "Entrega y controles"]
  },
  {
    id: "f7-cirugia-bucal",
    label: "Formato 7 - Cirugia bucal",
    focus: ["Padecimiento actual", "Exploracion de zona", "Diagnostico y pronostico", "Notas posquirurgicas"]
  },
  {
    id: "f8-periodoncia",
    label: "Formato 8 - Periodoncia",
    focus: ["Antecedentes periodontales", "Indice de higiene", "Bolsas y movilidad", "Plan periodontal"]
  },
  {
    id: "f9-endodoncia",
    label: "Formato 9 - Endodoncia",
    focus: ["Motivo de consulta", "Pruebas de sensibilidad", "Diagnostico pulpar", "Tratamiento de conductos"]
  },
  {
    id: "f10-ortodoncia",
    label: "Formato 10 - Ortodoncia y ortopedia maxilar",
    focus: ["Antecedentes de crecimiento", "Analisis facial y oclusal", "Plan ortodontico", "Consentimiento"]
  },
  {
    id: "f11-odontopediatria",
    label: "Formato 11 - Odontopediatria",
    focus: ["Antecedentes pediatricos", "Denticion temporal/mixta", "Prevencion y control", "Seguimiento con tutor"]
  }
];

const YES_NO_OPTIONS = [
  { value: "", label: "Seleccionar" },
  { value: "Si", label: "Si" },
  { value: "No", label: "No" }
];

const CLINICAL_FORM_SCHEMAS = {
  "f1-estomatologica": {
    title: "Formato 1: Historia clinica estomatologica",
    fields: [
      { id: "motivo_consulta", label: "Motivo de consulta", section: "Interrogatorio", type: "textarea", rows: 2, contextKey: "consultReason", placeholder: "Sintoma o razon principal de la consulta." },
      { id: "antecedentes_estomatologicos", label: "Antecedentes personales y familiares (resumen)", section: "Interrogatorio", type: "textarea", rows: 2, contextKey: "background", placeholder: "Resumen clinico del paciente." },
      { id: "ultima_consulta_medica_odontologica", label: "Fecha y motivo de la ultima consulta medica odontologica", section: "Interrogatorio", type: "text", placeholder: "Ejemplo: 19/04/2026 - revision general." },

      { id: "hereditarios_madre", label: "Padecimientos familiares - Madre", section: "Antecedentes patologicos hereditarios", type: "text", placeholder: "Anotar antecedentes en linea directa." },
      { id: "hereditarios_padre", label: "Padecimientos familiares - Padre", section: "Antecedentes patologicos hereditarios", type: "text", placeholder: "Anotar antecedentes en linea directa." },
      { id: "hereditarios_hermanos", label: "Padecimientos familiares - Hermanos", section: "Antecedentes patologicos hereditarios", type: "text", placeholder: "Anotar antecedentes en linea directa." },
      { id: "hereditarios_hijos", label: "Padecimientos familiares - Hijos", section: "Antecedentes patologicos hereditarios", type: "text", placeholder: "Anotar antecedentes en linea directa." },
      { id: "hereditarios_esposo", label: "Padecimientos familiares - Esposo(a)", section: "Antecedentes patologicos hereditarios", type: "text", placeholder: "Anotar antecedentes en linea directa." },
      { id: "hereditarios_tios", label: "Padecimientos familiares - Tios", section: "Antecedentes patologicos hereditarios", type: "text", placeholder: "Anotar antecedentes en linea directa." },
      { id: "hereditarios_abuelos", label: "Padecimientos familiares - Abuelos", section: "Antecedentes patologicos hereditarios", type: "text", placeholder: "Anotar antecedentes en linea directa." },

      { id: "patologicos_inflamatorias", label: "Enfermedades inflamatorias e infecciosas no trasmisibles", section: "Antecedentes personales patologicos", type: "text", placeholder: "Registrar padecimientos." },
      { id: "patologicos_transmision_sexual", label: "Enfermedades de trasmision sexual", section: "Antecedentes personales patologicos", type: "text", placeholder: "Registrar padecimientos." },
      { id: "patologicos_degenerativas", label: "Enfermedades degenerativas", section: "Antecedentes personales patologicos", type: "text", placeholder: "Registrar padecimientos." },
      { id: "patologicos_neoplasicas", label: "Enfermedades neoplasicas", section: "Antecedentes personales patologicos", type: "text", placeholder: "Registrar padecimientos." },
      { id: "patologicos_congenitas", label: "Enfermedades congenitas", section: "Antecedentes personales patologicos", type: "text", placeholder: "Registrar padecimientos." },
      { id: "patologicos_otras", label: "Otras enfermedades", section: "Antecedentes personales patologicos", type: "text", placeholder: "Registrar padecimientos." },

      { id: "habitos_higienicos_diarios", label: "Habitos higienicos: en el vestuario", section: "Antecedentes personales no patologicos", type: "text", contextKey: "hygieneHabitsDaily", placeholder: "Rutina de higiene personal." },
      { id: "habitos_higienicos_corporales", label: "Habitos higienicos corporales", section: "Antecedentes personales no patologicos", type: "text", placeholder: "Describir habitos corporales." },
      { id: "frecuencia_lavado_dientes", label: "Con que frecuencia se lava los dientes", section: "Antecedentes personales no patologicos", type: "text", placeholder: "Veces por dia." },
      { id: "auxiliares_higiene_usa", label: "Utiliza auxiliares de higiene bucal", section: "Antecedentes personales no patologicos", type: "select", options: YES_NO_OPTIONS },
      { id: "auxiliares_higiene_cuales", label: "Auxiliares de higiene bucal: cuales", section: "Antecedentes personales no patologicos", type: "text", placeholder: "Ejemplo: cepillo electrico, hilo, enjuague." },
      { id: "consume_golosinas", label: "Consume golosinas entre comidas", section: "Antecedentes personales no patologicos", type: "select", options: YES_NO_OPTIONS },
      { id: "grupo_sanguineo_f1", label: "Grupo sanguineo", section: "Antecedentes personales no patologicos", type: "text", placeholder: "Ejemplo: O." },
      { id: "factor_rh_f1", label: "Factor Rh", section: "Antecedentes personales no patologicos", type: "text", placeholder: "Ejemplo: + o -." },
      { id: "cartilla_vacunacion", label: "Cuenta con cartilla de vacunacion", section: "Antecedentes personales no patologicos", type: "select", options: YES_NO_OPTIONS },
      { id: "esquema_vacunacion_completo", label: "Tiene esquema completo de vacunacion", section: "Antecedentes personales no patologicos", type: "select", options: YES_NO_OPTIONS },
      { id: "esquema_vacunacion_falta", label: "Especifique cual vacuna falta", section: "Antecedentes personales no patologicos", type: "text", placeholder: "Ejemplo: VPH." },
      { id: "adiccion_tabaco", label: "Adiccion: tabaco", section: "Antecedentes personales no patologicos", type: "select", options: YES_NO_OPTIONS },
      { id: "adiccion_alcohol", label: "Adiccion: alcohol", section: "Antecedentes personales no patologicos", type: "select", options: YES_NO_OPTIONS },
      { id: "alergia_antibioticos", label: "Antecedentes alergicos: antibioticos", section: "Antecedentes personales no patologicos", type: "select", options: YES_NO_OPTIONS },
      { id: "alergia_analgesicos", label: "Antecedentes alergicos: analgesicos", section: "Antecedentes personales no patologicos", type: "select", options: YES_NO_OPTIONS },
      { id: "alergia_anestesicos", label: "Antecedentes alergicos: anestesicos", section: "Antecedentes personales no patologicos", type: "select", options: YES_NO_OPTIONS },
      { id: "alergia_alimentos", label: "Antecedentes alergicos: alimentos", section: "Antecedentes personales no patologicos", type: "select", options: YES_NO_OPTIONS },
      { id: "alergia_especifique", label: "Especifique alergias", section: "Antecedentes personales no patologicos", type: "text", placeholder: "Detalle de alergias." },
      { id: "ha_sido_hospitalizado", label: "Ha sido hospitalizado", section: "Antecedentes personales no patologicos", type: "select", options: YES_NO_OPTIONS },
      { id: "hospitalizacion_fecha", label: "Hospitalizacion: fecha", section: "Antecedentes personales no patologicos", type: "text", placeholder: "Fecha de hospitalizacion." },
      { id: "hospitalizacion_motivo", label: "Hospitalizacion: motivo", section: "Antecedentes personales no patologicos", type: "text", placeholder: "Motivo clinico." },
      { id: "padecimiento_actual_detalle", label: "Padecimiento actual (detalle)", section: "Antecedentes personales no patologicos", type: "textarea", rows: 2, placeholder: "Detalle del padecimiento actual." },

      { id: "aparato_digestivo", label: "Interrogatorio por aparatos y sistemas: aparato digestivo", section: "Interrogatorio por aparatos y sistemas", type: "textarea", rows: 4, wide: true, placeholder: "Hallazgos digestivos relevantes." },
      { id: "aparato_respiratorio", label: "Aparato respiratorio", section: "Interrogatorio por aparatos y sistemas", type: "textarea", rows: 4, wide: true, placeholder: "Hallazgos respiratorios." },
      { id: "aparato_cardiovascular", label: "Aparato cardiovascular", section: "Interrogatorio por aparatos y sistemas", type: "textarea", rows: 4, wide: true, placeholder: "Hallazgos cardiovasculares." },
      { id: "aparato_genitourinario", label: "Aparato genitourinario", section: "Interrogatorio por aparatos y sistemas", type: "textarea", rows: 4, wide: true, placeholder: "Hallazgos genitourinarios." },
      { id: "sistema_endocrino_f1", label: "Sistema endocrino", section: "Interrogatorio por aparatos y sistemas", type: "textarea", rows: 4, wide: true, placeholder: "Hallazgos endocrinos." },
      { id: "sistema_hemopoyetico_f1", label: "Sistema hemopoyetico", section: "Interrogatorio por aparatos y sistemas", type: "textarea", rows: 4, wide: true, placeholder: "Hallazgos hemopoyeticos." },
      { id: "sistema_nervioso_f1", label: "Sistema nervioso", section: "Interrogatorio por aparatos y sistemas", type: "textarea", rows: 4, wide: true, placeholder: "Hallazgos neurologicos." },
      { id: "sistema_musculoesqueletico_f1", label: "Sistema musculoesqueletico", section: "Interrogatorio por aparatos y sistemas", type: "textarea", rows: 4, wide: true, placeholder: "Hallazgos musculoesqueleticos." },
      { id: "aparato_tegumentario_f1", label: "Aparato tegumentario", section: "Interrogatorio por aparatos y sistemas", type: "textarea", rows: 4, wide: true, placeholder: "Hallazgos tegumentarios." },

      { id: "habitus_exterior_f1", label: "Habitus exterior", section: "Exploracion fisica", type: "text", placeholder: "Descripcion general." },
      { id: "peso_f1", label: "Peso", section: "Exploracion fisica", type: "text", placeholder: "Ejemplo: 68 kg." },
      { id: "talla_f1", label: "Talla", section: "Exploracion fisica", type: "text", placeholder: "Ejemplo: 1.70 m." },
      { id: "complexion_f1", label: "Complexion", section: "Exploracion fisica", type: "text", placeholder: "Descripcion de complexion." },
      { id: "frecuencia_cardiaca_f1", label: "Frecuencia cardiaca", section: "Exploracion fisica", type: "text", placeholder: "Latidos por minuto." },
      { id: "tension_arterial_f1", label: "Tension arterial", section: "Exploracion fisica", type: "text", placeholder: "Ejemplo: 120/80." },
      { id: "frecuencia_respiratoria_f1", label: "Frecuencia respiratoria", section: "Exploracion fisica", type: "text", placeholder: "Respiraciones por minuto." },
      { id: "temperatura_f1", label: "Temperatura", section: "Exploracion fisica", type: "text", placeholder: "Ejemplo: 36.5 C." },

      { id: "cabeza_exostosis", label: "Cabeza: Exostosis", section: "Exploracion de cabeza y cuello", type: "select", options: YES_NO_OPTIONS },
      { id: "cabeza_endostosis", label: "Cabeza: Endostosis", section: "Exploracion de cabeza y cuello", type: "select", options: YES_NO_OPTIONS },
      { id: "craneo_dolicocefalico", label: "Craneo: Dolicocefalico", section: "Exploracion de cabeza y cuello", type: "select", options: YES_NO_OPTIONS },
      { id: "craneo_mesocefalico", label: "Craneo: Mesocefalico", section: "Exploracion de cabeza y cuello", type: "select", options: YES_NO_OPTIONS },
      { id: "craneo_braquicefalico", label: "Craneo: Braquicefalico", section: "Exploracion de cabeza y cuello", type: "select", options: YES_NO_OPTIONS },
      { id: "cara_asimetria_transversal", label: "Cara: Asimetrias transversales", section: "Exploracion de cabeza y cuello", type: "select", options: YES_NO_OPTIONS },
      { id: "cara_asimetria_longitudinal", label: "Cara: Asimetrias longitudinales", section: "Exploracion de cabeza y cuello", type: "select", options: YES_NO_OPTIONS },
      { id: "perfil_concavo", label: "Perfil: Concavo", section: "Exploracion de cabeza y cuello", type: "select", options: YES_NO_OPTIONS },
      { id: "perfil_convexo", label: "Perfil: Convexo", section: "Exploracion de cabeza y cuello", type: "select", options: YES_NO_OPTIONS },
      { id: "perfil_recto", label: "Perfil: Recto", section: "Exploracion de cabeza y cuello", type: "select", options: YES_NO_OPTIONS },
      { id: "piel_normal", label: "Piel: Normal", section: "Exploracion de cabeza y cuello", type: "select", options: YES_NO_OPTIONS },
      { id: "piel_palida", label: "Piel: Palida", section: "Exploracion de cabeza y cuello", type: "select", options: YES_NO_OPTIONS },
      { id: "piel_cianotica", label: "Piel: Cianotica", section: "Exploracion de cabeza y cuello", type: "select", options: YES_NO_OPTIONS },
      { id: "piel_enrojecida", label: "Piel: Enrojecida", section: "Exploracion de cabeza y cuello", type: "select", options: YES_NO_OPTIONS },
      { id: "musculos_hipotonicos", label: "Musculos: Hipotonicos", section: "Exploracion de cabeza y cuello", type: "select", options: YES_NO_OPTIONS },
      { id: "musculos_hipertonicos", label: "Musculos: Hipertonicos", section: "Exploracion de cabeza y cuello", type: "select", options: YES_NO_OPTIONS },
      { id: "musculos_espasticos", label: "Musculos: Espasticos", section: "Exploracion de cabeza y cuello", type: "select", options: YES_NO_OPTIONS },
      { id: "cuello_cadena_ganglionar", label: "Cuello: Se palpa la cadena ganglionar", section: "Exploracion de cabeza y cuello", type: "select", options: YES_NO_OPTIONS },
      { id: "exploracion_otros", label: "Otros hallazgos", section: "Exploracion de cabeza y cuello", type: "text", placeholder: "Anotar otros hallazgos clinicos." },

      { id: "atm_ruidos_si_no", label: "ATM: Ruidos", section: "Exploracion del aparato estomatognatico", type: "select", options: YES_NO_OPTIONS },
      { id: "atm_lateralidad", label: "ATM: Lateralidad", section: "Exploracion del aparato estomatognatico", type: "select", options: YES_NO_OPTIONS },
      { id: "atm_apertura", label: "ATM: Apertura", section: "Exploracion del aparato estomatognatico", type: "select", options: YES_NO_OPTIONS },
      { id: "atm_chasquidos_si_no", label: "ATM: Chasquidos", section: "Exploracion del aparato estomatognatico", type: "select", options: YES_NO_OPTIONS },
      { id: "atm_crepitacion_si_no", label: "ATM: Crepitacion", section: "Exploracion del aparato estomatognatico", type: "select", options: YES_NO_OPTIONS },
      { id: "atm_dificultad_apertura_si_no", label: "ATM: Dificultad para abrir la boca", section: "Exploracion del aparato estomatognatico", type: "select", options: YES_NO_OPTIONS },
      { id: "atm_dolor_movimientos_si_no", label: "ATM: Dolor a la abertura o lateralidad", section: "Exploracion del aparato estomatognatico", type: "select", options: YES_NO_OPTIONS },
      { id: "atm_fatiga_muscular_si_no", label: "ATM: Fatiga o dolor muscular", section: "Exploracion del aparato estomatognatico", type: "select", options: YES_NO_OPTIONS },
      { id: "atm_disminucion_abertura_si_no", label: "ATM: Disminucion de la abertura", section: "Exploracion del aparato estomatognatico", type: "select", options: YES_NO_OPTIONS },
      { id: "atm_desviacion_abertura_si_no", label: "ATM: Desviacion a la abertura/cierre", section: "Exploracion del aparato estomatognatico", type: "select", options: YES_NO_OPTIONS },

      { id: "tejidos_ganglios", label: "Tejidos blandos: Ganglios", section: "Tejidos blandos", type: "text", placeholder: "Hallazgos de ganglios." },
      { id: "tejidos_glandulas_salivales", label: "Tejidos blandos: Glandulas salivales", section: "Tejidos blandos", type: "text", placeholder: "Hallazgos." },
      { id: "tejidos_labio_externo", label: "Tejidos blandos: Labio externo", section: "Tejidos blandos", type: "text", placeholder: "Hallazgos." },
      { id: "tejidos_borde_bermellon", label: "Tejidos blandos: Borde bermellon", section: "Tejidos blandos", type: "text", placeholder: "Hallazgos." },
      { id: "tejidos_labio_interno", label: "Tejidos blandos: Labio interno", section: "Tejidos blandos", type: "text", placeholder: "Hallazgos." },
      { id: "tejidos_comisuras", label: "Tejidos blandos: Comisuras", section: "Tejidos blandos", type: "text", placeholder: "Hallazgos." },
      { id: "tejidos_carrillos", label: "Tejidos blandos: Carrillos", section: "Tejidos blandos", type: "text", placeholder: "Hallazgos." },
      { id: "tejidos_fondo_saco", label: "Tejidos blandos: Fondo de saco", section: "Tejidos blandos", type: "text", placeholder: "Hallazgos." },
      { id: "tejidos_frenillos", label: "Tejidos blandos: Frenillos", section: "Tejidos blandos", type: "text", placeholder: "Hallazgos." },
      { id: "tejidos_lengua_tercio_medio", label: "Tejidos blandos: Lengua tercio medio", section: "Tejidos blandos", type: "text", placeholder: "Hallazgos." },
      { id: "tejidos_paladar_duro", label: "Tejidos blandos: Paladar duro", section: "Tejidos blandos", type: "text", placeholder: "Hallazgos." },
      { id: "tejidos_paladar_blando", label: "Tejidos blandos: Paladar blando", section: "Tejidos blandos", type: "text", placeholder: "Hallazgos." },
      { id: "tejidos_istmo_bucofaringe", label: "Tejidos blandos: Istmo bucofaringe", section: "Tejidos blandos", type: "text", placeholder: "Hallazgos." },
      { id: "tejidos_lengua_dorso", label: "Tejidos blandos: Lengua dorso", section: "Tejidos blandos", type: "text", placeholder: "Hallazgos." },
      { id: "tejidos_lengua_bordes", label: "Tejidos blandos: Lengua bordes", section: "Tejidos blandos", type: "text", placeholder: "Hallazgos." },
      { id: "tejidos_lengua_ventral", label: "Tejidos blandos: Lengua ventral", section: "Tejidos blandos", type: "text", placeholder: "Hallazgos." },
      { id: "tejidos_piso_boca", label: "Tejidos blandos: Piso de la boca", section: "Tejidos blandos", type: "text", placeholder: "Hallazgos." },
      { id: "tejidos_dientes", label: "Tejidos blandos: Dientes", section: "Tejidos blandos", type: "text", placeholder: "Hallazgos." },
      { id: "tejidos_mucosa_borde_alveolar", label: "Tejidos blandos: Mucosa del borde alveolar", section: "Tejidos blandos", type: "text", placeholder: "Hallazgos." },
      { id: "tejidos_encia", label: "Tejidos blandos: Encia", section: "Tejidos blandos", type: "text", placeholder: "Hallazgos." },
      { id: "tejidos_descripcion", label: "Tejidos blandos: Descripcion detallada", section: "Tejidos blandos", type: "textarea", rows: 2, wide: true, placeholder: "Lesion elemental, numero de lesiones, forma, tamano, color, superficie, base, consistencia, sintomatologia, etiologia, evolucion, tratamiento y cuadrante." },

      { id: "periodonto_gingivitis", label: "Periodonto: Gingivitis", section: "Periodonto", type: "text", placeholder: "Detalle clinico." },
      { id: "periodonto_periodontitis", label: "Periodonto: Periodontitis", section: "Periodonto", type: "text", placeholder: "Detalle clinico." },
      { id: "periodonto_recesion_gingival", label: "Periodonto: Recesion gingival", section: "Periodonto", type: "text", placeholder: "Detalle clinico." },
      { id: "periodonto_bolsas_detalle", label: "Periodonto: Bolsas periodontales", section: "Periodonto", type: "textarea", rows: 3, wide: true, placeholder: "Indicar ubicacion y milimetros de profundidad." },
      { id: "periodonto_movilidad_dentaria", label: "Periodonto: Movilidad dentaria", section: "Periodonto", type: "textarea", rows: 3, wide: true, placeholder: "Indicar organos dentarios y clase de movilidad." },
      { id: "indice_higiene_bucal_f1", label: "Indice de higiene bucal", section: "Periodonto", type: "text", placeholder: "Resultado del indice." },
      { id: "indice_placa_actual_f1", label: "Indice de placa actual", section: "Periodonto", type: "text", placeholder: "Resultado actual." },

      { id: "diagnostico_estomatologico", label: "Diagnostico estomatologico", section: "Diagnostico y tratamiento", type: "textarea", rows: 2, contextKey: "diagnosis", placeholder: "Diagnostico clinico principal." },
      { id: "plan_estomatologico", label: "Plan de tratamiento", section: "Diagnostico y tratamiento", type: "textarea", rows: 2, contextKey: "treatmentPlan", placeholder: "Fases del tratamiento indicado." },
      { id: "pronostico_estomatologico", label: "Pronostico", section: "Diagnostico y tratamiento", type: "text", contextKey: "prognosis", placeholder: "Favorable, reservado, etc." },
      { id: "observaciones_f1", label: "Observaciones", section: "Diagnostico y tratamiento", type: "textarea", rows: 2, contextKey: "notes", placeholder: "Notas clinicas adicionales." }
    ]
  },
  "f2-preventiva": {
    title: "Formato 2: Estomatologia preventiva",
    fields: [
      { id: "tecnica_cepillado", label: "Tecnica de cepillado", section: "Control de higiene bucal", type: "textarea", rows: 2, contextKey: "treatmentPlan", placeholder: "Tecnica recomendada al paciente." },
      { id: "tipo_cepillo_dental", label: "Cepillo dental indicado", section: "Control de higiene bucal", type: "text", placeholder: "Tipo de cepillo." },
      { id: "indice_placa", label: "Pastilla reveladora / indice de placa", section: "Control de higiene bucal", type: "text", contextKey: "background", placeholder: "Resultado del indice de placa." },
      { id: "fecha_inicio_preventivo", label: "Fecha de inicio", section: "Control de higiene bucal", type: "text", placeholder: "Fecha de inicio del control." },
      { id: "seguimiento_preventivo", label: "Fecha de termino o seguimiento", section: "Control de higiene bucal", type: "text", contextKey: "prognosis", placeholder: "Fecha o criterio de control." },
      { id: "recomendaciones_preventivas", label: "Profilaxia u odontoxesis", section: "Control de higiene bucal", type: "textarea", rows: 2, contextKey: "notes", placeholder: "Detalle del procedimiento preventivo." },
      { id: "fluorizacion", label: "Aplicacion de fluor", section: "Control de higiene bucal", type: "textarea", rows: 2, contextKey: "consultReason", placeholder: "Producto, frecuencia y dosis." },
      { id: "riesgo_caries", label: "Indice de placa actual / riesgo de caries", section: "Control de higiene bucal", type: "text", contextKey: "diagnosis", placeholder: "Riesgo clinico actual." },
      { id: "odonto_control_1", label: "Odontograma de primer control de higiene bucal", section: "Odontogramas de control", type: "textarea", rows: 2, placeholder: "Resumen del control 1." },
      { id: "odonto_control_2", label: "Odontograma de segundo control de higiene bucal", section: "Odontogramas de control", type: "textarea", rows: 2, placeholder: "Resumen del control 2." },
      { id: "odonto_control_3", label: "Odontograma de tercer control de higiene bucal", section: "Odontogramas de control", type: "textarea", rows: 2, placeholder: "Resumen del control 3." },
      { id: "odonto_control_4", label: "Odontograma de cuarto control de higiene bucal", section: "Odontogramas de control", type: "textarea", rows: 2, placeholder: "Resumen del control 4." },
      { id: "conformidad_preventiva", label: "Nombre y firma de conformidad del paciente", section: "Cierre del formato", type: "text", placeholder: "Nombre para conformidad del tratamiento." }
    ]
  },
  "f3-operatoria": {
    title: "Formato 3: Operatoria dental",
    fields: [
      { id: "pieza_operatoria", label: "Pieza(s) tratada(s)", section: "Odontograma y diagnostico", type: "text", contextKey: "odontoSummary", placeholder: "Ejemplo: 16, 26, 36." },
      { id: "odontograma_diagnostico_op", label: "Odontograma diagnostico", section: "Odontograma y diagnostico", type: "textarea", rows: 2, placeholder: "Resumen del odontograma diagnostico." },
      { id: "diagnostico_operatorio", label: "Diagnostico operatorio", section: "Odontograma y diagnostico", type: "textarea", rows: 2, contextKey: "diagnosis", placeholder: "Tipo y extension de la lesion." },
      { id: "odontograma_evolucion_op", label: "Odontograma de evolucion", section: "Odontograma y diagnostico", type: "textarea", rows: 2, placeholder: "Cambios por cita o pieza." },
      { id: "material_restaurador", label: "Material restaurador", section: "Tratamientos realizados", type: "text", contextKey: "treatmentPlan", placeholder: "Resina, ionomero, etc." },
      { id: "tecnica_operatoria", label: "Tecnica operatoria", section: "Tratamientos realizados", type: "textarea", rows: 2, contextKey: "background", placeholder: "Pasos clinicos realizados." },
      { id: "tratamientos_realizados_op", label: "Tratamientos realizados", section: "Tratamientos realizados", type: "textarea", rows: 3, placeholder: "Detalle por cita." },
      { id: "fecha_tratamiento_op", label: "Fecha", section: "Tratamientos realizados", type: "text", placeholder: "Fecha de tratamiento." },
      { id: "control_operatorio", label: "Nombre y firma de conformidad", section: "Tratamientos realizados", type: "textarea", rows: 2, contextKey: "notes", placeholder: "Conformidad del paciente." },
      { id: "pronostico_operatorio", label: "Pronostico", section: "Tratamientos realizados", type: "text", contextKey: "prognosis", placeholder: "Pronostico del tratamiento restaurador." }
    ]
  },
  "f4-protesis-fija": {
    title: "Formato 4: Protesis fija",
    fields: [
      { id: "motivo_protesis_fija", label: "Evaluacion clinica", section: "Evaluacion inicial", type: "textarea", rows: 2, contextKey: "consultReason", placeholder: "Necesidad funcional o estetica." },
      { id: "dientes_ausentes_f4", label: "Dientes ausentes", section: "Evaluacion inicial", type: "text", placeholder: "Piezas ausentes." },
      { id: "restauraciones_presentes_f4", label: "Restauraciones presentes", section: "Evaluacion inicial", type: "text", placeholder: "Restauraciones actuales." },
      { id: "protesis_fija_previa_f4", label: "Protesis fija previa", section: "Evaluacion inicial", type: "text", placeholder: "Describir protesis previa." },
      { id: "protesis_removible_previa_f4", label: "Protesis removible previa", section: "Evaluacion inicial", type: "text", placeholder: "Describir protesis removible previa." },
      { id: "region_desdentada_f4", label: "Region desdentada", section: "Evaluacion inicial", type: "text", placeholder: "Zona a rehabilitar." },
      { id: "relacion_corona_raiz_f4", label: "Relacion corona-raiz de pilares", section: "Evaluacion inicial", type: "text", placeholder: "Descripcion clinica." },
      { id: "soporte_oseo_f4", label: "Soporte oseo", section: "Evaluacion inicial", type: "text", placeholder: "Estado del soporte oseo." },
      { id: "estado_periodontal_pilares_f4", label: "Estado periodontal de pilares", section: "Evaluacion inicial", type: "text", placeholder: "Estado periodontal." },
      { id: "diagnostico_protesis_fija", label: "Interpretacion radiografica de la zona", section: "Evaluacion inicial", type: "textarea", rows: 2, contextKey: "diagnosis", placeholder: "Interpretacion radiografica." },

      { id: "plan_protesis_fija", label: "Plan de tratamiento protesico", section: "Procedimientos", type: "textarea", rows: 2, contextKey: "treatmentPlan", placeholder: "Secuencia de preparacion, impresion y cementacion." },
      { id: "pruebas_protesis_fija", label: "Procedimiento", section: "Procedimientos", type: "textarea", rows: 2, contextKey: "background", placeholder: "Registro de procedimientos." },
      { id: "modelos_estudio_f4", label: "Modelos de estudio", section: "Procedimientos", type: "text", placeholder: "Registro de modelos." },
      { id: "presentacion_provisionales_f4", label: "Presentacion de provisionales", section: "Procedimientos", type: "text", placeholder: "Cita/procedimiento." },
      { id: "preparacion_pilares_f4", label: "Preparacion de dientes pilares", section: "Procedimientos", type: "text", placeholder: "Detalle de preparacion." },
      { id: "colocacion_provisionales_f4", label: "Colocacion de provisionales", section: "Procedimientos", type: "text", placeholder: "Detalle de colocacion." },
      { id: "impresiones_f4", label: "Impresiones", section: "Procedimientos", type: "text", placeholder: "Tipo de impresion." },
      { id: "prueba_metales_f4", label: "Prueba de metales", section: "Procedimientos", type: "text", placeholder: "Resultados de prueba." },
      { id: "prueba_porcelana_f4", label: "Prueba de porcelana", section: "Procedimientos", type: "text", placeholder: "Resultados de prueba." },
      { id: "terminado_f4", label: "Terminado", section: "Procedimientos", type: "text", placeholder: "Fecha y resultado final." },

      { id: "observaciones_protesis_fija", label: "Diseno de la restauracion protesica", section: "Diseno y cierre", type: "textarea", rows: 2, contextKey: "notes", placeholder: "AZUL, ROJO, AMARILLO y observaciones." },
      { id: "pilares_protesis", label: "Dientes pilares", section: "Diseno y cierre", type: "text", contextKey: "odontoSummary", placeholder: "Piezas pilares." },
      { id: "ponticos_f4", label: "Ponticos", section: "Diseno y cierre", type: "text", placeholder: "Descripcion de ponticos." },
      { id: "restauraciones_individuales_f4", label: "Restauraciones individuales", section: "Diseno y cierre", type: "text", placeholder: "Detalle individual." }
    ]
  },
  "f5-protesis-removible": {
    title: "Formato 5: Protesis removible",
    fields: [
      { id: "evaluacion_clinica_f5", label: "Evaluacion clinica", section: "Evaluacion inicial", type: "textarea", rows: 2, contextKey: "consultReason", placeholder: "Descripcion de la evaluacion clinica." },
      { id: "dientes_ausentes_f5", label: "Dientes ausentes", section: "Evaluacion inicial", type: "text", placeholder: "Piezas ausentes." },
      { id: "restauraciones_presentes_f5", label: "Restauraciones presentes", section: "Evaluacion inicial", type: "text", placeholder: "Restauraciones presentes." },
      { id: "protesis_fija_f5", label: "Protesis fija", section: "Evaluacion inicial", type: "text", placeholder: "Protesis fija existente." },
      { id: "protesis_removible_f5", label: "Protesis removible", section: "Evaluacion inicial", type: "text", placeholder: "Protesis removible existente." },
      { id: "region_desdentada_f5", label: "Region desdentada", section: "Evaluacion inicial", type: "text", placeholder: "Zona desdentada." },
      { id: "relacion_corona_raiz_f5", label: "Relacion corona-raiz de pilares", section: "Evaluacion inicial", type: "text", placeholder: "Relacion corona-raiz." },
      { id: "soporte_oseo_f5", label: "Soporte oseo", section: "Evaluacion inicial", type: "text", placeholder: "Soporte oseo disponible." },
      { id: "estado_periodontal_area_f5", label: "Estado periodontal del area", section: "Evaluacion inicial", type: "text", placeholder: "Estado periodontal." },
      { id: "interpretacion_radiografica_f5", label: "Interpretacion radiografica", section: "Evaluacion inicial", type: "textarea", rows: 2, contextKey: "diagnosis", placeholder: "Interpretacion de radiografias." },

      { id: "clasificacion_kennedy", label: "Clasificacion de Kennedy", section: "Diseno protesico", type: "text", contextKey: "diagnosis", placeholder: "Clase I, II, III o IV." },
      { id: "pilares_f5", label: "Dientes pilares", section: "Diseno protesico", type: "text", contextKey: "odontoSummary", placeholder: "Piezas pilares." },
      { id: "zona_desdentada", label: "Area desdentada", section: "Diseno protesico", type: "textarea", rows: 2, contextKey: "odontoSummary", placeholder: "Describe zonas a rehabilitar." },
      { id: "diseno_protesis_removible", label: "Diseno de la restauracion protesica", section: "Diseno protesico", type: "textarea", rows: 2, contextKey: "treatmentPlan", placeholder: "Conector mayor, retenedores y apoyos." },
      { id: "elementos_retencion", label: "Tipos de ganchos y ubicacion", section: "Diseno protesico", type: "textarea", rows: 2, contextKey: "background", placeholder: "Elementos de retencion y soporte." },

      { id: "plan_protesis_removible", label: "Plan de tratamiento", section: "Procedimientos", type: "textarea", rows: 2, contextKey: "treatmentPlan", placeholder: "Plan de trabajo protetico." },
      { id: "procedimiento_protesis_removible", label: "Procedimiento", section: "Procedimientos", type: "textarea", rows: 2, placeholder: "Procedimiento por cita." },
      { id: "presentacion_caso_f5", label: "Presentacion del caso", section: "Procedimientos", type: "text", placeholder: "Fecha/procedimiento." },
      { id: "preparaciones_f5", label: "Preparaciones", section: "Procedimientos", type: "text", placeholder: "Detalle de preparaciones." },
      { id: "impresion_f5", label: "Impresion", section: "Procedimientos", type: "text", placeholder: "Tipo de impresion." },
      { id: "prueba_metales_f5", label: "Prueba de metales", section: "Procedimientos", type: "text", placeholder: "Resultado de prueba." },
      { id: "prueba_rodillos_f5", label: "Prueba de rodillos", section: "Procedimientos", type: "text", placeholder: "Resultado de prueba." },
      { id: "prueba_oclusion_f5", label: "Prueba de oclusion", section: "Procedimientos", type: "text", placeholder: "Resultado de oclusion." },
      { id: "indicaciones_protesis_removible", label: "Entrega de protesis e indicaciones", section: "Procedimientos", type: "textarea", rows: 2, contextKey: "notes", placeholder: "Indicaciones al paciente." },
      { id: "revision_1_f5", label: "Primera revision", section: "Procedimientos", type: "text", placeholder: "Fecha y hallazgos." },
      { id: "revision_2_f5", label: "Segunda revision", section: "Procedimientos", type: "text", placeholder: "Fecha y hallazgos." },
      { id: "revision_3_f5", label: "Tercera revision", section: "Procedimientos", type: "text", placeholder: "Fecha y hallazgos." },
      { id: "pronostico_protesis_removible", label: "Pronostico", section: "Procedimientos", type: "text", contextKey: "prognosis", placeholder: "Pronostico funcional del caso." }
    ]
  },
  "f6-prostodoncia": {
    title: "Formato 6: Prostodoncia total/parcial",
    fields: [
      { id: "evaluacion_clinica_f6", label: "Evaluacion clinica", section: "Evaluacion inicial", type: "textarea", rows: 2, contextKey: "consultReason", placeholder: "Resumen de evaluacion clinica." },
      { id: "interpretacion_radiografica_f6", label: "Interpretacion radiografica", section: "Evaluacion inicial", type: "textarea", rows: 2, contextKey: "diagnosis", placeholder: "Interpretacion radiografica." },
      { id: "estado_reborde", label: "Estado del reborde alveolar", section: "Evaluacion inicial", type: "textarea", rows: 2, contextKey: "diagnosis", placeholder: "Reborde favorable, reabsorbido, etc." },
      { id: "plan_prostodoncia", label: "Plan prostodontico", section: "Procedimiento principal", type: "textarea", rows: 2, contextKey: "treatmentPlan", placeholder: "Secuencia de citas y procedimientos." },
      { id: "procedimiento_prostodoncia", label: "Procedimiento", section: "Procedimiento principal", type: "textarea", rows: 2, placeholder: "Procedimiento por cita." },
      { id: "modelos_estudio_f6", label: "Modelos de estudio", section: "Procedimiento principal", type: "text", placeholder: "Registro de modelos de estudio." },
      { id: "modelos_trabajo_f6", label: "Modelos de trabajo", section: "Procedimiento principal", type: "text", placeholder: "Registro de modelos de trabajo." },
      { id: "dimension_vertical", label: "Base de registro y prueba de rodillos", section: "Procedimiento principal", type: "textarea", rows: 2, contextKey: "background", placeholder: "Relacion maxilomandibular y rodillos." },
      { id: "pruebas_prostodoncia", label: "Prueba de dientes y oclusion", section: "Procedimiento principal", type: "textarea", rows: 2, contextKey: "notes", placeholder: "Resultados de pruebas clinicas." },
      { id: "adaptacion_prostodoncia", label: "Terminado / adaptacion del paciente", section: "Procedimiento principal", type: "text", contextKey: "consultReason", placeholder: "Confort, masticacion y fonacion." },
      { id: "pronostico_prostodoncia", label: "Pronostico", section: "Procedimiento principal", type: "text", contextKey: "prognosis", placeholder: "Pronostico general de la rehabilitacion." },
      { id: "ganchos_ubicacion_f6", label: "Tipos de ganchos y ubicacion", section: "Procedimientos complementarios", type: "textarea", rows: 2, placeholder: "Detalle de ganchos por zona." },
      { id: "presentacion_caso_f6", label: "Presentacion del caso", section: "Procedimientos complementarios", type: "text", placeholder: "Fecha/procedimiento." },
      { id: "preparaciones_f6", label: "Preparaciones", section: "Procedimientos complementarios", type: "text", placeholder: "Detalle de preparaciones." },
      { id: "impresion_f6", label: "Impresion", section: "Procedimientos complementarios", type: "text", placeholder: "Tipo de impresion." },
      { id: "prueba_metales_f6", label: "Prueba de metales", section: "Procedimientos complementarios", type: "text", placeholder: "Resultado de prueba." },
      { id: "prueba_rodillos_f6", label: "Prueba de rodillos", section: "Procedimientos complementarios", type: "text", placeholder: "Resultado de prueba." },
      { id: "prueba_oclusion_f6", label: "Prueba de oclusion", section: "Procedimientos complementarios", type: "text", placeholder: "Resultado de oclusion." },
      { id: "entrega_protesis_f6", label: "Entrega de protesis e indicaciones", section: "Procedimientos complementarios", type: "text", placeholder: "Indicaciones entregadas." },
      { id: "revision_1_f6", label: "Primera revision", section: "Procedimientos complementarios", type: "text", placeholder: "Fecha y hallazgos." },
      { id: "revision_2_f6", label: "Segunda revision", section: "Procedimientos complementarios", type: "text", placeholder: "Fecha y hallazgos." },
      { id: "revision_3_f6", label: "Tercera revision", section: "Procedimientos complementarios", type: "text", placeholder: "Fecha y hallazgos." }
    ]
  },
  "f7-cirugia-bucal": {
    title: "Formato 7: Cirugia bucal",
    fields: [
      { id: "enfermedades_sistemicas_f7", label: "Enfermedades sistemicas", section: "Interrogatorio inicial", type: "textarea", rows: 2, placeholder: "Registrar enfermedades sistemicas." },
      { id: "medicacion_cirugia", label: "Alergias a medicamentos o anestesicos", section: "Interrogatorio inicial", type: "textarea", rows: 2, contextKey: "medications", placeholder: "Alergias y reacciones previas." },
      { id: "motivo_cirugia", label: "Padecimiento actual", section: "Interrogatorio inicial", type: "textarea", rows: 2, contextKey: "consultReason", placeholder: "Dolor, infeccion, tercer molar incluido, etc." },
      { id: "tiempo_evolucion_f7", label: "Tiempo de evolucion", section: "Interrogatorio inicial", type: "text", placeholder: "Tiempo de evolucion del padecimiento." },
      { id: "sintomatologia_f7", label: "Sintomatologia", section: "Interrogatorio inicial", type: "textarea", rows: 2, placeholder: "Sintomas principales." },
      { id: "dolor_ubicacion_f7", label: "Si hay dolor: ubicacion", section: "Interrogatorio inicial", type: "text", placeholder: "Ubicacion del dolor." },
      { id: "tipo_dolor_f7", label: "Tipo de dolor", section: "Interrogatorio inicial", type: "text", placeholder: "Pulsatil, irradiado, espontaneo, etc." },
      { id: "dolor_masticar_f7", label: "Dolor al masticar", section: "Interrogatorio inicial", type: "select", options: YES_NO_OPTIONS },
      { id: "aumento_volumen_f7", label: "Aumento de volumen", section: "Interrogatorio inicial", type: "select", options: YES_NO_OPTIONS },
      { id: "secrecion_purulenta_f7", label: "Secrecion purulenta", section: "Interrogatorio inicial", type: "select", options: YES_NO_OPTIONS },
      { id: "radiografia_periapical_f7", label: "Radiografia periapical", section: "Interrogatorio inicial", type: "text", placeholder: "Resultado radiografico." },
      { id: "radiografia_oclusal_f7", label: "Radiografia oclusal", section: "Interrogatorio inicial", type: "text", placeholder: "Resultado radiografico." },
      { id: "radiografia_ortopanto_f7", label: "Radiografia ortopantomografia", section: "Interrogatorio inicial", type: "text", placeholder: "Resultado radiografico." },
      { id: "interpretacion_radiografica_f7", label: "Interpretacion radiografica", section: "Interrogatorio inicial", type: "textarea", rows: 2, contextKey: "diagnosis", placeholder: "Interpretacion de estudios." },
      { id: "exploracion_region_afectada_f7", label: "Exploracion de la region afectada", section: "Interrogatorio inicial", type: "textarea", rows: 2, placeholder: "Especificar hallazgos de la region afectada." },

      { id: "diagnostico_cirugia", label: "Diagnostico", section: "Plan quirurgico", type: "textarea", rows: 2, contextKey: "diagnosis", placeholder: "Diagnostico y localizacion de la lesion." },
      { id: "pronostico_cirugia", label: "Pronostico", section: "Plan quirurgico", type: "text", contextKey: "prognosis", placeholder: "Pronostico del procedimiento." },
      { id: "procedimiento_cirugia", label: "Plan de tratamiento / procedimiento realizado", section: "Plan quirurgico", type: "textarea", rows: 2, contextKey: "treatmentPlan", placeholder: "Tecnica quirurgica empleada." },
      { id: "diagnostico_posquirurgico_f7", label: "Diagnostico posquirurgico", section: "Plan quirurgico", type: "text", placeholder: "Diagnostico posquirurgico." },
      { id: "estado_posquirurgico_f7", label: "Estado posquirurgico inmediato", section: "Plan quirurgico", type: "textarea", rows: 2, placeholder: "Estado del paciente al finalizar." },
      { id: "incidentes_complicaciones_f7", label: "Incidentes, accidentes o complicaciones", section: "Plan quirurgico", type: "textarea", rows: 2, placeholder: "Registrar complicaciones durante el procedimiento." },
      { id: "cuidados_posoperatorios", label: "Indicaciones posquirurgicas", section: "Plan quirurgico", type: "textarea", rows: 2, contextKey: "notes", placeholder: "Indicaciones entregadas al paciente." },
      { id: "evaluacion_cirugia_f7", label: "Evaluacion", section: "Plan quirurgico", type: "text", placeholder: "Evaluacion general." },
      { id: "bloqueo_anestesico_f7", label: "Bloqueo anestesico", section: "Plan quirurgico", type: "text", placeholder: "Tecnica de bloqueo." },
      { id: "antisepsia_f7", label: "Antisepsia", section: "Plan quirurgico", type: "text", placeholder: "Detalle de antisepsia." },
      { id: "incision_f7", label: "Incision", section: "Plan quirurgico", type: "text", placeholder: "Descripcion de la incision." },
      { id: "colgajo_f7", label: "Colgajo", section: "Plan quirurgico", type: "text", placeholder: "Descripcion del colgajo." },
      { id: "tratamiento_zona_intervenida_f7", label: "Tratamiento de la zona intervenida", section: "Plan quirurgico", type: "text", placeholder: "Tratamiento aplicado." },
      { id: "sutura_f7", label: "Sutura", section: "Plan quirurgico", type: "text", placeholder: "Tipo de sutura." },
      { id: "indicaciones_posoperatorias_f7", label: "Indicaciones posoperatorias", section: "Plan quirurgico", type: "text", placeholder: "Indicaciones posteriores." },
      { id: "observaciones_f7", label: "Observaciones", section: "Cierre", type: "textarea", rows: 2, placeholder: "Observaciones finales." },
      { id: "hora_inicio_f7", label: "Hora de inicio", section: "Cierre", type: "text", placeholder: "Hora de inicio del procedimiento." },
      { id: "hora_termino_f7", label: "Hora de termino", section: "Cierre", type: "text", placeholder: "Hora de termino del procedimiento." }
    ]
  },
  "f8-periodoncia": {
    title: "Formato 8: Periodoncia",
    fields: [
      { id: "antecedentes_hereditarios_f8", label: "Antecedentes hereditarios", section: "Ficha clinica periodontal", type: "textarea", rows: 2, placeholder: "Resumen de antecedentes hereditarios." },
      { id: "antecedentes_no_patologicos_f8", label: "Antecedentes personales no patologicos", section: "Ficha clinica periodontal", type: "textarea", rows: 2, placeholder: "Habitos y antecedentes no patologicos." },
      { id: "grupo_sanguineo_f8", label: "Grupo sanguineo", section: "Ficha clinica periodontal", type: "text", placeholder: "Grupo sanguineo." },
      { id: "deporte_f8", label: "Deporte", section: "Ficha clinica periodontal", type: "text", placeholder: "Actividad fisica habitual." },
      { id: "tabaquismo_f8", label: "Tabaquismo", section: "Ficha clinica periodontal", type: "text", placeholder: "Consumo de tabaco." },
      { id: "alcoholismo_f8", label: "Alcoholismo", section: "Ficha clinica periodontal", type: "text", placeholder: "Consumo de alcohol." },
      { id: "otros_habitos_f8", label: "Otros habitos", section: "Ficha clinica periodontal", type: "text", placeholder: "Otros habitos relevantes." },
      { id: "cepillados_dia_f8", label: "Numero de cepillados por dia", section: "Ficha clinica periodontal", type: "text", placeholder: "Veces por dia." },
      { id: "tipo_cepillo_f8", label: "Tipo de cepillo", section: "Ficha clinica periodontal", type: "text", placeholder: "Tipo de cepillo." },
      { id: "uso_pasta_f8", label: "Uso de pasta dental", section: "Ficha clinica periodontal", type: "text", placeholder: "Marca/tipo de pasta." },
      { id: "hilo_dental_f8", label: "Uso de hilo dental", section: "Ficha clinica periodontal", type: "text", placeholder: "Frecuencia de uso." },
      { id: "enjuague_bucal_f8", label: "Enjuague bucal", section: "Ficha clinica periodontal", type: "text", placeholder: "Tipo/frecuencia de enjuague." },

      { id: "profundidad_bolsas", label: "Antecedentes personales patologicos", section: "Antecedentes y exploracion", type: "textarea", rows: 2, contextKey: "background", placeholder: "Resumen de antecedentes patologicos." },
      { id: "padecimiento_actual_f8", label: "Padecimiento actual", section: "Antecedentes y exploracion", type: "textarea", rows: 2, contextKey: "consultReason", placeholder: "Padecimiento actual periodontal." },
      { id: "interrogatorio_aparatos_f8", label: "Interrogatorio por aparatos y sistemas", section: "Antecedentes y exploracion", type: "textarea", rows: 2, placeholder: "Resumen por aparatos y sistemas." },
      { id: "medicamentos_actuales_f8", label: "Medicamentos que utiliza actualmente", section: "Antecedentes y exploracion", type: "textarea", rows: 2, contextKey: "medications", placeholder: "Medicamentos actuales." },
      { id: "inspeccion_general_f8", label: "Inspeccion general", section: "Antecedentes y exploracion", type: "textarea", rows: 2, placeholder: "Hallazgos de inspeccion general." },
      { id: "exploracion_bucal_f8", label: "Exploracion bucal", section: "Antecedentes y exploracion", type: "textarea", rows: 2, placeholder: "Labios, carrillos, lengua, paladar, encias, ATM, dientes." },

      { id: "diagnostico_periodontal", label: "Diagnostico periodontal", section: "Diagnostico periodontal", type: "textarea", rows: 2, contextKey: "diagnosis", placeholder: "Gingivitis, periodontitis, estadio, grado." },
      { id: "sangrado_periodontal", label: "Sangrado al sondaje / inflamacion", section: "Diagnostico periodontal", type: "textarea", rows: 2, contextKey: "consultReason", placeholder: "Hallazgos clinicos iniciales." },
      { id: "plan_periodontal", label: "Plan periodontal", section: "Diagnostico periodontal", type: "textarea", rows: 2, contextKey: "treatmentPlan", placeholder: "Raspado, alisado, control de placa, etc." },
      { id: "fase_mantenimiento", label: "Fase de mantenimiento", section: "Diagnostico periodontal", type: "textarea", rows: 2, contextKey: "notes", placeholder: "Frecuencia y objetivos de mantenimiento." },
      { id: "pronostico_periodontal", label: "Pronostico", section: "Diagnostico periodontal", type: "text", contextKey: "prognosis", placeholder: "Pronostico periodontal por caso." },
      { id: "periodontograma_diagnostico_f8", label: "Periodontograma de diagnostico", section: "Periodontogramas", type: "textarea", rows: 2, placeholder: "Resumen del periodontograma diagnostico." },
      { id: "periodontograma_evolucion_f8", label: "Periodontograma de evolucion", section: "Periodontogramas", type: "textarea", rows: 2, placeholder: "Resumen del periodontograma de evolucion." },
      { id: "auxiliares_diagnostico_f8", label: "Auxiliares de diagnostico", section: "Auxiliares y cierre", type: "textarea", rows: 2, placeholder: "Radiografias, modelos, fotografias, laboratorio." },
      { id: "diagnostico_presuncion_sistemico_f8", label: "Diagnostico de presuncion sistemico", section: "Auxiliares y cierre", type: "text", placeholder: "Diagnostico sistemico presuntivo." }
    ]
  },
  "f9-endodoncia": {
    title: "Formato 9: Endodoncia",
    fields: [
      { id: "direccion_f9", label: "Direccion", section: "Datos generales", type: "text", placeholder: "Direccion del paciente." },
      { id: "referido_por_f9", label: "Remitido por", section: "Datos generales", type: "text", placeholder: "Nombre de quien refiere." },
      { id: "fecha_inicio_f9", label: "Fecha de inicio", section: "Datos generales", type: "text", placeholder: "Fecha de inicio del caso." },
      { id: "fecha_termino_f9", label: "Fecha de termino", section: "Datos generales", type: "text", placeholder: "Fecha estimada o real de termino." },
      { id: "pieza_endodoncia", label: "Dientes que ha de tratarse", section: "Datos generales", type: "text", contextKey: "odontoSummary", placeholder: "Ejemplo: 11, 21, 36." },
      { id: "interrogatorio_f9", label: "Interrogatorio", section: "Antecedentes", type: "textarea", rows: 2, placeholder: "Resumen de interrogatorio." },
      { id: "antecedentes_f9", label: "Antecedentes", section: "Antecedentes", type: "textarea", rows: 2, contextKey: "background", placeholder: "Antecedentes del caso." },
      { id: "dolor_f9", label: "Dolor", section: "Antecedentes", type: "text", placeholder: "Caracteristicas del dolor." },
      { id: "estimulo_f9", label: "Estimulo", section: "Antecedentes", type: "text", placeholder: "Frio, calor, masticacion, dulce, etc." },
      { id: "examen_intrabucal_f9", label: "Examen intrabucal", section: "Antecedentes", type: "textarea", rows: 2, placeholder: "Hallazgos intrabucales." },
      { id: "examen_extrabucal_f9", label: "Examen extrabucal", section: "Antecedentes", type: "textarea", rows: 2, placeholder: "Hallazgos extrabucales." },

      { id: "pruebas_endodoncia", label: "Pruebas de sensibilidad pulpar", section: "Pruebas diagnosticas", type: "textarea", rows: 2, contextKey: "background", placeholder: "Resultados de sensibilidad y percusion." },
      { id: "pruebas_periodontales_f9", label: "Pruebas periodontales", section: "Pruebas diagnosticas", type: "textarea", rows: 2, placeholder: "Percusion horizontal/vertical, movilidad, sondeo." },
      { id: "interpretacion_radiografica_f9", label: "Interpretacion radiografica", section: "Pruebas diagnosticas", type: "textarea", rows: 2, placeholder: "Interpretacion de camara, conducto y periodonto." },
      { id: "diagnostico_pulpar", label: "Diagnostico pulpar", section: "Diagnostico y plan", type: "textarea", rows: 2, contextKey: "diagnosis", placeholder: "Diagnostico endodontico pulpar." },
      { id: "pronostico_periapical_f9", label: "Diagnostico periapical", section: "Diagnostico y plan", type: "textarea", rows: 2, placeholder: "Diagnostico periapical." },
      { id: "tecnica_endodoncia", label: "Tratamiento", section: "Diagnostico y plan", type: "textarea", rows: 2, contextKey: "treatmentPlan", placeholder: "Tecnica de instrumentacion/obturacion." },
      { id: "control_endodoncia", label: "Odontograma de evolucion / control", section: "Diagnostico y plan", type: "textarea", rows: 2, contextKey: "notes", placeholder: "Seguimiento clinico y radiografico." },
      { id: "pronostico_endodoncia", label: "Pronostico", section: "Diagnostico y plan", type: "text", contextKey: "prognosis", placeholder: "Pronostico de la pieza tratada." },

      { id: "longitud_trabajo_f9", label: "Longitud de trabajo (aparente / real / relacion)", section: "Procedimiento", type: "textarea", rows: 2, placeholder: "Longitud de trabajo por conducto." },
      { id: "tecnica_instrumentacion_f9", label: "Tecnica de instrumentacion", section: "Procedimiento", type: "text", placeholder: "Tecnica utilizada." },
      { id: "tecnica_obturacion_f9", label: "Tecnica de obturacion", section: "Procedimiento", type: "text", placeholder: "Tecnica de obturacion." },
      { id: "indicaciones_f9", label: "Indicaciones", section: "Procedimiento", type: "text", placeholder: "Indicaciones post-tratamiento." }
    ]
  },
  "f10-ortodoncia": {
    title: "Formato 10: Ortodoncia y ortopedia maxilar",
    fields: [
      { id: "motivo_ortodoncia", label: "Motivo de la consulta", section: "Datos generales", type: "textarea", rows: 2, contextKey: "consultReason", placeholder: "Motivo principal del tratamiento ortodontico." },
      { id: "padecimiento_actual_ortodoncia", label: "Padecimiento actual", section: "Datos generales", type: "textarea", rows: 2, contextKey: "consultReason", placeholder: "Padecimiento actual." },
      { id: "tratamiento_medico_actual_ortodoncia", label: "Esta bajo tratamiento medico actualmente", section: "Datos generales", type: "text", placeholder: "Detalle del tratamiento medico actual." },
      { id: "ultimo_examen_medico_ortodoncia", label: "Ultimo examen medico y motivo", section: "Datos generales", type: "text", placeholder: "Fecha/motivo del ultimo examen medico." },
      { id: "ultimo_examen_dental_ortodoncia", label: "Ultimo examen dental", section: "Datos generales", type: "text", placeholder: "Fecha y observaciones del ultimo examen dental." },
      { id: "problema_tratamientos_dentales_ortodoncia", label: "Ha tenido problema asociado a tratamientos dentales", section: "Datos generales", type: "text", placeholder: "Detalle del problema." },
      { id: "tratamientos_ortodonticos_previos", label: "Ha recibido tratamientos ortodonticos u ortopedicos", section: "Datos generales", type: "text", placeholder: "Detalle de tratamientos previos." },
      { id: "referido_por_ortodoncia", label: "Referido por", section: "Datos generales", type: "text", placeholder: "Medico familiar / CD general / otros." },
      { id: "nombre_padre_ortodoncia", label: "Nombre del padre", section: "Datos generales", type: "text", placeholder: "Nombre del padre." },
      { id: "nombre_madre_ortodoncia", label: "Nombre de la madre", section: "Datos generales", type: "text", placeholder: "Nombre de la madre." },
      { id: "tutor_ortodoncia", label: "Tutor / representante legal", section: "Datos generales", type: "text", placeholder: "Nombre del tutor o representante legal." },
      { id: "telefono_tutor_ortodoncia", label: "Telefono particular y de trabajo", section: "Datos generales", type: "text", placeholder: "Telefonos de contacto." },

      { id: "antecedentes_patologicos_ortodoncia", label: "Antecedentes patologicos", section: "Antecedentes medicos", type: "textarea", rows: 2, contextKey: "background", placeholder: "Resumen de antecedentes patologicos." },
      { id: "alergias_medicamentos_ortodoncia", label: "Alergias a medicamentos", section: "Antecedentes medicos", type: "textarea", rows: 2, placeholder: "Antibioticos, sulfas, anestesicos, etc." },
      { id: "tratamiento_psicologico_psiquiatrico", label: "Tratamiento psicologico/psiquiatrico", section: "Antecedentes medicos", type: "text", placeholder: "Si/no y tiempo." },
      { id: "medicamentos_estres_ortodoncia", label: "Medicamentos contra el estres", section: "Antecedentes medicos", type: "text", placeholder: "Detalle de medicamentos." },
      { id: "enfermedades_padecidas_ortodoncia", label: "Enfermedades padecidas", section: "Antecedentes medicos", type: "textarea", rows: 3, placeholder: "Hipertension, asma, diabetes, renales, etc." },
      { id: "trastornos_respiratorios_ortodoncia", label: "Trastornos respiratorios", section: "Antecedentes medicos", type: "textarea", rows: 2, placeholder: "Disnea, cianosis, epistaxis, etc." },
      { id: "cirugia_o_enfermedad_seria_ortodoncia", label: "Cirugia o enfermedad seria no mencionada", section: "Antecedentes medicos", type: "textarea", rows: 2, placeholder: "Detalle de cirugias/enfermedades serias." },
      { id: "medicamentos_actuales_ortodoncia", label: "Medicamentos actualmente", section: "Antecedentes medicos", type: "text", contextKey: "medications", placeholder: "Medicacion actual." },

      { id: "antecedentes_no_patologicos_ortodoncia", label: "Antecedentes no patologicos", section: "Antecedentes no patologicos", type: "textarea", rows: 2, placeholder: "Resumen general no patologico." },
      { id: "embarazo_parto_ortodoncia", label: "Numero de gesta / embarazo / parto", section: "Antecedentes no patologicos", type: "textarea", rows: 2, placeholder: "Datos perinatales." },
      { id: "alimentacion_ortodoncia", label: "Alimentacion y comentarios", section: "Antecedentes no patologicos", type: "textarea", rows: 2, placeholder: "Pecho, biberon, balanceada/deficiencias." },
      { id: "desarrollo_psicomotor_ortodoncia", label: "Desarrollo psicomotor", section: "Antecedentes no patologicos", type: "textarea", rows: 2, placeholder: "SNC, hiperactivo, desarrollo tardio, etc." },
      { id: "desarrollo_lenguaje_ortodoncia", label: "Balbuceo / primeras palabras / lenguaje estructurado", section: "Antecedentes no patologicos", type: "text", placeholder: "Cronologia de desarrollo del lenguaje." },
      { id: "erupcion_control_esfinteres_ortodoncia", label: "Erupcion dentaria y control de esfinteres", section: "Antecedentes no patologicos", type: "text", placeholder: "Evolucion y edad de erupcion/controles." },
      { id: "genitourinario_enuresis_ortodoncia", label: "Genitourinario / enuresis / menarca", section: "Antecedentes no patologicos", type: "text", placeholder: "Datos relevantes." },

      { id: "diagnostico_oclusal", label: "Examen de la cavidad bucal / oclusion", section: "Analisis ortodontico", type: "textarea", rows: 2, contextKey: "background", placeholder: "Higiene, periodonto y oclusion." },
      { id: "analisis_facial", label: "Analisis facial y esqueletal", section: "Analisis ortodontico", type: "textarea", rows: 2, contextKey: "diagnosis", placeholder: "Clase esqueletal, perfil y simetria." },
      { id: "plan_ortodontico", label: "Plan ortodontico", section: "Analisis ortodontico", type: "textarea", rows: 2, contextKey: "treatmentPlan", placeholder: "Tipo de aparatologia y fases." },
      { id: "seguimiento_ortodoncia", label: "Nota de evolucion", section: "Analisis ortodontico", type: "textarea", rows: 2, contextKey: "notes", placeholder: "Ajustes y respuesta del paciente." },
      { id: "pronostico_ortodoncia", label: "Pronostico", section: "Analisis ortodontico", type: "text", contextKey: "prognosis", placeholder: "Pronostico del tratamiento ortodontico." },
      { id: "objetivo_ortodoncia", label: "Objetivos del tratamiento", section: "Analisis ortodontico", type: "textarea", rows: 2, contextKey: "consultReason", placeholder: "Objetivos funcionales y esteticos." },
      { id: "auxiliares_diagnostico_ortodoncia", label: "Auxiliares de diagnostico", section: "Analisis ortodontico", type: "textarea", rows: 2, placeholder: "Modelos, fotografias, radiografias, cefalometria, etc." },
      { id: "odontograma_ortodontico", label: "Odontograma ortodontico", section: "Analisis ortodontico", type: "textarea", rows: 2, placeholder: "Resumen de hallazgos en odontograma." },
      { id: "citas_complementarias_ortodoncia", label: "Citas complementarias y correcciones", section: "Analisis ortodontico", type: "textarea", rows: 2, placeholder: "Detalle de citas complementarias." },
      { id: "observaciones_ortodoncia", label: "Observaciones", section: "Analisis ortodontico", type: "textarea", rows: 2, placeholder: "Observaciones finales del formato." }
    ]
  },
  "f11-odontopediatria": {
    title: "Formato 11: Odontopediatria",
    fields: [
      { id: "responsable_nino", label: "Tutor o responsable", section: "Interrogatorio pediatrico", type: "text", contextKey: "background", placeholder: "Nombre del tutor responsable." },
      { id: "conducta_paciente_pediatrico", label: "Conducta del paciente pediatrico", section: "Interrogatorio pediatrico", type: "textarea", rows: 2, contextKey: "consultReason", placeholder: "Cooperador, ansioso, etc." },
      { id: "ultima_consulta_pediatrica", label: "Fecha y motivo de la ultima consulta medica u odontologica", section: "Interrogatorio pediatrico", type: "text", placeholder: "Fecha y motivo de ultima consulta." },
      { id: "derechohabiencia_pediatria", label: "Derechohabiente / no derechohabiente", section: "Interrogatorio pediatrico", type: "text", placeholder: "Especificar condicion." },
      { id: "medico_pediatra_familiar", label: "Nombre del medico pediatra familiar", section: "Interrogatorio pediatrico", type: "text", placeholder: "Nombre del medico pediatra." },
      { id: "telefono_medico_pediatra", label: "Telefono del medico pediatra", section: "Interrogatorio pediatrico", type: "text", placeholder: "Telefono de contacto." },

      { id: "hereditarios_madre_f11", label: "Padecimientos familiares - Madre", section: "Antecedentes hereditarios y familiares", type: "text", placeholder: "Anotar antecedentes en linea directa." },
      { id: "hereditarios_padre_f11", label: "Padecimientos familiares - Padre", section: "Antecedentes hereditarios y familiares", type: "text", placeholder: "Anotar antecedentes en linea directa." },
      { id: "hereditarios_hermanos_f11", label: "Padecimientos familiares - Hermanos", section: "Antecedentes hereditarios y familiares", type: "text", placeholder: "Anotar antecedentes en linea directa." },
      { id: "hereditarios_tios_f11", label: "Padecimientos familiares - Tios", section: "Antecedentes hereditarios y familiares", type: "text", placeholder: "Anotar antecedentes en linea directa." },
      { id: "hereditarios_abuelos_f11", label: "Padecimientos familiares - Abuelos", section: "Antecedentes hereditarios y familiares", type: "text", placeholder: "Anotar antecedentes en linea directa." },

      { id: "patologicos_pediatria", label: "Antecedentes personales patologicos", section: "Antecedentes personales", type: "textarea", rows: 2, contextKey: "background", placeholder: "Resumen de antecedentes patologicos pediatricos." },
      { id: "tratamiento_medico_previo_f11", label: "Ha estado en tratamiento medico", section: "Antecedentes personales", type: "text", placeholder: "Si/no y en que etapa." },
      { id: "motivo_tratamiento_medico_f11", label: "Cual fue el motivo del tratamiento medico", section: "Antecedentes personales", type: "text", placeholder: "Motivo del tratamiento previo." },
      { id: "medicamento_actual_f11", label: "Toma algun medicamento actualmente (motivo)", section: "Antecedentes personales", type: "text", contextKey: "medications", placeholder: "Medicamento y motivo." },
      { id: "trastornos_mentales_f11", label: "Trastornos mentales, emocionales o nerviosos", section: "Antecedentes personales", type: "text", placeholder: "Detalle en caso afirmativo." },

      { id: "habitos_higienicos_diarios_f11", label: "Habitos higienicos: vestir, corporales y bucales", section: "Antecedentes no patologicos", type: "text", contextKey: "hygieneHabitsDaily", placeholder: "Rutina de higiene diaria." },
      { id: "frecuencia_higiene_boca_f11", label: "Frecuencia de higiene de boca al dia", section: "Antecedentes no patologicos", type: "text", placeholder: "Veces por dia." },
      { id: "auxiliares_higiene_f11", label: "Utiliza auxiliares de higiene bucal", section: "Antecedentes no patologicos", type: "select", options: YES_NO_OPTIONS },
      { id: "auxiliares_higiene_cuales_f11", label: "Auxiliares de higiene: cuales son", section: "Antecedentes no patologicos", type: "text", placeholder: "Cepillo, hilo, enjuague, etc." },
      { id: "consume_golosinas_f11", label: "Consume golosinas entre comidas", section: "Antecedentes no patologicos", type: "select", options: YES_NO_OPTIONS },
      { id: "grupo_sanguineo_f11", label: "Grupo sanguineo", section: "Antecedentes no patologicos", type: "text", placeholder: "Ejemplo: O." },
      { id: "factor_rh_f11", label: "Factor Rh", section: "Antecedentes no patologicos", type: "text", placeholder: "Ejemplo: + o -." },
      { id: "cartilla_vacunacion_f11", label: "Cuenta con cartilla de vacunacion", section: "Antecedentes no patologicos", type: "select", options: YES_NO_OPTIONS },
      { id: "esquema_vacunacion_completo_f11", label: "Tiene esquema completo de vacunacion", section: "Antecedentes no patologicos", type: "select", options: YES_NO_OPTIONS },
      { id: "esquema_vacunacion_falta_f11", label: "Especifique cual vacuna falta", section: "Antecedentes no patologicos", type: "text", placeholder: "Vacuna faltante." },

      { id: "padecimiento_actual_f11", label: "Padecimiento actual", section: "Interrogatorio por aparatos y sistemas", type: "textarea", rows: 2, contextKey: "consultReason", placeholder: "Detalle del padecimiento actual." },
      { id: "antecedentes_alergicos_f11", label: "Antecedentes alergicos", section: "Interrogatorio por aparatos y sistemas", type: "textarea", rows: 2, contextKey: "allergies", placeholder: "Alergias y especificacion." },
      { id: "aparato_digestivo_f11", label: "Aparato digestivo", section: "Interrogatorio por aparatos y sistemas", type: "textarea", rows: 2, placeholder: "Hallazgos digestivos." },
      { id: "aparato_respiratorio_f11", label: "Aparato respiratorio", section: "Interrogatorio por aparatos y sistemas", type: "textarea", rows: 2, placeholder: "Hallazgos respiratorios." },
      { id: "aparato_cardiovascular_f11", label: "Aparato cardiovascular", section: "Interrogatorio por aparatos y sistemas", type: "textarea", rows: 2, placeholder: "Hallazgos cardiovasculares." },
      { id: "aparato_genitourinario_f11", label: "Aparato genitourinario", section: "Interrogatorio por aparatos y sistemas", type: "textarea", rows: 2, placeholder: "Hallazgos genitourinarios." },
      { id: "sistema_endocrino_f11", label: "Sistema endocrino", section: "Interrogatorio por aparatos y sistemas", type: "textarea", rows: 2, placeholder: "Hallazgos endocrinos." },
      { id: "sistema_hemopoyetico_f11", label: "Sistema hemopoyetico", section: "Interrogatorio por aparatos y sistemas", type: "textarea", rows: 2, placeholder: "Hallazgos hemopoyeticos." },
      { id: "sistema_nervioso_f11", label: "Sistema nervioso", section: "Interrogatorio por aparatos y sistemas", type: "textarea", rows: 2, placeholder: "Hallazgos neurologicos." },
      { id: "sistema_musculoesqueletico_f11", label: "Sistema musculoesqueletico", section: "Interrogatorio por aparatos y sistemas", type: "textarea", rows: 2, placeholder: "Hallazgos musculoesqueleticos." },
      { id: "aparato_tegumentario_f11", label: "Aparato tegumentario", section: "Interrogatorio por aparatos y sistemas", type: "textarea", rows: 2, placeholder: "Hallazgos tegumentarios." },

      { id: "exploracion_fisica_f11", label: "Exploracion fisica", section: "Exploracion fisica", type: "textarea", rows: 2, placeholder: "Habitus exterior y hallazgos generales." },
      { id: "signos_vitales_f11", label: "Signos vitales", section: "Exploracion fisica", type: "text", placeholder: "Peso, talla, complexion, temperatura, etc." },
      { id: "exploracion_cabeza_cuello_f11", label: "Exploracion de cabeza y cuello", section: "Exploracion fisica", type: "textarea", rows: 2, placeholder: "Cabeza, craneo, cara, perfil, piel, musculos, cuello." },
      { id: "exploracion_estomatognatico_f11", label: "Exploracion del aparato estomatognatico", section: "Exploracion fisica", type: "textarea", rows: 3, placeholder: "ATM, tejidos blandos, lengua, paladar, encias, dientes." },

      { id: "analisis_oclusion_f11", label: "Analisis de la oclusion", section: "Oclusion y odontograma", type: "textarea", rows: 2, placeholder: "Plano terminal, clase de oclusion, sobremordidas, mordida cruzada." },
      { id: "indice_higiene_f11", label: "Indice de higiene bucal", section: "Oclusion y odontograma", type: "text", placeholder: "Resultado de indice de higiene." },
      { id: "indice_placa_actual_f11", label: "Indice de placa actual", section: "Oclusion y odontograma", type: "text", placeholder: "Resultado de indice de placa." },
      { id: "diagnostico_odontopediatria", label: "Odontograma diagnostico", section: "Oclusion y odontograma", type: "textarea", rows: 2, contextKey: "diagnosis", placeholder: "Hallazgos clinicos de denticion temporal/mixta." },
      { id: "plan_odontopediatria", label: "Plan preventivo / terapeutico", section: "Oclusion y odontograma", type: "textarea", rows: 2, contextKey: "treatmentPlan", placeholder: "Selladores, fluor, restauraciones, etc." },
      { id: "indicaciones_tutor", label: "Indicaciones al tutor", section: "Oclusion y odontograma", type: "textarea", rows: 2, contextKey: "notes", placeholder: "Cuidados en casa y control dietetico." },
      { id: "pronostico_odontopediatria", label: "Pronostico", section: "Oclusion y odontograma", type: "text", contextKey: "prognosis", placeholder: "Pronostico del caso pediatrico." },
      { id: "odontograma_evolucion_f11", label: "Odontograma de evolucion", section: "Oclusion y odontograma", type: "textarea", rows: 2, placeholder: "Cambios del odontograma en controles." },
      { id: "interpretacion_radiografica_f11", label: "Interpretacion radiografica", section: "Estudios y cierre", type: "textarea", rows: 2, placeholder: "Interpretacion de radiografias." },
      { id: "estudios_laboratorio_f11", label: "Estudios de laboratorio y gabinete", section: "Estudios y cierre", type: "textarea", rows: 2, placeholder: "Resultados de laboratorio y gabinete." }
    ]
  }
};

const CLINICAL_FORMAT_START_PAGES = {
  "f1-estomatologica": 1,
  "f2-preventiva": 13,
  "f3-operatoria": 17,
  "f4-protesis-fija": 21,
  "f5-protesis-removible": 23,
  "f6-prostodoncia": 25,
  "f7-cirugia-bucal": 27,
  "f8-periodoncia": 31,
  "f9-endodoncia": 37,
  "f10-ortodoncia": 41,
  "f11-odontopediatria": 53
};

const CLINICAL_REUSABLE_CONTEXT_KEYS = new Set([
  "consultReason",
  "diagnosis",
  "treatmentPlan",
  "prognosis",
  "notes",
  "medications",
  "allergies",
  "odontoSummary"
]);

const CLINICAL_FORMAT_ORDER = Object.keys(CLINICAL_FORMAT_START_PAGES);

const CLINICAL_PDF_LABEL_RULES = [
  { matches: ["apellido paterno"], value: "lastNameFather" },
  { matches: ["apellido materno"], value: "lastNameMother" },
  { matches: ["nombre(s)"], value: "firstNames" },
  { matches: ["nombre del paciente"], value: "fullName", maxPerPage: 2 },
  { matches: ["nombre completo"], value: "fullName", maxPerPage: 2 },
  { matches: ["folio"], value: "recordReference", maxPerPage: 2, maxWidth: 180 },
  { matches: ["referencia"], value: "recordReference", maxPerPage: 2, maxWidth: 180 },
  { matches: ["paciente"], value: "fullName", exact: true, maxPerPage: 1, dx: 28 },
  { matches: ["edad"], value: "ageText", exact: true, maxPerPage: 2 },
  { matches: ["anos"], value: "ageYears", exact: true, maxPerPage: 2 },
  { matches: ["meses"], value: "ageMonths", exact: true, maxPerPage: 2 },
  { matches: ["genero"], value: "sexLabel", exact: true, maxPerPage: 2 },
  { matches: ["sexo"], value: "sexLabel", exact: true, maxPerPage: 2 },
  { matches: ["masculino"], mark: (ctx) => ctx.isMale, exact: true, dx: -10, dy: 1, size: 10, maxPerPage: 1 },
  { matches: ["femenino"], mark: (ctx) => ctx.isFemale, exact: true, dx: -10, dy: 1, size: 10, maxPerPage: 1 },
  { matches: ["lugar y fecha de nacimiento"], value: "birthPlaceDate", maxWidth: 230, maxLines: 2 },
  { matches: ["(estado)"], value: "locationShort", maxPerPage: 1 },
  { matches: ["(ciudad)"], value: "locationShort", maxPerPage: 1 },
  { matches: ["ocupacion"], value: "occupation", maxPerPage: 2 },
  { matches: ["escolaridad"], value: "occupationAlt", maxPerPage: 1 },
  { matches: ["estado civil"], value: "civilStatus", maxPerPage: 1 },
  { matches: ["domicilio: calle"], value: "location", maxWidth: 220, maxLines: 2 },
  { matches: ["direccion"], value: "location", maxWidth: 220, maxLines: 2 },
  { matches: ["domicilio"], value: "location", maxPerPage: 1, maxWidth: 220, maxLines: 2 },
  { matches: ["colonia"], value: "locationShort", maxPerPage: 1 },
  { matches: ["estado"], value: "locationShort", exact: true, maxPerPage: 1 },
  { matches: ["mpio"], value: "locationShort", maxPerPage: 1 },
  { matches: ["delegacion"], value: "locationShort", maxPerPage: 1 },
  { matches: ["telefono de oficina"], value: "phone", maxPerPage: 1 },
  { matches: ["telefono"], value: "phone", maxPerPage: 2 },
  { matches: ["fecha"], value: "consultDateLabel", maxPerPage: 2 },
  { matches: ["dia"], value: "consultDay", exact: true, maxPerPage: 2 },
  { matches: ["mes"], value: "consultMonth", exact: true, maxPerPage: 2 },
  { matches: ["ano"], value: "consultYear", exact: true, maxPerPage: 2 },
  { matches: ["nombre del medico familiar"], value: "dentistName", maxPerPage: 1, maxWidth: 200 },
  { matches: ["nombre del solicitante"], value: "dentistName", maxPerPage: 1, maxWidth: 200 },
  { matches: ["nombre de doctor"], value: "dentistName", maxPerPage: 1, maxWidth: 200 },
  { matches: ["diagnostico"], value: "diagnosis", maxWidth: 235, maxLines: 3, maxPerPage: 2 },
  { matches: ["pronostico"], value: "prognosis", maxWidth: 220, maxLines: 2, maxPerPage: 1 },
  { matches: ["plan de tratamiento"], value: "treatmentPlan", maxWidth: 240, maxLines: 3, maxPerPage: 2 },
  { matches: ["motivo de consulta"], value: "consultReason", maxWidth: 220, maxLines: 3, maxPerPage: 1 },
  { matches: ["padecimiento actual"], value: "consultReason", maxWidth: 220, maxLines: 3, maxPerPage: 1 },
  { matches: ["medicamentos"], value: "medications", maxWidth: 210, maxLines: 2, maxPerPage: 1 },
  { matches: ["alergias"], value: "allergies", maxWidth: 210, maxLines: 2, maxPerPage: 2 },
  { matches: ["antecedentes"], value: "background", maxWidth: 230, maxLines: 3, maxPerPage: 2 },
  { matches: ["observaciones"], value: "notes", maxWidth: 230, maxLines: 3, maxPerPage: 2 },
  { matches: ["odontograma"], value: "odontoSummary", maxWidth: 230, maxLines: 2, maxPerPage: 1 }
];

const CLINICAL_IDENTIFICATION_KEYS = new Set([
  "fullName",
  "firstNames",
  "lastNameFather",
  "lastNameMother",
  "ageText",
  "ageYears",
  "ageMonths",
  "sexLabel",
  "birthPlaceDate",
  "birthDay",
  "birthMonth",
  "birthYear",
  "location",
  "locationShort",
  "locationStreet",
  "locationColony",
  "locationMunicipality",
  "locationDelegation",
  "locationState",
  "locationCity",
  "occupation",
  "occupationAlt",
  "civilStatus",
  "phone",
  "doctorPhone",
  "dentistName",
  "consultDateLabel",
  "consultDay",
  "consultMonth",
  "consultYear",
  "lastMedicalConsult"
]);

const CLINICAL_IDENTIFICATION_LAYOUT_FORMATS = new Set([
  "f1-estomatologica",
  "f11-odontopediatria"
]);

const CLINICAL_HEADER_FILL_RULES = [
  {
    id: "header-record-ref",
    valueKey: "recordReference",
    matches: ["expediente num.", "folio de la hoja de especialidad", "folio"],
    maxWidth: 175,
    maxLines: 1,
    pageOffset: 0
  },
  {
    id: "header-full-name",
    valueKey: "fullName",
    matches: ["nombre del paciente", "nombre"],
    maxWidth: 220,
    maxLines: 1,
    pageOffset: 0
  },
  {
    id: "header-lastname-father",
    valueKey: "lastNameFather",
    matches: ["apellido paterno"],
    maxWidth: 90,
    maxLines: 1,
    pageOffset: 0
  },
  {
    id: "header-lastname-mother",
    valueKey: "lastNameMother",
    matches: ["apellido materno"],
    maxWidth: 95,
    maxLines: 1,
    pageOffset: 0
  },
  {
    id: "header-firstnames",
    valueKey: "firstNames",
    matches: ["nombre(s)", "nombre preferido"],
    maxWidth: 130,
    maxLines: 1,
    pageOffset: 0
  },
  {
    id: "header-dentist",
    valueKey: "dentistName",
    matches: [
      "nombre del cd (tratante)",
      "nombre del cd",
      "nombre cd",
      "nombre del medico familiar",
      "nombre del medico pediatra familiar",
      "remitido por",
      "referido por"
    ],
    maxWidth: 190,
    maxLines: 1,
    pageOffset: 0
  },
  {
    id: "header-sex",
    valueKey: "sexLabel",
    matches: ["sexo", "genero", "género"],
    maxWidth: 70,
    maxLines: 1,
    pageOffset: 0
  },
  {
    id: "header-age",
    valueKey: "ageText",
    matches: ["edad", "edad:"],
    maxWidth: 38,
    maxLines: 1,
    pageOffset: 0
  },
  {
    id: "header-address",
    valueKey: "location",
    matches: ["direccion", "domicilio, calle y numero", "domicilio: calle"],
    maxWidth: 220,
    maxLines: 1,
    pageOffset: 0
  },
  {
    id: "header-phone",
    valueKey: "phone",
    matches: ["tel.", "telefono", "teléfono"],
    maxWidth: 92,
    maxLines: 1,
    pageOffset: 0
  },
  {
    id: "header-occupation",
    valueKey: "occupation",
    matches: ["ocupacion", "ocupación"],
    maxWidth: 130,
    maxLines: 1,
    pageOffset: 0
  }
];

const CLINICAL_FIELD_PDF_RULES = {
  "f1-estomatologica": {
    motivo_consulta: { maxWidth: 360, maxLines: 3, pageOffset: 1, x: 148, y: 234.2, dx: 0 },
    antecedentes_estomatologicos: { maxWidth: 280, maxLines: 3, pageOffset: 1, x: 265, y: 658.2, dx: 0 },
    ultima_consulta_medica_odontologica: { maxWidth: 236, maxLines: 1, pageOffset: 0, x: 307, y: 222.4, maxChars: 64 },

    hereditarios_madre: { maxWidth: 436, maxLines: 1, pageOffset: 0, x: 106, y: 142.4, maxChars: 96 },
    hereditarios_padre: { maxWidth: 438, maxLines: 1, pageOffset: 0, x: 104, y: 126.4, maxChars: 96 },
    hereditarios_hermanos: { maxWidth: 421, maxLines: 1, pageOffset: 0, x: 118, y: 110.4, maxChars: 94 },
    hereditarios_hijos: { maxWidth: 443, maxLines: 1, pageOffset: 0, x: 99, y: 94.4, maxChars: 94 },
    hereditarios_esposo: { maxWidth: 424, maxLines: 1, pageOffset: 0, x: 114, y: 78.4, maxChars: 94 },
    hereditarios_tios: { maxWidth: 447, maxLines: 1, pageOffset: 0, x: 95, y: 62.4, maxChars: 94 },
    hereditarios_abuelos: { maxWidth: 432, maxLines: 1, pageOffset: 0, x: 110, y: 46.4, maxChars: 94 },

    patologicos_inflamatorias: { maxWidth: 245, maxLines: 1, pageOffset: 1, x: 297, y: 627.3, maxChars: 54 },
    patologicos_transmision_sexual: { maxWidth: 335, maxLines: 1, pageOffset: 1, x: 208, y: 611.3, maxChars: 74 },
    patologicos_degenerativas: { maxWidth: 352, maxLines: 1, pageOffset: 1, x: 185, y: 595.3, maxChars: 78 },
    patologicos_neoplasicas: { maxWidth: 362, maxLines: 1, pageOffset: 1, x: 176, y: 579.3, maxChars: 80 },
    patologicos_congenitas: { maxWidth: 365, maxLines: 1, pageOffset: 1, x: 171, y: 563.3, maxChars: 80 },
    patologicos_otras: { maxWidth: 450, maxLines: 1, pageOffset: 1, x: 92, y: 547.3, maxChars: 98 },

    habitos_higienicos_diarios: { maxWidth: 130, maxLines: 1, pageOffset: 1, x: 206.6, y: 475.3, maxChars: 32 },
    habitos_higienicos_corporales: { maxWidth: 145, maxLines: 1, pageOffset: 1, x: 392, y: 475.3, maxChars: 32 },
    frecuencia_lavado_dientes: { maxWidth: 322, maxLines: 1, pageOffset: 1, x: 220, y: 459.3, maxChars: 68 },

    auxiliares_higiene_usa: {
      type: "mark-select",
      pageOffset: 1,
      size: 10,
      markMap: {
        si: { x: 221, y: 443.3 },
        no: { x: 264.8, y: 443.3 }
      }
    },
    auxiliares_higiene_cuales: { maxWidth: 230, maxLines: 1, pageOffset: 1, x: 309, y: 443.3, maxChars: 52 },

    consume_golosinas: {
      type: "mark-select",
      pageOffset: 1,
      size: 10,
      markMap: {
        si: { x: 348.2, y: 427.3 },
        no: { x: 421.2, y: 427.3 }
      }
    },

    grupo_sanguineo_f1: { maxWidth: 65, maxLines: 1, pageOffset: 1, x: 132, y: 411.3, maxChars: 6 },
    factor_rh_f1: { maxWidth: 58, maxLines: 1, pageOffset: 1, x: 244, y: 411.3, maxChars: 8 },

    cartilla_vacunacion: {
      type: "mark-select",
      pageOffset: 1,
      size: 10,
      markMap: {
        si: { x: 474.8, y: 411.3 },
        no: { x: 525.2, y: 411.3 }
      }
    },

    esquema_vacunacion_completo: {
      type: "mark-select",
      pageOffset: 1,
      size: 10,
      markMap: {
        si: { x: 209.8, y: 395.3 },
        no: { x: 281.8, y: 395.3 }
      }
    },

    esquema_vacunacion_falta: { maxWidth: 388, maxLines: 1, pageOffset: 1, x: 151, y: 379.3, maxChars: 88 },

    adiccion_tabaco: {
      type: "mark-single",
      pageOffset: 1,
      x: 188.2,
      y: 355.3,
      size: 10,
      truthyValues: ["si", "s?", "x", "1", "true", "positivo"]
    },
    adiccion_alcohol: {
      type: "mark-single",
      pageOffset: 1,
      x: 292.2,
      y: 355.3,
      size: 10,
      truthyValues: ["si", "s?", "x", "1", "true", "positivo"]
    },

    alergia_antibioticos: {
      type: "mark-single",
      pageOffset: 1,
      x: 121.5,
      y: 307.3,
      size: 10,
      truthyValues: ["si", "s?", "x", "1", "true", "positivo"]
    },
    alergia_analgesicos: {
      type: "mark-single",
      pageOffset: 1,
      x: 243.5,
      y: 307.3,
      size: 10,
      truthyValues: ["si", "s?", "x", "1", "true", "positivo"]
    },
    alergia_anestesicos: {
      type: "mark-single",
      pageOffset: 1,
      x: 364.2,
      y: 307.3,
      size: 10,
      truthyValues: ["si", "s?", "x", "1", "true", "positivo"]
    },
    alergia_alimentos: {
      type: "mark-single",
      pageOffset: 1,
      x: 481.8,
      y: 307.3,
      size: 10,
      truthyValues: ["si", "s?", "x", "1", "true", "positivo"]
    },

    alergia_especifique: { maxWidth: 440, maxLines: 1, pageOffset: 1, x: 111, y: 283.3, maxChars: 100 },

    ha_sido_hospitalizado: {
      type: "mark-select",
      pageOffset: 1,
      size: 10,
      markMap: {
        si: { x: 194.8, y: 267.3 },
        no: { x: 269.2, y: 267.3 }
      }
    },

    hospitalizacion_fecha: { maxWidth: 186, maxLines: 1, pageOffset: 1, x: 346, y: 267.3, maxChars: 44 },
    hospitalizacion_motivo: { maxWidth: 442, maxLines: 1, pageOffset: 1, x: 95, y: 251.3, maxChars: 100 },
    padecimiento_actual_detalle: { maxWidth: 440, maxLines: 1, pageOffset: 1, x: 146, y: 235.3, maxChars: 100 },

    aparato_digestivo: { maxWidth: 392, maxLines: 6, lineHeight: 16, pageOffset: 1, x: 137, y: 147.3, maxChars: 420 },
    aparato_respiratorio: { maxWidth: 372, maxLines: 6, lineHeight: 16, pageOffset: 2, x: 158, y: 660.1, maxChars: 360 },
    aparato_cardiovascular: { maxWidth: 361, maxLines: 6, lineHeight: 16, pageOffset: 2, x: 169, y: 528.1, maxChars: 350 },
    aparato_genitourinario: { maxWidth: 366, maxLines: 6, lineHeight: 16, pageOffset: 2, x: 166, y: 396.1, maxChars: 350 },
    sistema_endocrino_f1: { maxWidth: 383, maxLines: 6, lineHeight: 16, pageOffset: 2, x: 151, y: 264.1, maxChars: 360 },
    sistema_hemopoyetico_f1: { maxWidth: 368, maxLines: 6, lineHeight: 16, pageOffset: 2, x: 166, y: 132.1, maxChars: 350 },
    sistema_nervioso_f1: { maxWidth: 401, maxLines: 5, lineHeight: 16, pageOffset: 3, x: 132, y: 660.1, maxChars: 320 },
    sistema_musculoesqueletico_f1: { maxWidth: 355, maxLines: 5, lineHeight: 16, pageOffset: 3, x: 179, y: 551.1, maxChars: 300 },
    aparato_tegumentario_f1: { maxWidth: 383, maxLines: 5, lineHeight: 16, pageOffset: 3, x: 152, y: 442.1, maxChars: 320 },

    habitus_exterior_f1: { maxWidth: 402, maxLines: 3, lineHeight: 16, pageOffset: 3, x: 130, y: 333.1, maxChars: 160 },
    peso_f1: { maxWidth: 92, maxLines: 1, pageOffset: 3, x: 84, y: 269.1, maxChars: 20 },
    talla_f1: { maxWidth: 110, maxLines: 1, pageOffset: 3, x: 205, y: 269.1, maxChars: 24 },
    complexion_f1: { maxWidth: 147, maxLines: 1, pageOffset: 3, x: 377, y: 269.1, maxChars: 32 },
    frecuencia_cardiaca_f1: { maxWidth: 60, maxLines: 1, pageOffset: 3, x: 210, y: 253.1, maxChars: 16 },
    tension_arterial_f1: { maxWidth: 56, maxLines: 1, pageOffset: 3, x: 339, y: 253.1, maxChars: 16 },
    frecuencia_respiratoria_f1: { maxWidth: 78, maxLines: 1, pageOffset: 3, x: 496, y: 253.1, maxChars: 18 },
    temperatura_f1: { maxWidth: 90, maxLines: 1, pageOffset: 3, x: 183, y: 237.1, maxChars: 24 },

    cabeza_exostosis: { type: "mark-single", pageOffset: 3, x: 173.2, y: 175.1, size: 10, truthyValues: ["si", "s?", "x", "1", "true", "positivo"] },
    cabeza_endostosis: { type: "mark-single", pageOffset: 3, x: 303.5, y: 175.1, size: 10, truthyValues: ["si", "s?", "x", "1", "true", "positivo"] },
    craneo_dolicocefalico: { type: "mark-single", pageOffset: 3, x: 183.2, y: 156.3, size: 10, truthyValues: ["si", "s?", "x", "1", "true", "positivo"] },
    craneo_mesocefalico: { type: "mark-single", pageOffset: 3, x: 312.9, y: 156.3, size: 10, truthyValues: ["si", "s?", "x", "1", "true", "positivo"] },
    craneo_braquicefalico: { type: "mark-single", pageOffset: 3, x: 436.2, y: 156.3, size: 10, truthyValues: ["si", "s?", "x", "1", "true", "positivo"] },
    cara_asimetria_transversal: { type: "mark-single", pageOffset: 3, x: 226.8, y: 137.5, size: 10, truthyValues: ["si", "s?", "x", "1", "true", "positivo"] },
    cara_asimetria_longitudinal: { type: "mark-single", pageOffset: 3, x: 370.8, y: 137.5, size: 10, truthyValues: ["si", "s?", "x", "1", "true", "positivo"] },
    perfil_concavo: { type: "mark-single", pageOffset: 3, x: 155.9, y: 118.7, size: 10, truthyValues: ["si", "s?", "x", "1", "true", "positivo"] },
    perfil_convexo: { type: "mark-single", pageOffset: 3, x: 287.2, y: 118.7, size: 10, truthyValues: ["si", "s?", "x", "1", "true", "positivo"] },
    perfil_recto: { type: "mark-single", pageOffset: 3, x: 391.1, y: 118.7, size: 10, truthyValues: ["si", "s?", "x", "1", "true", "positivo"] },
    piel_normal: { type: "mark-single", pageOffset: 3, x: 150.1, y: 99.9, size: 10, truthyValues: ["si", "s?", "x", "1", "true", "positivo"] },
    piel_palida: { type: "mark-single", pageOffset: 3, x: 277.9, y: 99.9, size: 10, truthyValues: ["si", "s?", "x", "1", "true", "positivo"] },
    piel_cianotica: { type: "mark-single", pageOffset: 3, x: 406.4, y: 99.9, size: 10, truthyValues: ["si", "s?", "x", "1", "true", "positivo"] },
    piel_enrojecida: { type: "mark-single", pageOffset: 3, x: 521.9, y: 99.9, size: 10, truthyValues: ["si", "s?", "x", "1", "true", "positivo"] },
    musculos_hipotonicos: { type: "mark-single", pageOffset: 3, x: 164.6, y: 81.1, size: 10, truthyValues: ["si", "s?", "x", "1", "true", "positivo"] },
    musculos_hipertonicos: { type: "mark-single", pageOffset: 3, x: 299.9, y: 81.1, size: 10, truthyValues: ["si", "s?", "x", "1", "true", "positivo"] },
    musculos_espasticos: { type: "mark-single", pageOffset: 3, x: 410.8, y: 81.1, size: 10, truthyValues: ["si", "s?", "x", "1", "true", "positivo"] },

    cuello_cadena_ganglionar: {
      type: "mark-select",
      pageOffset: 3,
      size: 10,
      markMap: {
        si: { x: 274.6, y: 62.3 },
        no: { x: 347.6, y: 62.3 }
      }
    },

    exploracion_otros: { maxWidth: 450, maxLines: 1, pageOffset: 3, x: 88, y: 46.3, maxChars: 98 },

    atm_ruidos_si_no: {
      type: "mark-select",
      pageOffset: 4,
      size: 10,
      markMap: {
        si: { x: 174.2, y: 592.3 },
        no: { x: 247.4, y: 592.3 }
      }
    },
    atm_lateralidad: { type: "mark-single", pageOffset: 4, x: 363.1, y: 592.3, size: 10, truthyValues: ["si", "s?", "x", "1", "true", "positivo"] },
    atm_apertura: { type: "mark-single", pageOffset: 4, x: 484.3, y: 592.3, size: 10, truthyValues: ["si", "s?", "x", "1", "true", "positivo"] },
    atm_chasquidos_si_no: { type: "mark-select", pageOffset: 4, size: 10, markMap: { si: { x: 363.1, y: 573.3 }, no: { x: 484.3, y: 573.3 } } },
    atm_crepitacion_si_no: { type: "mark-select", pageOffset: 4, size: 10, markMap: { si: { x: 363.1, y: 554.3 }, no: { x: 484.3, y: 554.3 } } },
    atm_dificultad_apertura_si_no: { type: "mark-select", pageOffset: 4, size: 10, markMap: { si: { x: 363.1, y: 535.3 }, no: { x: 484.3, y: 535.3 } } },
    atm_dolor_movimientos_si_no: { type: "mark-select", pageOffset: 4, size: 10, markMap: { si: { x: 363.1, y: 516.3 }, no: { x: 484.3, y: 516.3 } } },
    atm_fatiga_muscular_si_no: { type: "mark-select", pageOffset: 4, size: 10, markMap: { si: { x: 363.1, y: 497.3 }, no: { x: 484.3, y: 497.3 } } },
    atm_disminucion_abertura_si_no: { type: "mark-select", pageOffset: 4, size: 10, markMap: { si: { x: 363.1, y: 478.3 }, no: { x: 484.3, y: 478.3 } } },
    atm_desviacion_abertura_si_no: { type: "mark-select", pageOffset: 4, size: 10, markMap: { si: { x: 363.1, y: 459.3 }, no: { x: 484.3, y: 459.3 } } },

    tejidos_ganglios: { maxWidth: 420, maxLines: 1, pageOffset: 4, x: 112, y: 387.3, maxChars: 96 },
    tejidos_glandulas_salivales: { maxWidth: 378, maxLines: 1, pageOffset: 4, x: 154, y: 371.3, maxChars: 90 },
    tejidos_labio_externo: { maxWidth: 405, maxLines: 1, pageOffset: 4, x: 128, y: 355.3, maxChars: 96 },
    tejidos_borde_bermellon: { maxWidth: 392, maxLines: 1, pageOffset: 4, x: 141, y: 339.3, maxChars: 92 },
    tejidos_labio_interno: { maxWidth: 407, maxLines: 1, pageOffset: 4, x: 127, y: 323.3, maxChars: 96 },
    tejidos_comisuras: { maxWidth: 416, maxLines: 1, pageOffset: 4, x: 118, y: 307.3, maxChars: 96 },
    tejidos_carrillos: { maxWidth: 424, maxLines: 1, pageOffset: 4, x: 109, y: 291.3, maxChars: 98 },
    tejidos_fondo_saco: { maxWidth: 400, maxLines: 1, pageOffset: 4, x: 133, y: 275.3, maxChars: 95 },
    tejidos_frenillos: { maxWidth: 424, maxLines: 1, pageOffset: 4, x: 109, y: 259.3, maxChars: 98 },
    tejidos_lengua_tercio_medio: { maxWidth: 376, maxLines: 1, pageOffset: 4, x: 156, y: 243.3, maxChars: 88 },
    tejidos_paladar_duro: { maxWidth: 407, maxLines: 1, pageOffset: 4, x: 125, y: 227.3, maxChars: 95 },
    tejidos_paladar_blando: { maxWidth: 398, maxLines: 1, pageOffset: 4, x: 134, y: 211.3, maxChars: 94 },
    tejidos_istmo_bucofaringe: { maxWidth: 382, maxLines: 1, pageOffset: 4, x: 149, y: 195.3, maxChars: 90 },
    tejidos_lengua_dorso: { maxWidth: 405, maxLines: 1, pageOffset: 4, x: 128, y: 179.3, maxChars: 96 },
    tejidos_lengua_bordes: { maxWidth: 400, maxLines: 1, pageOffset: 4, x: 133, y: 163.3, maxChars: 94 },
    tejidos_lengua_ventral: { maxWidth: 400, maxLines: 1, pageOffset: 4, x: 133, y: 147.3, maxChars: 94 },
    tejidos_piso_boca: { maxWidth: 398, maxLines: 1, pageOffset: 4, x: 135, y: 131.3, maxChars: 94 },
    tejidos_dientes: { maxWidth: 428, maxLines: 1, pageOffset: 4, x: 105, y: 115.3, maxChars: 98 },
    tejidos_mucosa_borde_alveolar: { maxWidth: 352, maxLines: 1, pageOffset: 4, x: 181, y: 99.3, maxChars: 80 },
    tejidos_encia: { maxWidth: 438, maxLines: 1, pageOffset: 4, x: 95, y: 83.3, maxChars: 100 },
    tejidos_descripcion: { maxWidth: 404, maxLines: 2, lineHeight: 12, pageOffset: 4, x: 131, y: 57.3, maxChars: 190 },

    periodonto_gingivitis: { maxWidth: 188, maxLines: 1, pageOffset: 5, x: 102, y: 632.1, maxChars: 44 },
    periodonto_periodontitis: { maxWidth: 182, maxLines: 1, pageOffset: 5, x: 352, y: 632.1, maxChars: 42 },
    periodonto_recesion_gingival: { maxWidth: 390, maxLines: 1, pageOffset: 5, x: 134, y: 616.1, maxChars: 90 },
    periodonto_bolsas_detalle: { maxWidth: 390, maxLines: 4, lineHeight: 17, pageOffset: 5, x: 146, y: 568.1, maxChars: 180 },
    periodonto_movilidad_dentaria: { maxWidth: 390, maxLines: 4, lineHeight: 17, pageOffset: 5, x: 137, y: 488.1, maxChars: 180 },
    indice_higiene_bucal_f1: { maxWidth: 96, maxLines: 1, pageOffset: 5, x: 179, y: 384.1, maxChars: 20 },
    indice_placa_actual_f1: { maxWidth: 60, maxLines: 1, pageOffset: 5, x: 317, y: 157.1, maxChars: 12 },

    diagnostico_estomatologico: { maxWidth: 380, maxLines: 2, pageOffset: 8, x: 126, y: 659.6, dx: 0 },
    plan_estomatologico: { maxWidth: 330, maxLines: 3, pageOffset: 8, x: 176, y: 571.6, dx: 0 },
    pronostico_estomatologico: { maxWidth: 330, maxLines: 2, pageOffset: 8, x: 176, y: 523.6, dx: 0 },
    observaciones_f1: { maxWidth: 330, maxLines: 3, pageOffset: 8, x: 176, y: 475.6, dx: 0 }
  },
  "f2-preventiva": {
    riesgo_caries: { matches: ["indice de placa actual"], maxWidth: 120, maxLines: 1, pageOffset: 0, x: 330.9, y: 44.6, maxChars: 18 },
    indice_placa: { matches: ["pastilla", "reveladora"], maxWidth: 110, maxLines: 1, pageOffset: 0, x: 290.1, y: 448.3, maxChars: 18 },
    tecnica_cepillado: { matches: ["tecnica de", "cepillado"], maxWidth: 150, maxLines: 2, pageOffset: 0, x: 137.9, y: 448.3, maxChars: 38 },
    fluorizacion: { matches: ["aplicacion de fluor"], maxWidth: 140, maxLines: 2, pageOffset: 0, x: 152.1, y: 326.7, maxChars: 36 },
    recomendaciones_preventivas: { matches: ["profilaxia u", "odontoxesis"], maxWidth: 140, maxLines: 2, pageOffset: 0, x: 139.0, y: 374.2, maxChars: 36 },
    seguimiento_preventivo: { matches: ["termino"], maxWidth: 70, maxLines: 1, pageOffset: 0, x: 525.6, y: 437.3, maxChars: 10 }
  },
  "f3-operatoria": {
    pieza_operatoria: { matches: ["odontograma"], maxWidth: 120, maxLines: 1, pageOffset: 0, x: 149.0, y: 338.9, maxChars: 20 },
    diagnostico_operatorio: { matches: ["odontograma de evolucion"], maxWidth: 220, maxLines: 2, pageOffset: 1, x: 210.8, y: 361.2, maxChars: 58 },
    material_restaurador: { matches: ["tratamientos realizados"], maxWidth: 220, maxLines: 1, pageOffset: 2, x: 194.7, y: 660.2, maxChars: 44 },
    tecnica_operatoria: { matches: ["tratamientos realizados"], maxWidth: 220, maxLines: 2, pageOffset: 2, x: 194.7, y: 614.2, maxChars: 56 },
    control_operatorio: { matches: ["nombre y firma de conformidad"], maxWidth: 160, maxLines: 2, pageOffset: 2, x: 422.1, y: 245.2, maxChars: 34 },
    pronostico_operatorio: { matches: ["fecha"], maxWidth: 120, maxLines: 1, pageOffset: 2, x: 101.7, y: 352.2, maxChars: 18 }
  },
  "f4-protesis-fija": {
    motivo_protesis_fija: { matches: ["evaluacion clinica"], maxWidth: 220, maxLines: 3, pageOffset: 0, x: 172.0, y: 399.1, maxChars: 62 },
    pilares_protesis: { matches: ["dientes pilares"], maxWidth: 180, maxLines: 2, pageOffset: 1, x: 127.4, y: 444.1, maxChars: 32 },
    diagnostico_protesis_fija: { matches: ["interpretacion radiografica"], maxWidth: 220, maxLines: 3, pageOffset: 0, x: 372.6, y: 157.1, maxChars: 62 },
    plan_protesis_fija: { matches: ["plan de tratamiento"], maxWidth: 220, maxLines: 3, pageOffset: 1, x: 163.7, y: 660.1, maxChars: 62 },
    pruebas_protesis_fija: { matches: ["procedimiento"], maxWidth: 210, maxLines: 3, pageOffset: 1, x: 156.6, y: 634.1, maxChars: 58 },
    observaciones_protesis_fija: { matches: ["diseno de la restauracion protesica"], maxWidth: 210, maxLines: 2, pageOffset: 1, x: 239.7, y: 470.1, maxChars: 50 }
  },
  "f5-protesis-removible": {
    clasificacion_kennedy: { matches: ["clasificacion de kennedy"], maxWidth: 170, maxLines: 1, pageOffset: 0, x: 174.3, y: 57.8, maxChars: 30 },
    zona_desdentada: { matches: ["area desdentada", "region desdentada"], maxWidth: 220, maxLines: 2, pageOffset: 1, x: 136.0, y: 660.0, maxChars: 56 },
    diseno_protesis_removible: { matches: ["diseno de la restauracion protesica"], maxWidth: 220, maxLines: 2, pageOffset: 0, x: 248.0, y: 83.8, maxChars: 56 },
    elementos_retencion: { matches: ["tipos de ganchos", "retencion"], maxWidth: 220, maxLines: 3, pageOffset: 1, x: 269.2, y: 612.0, maxChars: 62 },
    indicaciones_protesis_removible: { matches: ["entrega de protesis e indicaciones"], maxWidth: 220, maxLines: 2, pageOffset: 1, x: 205.5, y: 390.0, maxChars: 56 },
    pronostico_protesis_removible: { matches: ["plan de tratamiento"], maxWidth: 220, maxLines: 2, pageOffset: 1, x: 164.7, y: 538.0, maxChars: 42 }
  },
  "f6-prostodoncia": {
    estado_reborde: { matches: ["estado del reborde alveolar"], maxWidth: 220, maxLines: 2, pageOffset: 0, x: 185.8, y: 293.1, maxChars: 52 },
    dimension_vertical: { matches: ["base de registro y prueba de rodillos"], maxWidth: 220, maxLines: 2, pageOffset: 0, x: 223.3, y: 135.1, maxChars: 52 },
    plan_prostodoncia: { matches: ["plan de tratamiento"], maxWidth: 220, maxLines: 3, pageOffset: 0, x: 172.1, y: 219.1, maxChars: 62 },
    pruebas_prostodoncia: { matches: ["prueba de dientes y oclusion"], maxWidth: 220, maxLines: 2, pageOffset: 0, x: 190.1, y: 119.1, maxChars: 50 },
    adaptacion_prostodoncia: { matches: ["modelos de trabajo"], maxWidth: 220, maxLines: 2, pageOffset: 0, x: 152.6, y: 151.1, maxChars: 50 },
    pronostico_prostodoncia: { matches: ["terminado"], maxWidth: 200, maxLines: 2, pageOffset: 0, x: 118.2, y: 103.1, maxChars: 40 }
  },
  "f7-cirugia-bucal": {
    motivo_cirugia: { matches: ["padecimiento actual"], maxWidth: 220, maxLines: 3, pageOffset: 0, x: 156.3, y: 362.1, maxChars: 58 },
    diagnostico_cirugia: { matches: ["diagnostico"], maxWidth: 220, maxLines: 3, pageOffset: 1, x: 114.5, y: 563.9, maxChars: 58 },
    procedimiento_cirugia: { matches: ["plan de tratamiento"], maxWidth: 220, maxLines: 3, pageOffset: 1, x: 146.7, y: 515.9, maxChars: 58 },
    medicacion_cirugia: { matches: ["alergias a medicamentos o anestesicos"], maxWidth: 220, maxLines: 2, pageOffset: 0, x: 233.4, y: 394.1, maxChars: 52 },
    cuidados_posoperatorios: { matches: ["indicaciones posquirurgicas"], maxWidth: 220, maxLines: 2, pageOffset: 1, x: 180.0, y: 259.9, maxChars: 52 },
    pronostico_cirugia: { matches: ["pronostico"], maxWidth: 210, maxLines: 2, pageOffset: 1, x: 110.4, y: 531.9, maxChars: 42 }
  },
  "f8-periodoncia": {
    diagnostico_periodontal: { matches: ["periodontograma de diagnostico"], maxWidth: 220, maxLines: 2, pageOffset: 2, x: 251.4, y: 658.6, maxChars: 52 },
    profundidad_bolsas: { matches: ["antecedentes personales patologicos"], maxWidth: 220, maxLines: 2, pageOffset: 1, x: 265.5, y: 658.6, maxChars: 52 },
    sangrado_periodontal: { matches: ["padecimiento actual"], maxWidth: 220, maxLines: 2, pageOffset: 1, x: 147.6, y: 540.6, maxChars: 52 },
    plan_periodontal: { matches: ["exploracion bucal"], maxWidth: 220, maxLines: 2, pageOffset: 1, x: 162.3, y: 178.6, maxChars: 52 },
    fase_mantenimiento: { matches: ["antecedentes personales no patologicos"], maxWidth: 220, maxLines: 2, pageOffset: 0, x: 290.0, y: 166.1, maxChars: 52 },
    pronostico_periodontal: { matches: ["medicamentos que utiliza actualmente"], maxWidth: 220, maxLines: 2, pageOffset: 1, x: 220.6, y: 300.6, maxChars: 42 }
  },
  "f9-endodoncia": {
    pieza_endodoncia: { matches: ["dientes que ha de tratarse"], maxWidth: 180, maxLines: 1, pageOffset: 0, x: 187.8, y: 405.5, maxChars: 30 },
    diagnostico_pulpar: { matches: ["diagnostico pulpar"], maxWidth: 220, maxLines: 2, pageOffset: 2, x: 156.4, y: 655.7, maxChars: 52 },
    pruebas_endodoncia: { matches: ["pruebas de sensibilidad pulpar"], maxWidth: 220, maxLines: 2, pageOffset: 1, x: 231.3, y: 658.6, maxChars: 52 },
    tecnica_endodoncia: { matches: ["tratamiento"], maxWidth: 220, maxLines: 2, pageOffset: 2, x: 368.5, y: 655.7, maxChars: 52 },
    control_endodoncia: { matches: ["interpretacion radiografica"], maxWidth: 220, maxLines: 2, pageOffset: 1, x: 211.2, y: 236.8, maxChars: 52 },
    pronostico_endodoncia: { matches: ["diagnostico periapical"], maxWidth: 220, maxLines: 2, pageOffset: 2, x: 170.1, y: 511.7, maxChars: 42 }
  },
  "f10-ortodoncia": {
    analisis_facial: { matches: ["motivo de la consulta"], maxWidth: 220, maxLines: 2, pageOffset: 0, x: 160.2, y: 319.1, maxChars: 52 },
    diagnostico_oclusal: { matches: ["padecimiento actual"], maxWidth: 220, maxLines: 2, pageOffset: 0, x: 156.1, y: 287.1, maxChars: 52 },
    objetivo_ortodoncia: { matches: ["ultimo examen dental"], maxWidth: 220, maxLines: 2, pageOffset: 0, x: 162.2, y: 223.1, maxChars: 52 },
    plan_ortodontico: { matches: ["antecedentes patologicos"], maxWidth: 220, maxLines: 2, pageOffset: 1, x: 204.6, y: 585.9, maxChars: 52 },
    seguimiento_ortodoncia: { matches: ["antecedentes no patologicos"], maxWidth: 220, maxLines: 2, pageOffset: 2, x: 232.1, y: 658.6, maxChars: 52 },
    pronostico_ortodoncia: { matches: ["examen de la cavidad bucal"], maxWidth: 220, maxLines: 2, pageOffset: 2, x: 225.1, y: 344.6, maxChars: 42 }
  },
  "f11-odontopediatria": {
    responsable_nino: { matches: ["antecedentes hereditarios y familiares"], maxWidth: 220, maxLines: 2, pageOffset: 0, x: 281.5, y: 163.6, maxChars: 46 },
    conducta_paciente_pediatrico: { matches: ["antecedentes personales no patologicos"], maxWidth: 220, maxLines: 2, pageOffset: 1, x: 282.2, y: 208.6, maxChars: 52 },
    diagnostico_odontopediatria: { matches: ["padecimiento actual"], maxWidth: 220, maxLines: 2, pageOffset: 2, x: 186.0, y: 658.6, maxChars: 52 },
    plan_odontopediatria: { matches: ["interrogatorio por aparatos y sistemas"], maxWidth: 220, maxLines: 2, pageOffset: 2, x: 280.5, y: 508.6, maxChars: 52 },
    indicaciones_tutor: { matches: ["antecedentes alergicos"], maxWidth: 220, maxLines: 2, pageOffset: 2, x: 170.9, y: 586.6, maxChars: 52 },
    pronostico_odontopediatria: { matches: ["sistema endocrino"], maxWidth: 220, maxLines: 2, pageOffset: 2, x: 151.4, y: 116.6, maxChars: 42 }
  }
};

