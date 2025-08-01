// Chatbot Application Class
class ChatbotApp {
    constructor() {
        this.messages = [];
        this.settings = {
            apiUrl: 'http://127.0.0.1:8000/api/query',
            theme: 'light',
            messageHistory: 50,
            streaming: false  // Temporarily disable streaming to test
        };
        this.isTyping = false;
        this.selectedFiles = [];
        this.currentUser = null;
        
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.loadUserInfo();
        this.loadSettings();
        this.setupEventListeners();
        this.applyTheme();
        this.autoResizeTextarea();
    }

    // Check if user is authenticated
    checkAuthentication() {
        // For demo purposes, we'll check if user data exists
        const userData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
        
        if (!userData) {
            // Redirect to login page if not authenticated
            window.location.href = 'login.html';
            return;
        }
        
        this.currentUser = JSON.parse(userData);
    }

    // Load user information into header
    loadUserInfo() {
        if (this.currentUser) {
            document.getElementById('headerUserName').textContent = this.currentUser.name || 'User';
            document.getElementById('headerUserEmail').textContent = this.currentUser.email || 'user@example.com';
        }
    }

    // Load settings from localStorage
    loadSettings() {
        const savedSettings = localStorage.getItem('chatbotSettings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        }
        
        // Update UI with loaded settings
        document.getElementById('apiUrl').value = this.settings.apiUrl;
        document.getElementById('themeSelect').value = this.settings.theme;
        document.getElementById('messageHistory').value = this.settings.messageHistory;
        document.getElementById('streamingToggle').value = this.settings.streaming.toString();
    }

    // Save settings to localStorage
    saveSettings() {
        localStorage.setItem('chatbotSettings', JSON.stringify(this.settings));
    }

    // Setup all event listeners
    setupEventListeners() {
        // Send message events
        const sendBtn = document.getElementById('sendBtn');
        const messageInput = document.getElementById('messageInput');
        
        sendBtn.addEventListener('click', () => this.sendMessage());
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize textarea
        messageInput.addEventListener('input', () => this.autoResizeTextarea());

        // Clear chat
        document.getElementById('clearChat').addEventListener('click', () => this.clearChat());

        // Settings modal
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
        document.getElementById('closeSettings').addEventListener('click', () => this.closeSettings());
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettingsFromModal());

        // File upload
        document.getElementById('attachBtn').addEventListener('click', () => this.openFileModal());
        document.getElementById('closeFileModal').addEventListener('click', () => this.closeFileModal());
        document.getElementById('attachFilesBtn').addEventListener('click', () => this.attachFiles());
        document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileSelect(e));

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });

        // Theme change
        document.getElementById('themeSelect').addEventListener('change', (e) => {
            this.settings.theme = e.target.value;
            this.applyTheme();
        });

        // User menu toggle
        document.getElementById('userAvatarBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleUserMenu();
        });

        // Navigation buttons
        document.getElementById('historyBtn').addEventListener('click', () => {
            window.location.href = 'history.html';
        });

        document.getElementById('historyDropdownBtn').addEventListener('click', () => {
            window.location.href = 'history.html';
        });

        document.getElementById('settingsDropdownBtn').addEventListener('click', () => {
            this.openSettings();
            this.toggleUserMenu();
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Close user menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-menu')) {
                this.closeUserMenu();
            }
        });
    }

    // Auto-resize textarea
    autoResizeTextarea() {
        const textarea = document.getElementById('messageInput');
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    // Send message
    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();
        
        if (!message) return;

        // Add user message to chat
        this.addMessage(message, 'user');
        messageInput.value = '';
        this.autoResizeTextarea();

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Prepare request data for Security AI backend
            const requestData = {
                question: message,
                session_id: this.sessionId || this.generateSessionId(),
                stream: this.settings.streaming
            };

            console.log('Sending request:', requestData);

            // Send to Security AI backend
            const response = await fetch(this.settings.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
            }

            // Handle streaming response
            if (this.settings.streaming) {
                await this.handleStreamingResponse(response);
            } else {
                const data = await response.json();
                console.log('Received data:', data);
                this.hideTypingIndicator();
                this.addMessage(data.answer || data.response || 'Sorry, I couldn\'t process your request.', 'bot');
            }

            // Clear selected files after sending
            this.selectedFiles = [];

        } catch (error) {
            console.error('Error sending message:', error);
            this.hideTypingIndicator();
            this.addMessage(`Error: ${error.message}`, 'bot');
        }
    }

    // Handle streaming response from Security AI
    async handleStreamingResponse(response) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let currentMessage = '';
        let messageElement = null;
        let hasStarted = false;

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n\n');

                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const data = JSON.parse(line);
                            console.log('Received streaming data:', data); // Debug log
                            
                            if (data.type === 'answer') {
                                if (!hasStarted) {
                                    this.hideTypingIndicator();
                                    messageElement = this.addMessage('', 'bot', true);
                                    hasStarted = true;
                                }
                                currentMessage += data.content;
                                this.updateMessageContent(messageElement, currentMessage);
                            } else if (data.type === 'code_header') {
                                if (!hasStarted) {
                                    this.hideTypingIndicator();
                                    messageElement = this.addMessage('', 'bot', true);
                                    hasStarted = true;
                                }
                                currentMessage += data.content;
                                this.updateMessageContent(messageElement, currentMessage);
                            } else if (data.type === 'code') {
                                if (!hasStarted) {
                                    this.hideTypingIndicator();
                                    messageElement = this.addMessage('', 'bot', true);
                                    hasStarted = true;
                                }
                                currentMessage += data.content;
                                this.updateMessageContent(messageElement, currentMessage, 'code');
                            } else if (data.type === 'complete') {
                                // Add sources if available
                                if (data.sources && data.sources.length > 0) {
                                    currentMessage += '\n\n**Sources:**\n';
                                    data.sources.forEach(source => {
                                        currentMessage += `• ${source}\n`;
                                    });
                                    this.updateMessageContent(messageElement, currentMessage);
                                }
                                this.finalizeMessage(messageElement);
                                return; // Exit after completion
                            }
                        } catch (e) {
                            console.error('Error parsing streaming data:', e, 'Raw line:', line);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error reading stream:', error);
            if (messageElement) {
                this.finalizeMessage(messageElement);
            }
        }
    }

    // Generate session ID
    generateSessionId() {
        this.sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        return this.sessionId;
    }

    // Add message and return the element for streaming updates
    addMessage(text, sender, streaming = false) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;

        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                ${sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>'}
            </div>
            <div class="message-content">
                <div class="message-text">${this.formatMessage(text)}</div>
                <div class="message-time">${timestamp}</div>
            </div>
        `;

        // Remove welcome message if it exists
        const welcomeMessage = chatMessages.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Add to messages array
        this.messages.push({ text, sender, timestamp });
        
        // Limit message history
        if (this.settings.messageHistory !== 'unlimited' && this.messages.length > this.settings.messageHistory) {
            this.messages = this.messages.slice(-this.settings.messageHistory);
        }

        return streaming ? messageDiv : null;
    }

    // Update message content for streaming
    updateMessageContent(messageElement, content, type = 'text') {
        if (!messageElement) return;
        
        const messageText = messageElement.querySelector('.message-text');
        if (type === 'code') {
            messageText.innerHTML = this.formatMessage(content, true);
        } else {
            messageText.innerHTML = this.formatMessage(content);
        }
        
        // Scroll to bottom
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Finalize streaming message
    finalizeMessage(messageElement) {
        if (!messageElement) return;
        
        // Update the last message in the array
        const messageText = messageElement.querySelector('.message-text');
        const lastMessage = this.messages[this.messages.length - 1];
        if (lastMessage && lastMessage.sender === 'bot') {
            lastMessage.text = messageText.textContent;
        }
    }

    // Add message to chat
    addMessage(text, sender) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;

        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                ${sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>'}
            </div>
            <div class="message-content">
                <div class="message-text">${this.formatMessage(text)}</div>
                <div class="message-time">${timestamp}</div>
            </div>
        `;

        // Remove welcome message if it exists
        const welcomeMessage = chatMessages.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Add to messages array
        this.messages.push({ text, sender, timestamp });
        
        // Limit message history
        if (this.settings.messageHistory !== 'unlimited' && this.messages.length > this.settings.messageHistory) {
            this.messages = this.messages.slice(-this.settings.messageHistory);
        }
    }

    // Format message text (handle markdown, links, etc.)
    formatMessage(text, isCode = false) {
        if (isCode) {
            // For code blocks, preserve formatting
            text = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return `<pre><code>${text}</code></pre>`;
        }
        
        // Convert URLs to clickable links
        text = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
        
        // Convert line breaks to <br>
        text = text.replace(/\n/g, '<br>');
        
        // Basic markdown support
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        text = text.replace(/`(.*?)`/g, '<code>$1</code>');
        
        return text;
    }

    // Show typing indicator
    showTypingIndicator() {
        this.isTyping = true;
        document.getElementById('typingIndicator').style.display = 'flex';
        document.getElementById('sendBtn').disabled = true;
    }

    // Hide typing indicator
    hideTypingIndicator() {
        this.isTyping = false;
        document.getElementById('typingIndicator').style.display = 'none';
        document.getElementById('sendBtn').disabled = false;
    }

    // Clear chat
    clearChat() {
        if (confirm('Are you sure you want to clear the chat history?')) {
            const chatMessages = document.getElementById('chatMessages');
            chatMessages.innerHTML = `
                <div class="welcome-message">
                    <div class="welcome-content">
                        <i class="fas fa-comments"></i>
                        <h2>Welcome to AI Chatbot!</h2>
                        <p>I'm here to help you with any questions or tasks. How can I assist you today?</p>
                    </div>
                </div>
            `;
            this.messages = [];
        }
    }

    // Open settings modal
    openSettings() {
        document.getElementById('settingsModal').classList.add('show');
    }

    // Close settings modal
    closeSettings() {
        document.getElementById('settingsModal').classList.remove('show');
    }

    // Save settings from modal
    saveSettingsFromModal() {
        this.settings.apiUrl = document.getElementById('apiUrl').value;
        this.settings.theme = document.getElementById('themeSelect').value;
        this.settings.messageHistory = document.getElementById('messageHistory').value;
        this.settings.streaming = document.getElementById('streamingToggle').value === 'true';
        
        this.saveSettings();
        this.applyTheme();
        this.closeSettings();
        
        // Show success message
        this.showNotification('Settings saved successfully!', 'success');
    }

    // Apply theme
    applyTheme() {
        const body = document.body;
        
        if (this.settings.theme === 'auto') {
            // Auto theme based on system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            body.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
            body.setAttribute('data-theme', this.settings.theme);
        }
    }

    // Open file modal
    openFileModal() {
        document.getElementById('fileModal').classList.add('show');
    }

    // Close file modal
    closeFileModal() {
        document.getElementById('fileModal').classList.remove('show');
    }

    // Close all modals
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
        });
    }

    // Handle file selection
    handleFileSelect(event) {
        const files = Array.from(event.target.files);
        this.selectedFiles = files;
        this.updateSelectedFilesDisplay();
    }

    // Update selected files display
    updateSelectedFilesDisplay() {
        const selectedFilesContainer = document.getElementById('selectedFiles');
        selectedFilesContainer.innerHTML = '';

        this.selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            const fileIcon = this.getFileIcon(file.type);
            const fileSize = this.formatFileSize(file.size);
            
            fileItem.innerHTML = `
                <div class="file-info">
                    <i class="file-icon ${fileIcon}"></i>
                    <div>
                        <div class="file-name">${file.name}</div>
                        <div class="file-size">${fileSize}</div>
                    </div>
                </div>
                <button class="remove-file" onclick="chatbot.removeFile(${index})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            selectedFilesContainer.appendChild(fileItem);
        });
    }

    // Remove file from selection
    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.updateSelectedFilesDisplay();
    }

    // Get file icon based on type
    getFileIcon(type) {
        if (type.startsWith('image/')) return 'fas fa-image';
        if (type.includes('pdf')) return 'fas fa-file-pdf';
        if (type.includes('word') || type.includes('document')) return 'fas fa-file-word';
        if (type.includes('text')) return 'fas fa-file-alt';
        return 'fas fa-file';
    }

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Attach files to message
    attachFiles() {
        if (this.selectedFiles.length === 0) {
            this.showNotification('Please select files to attach', 'warning');
            return;
        }

        // Add files info to message input
        const messageInput = document.getElementById('messageInput');
        const fileNames = this.selectedFiles.map(file => file.name).join(', ');
        const currentMessage = messageInput.value;
        
        if (currentMessage) {
            messageInput.value = currentMessage + '\n\nAttached files: ' + fileNames;
        } else {
            messageInput.value = 'Attached files: ' + fileNames;
        }
        
        this.autoResizeTextarea();
        this.closeFileModal();
        this.showNotification(`${this.selectedFiles.length} file(s) attached`, 'success');
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            padding: var(--spacing-md) var(--spacing-lg);
            box-shadow: 0 4px 6px var(--shadow);
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Get notification icon
    getNotificationIcon(type) {
        switch (type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-circle';
            case 'warning': return 'exclamation-triangle';
            default: return 'info-circle';
        }
    }

    // Export chat history
    exportChat() {
        const chatData = {
            messages: this.messages,
            exportDate: new Date().toISOString(),
            settings: this.settings
        };

        const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Import chat history
    importChat(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const chatData = JSON.parse(e.target.result);
                if (chatData.messages && Array.isArray(chatData.messages)) {
                    this.messages = chatData.messages;
                    this.renderImportedChat();
                    this.showNotification('Chat history imported successfully!', 'success');
                } else {
                    throw new Error('Invalid chat data format');
                }
            } catch (error) {
                this.showNotification('Failed to import chat history', 'error');
            }
        };
        reader.readAsText(file);
    }

    // Render imported chat
    renderImportedChat() {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';

        this.messages.forEach(msg => {
            this.addMessage(msg.text, msg.sender);
        });
    }

    // Toggle user menu
    toggleUserMenu() {
        const userMenu = document.getElementById('userMenu');
        userMenu.classList.toggle('active');
    }

    // Close user menu
    closeUserMenu() {
        const userMenu = document.getElementById('userMenu');
        userMenu.classList.remove('active');
    }

    // Logout functionality
    logout() {
        if (confirm('Are you sure you want to logout?')) {
            // Clear user data
            localStorage.removeItem('userData');
            sessionStorage.removeItem('userData');
            
            // Save current chat to history before logout
            if (this.messages.length > 0) {
                this.saveChatToHistory();
            }
            
            // Redirect to login page
            window.location.href = 'login.html';
        }
    }

    // Save current chat to history
    saveChatToHistory() {
        if (this.messages.length === 0) return;
        
        const chatHistory = JSON.parse(localStorage.getItem('allChatHistory') || '[]');
        const chatTitle = this.generateChatTitle();
        
        const newChat = {
            id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: chatTitle,
            messages: this.messages.map(msg => ({
                text: msg.text,
                sender: msg.sender,
                timestamp: msg.timestamp || new Date().toISOString()
            })),
            timestamp: new Date().toISOString(),
            starred: false,
            messageCount: this.messages.length
        };
        
        chatHistory.unshift(newChat);
        localStorage.setItem('allChatHistory', JSON.stringify(chatHistory));
    }

    // Generate chat title from first user message
    generateChatTitle() {
        const firstUserMessage = this.messages.find(msg => msg.sender === 'user');
        if (firstUserMessage) {
            const title = firstUserMessage.text.substring(0, 50);
            return title.length < firstUserMessage.text.length ? title + '...' : title;
        }
        return 'New Conversation';
    }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chatbot = new ChatbotApp();
});

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    .notification-content {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
    }

    .notification-success {
        border-left: 4px solid var(--success);
    }

    .notification-error {
        border-left: 4px solid var(--error);
    }

    .notification-warning {
        border-left: 4px solid var(--warning);
    }

    .notification-info {
        border-left: 4px solid var(--primary-color);
    }
`;
document.head.appendChild(style);

// Handle system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (window.chatbot && window.chatbot.settings.theme === 'auto') {
        window.chatbot.applyTheme();
    }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, update status
        document.getElementById('status').textContent = 'Away';
        document.getElementById('status').style.color = 'var(--warning)';
    } else {
        // Page is visible, update status
        document.getElementById('status').textContent = 'Online';
        document.getElementById('status').style.color = 'var(--success)';
    }
});

// Handle beforeunload event
window.addEventListener('beforeunload', () => {
    if (window.chatbot && window.chatbot.messages.length > 0) {
        // Save chat history before leaving
        localStorage.setItem('chatHistory', JSON.stringify(window.chatbot.messages));
    }
});

// Load chat history on page load
window.addEventListener('load', () => {
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory && window.chatbot) {
        try {
            const messages = JSON.parse(savedHistory);
            if (Array.isArray(messages) && messages.length > 0) {
                window.chatbot.messages = messages;
                window.chatbot.renderImportedChat();
            }
        } catch (error) {
            console.error('Failed to load chat history:', error);
        }
    }
}); 