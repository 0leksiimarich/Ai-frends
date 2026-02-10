import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import { firebaseConfig, GEMINI_CONFIG } from './config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// DOM Elements
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const historyList = document.getElementById('history-list');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userProfile = document.getElementById('user-profile');
const userNameText = document.getElementById('user-name');
const userAvatar = document.getElementById('user-avatar');

const SYSTEM_PROMPT = "Ти — український AI Друг. Відповідай виключно українською мовою. Будь корисним, щирим та лаконічним.";

// --- Authentication Logic ---

loginBtn.addEventListener('click', async () => {
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Auth Error:", error);
        alert("Помилка входу. Перевірте консоль.");
    }
});

logoutBtn.addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, (user) => {
    if (user) {
        loginBtn.classList.add('hidden');
        userProfile.classList.remove('hidden');
        userNameText.innerText = user.displayName;
        userAvatar.src = user.photoURL;
        userInput.disabled = false;
        userInput.placeholder = "Напишіть повідомлення...";
    } else {
        loginBtn.classList.remove('hidden');
        userProfile.classList.add('hidden');
        userInput.disabled = true;
        userInput.placeholder = "Будь ласка, увійдіть...";
        chatContainer.innerHTML = `<div class="welcome-screen"><h1>Привіт! Я твій AI Друг.</h1><p>Авторизуйся через Google, щоб почати.</p></div>`;
    }
});

// --- Chat Logic ---

userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = userInput.scrollHeight + 'px';
    sendBtn.disabled = !userInput.value.trim();
});

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !userInput.disabled) {
        e.preventDefault();
        handleSendMessage();
    }
});

sendBtn.addEventListener('click', handleSendMessage);

async function handleSendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Clear welcome screen
    if (document.querySelector('.welcome-screen')) {
        chatContainer.innerHTML = '';
    }

    appendMessage('user', text);
    userInput.value = '';
    userInput.style.height = 'auto';
    sendBtn.disabled = true;

    const loader = showLoader();

    try {
        const response = await fetch(`${GEMINI_CONFIG.API_URL}?key=${GEMINI_CONFIG.API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `${SYSTEM_PROMPT}\nКористувач: ${text}` }]
                }]
            })
        });

        const data = await response.json();
        loader.remove();

        if (data.candidates && data.candidates[0].content.parts[0].text) {
            appendMessage('ai', data.candidates[0].content.parts[0].text);
            saveToHistory(text);
        } else {
            throw new Error("Некоректна відповідь від API");
        }
    } catch (error) {
        loader.remove();
        appendMessage('ai', "Сталася помилка при зверненні до Gemini. Перевір API ключ.");
        console.error(error);
    }
}

function appendMessage(role, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}-message`;
    msgDiv.innerText = text;
    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
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
    if (historyList.querySelector('.empty-state')) historyList.innerHTML = '';
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerText = text;
    historyList.prepend(item);
}
