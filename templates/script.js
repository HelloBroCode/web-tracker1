// Dark Mode Toggle
const darkModeToggle = document.getElementById('darkModeToggle');
const body = document.body;
const chatContainer = document.querySelector('.chat-container');
const chatBox = document.getElementById('chatBox');

// Function to toggle Dark Mode
darkModeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    chatContainer.classList.toggle('dark-mode');
    chatBox.classList.toggle('dark-mode');
});

// Function to simulate sending a message (for testing)
const sendMessage = (message, sender) => {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add(sender === 'user' ? 'user-msg' : 'finmate-msg');
    messageDiv.innerText = message;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
};

// Simulate FinMate's reply after a user sends a message
document.getElementById('sendBtn').addEventListener('click', () => {
    const userInput = document.getElementById('userInput').value.trim();
    if (userInput) {
        sendMessage(userInput, 'user');
        document.getElementById('userInput').value = '';
        
        // Simulating a response from FinMate
        setTimeout(() => {
            sendMessage('I have received your message. How can I assist you further?', 'finmate');
        }, 1000);
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const chatBox = document.getElementById('chatBox');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    // Add welcome message
    addBotMessage("Hi! I'm FinMate, your finance assistant. How can I help with your expenses today?");
    
    // Dark mode toggle
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-mode');
        });
    }
    
    // Send message function
    function sendMessage() {
        const message = userInput.value.trim();
        if (message.length === 0) return;
        
        // Add user message to chat
        addUserMessage(message);
        
        // Clear input
        userInput.value = '';
        
        // Show typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message bot-message typing';
        typingIndicator.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
        chatBox.appendChild(typingIndicator);
        chatBox.scrollTop = chatBox.scrollHeight;
        
        // Send message to server
        fetch('/finmate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ input: message }),
        })
        .then(response => response.json())
        .then(data => {
            // Remove typing indicator
            chatBox.removeChild(typingIndicator);
            
            // Add bot response
            addBotMessage(data.response);
        })
        .catch((error) => {
            // Remove typing indicator
            chatBox.removeChild(typingIndicator);
            
            // Show error
            addBotMessage("Sorry, I'm having trouble connecting. Please try again later.");
            console.error('Error:', error);
        });
    }
    
    // Add user message to chat
    function addUserMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message user-message';
        messageElement.textContent = message;
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
    
    // Add bot message to chat
    function addBotMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message bot-message';
        messageElement.textContent = message;
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
    
    // Event listeners
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
});
