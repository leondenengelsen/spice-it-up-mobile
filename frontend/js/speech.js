class SpeechRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.hasPermission = false;
        this.recordingTimeout = null;
        this.maxRecordingTime = 10000; // 10 seconds
        
        // Listen for recording events from the interface manager
        window.addEventListener('startRecording', () => this.startRecording());
        window.addEventListener('stopRecording', () => this.stopRecording());
    }

    async startRecording() {
        if (this.isRecording) {
            console.log('Already recording, ignoring start request');
            return;
        }

        console.log('Starting recording...');
        
        try {
            // Request microphone permission and get stream
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            console.log('Got microphone permission and stream');
            
            // Create MediaRecorder with the stream
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });
            
            this.audioChunks = [];
            this.hasPermission = true;

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
                if (this.audioChunks.length > 0) {
                    const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                    console.log('Audio blob created, size:', audioBlob.size, 'bytes');
                    await this.sendAudioToServer(audioBlob);
                } else {
                    console.log('No audio chunks recorded');
                }
                // Stop all tracks in the stream
                stream.getTracks().forEach(track => track.stop());
            };

            // Start recording
            this.mediaRecorder.start(100); // Collect data every 100ms
            this.isRecording = true;
            console.log('Recording started successfully');

            // Set timeout to stop recording after maxRecordingTime
            this.recordingTimeout = setTimeout(() => {
                if (this.isRecording) {
                    console.log('Max recording time reached, stopping...');
                    this.stopRecording();
                }
            }, this.maxRecordingTime);

        } catch (error) {
            console.error('Error starting recording:', error);
            this.isRecording = false;
            this.hasPermission = false;
            // Show error to user
            alert('Could not access microphone. Please make sure you have granted microphone permissions.');
        }
    }

    stopRecording() {
        if (!this.isRecording) {
            console.log('Not recording, ignoring stop request');
            return;
        }

        console.log('Stopping recording...');
        
        if (this.recordingTimeout) {
            clearTimeout(this.recordingTimeout);
            this.recordingTimeout = null;
        }

        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            console.log('Stopping MediaRecorder...');
            this.mediaRecorder.stop();
        } else {
            console.log('MediaRecorder not active, nothing to stop');
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
            const response = await fetch('/api/speech-to-text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ audio: base64Audio })
            });

            if (!response.ok) {
                throw new Error('Failed to transcribe audio');
            }

            const data = await response.json();
            console.log('Received transcription:', data);
            if (data.text) {
                const inputField = document.getElementById('user-input');
                inputField.value = data.text;
                inputField.dispatchEvent(new Event('input'));
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
    window.speechRecorder = new SpeechRecorder();
}); 