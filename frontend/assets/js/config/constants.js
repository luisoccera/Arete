"use strict";

const STORAGE_KEY = "arete_data_v1";
const AUTH_TOKEN_KEY = "arete_auth_token_v1";
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

const ODONTO_TOOTH_PARTS = [
  { id: "top", label: "Vestibular" },
  { id: "right", label: "Proximal derecha" },
  { id: "bottom", label: "Palatina / lingual" },
  { id: "left", label: "Proximal izquierda" },
  { id: "center", label: "Oclusal" },
  { id: "root", label: "Raiz / raices" }
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

const OPERATORIA_TREATMENT_TEETH = [
  18, 17, 16, 15, 14, 13, 12, 11,
  28, 27, 26, 25, 24, 23, 22, 21,
  48, 47, 46, 45, 44, 43, 42, 41,
  38, 37, 36, 35, 34, 33, 32, 31
];

const CLINICAL_FORM_SCHEMAS = {
  "f1-estomatologica": {
    title: "Formato 1: Historia clinica estomatologica",
    fields: [
      { id: "motivo_consulta", label: "Padecimiento actual - continuacion", section: "Interrogatorio", type: "textarea", rows: 2, contextKey: "consultReason", placeholder: "Informacion adicional del padecimiento actual." },
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
      { id: "adiccion_tabaco", label: "Consumo de tabaco", section: "Antecedentes personales no patologicos", type: "select", options: YES_NO_OPTIONS },
      { id: "adiccion_alcohol", label: "Consumo de alcohol", section: "Antecedentes personales no patologicos", type: "select", options: YES_NO_OPTIONS, uiHidden: true },
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
      { id: "plan_estomatologico", label: "Plan de tratamiento - Odontologia preventiva", section: "Plan por especialidad", type: "textarea", rows: 3, contextKey: "treatmentPlan", placeholder: "Tratamiento preventivo propuesto." },
      { id: "pronostico_estomatologico", label: "Plan de tratamiento - Periodoncia", section: "Plan por especialidad", type: "textarea", rows: 3, placeholder: "Tratamiento periodontal propuesto." },
      { id: "observaciones_f1", label: "Plan de tratamiento - Endodoncia", section: "Plan por especialidad", type: "textarea", rows: 3, placeholder: "Tratamiento endodontico propuesto." },
      { id: "plan_operatoria_f1", label: "Plan de tratamiento - Operatoria", section: "Plan por especialidad", type: "textarea", rows: 3, placeholder: "Tratamiento de operatoria propuesto." },
      { id: "plan_cirugia_f1", label: "Plan de tratamiento - Cirugia", section: "Plan por especialidad", type: "textarea", rows: 3, placeholder: "Tratamiento quirurgico propuesto." },
      { id: "plan_protesis_f1", label: "Plan de tratamiento - Protesis", section: "Plan por especialidad", type: "textarea", rows: 3, placeholder: "Tratamiento protesico propuesto." }
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
      ...OPERATORIA_TREATMENT_TEETH.map((tooth) => ({
        id: `tratamiento_operatoria_${tooth}`,
        label: `Tratamiento realizado - pieza ${tooth}`,
        section: "Tratamientos realizados por pieza",
        type: "text",
        placeholder: `Tratamiento realizado en la pieza ${tooth}.`
      })),
      { id: "fecha_tratamiento_op", label: "Fecha", section: "Tratamientos realizados", type: "text", placeholder: "Fecha de tratamiento." },
      { id: "control_operatorio", label: "Nombre de conformidad sobre los tratamientos realizados", section: "Tratamientos realizados", type: "text", placeholder: "Nombre del paciente para conformidad." }
    ]
  },
  "f4-protesis-fija": {
    title: "Formato 4: Protesis fija",
    fields: [
      { id: "dientes_ausentes_f4", label: "Dientes ausentes", section: "Evaluacion inicial", type: "text", placeholder: "Piezas ausentes." },
      { id: "protesis_fija_previa_f4", label: "Protesis fija previa", section: "Evaluacion inicial", type: "text", placeholder: "Describir protesis previa." },
      { id: "protesis_removible_previa_f4", label: "Protesis removible previa", section: "Evaluacion inicial", type: "text", placeholder: "Describir protesis removible previa." },
      { id: "relacion_corona_raiz_f4", label: "Relacion corona-raiz de pilares", section: "Evaluacion inicial", type: "text", placeholder: "Descripcion clinica." },
      { id: "soporte_oseo_f4", label: "Soporte oseo", section: "Evaluacion inicial", type: "text", placeholder: "Estado del soporte oseo." },
      { id: "estado_periodontal_pilares_f4", label: "Estado periodontal de pilares", section: "Evaluacion inicial", type: "text", placeholder: "Estado periodontal." },
      { id: "diagnostico_protesis_fija", label: "Interpretacion radiografica de la zona", section: "Evaluacion inicial", type: "textarea", rows: 2, contextKey: "diagnosis", placeholder: "Interpretacion radiografica." },

      { id: "modelos_estudio_f4", label: "Modelos de estudio", section: "Procedimientos", type: "text", placeholder: "Registro de modelos." },
      { id: "presentacion_provisionales_f4", label: "Presentacion de provisionales", section: "Procedimientos", type: "text", placeholder: "Cita/procedimiento." },
      { id: "preparacion_pilares_f4", label: "Preparacion de dientes pilares", section: "Procedimientos", type: "text", placeholder: "Detalle de preparacion." },
      { id: "colocacion_provisionales_f4", label: "Colocacion de provisionales", section: "Procedimientos", type: "text", placeholder: "Detalle de colocacion." },
      { id: "impresiones_f4", label: "Impresiones", section: "Procedimientos", type: "text", placeholder: "Tipo de impresion." },
      { id: "prueba_metales_f4", label: "Prueba de metales", section: "Procedimientos", type: "text", placeholder: "Resultados de prueba." },
      { id: "prueba_porcelana_f4", label: "Prueba de porcelana", section: "Procedimientos", type: "text", placeholder: "Resultados de prueba." },
      { id: "terminado_f4", label: "Terminado", section: "Procedimientos", type: "text", placeholder: "Fecha y resultado final." },

      { id: "observaciones_protesis_fija", label: "Diseno de la restauracion protesica", section: "Diseno y cierre", type: "textarea", rows: 2, placeholder: "Descripcion del diseno protesico." },
      { id: "pilares_protesis", label: "Dientes pilares", section: "Diseno y cierre", type: "text", contextKey: "odontoSummary", placeholder: "Piezas pilares." },
      { id: "ponticos_f4", label: "Ponticos", section: "Diseno y cierre", type: "text", placeholder: "Descripcion de ponticos." },
      { id: "restauraciones_individuales_f4", label: "Restauraciones individuales", section: "Diseno y cierre", type: "text", placeholder: "Detalle individual." }
    ]
  },
  "f5-protesis-removible": {
    title: "Formato 5: Protesis removible",
    fields: [
      { id: "dientes_ausentes_f5", label: "Dientes ausentes", section: "Evaluacion inicial", type: "text", placeholder: "Piezas ausentes." },
      { id: "protesis_fija_f5", label: "Protesis fija", section: "Evaluacion inicial", type: "text", placeholder: "Protesis fija existente." },
      { id: "protesis_removible_f5", label: "Protesis removible", section: "Evaluacion inicial", type: "text", placeholder: "Protesis removible existente." },
      { id: "relacion_corona_raiz_f5", label: "Relacion corona-raiz de pilares", section: "Evaluacion inicial", type: "text", placeholder: "Relacion corona-raiz." },
      { id: "soporte_oseo_f5", label: "Soporte oseo", section: "Evaluacion inicial", type: "text", placeholder: "Soporte oseo disponible." },
      { id: "estado_periodontal_area_f5", label: "Estado periodontal del area", section: "Evaluacion inicial", type: "text", placeholder: "Estado periodontal." },
      { id: "interpretacion_radiografica_f5", label: "Interpretacion radiografica", section: "Evaluacion inicial", type: "textarea", rows: 2, contextKey: "diagnosis", placeholder: "Interpretacion de radiografias." },

      { id: "clasificacion_kennedy", label: "Clasificacion de Kennedy", section: "Diseno protesico", type: "text", contextKey: "diagnosis", placeholder: "Clase I, II, III o IV." },
      { id: "pilares_f5", label: "Dientes pilares", section: "Diseno protesico", type: "text", contextKey: "odontoSummary", placeholder: "Piezas pilares." },
      { id: "zona_desdentada", label: "Area desdentada", section: "Diseno protesico", type: "textarea", rows: 2, contextKey: "odontoSummary", placeholder: "Describe zonas a rehabilitar." },
      { id: "diseno_protesis_removible", label: "Tipo de conector mayor", section: "Diseno protesico", type: "text", placeholder: "Conector mayor indicado." },
      { id: "conector_menor_f5", label: "Tipo de conector menor", section: "Diseno protesico", type: "text", placeholder: "Conector menor indicado." },
      { id: "elementos_retencion", label: "Tipos de ganchos y ubicacion", section: "Diseno protesico", type: "textarea", rows: 2, contextKey: "background", placeholder: "Elementos de retencion y soporte." },

      { id: "presentacion_caso_f5", label: "Presentacion del caso", section: "Procedimientos", type: "text", placeholder: "Fecha/procedimiento." },
      { id: "preparaciones_f5", label: "Preparaciones", section: "Procedimientos", type: "text", placeholder: "Detalle de preparaciones." },
      { id: "impresion_f5", label: "Impresion", section: "Procedimientos", type: "text", placeholder: "Tipo de impresion." },
      { id: "prueba_metales_f5", label: "Prueba de metales", section: "Procedimientos", type: "text", placeholder: "Resultado de prueba." },
      { id: "prueba_rodillos_f5", label: "Prueba de rodillos", section: "Procedimientos", type: "text", placeholder: "Resultado de prueba." },
      { id: "prueba_oclusion_f5", label: "Prueba de oclusion", section: "Procedimientos", type: "text", placeholder: "Resultado de oclusion." },
      { id: "indicaciones_protesis_removible", label: "Entrega de protesis e indicaciones", section: "Procedimientos", type: "textarea", rows: 2, contextKey: "notes", placeholder: "Indicaciones al paciente." },
      { id: "revision_1_f5", label: "Primera revision", section: "Procedimientos", type: "text", placeholder: "Fecha y hallazgos." },
      { id: "revision_2_f5", label: "Segunda revision", section: "Procedimientos", type: "text", placeholder: "Fecha y hallazgos." },
      { id: "revision_3_f5", label: "Tercera revision", section: "Procedimientos", type: "text", placeholder: "Fecha y hallazgos." }
    ]
  },
  "f6-prostodoncia": {
    title: "Formato 6: Prostodoncia total/parcial",
    fields: [
      { id: "interpretacion_radiografica_f6", label: "Interpretacion radiografica", section: "Evaluacion inicial", type: "textarea", rows: 2, contextKey: "diagnosis", placeholder: "Interpretacion radiografica." },
      { id: "estado_reborde", label: "Estado del reborde alveolar", section: "Evaluacion inicial", type: "textarea", rows: 2, contextKey: "diagnosis", placeholder: "Reborde favorable, reabsorbido, etc." },
      { id: "modelos_estudio_f6", label: "Modelos de estudio", section: "Procedimiento principal", type: "text", placeholder: "Registro de modelos de estudio." },
      { id: "modelos_trabajo_f6", label: "Modelos de trabajo", section: "Procedimiento principal", type: "text", placeholder: "Registro de modelos de trabajo." },
      { id: "dimension_vertical", label: "Base de registro y prueba de rodillos", section: "Procedimiento principal", type: "textarea", rows: 2, contextKey: "background", placeholder: "Relacion maxilomandibular y rodillos." },
      { id: "pruebas_prostodoncia", label: "Prueba de dientes y oclusion", section: "Procedimiento principal", type: "textarea", rows: 2, contextKey: "notes", placeholder: "Resultados de pruebas clinicas." },
      { id: "adaptacion_prostodoncia", label: "Terminado", section: "Procedimiento principal", type: "text", placeholder: "Fecha y resultado del terminado." },
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
      { id: "antecedentes_hereditarios_f8", label: "Antecedente hereditario - Diabetes", section: "Antecedentes hereditarios", type: "text", placeholder: "Familiar y detalle del antecedente." },
      { id: "antecedentes_cancer_f8", label: "Antecedente hereditario - Cancer", section: "Antecedentes hereditarios", type: "text", placeholder: "Familiar y detalle del antecedente." },
      { id: "antecedentes_tension_f8", label: "Antecedente hereditario - Hipertension o hipotension", section: "Antecedentes hereditarios", type: "text", placeholder: "Familiar y detalle del antecedente." },
      { id: "antecedentes_infarto_f8", label: "Antecedente hereditario - Infarto del miocardio", section: "Antecedentes hereditarios", type: "text", placeholder: "Familiar y detalle del antecedente." },
      { id: "antecedentes_infectocontagiosas_f8", label: "Antecedente hereditario - Enfermedades infectocontagiosas", section: "Antecedentes hereditarios", type: "text", placeholder: "Familiar y detalle del antecedente." },
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
      { id: "plan_periodontal", label: "Plan periodontal", section: "Diagnostico periodontal", type: "textarea", rows: 2, contextKey: "treatmentPlan", placeholder: "Raspado, alisado, control de placa, etc." },
      { id: "pronostico_periodontal", label: "Pronostico", section: "Diagnostico periodontal", type: "text", contextKey: "prognosis", placeholder: "Pronostico periodontal por caso." },
      { id: "periodontograma_diagnostico_f8", label: "Periodontograma de diagnostico", section: "Periodontogramas", type: "textarea", rows: 2, placeholder: "Resumen del periodontograma diagnostico." },
      { id: "periodontograma_evolucion_f8", label: "Periodontograma de evolucion", section: "Periodontogramas", type: "textarea", rows: 2, placeholder: "Resumen del periodontograma de evolucion." },
      { id: "auxiliares_diagnostico_f8", label: "Auxiliar de diagnostico - Radiografias", section: "Auxiliares y cierre", type: "text", placeholder: "Estudios radiograficos solicitados o revisados." },
      { id: "auxiliares_modelos_f8", label: "Auxiliar de diagnostico - Modelos de estudio", section: "Auxiliares y cierre", type: "text", placeholder: "Modelos de estudio." },
      { id: "auxiliares_fotografias_f8", label: "Auxiliar de diagnostico - Fotografias", section: "Auxiliares y cierre", type: "text", placeholder: "Fotografias clinicas." },
      { id: "auxiliares_laboratorio_f8", label: "Auxiliar de diagnostico - Estudios de laboratorio", section: "Auxiliares y cierre", type: "text", placeholder: "Estudios de laboratorio." },
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
      { id: "antecedentes_f9", label: "Antecedentes - Otros", section: "Antecedentes", type: "text", contextKey: "background", placeholder: "Otros antecedentes no listados." },
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
      { id: "alergias_medicamentos_ortodoncia", label: "Alergia a antibioticos - cuales", section: "Antecedentes medicos", type: "text", placeholder: "Antibioticos que provocan alergia." },
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
      { id: "desarrollo_lenguaje_ortodoncia", label: "Balbuceo", section: "Desarrollo del lenguaje", type: "text", placeholder: "Edad o comentario sobre balbuceo." },
      { id: "primeras_palabras_ortodoncia", label: "Primeras palabras", section: "Desarrollo del lenguaje", type: "text", placeholder: "Edad de las primeras palabras." },
      { id: "lenguaje_estructurado_ortodoncia", label: "Lenguaje estructurado", section: "Desarrollo del lenguaje", type: "text", placeholder: "Edad o comentario." },
      { id: "erupcion_control_esfinteres_ortodoncia", label: "Erupcion dentaria y control de esfinteres", section: "Antecedentes no patologicos", type: "text", placeholder: "Evolucion y edad de erupcion/controles." },
      { id: "genitourinario_enuresis_ortodoncia", label: "Enuresis", section: "Antecedentes no patologicos", type: "select", options: [
        { value: "", label: "Seleccionar" },
        { value: "Primaria", label: "Primaria" },
        { value: "Secundaria", label: "Secundaria" }
      ] },
      { id: "menarca_ortodoncia", label: "Menarca", section: "Antecedentes no patologicos", type: "text", placeholder: "Edad o fecha." },

      { id: "diagnostico_oclusal", label: "Diagnostico final - Interpretacion", section: "Analisis ortodontico", type: "textarea", rows: 2, contextKey: "diagnosis", placeholder: "Interpretacion diagnostica final." },
      { id: "analisis_facial", label: "Asimetrias craneales - Especifique", section: "Analisis ortodontico", type: "textarea", rows: 2, placeholder: "Detalle de las asimetrias craneales." },
      { id: "plan_ortodontico", label: "Plan ortodontico", section: "Analisis ortodontico", type: "textarea", rows: 2, contextKey: "treatmentPlan", placeholder: "Tipo de aparatologia y fases." },
      { id: "seguimiento_ortodoncia", label: "Procedimiento realizado en cita", section: "Analisis ortodontico", type: "textarea", rows: 2, contextKey: "notes", placeholder: "Procedimiento realizado en la cita." },
      { id: "pronostico_ortodoncia", label: "Pronostico", section: "Analisis ortodontico", type: "text", contextKey: "prognosis", placeholder: "Pronostico del tratamiento ortodontico." },
      { id: "objetivo_ortodoncia", label: "Objetivos del tratamiento", section: "Analisis ortodontico", type: "textarea", rows: 2, contextKey: "consultReason", placeholder: "Objetivos funcionales y esteticos." },
      { id: "auxiliares_diagnostico_ortodoncia", label: "Otros habitos - Especifique", section: "Antecedentes no patologicos", type: "textarea", rows: 2, placeholder: "Otros habitos no listados." },
      { id: "odontograma_ortodontico", label: "Odontograma ortodontico", section: "Analisis ortodontico", type: "textarea", rows: 2, placeholder: "Resumen de hallazgos en odontograma." },
      { id: "citas_complementarias_ortodoncia", label: "Citas complementarias y correcciones", section: "Analisis ortodontico", type: "textarea", rows: 2, placeholder: "Detalle de citas complementarias." },
      { id: "observaciones_ortodoncia", label: "Observaciones", section: "Analisis ortodontico", type: "textarea", rows: 2, placeholder: "Observaciones finales del formato." }
    ]
  },
  "f11-odontopediatria": {
    title: "Formato 11: Odontopediatria",
    fields: [
      { id: "ultima_consulta_pediatrica", label: "Fecha y motivo de la ultima consulta medica u odontologica", section: "Interrogatorio pediatrico", type: "text", placeholder: "Fecha y motivo de ultima consulta." },
      { id: "derechohabiencia_pediatria", label: "Derechohabiente / no derechohabiente", section: "Interrogatorio pediatrico", type: "text", placeholder: "Especificar condicion." },
      { id: "medico_pediatra_familiar", label: "Nombre del medico pediatra familiar", section: "Interrogatorio pediatrico", type: "text", placeholder: "Nombre del medico pediatra." },
      { id: "telefono_medico_pediatra", label: "Telefono del medico pediatra", section: "Interrogatorio pediatrico", type: "text", placeholder: "Telefono de contacto." },

      { id: "hereditarios_madre_f11", label: "Padecimientos familiares - Madre", section: "Antecedentes hereditarios y familiares", type: "text", placeholder: "Anotar antecedentes en linea directa." },
      { id: "hereditarios_padre_f11", label: "Padecimientos familiares - Padre", section: "Antecedentes hereditarios y familiares", type: "text", placeholder: "Anotar antecedentes en linea directa." },
      { id: "hereditarios_hermanos_f11", label: "Padecimientos familiares - Hermanos", section: "Antecedentes hereditarios y familiares", type: "text", placeholder: "Anotar antecedentes en linea directa." },
      { id: "hereditarios_tios_f11", label: "Padecimientos familiares - Tios", section: "Antecedentes hereditarios y familiares", type: "text", placeholder: "Anotar antecedentes en linea directa." },
      { id: "hereditarios_abuelos_f11", label: "Padecimientos familiares - Abuelos", section: "Antecedentes hereditarios y familiares", type: "text", placeholder: "Anotar antecedentes en linea directa." },

      { id: "patologicos_pediatria", label: "Antecedentes personales patologicos - Otras enfermedades", section: "Antecedentes personales", type: "text", contextKey: "background", placeholder: "Otras enfermedades no listadas." },
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
      { id: "antecedentes_alergicos_f11", label: "Antecedentes alergicos - Especifique", section: "Interrogatorio por aparatos y sistemas", type: "text", contextKey: "allergies", placeholder: "Especifique las alergias." },
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
      { id: "peso_f11", label: "Peso", section: "Exploracion fisica", type: "text", placeholder: "Peso del paciente." },
      { id: "talla_f11", label: "Talla", section: "Exploracion fisica", type: "text", placeholder: "Talla del paciente." },
      { id: "complexion_f11", label: "Complexion", section: "Exploracion fisica", type: "text", placeholder: "Complexion." },
      { id: "frecuencia_cardiaca_f11", label: "Frecuencia cardiaca", section: "Signos vitales", type: "text", placeholder: "FC." },
      { id: "tension_arterial_f11", label: "Tension arterial", section: "Signos vitales", type: "text", placeholder: "TA." },
      { id: "frecuencia_respiratoria_f11", label: "Frecuencia respiratoria", section: "Signos vitales", type: "text", placeholder: "FR." },
      { id: "temperatura_f11", label: "Temperatura", section: "Signos vitales", type: "text", placeholder: "Temperatura." },

      { id: "analisis_oclusion_f11", label: "Analisis de la oclusion", section: "Oclusion y odontograma", type: "textarea", rows: 2, placeholder: "Plano terminal, clase de oclusion, sobremordidas, mordida cruzada." },
      { id: "indice_higiene_f11", label: "Indice de higiene bucal", section: "Oclusion y odontograma", type: "text", placeholder: "Resultado de indice de higiene." },
      { id: "indice_placa_actual_f11", label: "Indice de placa actual", section: "Oclusion y odontograma", type: "text", placeholder: "Resultado de indice de placa." },
      { id: "diagnostico_odontopediatria", label: "Odontograma diagnostico", section: "Oclusion y odontograma", type: "textarea", rows: 2, contextKey: "diagnosis", placeholder: "Hallazgos clinicos de denticion temporal/mixta." },
      { id: "plan_odonto_preventiva_f11", label: "Plan - Odontologia preventiva", section: "Plan de tratamiento", type: "textarea", rows: 3, contextKey: "treatmentPlan", placeholder: "Tratamiento preventivo." },
      { id: "plan_operatoria_f11", label: "Plan - Operatoria", section: "Plan de tratamiento", type: "textarea", rows: 3, placeholder: "Tratamiento de operatoria." },
      { id: "plan_cirugia_f11", label: "Plan - Cirugia", section: "Plan de tratamiento", type: "textarea", rows: 3, placeholder: "Tratamiento quirurgico." },
      { id: "plan_ortodoncia_preventiva_f11", label: "Plan - Ortodoncia preventiva", section: "Plan de tratamiento", type: "textarea", rows: 3, placeholder: "Tratamiento preventivo de ortodoncia." },
      { id: "plan_ortodoncia_interceptiva_f11", label: "Plan - Ortodoncia interceptiva", section: "Plan de tratamiento", type: "textarea", rows: 3, placeholder: "Tratamiento interceptivo." },
      { id: "plan_ortodoncia_correctiva_f11", label: "Plan - Ortodoncia correctiva", section: "Plan de tratamiento", type: "textarea", rows: 3, placeholder: "Tratamiento correctivo." },
      { id: "plan_tratamientos_pulpares_f11", label: "Plan - Tratamientos pulpares", section: "Plan de tratamiento", type: "textarea", rows: 3, placeholder: "Tratamientos pulpares." },
      { id: "indicaciones_tutor", label: "Restauraciones con coronas de acero, cromo u otras", section: "Plan de tratamiento", type: "textarea", rows: 3, placeholder: "Piezas y tipo de restauracion." },
      { id: "odontograma_evolucion_f11", label: "Odontograma de evolucion", section: "Oclusion y odontograma", type: "textarea", rows: 2, placeholder: "Cambios del odontograma en controles." },
      { id: "interpretacion_radiografica_f11", label: "Interpretacion radiografica", section: "Estudios y cierre", type: "textarea", rows: 2, placeholder: "Interpretacion de radiografias." },
      { id: "estudios_laboratorio_f11", label: "Estudios de laboratorio y gabinete", section: "Estudios y cierre", type: "textarea", rows: 2, placeholder: "Resultados de laboratorio y gabinete." }
    ]
  }
};

const ODONTOGRAM_TEMPLATES = {
  anatomic: {
    label: "Periodontograma dental con raices",
    centerSuffix: "periodontal",
    hint: "Corona y raiz se marcan por separado; la superficie oclusal aparece solo en premolares y molares."
  },
  grid: {
    label: "Periodontograma por superficies",
    centerSuffix: "periodontograma",
    hint: "Incisivos y caninos tienen cuatro superficies; la quinta zona oclusal aparece solo en premolares y molares."
  },
  classic: {
    label: "Odontograma clinico por superficies",
    centerSuffix: "clinico",
    hint: "Mapeo dentro de la corona: cuatro zonas en anteriores y cinco, incluida oclusal, en posteriores."
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

const CLINICAL_FORMAT_END_PAGES = {
  "f1-estomatologica": 11,
  "f2-preventiva": 15,
  "f3-operatoria": 19,
  "f4-protesis-fija": 22,
  "f5-protesis-removible": 24,
  "f6-prostodoncia": 26,
  "f7-cirugia-bucal": 29,
  "f8-periodoncia": 36,
  "f9-endodoncia": 40,
  "f10-ortodoncia": 52,
  "f11-odontopediatria": 62
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
  "f1-estomatologica"
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

const clinicalPdfLine = (pageOffset, x, y, maxWidth, maxChars = 72, extra = {}) => ({
  pageOffset,
  x,
  y,
  maxWidth,
  maxLines: 1,
  maxChars,
  ...extra
});

const clinicalPdfArea = (
  pageOffset,
  x,
  y,
  maxWidth,
  maxLines,
  maxChars = 180,
  lineHeight = 16,
  extra = {}
) => ({
  pageOffset,
  x,
  y,
  maxWidth,
  maxLines,
  maxChars,
  lineHeight,
  ...extra
});

const clinicalPdfYesNo = (pageOffset, y, yesX, noX, extra = {}) => ({
  type: "mark-select",
  pageOffset,
  size: 10,
  markMap: {
    si: { x: yesX, y },
    no: { x: noX, y }
  },
  ...extra
});

const clinicalPdfHeader = (valueKey, x, y, maxWidth, maxChars = 72, extra = {}) => ({
  valueKey,
  pageOffset: 0,
  x,
  y,
  maxWidth,
  maxLines: 1,
  maxChars,
  size: 7.5,
  ...extra
});

const CLINICAL_FORMAT_HEADER_PDF_RULES = {
  "f2-preventiva": [
    clinicalPdfHeader("lastNameFather", 158, 503.1, 91, 28),
    clinicalPdfHeader("lastNameMother", 286, 503.1, 91, 30),
    clinicalPdfHeader("firstNames", 414, 503.1, 132, 40),
    clinicalPdfHeader("dentistName", 126, 475.1, 420, 70)
  ],
  "f3-operatoria": [
    clinicalPdfHeader("recordReference", 466, 433.9, 80, 22),
    clinicalPdfHeader("recordReference", 466, 417.9, 80, 22),
    clinicalPdfHeader("dentistName", 135, 401.9, 411, 70),
    clinicalPdfHeader("lastNameFather", 158, 381.9, 91, 28),
    clinicalPdfHeader("lastNameMother", 286, 381.9, 91, 30),
    clinicalPdfHeader("firstNames", 414, 381.9, 132, 40)
  ],
  "f4-protesis-fija": [
    clinicalPdfHeader("recordReference", 466, 470.1, 80, 22),
    clinicalPdfHeader("lastNameFather", 158, 454.1, 91, 28),
    clinicalPdfHeader("lastNameMother", 286, 454.1, 91, 30),
    clinicalPdfHeader("firstNames", 414, 454.1, 132, 40),
    clinicalPdfHeader("dentistName", 135, 426.1, 411, 70)
  ],
  "f5-protesis-removible": [
    clinicalPdfHeader("recordReference", 466, 470.8, 80, 22),
    clinicalPdfHeader("lastNameFather", 157, 454.8, 91, 28),
    clinicalPdfHeader("lastNameMother", 285, 454.8, 91, 30),
    clinicalPdfHeader("firstNames", 413, 454.8, 132, 40),
    clinicalPdfHeader("dentistName", 134, 426.8, 411, 70)
  ],
  "f6-prostodoncia": [
    clinicalPdfHeader("recordReference", 466, 470.1, 80, 22),
    clinicalPdfHeader("lastNameFather", 157, 454.1, 91, 28),
    clinicalPdfHeader("lastNameMother", 285, 454.1, 91, 30),
    clinicalPdfHeader("firstNames", 413, 454.1, 132, 40),
    clinicalPdfHeader("dentistName", 134, 426.1, 411, 70)
  ],
  "f7-cirugia-bucal": [
    clinicalPdfHeader("recordReference", 465, 487.1, 81, 22),
    clinicalPdfHeader("recordReference", 465, 471.1, 81, 22),
    clinicalPdfHeader("lastNameFather", 157, 455.1, 91, 28),
    clinicalPdfHeader("lastNameMother", 285, 455.1, 91, 30),
    clinicalPdfHeader("firstNames", 413, 455.1, 132, 40),
    clinicalPdfHeader("dentistName", 175, 427.1, 371, 70)
  ],
  "f8-periodoncia": [
    clinicalPdfHeader("consultDay", 278, 463.1, 18, 2, { align: "center", size: 6.8 }),
    clinicalPdfHeader("consultMonth", 304, 463.1, 18, 2, { align: "center", size: 6.8 }),
    clinicalPdfHeader("consultYear", 329, 463.1, 30, 4, { align: "center", size: 6.8 }),
    clinicalPdfHeader("recordReference", 469, 463.1, 77, 22),
    clinicalPdfHeader("fullName", 105, 393.1, 441, 82),
    clinicalPdfHeader("ageText", 94, 377.1, 65, 3),
    clinicalPdfHeader("sexLabel", 191, 377.1, 75, 18),
    clinicalPdfHeader("civilStatus", 322, 377.1, 77, 24),
    clinicalPdfHeader("occupation", 451, 377.1, 95, 28),
    clinicalPdfHeader("birthPlaceDate", 155, 361.1, 190, 44),
    clinicalPdfHeader("occupationAlt", 415, 361.1, 131, 34),
    clinicalPdfHeader("location", 174, 345.1, 372, 72),
    clinicalPdfHeader("locationColony", 104, 329.1, 182, 36),
    clinicalPdfHeader("phone", 105, 313.1, 210, 22),
    clinicalPdfHeader("officePhone", 390, 313.1, 156, 22)
  ],
  "f9-endodoncia": [
    clinicalPdfHeader("fullName", 162, 486.5, 380, 82),
    clinicalPdfHeader("phone", 96, 454.5, 145, 22),
    clinicalPdfHeader("sexLabel", 278, 454.5, 132, 18),
    clinicalPdfHeader("ageText", 448, 454.5, 75, 3)
  ],
  "f10-ortodoncia": [
    clinicalPdfHeader("consultDay", 242, 492.1, 17, 2, { align: "center", size: 6.8 }),
    clinicalPdfHeader("consultMonth", 269, 492.1, 17, 2, { align: "center", size: 6.8 }),
    clinicalPdfHeader("consultYear", 296, 492.1, 28, 4, { align: "center", size: 6.8 }),
    clinicalPdfHeader("recordReference", 482, 492.1, 64, 20),
    clinicalPdfHeader("fullName", 156, 442.1, 209, 60),
    clinicalPdfHeader("sexLabel", 398, 442.1, 62, 18),
    clinicalPdfHeader("ageText", 492, 442.1, 54, 3),
    clinicalPdfHeader("location", 112, 426.1, 434, 80),
    clinicalPdfHeader("phone", 88, 410.1, 111, 22),
    clinicalPdfHeader("birthPlaceDate", 156, 378.1, 390, 58),
    clinicalPdfHeader("occupation", 404, 362.1, 142, 34)
  ],
  "f11-odontopediatria": [
    clinicalPdfHeader("consultDay", 282, 454.7, 18, 2, { align: "center", size: 6.8 }),
    clinicalPdfHeader("consultMonth", 307, 454.7, 18, 2, { align: "center", size: 6.8 }),
    clinicalPdfHeader("consultYear", 332, 454.7, 30, 4, { align: "center", size: 6.8 }),
    clinicalPdfHeader("recordReference", 486, 454.6, 60, 20),
    clinicalPdfHeader("lastNameFather", 136, 404.6, 125, 28),
    clinicalPdfHeader("lastNameMother", 279, 404.6, 126, 30),
    clinicalPdfHeader("firstNames", 423, 404.6, 123, 38),
    clinicalPdfHeader("ageYears", 135, 372.6, 35, 3),
    clinicalPdfHeader("ageMonths", 216, 372.6, 35, 2),
    { markWhen: "isMale", pageOffset: 0, x: 404.4, y: 372.6, size: 10 },
    { markWhen: "isFemale", pageOffset: 0, x: 496.6, y: 372.6, size: 10 },
    clinicalPdfHeader("locationState", 185, 356.6, 103, 14, { align: "center", size: 6.8 }),
    clinicalPdfHeader("locationCity", 289, 356.6, 140, 18, { align: "center", size: 6.8 }),
    clinicalPdfHeader("birthDay", 430, 356.6, 38, 2, { align: "center", size: 6.8 }),
    clinicalPdfHeader("birthMonth", 469, 356.6, 36, 2, { align: "center", size: 6.8 }),
    clinicalPdfHeader("birthYear", 506, 356.6, 40, 4, { align: "center", size: 6.8 }),
    clinicalPdfHeader("occupationAlt", 122, 308.6, 424, 54),
    clinicalPdfHeader("locationStreet", 138, 292.6, 408, 70),
    clinicalPdfHeader("locationExterior", 130, 276.6, 80, 18),
    clinicalPdfHeader("locationInterior", 276, 276.6, 75, 18),
    clinicalPdfHeader("locationColony", 393, 276.6, 153, 30),
    clinicalPdfHeader("locationState", 104, 260.6, 97, 18),
    clinicalPdfHeader("locationMunicipality", 236, 260.6, 118, 22),
    clinicalPdfHeader("locationDelegation", 411, 260.6, 135, 22),
    clinicalPdfHeader("phone", 111, 244.6, 74, 16)
  ]
};

const CLINICAL_FIELD_PDF_RULES = {
  "f1-estomatologica": {
    motivo_consulta: { maxWidth: 480, maxLines: 1, pageOffset: 1, x: 62, y: 219.3, dx: 0 },
    antecedentes_estomatologicos: { maxWidth: 280, maxLines: 3, pageOffset: 1, x: 265, y: 658.2, dx: 0 },
    ultima_consulta_medica_odontologica: { maxWidth: 236, maxLines: 1, pageOffset: 0, x: 307, y: 222.4, maxChars: 64, fallbackValueKey: "lastMedicalConsult" },

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
    padecimiento_actual_detalle: { maxWidth: 388, maxLines: 1, pageOffset: 1, x: 154, y: 235.3, maxChars: 100 },

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
    tejidos_labio_externo: { maxWidth: 402, maxLines: 1, pageOffset: 4, x: 131, y: 355.3, maxChars: 96 },
    tejidos_borde_bermellon: { maxWidth: 392, maxLines: 1, pageOffset: 4, x: 141, y: 339.3, maxChars: 92 },
    tejidos_labio_interno: { maxWidth: 407, maxLines: 1, pageOffset: 4, x: 127, y: 323.3, maxChars: 96 },
    tejidos_comisuras: { maxWidth: 416, maxLines: 1, pageOffset: 4, x: 118, y: 307.3, maxChars: 96 },
    tejidos_carrillos: { maxWidth: 424, maxLines: 1, pageOffset: 4, x: 109, y: 291.3, maxChars: 98 },
    tejidos_fondo_saco: { maxWidth: 400, maxLines: 1, pageOffset: 4, x: 133, y: 275.3, maxChars: 95 },
    tejidos_frenillos: { maxWidth: 424, maxLines: 1, pageOffset: 4, x: 109, y: 259.3, maxChars: 98 },
    tejidos_lengua_tercio_medio: { maxWidth: 376, maxLines: 1, pageOffset: 4, x: 156, y: 243.3, maxChars: 88 },
    tejidos_paladar_duro: { maxWidth: 404, maxLines: 1, pageOffset: 4, x: 128, y: 227.3, maxChars: 95 },
    tejidos_paladar_blando: { maxWidth: 395, maxLines: 1, pageOffset: 4, x: 137, y: 211.3, maxChars: 94 },
    tejidos_istmo_bucofaringe: { maxWidth: 382, maxLines: 1, pageOffset: 4, x: 149, y: 195.3, maxChars: 90 },
    tejidos_lengua_dorso: { maxWidth: 402, maxLines: 1, pageOffset: 4, x: 131, y: 179.3, maxChars: 96 },
    tejidos_lengua_bordes: { maxWidth: 400, maxLines: 1, pageOffset: 4, x: 133, y: 163.3, maxChars: 94 },
    tejidos_lengua_ventral: { maxWidth: 400, maxLines: 1, pageOffset: 4, x: 133, y: 147.3, maxChars: 94 },
    tejidos_piso_boca: { maxWidth: 398, maxLines: 1, pageOffset: 4, x: 135, y: 131.3, maxChars: 94 },
    tejidos_dientes: { maxWidth: 428, maxLines: 1, pageOffset: 4, x: 105, y: 115.3, maxChars: 98 },
    tejidos_mucosa_borde_alveolar: { maxWidth: 352, maxLines: 1, pageOffset: 4, x: 181, y: 99.3, maxChars: 80 },
    tejidos_encia: { maxWidth: 435, maxLines: 1, pageOffset: 4, x: 98, y: 83.3, maxChars: 100 },
    tejidos_descripcion: { maxWidth: 330, maxLines: 2, lineHeight: 10, pageOffset: 4, x: 200, y: 411.3, maxChars: 150 },

    periodonto_gingivitis: { maxWidth: 188, maxLines: 1, pageOffset: 5, x: 102, y: 632.1, maxChars: 44 },
    periodonto_periodontitis: { maxWidth: 182, maxLines: 1, pageOffset: 5, x: 352, y: 632.1, maxChars: 42 },
    periodonto_recesion_gingival: { maxWidth: 390, maxLines: 1, pageOffset: 5, x: 134, y: 616.1, maxChars: 90 },
    periodonto_bolsas_detalle: { maxWidth: 390, maxLines: 4, lineHeight: 17, pageOffset: 5, x: 146, y: 568.1, maxChars: 180 },
    periodonto_movilidad_dentaria: { maxWidth: 390, maxLines: 4, lineHeight: 17, pageOffset: 5, x: 137, y: 488.1, maxChars: 180 },
    indice_higiene_bucal_f1: { maxWidth: 96, maxLines: 1, pageOffset: 5, x: 179, y: 384.1, maxChars: 20 },
    indice_placa_actual_f1: { maxWidth: 60, maxLines: 1, pageOffset: 5, x: 317, y: 157.1, maxChars: 12 },

    diagnostico_estomatologico: { maxWidth: 380, maxLines: 4, lineHeight: 16, pageOffset: 8, x: 126, y: 659.4, dx: 0 },
    plan_estomatologico: { maxWidth: 365, maxLines: 4, lineHeight: 16, pageOffset: 8, x: 176, y: 543.4, dx: 0 },
    pronostico_estomatologico: { maxWidth: 407, maxLines: 4, lineHeight: 16, pageOffset: 8, x: 134, y: 464.4, dx: 0 },
    observaciones_f1: { maxWidth: 410, maxLines: 4, lineHeight: 16, pageOffset: 8, x: 132, y: 385.4, dx: 0 },
    plan_operatoria_f1: { maxWidth: 410, maxLines: 4, lineHeight: 16, pageOffset: 8, x: 132, y: 306.4, dx: 0 },
    plan_cirugia_f1: { maxWidth: 426, maxLines: 4, lineHeight: 16, pageOffset: 8, x: 115, y: 227.4, dx: 0 },
    plan_protesis_f1: { maxWidth: 426, maxLines: 4, lineHeight: 16, pageOffset: 8, x: 115, y: 148.4, dx: 0 }
  },
  "f2-preventiva": {
    tecnica_cepillado: clinicalPdfArea(0, 76, 420.5, 72, 3, 54, 15.8),
    tipo_cepillo_dental: clinicalPdfLine(0, 155, 421.0, 72, 24),
    indice_placa: clinicalPdfLine(0, 234, 421.0, 72, 24),
    fecha_inicio_preventivo: clinicalPdfLine(0, 313, 421.0, 72, 18),
    seguimiento_preventivo: clinicalPdfLine(0, 471, 421.0, 72, 18),
    recomendaciones_preventivas: clinicalPdfArea(0, 76, 348.5, 72, 2, 38, 15.8),
    fluorizacion: clinicalPdfArea(0, 76, 306.3, 72, 2, 48, 15.8),
    riesgo_caries: clinicalPdfLine(0, 330, 45.6, 116, 18),
    odonto_control_1: clinicalPdfLine(0, 421, 243.6, 125, 30),
    odonto_control_2: clinicalPdfLine(1, 408, 639.6, 125, 30),
    odonto_control_3: clinicalPdfLine(1, 408, 371.6, 125, 30),
    odonto_control_4: clinicalPdfLine(2, 418, 639.6, 125, 30),
    conformidad_preventiva: clinicalPdfLine(2, 231, 221.0, 156, 44, { align: "center" })
  },
  "f3-operatoria": {
    ...Object.fromEntries(OPERATORIA_TREATMENT_TEETH.map((tooth, index) => {
      const group = Math.floor(index / 8);
      const row = index % 8;
      const isUpper = group < 2;
      const isLeft = group % 2 === 0;
      const y = (isUpper ? 635.2 : 497.2) - (row * 16);
      return [
        `tratamiento_operatoria_${tooth}`,
        clinicalPdfLine(2, isLeft ? 90 : 360, y, isLeft ? 245 : 182, isLeft ? 52 : 40, {
          sourceLabel: String(tooth)
        })
      ];
    })),
    fecha_tratamiento_op: clinicalPdfLine(2, 103, 353.2, 228, 24),
    control_operatorio: clinicalPdfLine(2, 201, 261.2, 215, 54, { align: "center" })
  },
  "f4-protesis-fija": {
    dientes_ausentes_f4: clinicalPdfLine(0, 145, 374.1, 397, 88),
    protesis_fija_previa_f4: clinicalPdfLine(0, 123, 306.1, 419, 92),
    protesis_removible_previa_f4: clinicalPdfLine(0, 151, 274.1, 391, 88),
    relacion_corona_raiz_f4: clinicalPdfLine(0, 199, 206.1, 343, 76),
    soporte_oseo_f4: clinicalPdfLine(0, 128, 190.1, 414, 92),
    estado_periodontal_pilares_f4: clinicalPdfLine(0, 192, 174.1, 350, 78),
    diagnostico_protesis_fija: clinicalPdfArea(0, 72, 142.1, 470, 5, 330, 16),
    modelos_estudio_f4: clinicalPdfLine(1, 208, 609.1, 112, 24),
    presentacion_provisionales_f4: clinicalPdfLine(1, 208, 593.1, 112, 24),
    preparacion_pilares_f4: clinicalPdfLine(1, 208, 577.1, 112, 24),
    colocacion_provisionales_f4: clinicalPdfLine(1, 208, 561.1, 112, 24),
    impresiones_f4: clinicalPdfLine(1, 208, 545.1, 112, 24),
    prueba_metales_f4: clinicalPdfLine(1, 208, 529.1, 112, 24),
    prueba_porcelana_f4: clinicalPdfLine(1, 208, 513.1, 112, 24),
    terminado_f4: clinicalPdfLine(1, 208, 497.1, 112, 24),
    observaciones_protesis_fija: clinicalPdfLine(1, 239, 471.1, 303, 66),
    pilares_protesis: clinicalPdfLine(1, 126, 445.1, 416, 92),
    ponticos_f4: clinicalPdfLine(1, 101, 429.1, 441, 96),
    restauraciones_individuales_f4: clinicalPdfLine(1, 177, 413.1, 365, 82)
  },
  "f5-protesis-removible": {
    dientes_ausentes_f5: clinicalPdfLine(0, 145, 374.8, 397, 88),
    protesis_fija_f5: clinicalPdfLine(0, 123, 306.8, 419, 92),
    protesis_removible_f5: clinicalPdfLine(0, 151, 274.8, 391, 88),
    relacion_corona_raiz_f5: clinicalPdfLine(0, 199, 206.8, 343, 76),
    soporte_oseo_f5: clinicalPdfLine(0, 128, 190.8, 414, 92),
    estado_periodontal_area_f5: clinicalPdfLine(0, 273, 174.8, 269, 60),
    interpretacion_radiografica_f5: clinicalPdfArea(0, 72, 142.8, 470, 4, 260, 16),
    clasificacion_kennedy: clinicalPdfLine(0, 173, 58.8, 369, 82),
    pilares_f5: clinicalPdfLine(0, 134, 42.8, 408, 90),
    zona_desdentada: clinicalPdfLine(1, 135, 661.0, 407, 90),
    diseno_protesis_removible: clinicalPdfLine(1, 164, 645.0, 378, 82),
    conector_menor_f5: clinicalPdfLine(1, 164, 629.0, 378, 82),
    elementos_retencion: clinicalPdfArea(1, 269, 613.0, 273, 4, 220, 16),
    presentacion_caso_f5: clinicalPdfLine(1, 220, 487.0, 106, 24),
    preparaciones_f5: clinicalPdfLine(1, 220, 471.0, 106, 24),
    impresion_f5: clinicalPdfLine(1, 220, 455.0, 106, 24),
    prueba_metales_f5: clinicalPdfLine(1, 220, 439.0, 106, 24),
    prueba_rodillos_f5: clinicalPdfLine(1, 220, 423.0, 106, 24),
    prueba_oclusion_f5: clinicalPdfLine(1, 220, 407.0, 106, 24),
    indicaciones_protesis_removible: clinicalPdfLine(1, 220, 391.0, 106, 24),
    revision_1_f5: clinicalPdfLine(1, 220, 375.0, 106, 24),
    revision_2_f5: clinicalPdfLine(1, 220, 359.0, 106, 24),
    revision_3_f5: clinicalPdfLine(1, 220, 343.0, 106, 24)
  },
  "f6-prostodoncia": {
    interpretacion_radiografica_f6: clinicalPdfArea(0, 184, 374.1, 358, 3, 220, 16),
    estado_reborde: clinicalPdfArea(0, 185, 294.1, 357, 3, 220, 16),
    modelos_estudio_f6: clinicalPdfLine(0, 232, 168.1, 106, 24),
    modelos_trabajo_f6: clinicalPdfLine(0, 232, 152.1, 106, 24),
    dimension_vertical: clinicalPdfLine(0, 232, 136.1, 106, 24),
    pruebas_prostodoncia: clinicalPdfLine(0, 232, 120.1, 106, 24),
    adaptacion_prostodoncia: clinicalPdfLine(0, 232, 104.1, 106, 24),
    ganchos_ubicacion_f6: clinicalPdfArea(1, 263, 660.9, 279, 3, 180, 16),
    presentacion_caso_f6: clinicalPdfLine(1, 220, 534.9, 106, 24),
    preparaciones_f6: clinicalPdfLine(1, 220, 518.9, 106, 24),
    impresion_f6: clinicalPdfLine(1, 220, 502.9, 106, 24),
    prueba_metales_f6: clinicalPdfLine(1, 220, 486.9, 106, 24),
    prueba_rodillos_f6: clinicalPdfLine(1, 220, 470.9, 106, 24),
    prueba_oclusion_f6: clinicalPdfLine(1, 220, 454.9, 106, 24),
    entrega_protesis_f6: clinicalPdfLine(1, 220, 438.9, 106, 24),
    revision_1_f6: clinicalPdfLine(1, 220, 422.9, 106, 24),
    revision_2_f6: clinicalPdfLine(1, 220, 406.9, 106, 24),
    revision_3_f6: clinicalPdfLine(1, 220, 390.9, 106, 24)
  },
  "f7-cirugia-bucal": {
    enfermedades_sistemicas_f7: clinicalPdfLine(0, 176, 411.1, 366, 82),
    medicacion_cirugia: clinicalPdfLine(0, 232, 395.1, 310, 68),
    motivo_cirugia: clinicalPdfLine(0, 156, 363.1, 386, 86),
    tiempo_evolucion_f7: clinicalPdfLine(0, 156, 347.1, 104, 22),
    sintomatologia_f7: clinicalPdfLine(0, 330, 347.1, 212, 46),
    dolor_ubicacion_f7: clinicalPdfLine(0, 165, 331.1, 164, 36),
    tipo_dolor_f7: clinicalPdfLine(0, 128, 315.1, 414, 90),
    dolor_masticar_f7: clinicalPdfYesNo(0, 281.3, 209, 281, { size: 8 }),
    aumento_volumen_f7: clinicalPdfYesNo(0, 265.3, 209, 281, { size: 8 }),
    secrecion_purulenta_f7: clinicalPdfYesNo(0, 249.3, 209, 281, { size: 8 }),
    radiografia_periapical_f7: clinicalPdfLine(0, 237, 235.1, 9, 2, { align: "center", size: 4.5 }),
    radiografia_oclusal_f7: clinicalPdfLine(0, 357, 235.1, 9, 2, { align: "center", size: 4.5 }),
    radiografia_ortopanto_f7: clinicalPdfLine(0, 518, 235.1, 9, 2, { align: "center", size: 4.5 }),
    interpretacion_radiografica_f7: clinicalPdfArea(0, 183, 219.1, 359, 3, 210, 16),
    exploracion_region_afectada_f7: clinicalPdfArea(0, 72, 139.1, 470, 5, 330, 16),
    diagnostico_cirugia: clinicalPdfLine(1, 113, 564.9, 429, 94),
    pronostico_cirugia: clinicalPdfLine(1, 109, 532.9, 433, 94),
    procedimiento_cirugia: clinicalPdfLine(1, 145, 516.9, 397, 88),
    diagnostico_posquirurgico_f7: clinicalPdfLine(1, 171, 500.9, 371, 82),
    estado_posquirurgico_f7: clinicalPdfArea(1, 72, 436.9, 470, 3, 210, 16),
    incidentes_complicaciones_f7: clinicalPdfArea(1, 72, 340.9, 470, 3, 210, 16),
    cuidados_posoperatorios: clinicalPdfArea(1, 72, 244.9, 470, 3, 210, 16),
    evaluacion_cirugia_f7: clinicalPdfLine(1, 350, 164.9, 192, 42),
    bloqueo_anestesico_f7: clinicalPdfLine(1, 230, 148.9, 230, 52),
    antisepsia_f7: clinicalPdfLine(1, 230, 132.9, 230, 52),
    incision_f7: clinicalPdfLine(1, 230, 116.9, 230, 52),
    colgajo_f7: clinicalPdfLine(1, 230, 100.9, 230, 52),
    tratamiento_zona_intervenida_f7: clinicalPdfLine(1, 230, 84.9, 230, 52),
    sutura_f7: clinicalPdfLine(1, 230, 68.9, 230, 52),
    indicaciones_posoperatorias_f7: clinicalPdfLine(1, 230, 52.9, 230, 52),
    observaciones_f7: clinicalPdfArea(2, 136, 660.9, 406, 6, 360, 16),
    hora_inicio_f7: clinicalPdfLine(2, 144, 469.0, 121, 18, { align: "center" }),
    hora_termino_f7: clinicalPdfLine(2, 374, 469.0, 131, 18, { align: "center" })
  },
  "f8-periodoncia": {
    antecedentes_hereditarios_f8: clinicalPdfLine(0, 109, 259.1, 433, 94),
    antecedentes_cancer_f8: clinicalPdfLine(0, 102, 243.1, 440, 96),
    antecedentes_tension_f8: clinicalPdfLine(0, 180, 227.1, 362, 80),
    antecedentes_infarto_f8: clinicalPdfLine(0, 173, 211.1, 369, 82),
    antecedentes_infectocontagiosas_f8: clinicalPdfLine(0, 175, 195.1, 367, 82),
    antecedentes_no_patologicos_f8: clinicalPdfLine(0, 290, 167.1, 252, 56),
    grupo_sanguineo_f8: clinicalPdfLine(0, 143, 141.1, 399, 88),
    deporte_f8: clinicalPdfLine(0, 106, 125.1, 436, 96),
    tabaquismo_f8: clinicalPdfLine(0, 123, 109.1, 186, 42),
    alcoholismo_f8: clinicalPdfLine(0, 370, 109.1, 172, 38),
    otros_habitos_f8: clinicalPdfLine(0, 128, 93.1, 414, 92),
    cepillados_dia_f8: clinicalPdfLine(0, 260, 77.1, 104, 20),
    tipo_cepillo_f8: clinicalPdfLine(0, 431, 77.1, 111, 24),
    uso_pasta_f8: clinicalPdfLine(0, 153, 61.1, 168, 36),
    hilo_dental_f8: clinicalPdfLine(0, 378, 61.1, 164, 36),
    enjuague_bucal_f8: clinicalPdfLine(0, 135, 45.1, 407, 90),
    profundidad_bolsas: clinicalPdfLine(1, 211, 637.6, 331, 74),
    padecimiento_actual_f8: clinicalPdfLine(1, 145, 541.6, 397, 88),
    interrogatorio_aparatos_f8: clinicalPdfLine(1, 116, 477.6, 426, 94),
    medicamentos_actuales_f8: clinicalPdfLine(1, 220, 301.6, 322, 72),
    inspeccion_general_f8: clinicalPdfLine(1, 96, 253.6, 446, 98),
    exploracion_bucal_f8: clinicalPdfLine(1, 96, 157.6, 446, 98),
    diagnostico_periodontal: clinicalPdfLine(4, 128, 535.8, 414, 92),
    plan_periodontal: clinicalPdfLine(4, 160, 503.8, 382, 84),
    pronostico_periodontal: clinicalPdfLine(4, 124, 519.8, 418, 92),
    periodontograma_diagnostico_f8: clinicalPdfLine(2, 251, 659.6, 291, 64),
    periodontograma_evolucion_f8: clinicalPdfLine(3, 231, 659.6, 311, 68),
    auxiliares_diagnostico_f8: clinicalPdfLine(4, 132, 631.8, 410, 90),
    auxiliares_modelos_f8: clinicalPdfLine(4, 160, 615.8, 382, 84),
    auxiliares_fotografias_f8: clinicalPdfLine(4, 125, 599.8, 417, 92),
    auxiliares_laboratorio_f8: clinicalPdfLine(4, 176, 583.8, 366, 82),
    diagnostico_presuncion_sistemico_f8: clinicalPdfLine(4, 226, 567.8, 316, 70)
  },
  "f9-endodoncia": {
    direccion_f9: clinicalPdfLine(0, 118, 470.5, 424, 80, { fallbackValueKey: "location" }),
    referido_por_f9: clinicalPdfLine(0, 130, 438.5, 412, 80),
    fecha_inicio_f9: clinicalPdfLine(0, 140, 422.5, 245, 24),
    fecha_termino_f9: clinicalPdfLine(0, 375, 422.5, 167, 24),
    pieza_endodoncia: clinicalPdfLine(0, 187, 406.5, 355, 54),
    interrogatorio_f9: clinicalPdfLine(0, 150, 372.9, 392, 90),
    antecedentes_f9: clinicalPdfLine(0, 126, 180.2, 164, 36),
    dolor_f9: clinicalPdfLine(0, 324, 348.2, 112, 24),
    estimulo_f9: clinicalPdfLine(0, 490, 348.2, 112, 24),
    examen_intrabucal_f9: clinicalPdfLine(0, 230, 141.4, 160, 36),
    examen_extrabucal_f9: clinicalPdfLine(0, 469, 141.4, 119, 28),
    pruebas_endodoncia: clinicalPdfLine(1, 231, 659.6, 311, 68),
    pruebas_periodontales_f9: clinicalPdfLine(1, 187, 448.7, 355, 78),
    interpretacion_radiografica_f9: clinicalPdfLine(1, 210, 237.8, 332, 74),
    diagnostico_pulpar: clinicalPdfLine(2, 156, 656.7, 144, 32),
    pronostico_periapical_f9: clinicalPdfLine(2, 170, 512.7, 130, 30),
    tecnica_endodoncia: clinicalPdfLine(2, 368, 656.7, 174, 38),
    control_endodoncia: clinicalPdfLine(3, 210, 344.7, 332, 74),
    longitud_trabajo_f9: clinicalPdfLine(3, 195, 627.9, 150, 34),
    tecnica_instrumentacion_f9: clinicalPdfLine(3, 181, 463.1, 361, 80),
    tecnica_obturacion_f9: clinicalPdfLine(3, 159, 447.1, 383, 84),
    indicaciones_f9: clinicalPdfLine(3, 122, 431.1, 420, 92)
  },
  "f10-ortodoncia": {
    motivo_ortodoncia: clinicalPdfArea(0, 160, 320.1, 382, 2, 150, 16),
    padecimiento_actual_ortodoncia: clinicalPdfLine(0, 155, 288.1, 387, 86),
    tratamiento_medico_actual_ortodoncia: clinicalPdfLine(0, 340, 272.1, 202, 44),
    ultimo_examen_medico_ortodoncia: clinicalPdfLine(0, 164, 256.1, 161, 36),
    ultimo_examen_dental_ortodoncia: clinicalPdfLine(0, 161, 224.1, 160, 36),
    problema_tratamientos_dentales_ortodoncia: clinicalPdfLine(0, 301, 208.1, 241, 54),
    tratamientos_ortodonticos_previos: clinicalPdfLine(0, 342, 176.1, 200, 44),
    referido_por_ortodoncia: clinicalPdfLine(0, 128, 144.1, 414, 92),
    nombre_padre_ortodoncia: clinicalPdfLine(0, 111, 64.1, 283, 62),
    nombre_madre_ortodoncia: clinicalPdfLine(0, 113, 48.1, 281, 62),
    tutor_ortodoncia: clinicalPdfLine(1, 89, 660.9, 296, 66),
    telefono_tutor_ortodoncia: clinicalPdfLine(1, 120, 612.9, 170, 36),
    antecedentes_patologicos_ortodoncia: clinicalPdfLine(1, 205, 586.9, 337, 74),
    alergias_medicamentos_ortodoncia: clinicalPdfLine(1, 252, 538.9, 118, 26),
    tratamiento_psicologico_psiquiatrico: clinicalPdfLine(1, 360, 466.9, 182, 40),
    medicamentos_estres_ortodoncia: clinicalPdfLine(1, 62, 98.9, 480, 100),
    enfermedades_padecidas_ortodoncia: clinicalPdfLine(1, 220, 418.9, 322, 72),
    trastornos_respiratorios_ortodoncia: clinicalPdfLine(1, 168, 242.9, 374, 82),
    cirugia_o_enfermedad_seria_ortodoncia: clinicalPdfLine(1, 308, 146.9, 234, 52),
    medicamentos_actuales_ortodoncia: clinicalPdfLine(1, 280, 114.9, 262, 58),
    antecedentes_no_patologicos_ortodoncia: clinicalPdfLine(2, 230, 659.6, 312, 68),
    embarazo_parto_ortodoncia: clinicalPdfLine(2, 150, 635.6, 112, 24),
    alimentacion_ortodoncia: clinicalPdfLine(2, 235, 547.6, 307, 68),
    desarrollo_psicomotor_ortodoncia: clinicalPdfLine(2, 240, 467.6, 302, 68),
    desarrollo_lenguaje_ortodoncia: clinicalPdfLine(2, 130, 403.6, 76, 18),
    primeras_palabras_ortodoncia: clinicalPdfLine(2, 270, 403.6, 80, 18),
    lenguaje_estructurado_ortodoncia: clinicalPdfLine(2, 455, 403.6, 87, 20),
    erupcion_control_esfinteres_ortodoncia: clinicalPdfLine(2, 164, 387.6, 378, 84),
    genitourinario_enuresis_ortodoncia: {
      type: "mark-select",
      pageOffset: 2,
      size: 8,
      markMap: {
        primaria: { x: 230.4, y: 373.4 },
        secundaria: { x: 304.2, y: 373.4 }
      }
    },
    menarca_ortodoncia: clinicalPdfLine(2, 385, 371.6, 157, 32),
    diagnostico_oclusal: clinicalPdfArea(9, 195, 195.0, 347, 4, 260, 16),
    analisis_facial: clinicalPdfArea(6, 72, 628.9, 470, 4, 300, 16),
    plan_ortodontico: clinicalPdfArea(10, 72, 597.0, 470, 8, 520, 16),
    seguimiento_ortodoncia: clinicalPdfArea(10, 350, 317.0, 192, 6, 180, 16),
    pronostico_ortodoncia: clinicalPdfArea(9, 200, 243.0, 342, 3, 180, 16),
    objetivo_ortodoncia: clinicalPdfArea(9, 180, 67.0, 362, 2, 120, 16),
    auxiliares_diagnostico_ortodoncia: clinicalPdfArea(4, 130, 612.9, 412, 2, 180, 16),
    odontograma_ortodontico: clinicalPdfLine(5, 205, 659.6, 337, 74),
    citas_complementarias_ortodoncia: clinicalPdfArea(11, 60, 597.0, 482, 5, 340, 16),
    observaciones_ortodoncia: clinicalPdfArea(11, 60, 501.0, 482, 5, 340, 16)
  },
  "f11-odontopediatria": {
    ultima_consulta_pediatrica: clinicalPdfLine(0, 311, 212.6, 231, 52),
    derechohabiencia_pediatria: clinicalPdfLine(0, 160, 324.6, 145, 32),
    medico_pediatra_familiar: clinicalPdfLine(0, 342, 244.6, 200, 44),
    telefono_medico_pediatra: clinicalPdfLine(0, 191, 228.6, 351, 78),
    hereditarios_madre_f11: clinicalPdfLine(0, 105, 108.6, 437, 96),
    hereditarios_padre_f11: clinicalPdfLine(0, 103, 92.6, 439, 96),
    hereditarios_hermanos_f11: clinicalPdfLine(0, 118, 76.6, 424, 94),
    hereditarios_tios_f11: clinicalPdfLine(0, 94, 60.6, 448, 98),
    hereditarios_abuelos_f11: clinicalPdfLine(0, 109, 44.6, 433, 96),
    patologicos_pediatria: clinicalPdfLine(1, 90, 315.6, 452, 98),
    tratamiento_medico_previo_f11: clinicalPdfYesNo(1, 297.6, 343, 422),
    motivo_tratamiento_medico_f11: clinicalPdfLine(1, 137, 283.6, 405, 90),
    medicamento_actual_f11: clinicalPdfLine(1, 284, 267.6, 258, 58),
    trastornos_mentales_f11: clinicalPdfLine(1, 292, 235.6, 250, 56),
    habitos_higienicos_diarios_f11: clinicalPdfLine(1, 188, 185.6, 81, 18),
    frecuencia_higiene_boca_f11: clinicalPdfLine(1, 283, 169.6, 259, 58),
    auxiliares_higiene_f11: clinicalPdfYesNo(1, 151.6, 211, 257),
    auxiliares_higiene_cuales_f11: clinicalPdfLine(1, 352, 153.6, 190, 42),
    consume_golosinas_f11: clinicalPdfYesNo(1, 135.6, 338, 447),
    grupo_sanguineo_f11: clinicalPdfLine(1, 133, 121.6, 58, 8),
    factor_rh_f11: clinicalPdfLine(1, 242, 121.6, 50, 8),
    cartilla_vacunacion_f11: clinicalPdfYesNo(1, 119.6, 463, 512),
    esquema_vacunacion_completo_f11: clinicalPdfYesNo(1, 103.6, 251, 313),
    esquema_vacunacion_falta_f11: clinicalPdfLine(1, 151, 89.6, 391, 86),
    padecimiento_actual_f11: clinicalPdfArea(2, 72, 643.6, 470, 3, 210, 16),
    antecedentes_alergicos_f11: clinicalPdfLine(2, 250, 535.6, 292, 64),
    aparato_digestivo_f11: clinicalPdfArea(2, 72, 469.6, 470, 4, 300, 16),
    aparato_respiratorio_f11: clinicalPdfArea(2, 72, 373.6, 470, 4, 300, 16),
    aparato_cardiovascular_f11: clinicalPdfArea(2, 72, 277.6, 470, 4, 300, 16),
    aparato_genitourinario_f11: clinicalPdfArea(2, 72, 181.6, 470, 3, 220, 16),
    sistema_endocrino_f11: clinicalPdfArea(2, 72, 101.6, 470, 3, 220, 16),
    sistema_hemopoyetico_f11: clinicalPdfArea(3, 72, 645.0, 470, 3, 220, 16),
    sistema_nervioso_f11: clinicalPdfArea(3, 72, 565.0, 470, 4, 280, 16),
    sistema_musculoesqueletico_f11: clinicalPdfArea(3, 72, 469.0, 470, 4, 280, 16),
    aparato_tegumentario_f11: clinicalPdfArea(3, 72, 373.0, 470, 4, 280, 16),
    exploracion_fisica_f11: clinicalPdfArea(3, 130, 256.0, 412, 2, 150, 16),
    peso_f11: clinicalPdfLine(3, 90, 191.6, 100, 18),
    talla_f11: clinicalPdfLine(3, 255, 191.6, 100, 18),
    complexion_f11: clinicalPdfLine(3, 440, 191.6, 102, 22),
    frecuencia_cardiaca_f11: clinicalPdfLine(3, 156, 175.6, 68, 14, { sourceLabel: "Signos vitales" }),
    tension_arterial_f11: clinicalPdfLine(3, 244, 175.6, 70, 14, { sourceLabel: "Signos vitales" }),
    frecuencia_respiratoria_f11: clinicalPdfLine(3, 333, 175.6, 70, 14, { sourceLabel: "Signos vitales" }),
    temperatura_f11: clinicalPdfLine(3, 465, 175.6, 77, 16),
    analisis_oclusion_f11: clinicalPdfLine(5, 123, 636.4, 185, 42),
    indice_higiene_f11: clinicalPdfLine(5, 180, 514.4, 140, 30),
    indice_placa_actual_f11: clinicalPdfLine(5, 317, 313.7, 56, 12),
    diagnostico_odontopediatria: clinicalPdfArea(6, 134, 97.9, 408, 3, 260, 16),
    plan_odonto_preventiva_f11: clinicalPdfArea(7, 180, 613.0, 362, 4, 260, 16),
    plan_operatoria_f11: clinicalPdfArea(7, 130, 533.0, 412, 4, 280, 16),
    plan_cirugia_f11: clinicalPdfArea(7, 120, 469.0, 422, 3, 220, 16),
    plan_ortodoncia_preventiva_f11: clinicalPdfArea(7, 190, 405.0, 352, 3, 210, 16),
    plan_ortodoncia_interceptiva_f11: clinicalPdfArea(7, 190, 341.0, 352, 3, 210, 16),
    plan_ortodoncia_correctiva_f11: clinicalPdfArea(7, 180, 277.0, 362, 3, 210, 16),
    plan_tratamientos_pulpares_f11: clinicalPdfArea(7, 190, 213.0, 352, 4, 260, 16),
    indicaciones_tutor: clinicalPdfArea(7, 315, 149.0, 227, 5, 240, 16),
    odontograma_evolucion_f11: clinicalPdfLine(8, 221, 659.6, 321, 70),
    interpretacion_radiografica_f11: clinicalPdfArea(9, 175, 479.0, 367, 6, 380, 16),
    estudios_laboratorio_f11: clinicalPdfArea(9, 202, 367.0, 340, 4, 260, 16)
  }
};

