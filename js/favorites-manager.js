"use strict";

/**
 * FavoritesManager - Handles enhanced favorites functionality
 * Provides viewing, searching, sorting, and management of user favorites
 */
class FavoritesManager {
    constructor(authManager) {
        this.authManager = authManager;
        this.favorites = [];
        this.filteredFavorites = [];
        this.viewMode = 'grid';
        this.sortMode = 'date-desc';
        this.selectedFavorites = new Set();
        this.isInitialized = false;

        // Car data mapping (based on existing HTML structure)
        this.carData = this.initializeCarData();

        // Wait for DOM to be ready before initializing
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    /**
     * Initialize the favorites manager
     */
    init() {
        if (this.isInitialized) return;

        this.setupEventListeners();
        this.isInitialized = true;

        console.log('FavoritesManager initialized');
    }

    /**
     * Initialize car data mapping from the existing HTML
     */
    initializeCarData() {
        return {
            'car-bmw-x5': {
                name: 'Škoda Karoq',
                year: '2018',
                image: './images/car-1.jpg',
                price: '$440',
                people: '4',
                fuel: 'Gasoline',
                efficiency: '6.8km / 1-litre',
                transmission: 'Automatic'
            },
            'car-audi-a6': {
                name: 'Volkswagen Polo',
                year: '2019',
                image: './images/car-2.jpg',
                price: '$350',
                people: '5',
                fuel: 'Gasoline',
                efficiency: '5.2km / 1-litre',
                transmission: 'Automatic'
            },
            'car-mercedes-c220': {
                name: 'Volvo V60',
                year: '2019',
                image: './images/car-3.jpg',
                price: '$400',
                people: '5',
                fuel: 'Gasoline',
                efficiency: '6.5km / 1-litre',
                transmission: 'Automatic'
            },
            'car-volkswagen-passat': {
                name: 'Volkswagen Polo',
                year: '2016',
                image: './images/car-4.jpg',
                price: '$620',
                people: '5',
                fuel: 'Gasoline',
                efficiency: '5.5km / 1-litre',
                transmission: 'Manual'
            }
        };
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('favoritesSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchFavorites(e.target.value);
            });
        }

        // Sort select
        const sortSelect = document.getElementById('favoritesSort');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortFavorites(e.target.value);
            });
        }

        // Modal close listeners
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeFavoritesModal();
            }
        });
    }

    /**
     * Open the favorites modal and load user favorites
     */
    openFavoritesModal() {
        if (!this.authManager || !this.authManager.isAuthenticated()) {
            this.authManager.showNotification('Please log in to view your favorites.', 'warning');
            return;
        }

        const modal = document.getElementById('favoritesModalOverlay');
        if (!modal) {
            console.error('Favorites modal not found');
            return;
        }

        // Load user favorites
        this.loadUserFavorites();

        // Show modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Focus search input
        setTimeout(() => {
            const searchInput = document.getElementById('favoritesSearch');
            if (searchInput) searchInput.focus();
        }, 100);
    }

    /**
     * Close the favorites modal
     */
    closeFavoritesModal() {
        const modal = document.getElementById('favoritesModalOverlay');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';

            // Clear selections
            this.selectedFavorites.clear();
            this.updateBulkActions();
        }
    }

    /**
     * Load user's favorites from storage and enhance with car details
     */
    loadUserFavorites() {
        const currentUser = this.authManager.getCurrentUser();
        if (!currentUser) return;

        // Get raw favorites from storage
        const userFavorites = this.getUserFavorites(currentUser.id) || [];

        // Enhance with car details and metadata
        this.favorites = userFavorites.map(carId => {
            const carDetails = this.carData[carId];
            if (!carDetails) {
                console.warn(`Car data not found for ID: ${carId}`);
                return null;
            }

            return {
                id: carId,
                ...carDetails,
                addedAt: Date.now(), // For now, use current time
                selected: false
            };
        }).filter(Boolean); // Remove null entries

        // Apply current sorting and filtering
        this.filteredFavorites = [...this.favorites];
        this.applySorting();
        this.renderFavorites();
        this.updateFavoritesCount();
    }

    /**
     * Get user favorites from localStorage (using existing function pattern)
     */
    getUserFavorites(userId) {
        try {
            const allFavorites = JSON.parse(localStorage.getItem('pag_user_favorites') || '{}');
            return allFavorites[userId] || [];
        } catch (error) {
            console.error('Error reading user favorites:', error);
            return [];
        }
    }

    /**
     * Render favorites in the current view mode
     */
    renderFavorites() {
        const container = document.getElementById('favoritesGrid');
        const emptyState = document.getElementById('emptyFavorites');

        if (!container) return;

        // Show empty state if no favorites
        if (this.filteredFavorites.length === 0) {
            container.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        // Hide empty state and show grid
        container.style.display = 'grid';
        if (emptyState) emptyState.style.display = 'none';

        // Apply view mode class
        container.className = `favorites-grid ${this.viewMode === 'list' ? 'list-view' : ''}`;

        // Generate HTML for favorites
        container.innerHTML = this.filteredFavorites.map(favorite =>
            this.generateFavoriteCardHTML(favorite)
        ).join('');

        // Set up card event listeners
        this.setupCardEventListeners();
    }

    /**
     * Generate HTML for a favorite car card
     */
    generateFavoriteCardHTML(favorite) {
        const isListView = this.viewMode === 'list';
        const addedDate = new Date(favorite.addedAt).toLocaleDateString();

        return `
            <div class="favorite-card ${isListView ? 'list-view' : ''}" data-car-id="${favorite.id}">
                <input type="checkbox" class="favorite-checkbox" data-car-id="${favorite.id}" style="display: none;">
                <img src="${favorite.image}" alt="${favorite.name} ${favorite.year}" class="favorite-card-image" loading="lazy">

                <div class="favorite-card-content">
                    <div class="favorite-card-header">
                        <h3 class="favorite-card-title">${favorite.name}</h3>
                        <span class="favorite-added-date">Added ${addedDate}</span>
                    </div>

                    <div class="favorite-card-year">${favorite.year}</div>

                    <div class="favorite-card-details">
                        <span><ion-icon name="people-outline"></ion-icon> ${favorite.people} People</span>
                        <span><ion-icon name="flash-outline"></ion-icon> ${favorite.fuel}</span>
                        <span><ion-icon name="speedometer-outline"></ion-icon> ${favorite.efficiency}</span>
                        <span><ion-icon name="hardware-chip-outline"></ion-icon> ${favorite.transmission}</span>
                    </div>

                    <div class="favorite-card-price">${favorite.price}/month</div>

                    <div class="favorite-card-actions">
                        <button class="btn btn-secondary favorite-select-btn" onclick="favoritesManager.toggleFavoriteSelection('${favorite.id}')">
                            <ion-icon name="checkmark-outline"></ion-icon>
                        </button>
                        <button class="btn btn-primary favorite-rent-btn" onclick="rentCar('${favorite.name}', '${favorite.year}')">
                            <ion-icon name="car-outline"></ion-icon> Rent Now
                        </button>
                        <button class="btn btn-danger favorite-remove-btn" onclick="favoritesManager.removeFavorite('${favorite.id}')">
                            <ion-icon name="heart-dislike-outline"></ion-icon>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Set up event listeners for favorite cards
     */
    setupCardEventListeners() {
        // Selection buttons
        const selectButtons = document.querySelectorAll('.favorite-select-btn');
        selectButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Handler is already in onclick
            });
        });
    }

    /**
     * Toggle selection of a favorite item
     */
    toggleFavoriteSelection(carId) {
        if (this.selectedFavorites.has(carId)) {
            this.selectedFavorites.delete(carId);
        } else {
            this.selectedFavorites.add(carId);
        }

        this.updateSelectionUI(carId);
        this.updateBulkActions();
    }

    /**
     * Update the UI for a selected/deselected favorite
     */
    updateSelectionUI(carId) {
        const card = document.querySelector(`[data-car-id="${carId}"]`);
        const checkbox = card?.querySelector('.favorite-checkbox');
        const selectBtn = card?.querySelector('.favorite-select-btn');

        if (this.selectedFavorites.has(carId)) {
            card?.classList.add('selected');
            if (checkbox) checkbox.checked = true;
            if (selectBtn) {
                selectBtn.innerHTML = '<ion-icon name="checkmark-circle"></ion-icon>';
                selectBtn.classList.remove('btn-secondary');
                selectBtn.classList.add('btn-success');
            }
        } else {
            card?.classList.remove('selected');
            if (checkbox) checkbox.checked = false;
            if (selectBtn) {
                selectBtn.innerHTML = '<ion-icon name="checkmark-outline"></ion-icon>';
                selectBtn.classList.remove('btn-success');
                selectBtn.classList.add('btn-secondary');
            }
        }
    }

    /**
     * Update bulk actions visibility and state
     */
    updateBulkActions() {
        const bulkActions = document.getElementById('bulkActions');
        if (!bulkActions) return;

        if (this.selectedFavorites.size > 0) {
            bulkActions.style.display = 'flex';
        } else {
            bulkActions.style.display = 'none';
        }
    }

    /**
     * Search favorites by name or year
     */
    searchFavorites(query) {
        const searchTerm = query.toLowerCase().trim();

        if (!searchTerm) {
            this.filteredFavorites = [...this.favorites];
        } else {
            this.filteredFavorites = this.favorites.filter(favorite =>
                favorite.name.toLowerCase().includes(searchTerm) ||
                favorite.year.includes(searchTerm) ||
                favorite.fuel.toLowerCase().includes(searchTerm) ||
                favorite.transmission.toLowerCase().includes(searchTerm)
            );
        }

        this.applySorting();
        this.renderFavorites();
        this.updateFavoritesCount();
    }

    /**
     * Sort favorites by specified criteria
     */
    sortFavorites(sortBy) {
        this.sortMode = sortBy;
        this.applySorting();
        this.renderFavorites();
    }

    /**
     * Apply current sorting to filtered favorites
     */
    applySorting() {
        this.filteredFavorites.sort((a, b) => {
            switch (this.sortMode) {
                case 'date-desc':
                    return b.addedAt - a.addedAt;
                case 'date-asc':
                    return a.addedAt - b.addedAt;
                case 'name-asc':
                    return a.name.localeCompare(b.name);
                case 'name-desc':
                    return b.name.localeCompare(a.name);
                case 'price-asc':
                    return this.extractPrice(a.price) - this.extractPrice(b.price);
                case 'price-desc':
                    return this.extractPrice(b.price) - this.extractPrice(a.price);
                default:
                    return 0;
            }
        });
    }

    /**
     * Extract numeric value from price string
     */
    extractPrice(priceStr) {
        const match = priceStr.match(/\$(\d+)/);
        return match ? parseInt(match[1]) : 0;
    }

    /**
     * Set favorites view mode (grid or list)
     */
    setFavoritesView(viewMode) {
        this.viewMode = viewMode;

        // Update view buttons
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-view') === viewMode) {
                btn.classList.add('active');
            }
        });

        // Re-render with new view mode
        this.renderFavorites();
    }

    /**
     * Remove a single favorite
     */
    removeFavorite(carId) {
        if (!confirm('Are you sure you want to remove this car from your favorites?')) {
            return;
        }

        const currentUser = this.authManager.getCurrentUser();
        if (!currentUser) return;

        // Remove from storage
        const userFavorites = this.getUserFavorites(currentUser.id) || [];
        const updatedFavorites = userFavorites.filter(id => id !== carId);
        this.saveUserFavorites(currentUser.id, updatedFavorites);

        // Update UI
        this.updateFavoriteButtonUI(carId, false);

        // Reload favorites display
        this.loadUserFavorites();

        // Update favorites count in dropdown
        this.updateFavoritesCountInDropdown();

        this.authManager.showNotification('Removed from favorites.', 'success');
    }

    /**
     * Select all visible favorites
     */
    selectAllFavorites() {
        this.filteredFavorites.forEach(favorite => {
            this.selectedFavorites.add(favorite.id);
            this.updateSelectionUI(favorite.id);
        });
        this.updateBulkActions();
    }

    /**
     * Remove selected favorites
     */
    removeSelectedFavorites() {
        if (this.selectedFavorites.size === 0) return;

        const count = this.selectedFavorites.size;
        if (!confirm(`Are you sure you want to remove ${count} car(s) from your favorites?`)) {
            return;
        }

        const currentUser = this.authManager.getCurrentUser();
        if (!currentUser) return;

        // Remove from storage
        const userFavorites = this.getUserFavorites(currentUser.id) || [];
        const updatedFavorites = userFavorites.filter(id => !this.selectedFavorites.has(id));
        this.saveUserFavorites(currentUser.id, updatedFavorites);

        // Update UI for each removed favorite
        this.selectedFavorites.forEach(carId => {
            this.updateFavoriteButtonUI(carId, false);
        });

        // Clear selections
        this.selectedFavorites.clear();

        // Reload favorites display
        this.loadUserFavorites();

        // Update favorites count in dropdown
        this.updateFavoritesCountInDropdown();

        this.authManager.showNotification(`Removed ${count} car(s) from favorites.`, 'success');
    }

    /**
     * Save user favorites to localStorage
     */
    saveUserFavorites(userId, favorites) {
        try {
            const allFavorites = JSON.parse(localStorage.getItem('pag_user_favorites') || '{}');
            allFavorites[userId] = favorites;
            localStorage.setItem('pag_user_favorites', JSON.stringify(allFavorites));
        } catch (error) {
            console.error('Error saving user favorites:', error);
        }
    }

    /**
     * Update favorite button UI in the main car listing
     */
    updateFavoriteButtonUI(carId, isFavorite) {
        // Find button by ID or data-car-id
        let button = document.getElementById(carId) ||
                     document.querySelector(`[data-car-id="${carId}"]`);

        if (button) {
            const icon = button.querySelector('ion-icon');
            if (isFavorite) {
                button.classList.add('active');
                if (icon) icon.setAttribute('name', 'heart');
            } else {
                button.classList.remove('active');
                if (icon) icon.setAttribute('name', 'heart-outline');
            }
        }
    }

    /**
     * Update favorites count display
     */
    updateFavoritesCount() {
        const countElement = document.getElementById('favoritesCountStats');
        if (countElement) {
            countElement.textContent = this.filteredFavorites.length;
        }
    }

    /**
     * Update favorites count in dropdown
     */
    updateFavoritesCountInDropdown() {
        const currentUser = this.authManager.getCurrentUser();
        if (!currentUser) return;

        const userFavorites = this.getUserFavorites(currentUser.id) || [];
        const countElement = document.getElementById('favoritesCount');

        if (countElement) {
            countElement.textContent = userFavorites.length;
            countElement.style.display = userFavorites.length > 0 ? 'inline' : 'none';
        }
    }

    /**
     * Handle favorites overlay click (to close modal)
     */
    handleFavoritesOverlayClick(event) {
        if (event.target === document.getElementById('favoritesModalOverlay')) {
            this.closeFavoritesModal();
        }
    }
}

// Global functions for HTML onclick handlers
window.openFavoritesModal = function() {
    if (window.authManager && window.authManager.favoritesManager) {
        window.authManager.favoritesManager.openFavoritesModal();
    }
};

window.closeFavoritesModal = function() {
    if (window.authManager && window.authManager.favoritesManager) {
        window.authManager.favoritesManager.closeFavoritesModal();
    }
};

window.setFavoritesView = function(viewMode) {
    if (window.authManager && window.authManager.favoritesManager) {
        window.authManager.favoritesManager.setFavoritesView(viewMode);
    }
};

window.selectAllFavorites = function() {
    if (window.authManager && window.authManager.favoritesManager) {
        window.authManager.favoritesManager.selectAllFavorites();
    }
};

window.removeSelectedFavorites = function() {
    if (window.authManager && window.authManager.favoritesManager) {
        window.authManager.favoritesManager.removeSelectedFavorites();
    }
};

window.handleFavoritesOverlayClick = function(event) {
    if (window.authManager && window.authManager.favoritesManager) {
        window.authManager.favoritesManager.handleFavoritesOverlayClick(event);
    }
};

// Make favoritesManager globally accessible for card actions
window.favoritesManager = null;