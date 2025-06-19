console.log('[SpeechRecorder] speech.js script tag executed!');

// Import getApiUrl from config
import { getApiUrl } from './config.js';

class SpeechRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.hasPermission = false;
        this.recordingTimeout = null;
        this.maxRecordingTime = 10000; // 10 seconds
        this.audioStream = null;
        
        // Bind methods to preserve this context
        this.startRecording = this.startRecording.bind(this);
        this.stopRecording = this.stopRecording.bind(this);
        this.initMic = this.initMic.bind(this);
        
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

    async initMic() {
        console.log('Initializing microphone...');
        
        // Check if getUserMedia is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error('getUserMedia is not supported in this browser');
            alert('Microphone access is not supported in this browser.');
            return false;
        }
        
        console.log('getUserMedia is available:', navigator.mediaDevices.getUserMedia);
        
        // Check if we're in Capacitor/Android
        const isCapacitor = !!(window.Capacitor && (window.Capacitor.isNative || window.Capacitor.platform !== 'web'));
        console.log('Is Capacitor:', isCapacitor);
        console.log('Platform:', window.Capacitor?.platform);
        
        try {
            // For Android WebView, try a simpler audio request first
            let audioConstraints = { audio: true };
            
            if (isCapacitor && window.Capacitor.platform === 'android') {
                console.log('Android detected - using simple audio constraints');
                audioConstraints = { audio: true };
            } else {
                console.log('Using enhanced audio constraints');
                audioConstraints = { 
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                };
            }
            
            // Request microphone permission and get stream
            console.log('Requesting microphone permission with constraints:', audioConstraints);
            this.audioStream = await navigator.mediaDevices.getUserMedia(audioConstraints);
            
            console.log('Microphone permission granted, stream obtained');
            console.log('Stream tracks:', this.audioStream.getTracks().map(t => t.kind));
            this.hasPermission = true;
            return true;
            
        } catch (error) {
            console.error('Error initializing microphone:', error);
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            
            if (error.name === 'NotAllowedError') {
                console.log('Permission denied - showing user instructions');
                if (window.Capacitor && window.Capacitor.platform !== 'web') {
                    alert('Microphone permission is required. Please:\n\n1. Go to your device Settings\n2. Find this app\n3. Enable Microphone permission\n4. Try again\n\nIf the permission is already enabled, try restarting the app.');
                } else {
                    alert('Microphone permission is required. Please allow microphone access when prompted.');
                }
            } else if (error.name === 'NotFoundError') {
                alert('No microphone found on this device.');
            } else if (error.name === 'NotSupportedError') {
                alert('Audio recording is not supported on this device.');
            } else {
                alert('Could not access microphone. Please make sure you have granted microphone permissions.');
            }
            
            this.hasPermission = false;
            return false;
        }
    }

    async startRecording() {
        if (this.isRecording) {
            console.log('Already recording, ignoring start request');
            return;
        }

        console.log('Starting recording...');
        
        try {
            // Check if MediaRecorder is supported
            if (!window.MediaRecorder) {
                throw new Error('MediaRecorder is not supported in this browser');
            }
            
            console.log('MediaRecorder is supported');
            
            // Check if we're in Capacitor/Android
            const isCapacitor = !!(window.Capacitor && (window.Capacitor.isNative || window.Capacitor.platform !== 'web'));
            console.log('Is Capacitor:', isCapacitor);
            
            // Initialize microphone if not already done
            if (!this.hasPermission || !this.audioStream) {
                const micInitialized = await this.initMic();
                if (!micInitialized) {
                    throw new Error('Failed to initialize microphone');
                }
            }
            
            // Try different MIME types in order of preference
            const mimeTypes = [
                'audio/webm;codecs=opus',
                'audio/webm',
                'audio/mp4',
                'audio/ogg;codecs=opus',
                'audio/wav'
            ];
            
            let selectedMimeType = null;
            for (const mimeType of mimeTypes) {
                if (MediaRecorder.isTypeSupported(mimeType)) {
                    selectedMimeType = mimeType;
                    console.log('Using MIME type:', selectedMimeType);
                    break;
                }
            }
            
            if (!selectedMimeType) {
                console.log('No supported MIME type found, using default');
                selectedMimeType = '';
            }
            
            console.log('Creating MediaRecorder with MIME type:', selectedMimeType);
            
            // Create MediaRecorder with the existing stream
            this.mediaRecorder = new MediaRecorder(this.audioStream, {
                mimeType: selectedMimeType
            });
            
            console.log('MediaRecorder created successfully');
            
            this.audioChunks = [];

            // Handle data available event
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    console.log('Received audio chunk:', event.data.size, 'bytes');
                    this.audioChunks.push(event.data);
                }
            };

            // Handle recording stop
            this.mediaRecorder.onstop = async () => {
                console.log('Recording stopped, processing audio...');
                console.log('Audio chunks count:', this.audioChunks.length);
                if (this.audioChunks.length > 0) {
                    const audioBlob = new Blob(this.audioChunks, { type: selectedMimeType || 'audio/webm' });
                    console.log('Audio blob created, size:', audioBlob.size, 'bytes');
                    try {
                        await this.sendAudioToServer(audioBlob);
                    } catch (error) {
                        console.error('Error in onstop handler:', error);
                    }
                } else {
                    console.log('No audio chunks recorded');
                }
            };

            // Handle recording errors
            this.mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event.error);
                this.isRecording = false;
                this.forceCleanup();
            };

            // Start recording
            console.log('Starting MediaRecorder...');
            this.mediaRecorder.start(100); // Collect data every 100ms
            this.isRecording = true;
            console.log('Recording started successfully');

            // Set timeout to stop recording after maxRecordingTime
            this.recordingTimeout = setTimeout(() => {
                console.log('⏰ Recording timeout reached after', this.maxRecordingTime, 'ms');
                if (this.isRecording) {
                    console.log('Max recording time reached, stopping...');
                    this.stopRecording();
                } else {
                    console.log('Recording already stopped, ignoring timeout');
                }
            }, this.maxRecordingTime);

        } catch (error) {
            console.error('Error starting recording:', error);
            console.error('Error details:', error.name, error.message);
            console.error('Error stack:', error.stack);
            
            this.isRecording = false;
            this.hasPermission = false;
        }
    }

    stopRecording() {
        if (!this.isRecording) {
            console.log('Not recording, ignoring stop request');
            return;
        }

        console.log('Stopping recording...');
        console.log('MediaRecorder state:', this.mediaRecorder?.state);
        
        if (this.recordingTimeout) {
            clearTimeout(this.recordingTimeout);
            this.recordingTimeout = null;
        }

        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            console.log('Stopping MediaRecorder...');
            try {
                this.mediaRecorder.stop();
                console.log('MediaRecorder.stop() called successfully');
            } catch (error) {
                console.error('Error stopping MediaRecorder:', error);
                // Force cleanup even if stop fails
                this.forceCleanup();
            }
        } else {
            console.log('MediaRecorder not in recording state, forcing cleanup');
            this.forceCleanup();
        }

        this.isRecording = false;
    }

    // Force cleanup when MediaRecorder.stop() fails
    forceCleanup() {
        console.log('Force cleaning up recording...');
        if (this.audioChunks.length > 0) {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            console.log('Creating audio blob from chunks, size:', audioBlob.size, 'bytes');
            this.sendAudioToServer(audioBlob);
        } else {
            console.log('No audio chunks to process');
        }
    }

    // Clean up method to stop and release microphone
    cleanup() {
        console.log('Cleaning up microphone resources...');
        
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        
        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => {
                console.log('Stopping audio track:', track.kind);
                track.stop();
            });
            this.audioStream = null;
        }
        
        this.isRecording = false;
        this.hasPermission = false;
        this.audioChunks = [];
        
        if (this.recordingTimeout) {
            clearTimeout(this.recordingTimeout);
            this.recordingTimeout = null;
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

// Initialize the speech recorder when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('[SpeechRecorder] DOMContentLoaded fired!');
    window.speechRecorder = new SpeechRecorder();
    window.startRecording = () => window.speechRecorder.startRecording();
    window.stopRecording = () => window.speechRecorder.stopRecording();
    window.initMic = () => window.speechRecorder.initMic();
    console.log('[SpeechRecorder] speech.js loaded!');
}); 