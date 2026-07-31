const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { generateClinicalPdf, generateClinicalHistoryPdf } = require('../backend/src/clinical_pdf');

async function main() {
  const root = path.resolve(__dirname, '..');
  const writeFixtures = process.argv.includes('--write-fixtures');
  const fixtureDir = path.join(root, 'tmp/pdfs/fixtures');
  const constantsPath = path.join(root, 'frontend/assets/js/config/constants.js');
  const constantsSrc = fs.readFileSync(constantsPath, 'utf8') + '\nmodule.exports = { CLINICAL_FIELD_PDF_RULES, CLINICAL_FORMAT_HEADER_PDF_RULES, CLINICAL_FORMAT_START_PAGES, CLINICAL_FORMAT_END_PAGES, CLINICAL_FORMAT_ORDER, CLINICAL_FORM_SCHEMAS };';
  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    Set,
    Map,
    Date,
    Math,
    String,
    Number,
    Array,
    Object
  };
  vm.createContext(sandbox);
  vm.runInContext(constantsSrc, sandbox, { filename: 'constants.js' });
  const {
    CLINICAL_FIELD_PDF_RULES,
    CLINICAL_FORMAT_HEADER_PDF_RULES,
    CLINICAL_FORMAT_START_PAGES,
    CLINICAL_FORMAT_END_PAGES,
    CLINICAL_FORMAT_ORDER,
    CLINICAL_FORM_SCHEMAS
  } = sandbox.module.exports;

  const templatePath = path.join(root, 'frontend/data/uv-historias.pdf');
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const results = [];
  const historyFormats = [];
  const historyClinicalFormData = {};
  let historyPatient = null;
  if (writeFixtures) {
    fs.mkdirSync(fixtureDir, { recursive: true });
  }

  for (const formatId of CLINICAL_FORMAT_ORDER) {
    const schema = CLINICAL_FORM_SCHEMAS[formatId];
    const rules = CLINICAL_FIELD_PDF_RULES[formatId] || {};
    const values = {};
    const entries = [];
    const formatIndex = CLINICAL_FORMAT_ORDER.indexOf(formatId) + 1;

    schema.fields.forEach((field, idx) => {
      const token = `V${formatIndex}-${idx + 1}`;
      const rule = rules[field.id] || {};
      const fixtureValue = Number(rule.maxWidth) <= 12 || Number(rule.maxChars) <= 2
        ? `Q${(idx % 9) + 1}`
        : token;
      values[field.id] = fixtureValue;
      const matches = Array.isArray(rule.matches) && rule.matches.length > 0 ? rule.matches : [field.label];
      const ruleType = String(rule.type || '').toLowerCase();
      const markPoint = ruleType === 'mark-select'
        ? (rule.markMap?.si || Object.values(rule.markMap || {})[0])
        : null;
      const fixedX = markPoint ? Number(markPoint.x) : Number(rule.x);
      const fixedY = markPoint ? Number(markPoint.y) : Number(rule.y);
      entries.push({
        id: `entry-${formatId}-${field.id}`,
        value: ruleType === 'mark-select' || ruleType === 'mark-single' ? 'X' : fixtureValue,
        matches,
        exact: Boolean(rule.exact),
        maxPerPage: Math.max(1, Number(rule.maxPerPage || 1)),
        maxWidth: Number(rule.maxWidth || 220),
        maxLines: Math.max(1, Number(rule.maxLines || 2)),
        pageOffset: Number.isFinite(Number(rule.pageOffset)) ? Number(rule.pageOffset) : null,
        dx: Number.isFinite(Number(rule.dx)) ? Number(rule.dx) : 6,
        dy: Number.isFinite(Number(rule.dy)) ? Number(rule.dy) : -1,
        size: Number.isFinite(Number(rule.size)) ? Number(rule.size) : 7.4,
        lineHeight: Number.isFinite(Number(rule.lineHeight)) ? Number(rule.lineHeight) : null,
        x: Number.isFinite(fixedX) ? fixedX : null,
        y: Number.isFinite(fixedY) ? fixedY : null,
        allowTemplateOverlap: ruleType === 'mark-select' || ruleType === 'mark-single',
        align: ['left', 'center', 'right'].includes(String(rule.align || '').toLowerCase()) ? String(rule.align).toLowerCase() : 'left',
        maxChars: Number.isFinite(Number(rule.maxChars)) ? Number(rule.maxChars) : null
      });
    });

    (CLINICAL_FORMAT_HEADER_PDF_RULES[formatId] || []).forEach((rule, idx) => {
      const headerValue = Number(rule.maxWidth) <= 30 || Number(rule.maxChars) <= 4
        ? `Z${(idx % 9) + 1}`
        : `H${formatIndex}-${idx + 1}`;
      entries.push({
        id: `header-${formatId}-${idx + 1}`,
        value: rule.markWhen ? 'X' : headerValue,
        matches: [`header-${formatId}-${idx + 1}`],
        exact: true,
        maxPerPage: 1,
        maxWidth: Number(rule.maxWidth || 170),
        maxLines: Math.max(1, Number(rule.maxLines || 1)),
        pageOffset: Number.isFinite(Number(rule.pageOffset)) ? Number(rule.pageOffset) : 0,
        dx: 0,
        dy: 0,
        size: Number(rule.size || (rule.markWhen ? 10 : 7.5)),
        lineHeight: Number.isFinite(Number(rule.lineHeight)) ? Number(rule.lineHeight) : null,
        x: Number(rule.x),
        y: Number(rule.y),
        align: ['left', 'center', 'right'].includes(String(rule.align || '').toLowerCase()) ? String(rule.align).toLowerCase() : 'left',
        maxChars: Number.isFinite(Number(rule.maxChars)) ? Number(rule.maxChars) : null
      });
    });

    const patient = {
      name: 'Paciente',
      lastNameFather: 'Prueba',
      lastNameMother: 'Uno',
      age: '26',
      ageMonths: '4',
      sex: 'Masculino',
      location: 'Av. Reforma 100, Centro, Guerrero',
      street: 'Av. Reforma',
      exteriorNumber: '100',
      interiorNumber: '2',
      colony: 'Centro',
      municipality: 'Tecpan',
      delegation: 'Costa Grande',
      stateName: 'Guerrero',
      cityName: 'Tecpan',
      consultationDate: '2026-04-29',
      birthDate: '1999-04-21',
      phone: '5551231234',
      officePhone: '5559874321',
      occupation: 'Odontologo',
      educationLevel: 'Licenciatura',
      civilStatus: 'Soltero',
      dentistName: 'Dr Prueba',
      familyDoctorName: '',
      familyDoctorPhone: '',
      medications: 'Ninguno',
      allergies: 'Ninguna',
      clinicalRecordType: formatId,
      clinicalFormData: {
        [formatId]: values
      }
    };
    historyClinicalFormData[formatId] = values;
    if (!historyPatient) {
      historyPatient = {
        ...patient,
        clinicalRecordType: CLINICAL_FORMAT_ORDER[0],
        clinicalFormData: historyClinicalFormData
      };
    }
    historyFormats.push({
      formatId,
      clinicalContext: { byKey: {}, details: [] },
      clinicalFillEntries: entries
    });

    const generated = await generateClinicalPdf({
      templatePath,
      formatId,
      patient,
      dictionaries: { diseases: [], toothStatuses: [] },
      clinicalFillEntries: entries,
      clinicalContext: { byKey: {}, details: [] }
    });

    const bytes = generated.pdfBytes;
    if (writeFixtures) {
      fs.writeFileSync(path.join(fixtureDir, `${formatId}.pdf`), bytes);
    }
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(bytes), useSystemFonts: true }).promise;
    let allText = '';
    for (let p = 1; p <= doc.numPages; p += 1) {
      const page = await doc.getPage(p);
      const tc = await page.getTextContent();
      allText += ' ' + tc.items.map((item) => String(item.str || '')).join(' ');
    }

    const clinicalEntries = entries.filter((entry) => entry.id.startsWith('entry-'));
    const headerEntries = entries.filter((entry) => entry.id.startsWith('header-') && entry.value !== 'X');
    const found = clinicalEntries.filter((entry) => allText.includes(entry.value));
    const missing = clinicalEntries.filter((entry) => !allText.includes(entry.value)).map((entry) => entry.id);
    const missingHeaders = headerEntries.filter((entry) => !allText.includes(entry.value)).map((entry) => entry.id);
    const formatPosition = CLINICAL_FORMAT_ORDER.indexOf(formatId);
    const nextFormatId = CLINICAL_FORMAT_ORDER[formatPosition + 1];
    const startPage = Number(CLINICAL_FORMAT_START_PAGES[formatId]);
    const endPage = Number.isFinite(Number(CLINICAL_FORMAT_END_PAGES[formatId]))
      ? Number(CLINICAL_FORMAT_END_PAGES[formatId])
      : (nextFormatId ? Number(CLINICAL_FORMAT_START_PAGES[nextFormatId]) - 1 : 96);
    results.push({
      formatId,
      found: found.length,
      total: clinicalEntries.length,
      missing,
      missingHeaders,
      pages: doc.numPages,
      expectedPages: endPage - startPage + 1
    });
  }

  for (const row of results) {
    console.log(`${row.formatId}: ${row.found}/${row.total}; paginas ${row.pages}/${row.expectedPages}`);
    if (row.missing.length > 0) {
      console.log(`  missing: ${row.missing.join(', ')}`);
    }
    if (row.missingHeaders.length > 0) {
      console.log(`  missing headers: ${row.missingHeaders.join(', ')}`);
    }
  }
  if (writeFixtures) {
    console.log(`Fixtures PDF: ${fixtureDir}`);
  }
  const completeHistory = await generateClinicalHistoryPdf({
    templatePath,
    patient: historyPatient,
    dictionaries: { diseases: [], toothStatuses: [] },
    formats: historyFormats
  });
  if (writeFixtures) {
    fs.writeFileSync(path.join(fixtureDir, 'historial-clinico-completo.pdf'), completeHistory.pdfBytes);
  }
  const completeDoc = await pdfjsLib.getDocument({
    data: new Uint8Array(completeHistory.pdfBytes),
    useSystemFonts: true
  }).promise;
  const expectedHistoryPages = results.reduce((total, row) => total + row.expectedPages, 0);
  console.log(`historial-completo: paginas ${completeDoc.numPages}/${expectedHistoryPages}; formatos ${completeHistory.formatIds.length}/${CLINICAL_FORMAT_ORDER.length}`);

  if (
    results.some((row) => row.missing.length > 0 || row.missingHeaders.length > 0 || row.pages !== row.expectedPages) ||
    completeDoc.numPages !== expectedHistoryPages ||
    completeHistory.formatIds.length !== CLINICAL_FORMAT_ORDER.length
  ) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
