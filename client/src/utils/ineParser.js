/**
 * Parser para datos de INE (QR, PDF417, MRZ)
 * Extrae campos estructurados del código escaneado
 */

/**
 * Parsea el payload del código INE según su formato
 * @param {string} rawValue - Texto crudo del código
 * @param {string} format - Formato detectado (qr_code, pdf417, etc)
 * @returns {Object} Datos parseados
 */
export function parseInePayload(rawValue, format) {
    const now = new Date().toISOString();

    // Caso QR
    if (format === "qr_code" || format === "QR_CODE") {
        return {
            source: "INE_QR",
            scanned_at: now,
            raw: rawValue,
            url: looksLikeUrl(rawValue) ? rawValue : null,
            ...parseQrContent(rawValue),
        };
    }

    // Caso MRZ (detecta '<<' y 'IDMEX')
    if (rawValue.includes("<<") && rawValue.toUpperCase().includes("IDMEX")) {
        return {
            source: "INE_MRZ",
            scanned_at: now,
            raw: rawValue,
            ...parseMrz(rawValue),
        };
    }

    // Caso PDF417 (el más completo para INE)
    return {
        source: "INE_PDF417",
        scanned_at: now,
        raw: rawValue,
        ...parsePdf417(rawValue),
    };
}

/**
 * Verifica si el string parece una URL
 */
function looksLikeUrl(s) {
    try {
        new URL(s);
        return true;
    } catch {
        return false;
    }
}

/**
 * Parsea contenido del QR del INE
 * Maneja tanto URLs de verificación como datos directos
 */
function parseQrContent(text) {
    const upper = text.toUpperCase();

    // Check if it's an INE verification URL (qr.ine.mx)
    if (text.includes('qr.ine.mx')) {
        return parseIneQrUrl(text);
    }

    // El QR del INE normalmente contiene una URL de verificación
    // Intentamos extraer datos si los hay
    const curp = upper.match(/[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d/)?.[0] || null;
    const claveElector = upper.match(/[A-Z]{6}\d{8}[HM]\d{3}/)?.[0] || null;

    return {
        curp,
        clave_elector: claveElector,
    };
}

/**
 * Parsea la URL de verificación del QR de INE
 * Formato: http://qr.ine.mx/{id_numerico}/{fecha}/P/{codigo}
 * Ejemplo: http://qr.ine.mx/056400506194702259994021/20240125/P/007799
 */
function parseIneQrUrl(url) {
    const result = {
        verification_url: url,
        ine_id: null,
        ine_date: null,
        ine_code: null,
    };

    try {
        // Parse URL parts
        const parts = url.split('/');
        // http://qr.ine.mx/ID/DATE/P/CODE
        // parts: ['http:', '', 'qr.ine.mx', 'ID', 'DATE', 'P', 'CODE']

        if (parts.length >= 7) {
            result.ine_id = parts[3]; // Long numeric ID
            result.ine_date = parts[4]; // Date like 20240125
            result.ine_code = parts[6]; // Code like 007799

            // Try to format the date nicely
            if (result.ine_date && result.ine_date.length === 8) {
                const year = result.ine_date.substring(0, 4);
                const month = result.ine_date.substring(4, 6);
                const day = result.ine_date.substring(6, 8);
                result.formatted_date = `${day}/${month}/${year}`;
            }
        }
    } catch (e) {
        console.warn("Error parsing INE QR URL:", e);
    }

    return result;
}

/**
 * Parsea MRZ (Machine Readable Zone) del INE
 */
function parseMrz(text) {
    const lines = text.trim().split(/\n+/).map(l => l.trim());

    let nombre = null, apellido_paterno = null, apellido_materno = null;
    let curp = null, sexo = null, fecha_nacimiento = null;

    // Línea con nombre (contiene <<)
    const nameLine = lines.find(l => l.includes("<<") && l.includes("<"));
    if (nameLine) {
        const parts = nameLine.split("<<");
        const apellidos = parts[0].split("<").filter(Boolean);
        apellido_paterno = apellidos[0] || null;
        apellido_materno = apellidos[1] || null;
        nombre = (parts[1] || "").replace(/</g, " ").trim() || null;
    }

    // Buscar CURP en todo el texto
    const upper = text.toUpperCase();
    curp = upper.match(/[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d/)?.[0] || null;

    // Sexo
    sexo = upper.match(/\b[HM]\b/)?.[0] || null;

    // Fecha de nacimiento (formato YYMMDD en MRZ)
    const fechaMatch = upper.match(/\d{6}(?=[HMF])/);
    if (fechaMatch) {
        const raw = fechaMatch[0];
        const yy = raw.substring(0, 2);
        const mm = raw.substring(2, 4);
        const dd = raw.substring(4, 6);
        const century = parseInt(yy) > 50 ? "19" : "20";
        fecha_nacimiento = `${dd}/${mm}/${century}${yy}`;
    }

    return {
        nombre,
        apellido_paterno,
        apellido_materno,
        curp,
        sexo,
        fecha_nacimiento,
        full_name: [apellido_paterno, apellido_materno, nombre].filter(Boolean).join(" "),
    };
}

/**
 * Parsea PDF417 del INE (contiene la mayor cantidad de datos)
 * El formato exacto varía por versión del INE
 */
function parsePdf417(raw) {
    const upper = raw.toUpperCase();
    const result = {};

    // CURP (18 caracteres alfanuméricos con formato específico)
    result.curp = upper.match(/[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d/)?.[0] || null;

    // Clave de elector (18 caracteres)
    result.clave_elector = upper.match(/[A-Z]{6}\d{8}[HM]\d{3}/)?.[0] ||
        upper.match(/CLAVE[:\s]*([A-Z0-9]{18})/)?.[1] || null;

    // Sexo
    result.sexo = upper.match(/\b[HM]\b/)?.[0] || null;

    // Fecha de nacimiento (varios formatos posibles)
    result.fecha_nacimiento = upper.match(/(0[1-9]|[12]\d|3[01])[\/\-](0[1-9]|1[0-2])[\/\-](19|20)\d{2}/)?.[0] || null;

    // Sección electoral (4 dígitos)
    result.seccion = upper.match(/SECC?I?[OÓ]?N?[:\s]*(\d{4})/)?.[1] ||
        upper.match(/\b(\d{4})\b/)?.[1] || null;

    // Año de registro
    result.ano_registro = upper.match(/(19|20)\d{2}/)?.[0] || null;

    // Vigencia
    result.vigencia = upper.match(/VIGENCIA[:\s]*([\d\/\-]+)/)?.[1] || null;

    // Intentar extraer nombre (más difícil sin conocer el formato exacto)
    // Buscar patrones comunes de nombre
    const namePatterns = [
        /NOMBRE[:\s]*([A-ZÁÉÍÓÚÑ\s]+)/i,
        /([A-ZÁÉÍÓÚÑ]{2,}\s+[A-ZÁÉÍÓÚÑ]{2,}\s+[A-ZÁÉÍÓÚÑ]{2,})/,
    ];

    for (const pattern of namePatterns) {
        const match = raw.match(pattern);
        if (match && match[1] && !isExcludedWord(match[1])) {
            result.full_name = match[1].trim();
            break;
        }
    }

    // Intentar extraer dirección
    const addressMatch = raw.match(/(?:DOMICILIO|DOM)[:\s]*(.+?)(?:SECCI|CLAVE|$)/is);
    if (addressMatch) {
        result.address = addressMatch[1].replace(/\n/g, ' ').trim();
    }

    return result;
}

/**
 * Palabras a excluir de la detección de nombres
 */
function isExcludedWord(text) {
    const excludeWords = [
        'INSTITUTO', 'NACIONAL', 'ELECTORAL', 'MEXICO', 'CREDENCIAL',
        'PARA', 'VOTAR', 'VIGENCIA', 'REGISTRO', 'FEDERAL', 'INE'
    ];
    const upper = text.toUpperCase();
    return excludeWords.some(word => upper.includes(word));
}

/**
 * Formatea los datos parseados para enviar al backend
 */
export function formatForBackend(parsed) {
    return {
        fullName: parsed.full_name || [parsed.apellido_paterno, parsed.apellido_materno, parsed.nombre].filter(Boolean).join(" ") || "",
        curp: parsed.curp || "",
        claveElector: parsed.clave_elector || "",
        fechaNacimiento: parsed.fecha_nacimiento || parsed.formatted_date || "",
        seccion: parsed.seccion || "",
        sexo: parsed.sexo || "",
        address: parsed.address || "",
        source: parsed.source,
        rawData: parsed.raw,
        scannedAt: parsed.scanned_at,
        // INE QR URL verification data
        verificationUrl: parsed.verification_url || "",
        ineId: parsed.ine_id || "",
        ineCode: parsed.ine_code || "",
        hasQrVerification: !!parsed.verification_url,
    };
}
