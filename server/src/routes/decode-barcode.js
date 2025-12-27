const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const FormData = require('form-data');

// OCR.space API key (same as ocr.js)
const OCR_SPACE_API_KEY = process.env.OCR_SPACE_API_KEY || 'K85106546788957';

/**
 * POST /api/decode-barcode
 * Attempts to decode barcode from image, falls back to OCR
 * 
 * This is called by the frontend when local barcode detection fails
 */
router.post('/', async (req, res) => {
    try {
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere imagen'
            });
        }

        console.log('🔍 Backend: Procesando imagen para barcode/OCR...');

        // Remove data URI prefix
        const imageData = image.replace(/^data:image\/\w+;base64,/, '');

        // First, try OCR.space with OCREngine 2 (better for documents)
        const formData = new FormData();
        formData.append('apikey', OCR_SPACE_API_KEY);
        formData.append('base64Image', `data:image/jpeg;base64,${imageData}`);
        formData.append('language', 'spa');
        formData.append('isOverlayRequired', 'false');
        formData.append('OCREngine', '2');
        formData.append('scale', 'true');

        console.log('📡 Enviando a OCR.space...');

        const response = await fetch('https://api.ocr.space/parse/image', {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders()
        });

        const result = await response.json();

        if (result.IsErroredOnProcessing) {
            console.error('❌ OCR.space error:', result.ErrorMessage);
            return res.status(500).json({
                success: false,
                message: 'Error en OCR.space',
                error: result.ErrorMessage
            });
        }

        const ocrText = result.ParsedResults?.[0]?.ParsedText || '';
        console.log('📝 Texto OCR (primeros 200 chars):', ocrText.substring(0, 200));

        // Extract data from OCR text
        const extractedData = extractDataFromText(ocrText);
        console.log('✅ Datos extraídos:', extractedData);

        res.json({
            success: true,
            data: extractedData,
            rawText: ocrText.substring(0, 500),
            source: 'ocr_backend'
        });

    } catch (error) {
        console.error('❌ Error en decode-barcode:', error);
        res.status(500).json({
            success: false,
            message: 'Error procesando imagen',
            error: error.message
        });
    }
});

/**
 * Extract INE data from OCR text
 */
function extractDataFromText(text) {
    const upper = text.toUpperCase();
    const lines = upper.split('\n').map(l => l.trim()).filter(l => l.length > 2);

    // CURP pattern (18 characters)
    const curpMatch = upper.match(/[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d/);
    const curp = curpMatch ? curpMatch[0] : '';

    // Clave de Elector pattern
    const claveMatch = upper.match(/[A-Z]{6}\d{8}[HM]\d{3}/);
    const claveElector = claveMatch && claveMatch[0] !== curp ? claveMatch[0] : '';

    // Birth date from CURP
    let fechaNacimiento = '';
    if (curp && curp.length >= 10) {
        const year = curp.substring(4, 6);
        const month = curp.substring(6, 8);
        const day = curp.substring(8, 10);
        const fullYear = parseInt(year) > 30 ? '19' + year : '20' + year;
        fechaNacimiento = `${day}/${month}/${fullYear}`;
    }

    // Sex from CURP
    const sexo = curp && curp.length >= 11 ? (curp[10] === 'H' ? 'H' : 'M') : '';

    // Section (4 digits)
    const seccionMatch = upper.match(/SECCI[OÓ]N\s*[:\s]*(\d{4})/);
    const seccion = seccionMatch ? seccionMatch[1] : '';

    // Name extraction (complex, try multiple methods)
    let fullName = '';
    const excludeWords = [
        'INSTITUTO', 'NACIONAL', 'ELECTORAL', 'MEXICO', 'CREDENCIAL',
        'PARA', 'VOTAR', 'VIGENCIA', 'REGISTRO', 'FEDERAL', 'INE',
        'NOMBRE', 'DOMICILIO', 'NACIMIENTO', 'CLAVE', 'ELECTOR',
        'CURP', 'SECCION', 'SECCIÓN', 'FECHA', 'ESTADOS', 'UNIDOS'
    ];

    // Method: Look for lines after "NOMBRE" that look like names
    let foundNombre = false;
    for (const line of lines) {
        if (line.includes('NOMBRE') && !line.includes('NACIMIENTO')) {
            foundNombre = true;
            continue;
        }
        if (foundNombre) {
            if (line.includes('DOMICILIO') || line.includes('CLAVE') ||
                line.includes('CURP') || /\d{4,}/.test(line)) {
                break;
            }
            const words = line.split(/\s+/).filter(w => w.length >= 2);
            const isName = words.every(w =>
                /^[A-ZÁÉÍÓÚÑÜ]+$/.test(w) && !excludeWords.includes(w)
            );
            if (isName && words.length >= 1 && words.length <= 3) {
                fullName += (fullName ? ' ' : '') + line;
            }
        }
    }

    // Address extraction
    let address = '';
    let foundDomicilio = false;
    for (const line of lines) {
        if (line.includes('DOMICILIO')) {
            foundDomicilio = true;
            continue;
        }
        if (foundDomicilio) {
            if (line.includes('SECCI') || line.includes('CLAVE') ||
                line.includes('CURP') || /\d{2}\/\d{2}\/\d{4}/.test(line)) {
                break;
            }
            address += (address ? ', ' : '') + line;
            if (address.length > 100) break;
        }
    }

    return {
        fullName: fullName.trim(),
        curp,
        claveElector,
        fechaNacimiento,
        seccion,
        sexo,
        address: address.trim(),
        dataFound: !!(fullName || curp || claveElector)
    };
}

module.exports = router;
