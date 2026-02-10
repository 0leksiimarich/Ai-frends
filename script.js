import CONFIG from './config.js';

const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const historyList = document.getElementById('history-list');

// Ініціалізація контексту для українського AI
const SYSTEM_PROMPT = "Ти — AI Друг, корисний та ввічливий асистент. Ти завжди відповідаєш українською мовою. Твоє завдання — допомагати користувачеві з його запитами.";

// Placeholder для майбутньої інтеграції Firebase Auth
document.getElementById('login-btn').addEventListener('click', () => {
    console.log("Ініціалізація Firebase Auth...");
    alert("Інтеграція з Google Sign-In скоро з'явиться!");
});

userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = userInput.scrollHeight + 'px';
    sendBtn.disabled = !userInput.value.trim();
});

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
});

sendBtn.addEventListener('click', handleSendMessage);

async function handleSendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    const welcome = document.querySelector('.welcome-screen');
    if (welcome) welcome.remove();

    appendMessage('user', text);
    userInput.value = '';
    userInput.style.height = 'auto';
    sendBtn.disabled = true;

    const loader = showLoader();

    try {
        const response = await fetch(`${CONFIG.API_URL}?key=${CONFIG.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{ text: `${SYSTEM_PROMPT}\n\nКористувач: ${text}` }]
                }]
            })
        });

        const data = await response.json();
        loader.remove();

        if (data.candidates && data.candidates[0].content.parts[0].text) {
            const aiResponse = data.candidates[0].content.parts[0].text;
            appendMessage('ai', aiResponse);
            saveToHistory(text);
        } else {
            throw new Error('Помилка формату API');
        }
    } catch (error) {
        loader.remove();
        appendMessage('ai', "Вибачте, сталася помилка: " + error.message);
    }
}

function appendMessage(role, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}-message`;
    msgDiv.innerText = text;
    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showLoader() {
    const loaderDiv = document.createElement('div');
    loaderDiv.className = 'message ai-message typing-loader';
    loaderDiv.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
    chatContainer.appendChild(loaderDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return loaderDiv;
}

function saveToHistory(text) {
    if (historyList.querySelector('.empty-state')) {
        historyList.innerHTML = '';
    }
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.innerText = text;
    historyList.prepend(historyItem);
}
