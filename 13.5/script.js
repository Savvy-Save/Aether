// Main UI logic for Password Vault Manager
// Depends on: utils.js, storage.js, vault.js

document.addEventListener('DOMContentLoaded', function () {
    // This event ensures all HTML elements are loaded before running JS

    // ==================== CACHE DOM ELEMENTS ====================
    // Navigation elements
    const mainNav = document.getElementById('main-nav'); // Main app navigation bar (Vault, Accounts, etc.)
    const authNav = document.getElementById('auth-nav'); // Authentication navigation bar (Sign Up, Log In, About Us)
    const allNavItems = document.querySelectorAll('.nav-item'); // All navigation items (both nav bars)
    const mainNavItems = mainNav.querySelectorAll('.nav-list li.nav-item'); // Only main app nav items

    // Sections (pages) of the app
    const signupSection = document.getElementById('signup-section'); // Sign Up form section
    const loginSection = document.getElementById('login-section'); // Log In form section
    const vaultSection = document.getElementById('vault-section'); // Vault management section
    const accountsSection = document.getElementById('accounts-section'); // Accounts list section
    const historySection = document.getElementById('history-section'); // History section
    const settingsSection = document.getElementById('settings-section'); // User settings section
    const allSections = document.querySelectorAll('.auth-section, .password-manager-section'); // All main content sections

    // Auth toggle links
    const signupLink = document.getElementById('signup-link'); // Link to switch to Sign Up form
    const loginLink = document.getElementById('login-link'); // Link to switch to Log In form
    const logoutButton = document.querySelector('.nav-item[data-section="logout"]'); // Log Out button

    // Forms
    const signupForm = document.getElementById('signup-form'); // Sign Up form element
    const loginForm = document.getElementById('login-form'); // Log In form element
    const addVaultForm = document.getElementById('add-vault-form'); // Add Vault form
    const editVaultForm = document.getElementById('edit-vault-form'); // Edit Vault form

    // Password strength indicator elements (Sign Up form)
    const signupPasswordInput = document.getElementById('signup-password'); // Password input in Sign Up form
    const passwordStrengthIndicator = document.getElementById('password-strength-indicator'); // Container for strength bar
    const strengthBar = document.getElementById('strength-bar'); // Visual strength bar
    const strengthText = document.getElementById('strength-text'); // Text description of strength

    // Password generation buttons (Add Vault and Edit Vault forms)
    const generatePasswordButtons = document.querySelectorAll('.generate-password-button');

    // Vault image removal buttons
    const removeVaultImageButton = document.getElementById('remove-vault-image'); // Add Vault form
    const removeEditVaultImageButton = document.getElementById('remove-edit-vault-image'); // Edit Vault form

    // Vault list container
    const vaultsContainer = document.getElementById('vaults-container');

    // PIN request overlay elements
    const pinRequestOverlay = document.getElementById('pin-request-overlay');
    const submitPinButton = document.getElementById('submit-pin-button');
    const cancelPinButton = document.getElementById('cancel-pin-button');

    // Edit vault overlay elements
    const editVaultOverlay = document.getElementById('edit-vault-overlay');
    const cancelEditButton = document.getElementById('cancel-edit-button');
    const editUsePinCheckbox = document.getElementById('edit-use-pin');
    const editPinField = document.getElementById('edit-pin-field');
    const editPinVerifySection = document.getElementById('edit-pin-verify-section');

    // Optional checkboxes (username, email, pin)
    const optionalCheckboxes = document.querySelectorAll('.optional-checkbox input[type="checkbox"]');

    // ==================== STATE ====================
    let currentSectionId = 'signup'; // Tracks which section is currently visible

    // ==================== NAVIGATION ====================
    // Show a specific section by ID, hide all others
    function showSection(sectionId) {
        allSections.forEach(section => {
            section.classList.add('hidden');
            section.style.display = 'none';
        });

        const sectionToShow = document.getElementById(sectionId + '-section');
        if (sectionToShow) {
            sectionToShow.classList.remove('hidden');
            sectionToShow.style.display = 'block';
            currentSectionId = sectionId;
            updateNavStyles();
        } else {
            console.error(`Section with ID ${sectionId}-section not found.`);
            showSection('signup'); // Fallback to signup
        }
    }

    // Update active nav item styling based on current section
    function updateNavStyles() {
        allNavItems.forEach(navItem => {
            navItem.classList.remove('active');
            if (navItem.dataset.section === currentSectionId) {
                navItem.classList.add('active');
            }
        });
    }

    // Handle clicks on all nav items (both nav bars)
    allNavItems.forEach(navItem => {
        navItem.addEventListener('click', function(event) {
            const sectionId = this.dataset.section;
            if (sectionId && sectionId !== 'logout') {
                event.preventDefault();
                showSection(sectionId);
            }
            // Logout handled separately
        });
    });

    // ==================== AUTH NAV TOGGLE LINKS ====================
    if (signupLink) {
        signupLink.addEventListener('click', function(event) {
            event.preventDefault();
            authNav.classList.remove('hidden');
            mainNav.classList.add('hidden');
            showSection('signup');
        });
    }

    if (loginLink) {
        loginLink.addEventListener('click', function(event) {
            event.preventDefault();
            authNav.classList.remove('hidden');
            mainNav.classList.add('hidden');
            showSection('login');
        });
    }

    // ==================== PASSWORD VISIBILITY TOGGLE ====================
    function togglePasswordVisibility(toggleElement) {
        const passwordContainer = toggleElement.closest('.password-container');
        if (!passwordContainer) return;
        const passwordInput = passwordContainer.querySelector('input[type="password"], input[type="text"]');
        if (!passwordInput) return;

        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        toggleElement.innerHTML = type === 'password' ? '👁️' : '👁️‍🗨️';
    }

    // Delegate password toggle clicks
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('password-toggle')) {
            togglePasswordVisibility(event.target);
        }
    });

    // ==================== PASSWORD STRENGTH METER ====================
    if (signupPasswordInput && passwordStrengthIndicator && strengthBar && strengthText) {
        signupPasswordInput.addEventListener('input', function() {
            let strength = 0;
            const password = signupPasswordInput.value;

            passwordStrengthIndicator.classList.toggle('hidden', password.length === 0);

            if (password.length >= 8) strength++;
            if (/[a-z]/.test(password)) strength++;
            if (/[A-Z]/.test(password)) strength++;
            if (/\d/.test(password)) strength++;
            if (/[^a-zA-Z0-9]/.test(password)) strength++;

            const percent = (strength / 5) * 100;
            strengthBar.style.width = `${percent}%`;

            let text = 'Strength: ';
            let color = 'red';

            if (percent < 25) { text += 'Very Weak'; color = 'red'; }
            else if (percent < 50) { text += 'Weak'; color = 'orange'; }
            else if (percent < 75) { text += 'Medium'; color = 'yellow'; }
            else if (percent < 90) { text += 'Strong'; color = 'lightgreen'; }
            else { text += 'Very Strong'; color = 'darkgreen'; }

            strengthText.textContent = text;
            strengthBar.style.backgroundColor = color;
        });
    }

    // ==================== PASSWORD GENERATION BUTTONS ====================
    generatePasswordButtons.forEach(button => {
        button.addEventListener('click', function() {
            const form = this.closest('form');
            if (!form) return;
            const passwordInput = form.querySelector('input[name$="password"]');
            if (passwordInput) {
                passwordInput.value = generatePassword();
                if (passwordInput.id === 'signup-password') {
                    passwordInput.dispatchEvent(new Event('input'));
                }
            }
        });
    });

    // ==================== IMAGE REMOVAL BUTTONS ====================
    if (removeVaultImageButton) {
        removeVaultImageButton.addEventListener('click', () => {
            const input = document.getElementById('vault-image');
            if (input) input.value = '';
        });
    }
    if (removeEditVaultImageButton) {
        removeEditVaultImageButton.addEventListener('click', () => {
            const input = document.getElementById('edit-vault-image');
            if (input) input.value = '';
        });
    }

    // ==================== OPTIONAL FIELD CHECKBOXES ====================
    optionalCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const fieldId = this.id.replace(/^(edit-)?use-/, '') + '-field';
            const field = document.getElementById(fieldId);
            if (field) {
                field.classList.toggle('hidden', !this.checked);
            }
            if (this.id === 'edit-use-pin' && editPinVerifySection) {
                if (!this.checked) {
                    editPinVerifySection.classList.add('hidden');
                }
            }
        });
    });

    // ==================== FORM SUBMISSIONS ====================
    if (addVaultForm) {
        addVaultForm.addEventListener('submit', handleAddVaultSubmit); // From vault.js
    }
    if (editVaultForm) {
        editVaultForm.addEventListener('submit', handleEditVaultSubmit); // From vault.js
    }
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            // Simulate login success
            authNav.classList.add('hidden');
            mainNav.classList.remove('hidden');
            showSection('vault');
            mainNavItems.forEach(item => {
                const section = item.dataset.section;
                if (section === 'accounts' || section === 'settings') {
                    item.classList.remove('hidden');
                    item.style.display = 'block';
                }
            });
            updateNavStyles();
        });
    }
    if (signupForm) {
        signupForm.addEventListener('submit', function(event) {
            event.preventDefault();
            // Simulate signup success
            authNav.classList.add('hidden');
            mainNav.classList.remove('hidden');
            showSection('vault');
            mainNavItems.forEach(item => {
                const section = item.dataset.section;
                if (section === 'accounts' || section === 'settings') {
                    item.classList.remove('hidden');
                    item.style.display = 'block';
                }
            });
            updateNavStyles();
            showNotification("Signup successful! Welcome.", "success");
            signupForm.reset();
            passwordStrengthIndicator.classList.add('hidden');
        });
    }

    // ==================== OVERLAY BUTTONS ====================
    if (submitPinButton) submitPinButton.addEventListener('click', handlePinSubmit); // From vault.js
    if (cancelPinButton) cancelPinButton.addEventListener('click', handlePinCancel); // From vault.js
    if (cancelEditButton) cancelEditButton.addEventListener('click', handleEditVaultCancel); // From vault.js

    // ==================== VAULT LIST EVENT DELEGATION ====================
    if (vaultsContainer) {
        vaultsContainer.addEventListener('click', handleVaultActions); // From vault.js
    }

    // ==================== LOG OUT BUTTON ====================
    if (logoutButton) {
        logoutButton.addEventListener('click', function(event) {
            event.preventDefault();
            if (confirm('Are you sure you want to log out?')) {
                authNav.classList.remove('hidden');
                mainNav.classList.add('hidden');
                showSection('login');
                mainNavItems.forEach(item => {
                    const section = item.dataset.section;
                    if (section === 'accounts' || section === 'settings') {
                        item.classList.add('hidden');
                        item.style.display = 'none';
                    }
                });
                showNotification("Logged out successfully.", "success");
            }
        });
    }

    // ==================== Developer Toggle ====================
    const devToggleContainer = document.querySelector('.dev-toggle-container[data-page="welcome"]');
    if (devToggleContainer) {
      const toggleButton = devToggleContainer.querySelector('.dev-toggle-button');
      const content = devToggleContainer.querySelector('.dev-content');

      toggleButton.addEventListener('click', () => {
        if (!devToggleContainer.classList.contains('open')) {
          // Opening: move button up first
          devToggleContainer.classList.add('open');
          setTimeout(() => {
            content.classList.remove('hidden');
            content.classList.add('show');
          }, 400); // wait for button to move up
        } else {
          // Closing: hide content first
          content.classList.remove('show');
          content.classList.add('hidden');
          devToggleContainer.classList.add('closing');
          setTimeout(() => {
            devToggleContainer.classList.remove('open');
            devToggleContainer.classList.remove('closing');
          }, 400); // wait for panel to close before moving button down
        }
      });
    }

    // ==================== INITIALIZE APP ====================
    function initializeApp() {
        const isLoggedIn = false; // Placeholder, replace with real auth check later

        if (isLoggedIn) {
            authNav.classList.add('hidden');
            mainNav.classList.remove('hidden');
            showSection('vault');
            mainNavItems.forEach(item => {
                const section = item.dataset.section;
                if (section === 'accounts' || section === 'settings') {
                    item.classList.remove('hidden');
                    item.style.display = 'block';
                }
            });
        } else {
            authNav.classList.remove('hidden');
            mainNav.classList.add('hidden');
            showSection('signup');
            mainNavItems.forEach(item => {
                const section = item.dataset.section;
                if (section === 'accounts' || section === 'settings') {
                    item.classList.add('hidden');
                    item.style.display = 'none';
                }
            });
        }
        displayVaults(); // From vault.js, show saved vaults
        updateNavStyles();
    }

    initializeApp(); // Start the app
});
