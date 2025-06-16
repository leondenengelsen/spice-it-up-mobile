const speech = require('@google-cloud/speech');

// Initialize the Speech-to-Text client with API key
const client = new speech.SpeechClient({
  key: process.env.GOOGLE_CLOUD_API_KEY
});

/**
 * Transcribe speech audio to text
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.transcribeSpeech = async (req, res) => {
  try {
    if (!req.body.audio) {
      return res.status(400).json({ error: 'No audio data provided' });
    }

    // Convert base64 audio to buffer
    const audioBytes = Buffer.from(req.body.audio, 'base64');

    // Configure the request
    const request = {
      audio: {
        content: audioBytes.toString('base64'),
      },
      config: {
        encoding: 'WEBM_OPUS',
        sampleRateHertz: 48000,
        languageCode: 'en-US',
        model: 'default',
        enableAutomaticPunctuation: true,
      },
    };

    // Perform the transcription
    const [response] = await client.recognize(request);
    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');

    res.json({ text: transcription });
  } catch (error) {
    console.error('Error transcribing speech:', error);
    res.status(500).json({ error: 'Failed to transcribe speech' });
  }
}; 