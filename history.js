// Chat History Management
class ChatHistoryManager {
    constructor() {
        this.chats = [];
        this.filteredChats = [];
        this.currentFilter = 'all';
        this.selectedChat = null;
        this.searchQuery = '';
        
        this.init();
    }

    init() {
        this.checkAuth();
        this.loadUserInfo();
        this.loadChatHistory();
        this.setupEventListeners();
        this.updateStats();
    }

    checkAuth() {
        if (!AuthManager.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }
    }

    loadUserInfo() {
        const user = AuthManager.getCurrentUser();
        if (user) {
            document.getElementById('userInfo').innerHTML = `
                <div class="user-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="user-details">
                    <span class="user-name">${user.name || 'User'}</span>
                    <span class="user-email">${user.email || 'user@example.com'}</span>
                </div>
            `;
        }
    }

    loadChatHistory() {
        // Load from localStorage and generate sample data if empty
        const savedChats = localStorage.getItem('allChatHistory');
        
        if (savedChats) {
            this.chats = JSON.parse(savedChats);
        } else {
            this.generateSampleChats();
        }
        
        this.filterChats();
        this.renderChatList();
        this.updateStats();
    }

    generateSampleChats() {
        const sampleChats = [
            {
                id: 'chat-1',
                title: 'Security Vulnerability Assessment',
                messages: [
                    { text: 'Can you help me assess security vulnerabilities in my web application?', sender: 'user', timestamp: new Date(Date.now() - 86400000).toISOString() },
                    { text: 'I\'d be happy to help you assess security vulnerabilities in your web application. Let\'s start with some key areas to examine...', sender: 'bot', timestamp: new Date(Date.now() - 86400000 + 30000).toISOString() }
                ],
                timestamp: new Date(Date.now() - 86400000).toISOString(),
                starred: true,
                messageCount: 12
            },
            {
                id: 'chat-2',
                title: 'SQL Injection Prevention',
                messages: [
                    { text: 'What are the best practices for preventing SQL injection attacks?', sender: 'user', timestamp: new Date(Date.now() - 172800000).toISOString() },
                    { text: 'SQL injection prevention involves several key strategies. Here are the most effective approaches...', sender: 'bot', timestamp: new Date(Date.now() - 172800000 + 45000).toISOString() }
                ],
                timestamp: new Date(Date.now() - 172800000).toISOString(),
                starred: false,
                messageCount: 8
            },
            {
                id: 'chat-3',
                title: 'Network Security Analysis',
                messages: [
                    { text: 'I need help analyzing network traffic for potential threats', sender: 'user', timestamp: new Date(Date.now() - 259200000).toISOString() },
                    { text: 'Network traffic analysis is crucial for threat detection. Let me guide you through the process...', sender: 'bot', timestamp: new Date(Date.now() - 259200000 + 60000).toISOString() }
                ],
                timestamp: new Date(Date.now() - 259200000).toISOString(),
                starred: false,
                messageCount: 15
            },
            {
                id: 'chat-4',
                title: 'Cryptography Best Practices',
                messages: [
                    { text: 'What encryption methods should I use for sensitive data?', sender: 'user', timestamp: new Date(Date.now() - 345600000).toISOString() },
                    { text: 'For sensitive data encryption, I recommend using industry-standard algorithms. Here\'s what you should consider...', sender: 'bot', timestamp: new Date(Date.now() - 345600000 + 40000).toISOString() }
                ],
                timestamp: new Date(Date.now() - 345600000).toISOString(),
                starred: true,
                messageCount: 10
            },
            {
                id: 'chat-5',
                title: 'Penetration Testing Guide',
                messages: [
                    { text: 'Can you walk me through a basic penetration testing methodology?', sender: 'user', timestamp: new Date(Date.now() - 432000000).toISOString() },
                    { text: 'Penetration testing follows a structured methodology. Let me outline the key phases...', sender: 'bot', timestamp: new Date(Date.now() - 432000000 + 50000).toISOString() }
                ],
                timestamp: new Date(Date.now() - 432000000).toISOString(),
                starred: false,
                messageCount: 20
            }
        ];
        
        this.chats = sampleChats;
        localStorage.setItem('allChatHistory', JSON.stringify(this.chats));
    }

    setupEventListeners() {
        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.filterChats();
            this.renderChatList();
        });

        // Filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.filterChats();
                this.renderChatList();
            });
        });

        // Navigation buttons
        document.getElementById('newChatBtn').addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        document.getElementById('backToChatBtn').addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            AuthManager.logout();
        });

        // Export/Import
        document.getElementById('exportAllBtn').addEventListener('click', () => {
            this.exportAllChats();
        });

        document.getElementById('importBtn').addEventListener('click', () => {
            this.openImportModal();
        });

        // Modal controls
        document.getElementById('closeChatModal').addEventListener('click', () => {
            this.closeChatModal();
        });

        document.getElementById('closeImportModal').addEventListener('click', () => {
            this.closeImportModal();
        });

        document.getElementById('startImportBtn').addEventListener('click', () => {
            this.importChats();
        });

        // Close modals on outside click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });
    }

    filterChats() {
        let filtered = [...this.chats];

        // Apply search filter
        if (this.searchQuery) {
            filtered = filtered.filter(chat => 
                chat.title.toLowerCase().includes(this.searchQuery) ||
                chat.messages.some(msg => msg.text.toLowerCase().includes(this.searchQuery))
            );
        }

        // Apply time filter
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        switch (this.currentFilter) {
            case 'today':
                filtered = filtered.filter(chat => new Date(chat.timestamp) >= today);
                break;
            case 'week':
                filtered = filtered.filter(chat => new Date(chat.timestamp) >= weekAgo);
                break;
            case 'starred':
                filtered = filtered.filter(chat => chat.starred);
                break;
        }

        // Sort by timestamp (newest first)
        filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        this.filteredChats = filtered;
    }

    renderChatList() {
        const chatList = document.getElementById('chatList');
        
        if (this.filteredChats.length === 0) {
            chatList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <p>No conversations found</p>
                    <small>Try adjusting your search or filter</small>
                </div>
            `;
            return;
        }

        chatList.innerHTML = this.filteredChats.map(chat => `
            <div class="chat-item" data-chat-id="${chat.id}" onclick="historyManager.selectChat('${chat.id}')">
                <div class="chat-item-header">
                    <div class="chat-title">${chat.title}</div>
                    <div class="chat-time">${this.formatTime(chat.timestamp)}</div>
                </div>
                <div class="chat-preview-text">${this.getPreviewText(chat)}</div>
                <div class="chat-meta">
                    <span class="chat-message-count">${chat.messageCount} messages</span>
                    ${chat.starred ? '<i class="fas fa-star chat-starred"></i>' : ''}
                </div>
            </div>
        `).join('');
    }

    selectChat(chatId) {
        // Remove active class from all items
        document.querySelectorAll('.chat-item').forEach(item => {
            item.classList.remove('active');
        });

        // Add active class to selected item
        const selectedItem = document.querySelector(`[data-chat-id="${chatId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('active');
        }

        this.selectedChat = this.chats.find(chat => chat.id === chatId);
        this.showChatPreview();
    }

    showChatPreview() {
        if (!this.selectedChat) return;

        const preview = document.getElementById('chatPreview');
        preview.innerHTML = `
            <div class="chat-preview-header">
                <h3>${this.selectedChat.title}</h3>
                <div class="preview-actions">
                    <button class="action-btn" onclick="historyManager.toggleStar('${this.selectedChat.id}')" title="${this.selectedChat.starred ? 'Unstar' : 'Star'} Chat">
                        <i class="fas fa-star ${this.selectedChat.starred ? 'starred' : ''}"></i>
                    </button>
                    <button class="action-btn" onclick="historyManager.exportChat('${this.selectedChat.id}')" title="Export Chat">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="action-btn" onclick="historyManager.openChatModal('${this.selectedChat.id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn danger" onclick="historyManager.deleteChat('${this.selectedChat.id}')" title="Delete Chat">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="chat-preview-messages">
                ${this.selectedChat.messages.slice(0, 5).map(msg => `
                    <div class="preview-message ${msg.sender}">
                        <div class="preview-message-avatar">
                            <i class="fas ${msg.sender === 'user' ? 'fa-user' : 'fa-robot'}"></i>
                        </div>
                        <div class="preview-message-content">
                            ${msg.text}
                            <div class="preview-message-time">${this.formatTime(msg.timestamp)}</div>
                        </div>
                    </div>
                `).join('')}
                ${this.selectedChat.messages.length > 5 ? `
                    <div class="preview-more">
                        <button class="btn secondary" onclick="historyManager.openChatModal('${this.selectedChat.id}')">
                            View all ${this.selectedChat.messages.length} messages
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    openChatModal(chatId) {
        const chat = this.chats.find(c => c.id === chatId);
        if (!chat) return;

        document.getElementById('modalChatTitle').textContent = chat.title;
        
        const messagesPreview = document.getElementById('chatMessagesPreview');
        messagesPreview.innerHTML = chat.messages.map(msg => `
            <div class="preview-message ${msg.sender}">
                <div class="preview-message-avatar">
                    <i class="fas ${msg.sender === 'user' ? 'fa-user' : 'fa-robot'}"></i>
                </div>
                <div class="preview-message-content">
                    ${msg.text}
                    <div class="preview-message-time">${this.formatTime(msg.timestamp)}</div>
                </div>
            </div>
        `).join('');

        document.getElementById('chatDetailModal').classList.add('show');
    }

    closeChatModal() {
        document.getElementById('chatDetailModal').classList.remove('show');
    }

    openImportModal() {
        document.getElementById('importModal').classList.add('show');
    }

    closeImportModal() {
        document.getElementById('importModal').classList.remove('show');
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
        });
    }

    toggleStar(chatId) {
        const chat = this.chats.find(c => c.id === chatId);
        if (chat) {
            chat.starred = !chat.starred;
            this.saveChats();
            this.filterChats();
            this.renderChatList();
            this.updateStats();
            
            if (this.selectedChat && this.selectedChat.id === chatId) {
                this.selectedChat = chat;
                this.showChatPreview();
            }
        }
    }

    deleteChat(chatId) {
        if (confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
            this.chats = this.chats.filter(c => c.id !== chatId);
            this.saveChats();
            this.filterChats();
            this.renderChatList();
            this.updateStats();
            
            // Clear preview if deleted chat was selected
            if (this.selectedChat && this.selectedChat.id === chatId) {
                this.selectedChat = null;
                document.getElementById('chatPreview').innerHTML = `
                    <div class="preview-placeholder">
                        <i class="fas fa-comments"></i>
                        <h3>Select a conversation</h3>
                        <p>Choose a chat from the sidebar to view its details and messages</p>
                    </div>
                `;
            }
        }
    }

    exportChat(chatId) {
        const chat = this.chats.find(c => c.id === chatId);
        if (!chat) return;

        const exportData = {
            title: chat.title,
            timestamp: chat.timestamp,
            messages: chat.messages,
            starred: chat.starred,
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-${chat.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    exportAllChats() {
        const exportData = {
            chats: this.chats,
            exportedAt: new Date().toISOString(),
            totalChats: this.chats.length,
            totalMessages: this.chats.reduce((sum, chat) => sum + chat.messageCount, 0)
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kaliai-history-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async importChats() {
        const fileInput = document.getElementById('importFileInput');
        const files = fileInput.files;
        
        if (files.length === 0) {
            alert('Please select files to import');
            return;
        }

        const progressBar = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        const importProgress = document.getElementById('importProgress');
        
        importProgress.style.display = 'block';
        
        let importedCount = 0;
        const totalFiles = files.length;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            try {
                const content = await this.readFile(file);
                const data = JSON.parse(content);
                
                if (data.chats && Array.isArray(data.chats)) {
                    // Import multiple chats
                    data.chats.forEach(chat => this.addImportedChat(chat));
                } else if (data.messages && Array.isArray(data.messages)) {
                    // Import single chat
                    this.addImportedChat(data);
                }
                
                importedCount++;
                
            } catch (error) {
                console.error('Failed to import file:', file.name, error);
            }
            
            // Update progress
            const progress = ((i + 1) / totalFiles) * 100;
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `Importing... ${i + 1}/${totalFiles} files`;
        }

        // Complete import
        setTimeout(() => {
            this.saveChats();
            this.loadChatHistory();
            this.closeImportModal();
            alert(`Successfully imported ${importedCount} chat files!`);
        }, 500);
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    addImportedChat(chatData) {
        const newChat = {
            id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: chatData.title || 'Imported Chat',
            messages: chatData.messages || [],
            timestamp: chatData.timestamp || new Date().toISOString(),
            starred: chatData.starred || false,
            messageCount: chatData.messages ? chatData.messages.length : 0
        };

        this.chats.push(newChat);
    }

    saveChats() {
        localStorage.setItem('allChatHistory', JSON.stringify(this.chats));
    }

    updateStats() {
        const totalChats = this.chats.length;
        const totalMessages = this.chats.reduce((sum, chat) => sum + chat.messageCount, 0);
        const starredChats = this.chats.filter(chat => chat.starred).length;
        const avgResponseTime = Math.floor(Math.random() * 500) + 200; // Simulated

        document.getElementById('totalChats').textContent = totalChats;
        document.getElementById('totalMessages').textContent = totalMessages;
        document.getElementById('starredChats').textContent = starredChats;
        document.getElementById('avgResponseTime').textContent = `${avgResponseTime}ms`;
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    getPreviewText(chat) {
        if (chat.messages.length === 0) return 'No messages';
        const lastMessage = chat.messages[chat.messages.length - 1];
        return lastMessage.text.length > 100 
            ? lastMessage.text.substring(0, 100) + '...'
            : lastMessage.text;
    }
}

// Initialize history manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.historyManager = new ChatHistoryManager();
});

// Add additional CSS for empty state and other elements
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    .empty-state {
        text-align: center;
        padding: var(--spacing-xl);
        color: var(--text-secondary);
    }

    .empty-state i {
        font-size: 2rem;
        margin-bottom: var(--spacing-md);
        opacity: 0.5;
    }

    .empty-state p {
        font-weight: 500;
        margin-bottom: var(--spacing-xs);
    }

    .empty-state small {
        font-size: var(--font-size-xs);
    }

    .chat-preview-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-lg);
        border-bottom: 1px solid var(--border);
    }

    .chat-preview-header h3 {
        font-size: var(--font-size-lg);
        font-weight: 600;
        color: var(--text-primary);
    }

    .preview-actions {
        display: flex;
        gap: var(--spacing-sm);
    }

    .chat-preview-messages {
        padding: var(--spacing-lg);
        max-height: 400px;
        overflow-y: auto;
    }

    .preview-more {
        text-align: center;
        padding: var(--spacing-lg) 0;
        border-top: 1px solid var(--border);
        margin-top: var(--spacing-lg);
    }

    .starred {
        color: var(--warning) !important;
    }
`;
document.head.appendChild(additionalStyles);
