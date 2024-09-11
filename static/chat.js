document.addEventListener('DOMContentLoaded', function() {
    const sendBtn = document.querySelector('.VuesaxBoldSend');
    const chatInput = document.getElementById('chatInput');
    const chatOutput = document.getElementById('chatOutput');

    let chatHistory = [];

    async function sendPrompt() {
        const prompt = chatInput.value;
        if (!prompt) return; // 如果输入框为空则不发送请求

        // 添加用户的问题到聊天框中
        chatOutput.innerHTML += `
            <div style="margin-top: 10px; padding: 10px; border-radius: 10px; background: #E0F7FA; align-self: flex-end; font-size: 18px; line-height: 1.5;">
                🧑‍💬 ${prompt}
            </div>
        `;

        chatInput.value = ''; // 清空输入框

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

    sendBtn.addEventListener('click', sendPrompt);

    chatInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            sendPrompt();
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const backButton = document.querySelector('.Back');
    if (backButton) {
      backButton.addEventListener('click', () => {
        window.location.href = 'mainpage_1.html';
      });
    }
});
