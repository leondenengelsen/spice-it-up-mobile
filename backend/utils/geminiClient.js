// utils/geminiClient.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ✅ Pass the key directly
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = genAI;