/**
* AI Chatbot Module
* Handles chat interactions with Gemini API
*/

const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const chatMessages = document.getElementById('chatMessages');
const chatError = document.getElementById('chatError');
const suggestionBtns = document.querySelectorAll('.suggestion-btn');

let isLoading = false;

document.addEventListener('DOMContentLoaded', () => {
    // Event listeners
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !isLoading) {
            sendMessage();
        }
    });

    // Suggestion buttons
    suggestionBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const question = e.target.dataset.question;
            messageInput.value = question;
            messageInput.focus();
        });
    });
});

/**
* Send message to AI
*/
async function sendMessage() {
    const message = messageInput.value.trim();

    // Validation
    if (!message) {
        showError('Please enter a message');
        return;
    }

    if (isLoading) {
        return;
    }

    // Clear error
    hideError();

    // Add user message to chat
    addMessage(message, 'user');

    // Clear input
    messageInput.value = '';

    // Show loading indicator
    isLoading = true;
    sendBtn.disabled = true;
    const loadingId = showLoading();

    try {
        // Send to backend
        const response = await fetch('/chat/api/send-message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message
            })
        });

        const data = await response.json();

        // Remove loading indicator
        removeLoading(loadingId);

        if (data.success) {
            // Add AI response to chat
            addMessage(data.response, 'bot');
        } else {
            showError(data.error || 'Failed to get response');
        }

    } catch (error) {
        console.error('Error sending message:', error);
        removeLoading(loadingId);
        showError('Network error. Please try again.');
    } finally {
        isLoading = false;
        sendBtn.disabled = false;
        messageInput.focus();
    }
}

/**
* Add message to chat display
*/
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message`;

    const time = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });

    // Format message text (handle line breaks and code)
    let formattedText = escapeHtml(text);
    formattedText = formattedText.replace(/\n/g, '<br>');

    messageDiv.innerHTML = `
        <div class="message-content">
            <p>${formattedText}</p>
        </div>
        <span class="message-time">${time}</span>
    `;

    chatMessages.appendChild(messageDiv);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
* Show loading indicator
*/
function showLoading() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'chat-message bot-message loading';
    loadingDiv.id = 'loading-' + Date.now();

    loadingDiv.innerHTML = `
        <div class="message-content">
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;

    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return loadingDiv.id;
}

/**
* Remove loading indicator
*/
function removeLoading(loadingId) {
    const loadingDiv = document.getElementById(loadingId);
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

/**
* Show error message
*/
function showError(errorText) {
    chatError.textContent = errorText;
    chatError.style.display = 'block';
}

/**
* Hide error message
*/
function hideError() {
    chatError.style.display = 'none';
}

/**
* Escape HTML special characters
*/
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}





