const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

// Configuration
const GEMINI_API_KEY = 'AIzaSyBZ5noBNursV5JaoFmkkXA-7sq5G964qrA';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function testGemini(imagePath) {
    try {
        console.log(`Reading image from: ${imagePath}`);
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Data = imageBuffer.toString('base64');

        console.log('Sending to Gemini Flash 1.5...');

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
        Analiza esta imagen. Es una credencial del INE.
        Extrae datos: curp, nombre completo (fullName), clave elector, fecha nacimiento, domicilio.
        
        Si no puedes leer algo por borroso, intenta inferir o déjalo vacío.
        
        Responde SOLO JSON estricto:
        {
          "fullName": "",
          "curp": "",
          "claveElector": "",
          "fechaNacimiento": "",
          "seccion": "",
          "address": "",
          "dataFound": true
        }
        `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: "image/jpeg",
                },
            },
        ]);

        const response = await result.response;
        console.log("\n--- GEMINI RESPONSE ---\n");
        console.log(response.text());
        console.log('\n----------------------\n');

    } catch (error) {
        console.error('Test failed:', error);
    }
}

const imagePath = 'C:/Users/Broly/.gemini/antigravity/brain/65cd7944-cbbd-4a66-b747-afc590fab22a/uploaded_image_1766876281312.jpg';
testGemini(imagePath);
