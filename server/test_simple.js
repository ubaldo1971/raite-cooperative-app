const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_API_KEY = 'AIzaSyBZ5noBNursV5JaoFmkkXA-7sq5G964qrA';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function run() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Say hello");
        const response = await result.response;
        console.log("Response:", response.text());
    } catch (error) {
        console.error("Error:", error.message);
        if (error.response) {
            console.error("Error details:", JSON.stringify(error.response, null, 2));
        }
    }
}

run();
