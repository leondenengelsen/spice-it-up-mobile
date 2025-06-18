console.log('[SpeechRecorder] speech.js script tag executed!');
document.addEventListener('DOMContentLoaded', () => {
    console.log('[SpeechRecorder] DOMContentLoaded fired!');
    window.speechRecorder = new SpeechRecorder();
    // Expose start/stopRecording globally for troubleshooting and hybrid app compatibility
    window.startRecording = () => window.speechRecorder.startRecording();
    window.stopRecording = () => window.speechRecorder.stopRecording();
    console.log('[SpeechRecorder] speech.js loaded!');
    window.addEventListener('startRecording', () => {
        console.log('[SpeechRecorder] startRecording event RECEIVED');
    });
});

// Import getApiUrl from config
import { getApiUrl } from './config.js';
import { Permissions } from 'https://cdn.jsdelivr.net/npm/@capacitor/core@5.0.6/dist/esm/index.js';

class SpeechRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.hasPermission = false;
        this.recordingTimeout = null;
        this.maxRecordingTime = 10000; // 10 seconds
        
        // Bind methods to preserve this context
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

        console.log('[SpeechRecorder] Starting recording...');
        try {
            console.log('[SpeechRecorder] About to request microphone permission');
            // Request microphone permission if running in Capacitor/native
            if (window.Capacitor && (window.Capacitor.isNative || window.Capacitor.platform !== 'web')) {
                console.log('[SpeechRecorder] Detected Capacitor/native environment');
                const status = await Permissions.request({ name: 'microphone' });
                console.log('[SpeechRecorder] Microphone permission request result:', status);
                if (status.state !== 'granted') {
                    alert('Microphone permission is required for this feature. Please enable it in your device settings.');
                    return;
                }
            } else {
                console.log('[SpeechRecorder] Not running in Capacitor/native, skipping Permissions.request');
            }
            console.log('[SpeechRecorder] Requesting getUserMedia...');
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.error('[SpeechRecorder] navigator.mediaDevices.getUserMedia is not available!');
            }
            // Request microphone permission and get stream
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            console.log('[SpeechRecorder] Got microphone permission and stream:', stream);
            // Create MediaRecorder with the stream
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });
            console.log('[SpeechRecorder] MediaRecorder created:', this.mediaRecorder);
            this.audioChunks = [];
            this.hasPermission = true;

            // Handle data available event
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    console.log('[SpeechRecorder] Received audio chunk:', event.data.size, 'bytes');
                    this.audioChunks.push(event.data);
                }
            };

            // Handle recording stop
            this.mediaRecorder.onstop = async () => {
                console.log('[SpeechRecorder] Recording stopped, processing audio...');
                if (this.audioChunks.length > 0) {
                    const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                    console.log('[SpeechRecorder] Audio blob created, size:', audioBlob.size, 'bytes');
                    await this.sendAudioToServer(audioBlob);
                } else {
                    console.log('[SpeechRecorder] No audio chunks recorded');
                }
                // Stop all tracks in the stream
                stream.getTracks().forEach(track => track.stop());
            };

            // Start recording
            this.mediaRecorder.start(100); // Collect data every 100ms
            this.isRecording = true;
            console.log('[SpeechRecorder] Recording started successfully');

            // Set timeout to stop recording after maxRecordingTime
            this.recordingTimeout = setTimeout(() => {
                if (this.isRecording) {
                    console.log('[SpeechRecorder] Max recording time reached, stopping...');
                    this.stopRecording();
                }
            }, this.maxRecordingTime);

        } catch (error) {
            console.error('[SpeechRecorder] Error starting recording:', error);
            this.isRecording = false;
            this.hasPermission = false;
            // Show error to user
            alert('Could not access microphone. Please make sure you have granted microphone permissions.');
        }
    }

    stopRecording() {
        if (!this.isRecording) {
            // console.log('Not recording, ignoring stop request');
            return;
        }

        console.log('Stopping recording...');
        
        if (this.recordingTimeout) {
            clearTimeout(this.recordingTimeout);
            this.recordingTimeout = null;
        }

        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            // console.log('Stopping MediaRecorder...');
            this.mediaRecorder.stop();
        } else {
            // console.log('MediaRecorder not active, nothing to stop');
        }

        this.isRecording = false;
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