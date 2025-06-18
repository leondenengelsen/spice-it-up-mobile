const speech = require('@google-cloud/speech');
const path = require('path');

// Determine credentials path
let credentialsPath;
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
} else {
  // Local development: use secrets directory
  credentialsPath = path.join(__dirname, '../secrets/gen-lang-client-0251517490-157aa58a7fda.json');
}

// Log the credentials file path
console.log('Google Cloud credentials file path:', credentialsPath);

// Initialize the Speech-to-Text client with credentials file
const client = new speech.SpeechClient({
  keyFilename: credentialsPath
});

/**
 * Transcribe speech audio to text
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.transcribeSpeech = async (req, res) => {
  console.log('Received speech-to-text request');
  console.log('Request headers:', req.headers);
  console.log('Request body length:', req.body.audio ? req.body.audio.length : 'no audio data');
  
  try {
    if (!req.body.audio) {
      console.error('No audio data provided in request');
      return res.status(400).json({ error: 'No audio data provided' });
    }

    console.log('Audio data received, length:', req.body.audio.length);
    console.log('Audio data first 100 chars:', req.body.audio.substring(0, 100));

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
        enableAutomaticPunctuation: true,
      },
    };

    console.log('Sending request to Google Speech-to-Text API');
    // Perform the transcription
    const [response] = await client.recognize(request);
    console.log('Received response from Google Speech-to-Text API');
    console.log('Response:', JSON.stringify(response, null, 2));
    
    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');

    console.log('Transcription result:', transcription);
    res.json({ text: transcription });
  } catch (error) {
    console.error('Error transcribing speech:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    if (error.code === 'ENOENT' || error.code === 'ENOTFOUND') {
      console.error('Google Cloud credentials file not found or invalid');
      res.status(500).json({ error: 'Speech-to-text service not properly configured' });
    } else {
      res.status(500).json({ error: 'Failed to transcribe speech' });
    }
  }
}; 