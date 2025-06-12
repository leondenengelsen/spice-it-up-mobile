//openaiClient.js

require('dotenv').config();
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log("OpenAI Key loaded:", !!process.env.OPENAI_API_KEY); // should be true

module.exports = openai;