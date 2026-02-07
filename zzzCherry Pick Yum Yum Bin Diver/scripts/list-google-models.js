const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
    try {
        const models = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).apiKey; // seemingly no direct listModels on client instance in this sdk version? checking docs or trying to access via API url directly if SDK falls short.
        // Actually, newer SDKs might expose it differently. Let's try to hit the REST API directly for listing models to be sure.

        console.log("Fetching models via SDK might not be straightforward for listing. Using REST check...");
    } catch (e) {
        // ignore
    }
}

// Let's use a standard fetch for listing models
async function fetchModels() {
    const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error fetching models:", error);
    }
}

fetchModels();
