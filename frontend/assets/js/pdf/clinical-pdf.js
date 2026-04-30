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

async function blobHasPdfHeader(blob) {
  if (!(blob instanceof Blob) || blob.size < 5) {
    return false;
  }
  const head = new Uint8Array(await blob.slice(0, 5).arrayBuffer());
  return (
    head[0] === 0x25 &&
    head[1] === 0x50 &&
    head[2] === 0x44 &&
    head[3] === 0x46 &&
    head[4] === 0x2d
  );
}

async function getBlobTextPreview(blob, maxChars) {
  try {
    const text = await blob.slice(0, Math.max(120, Number(maxChars || 240))).text();
    return String(text || "").replace(/\s+/g, " ").trim().slice(0, Math.max(80, Number(maxChars || 240)));
  } catch {
    return "";
  }
}

async function requestOfficialClinicalPdf() {
  const recordType = getClinicalRecordTypeById(draftPatient.clinicalRecordType);
  const normalizedPatient = normalizePatient(draftPatient);
  const dictionaries = {
    diseases: Array.isArray(state.diseases) ? state.diseases : [],
    toothStatuses: Array.isArray(state.toothStatuses) ? state.toothStatuses : []
  };
  const clinicalContext = buildClinicalContextFromForm(normalizedPatient, recordType.id);
  const pdfContext = buildClinicalPdfContext(
    normalizedPatient,
    dictionaries,
    recordType.id,
    clinicalContext
  );
  const clinicalFillEntries = buildClinicalPdfFillEntries(normalizedPatient, recordType.id, pdfContext);

  const payload = {
    formatId: recordType.id,
    patient: normalizedPatient,
    clinicalContext,
    clinicalFillEntries,
    dictionaries
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
        const validPdf = await blobHasPdfHeader(blob);
        if (!validPdf) {
          const preview = await getBlobTextPreview(blob, 260);
          backendError = preview
            ? `El backend respondió, pero no devolvió un PDF válido. Vista previa: ${preview}`
            : "El backend respondió, pero no devolvió un PDF válido.";
        } else {
          const contentDisposition = response.headers.get("content-disposition") || "";
          const fileName = extractFilenameFromDisposition(contentDisposition);
          return { blob, fileName, recordType };
        }
      }

      if (!backendError) {
        let detail = "";
        try {
          const data = await response.json();
          detail = data?.error || data?.detail || "";
        } catch {
          detail = await response.text();
        }
        backendError = detail || "El backend no pudo generar el PDF oficial.";
      }
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
  const clinicalFillEntries = normalizeClinicalFillEntries(payload?.clinicalFillEntries);

  const sourcePdf = await pdfLib.PDFDocument.load(templateBytes, { ignoreEncryption: true });
  const targetPdf = await pdfLib.PDFDocument.create();
  const sourcePageNumbers = [];
  for (let p = selected.start; p <= selected.end; p += 1) {
    sourcePageNumbers.push(p);
  }

  const copiedPages = await targetPdf.copyPages(sourcePdf, sourcePageNumbers.map((p) => p - 1));
  copiedPages.forEach((page) => targetPdf.addPage(page));

  const font = await targetPdf.embedFont(pdfLib.StandardFonts.Helvetica);
  const renderedEntryIds = new Set();
  copiedPages.forEach((page, idx) => {
    const sourcePageNo = sourcePageNumbers[idx];
    const items = textData.pages[sourcePageNo] || [];
    const isIdentificationPage = sourcePageNo === selected.start;
    const pageOffset = sourcePageNo - selected.start;

    if (isIdentificationPage && CLINICAL_IDENTIFICATION_LAYOUT_FORMATS.has(selected.formatId)) {
      drawClinicalIdentificationBlock(page, font, context, pdfLib);
    }
    drawClinicalFillEntriesOnPage(page, font, items, clinicalFillEntries, pageOffset, renderedEntryIds, pdfLib);
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

function toOptionalClinicalNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
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

function parseClinicalLocationParts(locationInput) {
  const text = String(locationInput || "").trim();
  if (!text) {
    return {
      street: "",
      colony: "",
      municipality: "",
      delegation: "",
      state: "",
      city: ""
    };
  }

  const tokens = text
    .split(/[,;|/]+/)
    .map((token) => token.trim())
    .filter(Boolean);

  const first = tokens[0] || text;
  const second = tokens[1] || "";
  const third = tokens[2] || "";
  const hasSecondOrThird = Boolean(second || third);

  return {
    street: first,
    colony: second || first,
    municipality: second || first,
    delegation: second || first,
    state: third || "",
    city: hasSecondOrThird ? second : first
  };
}

function truncateClinicalText(value, max) {
  const text = String(value || "").trim();
  if (!max || text.length <= max) {
    return text;
  }
  return `${text.slice(0, max - 1)}…`;
}

function normalizeClinicalNumericText(value, maxLength) {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }
  const digits = text.replace(/\D+/g, "");
  if (!digits) {
    return "";
  }
  return digits.slice(0, Math.max(1, Number(maxLength || digits.length)));
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
  const sharedValues = normalizeClinicalSharedValues(patient.clinicalSharedValues, patient.clinicalFormData);
  const detailLines = [];

  for (const [key, value] of Object.entries(sharedValues)) {
    const safeKey = stringOrEmpty(key);
    const safeValue = stringOrEmpty(value);
    if (!safeKey || !safeValue) {
      continue;
    }
    byKey[safeKey] = safeValue;
  }

  for (const field of schema.fields) {
    const explicitValue = stringOrEmpty(values[field.id]);
    const contextKey = stringOrEmpty(field?.contextKey);
    const sharedValue = contextKey && shouldReuseClinicalContextKey(contextKey)
      ? stringOrEmpty(byKey[contextKey])
      : "";
    const value = explicitValue || sharedValue;
    if (!value) {
      continue;
    }

    detailLines.push(`${field.label}: ${value}`);
    if (contextKey && explicitValue && shouldReuseClinicalContextKey(contextKey)) {
      byKey[contextKey] = explicitValue;
    }
  }

  return {
    formatId: safeFormat,
    byKey,
    details: detailLines
  };
}

function getClinicalFieldPdfRule(formatId, fieldId) {
  const formatRules = CLINICAL_FIELD_PDF_RULES[normalizeClinicalRecordType(formatId)] || {};
  return formatRules[fieldId] && typeof formatRules[fieldId] === "object"
    ? formatRules[fieldId]
    : null;
}

function normalizeClinicalFillEntries(rawEntries) {
  if (!Array.isArray(rawEntries)) {
    return [];
  }

  const normalized = [];
  for (const entry of rawEntries) {
    const value = stringOrEmpty(entry?.value);
    if (!value) {
      continue;
    }
    const matchesRaw = Array.isArray(entry?.matches)
      ? entry.matches
      : (entry?.match ? [entry.match] : []);
    const matches = matchesRaw.map((token) => stringOrEmpty(token)).filter(Boolean);
    if (matches.length === 0) {
      continue;
    }

    normalized.push({
      id: stringOrEmpty(entry?.id) || generateId("pdf-entry"),
      value,
      matches,
      exact: Boolean(entry?.exact),
      maxPerPage: Math.max(1, Number(entry?.maxPerPage || 1)),
      maxWidth: Number(entry?.maxWidth || 210),
      maxLines: Math.max(1, Number(entry?.maxLines || 2)),
      pageOffset: Number.isFinite(Number(entry?.pageOffset)) ? Number(entry.pageOffset) : null,
      dx: Number.isFinite(Number(entry?.dx)) ? Number(entry.dx) : 6,
      dy: Number.isFinite(Number(entry?.dy)) ? Number(entry.dy) : -1,
      size: Number.isFinite(Number(entry?.size)) ? Number(entry.size) : 7.4,
      lineHeight: Number.isFinite(Number(entry?.lineHeight)) ? Number(entry.lineHeight) : null,
      x: toOptionalClinicalNumber(entry?.x),
      y: toOptionalClinicalNumber(entry?.y),
      lockPosition: Boolean(entry?.lockPosition),
      align: ["left", "center", "right"].includes(String(entry?.align || "").toLowerCase())
        ? String(entry.align).toLowerCase()
        : "left",
      maxChars: Number.isFinite(Number(entry?.maxChars)) ? Number(entry.maxChars) : null
    });
  }

  return normalized;
}

function buildClinicalPdfFillEntries(patientInput, formatId, contextInput) {
  const patient = normalizePatient(patientInput || {});
  const safeFormat = normalizeClinicalRecordType(formatId || patient.clinicalRecordType);
  const schema = getClinicalFormSchema(safeFormat);
  const values = patient.clinicalFormData?.[safeFormat] || {};
  const sharedValues = normalizeClinicalSharedValues(patient.clinicalSharedValues, patient.clinicalFormData);
  const context = contextInput && typeof contextInput === "object"
    ? contextInput
    : buildClinicalPdfContext(patient, { diseases: state.diseases, toothStatuses: state.toothStatuses }, safeFormat);

  const entries = [];

  // Nota: el encabezado ya se llena con coordenadas fijas del bloque de identificación.
  // Aquí evitamos reglas de "coincidencia por texto" para no colocar valores fuera de su línea.

  for (const field of schema.fields) {
    const contextKey = stringOrEmpty(field?.contextKey);
    const value = stringOrEmpty(values[field.id]) || (
      contextKey && shouldReuseClinicalContextKey(contextKey)
        ? stringOrEmpty(sharedValues[contextKey])
        : ""
    );
    if (!value) {
      continue;
    }
    const pdfRule = getClinicalFieldPdfRule(safeFormat, field.id);
    if (!pdfRule || typeof pdfRule !== "object") {
      // Evita ubicar datos en posiciones inciertas si no existe regla PDF explícita.
      continue;
    }
    const matches = Array.isArray(pdfRule?.matches) && pdfRule.matches.length > 0
      ? pdfRule.matches
      : [field.label];
    const fixedX = toOptionalClinicalNumber(pdfRule?.x);
    const fixedY = toOptionalClinicalNumber(pdfRule?.y);
    if (fixedX === null || fixedY === null) {
      // Para impresión oficial solo permitimos coordenadas fijas.
      continue;
    }

    entries.push({
      id: `field-${safeFormat}-${field.id}`,
      value,
      matches,
      exact: Boolean(pdfRule?.exact),
      maxPerPage: Math.max(1, Number(pdfRule?.maxPerPage || 1)),
      maxWidth: Number(pdfRule?.maxWidth || 220),
      maxLines: Math.max(1, Number(pdfRule?.maxLines || 2)),
      pageOffset: Number.isFinite(Number(pdfRule?.pageOffset)) ? Number(pdfRule.pageOffset) : null,
      dx: Number.isFinite(Number(pdfRule?.dx)) ? Number(pdfRule.dx) : 6,
      dy: Number.isFinite(Number(pdfRule?.dy)) ? Number(pdfRule.dy) : -1,
      size: Number.isFinite(Number(pdfRule?.size)) ? Number(pdfRule.size) : 7.4,
      lineHeight: Number.isFinite(Number(pdfRule?.lineHeight)) ? Number(pdfRule.lineHeight) : null,
      x: fixedX,
      y: fixedY,
      lockPosition: true,
      align: ["left", "center", "right"].includes(String(pdfRule?.align || "").toLowerCase())
        ? String(pdfRule.align).toLowerCase()
        : "left",
      maxChars: Number.isFinite(Number(pdfRule?.maxChars)) ? Number(pdfRule.maxChars) : null
    });
  }

  return normalizeClinicalFillEntries(entries);
}

function buildClinicalPdfContext(patientInput, dictionaries, formatId, clinicalContextInput) {
  const patient = normalizePatient(patientInput || {});
  let explicitFirstNames = stringOrEmpty(patient.name);
  let explicitLastNameFather = stringOrEmpty(patient.lastNameFather);
  let explicitLastNameMother = stringOrEmpty(patient.lastNameMother);
  if (!explicitLastNameFather && !explicitLastNameMother && explicitFirstNames) {
    const inferred = splitClinicalFullName(explicitFirstNames);
    if (inferred.lastNameFather || inferred.lastNameMother) {
      explicitFirstNames = inferred.firstNames || explicitFirstNames;
      explicitLastNameFather = inferred.lastNameFather;
      explicitLastNameMother = inferred.lastNameMother;
    }
  }
  const fullName = getPatientFullName(patient);
  const fallbackNameParts = splitClinicalFullName(fullName);
  const nameParts = {
    firstNames: explicitFirstNames || fallbackNameParts.firstNames,
    lastNameFather: explicitLastNameFather || fallbackNameParts.lastNameFather,
    lastNameMother: explicitLastNameMother || fallbackNameParts.lastNameMother
  };
  const consultDate = parseDatePartsForClinicalPdf(patient.consultationDate || patient.nextConsultationDate || "");
  const birthDate = parseDatePartsForClinicalPdf(patient.birthDate || "");
  const locationParts = parseClinicalLocationParts(patient.location);

  const diseaseMap = new Map((dictionaries?.diseases || []).map((entry) => [entry.id, entry.name]));
  const statusMap = new Map((dictionaries?.toothStatuses || []).map((entry) => [entry.id, entry.name]));
  const diseaseNames = (Array.isArray(patient.diseaseIds) ? patient.diseaseIds : [])
    .map((id) => diseaseMap.get(id) || "")
    .filter(Boolean);
  const diseaseSummary = summarizeClinicalList(diseaseNames, 6);
  const odontoSummary = summarizeClinicalOdontogram(patient, statusMap);
  const notes = summarizeClinicalNotes(patient);
  const birthPlace = stringOrEmpty(patient.birthPlace) || String(patient.cityName || "").trim();
  const streetAddress = stringOrEmpty(patient.streetAddress) || locationParts.street;
  const exteriorNumber = stringOrEmpty(patient.exteriorNumber);
  const interiorNumber = stringOrEmpty(patient.interiorNumber);
  const neighborhood = stringOrEmpty(patient.neighborhood) || locationParts.colony;
  const municipality = stringOrEmpty(patient.municipality) || locationParts.municipality;
  const delegation = stringOrEmpty(patient.delegation) || locationParts.delegation;
  const stateName = stringOrEmpty(patient.stateName) || locationParts.state;
  const cityName = stringOrEmpty(patient.cityName) || locationParts.city;
  const officePhone = stringOrEmpty(patient.officePhone);
  const familyDoctorName = stringOrEmpty(patient.familyDoctorName);
  const familyDoctorPhone = stringOrEmpty(patient.familyDoctorPhone);
  const educationLevel = stringOrEmpty(patient.educationLevel);
  const civilStatus = stringOrEmpty(patient.civilStatus);
  const lastMedicalDate = parseDatePartsForClinicalPdf(patient.lastMedicalConsultDate || "");
  const lastMedicalReason = stringOrEmpty(patient.lastMedicalConsultReason);

  const sexText = String(patient.sex || "").toLowerCase();
  const isMale = sexText.includes("masc");
  const isFemale = sexText.includes("fem");
  const consultationReason = String(patient.otherConditions || "").trim() || String(patient.medications || "").trim();
  const background = [patient.allergies, patient.medications].map((x) => String(x || "").trim()).filter(Boolean).join(" | ");
  const clinicalContext = clinicalContextInput || buildClinicalContextFromForm(patient, formatId);
  const rawAgeMonths = String(patient.ageMonths || patient.months || "").trim();
  const parsedAgeMonths = /^\d{1,2}$/.test(rawAgeMonths) ? Number(rawAgeMonths) : NaN;
  const ageMonths = Number.isFinite(parsedAgeMonths) && parsedAgeMonths >= 0 && parsedAgeMonths <= 11
    ? String(parsedAgeMonths)
    : "";

  const context = {
    fullName,
    firstNames: nameParts.firstNames,
    lastNameFather: nameParts.lastNameFather,
    lastNameMother: nameParts.lastNameMother,
    recordReference: stringOrEmpty(patient.clinicalRecordReference),
    ageText: String(patient.age || "").trim(),
    ageYears: String(patient.age || "").trim(),
    ageMonths,
    sexLabel: String(patient.sex || "").trim(),
    isMale,
    isFemale,
    birthPlace,
    birthPlaceDate: [birthPlace, birthDate.label !== "-" ? birthDate.label : ""].filter(Boolean).join(" - "),
    birthDay: birthDate.day,
    birthMonth: birthDate.month,
    birthYear: birthDate.year,
    location: String(patient.location || "").trim(),
    locationShort: cityName || stateName || String(patient.location || "").trim(),
    locationStreet: streetAddress,
    locationExterior: exteriorNumber,
    locationInterior: interiorNumber,
    locationColony: neighborhood,
    locationMunicipality: municipality,
    locationDelegation: delegation,
    locationState: stateName,
    locationCity: cityName,
    occupation: String(patient.occupation || "").trim(),
    occupationAlt: educationLevel,
    civilStatus,
    phone: String(patient.phone || "").trim(),
    officePhone,
    doctorPhone: familyDoctorPhone,
    familyDoctorName,
    familyDoctorPhone,
    dentistName: String(patient.dentistName || "").trim(),
    consultDateLabel: consultDate.label,
    consultDay: consultDate.day,
    consultMonth: consultDate.month,
    consultYear: consultDate.year,
    lastMedicalConsult: truncateClinicalText(
      [
        lastMedicalDate.label !== "-" ? lastMedicalDate.label : "",
        lastMedicalReason
      ]
        .filter(Boolean)
        .join(" - "),
      180
    ),
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

function getClinicalPdfMatchScore(itemNormInput, rule) {
  const itemNorm = normalizeClinicalPdfText(itemNormInput);
  if (!itemNorm) {
    return 0;
  }

  const tokens = Array.isArray(rule?.matches) ? rule.matches : [];
  if (tokens.length === 0) {
    return 0;
  }

  let score = 0;
  let matchedCount = 0;

  for (const raw of tokens) {
    const token = normalizeClinicalPdfText(raw);
    if (!token) {
      continue;
    }

    let localScore = 0;
    const tokenWords = token.split(" ").filter(Boolean);
    const genericSingleWord = tokenWords.length === 1 && token.length <= 8;

    if (rule.exact) {
      if (itemNorm === token) {
        localScore = 8 + Math.min(3, token.length * 0.08);
      }
    } else if (itemNorm === token) {
      localScore = 7 + Math.min(3, token.length * 0.08);
    } else if (itemNorm.startsWith(token)) {
      localScore = 6 + Math.min(2, token.length * 0.06);
    } else if (!genericSingleWord && itemNorm.includes(token)) {
      localScore = 5 + Math.min(2, token.length * 0.04);
    } else if (!genericSingleWord) {
      const overlappingWords = tokenWords.filter((word) => word.length > 2 && itemNorm.includes(word)).length;
      if (overlappingWords >= 2) {
        localScore = 3 + Math.min(2, overlappingWords * 0.5);
      }
    }

    if (localScore > 0) {
      matchedCount += 1;
      score += localScore;
    }
  }

  if (matchedCount === 0) {
    return 0;
  }

  const coverageBonus = (matchedCount / tokens.length) * 4;
  return score + coverageBonus;
}

function doRectsOverlap(a, b) {
  return !(
    a.right <= b.left ||
    b.right <= a.left ||
    a.top <= b.bottom ||
    b.top <= a.bottom
  );
}

function getClinicalRectOverlapArea(a, b) {
  const left = Math.max(a.left, b.left);
  const right = Math.min(a.right, b.right);
  const top = Math.min(a.top, b.top);
  const bottom = Math.max(a.bottom, b.bottom);
  if (right <= left || top <= bottom) {
    return 0;
  }
  return (right - left) * (top - bottom);
}

function getClinicalSumRectOverlapArea(rect, others) {
  if (!rect || !Array.isArray(others) || others.length === 0) {
    return 0;
  }
  let area = 0;
  for (const other of others) {
    area += getClinicalRectOverlapArea(rect, other);
  }
  return area;
}

function createClinicalTemplateRects(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  const rects = [];
  for (const item of items) {
    const raw = stringOrEmpty(item?.raw);
    if (!raw) {
      continue;
    }
    const x = Number(item?.x || 0);
    const y = Number(item?.y || 0);
    const w = Number(item?.w || 0);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || x < 10 || y < 10 || w <= 0.8) {
      continue;
    }
    rects.push({
      left: x - 1,
      right: x + w + 1,
      top: y + 7.2,
      bottom: y - 2.4
    });
  }
  return rects;
}

function createClinicalTextMetrics(font, value, rule) {
  const size = Number(rule?.size || 7.4);
  const maxWidth = Number(rule?.maxWidth || 210);
  const maxLines = Math.max(1, Number(rule?.maxLines || 2));
  const maxChars = Number.isFinite(Number(rule?.maxChars)) ? Number(rule.maxChars) : 180;
  const lineHeight = Number(rule?.lineHeight || size + 1.1);
  const safeText = truncateClinicalText(String(value || ""), maxChars);
  const lines = maxLines <= 1
    ? [shrinkClinicalTextToWidth(font, safeText, size, maxWidth)]
    : wrapClinicalPdfText(font, safeText, size, maxWidth).slice(0, maxLines);

  const lineWidths = lines.map((line) => font.widthOfTextAtSize(line, size));
  const widestLine = lineWidths.reduce((max, width) => Math.max(max, width), 0);
  const effectiveWidth = Math.max(1, Math.min(maxWidth || widestLine || 1, widestLine || 1));
  const top = Number(rule?.y || 0) + size;
  const bottom = Number(rule?.y || 0) - ((lines.length - 1) * lineHeight) - (size * 0.28);

  return {
    lines,
    size,
    maxWidth,
    lineHeight,
    effectiveWidth,
    top,
    bottom
  };
}

function findBestClinicalAnchorPlacement(rule, items) {
  if (!rule || !Array.isArray(rule.matches) || rule.matches.length === 0 || !Array.isArray(items) || items.length === 0) {
    return null;
  }

  const scored = [];
  for (const item of items) {
    const score = getClinicalPdfMatchScore(item?.norm, rule);
    if (score <= 0) {
      continue;
    }
    const x = Number(item?.x || 0);
    const y = Number(item?.y || 0);
    const w = Number(item?.w || 0);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || x < 16 || y < 16) {
      continue;
    }
    scored.push({
      score,
      x: x + w + Number(rule?.dx || 0),
      y: y + Number(rule?.dy || 0)
    });
  }

  if (scored.length === 0) {
    return null;
  }
  scored.sort((a, b) => b.score - a.score || b.y - a.y || a.x - b.x);
  return scored[0];
}

function createClinicalTextRect(x, y, metrics) {
  return {
    left: x - 1,
    right: x + metrics.effectiveWidth + 2,
    top: y + metrics.size,
    bottom: y - ((metrics.lines.length - 1) * metrics.lineHeight) - (metrics.size * 0.28)
  };
}

function placeClinicalRuleWithoutOverlap(page, font, value, rule, occupiedRects, templateRects, items, pdfLib) {
  const x = Number(rule?.x || 0);
  const baseY = Number(rule?.y || 0);
  if (!Number.isFinite(x) || !Number.isFinite(baseY) || x < 20 || baseY < 20) {
    return false;
  }

  const metrics = createClinicalTextMetrics(font, value, rule);
  if (!Array.isArray(metrics.lines) || metrics.lines.length === 0) {
    return false;
  }
  if (rule?.lockPosition) {
    let drawX = x;
    let drawY = baseY;
    let chosenRect = createClinicalTextRect(drawX, drawY, metrics);
    const fixedOverlap = getClinicalSumRectOverlapArea(chosenRect, templateRects);

    const anchor = findBestClinicalAnchorPlacement(rule, items);
    if (anchor && Number.isFinite(anchor.x) && Number.isFinite(anchor.y)) {
      const anchoredRect = createClinicalTextRect(anchor.x, anchor.y, metrics);
      const anchorOverlap = getClinicalSumRectOverlapArea(anchoredRect, templateRects);
      const farFromAnchor = Math.abs(anchor.x - x) + Math.abs(anchor.y - baseY) > 90;
      if (anchorOverlap + 10 < fixedOverlap || (farFromAnchor && anchorOverlap <= fixedOverlap + 1)) {
        drawX = anchor.x;
        drawY = anchor.y;
        chosenRect = anchoredRect;
      }
    }

    drawClinicalTextAt(
      page,
      font,
      value,
      {
        ...rule,
        x: drawX,
        y: drawY,
        lineHeight: metrics.lineHeight
      },
      pdfLib
    );
    occupiedRects.push(chosenRect);
    return true;
  }

  const pageTopLimit = Math.max(30, page.getHeight() - 24);
  const pageBottomLimit = 24;
  const attempts = [0, 1, 2, 3, 4, 5, 6, -1, -2, -3, -4];
  const collisionRects = Array.isArray(templateRects) && templateRects.length > 0
    ? [...templateRects, ...occupiedRects]
    : [...occupiedRects];
  let chosenY = null;
  let chosenRect = null;
  let minOverlap = Number.POSITIVE_INFINITY;

  for (const delta of attempts) {
    const candidateY = baseY - (delta * metrics.lineHeight);
    const top = candidateY + metrics.size;
    const bottom = candidateY - ((metrics.lines.length - 1) * metrics.lineHeight) - (metrics.size * 0.28);
    if (top > pageTopLimit || bottom < pageBottomLimit) {
      continue;
    }
    const rect = createClinicalTextRect(x, candidateY, metrics);
    let overlapArea = 0;
    for (const other of collisionRects) {
      overlapArea += getClinicalRectOverlapArea(rect, other);
    }
    if (overlapArea < minOverlap) {
      minOverlap = overlapArea;
      chosenY = candidateY;
      chosenRect = rect;
      if (overlapArea <= 0.0001) {
        break;
      }
    }
  }

  if (!chosenRect || !Number.isFinite(chosenY)) {
    if (Number.isFinite(baseY)) {
      chosenY = baseY;
      chosenRect = createClinicalTextRect(x, baseY, metrics);
    } else {
      return false;
    }
  }

  if (minOverlap > 2400) {
    const fallbackY = baseY - (metrics.lineHeight * 3);
    const top = fallbackY + metrics.size;
    const bottom = fallbackY - ((metrics.lines.length - 1) * metrics.lineHeight) - (metrics.size * 0.28);
    if (top <= pageTopLimit && bottom >= pageBottomLimit) {
      chosenY = fallbackY;
      chosenRect = createClinicalTextRect(x, fallbackY, metrics);
    }
  }

  drawClinicalTextAt(
    page,
    font,
    value,
    {
      ...rule,
      x,
      y: chosenY,
      lineHeight: metrics.lineHeight
    },
    pdfLib
  );
  occupiedRects.push(chosenRect);
  return true;
}

function resolveClinicalEntryCoordinates(entry, items) {
  const rule = {
    matches: Array.isArray(entry?.matches) ? entry.matches : [],
    exact: Boolean(entry?.exact),
    maxPerPage: Math.max(1, Number(entry?.maxPerPage || 1)),
    maxWidth: Number(entry?.maxWidth || 210),
    maxLines: Math.max(1, Number(entry?.maxLines || 2)),
    dx: Number.isFinite(Number(entry?.dx)) ? Number(entry.dx) : 6,
    dy: Number.isFinite(Number(entry?.dy)) ? Number(entry.dy) : -1,
    size: Number.isFinite(Number(entry?.size)) ? Number(entry.size) : 7.4,
    lineHeight: Number.isFinite(Number(entry?.lineHeight)) ? Number(entry.lineHeight) : null,
    x: toOptionalClinicalNumber(entry?.x),
    y: toOptionalClinicalNumber(entry?.y),
    lockPosition: Boolean(entry?.lockPosition),
    align: ["left", "center", "right"].includes(String(entry?.align || "").toLowerCase())
      ? String(entry.align).toLowerCase()
      : "left",
    maxChars: Number.isFinite(Number(entry?.maxChars)) ? Number(entry.maxChars) : null
  };

  if (rule.x !== null && rule.y !== null) {
    return [rule];
  }

  if (!Array.isArray(rule.matches) || rule.matches.length === 0) {
    return [];
  }

  const safeItems = Array.isArray(items) ? items : [];
  const candidates = [];
  for (const item of safeItems) {
    const score = getClinicalPdfMatchScore(item.norm, rule);
    if (score <= 0) {
      continue;
    }
    const x = Number(item.x || 0);
    const y = Number(item.y || 0);
    const w = Number(item.w || 0);
    if (x < 20 || y < 20) {
      continue;
    }
    const resolvedX = x + w + rule.dx;
    const resolvedY = y + rule.dy;
    if (!Number.isFinite(resolvedX) || !Number.isFinite(resolvedY)) {
      continue;
    }
    candidates.push({
      score,
      x: resolvedX,
      y: resolvedY,
      anchorKey: `${Math.round(x)}:${Math.round(y)}`
    });
  }

  candidates.sort((a, b) => b.score - a.score || b.y - a.y || a.x - b.x);
  if (candidates.length === 0) {
    return [];
  }

  const usedAnchorKeys = new Set();
  const resolvedRules = [];
  for (const candidate of candidates) {
    if (usedAnchorKeys.has(candidate.anchorKey)) {
      continue;
    }
    usedAnchorKeys.add(candidate.anchorKey);
    resolvedRules.push({
      ...rule,
      x: candidate.x,
      y: candidate.y
    });
    if (resolvedRules.length >= rule.maxPerPage) {
      break;
    }
  }
  return resolvedRules;
}

function drawClinicalFillEntriesOnPage(page, font, items, entries, pageOffset, renderedEntryIds, pdfLib) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return;
  }
  const rendered = renderedEntryIds instanceof Set ? renderedEntryIds : new Set();
  const occupiedRects = [];
  const templateRects = createClinicalTemplateRects(items);

  for (const entry of entries) {
    const entryId = stringOrEmpty(entry?.id);
    if (entryId && rendered.has(entryId)) {
      continue;
    }
    const entryPageOffset = Number.isFinite(Number(entry?.pageOffset)) ? Number(entry.pageOffset) : null;
    if (entryPageOffset !== null && entryPageOffset !== pageOffset) {
      continue;
    }
    const value = stringOrEmpty(entry?.value);
    if (!value) {
      continue;
    }
    const resolvedRules = resolveClinicalEntryCoordinates(entry, items);
    let hits = 0;
    for (const resolvedRule of resolvedRules) {
      const drawn = placeClinicalRuleWithoutOverlap(page, font, value, resolvedRule, occupiedRects, templateRects, items, pdfLib);
      if (drawn) {
        hits += 1;
      }
    }
    if (hits > 0 && entryId) {
      rendered.add(entryId);
    }
  }
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

function shrinkClinicalTextToWidth(font, text, size, maxWidth) {
  const raw = String(text || "").trim();
  if (!raw || !maxWidth) {
    return raw;
  }
  if (font.widthOfTextAtSize(raw, size) <= maxWidth) {
    return raw;
  }

  let base = raw;
  while (base.length > 1 && font.widthOfTextAtSize(`${base}…`, size) > maxWidth) {
    base = base.slice(0, -1).trimEnd();
  }
  return `${base || raw.slice(0, 1)}…`;
}

function drawClinicalTextAt(page, font, value, opts, pdfLib) {
  const raw = String(value || "").trim();
  if (!raw) {
    return;
  }

  const size = Number(opts?.size || 8);
  const maxWidth = Number(opts?.maxWidth || 120);
  const maxLines = Number(opts?.maxLines || 1);
  const lineHeight = Number(opts?.lineHeight || size + 1.1);
  const align = String(opts?.align || "left");
  const x = Number(opts?.x || 0);
  const y = Number(opts?.y || 0);
  const color = pdfLib.rgb(0, 0, 0);
  const safeText = truncateClinicalText(raw, Number(opts?.maxChars || 180));

  const lines = maxLines <= 1
    ? [shrinkClinicalTextToWidth(font, safeText, size, maxWidth)]
    : wrapClinicalPdfText(font, safeText, size, maxWidth).slice(0, maxLines);

  lines.forEach((line, idx) => {
    let drawX = x;
    const width = font.widthOfTextAtSize(line, size);
    if (align === "center") {
      drawX = x + Math.max(0, (maxWidth - width) / 2);
    } else if (align === "right") {
      drawX = x + Math.max(0, maxWidth - width);
    }
    page.drawText(line, {
      x: drawX,
      y: y - idx * lineHeight,
      size,
      font,
      color
    });
  });
}

function drawClinicalMark(page, font, enabled, x, y, size, pdfLib) {
  if (!enabled) {
    return;
  }
  page.drawText("X", {
    x,
    y,
    size: size || 10,
    font,
    color: pdfLib.rgb(0, 0, 0)
  });
}

function drawClinicalIdentificationBlock(page, font, context, pdfLib) {
  const ageValue = normalizeClinicalNumericText(context.ageYears || context.ageText, 3);
  const monthsValue = normalizeClinicalNumericText(context.ageMonths, 2);
  const birthPlace = String(context.birthPlace || context.locationCity || context.locationShort || "").trim();
  const consultLabel = String(context.consultDateLabel || "").trim();
  const lastConsult = String(context.lastMedicalConsult || "").trim();
  const consultDay = normalizeClinicalNumericText(context.consultDay, 2);
  const consultMonth = normalizeClinicalNumericText(context.consultMonth, 2);
  const consultYear = normalizeClinicalNumericText(context.consultYear, 4);
  const locationState = String(context.locationState || "").trim();
  const locationCity = String(context.locationCity || "").trim();
  const officePhone = String(context.officePhone || "").trim();
  const familyDoctorName = String(context.familyDoctorName || "").trim();
  const familyDoctorPhone = String(context.familyDoctorPhone || "").trim();
  const locationExterior = String(context.locationExterior || "").trim();
  const locationInterior = String(context.locationInterior || "").trim();

  drawClinicalTextAt(page, font, context.fullName, { x: 126, y: 397.2, maxWidth: 280, size: 8.2, maxLines: 1, maxChars: 82 }, pdfLib);
  drawClinicalTextAt(page, font, context.lastNameFather, { x: 186, y: 386.1, maxWidth: 78, size: 8.2, maxLines: 1, maxChars: 28 }, pdfLib);
  drawClinicalTextAt(page, font, context.lastNameMother, { x: 287, y: 386.1, maxWidth: 86, size: 8.2, maxLines: 1, maxChars: 30 }, pdfLib);
  drawClinicalTextAt(page, font, context.firstNames, { x: 375, y: 386.1, maxWidth: 172, size: 8.2, maxLines: 1, maxChars: 42 }, pdfLib);

  drawClinicalTextAt(page, font, ageValue, { x: 441, y: 397.2, maxWidth: 22, size: 8.2, align: "center", maxLines: 1, maxChars: 3 }, pdfLib);
  drawClinicalTextAt(page, font, monthsValue, { x: 521, y: 397.2, maxWidth: 22, size: 8.2, align: "center", maxLines: 1, maxChars: 2 }, pdfLib);

  drawClinicalMark(page, font, context.isMale, 250.5, 364.2, 10, pdfLib);
  drawClinicalMark(page, font, context.isFemale, 377.5, 364.2, 10, pdfLib);

  drawClinicalTextAt(page, font, birthPlace, { x: 197, y: 349.3, maxWidth: 104, size: 8, maxLines: 1, maxChars: 18 }, pdfLib);
  drawClinicalTextAt(page, font, context.birthDay, { x: 440, y: 338.2, maxWidth: 20, size: 8, align: "center", maxLines: 1, maxChars: 2 }, pdfLib);
  drawClinicalTextAt(page, font, context.birthMonth, { x: 476, y: 338.2, maxWidth: 20, size: 8, align: "center", maxLines: 1, maxChars: 2 }, pdfLib);
  drawClinicalTextAt(page, font, context.birthYear, { x: 513, y: 338.2, maxWidth: 34, size: 8, align: "center", maxLines: 1, maxChars: 4 }, pdfLib);
  if (locationState && locationState !== birthPlace) {
    drawClinicalTextAt(page, font, locationState, { x: 264, y: 338.2, maxWidth: 56, size: 8, maxLines: 1, maxChars: 14 }, pdfLib);
  }
  if (locationCity && locationCity !== birthPlace) {
    drawClinicalTextAt(page, font, locationCity, { x: 357, y: 338.2, maxWidth: 62, size: 8, maxLines: 1, maxChars: 18 }, pdfLib);
  }

  drawClinicalTextAt(page, font, context.occupation, { x: 130, y: 317.2, maxWidth: 134, size: 8.2, maxLines: 1, maxChars: 32 }, pdfLib);
  drawClinicalTextAt(page, font, context.occupationAlt, { x: 354, y: 317.2, maxWidth: 195, size: 8.2, maxLines: 1, maxChars: 42 }, pdfLib);
  drawClinicalTextAt(page, font, context.civilStatus, { x: 131, y: 301.2, maxWidth: 120, size: 8.2, maxLines: 1, maxChars: 24 }, pdfLib);
  drawClinicalTextAt(page, font, context.locationStreet, { x: 292, y: 301.2, maxWidth: 232, size: 8.2, maxLines: 1, maxChars: 52 }, pdfLib);

  drawClinicalTextAt(page, font, locationExterior, { x: 122, y: 285.2, maxWidth: 98, size: 8.2, maxLines: 1, maxChars: 18 }, pdfLib);
  drawClinicalTextAt(page, font, locationInterior, { x: 285, y: 285.2, maxWidth: 98, size: 8.2, maxLines: 1, maxChars: 18 }, pdfLib);
  drawClinicalTextAt(page, font, context.locationColony, { x: 392, y: 285.2, maxWidth: 132, size: 8.2, maxLines: 1, maxChars: 28 }, pdfLib);
  drawClinicalTextAt(page, font, locationState || context.locationState, { x: 122, y: 269.2, maxWidth: 112, size: 8.2, maxLines: 1, maxChars: 20 }, pdfLib);
  drawClinicalTextAt(page, font, context.locationMunicipality, { x: 236, y: 269.2, maxWidth: 108, size: 8.2, maxLines: 1, maxChars: 20 }, pdfLib);
  drawClinicalTextAt(page, font, context.locationDelegation, { x: 429, y: 269.2, maxWidth: 92, size: 8.2, maxLines: 1, maxChars: 18 }, pdfLib);

  drawClinicalTextAt(page, font, context.phone, { x: 120, y: 253.2, maxWidth: 82, size: 8.2, maxLines: 1, maxChars: 14 }, pdfLib);
  drawClinicalTextAt(page, font, officePhone, { x: 305, y: 253.2, maxWidth: 82, size: 8.2, maxLines: 1, maxChars: 14 }, pdfLib);
  drawClinicalTextAt(page, font, familyDoctorName, { x: 246, y: 237.2, maxWidth: 175, size: 8.2, maxLines: 1, maxChars: 36 }, pdfLib);
  drawClinicalTextAt(page, font, familyDoctorPhone, { x: 470, y: 237.2, maxWidth: 78, size: 8.2, maxLines: 1, maxChars: 14 }, pdfLib);
  drawClinicalTextAt(page, font, lastConsult || consultLabel, { x: 304, y: 221.2, maxWidth: 228, size: 8.2, maxLines: 1, maxChars: 58 }, pdfLib);

  drawClinicalTextAt(page, font, consultDay, { x: 487.2, y: 451.1, maxWidth: 12, size: 7.1, align: "center", maxLines: 1, maxChars: 2 }, pdfLib);
  drawClinicalTextAt(page, font, consultMonth, { x: 512.4, y: 451.1, maxWidth: 12, size: 7.1, align: "center", maxLines: 1, maxChars: 2 }, pdfLib);
  drawClinicalTextAt(page, font, consultYear, { x: 538.8, y: 451.1, maxWidth: 18, size: 7.1, align: "center", maxLines: 1, maxChars: 4 }, pdfLib);
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

