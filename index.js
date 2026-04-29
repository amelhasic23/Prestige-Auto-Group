"use strict";

const overlay = document.querySelector("[data-overlay]");
const navbar = document.querySelector("[data-navbar]");
const navToggleBtn = document.querySelector("[data-nav-toggle-btn]");
const navbarLinks = navbar ? navbar.querySelectorAll("a") : [];

const navToggleFunc = function () {
    navToggleBtn?.classList.toggle("active");
    navbar?.classList.toggle("active");
    overlay?.classList.toggle("active");
};

if (navToggleBtn) navToggleBtn.addEventListener("click", navToggleFunc);
if (overlay) overlay.addEventListener("click", navToggleFunc);

for (let i = 0; i < navbarLinks.length; i++) {
    navbarLinks[i].addEventListener("click", navToggleFunc);
}

const header = document.querySelector("[data-header]");
window.addEventListener("scroll", function () {
    if (!header) return;
    window.scrollY >= 10 ? header.classList.add("active") : header.classList.remove("active");
});

// ========================================
// i18n Integration Functions
// ========================================

/**
 * Toggle favorite status for car cards (now uses authentication)
 */
function toggleFavorite(favId) {
    // Use authenticated version if authManager is available
    if (typeof authManager !== 'undefined' && authManager) {
        return toggleFavoriteAuthenticated(favId);
    }

    // Fallback to original functionality if auth not available
    const button = document.getElementById(favId);
    if (!button) {
        console.warn(`Favorite button with ID '${favId}' not found`);
        return;
    }

    button.classList.toggle('active');
    const icon = button.querySelector('ion-icon');
    if (icon) {
        const iconName = button.classList.contains('active') ? 'heart' : 'heart-outline';
        icon.setAttribute('name', iconName);
    }

    // Update aria-label with translation if available
    if (window.i18n) {
        const labelKey = button.classList.contains('active') ? 'cars.remove_from_favorites' : 'cars.add_to_favorites';
        const translatedLabel = window.i18n.t(labelKey, button.getAttribute('aria-label'));
        button.setAttribute('aria-label', translatedLabel);
    }
}

/**
 * Handle car rental action (now uses authentication)
 */
function rentCar(carName, year) {
    // Use authenticated version if authManager is available
    if (typeof authManager !== 'undefined' && authManager) {
        return rentCarAuthenticated(carName, year);
    }

    // Fallback to original functionality if auth not available
    let message;
    if (window.i18n) {
        const template = window.i18n.t('cars.rent_inquiry', `Interested in ${carName} ${year}`);
        message = template.replace('%car%', carName).replace('%year%', year);
    } else {
        message = `Interested in ${carName} ${year}`;
    }

    alert(message);

    // You could also redirect to a booking page or open a modal
    console.log(`Rent car request: ${carName} ${year}`);
}

/**
 * Toggle FAQ item
 */
function toggleFAQ(faqId) {
    const faqItem = document.getElementById(faqId);
    if (!faqItem) {
        console.warn(`FAQ item with ID '${faqId}' not found`);
        return;
    }

    const isActive = faqItem.classList.contains('active');

    // Close all other FAQ items
    const allFAQs = document.querySelectorAll('.faq-item');
    allFAQs.forEach(item => {
        if (item !== faqItem) {
            item.classList.remove('active');
        }
    });

    // Toggle current FAQ item
    faqItem.classList.toggle('active', !isActive);
}

// ========================================
// Authentication Modal Functions
// ========================================

/**
 * Open authentication modal
 */
function openAuthModal() {
    const modalOverlay = document.getElementById('authModalOverlay');
    if (modalOverlay) {
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Close authentication modal
 */
function closeAuthModal() {
    const modalOverlay = document.getElementById('authModalOverlay');
    if (modalOverlay) {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/**
 * Handle overlay click to close modal
 */
function handleOverlayClick(e) {
    if (e.target === document.getElementById('authModalOverlay')) {
        closeAuthModal();
    }
}

/**
 * Switch between sign in and sign up tabs
 */
function switchTab(tab) {
    const isSignIn = tab === 'signin';

    const formSignIn = document.getElementById('formSignIn');
    const formSignUp = document.getElementById('formSignUp');
    const tabSignIn = document.getElementById('tabSignIn');
    const tabSignUp = document.getElementById('tabSignUp');

    if (formSignIn && formSignUp && tabSignIn && tabSignUp) {
        formSignIn.classList.toggle('auth-form--hidden', !isSignIn);
        formSignUp.classList.toggle('auth-form--hidden', isSignIn);
        tabSignIn.classList.toggle('active', isSignIn);
        tabSignUp.classList.toggle('active', !isSignIn);
    }
}

// ========================================
// Mobile Menu Functions
// ========================================

/**
 * Toggle mobile menu (alternative implementation)
 */
function toggleMobileMenu() {
    const navbar = document.getElementById('navbar');
    const overlay = document.querySelector('[data-overlay]');
    const menuToggle = document.getElementById('menuToggle');

    if (navbar && overlay && menuToggle) {
        navbar.classList.toggle('active');
        overlay.classList.toggle('active');
        menuToggle.classList.toggle('active');
    }
}

/**
 * Close mobile menu
 */
function closeMobileMenu() {
    const navbar = document.getElementById('navbar');
    const overlay = document.querySelector('[data-overlay]');
    const menuToggle = document.getElementById('menuToggle');

    if (navbar && overlay && menuToggle) {
        navbar.classList.remove('active');
        overlay.classList.remove('active');
        menuToggle.classList.remove('active');
    }
}

// ========================================
// i18n Event Listeners
// ========================================

// Listen for language change events from the i18n system
window.addEventListener('languageChanged', function(event) {
    const newLanguage = event.detail.language;
    console.log(`Language switched to: ${newLanguage}`);

    // Update any dynamic content that might need refreshing
    // This could include updating ARIA labels, form validation messages, etc.
    updateDynamicContent(newLanguage);
});

/**
 * Update dynamic content when language changes
 */
function updateDynamicContent(language) {
    // Update favorite button labels
    const favButtons = document.querySelectorAll('.fav-btn');
    favButtons.forEach(button => {
        if (window.i18n) {
            const isActive = button.classList.contains('active');
            const labelKey = isActive ? 'cars.remove_from_favorites' : 'cars.add_to_favorites';
            const translatedLabel = window.i18n.t(labelKey);
            button.setAttribute('aria-label', translatedLabel);
        }
    });

    // Update page title if meta translation exists
    if (window.i18n) {
        const titleTranslation = window.i18n.t('meta.title');
        if (titleTranslation && titleTranslation !== 'meta.title') {
            document.title = titleTranslation;
        }
    }
}

// ========================================
// Keyboard Event Handlers
// ========================================

// Close auth modal on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeAuthModal();
        closeMobileMenu();
    }
});

// ========================================
// Authentication Integration
// ========================================

// Global authentication manager instance
let authManager;

/**
 * Handle sign-in form submission
 */
function handleSignInSubmit(event) {
    event.preventDefault();

    if (!authManager) {
        console.error('AuthManager not initialized');
        return false;
    }

    // Clear previous errors
    clearFormErrors('formSignIn');

    // Get form data
    const email = document.getElementById('signin-email')?.value.trim();
    const password = document.getElementById('signin-password')?.value;

    if (!email || !password) {
        displayFormErrors('formSignIn', ['Molimo unesite sve potrebne podatke.']);
        return false;
    }

    // Show loading state
    setFormLoading('formSignIn', true);

    // Attempt login
    authManager.loginUser(email, password)
        .then(result => {
            setFormLoading('formSignIn', false);

            if (result.success) {
                // Clear form
                document.getElementById('formSignIn').reset();

                // Show success message and close modal
                authManager.showNotification(result.message, 'success');
                closeAuthModal();
            } else {
                displayFormErrors('formSignIn', result.errors);
            }
        })
        .catch(error => {
            setFormLoading('formSignIn', false);
            displayFormErrors('formSignIn', ['Greška prilikom prijave. Molimo pokušajte ponovo.']);
            console.error('Login error:', error);
        });

    return false;
}

/**
 * Handle sign-up form submission
 */
function handleSignUpSubmit(event) {
    event.preventDefault();

    if (!authManager) {
        console.error('AuthManager not initialized');
        return false;
    }

    // Clear previous errors
    clearFormErrors('formSignUp');

    // Get form data
    const name = document.getElementById('signup-name')?.value.trim();
    const email = document.getElementById('signup-email')?.value.trim();
    const password = document.getElementById('signup-password')?.value;
    const confirmPassword = document.getElementById('signup-confirm')?.value;

    if (!name || !email || !password || !confirmPassword) {
        displayFormErrors('formSignUp', ['Molimo unesite sve potrebne podatke.']);
        return false;
    }

    const userData = {
        name: name,
        email: email,
        password: password,
        confirmPassword: confirmPassword
    };

    // Show loading state
    setFormLoading('formSignUp', true);

    // Attempt registration
    authManager.registerUser(userData)
        .then(result => {
            setFormLoading('formSignUp', false);

            if (result.success) {
                // Clear form
                document.getElementById('formSignUp').reset();

                // Show success message and close modal
                authManager.showNotification(result.message, 'success');
                closeAuthModal();
            } else {
                displayFormErrors('formSignUp', result.errors);
            }
        })
        .catch(error => {
            setFormLoading('formSignUp', false);
            displayFormErrors('formSignUp', ['Greška prilikom registracije. Molimo pokušajte ponovo.']);
            console.error('Registration error:', error);
        });

    return false;
}

/**
 * Display form validation errors
 */
function displayFormErrors(formId, errors) {
    clearFormErrors(formId);

    if (!errors || errors.length === 0) return;

    const form = document.getElementById(formId);
    if (!form) return;

    // Create error container if it doesn't exist
    let errorContainer = form.querySelector('.auth-errors');
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.className = 'auth-errors';
        form.insertBefore(errorContainer, form.firstChild);
    }

    // Display errors
    errorContainer.innerHTML = `
        <div class="auth-error-list">
            ${errors.map(error => `<div class="auth-error-item">
                <ion-icon name="alert-circle"></ion-icon>
                <span>${error}</span>
            </div>`).join('')}
        </div>
    `;

    errorContainer.style.display = 'block';
}

/**
 * Clear form validation errors
 */
function clearFormErrors(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    const errorContainer = form.querySelector('.auth-errors');
    if (errorContainer) {
        errorContainer.style.display = 'none';
        errorContainer.innerHTML = '';
    }
}

/**
 * Set form loading state
 */
function setFormLoading(formId, loading) {
    const form = document.getElementById(formId);
    if (!form) return;

    const submitButton = form.querySelector('button[type="submit"]');
    const inputs = form.querySelectorAll('input');

    if (loading) {
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.setAttribute('data-original-text', submitButton.textContent);
            submitButton.innerHTML = '<ion-icon name="hourglass"></ion-icon> Molimo sačekajte...';
        }
        inputs.forEach(input => input.disabled = true);
    } else {
        if (submitButton) {
            submitButton.disabled = false;
            const originalText = submitButton.getAttribute('data-original-text');
            if (originalText) {
                submitButton.textContent = originalText;
                submitButton.removeAttribute('data-original-text');
            }
        }
        inputs.forEach(input => input.disabled = false);
    }
}

// ========================================
// Enhanced Car Functions with Auth
// ========================================

/**
 * Enhanced toggle favorite with user authentication
 */
function toggleFavoriteAuthenticated(favId) {
    if (!authManager) {
        console.warn('AuthManager not initialized');
        return toggleFavorite(favId); // Fallback to original function
    }

    const button = document.getElementById(favId);
    if (!button) {
        console.warn(`Favorite button with ID '${favId}' not found`);
        return;
    }

    // Check if user is authenticated
    if (!authManager.isAuthenticated()) {
        authManager.showNotification('Molimo prijavite se da bi mogli dodavati favorite.', 'info');
        openAuthModal();
        return;
    }

    const currentUser = authManager.getCurrentUser();
    const carId = button.getAttribute('data-car-id') || favId;

    // Toggle favorite status
    const isCurrentlyFavorite = button.classList.contains('active');
    button.classList.toggle('active');

    const icon = button.querySelector('ion-icon');
    if (icon) {
        const iconName = button.classList.contains('active') ? 'heart' : 'heart-outline';
        icon.setAttribute('name', iconName);
    }

    // Update user favorites in storage
    const userFavorites = getUserFavorites(currentUser.id) || [];

    if (isCurrentlyFavorite) {
        // Remove from favorites
        const index = userFavorites.indexOf(carId);
        if (index > -1) {
            userFavorites.splice(index, 1);
        }
        authManager.showNotification('Uklonjeno iz favorita.', 'success');
    } else {
        // Add to favorites
        if (!userFavorites.includes(carId)) {
            userFavorites.push(carId);
        }
        authManager.showNotification('Dodano u favorite.', 'success');
    }

    // Save updated favorites
    saveUserFavorites(currentUser.id, userFavorites);

    // Update aria-label with translation if available
    if (window.i18n) {
        const labelKey = button.classList.contains('active') ? 'cars.remove_from_favorites' : 'cars.add_to_favorites';
        const translatedLabel = window.i18n.t(labelKey, button.getAttribute('aria-label'));
        button.setAttribute('aria-label', translatedLabel);
    }
}

/**
 * Enhanced rent car function with authentication check
 */
function rentCarAuthenticated(carName, year) {
    if (!authManager) {
        console.warn('AuthManager not initialized');
        return rentCar(carName, year); // Fallback to original function
    }

    // Check if user is authenticated
    if (!authManager.isAuthenticated()) {
        authManager.showNotification('Molimo prijavite se da bi mogli iznajmiti vozilo.', 'info');
        openAuthModal();
        return;
    }

    const currentUser = authManager.getCurrentUser();
    let message;

    if (window.i18n) {
        const template = window.i18n.t('cars.rent_inquiry', `Zahtjev za iznajmljivanje: ${carName} ${year}`);
        message = template
            .replace('%car%', carName)
            .replace('%year%', year)
            .replace('%user%', currentUser.name);
    } else {
        message = `Zahtjev za iznajmljivanje: ${carName} ${year} (Korisnik: ${currentUser.name})`;
    }

    // Show rental inquiry
    authManager.showNotification(`Vaš zahtjev za ${carName} ${year} je zabilježen!`, 'success');

    // Log for development
    console.log(`Rent car request: ${carName} ${year} by user: ${currentUser.name} (${currentUser.email})`);

    // In a real application, this would send the rental request to a backend
    // For now, we just show a confirmation message
}

/**
 * Get user favorites from storage
 */
function getUserFavorites(userId) {
    try {
        const allFavorites = JSON.parse(localStorage.getItem('pag_user_favorites') || '{}');
        return allFavorites[userId] || [];
    } catch (error) {
        console.error('Error reading user favorites:', error);
        return [];
    }
}

/**
 * Save user favorites to storage
 */
function saveUserFavorites(userId, favorites) {
    try {
        const allFavorites = JSON.parse(localStorage.getItem('pag_user_favorites') || '{}');
        allFavorites[userId] = favorites;
        localStorage.setItem('pag_user_favorites', JSON.stringify(allFavorites));
    } catch (error) {
        console.error('Error saving user favorites:', error);
    }
}

/**
 * Load user favorites on page load
 */
function loadUserFavorites() {
    if (!authManager || !authManager.isAuthenticated()) {
        return;
    }

    const currentUser = authManager.getCurrentUser();
    const userFavorites = getUserFavorites(currentUser.id);

    // Apply favorite states to UI
    userFavorites.forEach(carId => {
        const button = document.getElementById(carId) ||
                      document.querySelector(`[data-car-id="${carId}"]`);

        if (button) {
            button.classList.add('active');
            const icon = button.querySelector('ion-icon');
            if (icon) {
                icon.setAttribute('name', 'heart');
            }
        }
    });

    console.log(`Loaded ${userFavorites.length} favorites for user:`, currentUser.name);
}

// ========================================
// Initialization
// ========================================

// Initialize dynamic year in footer
document.addEventListener('DOMContentLoaded', function() {
    const yearElement = document.getElementById('year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    // Initialize back to top button
    initializeBackToTop();

    // Initialize authentication system
    initializeAuthentication();
});

/**
 * Initialize authentication system
 */
function initializeAuthentication() {
    // Wait for AuthManager class to be available
    if (typeof AuthManager === 'undefined') {
        console.error('AuthManager class not loaded. Make sure auth.js is included.');
        return;
    }

    // Create global auth manager instance
    authManager = new AuthManager();
    window.authManager = authManager; // Make it globally accessible

    // Set up form event listeners
    setupAuthFormListeners();

    // Load user favorites if authenticated
    setTimeout(() => {
        loadUserFavorites();
    }, 100);

    console.log('Authentication system initialized');
}

/**
 * Set up authentication form event listeners
 */
function setupAuthFormListeners() {
    // Sign-in form
    const signInForm = document.getElementById('formSignIn');
    if (signInForm) {
        signInForm.onsubmit = handleSignInSubmit;
    }

    // Sign-up form
    const signUpForm = document.getElementById('formSignUp');
    if (signUpForm) {
        signUpForm.onsubmit = handleSignUpSubmit;
    }

    // Add real-time validation
    setupRealtimeValidation();

    console.log('Auth form event listeners set up');
}

/**
 * Set up real-time form validation
 */
function setupRealtimeValidation() {
    // Email validation on blur
    const emailInputs = ['signin-email', 'signup-email'];
    emailInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('blur', validateEmailInput);
        }
    });

    // Password matching validation
    const confirmPasswordInput = document.getElementById('signup-confirm');
    const passwordInput = document.getElementById('signup-password');

    if (confirmPasswordInput && passwordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            validatePasswordMatch(passwordInput, confirmPasswordInput);
        });
    }
}

/**
 * Validate email input in real-time
 */
function validateEmailInput(event) {
    const input = event.target;
    const email = input.value.trim();

    if (email && !authManager.validateEmail(email)) {
        input.classList.add('auth-input--error');
        showInputError(input, 'Neispravna email adresa.');
    } else {
        input.classList.remove('auth-input--error');
        hideInputError(input);
    }
}

/**
 * Validate password matching
 */
function validatePasswordMatch(passwordInput, confirmPasswordInput) {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (confirmPassword && password !== confirmPassword) {
        confirmPasswordInput.classList.add('auth-input--error');
        showInputError(confirmPasswordInput, 'Šifre se ne poklapaju.');
    } else {
        confirmPasswordInput.classList.remove('auth-input--error');
        hideInputError(confirmPasswordInput);
    }
}

/**
 * Show input-specific error
 */
function showInputError(input, message) {
    hideInputError(input); // Remove existing error first

    const errorDiv = document.createElement('div');
    errorDiv.className = 'auth-input-error';
    errorDiv.innerHTML = `<small>${message}</small>`;

    input.parentElement.appendChild(errorDiv);
}

/**
 * Hide input-specific error
 */
function hideInputError(input) {
    const existingError = input.parentElement.querySelector('.auth-input-error');
    if (existingError) {
        existingError.remove();
    }
}

/**
 * Initialize back to top button functionality
 */
function initializeBackToTop() {
    const backToTopBtn = document.getElementById('back-to-top');

    if (backToTopBtn) {
        // Handle scroll visibility
        window.addEventListener('scroll', function() {
            if (window.scrollY > 300) {
                backToTopBtn.style.opacity = '1';
                backToTopBtn.style.pointerEvents = 'all';
            } else {
                backToTopBtn.style.opacity = '0';
                backToTopBtn.style.pointerEvents = 'none';
            }
        });

        // Handle click
        backToTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}