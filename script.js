import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import { firebaseConfig, GEMINI_CONFIG } from './config.js';

// Ініціалізація Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userProfile = document.getElementById('user-profile');

// --- ЛОГІКА АВТОРИЗАЦІЇ ---
loginBtn.onclick = async () => {
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Auth Error", error);
        alert("Помилка авторизації");
    }
};

logoutBtn.onclick = () => signOut(auth);

onAuthStateChanged(auth, (user) => {
    if (user) {
        loginBtn.classList.add('hidden');
        userProfile.classList.remove('hidden');
        document.getElementById('user-name').innerText = user.displayName;
        document.getElementById('user-avatar').src = user.photoURL;
        userInput.disabled = false;
        userInput.placeholder = "Запитай у AI...";
    } else {
        loginBtn.classList.remove('hidden');
        userProfile.classList.add('hidden');
        userInput.disabled = true;
        userInput.placeholder = "Авторизуйся для чату";
    }
});

// --- ЛОГІКА ЧАТУ ---
function appendMessage(role, text) {
    const msg = document.createElement('div');
    msg.className = `message ${role}-message`;
    msg.innerText = text;
    chatContainer.appendChild(msg);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function handleSendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    if (document.querySelector('.welcome-screen')) chatContainer.innerHTML = '';

    appendMessage('user', text);
    userInput.value = '';
    sendBtn.disabled = true;

    // Створення лоадера
    const loader = document.createElement('div');
    loader.className = 'message ai-message';
    loader.innerText = 'AI Друг думає...';
    chatContainer.appendChild(loader);

    try {
        const response = await fetch(`${GEMINI_CONFIG.API_URL}?key=${GEMINI_CONFIG.API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Відповідай українською: ${text}` }] }]
            })
        });

        const data = await response.json();
        loader.remove();

        if (data.candidates && data.candidates[0].content.parts[0].text) {
            appendMessage('ai', data.candidates[0].content.parts[0].text);
        } else {
            throw new Error();
        }
    } catch (e) {
        loader.innerText = "Помилка API. Перевір свій ключ.";
    }
}

// Події кнопок
sendBtn.onclick = handleSendMessage;
userInput.oninput = () => { sendBtn.disabled = !userInput.value.trim(); };
userInput.onkeydown = (e) => { 
    if (e.key === 'Enter' && !e.shiftKey && !userInput.disabled) { 
        e.preventDefault(); 
        handleSendMessage(); 
    } 
};
