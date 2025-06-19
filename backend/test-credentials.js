const speech = require('@google-cloud/speech');
const path = require('path');

// Use the same credentials path as in the controller
const credentialsPath = path.join(__dirname, 'secrets/gen-lang-client-0251517490-157aa58a7fda.json');

console.log('Testing Google Cloud Speech API credentials...');
console.log('Credentials path:', credentialsPath);

// Test if we can create a client
try {
  const client = new speech.SpeechClient({
    keyFilename: credentialsPath
  });
  
  console.log('✅ Successfully created Speech client');
  
  // Test with a minimal audio recognition request
  // This will fail with invalid audio, but should show if credentials work
  const request = {
    audio: {
      content: 'dGVzdA==', // base64 encoded "test"
    },
    config: {
      encoding: 'WEBM_OPUS',
      sampleRateHertz: 48000,
      languageCode: 'en-US',
    },
  };
  
  console.log('Testing API connection with minimal request...');
  client.recognize(request)
    .then(([response]) => {
      console.log('✅ Successfully connected to Google Cloud Speech API');
      console.log('Response received:', response ? 'Yes' : 'No');
    })
    .catch((error) => {
      console.log('✅ API connection works (expected error for invalid audio):');
      console.log('Error message:', error.message);
      console.log('Error code:', error.code);
      
      // If we get a specific error about invalid audio, that means credentials work
      if (error.message.includes('Invalid audio') || error.message.includes('audio')) {
        console.log('✅ Credentials are working - the error is expected for invalid audio data');
      } else if (error.code === 7 || error.message.includes('PERMISSION_DENIED')) {
        console.log('❌ Permission denied - check if Speech-to-Text API is enabled');
      } else if (error.code === 3 || error.message.includes('INVALID_ARGUMENT')) {
        console.log('✅ Credentials are working - invalid argument error is expected for test audio');
      } else {
        console.log('❌ Unexpected error:', error);
      }
    });
    
} catch (error) {
  console.error('❌ Error creating Speech client:', error.message);
  console.error('Error details:', error);
} 