const fetch = require('node-fetch');
const fs = require('fs');

const API_KEY = 'AIzaSyBZ5noBNursV5JaoFmkkXA-7sq5G964qrA';
const IMAGE_PATH = 'C:/Users/Broly/.gemini/antigravity/brain/65cd7944-cbbd-4a66-b747-afc590fab22a/uploaded_image_1766878376009.jpg';

async function testDirect() {
    try {
        const imageBuffer = fs.readFileSync(IMAGE_PATH);
        const base64Image = imageBuffer.toString('base64');

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

        const payload = {
            contents: [{
                parts: [
                    { text: "Analiza esta imagen INE. Extrae JSON: {curp, fullName, dataFound: true}. Si falla, dataFound: false." },
                    {
                        inline_data: {
                            mime_type: "image/jpeg",
                            data: base64Image
                        }
                    }
                ]
            }]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error(`HTTP Check Failed: ${response.status} ${response.statusText}`);
            const errorText = await response.text();
            console.error('Error Body:', errorText);
            return;
        }

        const data = await response.json();
        console.log("✅ Success!");
        console.log(JSON.stringify(data, null, 2));

    } catch (e) {
        console.error("Test Error:", e);
    }
}

testDirect();
