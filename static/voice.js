document.addEventListener('DOMContentLoaded', function() {
    const chatOutput = document.getElementById('chatOutput');
    const voiceStart = document.querySelector('.voicewavestart');
    const voiceStop = document.querySelector('.voicestop');

    let chatHistory = [];
    let mediaRecorder;
    let audioChunks = [];
    let isRecording = false;

    const API_KEY = 'AIzaSyCK8A-xjBY5vFCW1KXDSwQbsf7CFa7h0BE';

    function startRecording() {
        console.log('Starting recording...');
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                console.log('Microphone access granted');
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];
                isRecording = true;

                mediaRecorder.ondataavailable = event => {
                    audioChunks.push(event.data);
                    console.log('Audio chunk received, size:', event.data.size);
                };

                mediaRecorder.onstop = sendAudioToGoogle;

                mediaRecorder.start(1000);
                voiceStart.style.display = 'block';
                voiceStop.style.display = 'none';

                setTimeout(() => {
                    if (isRecording) {
                        console.log('Auto-stopping recording after 15 seconds');
                        stopRecording();
                    }
                }, 15000);
            })
            .catch(error => {
                console.error('Error accessing media devices:', error);
                displayError('无法访问麦克风。请检查您的设备设置。');
            });
    }

    function stopRecording() {
        console.log('Stopping recording...');
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();   
            isRecording = false;
            voiceStart.style.display = 'none';
            voiceStop.style.display = 'block';
        }
    }

    function sendAudioToGoogle() {
        console.log('Sending audio to Google...');
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        console.log('Audio blob size:', audioBlob.size);

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = function() {
            const base64Audio = reader.result.split(',')[1];
            
            const requestBody = {
                config: {
                    encoding: "WEBM_OPUS",
                    sampleRateHertz: 48000,
                    languageCode: "en-US",
                },
                audio: {
                    content: base64Audio
                }
            };

            console.log('Sending request to Google Speech-to-Text API');
            fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            })
            .then(response => response.json())
            .then(data => {
                console.log('Received response from Google:', data);
                if (data.results && data.results.length > 0) {
                    const transcript = data.results[0].alternatives[0].transcript;
                    console.log('Transcript:', transcript);
                    processTranscript(transcript);
                } else {
                    console.log('No transcription result');
                    displayError('No speech detected. Please try again.');
                }
            })
            .catch(error => {
                console.error('Error with Google Speech-to-Text API:', error);
                displayError('Failed to process speech. Please try again.');
            });
        };
    }

    async function processTranscript(transcript) {
        if (!transcript) return;

        chatOutput.innerHTML += `
            <div style="margin-top: 10px; padding: 10px; border-radius: 10px; background: #E0F7FA; align-self: flex-end; font-size: 18px; line-height: 1.5;">
                🧑‍💬 ${transcript}
            </div>
        `;

        try {
            const response = await fetch('http://127.0.0.1:5100/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    prompt: transcript, 
                    chat_history: chatHistory,
                    patient_id: null
                })
            });

            const result = await response.json();

            if (response.ok) {
                chatOutput.innerHTML += `
                    <div style="margin-top: 10px; padding: 10px; border-radius: 10px; background: #EEEEEE; align-self: flex-start; font-size: 18px; line-height: 1.5;">
                        🤖 ${result.content}
                    </div>
                `;
                chatHistory = result.chat_history;

                const utterance = new SpeechSynthesisUtterance(result.content);
                utterance.lang = 'en-US';  // 指定使用英文语音合成
                window.speechSynthesis.speak(utterance);

            } else {
                displayError(`Error: ${result.error}`);
            }

            chatOutput.scrollTop = chatOutput.scrollHeight;
        } catch (error) {
            console.log('Error:', error);
            displayError(`Error: ${error.message}`);
        }
    }

    function displayError(message) {
        console.error('Error:', message);
        chatOutput.innerHTML += `
            <div style="margin-top: 10px; padding: 10px; border-radius: 10px; background: #FFEEEE; align-self: flex-start;">
                Error: ${message}
            </div>
        `;
        chatOutput.scrollTop = chatOutput.scrollHeight;
    }

    voiceStop.addEventListener('click', startRecording);
    voiceStart.addEventListener('click', stopRecording);

    const backButton = document.querySelector('.Back');
    if (backButton) {
        backButton.addEventListener('click', () => {
            window.location.href = 'mainpage_1.html';
        });
    }
});