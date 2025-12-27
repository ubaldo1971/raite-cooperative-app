const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const FormData = require('form-data');

// OCR.space API - Free tier: 25,000 requests/month
// User's API key
const OCR_SPACE_API_KEY = process.env.OCR_SPACE_API_KEY || 'K85106546788957';

/**
 * POST /api/ocr/ine
 * Process INE images using OCR.space API
 */
router.post('/ine', async (req, res) => {
    try {
        const { frontImage, backImage } = req.body;

        if (!frontImage && !backImage) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere al menos una imagen'
            });
        }

        console.log('🔍 Procesando OCR con OCR.space...');

        let frontText = '';
        let backText = '';

        // Process front image
        if (frontImage) {
            console.log('📄 Procesando INE Frente...');
            frontText = await processWithOCRSpace(frontImage);
            console.log('📝 Texto Frente:', frontText.substring(0, 200) + '...');
        }

        // Process back image
        if (backImage) {
            console.log('📄 Procesando INE Reverso...');
            backText = await processWithOCRSpace(backImage);
            console.log('📝 Texto Reverso:', backText.substring(0, 200) + '...');
        }

        // Extract data from OCR text
        const extractedData = extractINEData(frontText, backText);
        console.log('✅ Datos extraídos:', extractedData);

        res.json({
            success: true,
            data: extractedData,
            rawText: {
                front: frontText,
                back: backText
            }
        });

    } catch (error) {
        console.error('❌ Error OCR:', error);
        res.status(500).json({
            success: false,
            message: 'Error procesando OCR',
            error: error.message
        });
    }
});

/**
 * POST /api/ocr/detect-type
 * Detect document type (INE or License) from front image
 */
router.post('/detect-type', async (req, res) => {
    try {
        const { frontImage } = req.body;

        if (!frontImage) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere imagen'
            });
        }

        console.log('🔍 Detectando tipo de documento...');

        const ocrText = await processWithOCRSpace(frontImage);
        const upperText = ocrText.toUpperCase();

        console.log('📝 Texto para detección:', upperText.substring(0, 300));

        // Keywords that indicate INE
        const ineKeywords = [
            'INSTITUTO NACIONAL ELECTORAL',
            'CREDENCIAL PARA VOTAR',
            'INE',
            'CLAVE DE ELECTOR',
            'SECCIÓN',
            'VIGENCIA ELECTOR',
            'INSTITUTO FEDERAL ELECTORAL',
            'IFE'
        ];

        // Keywords that indicate License
        const licenseKeywords = [
            'LICENCIA DE CONDUCIR',
            'LICENCIA PARA CONDUCIR',
            'LICENCIA DE MANEJO',
            'LICENCIA AUTOMOVILISTA',
            'LICENCIA CHOFER',
            'GOBIERNO DEL ESTADO',
            'SECRETARIA DE TRANSPORTE',
            'MOVILIDAD',
            'TIPO DE LICENCIA',
            'VIGENCIA DE LICENCIA'
        ];

        let ineScore = 0;
        let licenseScore = 0;

        for (const keyword of ineKeywords) {
            if (upperText.includes(keyword)) {
                ineScore += keyword.length; // Longer matches are more specific
                console.log('  ✓ INE keyword found:', keyword);
            }
        }

        for (const keyword of licenseKeywords) {
            if (upperText.includes(keyword)) {
                licenseScore += keyword.length;
                console.log('  ✓ License keyword found:', keyword);
            }
        }

        // Additional heuristics
        if (upperText.includes('CURP') && upperText.includes('CLAVE')) {
            ineScore += 10;
        }
        if (upperText.match(/SECCI[OÓ]N\s*\d{4}/)) {
            ineScore += 15;
        }

        // Stronger License signals
        if (upperText.includes('LICENCIA')) {
            licenseScore += 50; // STRONG signal
        }
        if (upperText.match(/TIPO\s*[A-E]/)) {
            licenseScore += 20;
        }
        if (upperText.match(/CONDUCIR|MANEJO|AUTOMOVILISTA/)) {
            licenseScore += 15;
        }

        // If "ELECTORAL" or "VOTAR" is missing, penalize INE score significantly
        if (!upperText.includes('ELECTORAL') && !upperText.includes('VOTAR')) {
            ineScore -= 20;
        }

        const documentType = licenseScore > ineScore ? 'license' : 'ine';

        console.log(`✅ Detectado: ${documentType} (INE: ${ineScore}, License: ${licenseScore})`);

        res.json({
            success: true,
            documentType,
            confidence: {
                ine: ineScore,
                license: licenseScore
            }
        });

    } catch (error) {
        console.error('❌ Error detecting document type:', error);
        // Default to INE if detection fails
        res.json({
            success: true,
            documentType: 'ine',
            confidence: { ine: 0, license: 0 }
        });
    }
});

/**
 * Process image with OCR.space API
 */
async function processWithOCRSpace(base64Image) {
    try {
        // Remove data URI prefix if present
        const imageData = base64Image.replace(/^data:image\/\w+;base64,/, '');

        const formData = new FormData();
        formData.append('apikey', OCR_SPACE_API_KEY);
        formData.append('base64Image', `data:image/jpeg;base64,${imageData}`);
        formData.append('language', 'spa'); // Spanish
        formData.append('isOverlayRequired', 'false');
        formData.append('OCREngine', '2'); // Engine 2 is better for complex documents
        formData.append('scale', 'true');
        formData.append('isTable', 'false');

        const response = await fetch('https://api.ocr.space/parse/image', {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders()
        });

        const result = await response.json();

        if (result.IsErroredOnProcessing) {
            throw new Error(result.ErrorMessage || 'Error en OCR.space');
        }

        if (result.ParsedResults && result.ParsedResults.length > 0) {
            return result.ParsedResults[0].ParsedText || '';
        }

        return '';
    } catch (error) {
        console.error('Error en OCR.space:', error);
        throw error;
    }
}

/**
 * Extract INE data from OCR text
 */
function extractINEData(frontText, backText) {
    const allText = (frontText + '\n' + backText).toUpperCase();
    const lines = allText.split('\n').map(l => l.trim()).filter(l => l.length > 2);

    console.log('📋 Líneas detectadas:', lines.length);
    console.log('📋 Todas las líneas:', lines.slice(0, 15)); // Log first 15 lines for debugging

    // Words to exclude from name detection
    const excludeWords = [
        'INSTITUTO', 'NACIONAL', 'ELECTORAL', 'MEXICO', 'CREDENCIAL',
        'PARA', 'VOTAR', 'VIGENCIA', 'REGISTRO', 'FEDERAL', 'INE',
        'NOMBRE', 'DOMICILIO', 'NACIMIENTO', 'CLAVE', 'ELECTOR',
        'SECCION', 'SECCIÓN', 'CURP', 'EMISION', 'ESTADO', 'MUNICIPIO', 'LOCALIDAD',
        'FECHA', 'ANO', 'AÑO', 'VIGENTE', 'HASTA', 'MEXICANA', 'ESTADOS',
        'UNIDOS', 'MEXICANOS', 'SEXO', 'EDAD', 'ANVERSO', 'REVERSO'
    ];

    // ===== CURP (18 characters) - Find this first =====
    const curpMatch = allText.match(/[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d/);
    const curp = curpMatch ? curpMatch[0] : '';
    console.log('🔍 CURP encontrado:', curp);

    // ===== FECHA DE NACIMIENTO (from CURP if available) =====
    let fechaNacimiento = '';

    // Try to extract from text first
    const fechaPatterns = [
        /(\d{2})[\\/\\-](\d{2})[\\/\\-](\d{4})/,
        /NACIMIENTO[:\\s]*(\d{2}[\\/\\-]\\d{2}[\\/\\-]\\d{4})/i
    ];
    for (const pattern of fechaPatterns) {
        const match = allText.match(pattern);
        if (match) {
            fechaNacimiento = match[0];
            break;
        }
    }

    // If not found, derive from CURP (positions 4-9 contain YYMMDD)
    if (!fechaNacimiento && curp && curp.length >= 10) {
        const year = curp.substring(4, 6);
        const month = curp.substring(6, 8);
        const day = curp.substring(8, 10);
        // Assume 1900s for years > 30, else 2000s
        const fullYear = parseInt(year) > 30 ? '19' + year : '20' + year;
        fechaNacimiento = `${day}/${month}/${fullYear}`;
        console.log('📅 Fecha derivada de CURP:', fechaNacimiento);
    }

    // ===== NOMBRE COMPLETO =====
    let fullName = '';
    const nameExclude = [...excludeWords, 'PASEO', 'SANTA', 'CRUZ', 'TENERIFE', 'FRACC', 'LOMAS', 'SECC', 'AV', 'CALLE', 'COL'];

    // Method 1: Look for consecutive name-like lines after "NOMBRE" or at start of front
    // Names on INE are typically: APELLIDO PATERNO, APELLIDO MATERNO, NOMBRE(S)
    const nameParts = [];
    let foundNameSection = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Start collecting after "NOMBRE" keyword
        if (line.includes('NOMBRE') && !line.includes('NACIMIENTO')) {
            foundNameSection = true;
            continue;
        }

        // If we're in the name section, collect name-like lines
        if (foundNameSection) {
            // Stop if we hit another field marker
            if (line.includes('DOMICILIO') || line.includes('CLAVE') ||
                line.includes('CURP') || line.includes('SECCI') ||
                line.includes('NACIMIENTO') || line.includes('FECHA') ||
                /\d{4,}/.test(line)) {
                break;
            }

            // Check if line looks like a name part
            const words = line.split(/\s+/).filter(w => w.length >= 2);
            const allNameChars = words.every(w => /^[A-ZÁÉÍÓÚÑÜ]+$/.test(w) && !nameExclude.includes(w));

            if (allNameChars && words.length >= 1 && words.length <= 3 && line.length < 30) {
                nameParts.push(line);
                console.log('👤 Parte de nombre:', line);
            }
        }
    }

    if (nameParts.length > 0) {
        fullName = nameParts.join(' ');
        console.log('👤 Nombre completo combinado:', fullName);
    }

    // Method 2: If still empty, try to find by pattern
    if (!fullName) {
        // Look for lines that look like names
        for (const line of lines) {
            if (nameExclude.some(w => line.includes(w))) continue;
            if (/\d/.test(line)) continue;
            if (line.length < 5 || line.length > 40) continue;

            const words = line.split(/\s+/).filter(w => w.length >= 2);
            if (words.length >= 2 && words.length <= 4) {
                const allLetters = words.every(w => /^[A-ZÁÉÍÓÚÑÜ]+$/.test(w));
                if (allLetters) {
                    fullName = line;
                    console.log('👤 Nombre por patrón:', fullName);
                    break;
                }
            }
        }
    }

    // ===== CLAVE DE ELECTOR (18 characters) =====
    let claveElector = '';
    const claveMatch = allText.match(/[A-Z]{6}\d{8}[HM]\d{3}/);
    if (claveMatch && claveMatch[0] !== curp) {
        claveElector = claveMatch[0];
    }
    console.log('🔑 Clave Elector:', claveElector);

    // ===== SECCIÓN (4 digits) =====
    let seccion = '';

    // Try multiple patterns for section
    const seccionPatterns = [
        /SECCI[OÓ]N\s*[:\s]*(\d{4})/i,
        /SECC[:\s]*(\d{4})/i,
        /SEC[:\s]+(\d{4})/i,
        /\bSEC\b.*?(\d{4})/i
    ];

    for (const pattern of seccionPatterns) {
        const match = allText.match(pattern);
        if (match) {
            seccion = match[1];
            console.log('📍 Sección encontrada:', seccion);
            break;
        }
    }

    // Alternative: look for 4-digit number that starts with 0 and isn't part of other fields
    if (!seccion) {
        const allNumbers = allText.match(/\b0\d{3}\b/g);
        if (allNumbers) {
            for (const num of allNumbers) {
                // Make sure it's not part of date or other codes
                if (!curp.includes(num) && !claveElector.includes(num)) {
                    seccion = num;
                    console.log('📍 Sección alternativa:', seccion);
                    break;
                }
            }
        }
    }

    // ===== DOMICILIO =====
    let address = '';
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('DOMICILIO') && i + 1 < lines.length) {
            const addressLines = [];
            for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
                const line = lines[j];
                // Stop if we hit another field label
                if (line.includes('SECCI') || line.includes('CLAVE') ||
                    line.includes('NACIMIENTO') || line.includes('CURP')) {
                    break;
                }
                addressLines.push(line);
            }
            address = addressLines.join(', ');
            console.log('🏠 Domicilio encontrado:', address);
            break;
        }
    }

    // Alternative: look for address patterns (street, number, colony)
    if (!address) {
        for (const line of lines) {
            if (line.includes('CALLE') || line.includes('COL.') || line.includes('COL ') ||
                line.includes('AV.') || line.includes('AVENIDA') || /\d+\s*(INT|EXT|#)/.test(line)) {
                address = line;
                console.log('🏠 Domicilio por patrón:', address);
                break;
            }
        }
    }

    // ===== SEXO =====
    let sexo = '';
    if (curp && curp.length >= 11) {
        sexo = curp[10] === 'H' ? 'H' : curp[10] === 'M' ? 'M' : '';
    }

    return {
        fullName: fullName.trim(),
        curp,
        claveElector,
        fechaNacimiento,
        seccion,
        address: address.trim(),
        sexo,
        dataFound: !!(fullName || curp || claveElector)
    };
}

/**
 * POST /api/ocr/license
 * Process Driver's License images using OCR.space API
 */
router.post('/license', async (req, res) => {
    try {
        const { frontImage, backImage } = req.body;

        if (!frontImage && !backImage) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere al menos una imagen'
            });
        }

        console.log('🔍 Procesando OCR de Licencia...');

        let frontText = '';
        let backText = '';

        // Process front image
        if (frontImage) {
            console.log('📄 Procesando Licencia Frente...');
            frontText = await processWithOCRSpace(frontImage);
            console.log('📝 Texto Licencia Frente:', frontText.substring(0, 200) + '...');
        }

        // Process back image  
        if (backImage) {
            console.log('📄 Procesando Licencia Reverso...');
            backText = await processWithOCRSpace(backImage);
            console.log('📝 Texto Licencia Reverso:', backText.substring(0, 200) + '...');
        }

        // Extract data from OCR text
        const extractedData = extractLicenseData(frontText, backText);
        console.log('✅ Datos de licencia extraídos:', extractedData);

        res.json({
            success: true,
            data: extractedData,
            rawText: {
                front: frontText,
                back: backText
            }
        });

    } catch (error) {
        console.error('❌ Error OCR Licencia:', error);
        res.status(500).json({
            success: false,
            message: 'Error procesando OCR',
            error: error.message
        });
    }
});

/**
 * Extract license data from OCR text
 */
function extractLicenseData(frontText, backText) {
    const combinedText = (frontText + ' ' + backText).toUpperCase();
    const lines = combinedText.split(/[\n\r]+/).map(l => l.trim()).filter(l => l.length > 0);

    console.log('📄 Líneas de licencia TOTAL:', lines); // DEBUG: Print all lines

    let fullName = '';
    let licenseNumber = '';
    let licenseType = '';
    let vigencia = '';
    let curp = '';
    let fechaNacimiento = '';
    let address = '';

    // Extract CURP (18 chars pattern) - Relaxed
    // Allow for potential OCR errors (0 vs O, spaces)
    const curpMatch = combinedText.match(/[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d/);
    // Also try finding lines that look like CURP
    if (!curpMatch) {
        const potentialCurp = lines.find(l => l.length >= 16 && l.match(/^[A-Z]{4}\d{6}/));
        if (potentialCurp) {
            curp = potentialCurp.replace(/[^A-Z0-9]/g, '');
            console.log('✅ CURP encontrado (relaxed):', curp);
        }
    } else {
        curp = curpMatch[0];
        console.log('✅ CURP encontrado:', curp);
    }

    if (curp) {
        // Derive birth date from CURP
        const year = curp.substring(4, 6);
        const month = curp.substring(6, 8);
        const day = curp.substring(8, 10);
        const fullYear = parseInt(year) > 50 ? `19${year}` : `20${year}`;
        fechaNacimiento = `${fullYear}-${month}-${day}`;
    }

    // Extract license number patterns (varies by state)
    // Sonora pattern: DOC. NÚM. / NUMBER L3100RC1238593
    // EXCLUDE "DE CHOFER" matches
    const licensePatterns = [
        /DOC\.?\s*N[ÚU]M\.?\s*[\/|]?\s*NUMBER[:\s]*([A-Z0-9]+)/i,
        /L\d{4}[A-Z]{2}\d+/,  // Specific Sonora format like L3100RC...
        /LICENCIA[:\s]*([A-Z0-9]{6,15})/i,
        /NO\.?\s*LICENCIA[:\s]*([A-Z0-9]{6,15})/i
    ];

    for (const pattern of licensePatterns) {
        const match = combinedText.replace(/\s+/g, '').match(pattern) || combinedText.match(pattern);
        if (match && (match[1] || match[0])) {
            let found = match[1] || match[0];

            // Clean up common prefixes if caught
            found = found.replace(/DOC\.?N[ÚU]M\.?[\/|]?NUMBER/i, '').replace(/LICENCIA/i, '');

            // Validation: Must have at least one digit and not be "CHOFER" or text only
            if (found.length >= 6 && /\d/.test(found) && !found.includes('CHOFER')) {
                licenseNumber = found;
                console.log('✅ Número de licencia encontrado:', licenseNumber);
                break;
            }
        }
    }

    // Extract license type
    const typePatterns = [
        /LICENCIA\s+DE\s+([A-Z]+)/i, // Matches LICENCIA DE CHOFER
        /TIPO[:\s]*([A-E])/i,
        /\b(AUTOMOVILISTA|CHOFER|MOTOCICLISTA)\b/i
    ];

    for (const pattern of typePatterns) {
        const match = combinedText.match(pattern);
        if (match) {
            if (match[1].length === 1) {
                licenseType = match[1].toUpperCase();
            } else {
                // Map word to letter
                const typeMap = {
                    'AUTOMOVILISTA': 'A',
                    'MOTOCICLISTA': 'B',
                    'CHOFER': 'C'
                };
                licenseType = typeMap[match[1].toUpperCase()] || '';
            }
            console.log('✅ Tipo de licencia:', licenseType);
            break;
        }
    }

    // Extract vigencia (expiry date)
    const vigenciaPatterns = [
        /VENCIMIENTO\s*[\/|]?\s*EXPIRES[:\s]*(\d{2}[-\/]\d{2}[-\/]\d{4})/i,
        /VIGENCIA[:\s]*(\d{2}[-\/]\d{2}[-\/]\d{4})/i,
        /VENCE[:\s]*(\d{2}[-\/]\d{2}[-\/]\d{4})/i,
        /VALID[A-Z]*[:\s]*(\d{2}[-\/]\d{2}[-\/]\d{4})/i,
        /(\d{2}[-\/]\d{2}[-\/]\d{4})/  // Any date pattern
    ];

    for (const pattern of vigenciaPatterns) {
        const match = combinedText.match(pattern);
        if (match) {
            const dateStr = match[1] || match[0];
            const dateParts = dateStr.split(/[-\/]/);
            if (dateParts.length === 3) {
                vigencia = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
                console.log('✅ Vigencia encontrada:', vigencia);

                if (vigencia === fechaNacimiento) {
                    console.log('⚠️ Vigencia igual a nacimiento, ignorando...');
                    vigencia = '';
                } else {
                    break;
                }
            }
        }
    }

    // Extract name - specific fallback for Sonora
    // Look for NOMBRE / NAME line
    const nameIndex = lines.findIndex(l => l.includes('NOMBRE') && l.includes('NAME'));
    if (nameIndex !== -1 && !fullName && nameIndex + 1 < lines.length) {
        const line1 = lines[nameIndex + 1];
        const line2 = lines[nameIndex + 2];
        if (!line1.includes('CURP')) {
            fullName = line1;
            if (line2 && !line2.includes('CURP') && !line2.includes('PERSONAL')) {
                fullName += ' ' + line2;
            }
        }
    }

    // Extract address - specific for Sonora "DOMICILIO / ADDRESS"
    const addressIndex = lines.findIndex(l => l.includes('DOMICILIO') && l.includes('ADDRESS'));
    if (addressIndex !== -1) {
        let addr = '';
        for (let i = addressIndex + 1; i < lines.length; i++) {
            if (lines[i].includes('EXPEDICI') || lines[i].includes('VENCIMIENTO') || lines[i].match(/\d{2}\/\d{2}\/\d{4}/)) {
                break;
            }
            addr += lines[i] + ' ';
        }
        if (addr) address = addr.trim();
    }

    // Extract name - look for NOMBRE or lines with all caps names
    const excludeWords = ['LICENCIA', 'MANEJO', 'GOBIERNO', 'ESTADO', 'TIPO', 'VIGENCIA',
        'CURP', 'DOMICILIO', 'MEXICO', 'SONORA', 'JALISCO', 'CDMX'];

    for (let i = 0; i < lines.length && !fullName; i++) {
        const line = lines[i];

        // Look for NOMBRE: pattern
        if (line.includes('NOMBRE')) {
            const nameMatch = line.match(/NOMBRE[:\s]*(.+)/i);
            if (nameMatch && nameMatch[1].length > 3) {
                fullName = nameMatch[1].trim();
            } else if (i + 1 < lines.length) {
                // Name might be on next line
                fullName = lines[i + 1].trim();
            }
        }

        // Look for lines that look like names (2-4 words, all letters)
        if (!fullName && line.match(/^[A-ZÁÉÍÓÚÑ\s]{10,50}$/) && !excludeWords.some(w => line.includes(w))) {
            const words = line.split(/\s+/).filter(w => w.length > 2);
            if (words.length >= 2 && words.length <= 5) {
                fullName = words.join(' ');
            }
        }
    }

    // Extract address
    for (const line of lines) {
        if (line.includes('DOMICILIO') || line.includes('CALLE') || line.includes('AV ') || line.includes('COL ')) {
            const addressMatch = line.match(/(?:DOMICILIO[:\s]*)?(.+)/i);
            if (addressMatch) {
                address = addressMatch[1].replace(/DOMICILIO[:\s]*/i, '').trim();
                if (address.length > 10) {
                    break;
                }
            }
        }
    }

    return {
        fullName: fullName.trim(),
        licenseNumber,
        licenseType,
        vigencia,
        curp,
        fechaNacimiento,
        address: address.trim(),
        dataFound: !!(fullName || licenseNumber || curp)
    };
}

module.exports = router;
