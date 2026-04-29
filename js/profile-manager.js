"use strict";

/**
 * ProfileManager - Handles all user profile management functionality
 * Integrates with AuthManager for user data operations
 */
class ProfileManager {
    constructor(authManager) {
        this.authManager = authManager;
        this.currentTab = 'personal';
        this.isInitialized = false;

        // Wait for DOM to be ready before initializing
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    /**
     * Initialize the profile manager
     */
    init() {
        if (this.isInitialized) return;

        this.setupEventListeners();
        this.setupAvatarUpload();
        this.isInitialized = true;

        console.log('ProfileManager initialized');
    }

    /**
     * Set up all event listeners for profile functionality
     */
    setupEventListeners() {
        // Personal info form submission
        const personalForm = document.getElementById('personalInfoForm');
        if (personalForm) {
            personalForm.addEventListener('submit', (e) => this.handlePersonalInfoSubmit(e));
        }

        // Password change form submission
        const passwordForm = document.getElementById('passwordChangeForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => this.handlePasswordChangeSubmit(e));
        }

        // Preferences form submission
        const preferencesForm = document.getElementById('preferencesForm');
        if (preferencesForm) {
            preferencesForm.addEventListener('submit', (e) => this.handlePreferencesSubmit(e));
        }

        // Real-time password matching validation
        const newPassword = document.getElementById('newPassword');
        const confirmPassword = document.getElementById('confirmNewPassword');
        if (newPassword && confirmPassword) {
            confirmPassword.addEventListener('input', () => {
                this.validatePasswordMatch(newPassword.value, confirmPassword.value);
            });
        }

        // Modal close listeners
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeProfileModal();
            }
        });
    }

    /**
     * Set up avatar upload functionality
     */
    setupAvatarUpload() {
        const avatarUpload = document.getElementById('avatarUpload');
        if (avatarUpload) {
            avatarUpload.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    this.handleAvatarUpload(e.target.files[0]);
                }
            });
        }
    }

    /**
     * Open the profile modal and populate with user data
     */
    openProfileModal() {
        if (!this.authManager || !this.authManager.isAuthenticated()) {
            this.authManager.showNotification('Please log in to access profile settings.', 'warning');
            return;
        }

        const modal = document.getElementById('profileModalOverlay');
        if (!modal) {
            console.error('Profile modal not found');
            return;
        }

        // Populate form with current user data
        this.populateProfileData();

        // Show modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Focus first input
        setTimeout(() => {
            const firstInput = modal.querySelector('input[type="text"]');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    /**
     * Close the profile modal
     */
    closeProfileModal() {
        const modal = document.getElementById('profileModalOverlay');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    /**
     * Switch between profile tabs
     */
    switchProfileTab(tabName) {
        this.currentTab = tabName;

        // Update tab buttons
        const tabs = document.querySelectorAll('.profile-tab');
        tabs.forEach(tab => tab.classList.remove('active'));

        const activeTab = document.querySelector(`[onclick="switchProfileTab('${tabName}')"]`);
        if (activeTab) activeTab.classList.add('active');

        // Update tab content
        const contents = document.querySelectorAll('.profile-tab-content');
        contents.forEach(content => content.style.display = 'none');

        const activeContent = document.getElementById(`${tabName}Tab`);
        if (activeContent) activeContent.style.display = 'block';
    }

    /**
     * Populate profile forms with current user data
     */
    populateProfileData() {
        const user = this.authManager.getCurrentUser();
        if (!user) return;

        // Personal info tab
        const nameInput = document.getElementById('profileName');
        const emailInput = document.getElementById('profileEmail');
        const bioInput = document.getElementById('profileBio');
        const avatarImg = document.getElementById('profileAvatar');

        if (nameInput) nameInput.value = user.name || '';
        if (emailInput) emailInput.value = user.email || '';
        if (bioInput) bioInput.value = user.bio || '';

        // Set avatar
        if (avatarImg && user.profilePicture) {
            avatarImg.src = user.profilePicture;
        }

        // Account info
        this.updateAccountInfo(user);

        // Preferences
        const langSelect = document.getElementById('preferredLanguage');
        const notificationsCheck = document.getElementById('emailNotifications');

        if (langSelect && user.preferences) {
            langSelect.value = user.preferences.language || 'en';
        }
        if (notificationsCheck && user.preferences) {
            notificationsCheck.checked = user.preferences.notifications !== false;
        }
    }

    /**
     * Update account information display
     */
    updateAccountInfo(user) {
        const memberSince = document.getElementById('memberSince');
        const totalLogins = document.getElementById('totalLogins');
        const lastLogin = document.getElementById('lastLogin');

        if (memberSince && user.createdAt) {
            const date = new Date(user.createdAt);
            memberSince.textContent = date.toLocaleDateString();
        }

        if (totalLogins) {
            totalLogins.textContent = user.loginCount || 0;
        }

        if (lastLogin && user.lastLogin) {
            const date = new Date(user.lastLogin);
            lastLogin.textContent = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        }
    }

    /**
     * Handle personal information form submission
     */
    handlePersonalInfoSubmit(event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            bio: formData.get('bio')
        };

        // Validate input
        if (!this.validatePersonalInfo(data)) {
            return false;
        }

        try {
            // Update user via AuthManager
            const currentUser = this.authManager.getCurrentUser();
            const updatedUser = {
                ...currentUser,
                name: this.authManager.sanitizeInput(data.name),
                email: data.email.toLowerCase().trim(),
                bio: this.authManager.sanitizeInput(data.bio)
            };

            // Check if email is already taken by another user
            if (data.email !== currentUser.email) {
                const existingUser = this.authManager.getUserByEmail(data.email);
                if (existingUser && existingUser.id !== currentUser.id) {
                    this.authManager.showNotification('Email address is already taken.', 'error');
                    return false;
                }
            }

            // Update user data
            this.authManager.updateCurrentUser(updatedUser);

            // Update UI elements
            this.updateUserInterfaceElements(updatedUser);

            this.authManager.showNotification('Profile updated successfully!', 'success');

        } catch (error) {
            console.error('Error updating profile:', error);
            this.authManager.showNotification('Error updating profile. Please try again.', 'error');
        }

        return false;
    }

    /**
     * Handle password change form submission
     */
    handlePasswordChangeSubmit(event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        const passwords = {
            current: formData.get('currentPassword'),
            new: formData.get('newPassword'),
            confirm: formData.get('confirmNewPassword')
        };

        // Validate passwords
        if (!this.validatePasswordChange(passwords)) {
            return false;
        }

        try {
            // Verify current password
            const currentUser = this.authManager.getCurrentUser();
            if (!this.authManager.verifyPassword(passwords.current, currentUser.password)) {
                this.authManager.showNotification('Current password is incorrect.', 'error');
                return false;
            }

            // Update password
            const newPasswordHash = this.authManager.hashPassword(passwords.new);
            const updatedUser = {
                ...currentUser,
                password: newPasswordHash
            };

            this.authManager.updateCurrentUser(updatedUser);

            // Clear form
            event.target.reset();

            this.authManager.showNotification('Password updated successfully!', 'success');

        } catch (error) {
            console.error('Error updating password:', error);
            this.authManager.showNotification('Error updating password. Please try again.', 'error');
        }

        return false;
    }

    /**
     * Handle preferences form submission
     */
    handlePreferencesSubmit(event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        const preferences = {
            language: formData.get('language'),
            notifications: formData.has('notifications')
        };

        try {
            const currentUser = this.authManager.getCurrentUser();
            const updatedUser = {
                ...currentUser,
                preferences: {
                    ...currentUser.preferences,
                    ...preferences
                }
            };

            this.authManager.updateCurrentUser(updatedUser);

            // Apply language change if different
            if (window.i18n && preferences.language !== currentUser.preferences?.language) {
                window.i18n.changeLanguage(preferences.language);
            }

            this.authManager.showNotification('Preferences updated successfully!', 'success');

        } catch (error) {
            console.error('Error updating preferences:', error);
            this.authManager.showNotification('Error updating preferences. Please try again.', 'error');
        }

        return false;
    }

    /**
     * Validate personal information
     */
    validatePersonalInfo(data) {
        if (!data.name || data.name.trim().length < 2) {
            this.authManager.showNotification('Name must be at least 2 characters long.', 'error');
            return false;
        }

        if (!this.authManager.validateEmail(data.email)) {
            this.authManager.showNotification('Please enter a valid email address.', 'error');
            return false;
        }

        if (data.bio && data.bio.length > 200) {
            this.authManager.showNotification('Bio must be less than 200 characters.', 'error');
            return false;
        }

        return true;
    }

    /**
     * Validate password change
     */
    validatePasswordChange(passwords) {
        if (!passwords.current) {
            this.authManager.showNotification('Current password is required.', 'error');
            return false;
        }

        if (!passwords.new || passwords.new.length < 6) {
            this.authManager.showNotification('New password must be at least 6 characters long.', 'error');
            return false;
        }

        if (passwords.new !== passwords.confirm) {
            this.authManager.showNotification('New passwords do not match.', 'error');
            return false;
        }

        return true;
    }

    /**
     * Validate password matching in real-time
     */
    validatePasswordMatch(password, confirmPassword) {
        const confirmInput = document.getElementById('confirmNewPassword');

        if (confirmPassword && password !== confirmPassword) {
            confirmInput.classList.add('form-input--error');
        } else {
            confirmInput.classList.remove('form-input--error');
        }
    }

    /**
     * Trigger avatar upload
     */
    triggerAvatarUpload() {
        const avatarUpload = document.getElementById('avatarUpload');
        if (avatarUpload) {
            avatarUpload.click();
        }
    }

    /**
     * Handle avatar file upload
     */
    handleAvatarUpload(file) {
        // Validate file
        if (!file.type.startsWith('image/')) {
            this.authManager.showNotification('Please select an image file.', 'error');
            return;
        }

        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            this.authManager.showNotification('Image file must be smaller than 2MB.', 'error');
            return;
        }

        // Convert to base64
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const base64Data = e.target.result;

                // Update user profile
                const currentUser = this.authManager.getCurrentUser();
                const updatedUser = {
                    ...currentUser,
                    profilePicture: base64Data
                };

                this.authManager.updateCurrentUser(updatedUser);

                // Update all avatar displays
                this.updateAvatarDisplays(base64Data);

                this.authManager.showNotification('Profile picture updated successfully!', 'success');

            } catch (error) {
                console.error('Error uploading avatar:', error);
                this.authManager.showNotification('Error uploading image. Please try again.', 'error');
            }
        };

        reader.onerror = () => {
            this.authManager.showNotification('Error reading image file.', 'error');
        };

        reader.readAsDataURL(file);
    }

    /**
     * Update all avatar displays across the interface
     */
    updateAvatarDisplays(imageData) {
        const avatars = [
            document.getElementById('profileAvatar'),
            document.getElementById('userAvatar'),
            document.getElementById('dropdownAvatar')
        ];

        avatars.forEach(avatar => {
            if (avatar) {
                avatar.src = imageData;
            }
        });
    }

    /**
     * Update user interface elements with new user data
     */
    updateUserInterfaceElements(user) {
        // Update dropdown display
        const dropdownName = document.getElementById('dropdownName');
        const dropdownEmail = document.getElementById('dropdownEmail');
        const userName = document.getElementById('userName');

        if (dropdownName) dropdownName.textContent = user.name;
        if (dropdownEmail) dropdownEmail.textContent = user.email;
        if (userName) userName.textContent = user.name;

        // Update avatar if exists
        if (user.profilePicture) {
            this.updateAvatarDisplays(user.profilePicture);
        }
    }

    /**
     * Reset personal info form to original values
     */
    resetPersonalForm() {
        this.populateProfileData();
    }

    /**
     * Handle profile overlay click (to close modal)
     */
    handleProfileOverlayClick(event) {
        if (event.target === document.getElementById('profileModalOverlay')) {
            this.closeProfileModal();
        }
    }
}

// Global functions for HTML onclick handlers
window.openProfileModal = function() {
    if (window.authManager && window.authManager.profileManager) {
        window.authManager.profileManager.openProfileModal();
    }
};

window.closeProfileModal = function() {
    if (window.authManager && window.authManager.profileManager) {
        window.authManager.profileManager.closeProfileModal();
    }
};

window.switchProfileTab = function(tabName) {
    if (window.authManager && window.authManager.profileManager) {
        window.authManager.profileManager.switchProfileTab(tabName);
    }
};

window.triggerAvatarUpload = function() {
    if (window.authManager && window.authManager.profileManager) {
        window.authManager.profileManager.triggerAvatarUpload();
    }
};

window.resetPersonalForm = function() {
    if (window.authManager && window.authManager.profileManager) {
        window.authManager.profileManager.resetPersonalForm();
    }
};

window.handleProfileOverlayClick = function(event) {
    if (window.authManager && window.authManager.profileManager) {
        window.authManager.profileManager.handleProfileOverlayClick(event);
    }
};