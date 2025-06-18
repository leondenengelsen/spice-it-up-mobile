console.log('[SpeechRecorder] speech.js script tag executed!');
// import { getApiUrl } from './config.js';
// import { Permissions } from 'https://cdn.jsdelivr.net/npm/@capacitor/core@5.0.6/dist/esm/index.js';
import { Media } from '@capacitor-community/media';

document.addEventListener('DOMContentLoaded', () => {
    console.log('[SpeechRecorder] DOMContentLoaded fired!');
    window.speechRecorder = new SpeechRecorder();
    window.startRecording = () => window.speechRecorder.startRecording();
    window.stopRecording = () => window.speechRecorder.stopRecording();
    console.log('[SpeechRecorder] speech.js loaded!');
    window.addEventListener('startRecording', () => {
        console.log('[SpeechRecorder] startRecording event RECEIVED');
    });
});

class SpeechRecorder {
    constructor() {
        this.isRecording = false;
        this.hasPermission = false;
        // Bind methods
        this.startRecording = this.startRecording.bind(this);
        this.stopRecording = this.stopRecording.bind(this);
        // Listen for recording events from the interface manager
        window.addEventListener('startRecording', () => {
            console.log('🎤 Received startRecording event in SpeechRecorder');
            this.startRecording();
        });
        window.addEventListener('stopRecording', () => {
            console.log('⏹️ Received stopRecording event in SpeechRecorder');
            this.stopRecording();
        });
    }

    async startRecording() {
        if (this.isRecording) {
            console.log('[SpeechRecorder] Already recording, ignoring start request');
            return;
        }
        console.log('[SpeechRecorder] Requesting audio recording permission...');
        try {
            const permResult = await Media.requestPermissions();
            console.log('[SpeechRecorder] Permission result:', permResult);
            if (permResult.audio !== 'granted') {
                alert('Microphone permission is required for this feature. Please enable it in your device settings.');
                return;
            }
            console.log('[SpeechRecorder] Starting recording with Media plugin...');
            await Media.startAudioRecording();
            this.isRecording = true;
            console.log('[SpeechRecorder] Recording started (plugin)');
        } catch (error) {
            console.error('[SpeechRecorder] Error starting recording (plugin):', error, error.name, error.message);
            this.isRecording = false;
            this.hasPermission = false;
            alert('Could not access microphone. Please make sure you have granted microphone permissions.');
        }
    }

    async stopRecording() {
        if (!this.isRecording) {
            console.log('[SpeechRecorder] Not recording, ignoring stop request');
            return;
        }
        try {
            console.log('[SpeechRecorder] Stopping recording with Media plugin...');
            const result = await Media.stopAudioRecording();
            this.isRecording = false;
            console.log('[SpeechRecorder] Recording stopped (plugin), result:', result);
            // TODO: send result.path or result.value to your backend as needed
        } catch (error) {
            console.error('[SpeechRecorder] Error stopping recording (plugin):', error, error.name, error.message);
            this.isRecording = false;
        }
    }

    async sendAudioToServer(audioBlob) {
        try {
            console.log('Converting audio to base64...');
            const base64Audio = await this.blobToBase64(audioBlob);
            const token = localStorage.getItem('firebaseToken');
            
            if (!token) {
                console.error('No authentication token found');
                return;
            }

            console.log('Sending audio to server...');
            const response = await fetch(`${getApiUrl()}/api/speech-to-text`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ audio: base64Audio })
            });

            if (!response.ok) {
                console.error('Failed to transcribe audio:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error('Failed to transcribe audio');
            }

            const data = await response.json();
            console.log('Received transcription:', data);
            if (data.text) {
                console.log('Setting input field value to:', data.text);
                const inputField = document.getElementById('user-input');
                if (!inputField) {
                    console.error('Input field not found');
                    return;
                }
                inputField.value = data.text;
                console.log('Input field value set to:', inputField.value);
                
                console.log('Dispatching input event to trigger recipe generation');
                inputField.dispatchEvent(new Event('input', { bubbles: true }));
                
                // Also try to directly generate recipes
                console.log('Checking if generateRecipes is available:', typeof window.generateRecipes);
                if (typeof window.generateRecipes === 'function') {
                    console.log('Directly calling generateRecipes after transcription');
                    try {
                        await window.generateRecipes(true);
                        console.log('generateRecipes called successfully');
                    } catch (error) {
                        console.error('Error calling generateRecipes:', error);
                    }
                } else {
                    console.error('generateRecipes function not found on window');
                }
            } else {
                console.log('No transcription text received');
            }
        } catch (error) {
            console.error('Error sending audio to server:', error);
        }
    }

    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result.split(',')[1];
                resolve(base64String);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
} 