const { GoogleGenerativeAI } = require("@google/generative-ai");

// Configuration
const GEMINI_API_KEY = 'AIzaSyBZ5noBNursV5JaoFmkkXA-7sq5G964qrA';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function testConnection() {
    try {
        console.log('Testing simple text prompt with gemini-1.5-flash-latest...');
        let model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        try {
            const result = await model.generateContent("Hola, ¿funcionas?");
            const response = await result.response;
            console.log("✅ Flash Latest Works:", response.text());
            return;
        } catch (e) {
            console.log("❌ Flash Latest Failed:", e.message);
        }

        console.log('Testing gemini-1.5-flash...');
        model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        try {
            const result = await model.generateContent("Hola, ¿funcionas?");
            const response = await result.response;
            console.log("✅ Flash Works:", response.text());
            return;
        } catch (e) {
            console.log("❌ Flash Failed:", e.message);
        }

        console.log('Testing gemini-pro...');
        model = genAI.getGenerativeModel({ model: "gemini-pro" });
        try {
            const result = await model.generateContent("Hola, ¿funcionas?");
            const response = await result.response;
            console.log("✅ Pro Works:", response.text());
        } catch (e) {
            console.log("❌ Pro Failed:", e.message);
        }

    } catch (error) {
        console.error('Fatal Test failed:', error);
    }
}

testConnection();
