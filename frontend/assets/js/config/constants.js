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

const CLINICAL_FORM_SCHEMAS = {
  "f1-estomatologica": {
    title: "Formato 1: Historia clinica estomatologica",
    fields: [
      { id: "motivo_consulta", label: "Motivo de consulta", type: "textarea", rows: 2, contextKey: "consultReason", placeholder: "Sintoma o razon principal de la consulta." },
      { id: "antecedentes_estomatologicos", label: "Antecedentes personales y familiares", type: "textarea", rows: 2, contextKey: "background", placeholder: "Antecedentes importantes para la atencion dental." },
      { id: "habitos_higienicos_diarios", label: "Habitos higienicos diarios", type: "text", contextKey: "hygieneHabitsDaily", placeholder: "Ejemplo: habitos higienicos diarios." },
      { id: "diagnostico_estomatologico", label: "Diagnostico estomatologico", type: "textarea", rows: 2, contextKey: "diagnosis", placeholder: "Diagnostico clinico principal." },
      { id: "plan_estomatologico", label: "Plan de tratamiento", type: "textarea", rows: 2, contextKey: "treatmentPlan", placeholder: "Fases del tratamiento indicado." },
      { id: "pronostico_estomatologico", label: "Pronostico", type: "text", contextKey: "prognosis", placeholder: "Favorable, reservado, etc." },
      { id: "observaciones_f1", label: "Observaciones", type: "textarea", rows: 2, contextKey: "notes", placeholder: "Notas clinicas adicionales." }
    ]
  },
  "f2-preventiva": {
    title: "Formato 2: Estomatologia preventiva",
    fields: [
      { id: "riesgo_caries", label: "Riesgo de caries", type: "text", contextKey: "diagnosis", placeholder: "Alto, medio o bajo riesgo." },
      { id: "indice_placa", label: "Indice de placa", type: "text", contextKey: "background", placeholder: "Resultado del indice de placa." },
      { id: "tecnica_cepillado", label: "Tecnica de cepillado indicada", type: "textarea", rows: 2, contextKey: "treatmentPlan", placeholder: "Tecnica recomendada al paciente." },
      { id: "fluorizacion", label: "Aplicacion de fluor", type: "textarea", rows: 2, contextKey: "consultReason", placeholder: "Producto, frecuencia y dosis." },
      { id: "recomendaciones_preventivas", label: "Recomendaciones preventivas", type: "textarea", rows: 2, contextKey: "notes", placeholder: "Instrucciones entregadas al paciente." },
      { id: "seguimiento_preventivo", label: "Seguimiento preventivo", type: "text", contextKey: "prognosis", placeholder: "Fecha o criterio de control." }
    ]
  },
  "f3-operatoria": {
    title: "Formato 3: Operatoria dental",
    fields: [
      { id: "pieza_operatoria", label: "Pieza(s) tratada(s)", type: "text", contextKey: "odontoSummary", placeholder: "Ejemplo: 16, 26, 36." },
      { id: "diagnostico_operatorio", label: "Diagnostico operatorio", type: "textarea", rows: 2, contextKey: "diagnosis", placeholder: "Tipo y extension de la lesion." },
      { id: "material_restaurador", label: "Material restaurador", type: "text", contextKey: "treatmentPlan", placeholder: "Resina, ionomero, etc." },
      { id: "tecnica_operatoria", label: "Tecnica operatoria", type: "textarea", rows: 2, contextKey: "background", placeholder: "Pasos clinicos realizados." },
      { id: "control_operatorio", label: "Control postoperatorio", type: "textarea", rows: 2, contextKey: "notes", placeholder: "Respuesta del paciente y control oclusal." },
      { id: "pronostico_operatorio", label: "Pronostico", type: "text", contextKey: "prognosis", placeholder: "Pronostico del tratamiento restaurador." }
    ]
  },
  "f4-protesis-fija": {
    title: "Formato 4: Protesis fija",
    fields: [
      { id: "motivo_protesis_fija", label: "Motivo protetico", type: "textarea", rows: 2, contextKey: "consultReason", placeholder: "Necesidad funcional o estetica." },
      { id: "pilares_protesis", label: "Dientes pilares", type: "text", contextKey: "odontoSummary", placeholder: "Piezas que funcionaran como pilares." },
      { id: "diagnostico_protesis_fija", label: "Diagnostico protetico", type: "textarea", rows: 2, contextKey: "diagnosis", placeholder: "Situacion clinica para protesis fija." },
      { id: "plan_protesis_fija", label: "Plan de tratamiento protetico", type: "textarea", rows: 2, contextKey: "treatmentPlan", placeholder: "Secuencia de preparacion, impresion y cementacion." },
      { id: "pruebas_protesis_fija", label: "Pruebas y ajustes", type: "textarea", rows: 2, contextKey: "background", placeholder: "Prueba de estructura, ajuste marginal y oclusion." },
      { id: "observaciones_protesis_fija", label: "Observaciones", type: "textarea", rows: 2, contextKey: "notes", placeholder: "Indicaciones y evolucion." }
    ]
  },
  "f5-protesis-removible": {
    title: "Formato 5: Protesis removible",
    fields: [
      { id: "clasificacion_kennedy", label: "Clasificacion de Kennedy", type: "text", contextKey: "diagnosis", placeholder: "Clase I, II, III o IV." },
      { id: "zona_desdentada", label: "Area desdentada", type: "textarea", rows: 2, contextKey: "odontoSummary", placeholder: "Describe zonas a rehabilitar." },
      { id: "diseno_protesis_removible", label: "Diseno de protesis removible", type: "textarea", rows: 2, contextKey: "treatmentPlan", placeholder: "Conector mayor, retenedores y apoyos." },
      { id: "elementos_retencion", label: "Retencion y soporte", type: "textarea", rows: 2, contextKey: "background", placeholder: "Elementos seleccionados de retencion/soporte." },
      { id: "indicaciones_protesis_removible", label: "Indicaciones de uso", type: "textarea", rows: 2, contextKey: "notes", placeholder: "Uso, higiene y cuidados de la protesis." },
      { id: "pronostico_protesis_removible", label: "Pronostico", type: "text", contextKey: "prognosis", placeholder: "Pronostico funcional del caso." }
    ]
  },
  "f6-prostodoncia": {
    title: "Formato 6: Prostodoncia total/parcial",
    fields: [
      { id: "estado_reborde", label: "Estado del reborde alveolar", type: "textarea", rows: 2, contextKey: "diagnosis", placeholder: "Reborde favorable, reabsorbido, etc." },
      { id: "dimension_vertical", label: "Dimension vertical / relacion maxilomandibular", type: "textarea", rows: 2, contextKey: "background", placeholder: "Registros obtenidos en consulta." },
      { id: "plan_prostodoncia", label: "Plan prostodontico", type: "textarea", rows: 2, contextKey: "treatmentPlan", placeholder: "Secuencia de citas y procedimientos." },
      { id: "pruebas_prostodoncia", label: "Pruebas esteticas y foneticas", type: "textarea", rows: 2, contextKey: "notes", placeholder: "Resultados de pruebas clinicas." },
      { id: "adaptacion_prostodoncia", label: "Adaptacion del paciente", type: "text", contextKey: "consultReason", placeholder: "Confort, masticacion y fonacion." },
      { id: "pronostico_prostodoncia", label: "Pronostico", type: "text", contextKey: "prognosis", placeholder: "Pronostico general de la rehabilitacion." }
    ]
  },
  "f7-cirugia-bucal": {
    title: "Formato 7: Cirugia bucal",
    fields: [
      { id: "motivo_cirugia", label: "Motivo quirurgico", type: "textarea", rows: 2, contextKey: "consultReason", placeholder: "Dolor, infeccion, tercer molar incluido, etc." },
      { id: "diagnostico_cirugia", label: "Diagnostico quirurgico", type: "textarea", rows: 2, contextKey: "diagnosis", placeholder: "Diagnostico y localizacion de la lesion." },
      { id: "procedimiento_cirugia", label: "Procedimiento realizado", type: "textarea", rows: 2, contextKey: "treatmentPlan", placeholder: "Tecnica quirurgica empleada." },
      { id: "medicacion_cirugia", label: "Medicacion indicada", type: "textarea", rows: 2, contextKey: "medications", placeholder: "Antibiotico, analgesico, antiinflamatorio, etc." },
      { id: "cuidados_posoperatorios", label: "Cuidados postoperatorios", type: "textarea", rows: 2, contextKey: "notes", placeholder: "Indicaciones entregadas al paciente." },
      { id: "pronostico_cirugia", label: "Pronostico", type: "text", contextKey: "prognosis", placeholder: "Pronostico del procedimiento." }
    ]
  },
  "f8-periodoncia": {
    title: "Formato 8: Periodoncia",
    fields: [
      { id: "diagnostico_periodontal", label: "Diagnostico periodontal", type: "textarea", rows: 2, contextKey: "diagnosis", placeholder: "Gingivitis, periodontitis, estadio, grado." },
      { id: "profundidad_bolsas", label: "Profundidad de bolsas y movilidad", type: "textarea", rows: 2, contextKey: "background", placeholder: "Registros por sextantes o piezas." },
      { id: "sangrado_periodontal", label: "Sangrado al sondaje / inflamacion", type: "textarea", rows: 2, contextKey: "consultReason", placeholder: "Hallazgos clinicos iniciales." },
      { id: "plan_periodontal", label: "Plan periodontal", type: "textarea", rows: 2, contextKey: "treatmentPlan", placeholder: "Raspado, alisado, control de placa, etc." },
      { id: "fase_mantenimiento", label: "Fase de mantenimiento", type: "textarea", rows: 2, contextKey: "notes", placeholder: "Frecuencia y objetivos de mantenimiento." },
      { id: "pronostico_periodontal", label: "Pronostico", type: "text", contextKey: "prognosis", placeholder: "Pronostico periodontal por caso." }
    ]
  },
  "f9-endodoncia": {
    title: "Formato 9: Endodoncia",
    fields: [
      { id: "pieza_endodoncia", label: "Pieza tratada", type: "text", contextKey: "odontoSummary", placeholder: "Ejemplo: 11, 21, 36." },
      { id: "diagnostico_pulpar", label: "Diagnostico pulpar/periapical", type: "textarea", rows: 2, contextKey: "diagnosis", placeholder: "Diagnostico endodontico." },
      { id: "pruebas_endodoncia", label: "Pruebas de sensibilidad y percusion", type: "textarea", rows: 2, contextKey: "background", placeholder: "Resultados de pruebas diagnosticas." },
      { id: "tecnica_endodoncia", label: "Tecnica de instrumentacion/obturacion", type: "textarea", rows: 2, contextKey: "treatmentPlan", placeholder: "Tecnica y material utilizado." },
      { id: "control_endodoncia", label: "Control y evolucion", type: "textarea", rows: 2, contextKey: "notes", placeholder: "Seguimiento clinico y radiografico." },
      { id: "pronostico_endodoncia", label: "Pronostico", type: "text", contextKey: "prognosis", placeholder: "Pronostico de la pieza tratada." }
    ]
  },
  "f10-ortodoncia": {
    title: "Formato 10: Ortodoncia y ortopedia maxilar",
    fields: [
      { id: "analisis_facial", label: "Analisis facial y esqueletal", type: "textarea", rows: 2, contextKey: "diagnosis", placeholder: "Clase esqueletal, perfil y simetria." },
      { id: "diagnostico_oclusal", label: "Diagnostico oclusal", type: "textarea", rows: 2, contextKey: "background", placeholder: "Relaciones molares/caninas, overjet, overbite." },
      { id: "objetivo_ortodoncia", label: "Objetivo de tratamiento", type: "textarea", rows: 2, contextKey: "consultReason", placeholder: "Objetivos funcionales y esteticos." },
      { id: "plan_ortodontico", label: "Plan ortodontico", type: "textarea", rows: 2, contextKey: "treatmentPlan", placeholder: "Tipo de aparatologia y fases." },
      { id: "seguimiento_ortodoncia", label: "Seguimiento y controles", type: "textarea", rows: 2, contextKey: "notes", placeholder: "Ajustes y respuesta del paciente." },
      { id: "pronostico_ortodoncia", label: "Pronostico", type: "text", contextKey: "prognosis", placeholder: "Pronostico del tratamiento ortodontico." }
    ]
  },
  "f11-odontopediatria": {
    title: "Formato 11: Odontopediatria",
    fields: [
      { id: "responsable_nino", label: "Tutor o responsable", type: "text", contextKey: "background", placeholder: "Nombre del tutor responsable." },
      { id: "conducta_paciente_pediatrico", label: "Conducta del paciente pediatrico", type: "textarea", rows: 2, contextKey: "consultReason", placeholder: "Cooperador, ansioso, etc." },
      { id: "diagnostico_odontopediatria", label: "Diagnostico odontopediatrico", type: "textarea", rows: 2, contextKey: "diagnosis", placeholder: "Hallazgos clinicos de denticion temporal/mixta." },
      { id: "plan_odontopediatria", label: "Plan preventivo/terapeutico", type: "textarea", rows: 2, contextKey: "treatmentPlan", placeholder: "Selladores, fluor, restauraciones, etc." },
      { id: "indicaciones_tutor", label: "Indicaciones al tutor", type: "textarea", rows: 2, contextKey: "notes", placeholder: "Cuidados en casa y control dietetico." },
      { id: "pronostico_odontopediatria", label: "Pronostico", type: "text", contextKey: "prognosis", placeholder: "Pronostico del caso pediatrico." }
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
    motivo_consulta: { matches: ["padecimiento actual", "motivo de consulta"], maxWidth: 360, maxLines: 3, pageOffset: 1, x: 148, y: 234.2, dx: 0 },
    antecedentes_estomatologicos: { matches: ["antecedentes personales patologicos", "antecedentes personales y familiares"], maxWidth: 280, maxLines: 3, pageOffset: 1, x: 265, y: 658.2, dx: 0 },
    habitos_higienicos_diarios: { matches: ["habitos higienicos en el vestuario"], maxWidth: 128, maxLines: 1, pageOffset: 1, x: 206.6, y: 474.2, maxChars: 30 },
    diagnostico_estomatologico: { matches: ["diagnostico"], maxWidth: 380, maxLines: 2, pageOffset: 8, x: 126, y: 659.6, dx: 0 },
    plan_estomatologico: { matches: ["plan de tratamiento"], maxWidth: 330, maxLines: 3, pageOffset: 8, x: 176, y: 571.6, dx: 0 },
    pronostico_estomatologico: { matches: ["pronostico"], maxWidth: 330, maxLines: 2, pageOffset: 8, x: 176, y: 523.6, dx: 0 },
    observaciones_f1: { matches: ["observaciones"], maxWidth: 330, maxLines: 3, pageOffset: 8, x: 176, y: 475.6, dx: 0 }
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

