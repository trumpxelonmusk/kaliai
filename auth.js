// Authentication JavaScript
class AuthManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthState();
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Signup form
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleSignup(e));
            this.setupPasswordValidation();
        }

        // Password toggle
        const togglePassword = document.getElementById('togglePassword');
        if (togglePassword) {
            togglePassword.addEventListener('click', () => this.togglePasswordVisibility());
        }

        // Social login buttons
        document.querySelectorAll('.social-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleSocialLogin(e));
        });
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const email = formData.get('email');
        const password = formData.get('password');
        const rememberMe = formData.get('rememberMe') === 'on';

        // Show loading state
        this.setButtonLoading(form.querySelector('.auth-btn'), true);

        try {
            // Simulate API call
            await this.simulateLogin(email, password);
            
            // Store user session
            const userData = {
                email: email,
                name: email.split('@')[0],
                loginTime: new Date().toISOString(),
                rememberMe: rememberMe
            };

            if (rememberMe) {
                localStorage.setItem('userData', JSON.stringify(userData));
            } else {
                sessionStorage.setItem('userData', JSON.stringify(userData));
            }

            // Show success message
            this.showMessage('Login successful! Redirecting...', 'success');
            
            // Redirect to main app
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);

        } catch (error) {
            this.showMessage(error.message, 'error');
        } finally {
            this.setButtonLoading(form.querySelector('.auth-btn'), false);
        }
    }

    async handleSignup(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const firstName = formData.get('firstName');
        const lastName = formData.get('lastName');
        const email = formData.get('email');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        const agreeTerms = formData.get('agreeTerms') === 'on';
        const newsletter = formData.get('newsletter') === 'on';

        // Validate passwords match
        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match', 'error');
            return;
        }

        if (!agreeTerms) {
            this.showMessage('Please agree to the terms and conditions', 'error');
            return;
        }

        // Show loading state
        this.setButtonLoading(form.querySelector('.auth-btn'), true);

        try {
            // Simulate API call
            await this.simulateSignup(email, password, firstName, lastName);
            
            // Store user session
            const userData = {
                email: email,
                name: `${firstName} ${lastName}`,
                firstName: firstName,
                lastName: lastName,
                signupTime: new Date().toISOString(),
                newsletter: newsletter
            };

            sessionStorage.setItem('userData', JSON.stringify(userData));

            // Show success message
            this.showMessage('Account created successfully! Redirecting...', 'success');
            
            // Redirect to main app
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);

        } catch (error) {
            this.showMessage(error.message, 'error');
        } finally {
            this.setButtonLoading(form.querySelector('.auth-btn'), false);
        }
    }

    setupPasswordValidation() {
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const strengthFill = document.getElementById('strengthFill');
        const strengthText = document.getElementById('strengthText');
        const passwordMatch = document.getElementById('passwordMatch');

        if (passwordInput && strengthFill && strengthText) {
            passwordInput.addEventListener('input', () => {
                const password = passwordInput.value;
                const strength = this.calculatePasswordStrength(password);
                
                // Update strength bar
                strengthFill.className = `strength-fill ${strength.level}`;
                strengthText.textContent = strength.text;
            });
        }

        if (confirmPasswordInput && passwordMatch) {
            confirmPasswordInput.addEventListener('input', () => {
                const password = passwordInput.value;
                const confirmPassword = confirmPasswordInput.value;
                
                if (confirmPassword.length > 0) {
                    if (password === confirmPassword) {
                        passwordMatch.innerHTML = '<i class="fas fa-check"></i>';
                        passwordMatch.className = 'password-match match';
                    } else {
                        passwordMatch.innerHTML = '<i class="fas fa-times"></i>';
                        passwordMatch.className = 'password-match no-match';
                    }
                } else {
                    passwordMatch.innerHTML = '';
                    passwordMatch.className = 'password-match';
                }
            });
        }
    }

    calculatePasswordStrength(password) {
        let score = 0;
        let feedback = [];

        if (password.length >= 8) score += 1;
        else feedback.push('at least 8 characters');

        if (/[a-z]/.test(password)) score += 1;
        else feedback.push('lowercase letter');

        if (/[A-Z]/.test(password)) score += 1;
        else feedback.push('uppercase letter');

        if (/\d/.test(password)) score += 1;
        else feedback.push('number');

        if (/[^a-zA-Z\d]/.test(password)) score += 1;
        else feedback.push('special character');

        const levels = {
            0: { level: 'weak', text: 'Very weak' },
            1: { level: 'weak', text: 'Weak' },
            2: { level: 'fair', text: 'Fair' },
            3: { level: 'good', text: 'Good' },
            4: { level: 'good', text: 'Strong' },
            5: { level: 'strong', text: 'Very strong' }
        };

        return levels[score] || levels[0];
    }

    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const toggleIcon = document.querySelector('#togglePassword i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.className = 'fas fa-eye-slash';
        } else {
            passwordInput.type = 'password';
            toggleIcon.className = 'fas fa-eye';
        }
    }

    async handleSocialLogin(e) {
        const provider = e.currentTarget.classList.contains('google') ? 'google' : 'github';
        
        // Show loading state
        e.currentTarget.style.opacity = '0.7';
        e.currentTarget.style.pointerEvents = 'none';

        try {
            // Simulate social login
            await this.simulateSocialLogin(provider);
            
            const userData = {
                email: `user@${provider}.com`,
                name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
                provider: provider,
                loginTime: new Date().toISOString()
            };

            sessionStorage.setItem('userData', JSON.stringify(userData));
            
            this.showMessage(`${provider.charAt(0).toUpperCase() + provider.slice(1)} login successful!`, 'success');
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);

        } catch (error) {
            this.showMessage(`${provider.charAt(0).toUpperCase() + provider.slice(1)} login failed`, 'error');
        } finally {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.pointerEvents = 'auto';
        }
    }

    async simulateLogin(email, password) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Simple validation (in real app, this would be server-side)
        if (!email || !password) {
            throw new Error('Please fill in all fields');
        }
        
        if (password.length < 6) {
            throw new Error('Invalid credentials');
        }
        
        return { success: true };
    }

    async simulateSignup(email, password, firstName, lastName) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simple validation
        if (!email || !password || !firstName || !lastName) {
            throw new Error('Please fill in all fields');
        }
        
        if (password.length < 8) {
            throw new Error('Password must be at least 8 characters long');
        }
        
        // Simulate email already exists check
        if (email === 'test@example.com') {
            throw new Error('Email already exists');
        }
        
        return { success: true };
    }

    async simulateSocialLogin(provider) {
        // Simulate social login delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Random success/failure for demo
        if (Math.random() > 0.8) {
            throw new Error('Social login failed');
        }
        
        return { success: true };
    }

    checkAuthState() {
        // Check if user is already logged in
        const userData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
        
        if (userData && (window.location.pathname.includes('login.html') || window.location.pathname.includes('signup.html'))) {
            // User is logged in but on auth page, redirect to main app
            window.location.href = 'index.html';
        }
    }

    setButtonLoading(button, loading) {
        const btnText = button.querySelector('.btn-text');
        const btnLoader = button.querySelector('.btn-loader');
        
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
            btnLoader.classList.remove('hidden');
        } else {
            button.classList.remove('loading');
            button.disabled = false;
            btnLoader.classList.add('hidden');
        }
    }

    showMessage(message, type = 'info') {
        // Remove existing messages
        const existingMessage = document.querySelector('.auth-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `auth-message auth-message-${type}`;
        messageEl.innerHTML = `
            <div class="message-content">
                <i class="fas ${this.getMessageIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        // Add styles
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(messageEl);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => messageEl.remove(), 300);
            }
        }, 5000);
    }

    getMessageIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    // Static method to logout
    static logout() {
        localStorage.removeItem('userData');
        sessionStorage.removeItem('userData');
        localStorage.removeItem('chatHistory');
        window.location.href = 'login.html';
    }

    // Static method to get current user
    static getCurrentUser() {
        const userData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
    }

    // Static method to check if user is authenticated
    static isAuthenticated() {
        return this.getCurrentUser() !== null;
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

// Add CSS for messages
const messageStyles = document.createElement('style');
messageStyles.textContent = `
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

    .auth-message .message-content {
        display: flex;
        align-items: center;
        gap: 8px;
    }
`;
document.head.appendChild(messageStyles);
