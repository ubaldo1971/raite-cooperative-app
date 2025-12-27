const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fetch = require('node-fetch');
const FormData = require('form-data');

// Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBZ5noBNursV5JaoFmkkXA-7sq5G964qrA';
const OCR_SPACE_API_KEY = process.env.OCR_SPACE_API_KEY || 'K85106546788957';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * POST /api/decode-barcode
 * Primary: Gemini 1.5 Flash (AI Vision)
 * Secondary: OCR.space (Traditional OCR)
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

        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        let extractedData = null;
        let sourceUsed = '';

        // --- ATTEMPT 1: GEMINI AI VISION ---
        try {
            console.log('🤖 Backend: Intentando Gemini AI Vision...');

            // Use gemini-1.5-flash
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const prompt = `
            Analiza esta imagen (INE mexicana).
            Extrae JSON estricto con: curp, fullName, claveElector, fechaNacimiento (DD/MM/AAAA), sexo, seccion, address.
            Si no lees algo, déjalo vacío.
            Si hay códigos de barras (PDF417/QR), úsalos para validar datos.
            Responde SOLO JSON.
            `;

            const result = await model.generateContent([
                prompt,
                { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
            ]);

            const response = await result.response;
            const text = response.text();
            console.log("🤖 Gemini respuesta:", text.substring(0, 100) + "...");

            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            extractedData = JSON.parse(jsonStr);
            sourceUsed = 'GEMINI_AI';

            // Validate minimal data found
            extractedData.dataFound = !!(extractedData.curp || extractedData.fullName);

        } catch (geminiError) {
            console.error('⚠️ Gemini falló, intentando fallback OCR:', geminiError.message);
            // Don't crash, proceed to fallback
        }

        // --- ATTEMPT 2: OCR.SPACE FALLBACK ---
        // Run this if Gemini failed OR returned empty data
        if (!extractedData || !extractedData.dataFound) {
            console.log('📷 Backend: Fallback a OCR.space...');

            const formData = new FormData();
            formData.append('apikey', OCR_SPACE_API_KEY);
            formData.append('base64Image', `data:image/jpeg;base64,${base64Data}`);
            formData.append('language', 'spa');
            formData.append('isOverlayRequired', 'false');
            formData.append('OCREngine', '2');
            formData.append('scale', 'true');

            const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
                method: 'POST',
                body: formData,
                headers: formData.getHeaders()
            });

            const ocrResult = await ocrResponse.json();

            if (!ocrResult.IsErroredOnProcessing && ocrResult.ParsedResults?.[0]?.ParsedText) {
                const ocrText = ocrResult.ParsedResults[0].ParsedText;
                console.log('📝 OCR fallback text:', ocrText.substring(0, 100));
                extractedData = extractDataFromText(ocrText);
                sourceUsed = 'OCR_SPACE_FALLBACK';
            }
        }

        if (extractedData) {
            console.log(`✅ Datos finales (${sourceUsed}):`, extractedData);
            res.json({
                success: true,
                data: extractedData,
                source: sourceUsed
            });
        } else {
            console.log('❌ Falló extracción en ambos métodos');
            res.json({
                success: false,
                message: 'No se pudieron extraer datos'
            });
        }

    } catch (error) {
        console.error('❌ Error fatal en decode-barcode:', error);
        res.status(500).json({
            success: false,
            message: 'Error procesando imagen',
            error: error.message
        });
    }
});

/**
 * Helper: Extract INE data from raw text (for OCR fallback)
 */
function extractDataFromText(text) {
    const upper = text.toUpperCase();

    // Simple regex extraction for fallback
    const curpMatch = upper.match(/[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d/);
    const curp = curpMatch ? curpMatch[0] : '';

    // Try to find name (simple heuristic)
    let fullName = '';
    const lines = upper.split('\n').map(l => l.trim()).filter(l => l.length > 5);
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('NOMBRE') && i + 1 < lines.length) {
            fullName = lines[i + 1];
            break;
        }
    }

    return {
        fullName,
        curp,
        dataFound: !!(curp || fullName)
    };
}

module.exports = router;
