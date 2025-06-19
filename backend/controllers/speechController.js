const speech = require('@google-cloud/speech');
const path = require('path');
const fs = require('fs');

// Determine credentials path or use environment variable
let credentialsPath;
let client;

console.log('🔧 === SPEECH CONTROLLER INITIALIZATION ===');
console.log('📅 Initialization timestamp:', new Date().toISOString());
console.log('🌐 Environment:', process.env.NODE_ENV || 'development');
console.log('🚂 Railway Environment:', process.env.RAILWAY_ENVIRONMENT_NAME || 'not set');

// Check for Railway-style environment variable first (this is what you have set)
if (process.env['gen-lang-client-0251517490-157aa58a7fda.json']) {
  console.log('✅ Using credentials from Railway-style environment variable');
  console.log('📏 JSON length:', process.env['gen-lang-client-0251517490-157aa58a7fda.json'].length);
  
  try {
    const credentials = JSON.parse(process.env['gen-lang-client-0251517490-157aa58a7fda.json']);
    console.log('✅ Successfully parsed Railway JSON credentials');
    console.log('🏢 Project ID:', credentials.project_id);
    console.log('📧 Client Email:', credentials.client_email);
    
    client = new speech.SpeechClient({
      credentials: credentials
    });
    console.log('✅ Successfully created Speech client with Railway credentials');
  } catch (error) {
    console.error('❌ Error creating Speech client with Railway credentials:', error.message);
    throw new Error('Invalid Railway Google Cloud credentials JSON');
  }
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  console.log('✅ Using credentials from GOOGLE_APPLICATION_CREDENTIALS environment variable');
  console.log('📁 Credentials path:', credentialsPath);
  console.log('📄 File exists:', fs.existsSync(credentialsPath));
  
  // Initialize the Speech-to-Text client with credentials file
  try {
    client = new speech.SpeechClient({
      keyFilename: credentialsPath
    });
    console.log('✅ Successfully created Speech client with file-based credentials');
  } catch (error) {
    console.error('❌ Error creating Speech client with file credentials:', error.message);
    throw error;
  }
} else if (process.env.GOOGLE_CLOUD_CREDENTIALS_JSON) {
  // Use credentials from environment variable as JSON string
  console.log('✅ Using credentials from GOOGLE_CLOUD_CREDENTIALS_JSON environment variable');
  console.log('📏 JSON length:', process.env.GOOGLE_CLOUD_CREDENTIALS_JSON.length);
  
  try {
    const credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS_JSON);
    console.log('✅ Successfully parsed JSON credentials');
    console.log('🏢 Project ID:', credentials.project_id);
    console.log('📧 Client Email:', credentials.client_email);
    
    client = new speech.SpeechClient({
      credentials: credentials
    });
    console.log('✅ Successfully created Speech client with JSON credentials');
  } catch (error) {
    console.error('❌ Error creating Speech client with JSON credentials:', error.message);
    throw new Error('Invalid Google Cloud credentials JSON');
  }
} else {
  // Local development: use secrets directory
  credentialsPath = path.join(__dirname, '../secrets/gen-lang-client-0251517490-157aa58a7fda.json');
  console.log('🏠 Using local development credentials file');
  console.log('📁 Credentials path:', credentialsPath);
  console.log('📄 File exists:', fs.existsSync(credentialsPath));
  
  if (!fs.existsSync(credentialsPath)) {
    console.error('❌ Local credentials file not found');
    throw new Error('Local credentials file not found');
  }
  
  // Initialize the Speech-to-Text client with credentials file
  try {
    client = new speech.SpeechClient({
      keyFilename: credentialsPath
    });
    console.log('✅ Successfully created Speech client with local file credentials');
  } catch (error) {
    console.error('❌ Error creating Speech client with local file credentials:', error.message);
    throw error;
  }
}

console.log('🎯 Speech client initialization complete');
console.log('🤖 Client created:', !!client);
console.log('🔧 === SPEECH CONTROLLER INITIALIZATION COMPLETE ===');

/**
 * Transcribe speech audio to text
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.transcribeSpeech = async (req, res) => {
  console.log('🎤 === SPEECH-TO-TEXT REQUEST START ===');
  console.log('📅 Timestamp:', new Date().toISOString());
  console.log('🌐 Environment:', process.env.NODE_ENV || 'development');
  console.log('🚂 Railway Environment:', process.env.RAILWAY_ENVIRONMENT_NAME || 'not set');
  
  // Log environment variables
  console.log('🔑 Environment Variables:');
  console.log('  - GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS || 'not set');
  console.log('  - GOOGLE_CLOUD_CREDENTIALS_JSON:', process.env.GOOGLE_CLOUD_CREDENTIALS_JSON ? 'set (length: ' + process.env.GOOGLE_CLOUD_CREDENTIALS_JSON.length + ')' : 'not set');
  console.log('  - gen-lang-client-0251517490-157aa58a7fda.json:', process.env['gen-lang-client-0251517490-157aa58a7fda.json'] ? 'set (length: ' + process.env['gen-lang-client-0251517490-157aa58a7fda.json'].length + ')' : 'not set');
  
  // Log client status
  console.log('🤖 Speech Client Status:');
  console.log('  - Client created:', !!client);
  console.log('  - Client type:', typeof client);
  
  console.log('📨 Request Details:');
  console.log('  - Method:', req.method);
  console.log('  - URL:', req.url);
  console.log('  - Headers:', Object.keys(req.headers));
  console.log('  - Content-Type:', req.headers['content-type']);
  console.log('  - Authorization:', req.headers.authorization ? 'present' : 'missing');
  console.log('  - Body keys:', Object.keys(req.body));
  console.log('  - Audio data present:', !!req.body.audio);
  console.log('  - Audio data length:', req.body.audio ? req.body.audio.length : 'N/A');
  console.log('  - Audio data preview:', req.body.audio ? req.body.audio.substring(0, 100) + '...' : 'N/A');
  
  try {
    if (!req.body.audio) {
      console.error('❌ No audio data provided in request');
      return res.status(400).json({ error: 'No audio data provided' });
    }

    if (!client) {
      console.error('❌ Speech client not initialized');
      return res.status(500).json({ error: 'Speech-to-text service not properly configured - client not initialized' });
    }

    console.log('✅ Audio data received, length:', req.body.audio.length);
    console.log('✅ Audio data first 100 chars:', req.body.audio.substring(0, 100));

    // Configure the request
    const request = {
      audio: {
        content: req.body.audio, // Use the base64 string directly
      },
      config: {
        encoding: 'WEBM_OPUS',
        sampleRateHertz: 48000,
        languageCode: 'en-US',
        model: 'default',
        enableAutomaticPunctuation: false,
      },
    };

    console.log('📤 Sending request to Google Speech-to-Text API...');
    console.log('📋 Request config:', {
      encoding: request.config.encoding,
      sampleRateHertz: request.config.sampleRateHertz,
      languageCode: request.config.languageCode,
      model: request.config.model
    });
    
    // Perform the transcription
    const [response] = await client.recognize(request);
    console.log('✅ Received response from Google Speech-to-Text API');
    console.log('📊 Response details:');
    console.log('  - Results count:', response.results ? response.results.length : 0);
    console.log('  - Response structure:', Object.keys(response));
    
    if (response.results && response.results.length > 0) {
      console.log('📝 Transcription results:');
      response.results.forEach((result, index) => {
        console.log(`  Result ${index + 1}:`, {
          final: result.isFinal,
          alternatives: result.alternatives ? result.alternatives.length : 0,
          transcript: result.alternatives && result.alternatives[0] ? result.alternatives[0].transcript : 'none'
        });
      });
    }
    
    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');

    console.log('🎯 Final transcription:', transcription);
    console.log('✅ === SPEECH-TO-TEXT REQUEST SUCCESS ===');
    res.json({ text: transcription });
  } catch (error) {
    console.error('❌ === SPEECH-TO-TEXT REQUEST FAILED ===');
    console.error('Error transcribing speech:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    if (error.code === 'ENOENT' || error.code === 'ENOTFOUND') {
      console.error('❌ Google Cloud credentials file not found or invalid');
      res.status(500).json({ error: 'Speech-to-text service not properly configured - credentials file not found' });
    } else if (error.code === 7 || error.message.includes('PERMISSION_DENIED')) {
      console.error('❌ Permission denied - check if Speech-to-Text API is enabled');
      res.status(500).json({ error: 'Speech-to-text service not properly configured - permission denied' });
    } else if (error.code === 3 || error.message.includes('INVALID_ARGUMENT')) {
      console.error('❌ Invalid argument - check audio format and encoding');
      res.status(500).json({ error: 'Speech-to-text service not properly configured - invalid audio format' });
    } else {
      console.error('❌ Unknown error occurred');
      res.status(500).json({ error: 'Failed to transcribe speech - ' + error.message });
    }
  }
}; 