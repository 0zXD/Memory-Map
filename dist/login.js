// API Configuration
const API_BASE_URL = 'http://localhost:8080';

// Dark mode functionality
class DarkModeManager {
    constructor() {
        this.init();
    }

    init() {
        const savedMode = localStorage.getItem('darkMode');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedMode === 'dark' || (!savedMode && prefersDark)) {
            this.enableDarkMode();
        } else {
            this.disableDarkMode();
        }

        const toggleBtn = document.getElementById('darkModeToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleDarkMode());
        }
    }

    enableDarkMode() {
        document.documentElement.classList.add('dark');
        localStorage.setItem('darkMode', 'dark');
        this.updateToggleIcon('fas fa-sun');
    }

    disableDarkMode() {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('darkMode', 'light');
        this.updateToggleIcon('fas fa-moon');
    }

    toggleDarkMode() {
        if (document.documentElement.classList.contains('dark')) {
            this.disableDarkMode();
        } else {
            this.enableDarkMode();
        }
    }

    updateToggleIcon(iconClass) {
        const toggleBtn = document.getElementById('darkModeToggle');
        if (toggleBtn) {
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                icon.className = iconClass + ' text-slate-600 dark:text-slate-400';
            }
        }
    }
}

// Authentication Manager
class AuthManager {
    constructor() {
        this.currentForm = 'login';
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Form toggle
        const toggleForm = document.getElementById('toggleForm');
        if (toggleForm) {
            toggleForm.addEventListener('click', () => this.toggleFormMode());
        }

        // Password toggles
        const toggleLoginPassword = document.getElementById('toggleLoginPassword');
        const toggleSignupPassword = document.getElementById('toggleSignupPassword');
        
        if (toggleLoginPassword) {
            toggleLoginPassword.addEventListener('click', () => 
                this.togglePasswordVisibility('loginPassword', 'toggleLoginPassword')
            );
        }
        
        if (toggleSignupPassword) {
            toggleSignupPassword.addEventListener('click', () => 
                this.togglePasswordVisibility('signupPassword', 'toggleSignupPassword')
            );
        }

        // Password strength checker
        const signupPassword = document.getElementById('signupPassword');
        const confirmPassword = document.getElementById('confirmPassword');
        
        if (signupPassword) {
            signupPassword.addEventListener('input', () => this.checkPasswordStrength());
        }
        
        if (confirmPassword) {
            confirmPassword.addEventListener('input', () => this.checkPasswordMatch());
        }

        // Form submissions
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }

        // Check if user is already logged in
        this.checkExistingSession();
    }

    checkExistingSession() {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        if (token && userData) {
            // Verify token with backend
            this.verifyToken(token);
        }
    }

    async verifyToken(token) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/verify`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Token is valid, redirect to main page
                window.location.href = 'main.html';
            } else {
                // Token is invalid, clear storage
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
            }
        } catch (error) {
            console.error('Token verification failed:', error);
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
        }
    }

    toggleFormMode() {
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        const formTitle = document.getElementById('formTitle');
        const formSubtitle = document.getElementById('formSubtitle');
        const toggleText = document.getElementById('toggleText');
        const toggleButtonText = document.getElementById('toggleButtonText');

        if (this.currentForm === 'login') {
            // Switch to signup
            loginForm.classList.add('hidden');
            signupForm.classList.remove('hidden');
            formTitle.textContent = 'Create Account';
            formSubtitle.textContent = 'Join our community of explorers';
            toggleText.textContent = 'Already have an account?';
            toggleButtonText.textContent = 'Sign in';
            this.currentForm = 'signup';
        } else {
            // Switch to login
            signupForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
            formTitle.textContent = 'Welcome Back';
            formSubtitle.textContent = 'Sign in to continue your journey';
            toggleText.textContent = "Don't have an account?";
            toggleButtonText.textContent = 'Sign up';
            this.currentForm = 'login';
        }
    }

    togglePasswordVisibility(passwordId, toggleId) {
        const passwordInput = document.getElementById(passwordId);
        const toggleButton = document.getElementById(toggleId);
        
        if (passwordInput && toggleButton) {
            const icon = toggleButton.querySelector('i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.className = 'fas fa-eye-slash';
            } else {
                passwordInput.type = 'password';
                icon.className = 'fas fa-eye';
            }
        }
    }

    checkPasswordStrength() {
        const password = document.getElementById('signupPassword').value;
        const strengthBar = document.getElementById('strengthBar');
        const strengthText = document.getElementById('strengthText');
        
        let strength = 0;
        let strengthLabel = '';
        
        // Check password criteria
        if (password.length >= 8) strength += 25;
        if (password.match(/[a-z]/)) strength += 25;
        if (password.match(/[A-Z]/)) strength += 25;
        if (password.match(/[0-9]/) || password.match(/[^a-zA-Z0-9]/)) strength += 25;
        
        // Update UI
        strengthBar.style.width = strength + '%';
        
        if (strength < 50) {
            strengthLabel = 'Weak';
            strengthBar.className = 'strength-weak h-1 rounded-full transition-all duration-300';
        } else if (strength < 75) {
            strengthLabel = 'Medium';
            strengthBar.className = 'strength-medium h-1 rounded-full transition-all duration-300';
        } else {
            strengthLabel = 'Strong';
            strengthBar.className = 'strength-strong h-1 rounded-full transition-all duration-300';
        }
        
        strengthText.textContent = strengthLabel;
        this.checkPasswordMatch();
    }

    checkPasswordMatch() {
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const passwordMatch = document.getElementById('passwordMatch');
        
        if (confirmPassword && password !== confirmPassword) {
            passwordMatch.classList.remove('hidden');
        } else {
            passwordMatch.classList.add('hidden');
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        if (!username || !password) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }

        this.setLoading('login', true);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Store authentication data
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userData', JSON.stringify(data.user));
                
                this.showMessage('Login successful! Redirecting...', 'success');
                
                // Redirect to main page
                setTimeout(() => {
                    window.location.href = 'main.html';
                }, 1500);
            } else {
                this.showMessage(data.error || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('Network error. Please try again.', 'error');
        } finally {
            this.setLoading('login', false);
        }
    }

    async handleSignup(e) {
        e.preventDefault();
        
        const username = document.getElementById('signupUsername').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validation
        if (!username || !email || !password || !confirmPassword) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match', 'error');
            return;
        }

        if (password.length < 8) {
            this.showMessage('Password must be at least 8 characters long', 'error');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showMessage('Please enter a valid email address', 'error');
            return;
        }

        this.setLoading('signup', true);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Store authentication data
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userData', JSON.stringify(data.user));
                
                this.showMessage('Account created successfully! Redirecting...', 'success');
                
                // Redirect to main page
                setTimeout(() => {
                    window.location.href = 'main.html';
                }, 1500);
            } else {
                this.showMessage(data.error || 'Signup failed', 'error');
            }
        } catch (error) {
            console.error('Signup error:', error);
            this.showMessage('Network error. Please try again.', 'error');
        } finally {
            this.setLoading('signup', false);
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    setLoading(formType, isLoading) {
        const btnText = document.getElementById(`${formType}BtnText`);
        const spinner = document.getElementById(`${formType}Spinner`);
        const btn = document.getElementById(`${formType}Btn`);
        
        if (isLoading) {
            btnText.textContent = formType === 'login' ? 'Signing In...' : 'Creating Account...';
            spinner.classList.remove('hidden');
            btn.disabled = true;
            btn.classList.add('opacity-75');
        } else {
            btnText.textContent = formType === 'login' ? 'Sign In' : 'Create Account';
            spinner.classList.add('hidden');
            btn.disabled = false;
            btn.classList.remove('opacity-75');
        }
    }

    showMessage(message, type = 'info') {
        const container = this.getMessageContainer();
        
        const messageEl = document.createElement('div');
        messageEl.className = `message-toast p-4 rounded-xl shadow-lg transition-all duration-300 transform translate-x-full ${
            type === 'success' ? 'border-l-4 border-emerald-500' : 
            type === 'error' ? 'border-l-4 border-red-500' : 
            'border-l-4 border-blue-500'
        }`;
        
        messageEl.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${
                    type === 'success' ? 'fa-check-circle text-emerald-500' : 
                    type === 'error' ? 'fa-exclamation-circle text-red-500' : 
                    'fa-info-circle text-blue-500'
                } mr-3"></i>
                <span class="text-slate-800 dark:text-slate-200">${message}</span>
            </div>
        `;
        
        container.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.classList.remove('translate-x-full');
        }, 10);
        
        setTimeout(() => {
            messageEl.classList.add('translate-x-full');
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 4000);
    }

    getMessageContainer() {
        let container = document.getElementById('messageContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'messageContainer';
            container.className = 'fixed top-20 right-4 z-50 space-y-2';
            document.body.appendChild(container);
        }
        return container;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    new DarkModeManager();
    new AuthManager();
});