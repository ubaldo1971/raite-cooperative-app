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
 * Robust AI Vision with Failover:
 * 1. Gemini 1.5 Flash
 * 2. Gemini 1.5 Flash Latest
 * 3. Gemini Pro Vision
 * 4. Fallback: OCR.space
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

        // List of models to try in order of preference/speed
        const modelsToTry = [
            "gemini-1.5-flash",
            "gemini-1.5-flash-latest",
            "gemini-pro-vision"
        ];

        // --- ATTEMPT 1: GEMINI AI VISION (Multi-Model) ---
        for (const modelName of modelsToTry) {
            try {
                console.log(`🤖 Backend: Intentando con modelo ${modelName}...`);
                const model = genAI.getGenerativeModel({ model: modelName });

                const prompt = `
                Analiza esta imagen (INE mexicana).
                Extrae JSON estricto con: curp, fullName, claveElector, fechaNacimiento (DD/MM/AAAA), sexo, seccion, address.
                Si no lees algo, déjalo vacío.
                Responde SOLO JSON.
                `;

                const result = await model.generateContent([
                    prompt,
                    { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
                ]);

                const response = await result.response;
                const text = response.text();

                // If we got here, it worked!
                console.log(`✅ Gemini (${modelName}) éxito:`, text.substring(0, 50) + "...");

                const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
                extractedData = JSON.parse(jsonStr);
                sourceUsed = `GEMINI_${modelName.toUpperCase()}`;
                extractedData.dataFound = !!(extractedData.curp || extractedData.fullName);

                break; // Stop trying models
            } catch (modelError) {
                console.warn(`⚠️ Falló modelo ${modelName}:`, modelError.message);
                // Continue to next model
            }
        }

        // --- ATTEMPT 2: OCR.SPACE FALLBACK ---
        if (!extractedData || !extractedData.dataFound) {
            console.log('📷 Backend: Fallback a OCR.space...');

            try {
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
            } catch (ocrError) {
                console.error('❌ OCR.space fatal:', ocrError);
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
            console.log('❌ Falló extracción en todos los métodos');
            res.json({
                success: false, // Make sure frontend sees it as failure if no data
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
