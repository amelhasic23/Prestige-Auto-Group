/**
 * Advanced Authentication Manager for Prestige Auto Group
 * Full-featured client-side authentication with user management
 * Author: Claude Code Assistant
 * Version: 1.0.0
 */

class AuthManager {
    constructor() {
        // Storage configuration
        this.storageKeys = {
            users: 'pag_users',
            session: 'pag_current_session',
            loginAttempts: 'pag_login_attempts',
            userFavorites: 'pag_user_favorites'
        };

        // Session configuration
        this.currentUser = null;
        this.sessionDuration = 30 * 24 * 60 * 60 * 1000; // 30 days
        this.maxLoginAttempts = 5;
        this.lockoutDuration = 15 * 60 * 1000; // 15 minutes

        // Password configuration
        this.passwordRules = {
            minLength: 6,
            requireUppercase: false,
            requireLowercase: false,
            requireNumbers: false,
            requireSpecialChars: false
        };

        // Initialize authentication system
        this.initializeAuth();
    }

    /**
     * Initialize authentication system on page load
     */
    initializeAuth() {
        console.log('AuthManager: Initializing authentication system...');

        // Check for existing valid session
        const session = this.getStoredSession();
        if (session && this.isSessionValid(session)) {
            this.loadUserFromSession(session);
        } else {
            this.clearSession();
        }

        // Clean up expired sessions and data
        this.cleanupExpiredData();

        // Update UI based on authentication state
        this.updateUserInterface();

        console.log('AuthManager: Initialization complete. Current user:', this.currentUser?.name || 'Not logged in');
    }

    /**
     * Register a new user account
     */
    async registerUser(userData) {
        try {
            console.log('AuthManager: Attempting to register user:', userData.email);

            // Validate registration data
            const validation = this.validateRegistrationForm(userData);
            if (!validation.isValid) {
                return { success: false, errors: validation.errors };
            }

            // Check if email already exists
            if (this.emailExists(userData.email)) {
                return {
                    success: false,
                    errors: ['Email je već registrovan. Molimo koristite drugu email adresu.']
                };
            }

            // Create new user object
            const newUser = {
                id: this.generateUserId(),
                name: this.sanitizeInput(userData.name.trim()),
                email: this.sanitizeInput(userData.email.toLowerCase().trim()),
                password: this.hashPassword(userData.password),
                createdAt: new Date().toISOString(),
                lastLogin: null,
                loginCount: 0,
                accountLocked: false,
                securityQuestion: userData.securityQuestion || null,
                securityAnswer: userData.securityAnswer ? this.hashPassword(userData.securityAnswer) : null,
                profilePicture: null,
                preferences: {
                    language: window.i18n?.currentLang || 'bs',
                    notifications: true
                }
            };

            // Save user to storage
            const users = this.getStoredUsers();
            users.push(newUser);
            localStorage.setItem(this.storageKeys.users, JSON.stringify({ users }));

            // Automatically log in the new user
            const loginResult = await this.loginUser(userData.email, userData.password);

            console.log('AuthManager: User registered successfully:', newUser.email);
            return {
                success: true,
                user: { ...newUser, password: undefined }, // Don't return password
                message: 'Uspješno ste se registrovali i prijavili!'
            };

        } catch (error) {
            console.error('AuthManager: Registration error:', error);
            return {
                success: false,
                errors: ['Greška prilikom registracije. Molimo pokušajte ponovo.']
            };
        }
    }

    /**
     * Login user with credentials
     */
    async loginUser(email, password) {
        try {
            console.log('AuthManager: Attempting to login user:', email);

            // Validate login data
            const validation = this.validateLoginForm({ email, password });
            if (!validation.isValid) {
                return { success: false, errors: validation.errors };
            }

            // Check for account lockout
            const lockoutStatus = this.checkAccountLockout(email);
            if (lockoutStatus.locked) {
                return {
                    success: false,
                    errors: [`Račun je zaključan zbog previše neuspjelih pokušaja prijave. Pokušajte ponovo nakon ${Math.ceil(lockoutStatus.timeRemaining / 60000)} minuta.`]
                };
            }

            // Find user by email
            const users = this.getStoredUsers();
            const user = users.find(u => u.email === email.toLowerCase().trim());

            if (!user) {
                this.recordFailedLogin(email);
                return {
                    success: false,
                    errors: ['Neispravni podaci za prijavu. Molimo provjerite email i šifru.']
                };
            }

            // Verify password
            if (!this.verifyPassword(password, user.password)) {
                this.recordFailedLogin(email);
                return {
                    success: false,
                    errors: ['Neispravni podaci za prijavu. Molimo provjerite email i šifru.']
                };
            }

            // Check if account is locked
            if (user.accountLocked) {
                return {
                    success: false,
                    errors: ['Vaš račun je zaključan. Molimo kontaktirajte podršku.']
                };
            }

            // Clear failed login attempts
            this.clearFailedLogins(email);

            // Update user login statistics
            user.lastLogin = new Date().toISOString();
            user.loginCount = (user.loginCount || 0) + 1;
            this.updateUserInStorage(user);

            // Create session
            const session = this.createSession(user.id);
            this.currentUser = { ...user, password: undefined }; // Don't keep password in memory

            // Update UI
            this.updateUserInterface();

            console.log('AuthManager: User logged in successfully:', user.email);
            return {
                success: true,
                user: this.currentUser,
                message: `Dobrodošli, ${user.name}!`
            };

        } catch (error) {
            console.error('AuthManager: Login error:', error);
            return {
                success: false,
                errors: ['Greška prilikom prijave. Molimo pokušajte ponovo.']
            };
        }
    }

    /**
     * Logout current user
     */
    logoutUser() {
        try {
            console.log('AuthManager: Logging out user:', this.currentUser?.email);

            // Clear session and user data
            this.clearSession();
            this.currentUser = null;

            // Update UI
            this.updateUserInterface();

            // Close any open modals
            if (typeof closeAuthModal === 'function') {
                closeAuthModal();
            }

            console.log('AuthManager: User logged out successfully');
            return {
                success: true,
                message: 'Uspješno ste se odjavili.'
            };

        } catch (error) {
            console.error('AuthManager: Logout error:', error);
            return {
                success: false,
                errors: ['Greška prilikom odjave.']
            };
        }
    }

    /**
     * Get current authenticated user
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Check if user is currently authenticated
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }

    /**
     * Session Management
     */

    createSession(userId) {
        const session = {
            userId: userId,
            loginTime: new Date().toISOString(),
            expiresAt: new Date(Date.now() + this.sessionDuration).toISOString(),
            sessionId: this.generateSessionId()
        };

        localStorage.setItem(this.storageKeys.session, JSON.stringify(session));
        console.log('AuthManager: Session created for user:', userId);
        return session;
    }

    getStoredSession() {
        try {
            const sessionData = localStorage.getItem(this.storageKeys.session);
            return sessionData ? JSON.parse(sessionData) : null;
        } catch (error) {
            console.error('AuthManager: Error reading session:', error);
            return null;
        }
    }

    isSessionValid(session) {
        if (!session || !session.expiresAt || !session.userId) {
            return false;
        }

        const expiryDate = new Date(session.expiresAt);
        const now = new Date();

        return expiryDate > now;
    }

    loadUserFromSession(session) {
        const users = this.getStoredUsers();
        const user = users.find(u => u.id === session.userId);

        if (user && !user.accountLocked) {
            this.currentUser = { ...user, password: undefined };
            console.log('AuthManager: User loaded from session:', user.email);
            return true;
        }

        return false;
    }

    clearSession() {
        localStorage.removeItem(this.storageKeys.session);
        console.log('AuthManager: Session cleared');
    }

    /**
     * Form Validation
     */

    validateRegistrationForm(userData) {
        const errors = [];

        // Name validation
        if (!userData.name || userData.name.trim().length < 2) {
            errors.push('Ime mora imati najmanje 2 karaktera.');
        }

        // Email validation
        if (!userData.email || !this.validateEmail(userData.email)) {
            errors.push('Molimo unesite ispravnu email adresu.');
        }

        // Password validation
        const passwordValidation = this.validatePassword(userData.password);
        if (!passwordValidation.isValid) {
            errors.push(...passwordValidation.errors);
        }

        // Confirm password validation
        if (userData.password !== userData.confirmPassword) {
            errors.push('Potvrda šifre se ne slaže sa šifrom.');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    validateLoginForm(userData) {
        const errors = [];

        // Email validation
        if (!userData.email || !this.validateEmail(userData.email)) {
            errors.push('Molimo unesite ispravnu email adresu.');
        }

        // Password validation
        if (!userData.password || userData.password.length < 1) {
            errors.push('Molimo unesite šifru.');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePassword(password) {
        const errors = [];

        if (!password || password.length < this.passwordRules.minLength) {
            errors.push(`Šifra mora imati najmanje ${this.passwordRules.minLength} karaktera.`);
        }

        if (this.passwordRules.requireUppercase && !/[A-Z]/.test(password)) {
            errors.push('Šifra mora sadržavati najmanje jedno veliko slovo.');
        }

        if (this.passwordRules.requireLowercase && !/[a-z]/.test(password)) {
            errors.push('Šifra mora sadržavati najmanje jedno malo slovo.');
        }

        if (this.passwordRules.requireNumbers && !/\d/.test(password)) {
            errors.push('Šifra mora sadržavati najmanje jedan broj.');
        }

        if (this.passwordRules.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Šifra mora sadržavati najmanje jedan specijalni karakter.');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Security Features
     */

    checkAccountLockout(email) {
        const attempts = this.getFailedLogins(email);
        const now = Date.now();

        // Filter recent attempts (within lockout duration)
        const recentAttempts = attempts.filter(attempt =>
            now - attempt.timestamp < this.lockoutDuration
        );

        const locked = recentAttempts.length >= this.maxLoginAttempts;
        let timeRemaining = 0;

        if (locked && recentAttempts.length > 0) {
            const oldestAttempt = Math.min(...recentAttempts.map(a => a.timestamp));
            timeRemaining = this.lockoutDuration - (now - oldestAttempt);
        }

        return {
            locked: locked,
            attempts: recentAttempts.length,
            timeRemaining: Math.max(0, timeRemaining)
        };
    }

    recordFailedLogin(email) {
        const attempts = this.getFailedLogins();
        const userAttempts = attempts[email] || [];

        userAttempts.push({
            timestamp: Date.now(),
            ip: 'client-side' // In production, this would be the actual IP
        });

        // Keep only recent attempts
        const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
        attempts[email] = userAttempts.filter(attempt => attempt.timestamp > cutoff);

        localStorage.setItem(this.storageKeys.loginAttempts, JSON.stringify(attempts));
        console.log('AuthManager: Failed login recorded for:', email);
    }

    clearFailedLogins(email) {
        const attempts = this.getFailedLogins();
        if (attempts[email]) {
            delete attempts[email];
            localStorage.setItem(this.storageKeys.loginAttempts, JSON.stringify(attempts));
        }
    }

    getFailedLogins(email = null) {
        try {
            const attempts = JSON.parse(localStorage.getItem(this.storageKeys.loginAttempts) || '{}');
            return email ? (attempts[email] || []) : attempts;
        } catch (error) {
            console.error('AuthManager: Error reading login attempts:', error);
            return email ? [] : {};
        }
    }

    hashPassword(password) {
        // Basic client-side hashing (not secure for production)
        const salt = 'pag_salt_2026';
        return btoa(salt + password + salt);
    }

    verifyPassword(plainPassword, hashedPassword) {
        return this.hashPassword(plainPassword) === hashedPassword;
    }

    sanitizeInput(input) {
        if (typeof input !== 'string') return input;

        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    /**
     * User Management
     */

    getStoredUsers() {
        try {
            const userData = localStorage.getItem(this.storageKeys.users);
            const parsed = userData ? JSON.parse(userData) : { users: [] };
            return parsed.users || [];
        } catch (error) {
            console.error('AuthManager: Error reading users:', error);
            return [];
        }
    }

    updateUserInStorage(updatedUser) {
        const users = this.getStoredUsers();
        const index = users.findIndex(u => u.id === updatedUser.id);

        if (index !== -1) {
            users[index] = updatedUser;
            localStorage.setItem(this.storageKeys.users, JSON.stringify({ users }));

            // Update current user if it's the same user
            if (this.currentUser && this.currentUser.id === updatedUser.id) {
                this.currentUser = { ...updatedUser, password: undefined };
            }

            console.log('AuthManager: User updated in storage:', updatedUser.email);
            return true;
        }

        return false;
    }

    emailExists(email) {
        const users = this.getStoredUsers();
        return users.some(user => user.email === email.toLowerCase().trim());
    }

    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * User Interface Management
     */

    updateUserInterface() {
        try {
            const userButton = document.querySelector('.user-btn');
            const userIcon = userButton ? userButton.querySelector('ion-icon') : null;

            if (!userButton) {
                console.warn('AuthManager: User button not found');
                return;
            }

            // Remove existing click handlers
            userButton.onclick = null;

            if (this.isAuthenticated()) {
                // Update button for logged-in state
                if (userIcon) {
                    userIcon.setAttribute('name', 'person');
                }
                userButton.setAttribute('title', `Prijavljen kao: ${this.currentUser.name}`);
                userButton.onclick = (e) => {
                    e.preventDefault();
                    this.toggleUserDropdown();
                };

                // Create user dropdown if it doesn't exist
                this.ensureUserDropdownExists();

            } else {
                // Update button for logged-out state
                if (userIcon) {
                    userIcon.setAttribute('name', 'person-outline');
                }
                userButton.setAttribute('title', 'Prijava / Registracija');
                userButton.onclick = (e) => {
                    e.preventDefault();
                    if (typeof openAuthModal === 'function') {
                        openAuthModal();
                    }
                };

                // Remove user dropdown if it exists
                this.removeUserDropdown();
            }

            console.log('AuthManager: User interface updated for state:', this.isAuthenticated() ? 'logged-in' : 'logged-out');

        } catch (error) {
            console.error('AuthManager: Error updating user interface:', error);
        }
    }

    toggleUserDropdown() {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        }
    }

    ensureUserDropdownExists() {
        let dropdown = document.getElementById('userDropdown');

        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.id = 'userDropdown';
            dropdown.className = 'user-dropdown';
            dropdown.innerHTML = `
                <div class="user-dropdown-content">
                    <div class="user-info">
                        <strong>${this.currentUser.name}</strong>
                        <small>${this.currentUser.email}</small>
                    </div>
                    <hr>
                    <a href="#" onclick="window.authManager.showUserFavorites(); return false;">
                        <ion-icon name="heart"></ion-icon> Moji favoriti
                    </a>
                    <a href="#" onclick="window.authManager.showUserProfile(); return false;">
                        <ion-icon name="person"></ion-icon> Moj profil
                    </a>
                    <hr>
                    <a href="#" onclick="window.authManager.logoutUser(); return false;" class="logout-link">
                        <ion-icon name="log-out"></ion-icon> Odjavi se
                    </a>
                </div>
            `;

            // Position dropdown relative to user button
            const userButton = document.querySelector('.user-btn');
            if (userButton) {
                userButton.parentElement.style.position = 'relative';
                userButton.parentElement.appendChild(dropdown);
            }
        } else {
            // Update existing dropdown content
            const userInfo = dropdown.querySelector('.user-info');
            if (userInfo) {
                userInfo.innerHTML = `
                    <strong>${this.currentUser.name}</strong>
                    <small>${this.currentUser.email}</small>
                `;
            }
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-btn') && !e.target.closest('#userDropdown')) {
                dropdown.style.display = 'none';
            }
        });
    }

    removeUserDropdown() {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.remove();
        }
    }

    showUserFavorites() {
        // This will be implemented when integrating with favorites system
        this.showNotification('Funkcija "Moji favoriti" će uskoro biti dostupna.', 'info');
        this.toggleUserDropdown();
    }

    showUserProfile() {
        // This will be implemented in advanced features phase
        this.showNotification('Funkcija "Moj profil" će uskoro biti dostupna.', 'info');
        this.toggleUserDropdown();
    }

    showNotification(message, type = 'success') {
        // Create notification element if it doesn't exist
        let notification = document.getElementById('authNotification');

        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'authNotification';
            notification.className = 'auth-notification';
            document.body.appendChild(notification);
        }

        // Set notification content and type
        notification.className = `auth-notification auth-notification--${type} auth-notification--show`;
        notification.innerHTML = `
            <div class="auth-notification-content">
                <ion-icon name="${type === 'error' ? 'alert-circle' : type === 'success' ? 'checkmark-circle' : 'information-circle'}"></ion-icon>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.classList.remove('auth-notification--show')" class="auth-notification-close">×</button>
            </div>
        `;

        // Auto-hide notification after 5 seconds
        setTimeout(() => {
            notification.classList.remove('auth-notification--show');
        }, 5000);
    }

    /**
     * Utility Functions
     */

    cleanupExpiredData() {
        // Clean up expired sessions
        const session = this.getStoredSession();
        if (session && !this.isSessionValid(session)) {
            this.clearSession();
        }

        // Clean up old failed login attempts
        const attempts = this.getFailedLogins();
        const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
        let modified = false;

        Object.keys(attempts).forEach(email => {
            const filteredAttempts = attempts[email].filter(attempt => attempt.timestamp > cutoff);
            if (filteredAttempts.length !== attempts[email].length) {
                attempts[email] = filteredAttempts;
                modified = true;
            }
            if (filteredAttempts.length === 0) {
                delete attempts[email];
                modified = true;
            }
        });

        if (modified) {
            localStorage.setItem(this.storageKeys.loginAttempts, JSON.stringify(attempts));
        }

        console.log('AuthManager: Expired data cleaned up');
    }

    /**
     * Debug and Development Functions
     */

    getDebugInfo() {
        return {
            currentUser: this.currentUser,
            isAuthenticated: this.isAuthenticated(),
            session: this.getStoredSession(),
            totalUsers: this.getStoredUsers().length,
            failedAttempts: Object.keys(this.getFailedLogins()).length
        };
    }

    clearAllData() {
        if (confirm('Are you sure you want to clear all authentication data? This action cannot be undone.')) {
            Object.values(this.storageKeys).forEach(key => {
                localStorage.removeItem(key);
            });
            this.currentUser = null;
            this.updateUserInterface();
            console.log('AuthManager: All authentication data cleared');
        }
    }
}

// Make AuthManager available globally
window.AuthManager = AuthManager;