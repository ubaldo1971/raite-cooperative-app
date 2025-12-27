const fetch = require('node-fetch');

const API_KEY = 'AIzaSyBZ5noBNursV5JaoFmkkXA-7sq5G964qrA';

async function listModels() {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("✅ Models Available:");
            data.models.forEach(m => {
                if (m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name}`);
                }
            });
        } else {
            console.error("❌ Error listing models:", data);
        }
    } catch (e) {
        console.error("Test Error:", e);
    }
}

listModels();
