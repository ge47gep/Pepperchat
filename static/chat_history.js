document.addEventListener('DOMContentLoaded', () => {
    const sendBtn = document.querySelector('.VuesaxBoldSend');
    const chatInput = document.getElementById('chatInput');
    const chatOutput = document.getElementById('chatOutput');

    let chatHistory = [];

    async function sendPrompt(prompt) {
        if (!prompt) return; // 如果输入为空则不发送请求

        // 添加用户的问题到聊天框中
        chatOutput.innerHTML += `
            <div style="margin-top: 10px; padding: 10px; border-radius: 10px; background: #E0F7FA; align-self: flex-end; font-size: 18px; line-height: 1.5;">
                🧑‍💬 ${prompt}
            </div>
        `;

        try {
            const response = await fetch('http://127.0.0.1:5100/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    prompt: prompt, 
                    chat_history: chatHistory,
                    patient_id: null // 如果需要，可以设置为特定ID
                })
            });

            const result = await response.json();

            if (response.ok) {
                // 设置聊天框样式并使其显示
                chatOutput.style.position = 'absolute';
                chatOutput.style.top = '250px';
                chatOutput.style.left = '575px';
                chatOutput.style.width = '710px';
                chatOutput.style.height = '580px';
                chatOutput.style.background = 'white';
                chatOutput.style.padding = '20px';
                chatOutput.style.borderRadius = '10px';
                chatOutput.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.1)';
                chatOutput.style.display = 'block';
                chatOutput.style.zIndex = '1000';
                chatOutput.style.overflowY = 'auto';

                // 添加 AI 的回复到聊天框中
                chatOutput.innerHTML += `
                    <div style="margin-top: 10px; padding: 10px; border-radius: 10px; background: #EEEEEE; align-self: flex-start; font-size: 18px; line-height: 1.5;">
                        🤖 ${result.content}
                    </div>
                `;
                chatHistory = result.chat_history;

                // 语音合成并播放 AI 的回复
                const utterance = new SpeechSynthesisUtterance(result.content);
                window.speechSynthesis.speak(utterance);
            } else {
                chatOutput.innerHTML += `
                    <div style="margin-top: 10px; padding: 10px; border-radius: 10px; background: #FFEEEE; align-self: flex-start;">
                        Error: ${result.error}
                    </div>
                `;
            }

            chatOutput.scrollTop = chatOutput.scrollHeight; // 自动滚动到底部
        } catch (error) {
            console.log('Error:', error);
            chatOutput.innerHTML += `
                <div style="margin-top: 10px; padding: 10px; border-radius: 10px; background: #FFEEEE; align-self: flex-start;">
                    Error: ${error.message}
                </div>
            `;
        }
    }

    function getChatHistory() {
        const messages = Array.from(chatOutput.children).map(child => {
            return {
                role: child.style.alignSelf === 'flex-end' ? 'user' : 'assistant',
                content: child.textContent.trim().slice(2) // 去掉前面的 emoji
            };
        });
        return messages;
    }

    // 初始化时发送消息
    window.addEventListener('message', (event) => {
        if (event.data.type === 'newMessage') {
            chatInput.value = event.data.text;
            sendPrompt(event.data.text);
        }
    });

    sendBtn.addEventListener('click', () => {
        const prompt = chatInput.value;
        sendPrompt(prompt);
        chatInput.value = ''; // 清空输入框
    });

    chatInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            const prompt = chatInput.value;
            sendPrompt(prompt);
            chatInput.value = ''; // 清空输入框
        }
    });

    const backButton = document.querySelector('.Back');
    if (backButton) {
        backButton.addEventListener('click', () => {
            window.location.href = 'voicechat.html';
        });
    }
});