const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { generateClinicalPdf } = require('../backend/src/clinical_pdf');

async function main() {
  const root = path.resolve(__dirname, '..');
  const constantsPath = path.join(root, 'frontend/assets/js/config/constants.js');
  const constantsSrc = fs.readFileSync(constantsPath, 'utf8') + '\nmodule.exports = { CLINICAL_FIELD_PDF_RULES, CLINICAL_FORMAT_START_PAGES, CLINICAL_FORMAT_ORDER, CLINICAL_FORM_SCHEMAS };';
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
    CLINICAL_FORMAT_START_PAGES,
    CLINICAL_FORMAT_ORDER,
    CLINICAL_FORM_SCHEMAS
  } = sandbox.module.exports;

  const templatePath = path.join(root, 'frontend/data/uv-historias.pdf');
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const results = [];

  for (const formatId of CLINICAL_FORMAT_ORDER) {
    const schema = CLINICAL_FORM_SCHEMAS[formatId];
    const rules = CLINICAL_FIELD_PDF_RULES[formatId] || {};
    const values = {};
    const entries = [];

    schema.fields.forEach((field, idx) => {
      const token = `V${CLINICAL_FORMAT_ORDER.indexOf(formatId) + 1}-${idx + 1}`;
      values[field.id] = token;
      const rule = rules[field.id] || {};
      const matches = Array.isArray(rule.matches) && rule.matches.length > 0 ? rule.matches : [field.label];
      entries.push({
        id: `entry-${formatId}-${field.id}`,
        value: token,
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
        x: Number.isFinite(Number(rule.x)) ? Number(rule.x) : null,
        y: Number.isFinite(Number(rule.y)) ? Number(rule.y) : null,
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
      location: 'Ciudad de Mexico',
      consultationDate: '2026-04-29',
      birthDate: '1999-04-21',
      phone: '5551231234',
      occupation: 'Odontologo',
      dentistName: 'Dr Prueba',
      medications: 'Ninguno',
      allergies: 'Ninguna',
      clinicalRecordType: formatId,
      clinicalFormData: {
        [formatId]: values
      }
    };

    const generated = await generateClinicalPdf({
      templatePath,
      formatId,
      patient,
      dictionaries: { diseases: [], toothStatuses: [] },
      clinicalFillEntries: entries,
      clinicalContext: { byKey: {}, details: [] }
    });

    const bytes = generated.pdfBytes;
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(bytes), useSystemFonts: true }).promise;
    let allText = '';
    for (let p = 1; p <= doc.numPages; p += 1) {
      const page = await doc.getPage(p);
      const tc = await page.getTextContent();
      allText += ' ' + tc.items.map((item) => String(item.str || '')).join(' ');
    }

    const found = entries.filter((entry) => allText.includes(entry.value));
    const missing = entries.filter((entry) => !allText.includes(entry.value)).map((entry) => entry.id);
    results.push({ formatId, found: found.length, total: entries.length, missing });
  }

  for (const row of results) {
    console.log(`${row.formatId}: ${row.found}/${row.total}`);
    if (row.missing.length > 0) {
      console.log(`  missing: ${row.missing.join(', ')}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
