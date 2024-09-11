document.addEventListener('DOMContentLoaded', () => {
    const chatInput = document.getElementById('chatInput');
    const chatOutput = document.getElementById('chatOutput');
    const voiceStop = document.querySelector('.voicestop');

    let chatHistory = [];
    let socket;
    let mediaRecorder;
    let finalTranscript = '';
    let isRecording = false;
    let mediaStream;

    function setupWebSocket() {
        socket = new WebSocket('ws://localhost:2700');
        socket.binaryType = 'arraybuffer';

        socket.onopen = () => {
            console.log('WebSocket connection opened.');
            isRecording = true;
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Received data from Vosk:', data);
            if (data.text) {
                finalTranscript = data.text;
                console.log('Final transcript:', finalTranscript);
                if (isRecording) {
                    isRecording = false;
                    handleFinalTranscript(finalTranscript);
                }
            } else if (data.partial) {
                console.log('Partial result:', data.partial);
            }
        };

        socket.onclose = () => {
            console.log('WebSocket connection closed.');
            if (isRecording) {
                isRecording = false;
                handleFinalTranscript(finalTranscript);
            }
            setTimeout(setupWebSocket, 5000);
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            if (isRecording) {
                isRecording = false;
                handleFinalTranscript(finalTranscript);
            }
        };
    }

    let audioContext;
let mediaStreamSource;
let processor;

function startRecording() {
    navigator.mediaDevices.getUserMedia({ 
        audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true
        } 
    })
    .then(stream => {
        mediaStream = stream;
        audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
        mediaStreamSource = audioContext.createMediaStreamSource(stream);
        processor = audioContext.createScriptProcessor(1024, 1, 1);

        mediaStreamSource.connect(processor);
        processor.connect(audioContext.destination);

        processor.onaudioprocess = (e) => {
            if (socket.readyState === WebSocket.OPEN) {
                const inputData = e.inputBuffer.getChannelData(0);
                const outputData = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                    const s = Math.max(-1, Math.min(1, inputData[i]));
                    outputData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }
                console.log('Sending audio chunk, size:', outputData.byteLength);
                socket.send(outputData.buffer);
            }
        };

        console.log('Audio processing started with sample rate:', audioContext.sampleRate);
    })
    .catch(error => {
        console.error('Error accessing media devices.', error);
        displayError('无法访问麦克风。请检查您的设备设置。');
    });
}

function stopRecording() {
    if (processor) {
        processor.disconnect();
        mediaStreamSource.disconnect();
    }
    if (audioContext) {
        audioContext.close();
    }
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
    }
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
    }
}

    function handleFinalTranscript(transcript) {
        if (!transcript) return;

        console.log('Sending prompt:', transcript);

        chatOutput.innerHTML += `
            <div style="margin-top: 10px; padding: 10px; border-radius: 10px; background: #E0F7FA; align-self: flex-end; font-size: 18px; line-height: 1.5;">
                🧑‍💬 ${transcript}
            </div>
        `;

        fetch('http://127.0.0.1:5100/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                prompt: transcript, 
                chat_history: chatHistory,
                patient_id: null
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(result => {
            chatOutput.innerHTML += `
                <div style="margin-top: 10px; padding: 10px; border-radius: 10px; background: #EEEEEE; align-self: flex-start; font-size: 18px; line-height: 1.5;">
                    🤖 ${result.content}
                </div>
            `;
            chatHistory = result.chat_history;

            const utterance = new SpeechSynthesisUtterance(result.content);
            window.speechSynthesis.speak(utterance);
        })
        .catch(error => {
            console.error('Error:', error);
            chatOutput.innerHTML += `
                <div style="margin-top: 10px; padding: 10px; border-radius: 10px; background: #FFEEEE; align-self: flex-start;">
                    Error: ${error.message}
                </div>
            `;
        })
        .finally(() => {
            chatOutput.scrollTop = chatOutput.scrollHeight;
        });
    }

    function displayError(message) {
        chatOutput.innerHTML += `
            <div style="margin-top: 10px; padding: 10px; border-radius: 10px; background: #FFEEEE; align-self: flex-start;">
                Error: ${message}
            </div>
        `;
        chatOutput.scrollTop = chatOutput.scrollHeight;
    }

    function initialize() {
        setupWebSocket();
        startRecording();
    }

    initialize();

    if (voiceStop) {
        voiceStop.addEventListener('click', stopRecording);
    }
});