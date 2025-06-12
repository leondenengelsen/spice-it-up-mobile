// utils/geminiHelpers.js
const genAI = require('./geminiClient');

/**
 * Generates a response from Gemini AI model
 * 
 * @param {string} promptText - The text prompt to send to Gemini
 * @param {string} modelName - The name of the Gemini model to use (default: "gemini-1.5-flash")
 * @returns {Promise<string>} - The trimmed response text from Gemini
 * @throws {Error} - If the API call fails
 */
async function generateGeminiResponse(promptText, modelName = "gemini-1.5-flash") {
  try {
    // Get the model instance
    const model = genAI.getGenerativeModel({ model: modelName });
    
    // Generate content
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: promptText }] }]
    });
    
    // Return the trimmed response text
    return result.response.text().trim();
  } catch (error) {
    console.error("🔴 Gemini Request Failed:", error);
    if (error.response) {
      console.error("🟠 Error details:", error.response.status, error.response.data);
    }
    throw new Error(`Gemini request failed: ${error.message}`);
  }
}

module.exports = {
  generateGeminiResponse
};
