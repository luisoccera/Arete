"use strict";

const STORAGE_KEY = "arete_data_v1";
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
  { id: "dis-hipertension", name: "Hipertension", color: "#f59e0b" },
  { id: "dis-diabetes", name: "Diabetes", color: "#ef4444" },
  { id: "dis-cardiaca", name: "Enfermedad cardiaca", color: "#0ea5e9" },
  { id: "dis-embarazo", name: "Embarazo", color: "#22c55e" }
];

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

const el = {
  newPatientBtn: document.getElementById("newPatientBtn"),
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
  brushTimes: document.getElementById("brushTimes"),
  flossHabit: document.getElementById("flossHabit"),
  hasCaries: document.getElementById("hasCaries"),
  otherConditions: document.getElementById("otherConditions")
};

let state = loadState();
let draftPatient = createEmptyPatient();
let editingPatientId = null;
let selectedStatusId = "";
let activeView = "home";
let activePatientSubview = "profile";
let storageMode = "local";
let remotePersistTimer = null;
let remotePersistInFlight = false;
let remotePersistPending = false;
const apiBaseUrl = resolveApiBaseUrl();
let clientPdfModulesPromise = null;
let clientTemplateBytesPromise = null;
let clientTemplateTextPromise = null;

init();

function init() {
  bindEvents();
  setActiveView("home");
  renderAll();
  startNewPatient(false);
  initializeBackendStorage();
}

function bindEvents() {
  el.newPatientBtn.addEventListener("click", () => {
    setActiveView("home");
    startNewPatient(true);
  });
  el.openPathologiesBtn.addEventListener("click", focusPathologiesSection);
  for (const button of el.viewTabs) {
    button.addEventListener("click", () => {
      const targetView = button.getAttribute("data-view-tab");
      setActiveView(targetView);
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

function setActiveView(view) {
  const validViews = new Set(["home", "registry", "upcoming"]);
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
  const validViews = new Set(["profile", "odontogram", "history"]);
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

function handleToothNodeClick(event) {
  const toothBtn = event.target.closest("[data-tooth-id]");
  if (!toothBtn) {
    return;
  }
  applyOdontoMark("teeth", toothBtn.getAttribute("data-tooth-id"));
}

function createBaseState() {
  return {
    diseases: deepClone(DEFAULT_DISEASES),
    toothStatuses: deepClone(DEFAULT_TOOTH_STATUSES),
    patients: []
  };
}

function createEmptyClinicalFormData() {
  const data = {};
  for (const recordType of CLINICAL_RECORD_TYPES) {
    data[recordType.id] = {};
  }
  return data;
}

function createEmptyPatient() {
  return {
    id: null,
    name: "",
    age: "",
    sex: "",
    location: "",
    birthDate: "",
    phone: "",
    occupation: "",
    medications: "",
    dentistName: "",
    allergies: "",
    clinicalRecordType: CLINICAL_RECORD_TYPES[0].id,
    clinicalRecordReference: "",
    consultationDate: "",
    nextConsultationDate: "",
    treatmentStart: "",
    brushTimes: "",
    flossHabit: "",
    hasCaries: "",
    otherConditions: "",
    clinicalFormData: createEmptyClinicalFormData(),
    diseaseIds: [],
    appointments: [],
    odontogramMode: "adult",
    odontogram: {
      teeth: {},
      zones: {}
    },
    historyEntries: [],
    createdAt: "",
    updatedAt: ""
  };
}

function normalizeState(raw) {
  const base = createBaseState();
  const diseases = normalizeCatalog(raw?.diseases, "dis", "#d97706", base.diseases);
  const toothStatuses = normalizeCatalog(raw?.toothStatuses, "st", "#ef4444", base.toothStatuses);
  const patients = Array.isArray(raw?.patients) ? raw.patients.map(normalizePatient) : [];

  return {
    diseases,
    toothStatuses,
    patients
  };
}

function normalizeCatalog(items, prefix, fallbackColor, fallbackItems) {
  if (!Array.isArray(items) || items.length === 0) {
    return deepClone(fallbackItems);
  }

  const seen = new Set();
  const normalized = [];

  for (const item of items) {
    const name = typeof item?.name === "string" ? item.name.trim() : "";
    if (!name) {
      continue;
    }

    const key = name.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    normalized.push({
      id: typeof item.id === "string" && item.id.trim() ? item.id : generateId(prefix),
      name,
      color: sanitizeColor(item.color, fallbackColor)
    });
  }

  return normalized.length > 0 ? normalized : deepClone(fallbackItems);
}

function normalizePatient(rawPatient) {
  const empty = createEmptyPatient();
  const patient = {
    ...empty,
    ...rawPatient
  };

  patient.name = stringOrEmpty(patient.name);
  patient.sex = stringOrEmpty(patient.sex);
  patient.location = stringOrEmpty(patient.location);
  patient.birthDate = stringOrEmpty(patient.birthDate);
  patient.phone = stringOrEmpty(patient.phone);
  patient.occupation = stringOrEmpty(patient.occupation);
  patient.medications = stringOrEmpty(patient.medications);
  patient.dentistName = stringOrEmpty(patient.dentistName);
  patient.allergies = stringOrEmpty(patient.allergies);
  patient.clinicalRecordType = normalizeClinicalRecordType(
    patient.clinicalRecordType || patient.recordType || patient.historyType
  );
  patient.clinicalRecordReference = stringOrEmpty(
    patient.clinicalRecordReference || patient.recordReference || patient.folio
  );
  patient.clinicalFormData = normalizeClinicalFormData(
    patient.clinicalFormData || patient.clinicalForms || patient.formDataByType
  );
  patient.consultationDate = stringOrEmpty(patient.consultationDate);
  patient.nextConsultationDate = stringOrEmpty(
    patient.nextConsultationDate || patient.nextConsultation || patient.followUpDate
  );
  patient.treatmentStart = stringOrEmpty(patient.treatmentStart);
  patient.flossHabit = stringOrEmpty(patient.flossHabit);
  patient.hasCaries = stringOrEmpty(patient.hasCaries);
  patient.otherConditions = stringOrEmpty(patient.otherConditions);
  patient.createdAt = stringOrEmpty(patient.createdAt);
  patient.updatedAt = stringOrEmpty(patient.updatedAt);
  patient.age = numberOrEmpty(patient.age);
  patient.brushTimes = numberOrEmpty(patient.brushTimes);

  if (!patient.id || typeof patient.id !== "string") {
    patient.id = generateId("pt");
  }

  patient.diseaseIds = Array.isArray(patient.diseaseIds)
    ? patient.diseaseIds.filter((id) => typeof id === "string")
    : [];
  patient.appointments = normalizeAppointments(patient.appointments);

  patient.odontogramMode = isValidDentitionMode(patient.odontogramMode) ? patient.odontogramMode : "adult";

  patient.odontogram = {
    teeth: normalizeMarks(patient.odontogram?.teeth),
    zones: normalizeMarks(patient.odontogram?.zones)
  };
  patient.historyEntries = normalizeHistoryEntries(
    patient.historyEntries || patient.clinicalHistory || patient.odontogramHistory
  );

  return patient;
}

function normalizeAppointments(rawAppointments) {
  if (!Array.isArray(rawAppointments)) {
    return [];
  }

  const appointments = [];
  for (const item of rawAppointments) {
    const date = stringOrEmpty(item?.date);
    if (!date) {
      continue;
    }

    appointments.push({
      id: stringOrEmpty(item?.id) || generateId("apt"),
      date,
      time: stringOrEmpty(item?.time),
      reason: stringOrEmpty(item?.reason)
    });
  }

  appointments.sort((a, b) => {
    const aTs = getAppointmentTimestamp(a.date, a.time);
    const bTs = getAppointmentTimestamp(b.date, b.time);
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
  return appointments;
}

function normalizeClinicalRecordType(value) {
  const candidate = stringOrEmpty(value);
  if (!candidate) {
    return CLINICAL_RECORD_TYPES[0].id;
  }
  const exists = CLINICAL_RECORD_TYPES.some((type) => type.id === candidate);
  return exists ? candidate : CLINICAL_RECORD_TYPES[0].id;
}

function getClinicalFormSchema(formatId) {
  const safeId = normalizeClinicalRecordType(formatId);
  return CLINICAL_FORM_SCHEMAS[safeId] || CLINICAL_FORM_SCHEMAS[CLINICAL_RECORD_TYPES[0].id];
}

function normalizeClinicalFormData(rawData) {
  const base = createEmptyClinicalFormData();
  const source = rawData && typeof rawData === "object" ? rawData : {};

  for (const type of CLINICAL_RECORD_TYPES) {
    const typeId = type.id;
    const schema = getClinicalFormSchema(typeId);
    const entry = source[typeId];
    const normalized = {};

    for (const field of schema.fields) {
      normalized[field.id] = stringOrEmpty(entry?.[field.id]);
    }
    base[typeId] = normalized;
  }

  return base;
}

function normalizeHistoryEntries(rawEntries) {
  if (!Array.isArray(rawEntries)) {
    return [];
  }

  const normalized = [];
  for (const entry of rawEntries) {
    const title = stringOrEmpty(entry?.title);
    const description = stringOrEmpty(entry?.description);
    const createdAt = stringOrEmpty(entry?.createdAt);

    if (!title && !description) {
      continue;
    }

    normalized.push({
      id: stringOrEmpty(entry?.id) || generateId("hist"),
      type: stringOrEmpty(entry?.type) || "clinical-note",
      title: title || "Registro clinico",
      description,
      createdAt: isValidDate(createdAt) ? createdAt : new Date().toISOString(),
      statusIds: normalizeHistoryStatusIds(entry?.statusIds)
    });
  }

  normalized.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return normalized;
}

function normalizeHistoryStatusIds(rawStatusIds) {
  if (!Array.isArray(rawStatusIds)) {
    return [];
  }

  const out = [];
  const seen = new Set();
  for (const statusId of rawStatusIds) {
    if (typeof statusId !== "string") {
      continue;
    }
    const clean = statusId.trim();
    if (!clean || seen.has(clean)) {
      continue;
    }
    seen.add(clean);
    out.push(clean);
  }
  return out;
}

function normalizeMarks(rawMarks) {
  if (!rawMarks || typeof rawMarks !== "object") {
    return {};
  }

  const marks = {};
  for (const [key, value] of Object.entries(rawMarks)) {
    const list = normalizeMarkList(value);
    if (list.length > 0) {
      marks[String(key)] = list;
    }
  }
  return marks;
}

function normalizeMarkList(value) {
  if (typeof value === "string") {
    const v = value.trim();
    return v ? [v] : [];
  }

  if (!Array.isArray(value)) {
    return [];
  }

  const out = [];
  const seen = new Set();
  for (const item of value) {
    if (typeof item !== "string") {
      continue;
    }
    const v = item.trim();
    if (!v || seen.has(v)) {
      continue;
    }
    seen.add(v);
    out.push(v);
  }
  return out;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createBaseState();
    }
    return normalizeState(JSON.parse(raw));
  } catch (error) {
    console.error("No se pudo cargar datos:", error);
    return createBaseState();
  }
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (storageMode === "backend") {
    queueRemotePersist();
  }
}

function resolveApiBaseUrl() {
  const queryApi = stringOrEmpty(new URLSearchParams(window.location.search).get("api"));
  if (queryApi) {
    localStorage.setItem("arete_api_base", queryApi);
    return queryApi.replace(/\/$/, "");
  }

  const storedApi = stringOrEmpty(localStorage.getItem("arete_api_base"));
  if (storedApi) {
    return storedApi.replace(/\/$/, "");
  }

  if (window.location.protocol === "file:" || window.location.hostname.endsWith("github.io")) {
    return "";
  }

  return window.location.origin;
}

function resolveStaticAssetUrl(relativePath) {
  const asset = String(relativePath || "").replace(/^\.?\//, "");
  if (!asset) {
    return window.location.href;
  }

  if (window.location.hostname.endsWith("github.io")) {
    const parts = String(window.location.pathname || "/").split("/").filter(Boolean);
    const repoSegment = parts.length > 0 ? parts[0] : "";
    const basePath = repoSegment ? `/${repoSegment}/` : "/";
    return `${window.location.origin}${basePath}${asset}`;
  }

  return new URL(asset, document.baseURI).toString();
}

async function initializeBackendStorage() {
  if (!apiBaseUrl) {
    return;
  }

  try {
    const healthResponse = await apiRequest("/api/health", { method: "GET" }, 3500);
    if (!healthResponse.ok) {
      return;
    }

    storageMode = "backend";
    const stateResponse = await apiRequest("/api/state", { method: "GET" }, 5000);
    if (!stateResponse.ok) {
      setFeedback("Backend detectado, pero no se pudo leer el estado inicial.", "error");
      return;
    }

    const payload = await stateResponse.json();
    state = normalizeState(payload?.data || payload);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    renderAll();
    if (!editingPatientId) {
      startNewPatient(false);
    }
    setFeedback("Backend conectado. Datos sincronizados correctamente.");
  } catch (error) {
    console.error("Backend no disponible. Continuando en modo local.", error);
  }
}

function queueRemotePersist() {
  remotePersistPending = true;
  if (remotePersistTimer) {
    clearTimeout(remotePersistTimer);
  }
  remotePersistTimer = window.setTimeout(() => {
    void flushRemotePersist();
  }, 180);
}

async function flushRemotePersist() {
  if (remotePersistInFlight || !remotePersistPending || storageMode !== "backend") {
    return;
  }

  remotePersistPending = false;
  remotePersistInFlight = true;
  try {
    const response = await apiRequest(
      "/api/state",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: state })
      },
      9000
    );

    if (!response.ok) {
      throw new Error(`Backend respondio ${response.status}`);
    }
  } catch (error) {
    console.error("No se pudo guardar en backend.", error);
    storageMode = "local";
    setFeedback("Fallo el backend. La app continuo en modo local para no perder cambios.", "error");
  } finally {
    remotePersistInFlight = false;
  }

  if (remotePersistPending) {
    void flushRemotePersist();
  }
}

async function apiRequest(pathname, options, timeoutMs) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs || 5000);
  try {
    return await fetch(`${apiBaseUrl}${pathname}`, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

function renderAll() {
  renderStatusSelect();
  renderDentitionSwitch();
  renderDiseaseChecklist();
  renderDiseaseCatalog();
  renderStatusCatalog();
  renderOdontogram();
  renderClinicalFormatFields();
  renderAppointmentList();
  renderPatientTable();
  renderUpcomingAppointments();
  renderPatientHistory();
  setActivePatientSubview(activePatientSubview);
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
      const diseaseNames = patient.diseaseIds
        .map((id) => getDiseaseById(id)?.name || "")
        .join(" ");
      const haystack = [
        patient.name,
        patient.phone,
        patient.location,
        patient.dentistName,
        diseaseNames
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    })
    .sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));

  if (patients.length === 0) {
    el.patientRows.innerHTML = "<tr><td colspan=\"5\">No hay pacientes para mostrar.</td></tr>";
    renderUpcomingAppointments();
    return;
  }

  const rowsHtml = patients
    .map((patient) => {
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
        ? `${formatDate(nextAppointment.date)}${nextAppointment.time ? ` ${nextAppointment.time}` : ""}`
        : nextConsultationDate
          ? formatDate(nextConsultationDate)
          : formatDate(patient.consultationDate);

      return `
        <tr class="${patient.id === editingPatientId ? "active" : ""}">
          <td>
            <div class="patient-name-cell">
              <strong>${escapeHtml(patient.name || "Sin nombre")}</strong>
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
  renderUpcomingAppointments();
}

function renderUpcomingAppointments() {
  const now = Date.now();
  const todayStart = getStartOfToday().getTime();
  const entries = [];

  for (const patient of state.patients) {
    const appointments = normalizeAppointments(patient.appointments);
    if (appointments.length > 0) {
      for (const appointment of appointments) {
        const info = getAppointmentDateInfo(appointment.date, appointment.time);
        if (!info) {
          continue;
        }
        const threshold = info.hasTime ? now : todayStart;
        if (info.timestamp >= threshold) {
          entries.push({
            patientId: patient.id,
            patientName: patient.name || "Sin nombre",
            date: appointment.date,
            time: appointment.time || "",
            dentistName: patient.dentistName || "Sin dentista",
            reason: appointment.reason || "Sin motivo",
            sortTimestamp: info.timestamp
          });
        }
      }
      continue;
    }

    const nextConsultationInfo = getAppointmentDateInfo(patient.nextConsultationDate, "");
    if (nextConsultationInfo && nextConsultationInfo.timestamp >= todayStart) {
      entries.push({
        patientId: patient.id,
        patientName: patient.name || "Sin nombre",
        date: patient.nextConsultationDate,
        time: "",
        dentistName: patient.dentistName || "Sin dentista",
        reason: "Proxima consulta",
        sortTimestamp: nextConsultationInfo.timestamp
      });
      continue;
    }

    const consultationInfo = getAppointmentDateInfo(patient.consultationDate, "");
    if (consultationInfo && consultationInfo.timestamp >= todayStart) {
      entries.push({
        patientId: patient.id,
        patientName: patient.name || "Sin nombre",
        date: patient.consultationDate,
        time: "",
        dentistName: patient.dentistName || "Sin dentista",
        reason: "Consulta general",
        sortTimestamp: consultationInfo.timestamp
      });
    }
  }

  entries.sort((a, b) => {
    if (a.sortTimestamp !== b.sortTimestamp) {
      return a.sortTimestamp - b.sortTimestamp;
    }
    return a.patientName.localeCompare(b.patientName, "es", { sensitivity: "base" });
  });

  const upcoming = entries.slice(0, 40);
  el.upcomingCount.textContent = String(upcoming.length);

  if (upcoming.length === 0) {
    el.upcomingList.innerHTML = "<div class=\"history-empty\">No hay citas proximas registradas.</div>";
    return;
  }

  el.upcomingList.innerHTML = upcoming
    .map((entry) => `
      <div class="upcoming-item">
        <div class="upcoming-main">
          <span class="upcoming-name">${escapeHtml(entry.patientName)}</span>
          <span class="upcoming-meta">${escapeHtml(formatDate(entry.date))}${entry.time ? ` - ${escapeHtml(entry.time)}` : ""} | ${escapeHtml(entry.reason)} | ${escapeHtml(entry.dentistName)}</span>
        </div>
        <button type="button" class="table-btn" data-open-id="${entry.patientId}">Abrir</button>
      </div>
    `)
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
      const aTs = getAppointmentTimestamp(a.date, a.time);
      const bTs = getAppointmentTimestamp(b.date, b.time);
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
          <div class="appointment-title">${escapeHtml(formatDate(appointment.date))}${appointment.time ? ` - ${escapeHtml(appointment.time)}` : ""}</div>
          <div class="appointment-meta">${escapeHtml(appointment.reason || "Sin motivo especificado.")}</div>
        </div>
        <button type="button" class="catalog-btn" data-remove-appointment-id="${appointment.id}">Quitar</button>
      </article>
    `)
    .join("");
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
    setFeedback(`Estado ${statusName} agregado. Esta pieza ya puede tener multiples colores en filas.`);
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

  setActiveView("home");
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
  resetClinicalNoteInputs();
  updateDeleteCurrentButtonState();
  setFeedback(`Editando expediente de ${found.name}.`);
}

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
  renderPatientHistory();
  resetAppointmentInputs();
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
  renderPatientHistory();
  resetAppointmentInputs();
  updateDeleteCurrentButtonState();
  setFormTitle();
  setFeedback(`Paciente ${normalized.name} guardado correctamente.`);
}

function deletePatient(id) {
  const patient = state.patients.find((entry) => entry.id === id);
  if (!patient) {
    return;
  }

  const approved = window.confirm(`Se eliminara el paciente "${patient.name}". Esta accion no se puede deshacer.`);
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
  setFeedback(`Paciente ${patient.name} eliminado.`);
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
  draftPatient.hasCaries = stringOrEmpty(el.hasCaries.value);
  draftPatient.otherConditions = stringOrEmpty(el.otherConditions.value);

  const diseaseInputs = el.diseaseChecklist.querySelectorAll("input[type=\"checkbox\"]");
  draftPatient.diseaseIds = Array.from(diseaseInputs)
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => checkbox.value);
}

function hydrateFormFromDraft() {
  el.patientName.value = draftPatient.name || "";
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
  el.hasCaries.value = draftPatient.hasCaries || "";
  el.otherConditions.value = draftPatient.otherConditions || "";
  renderClinicalFormatFields();
}

function focusPathologiesSection() {
  setActiveView("home");
  setActivePatientSubview("profile");
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
  try {
    const result = await requestOfficialClinicalPdf();
    const printed = await printPdfBlob(result.blob);
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

function printPdfBlob(blob) {
  return new Promise((resolve, reject) => {
    if (isLikelyIOSLikeBrowser()) {
      const mode = triggerPdfDownload(blob, `${sanitizeFileName(draftPatient.name || "paciente")}-impresion.pdf`);
      resolve(mode === "opened" ? false : true);
      return;
    }

    const objectUrl = URL.createObjectURL(blob);
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
          window.setTimeout(complete, 1600);
        } catch (error) {
          finalize(() => reject(error instanceof Error ? error : new Error("Error al imprimir el PDF.")));
        }
      }, 220);
    };

    document.body.appendChild(frame);
    frame.src = objectUrl;
  });
}

function getClinicalRecordTypeById(id) {
  return CLINICAL_RECORD_TYPES.find((type) => type.id === id) || CLINICAL_RECORD_TYPES[0];
}

function setPdfActionState(isBusy, action) {
  const busy = Boolean(isBusy);
  if (el.exportClinicalDocBtn) {
    el.exportClinicalDocBtn.disabled = busy;
    el.exportClinicalDocBtn.textContent = busy
      ? (action === "download" ? "Generando PDF..." : "Descargar PDF oficial")
      : "Descargar PDF oficial";
  }
  if (el.printClinicalDocBtn) {
    el.printClinicalDocBtn.disabled = busy;
    el.printClinicalDocBtn.textContent = busy
      ? (action === "print" ? "Preparando..." : "Imprimir PDF")
      : "Imprimir PDF";
  }
}

function isLikelyIOSLikeBrowser() {
  const ua = String(window.navigator.userAgent || "");
  const platform = String(window.navigator.platform || "");
  const maxTouchPoints = Number(window.navigator.maxTouchPoints || 0);
  const iOSDevice = /iPad|iPhone|iPod/i.test(ua);
  const iPadDesktopMode = platform === "MacIntel" && maxTouchPoints > 1;
  return iOSDevice || iPadDesktopMode;
}

function triggerPdfDownload(blob, fileName) {
  const objectUrl = URL.createObjectURL(blob);
  const supportsDownloadAttribute = "download" in HTMLAnchorElement.prototype;
  const needsOpenFallback = isLikelyIOSLikeBrowser() || !supportsDownloadAttribute;

  if (needsOpenFallback) {
    const popup = window.open(objectUrl, "_blank", "noopener,noreferrer");
    if (!popup) {
      window.location.assign(objectUrl);
    }
    window.setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 60000);
    return "opened";
  }

  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
    link.remove();
  }, 1500);
  return "downloaded";
}

async function requestOfficialClinicalPdf() {
  const recordType = getClinicalRecordTypeById(draftPatient.clinicalRecordType);
  const payload = {
    formatId: recordType.id,
    patient: normalizePatient(draftPatient),
    clinicalContext: buildClinicalContextFromForm(draftPatient, recordType.id),
    dictionaries: {
      diseases: Array.isArray(state.diseases) ? state.diseases : [],
      toothStatuses: Array.isArray(state.toothStatuses) ? state.toothStatuses : []
    }
  };

  let backendError = "";
  if (apiBaseUrl) {
    try {
      const response = await apiRequest(
        "/api/clinical-pdf",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        },
        35000
      );

      if (response.ok) {
        const blob = await response.blob();
        const contentDisposition = response.headers.get("content-disposition") || "";
        const fileName = extractFilenameFromDisposition(contentDisposition);
        return { blob, fileName, recordType };
      }

      let detail = "";
      try {
        const data = await response.json();
        detail = data?.error || data?.detail || "";
      } catch {
        detail = await response.text();
      }
      backendError = detail || "El backend no pudo generar el PDF oficial.";
    } catch {
      backendError = "No se pudo conectar con el backend para generar el PDF oficial.";
    }
  }

  try {
    const localResult = await generateOfficialClinicalPdfInBrowser(payload);
    return { ...localResult, recordType };
  } catch (error) {
    const localMessage = error?.message || "No se pudo generar el PDF en el navegador.";
    if (backendError) {
      throw new Error(`${backendError} ${localMessage}`);
    }
    throw new Error(localMessage);
  }
}

async function generateOfficialClinicalPdfInBrowser(payload) {
  const { pdfLib, pdfjsLib } = await loadClientPdfModules();
  const templateBytes = await loadClientTemplateBytes();
  const textData = await loadClientTemplateTextData(pdfjsLib, templateBytes);
  const selected = resolveClinicalFormatRange(payload?.formatId, textData.totalPages);
  const context = buildClinicalPdfContext(
    payload?.patient,
    payload?.dictionaries,
    selected.formatId,
    payload?.clinicalContext
  );

  const sourcePdf = await pdfLib.PDFDocument.load(templateBytes, { ignoreEncryption: true });
  const targetPdf = await pdfLib.PDFDocument.create();
  const sourcePageNumbers = [];
  for (let p = selected.start; p <= selected.end; p += 1) {
    sourcePageNumbers.push(p);
  }

  const copiedPages = await targetPdf.copyPages(sourcePdf, sourcePageNumbers.map((p) => p - 1));
  copiedPages.forEach((page) => targetPdf.addPage(page));

  const font = await targetPdf.embedFont(pdfLib.StandardFonts.Helvetica);
  copiedPages.forEach((page, idx) => {
    const sourcePageNo = sourcePageNumbers[idx];
    const items = textData.pages[sourcePageNo] || [];

    for (const rule of CLINICAL_PDF_LABEL_RULES) {
      const rawValue = rule.mark ? Boolean(rule.mark(context)) : context[rule.value];
      const value = rule.mark ? (rawValue ? "X" : "") : String(rawValue || "").trim();
      if (!value) {
        continue;
      }

      let hits = 0;
      const maxHits = rule.maxPerPage || 1;
      for (const item of items) {
        if (!matchClinicalPdfItem(item.norm, rule)) {
          continue;
        }
        drawClinicalPdfRule(page, font, value, item, rule, pdfLib);
        hits += 1;
        if (hits >= maxHits) {
          break;
        }
      }
    }
  });

  const pdfBytes = await targetPdf.save();
  const fileName = `${sanitizeFileName(context.fullName || "paciente")}-${selected.formatId}.pdf`;
  return {
    blob: new Blob([pdfBytes], { type: "application/pdf" }),
    fileName
  };
}

async function loadClientPdfModules() {
  if (!clientPdfModulesPromise) {
    clientPdfModulesPromise = (async () => {
      try {
        const [pdfLib, pdfjsLib] = await Promise.all([
          import(new URL("./vendor/pdf-lib.esm.min.js", document.baseURI).toString()),
          import(new URL("./vendor/pdf.min.mjs", document.baseURI).toString())
        ]);
        if (pdfjsLib?.GlobalWorkerOptions) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("./vendor/pdf.worker.min.mjs", document.baseURI).toString();
        }
        return { pdfLib, pdfjsLib };
      } catch {
        const [pdfLib, pdfjsLib] = await Promise.all([
          import("https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm"),
          import("https://cdn.jsdelivr.net/npm/pdfjs-dist@5.6.205/legacy/build/pdf.mjs")
        ]);
        if (pdfjsLib?.GlobalWorkerOptions) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.6.205/legacy/build/pdf.worker.mjs";
        }
        return { pdfLib, pdfjsLib };
      }
    })().catch((error) => {
      clientPdfModulesPromise = null;
      throw error;
    });
  }
  return clientPdfModulesPromise;
}

async function loadClientTemplateBytes() {
  if (!clientTemplateBytesPromise) {
    const templateCandidates = Array.from(
      new Set([
        resolveStaticAssetUrl("data/uv-historias.pdf"),
        new URL("data/uv-historias.pdf", document.baseURI).toString(),
        new URL("./data/uv-historias.pdf", window.location.href).toString()
      ])
    );

    clientTemplateBytesPromise = (async () => {
      let lastError = "";
      for (const templateUrl of templateCandidates) {
        try {
          const response = await fetch(templateUrl, { cache: "no-store" });
          if (!response.ok) {
            lastError = `HTTP ${response.status} en ${templateUrl}`;
            continue;
          }

          const buffer = await response.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          const isPdf =
            bytes.length >= 5 &&
            bytes[0] === 0x25 &&
            bytes[1] === 0x50 &&
            bytes[2] === 0x44 &&
            bytes[3] === 0x46 &&
            bytes[4] === 0x2d;

          if (!isPdf) {
            const decoder = new TextDecoder("utf-8", { fatal: false });
            const preview = decoder.decode(bytes.slice(0, 120)).replace(/\s+/g, " ").trim();
            lastError = `La URL ${templateUrl} no devolvio un PDF valido. Vista previa: ${preview || "(sin contenido textual)"}`;
            continue;
          }

          return bytes;
        } catch (error) {
          lastError = `${templateUrl}: ${error?.message || "Error desconocido"}`;
        }
      }

      throw new Error(
        `No se pudo cargar la plantilla UV para generar el PDF oficial. ${lastError}`
      );
    })()
      .catch((error) => {
        clientTemplateBytesPromise = null;
        throw error;
      });
  }
  return clientTemplateBytesPromise;
}

async function loadClientTemplateTextData(pdfjsLib, templateBytes) {
  if (!clientTemplateTextPromise) {
    clientTemplateTextPromise = (async () => {
      const textMapCandidates = Array.from(
        new Set([
          resolveStaticAssetUrl("data/uv-historias.textmap.json"),
          new URL("data/uv-historias.textmap.json", document.baseURI).toString(),
          new URL("./data/uv-historias.textmap.json", window.location.href).toString()
        ])
      );

      for (const mapUrl of textMapCandidates) {
        try {
          const response = await fetch(mapUrl, { cache: "no-store" });
          if (!response.ok) {
            continue;
          }
          const rawMap = await response.json();
          const normalizedMap = normalizeClientTemplateTextMap(rawMap);
          if (normalizedMap.totalPages > 0) {
            return normalizedMap;
          }
        } catch {
          continue;
        }
      }

      try {
        const doc = await pdfjsLib.getDocument({ data: templateBytes, useSystemFonts: true }).promise;
        const pages = {};
        for (let pageNo = 1; pageNo <= doc.numPages; pageNo += 1) {
          const page = await doc.getPage(pageNo);
          const content = await page.getTextContent();
          pages[pageNo] = content.items
            .map((item) => {
              const raw = String(item?.str || "").trim();
              if (!raw) {
                return null;
              }
              return {
                raw,
                norm: normalizeClinicalPdfText(raw),
                x: Number(item.transform?.[4] || 0),
                y: Number(item.transform?.[5] || 0),
                w: Number(item.width || 0)
              };
            })
            .filter(Boolean);
        }
        return { totalPages: doc.numPages, pages };
      } catch (error) {
        throw new Error(
          `No se pudo analizar la plantilla oficial en este navegador. ${error?.message || "Error desconocido"}`
        );
      }
    })().catch((error) => {
      clientTemplateTextPromise = null;
      throw error;
    });
  }
  return clientTemplateTextPromise;
}

function normalizeClientTemplateTextMap(rawMap) {
  const source = rawMap && typeof rawMap === "object" ? rawMap : {};
  const totalPages = Number(source.totalPages || 0);
  const pagesSource = source.pages && typeof source.pages === "object" ? source.pages : {};
  const pages = {};

  for (const [pageNo, items] of Object.entries(pagesSource)) {
    if (!Array.isArray(items)) {
      continue;
    }
    pages[pageNo] = items
      .map((item) => {
        const raw = String(item?.raw || "").trim();
        if (!raw) {
          return null;
        }
        return {
          raw,
          norm: normalizeClinicalPdfText(item?.norm || raw),
          x: Number(item?.x || 0),
          y: Number(item?.y || 0),
          w: Number(item?.w || 0)
        };
      })
      .filter(Boolean);
  }

  return {
    totalPages: Number.isFinite(totalPages) && totalPages > 0 ? totalPages : 0,
    pages
  };
}

function resolveClinicalFormatRange(formatId, totalPages) {
  const safeId = CLINICAL_FORMAT_START_PAGES[formatId] ? formatId : CLINICAL_FORMAT_ORDER[0];
  const start = CLINICAL_FORMAT_START_PAGES[safeId];
  const idx = CLINICAL_FORMAT_ORDER.indexOf(safeId);
  const nextId = CLINICAL_FORMAT_ORDER[idx + 1];
  const end = nextId ? CLINICAL_FORMAT_START_PAGES[nextId] - 1 : totalPages;
  return { formatId: safeId, start, end };
}

function normalizeClinicalPdfText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9()\/\s.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDatePartsForClinicalPdf(value) {
  const text = String(value || "").trim();
  if (!text) {
    return { day: "", month: "", year: "", label: "-" };
  }

  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return { day: iso[3], month: iso[2], year: iso[1], label: `${iso[3]}/${iso[2]}/${iso[1]}` };
  }

  const latin = text.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/);
  if (latin) {
    const day = latin[1].padStart(2, "0");
    const month = latin[2].padStart(2, "0");
    return { day, month, year: latin[3], label: `${day}/${month}/${latin[3]}` };
  }

  return { day: "", month: "", year: "", label: text };
}

function splitClinicalFullName(fullName) {
  const words = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return { firstNames: "", lastNameFather: "", lastNameMother: "" };
  }
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

function truncateClinicalText(value, max) {
  const text = String(value || "").trim();
  if (!max || text.length <= max) {
    return text;
  }
  return `${text.slice(0, max - 1)}…`;
}

function summarizeClinicalList(items, maxItems) {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  if (list.length === 0) {
    return "";
  }
  const shown = list.slice(0, maxItems || list.length);
  const suffix = list.length > shown.length ? ` (+${list.length - shown.length})` : "";
  return `${shown.join(", ")}${suffix}`;
}

function summarizeClinicalOdontogram(patient, statusMap) {
  const marks = [];
  const teeth = patient?.odontogram?.teeth || {};
  const zones = patient?.odontogram?.zones || {};

  for (const key of Object.keys(teeth)) {
    const ids = Array.isArray(teeth[key]) ? teeth[key] : [];
    const names = ids.map((id) => statusMap.get(id) || id).filter(Boolean);
    if (names.length > 0) {
      marks.push(`Pieza ${key}: ${names.join("/")}`);
    }
  }
  for (const key of Object.keys(zones)) {
    const ids = Array.isArray(zones[key]) ? zones[key] : [];
    const names = ids.map((id) => statusMap.get(id) || id).filter(Boolean);
    if (names.length > 0) {
      marks.push(`Zona ${key}: ${names.join("/")}`);
    }
  }

  return summarizeClinicalList(marks, 4);
}

function summarizeClinicalNotes(patient) {
  const entries = Array.isArray(patient?.historyEntries) ? patient.historyEntries : [];
  const texts = entries
    .filter((entry) => String(entry?.type || "") === "clinical-note")
    .slice(0, 3)
    .map((entry) => {
      const title = String(entry?.title || "").trim();
      const body = String(entry?.description || "").trim();
      return [title, body].filter(Boolean).join(": ");
    })
    .filter(Boolean);
  return summarizeClinicalList(texts, 3);
}

function buildClinicalContextFromForm(patientInput, formatId) {
  const patient = normalizePatient(patientInput || {});
  const safeFormat = normalizeClinicalRecordType(formatId || patient.clinicalRecordType);
  const schema = getClinicalFormSchema(safeFormat);
  const values = patient.clinicalFormData?.[safeFormat] || {};
  const byKey = {};
  const detailLines = [];

  for (const field of schema.fields) {
    const value = stringOrEmpty(values[field.id]);
    if (!value) {
      continue;
    }

    detailLines.push(`${field.label}: ${value}`);
    if (field.contextKey) {
      byKey[field.contextKey] = byKey[field.contextKey]
        ? `${byKey[field.contextKey]} | ${value}`
        : value;
    }
  }

  return {
    formatId: safeFormat,
    byKey,
    details: detailLines
  };
}

function buildClinicalPdfContext(patientInput, dictionaries, formatId, clinicalContextInput) {
  const patient = normalizePatient(patientInput || {});
  const fullName = String(patient.name || "").trim();
  const nameParts = splitClinicalFullName(fullName);
  const consultDate = parseDatePartsForClinicalPdf(patient.consultationDate || patient.nextConsultationDate || "");
  const birthDate = parseDatePartsForClinicalPdf(patient.birthDate || "");

  const diseaseMap = new Map((dictionaries?.diseases || []).map((entry) => [entry.id, entry.name]));
  const statusMap = new Map((dictionaries?.toothStatuses || []).map((entry) => [entry.id, entry.name]));
  const diseaseNames = (Array.isArray(patient.diseaseIds) ? patient.diseaseIds : [])
    .map((id) => diseaseMap.get(id) || "")
    .filter(Boolean);
  const diseaseSummary = summarizeClinicalList(diseaseNames, 6);
  const odontoSummary = summarizeClinicalOdontogram(patient, statusMap);
  const notes = summarizeClinicalNotes(patient);

  const sexText = String(patient.sex || "").toLowerCase();
  const isMale = sexText.includes("masc");
  const isFemale = sexText.includes("fem");
  const consultationReason = String(patient.otherConditions || "").trim() || String(patient.medications || "").trim();
  const background = [patient.allergies, patient.medications].map((x) => String(x || "").trim()).filter(Boolean).join(" | ");
  const clinicalContext = clinicalContextInput || buildClinicalContextFromForm(patient, formatId);

  const context = {
    fullName,
    firstNames: nameParts.firstNames,
    lastNameFather: nameParts.lastNameFather,
    lastNameMother: nameParts.lastNameMother,
    recordReference: stringOrEmpty(patient.clinicalRecordReference),
    ageText: String(patient.age || "").trim(),
    ageYears: String(patient.age || "").trim(),
    ageMonths: "",
    sexLabel: String(patient.sex || "").trim(),
    isMale,
    isFemale,
    birthPlaceDate: [String(patient.location || "").trim(), birthDate.label !== "-" ? birthDate.label : ""].filter(Boolean).join(" - "),
    location: String(patient.location || "").trim(),
    locationShort: String(patient.location || "").trim(),
    occupation: String(patient.occupation || "").trim(),
    occupationAlt: String(patient.occupation || "").trim(),
    civilStatus: "No especificado",
    phone: String(patient.phone || "").trim(),
    dentistName: String(patient.dentistName || "").trim(),
    consultDateLabel: consultDate.label,
    consultDay: consultDate.day,
    consultMonth: consultDate.month,
    consultYear: consultDate.year,
    diagnosis: truncateClinicalText(diseaseSummary || "Sin patologias generales registradas", 180),
    prognosis: truncateClinicalText(String(patient.otherConditions || "").trim() || "Reservado", 120),
    treatmentPlan: truncateClinicalText(
      [String(patient.treatmentStart || "").trim() ? `Inicio: ${patient.treatmentStart}` : "", String(patient.otherConditions || "").trim()]
        .filter(Boolean)
        .join(" | ") || "Segun valoracion clinica.",
      180
    ),
    consultReason: truncateClinicalText(consultationReason || "Control clinico", 170),
    medications: truncateClinicalText(String(patient.medications || "").trim(), 170),
    allergies: truncateClinicalText(String(patient.allergies || "").trim(), 170),
    background: truncateClinicalText(background || "Sin antecedentes relevantes.", 180),
    notes: truncateClinicalText(notes || "Sin observaciones clinicas adicionales.", 170),
    odontoSummary: truncateClinicalText(odontoSummary || "Sin marcas registradas.", 170)
  };

  const maxByKey = {
    consultReason: 170,
    diagnosis: 180,
    treatmentPlan: 180,
    prognosis: 120,
    medications: 170,
    allergies: 170,
    background: 180,
    notes: 170,
    odontoSummary: 170
  };

  for (const [key, value] of Object.entries(clinicalContext.byKey || {})) {
    if (!value) {
      continue;
    }
    const max = maxByKey[key] || 180;
    context[key] = truncateClinicalText(value, max);
  }

  if (Array.isArray(clinicalContext.details) && clinicalContext.details.length > 0) {
    const detailsText = truncateClinicalText(clinicalContext.details.join(" | "), 260);
    context.notes = truncateClinicalText(
      context.notes ? `${context.notes} | ${detailsText}` : detailsText,
      170
    );
  }

  return context;
}

function matchClinicalPdfItem(itemNorm, rule) {
  for (const raw of rule.matches || []) {
    const token = normalizeClinicalPdfText(raw);
    if (!token) {
      continue;
    }
    if (rule.exact) {
      if (itemNorm === token) {
        return true;
      }
    } else if (itemNorm.includes(token)) {
      return true;
    }
  }
  return false;
}

function wrapClinicalPdfText(font, text, size, maxWidth) {
  if (!maxWidth) {
    return [text];
  }
  const words = String(text || "").split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [];
  }
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    const width = font.widthOfTextAtSize(candidate, size);
    if (width <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines;
}

function drawClinicalPdfRule(page, font, value, item, rule, pdfLib) {
  const size = rule.size || 7.4;
  let x = (item.x || 0) + (item.w || 0) + (rule.dx || 6);
  const y = (item.y || 0) + (rule.dy || -1);
  const maxWidth = rule.maxWidth || 190;
  const pageWidth = page.getWidth();
  if (x > pageWidth - 40) {
    x = Math.max(40, pageWidth - (maxWidth + 16));
  }

  const lines = wrapClinicalPdfText(font, String(value || ""), size, rule.maxWidth || 0);
  const maxLines = rule.maxLines || 2;
  const lineHeight = rule.lineHeight || size + 1.1;
  if (!rule.maxWidth) {
    page.drawText(lines[0] || "", { x, y, size, font, color: pdfLib.rgb(0, 0, 0) });
    return;
  }

  lines.slice(0, maxLines).forEach((line, idx) => {
    page.drawText(line, {
      x,
      y: y - idx * lineHeight,
      size,
      font,
      color: pdfLib.rgb(0, 0, 0)
    });
  });
}

function extractFilenameFromDisposition(disposition) {
  const value = String(disposition || "");
  const utfMatch = value.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch && utfMatch[1]) {
    try {
      return decodeURIComponent(utfMatch[1]).replace(/["']/g, "");
    } catch {
      return utfMatch[1].replace(/["']/g, "");
    }
  }
  const match = value.match(/filename=\"?([^\";]+)\"?/i);
  return match && match[1] ? match[1].trim() : "";
}

function sanitizeFileName(value) {
  return String(value || "archivo")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "archivo";
}

function setFormTitle() {
  if (editingPatientId) {
    el.formTitle.textContent = `Editando paciente: ${draftPatient.name || "Sin nombre"}`;
  } else {
    el.formTitle.textContent = "Nuevo paciente";
  }
}

function getDiseaseById(id) {
  return state.diseases.find((disease) => disease.id === id) || null;
}

function getStatusById(id) {
  return state.toothStatuses.find((status) => status.id === id) || null;
}

function setFeedback(text, mode) {
  el.feedbackMessage.textContent = text;
  el.feedbackMessage.dataset.mode = mode || "ok";
}

function calculateAgeFromDate(dateString) {
  const birthDate = new Date(dateString);
  if (Number.isNaN(birthDate.valueOf())) {
    return NaN;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const pendingBirthday = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate());
  if (pendingBirthday) {
    age -= 1;
  }
  return age;
}

function sanitizeColor(value, fallback) {
  const hex = typeof value === "string" ? value.trim() : "";
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex) ? hex : fallback;
}

function formatDate(dateString) {
  if (!dateString) {
    return "-";
  }
  const date = parseDateValue(dateString);
  if (!date) {
    return "-";
  }
  return date.toLocaleDateString("es-MX");
}

function formatDateTime(dateString) {
  if (!dateString) {
    return "-";
  }
  const date = new Date(dateString);
  if (Number.isNaN(date.valueOf())) {
    return "-";
  }
  return date.toLocaleString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getTodayInputDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getStartOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function getNextAppointmentForPatient(patient) {
  const appointments = normalizeAppointments(patient?.appointments);
  const now = Date.now();
  const todayStart = getStartOfToday().getTime();
  for (const appointment of appointments) {
    const info = getAppointmentDateInfo(appointment.date, appointment.time);
    if (!info) {
      continue;
    }
    const threshold = info.hasTime ? now : todayStart;
    if (info.timestamp >= threshold) {
      return appointment;
    }
  }
  return null;
}

function getNextConsultationDateForPatient(patient) {
  const dateValue = stringOrEmpty(patient?.nextConsultationDate);
  if (!dateValue) {
    return "";
  }
  const info = getAppointmentDateInfo(dateValue, "");
  if (!info) {
    return "";
  }
  const todayStart = getStartOfToday().getTime();
  return info.timestamp >= todayStart ? dateValue : "";
}

function parseDateValue(value) {
  const raw = stringOrEmpty(value);
  if (!raw) {
    return null;
  }

  const text = raw.trim();

  const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:$|[T\s].*)/);
  if (isoMatch) {
    return buildLocalDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
  }

  const latinMatch = text.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})(?:$|[T\s].*)/);
  if (latinMatch) {
    return buildLocalDate(Number(latinMatch[3]), Number(latinMatch[2]), Number(latinMatch[1]));
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.valueOf())) {
    return null;
  }
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function buildLocalDate(year, month, day) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function parseTimeParts(value) {
  const raw = stringOrEmpty(value);
  if (!raw) {
    return { hours: 0, minutes: 0, hasTime: false };
  }

  const match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return { hours: 0, minutes: 0, hasTime: false };
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return { hours: 0, minutes: 0, hasTime: false };
  }
  return { hours, minutes, hasTime: true };
}

function getAppointmentDateInfo(dateValue, timeValue) {
  const date = parseDateValue(dateValue);
  if (!date) {
    return null;
  }

  const time = parseTimeParts(timeValue);
  const dateTime = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    time.hours,
    time.minutes,
    0,
    0
  );

  return {
    timestamp: dateTime.getTime(),
    hasTime: time.hasTime
  };
}

function getAppointmentTimestamp(dateValue, timeValue) {
  const info = getAppointmentDateInfo(dateValue, timeValue);
  return info ? info.timestamp : null;
}

function isValidDate(value) {
  if (!value) {
    return false;
  }
  const date = new Date(value);
  return !Number.isNaN(date.valueOf());
}

function addHistoryEntry(entry) {
  if (!Array.isArray(draftPatient.historyEntries)) {
    draftPatient.historyEntries = [];
  }

  const normalizedEntry = {
    id: generateId("hist"),
    type: stringOrEmpty(entry?.type) || "clinical-note",
    title: stringOrEmpty(entry?.title) || "Registro clinico",
    description: stringOrEmpty(entry?.description),
    createdAt: isValidDate(entry?.createdAt) ? entry.createdAt : new Date().toISOString(),
    statusIds: normalizeHistoryStatusIds(entry?.statusIds)
  };

  draftPatient.historyEntries.unshift(normalizedEntry);

  if (draftPatient.historyEntries.length > 900) {
    draftPatient.historyEntries = draftPatient.historyEntries.slice(0, 900);
  }
}

function getHistoryTypeLabel(type) {
  if (type === "odontogram-change") {
    return "Odontograma";
  }
  if (type === "clinical-note") {
    return "Nota clinica";
  }
  return "Historial";
}

function getOdontoTargetLabel(bucket, key) {
  if (bucket === "teeth") {
    return `pieza ${key}`;
  }
  const zone = ODONTO_ZONES.find((entry) => entry.id === key);
  return zone ? `zona ${zone.name}` : `zona ${key}`;
}

function resetClinicalNoteInputs() {
  el.clinicalNoteDate.value = getTodayInputDate();
  el.clinicalNoteTitle.value = "";
  el.clinicalNoteText.value = "";
}

function resetAppointmentInputs() {
  el.appointmentDate.value = getTodayInputDate();
  el.appointmentTime.value = "";
  el.appointmentReason.value = "";
}

function getCurrentDentitionMode() {
  return isValidDentitionMode(draftPatient.odontogramMode) ? draftPatient.odontogramMode : "adult";
}

function isValidDentitionMode(mode) {
  return mode === "adult" || mode === "child";
}

function getToothPositionInfo(toothNumber) {
  const n = Number(toothNumber);
  const quadrant = Number.isFinite(n) ? Math.floor(n / 10) : 0;
  const unit = Number.isFinite(n) ? n % 10 : 0;
  const isUpper = quadrant === 1 || quadrant === 2 || quadrant === 5 || quadrant === 6;
  const isLeft = quadrant === 2 || quadrant === 3 || quadrant === 6 || quadrant === 7;
  return { quadrant, unit, isUpper, isLeft };
}

function getToothRenderSpec(toothNumber, mode) {
  const info = getToothPositionInfo(toothNumber);
  const map = mode === "child" ? CHILD_TOOTH_RENDER_MAP : ADULT_TOOTH_RENDER_MAP;
  const unitSpec = map[info.unit] || map[1];
  const sideSpec = info.isUpper ? unitSpec.upper : unitSpec.lower;

  return {
    path: sideSpec.path,
    width: sideSpec.width,
    height: sideSpec.height,
    mirror: info.isLeft
  };
}

function buildMultiColorBackground(colors) {
  const filtered = colors.filter((color) => typeof color === "string" && color.trim());
  if (filtered.length === 0) {
    return "transparent";
  }
  if (filtered.length === 1) {
    return filtered[0];
  }

  const stop = 100 / filtered.length;
  const gradientStops = filtered
    .map((color, index) => {
      const start = (index * stop).toFixed(2);
      const end = ((index + 1) * stop).toFixed(2);
      return `${color} ${start}%, ${color} ${end}%`;
    })
    .join(", ");

  return `linear-gradient(90deg, ${gradientStops})`;
}

function stringOrEmpty(value) {
  return typeof value === "string" ? value.trim() : "";
}

function numberOrEmpty(value) {
  if (value === "" || value === null || value === undefined) {
    return "";
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : "";
}

function toInputNumber(value) {
  return value === "" || value === null || value === undefined ? "" : String(value);
}

function deepClone(data) {
  return JSON.parse(JSON.stringify(data));
}

function generateId(prefix) {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
