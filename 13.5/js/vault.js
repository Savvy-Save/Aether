// Vault management module
// Depends on: utils.js (showNotification), storage.js (loadVaults, saveVault, updateAllVaults)

// ==================== STATE VARIABLES ====================
let vaultIndexToEdit = null; // Index of vault currently being edited
let currentVaultIndexForPin = null; // Index of vault currently requesting PIN
let pinRequestCallback = null; // Callback to run after successful PIN entry
let pinActionType = null; // Action type for PIN request ('revealPassword', 'editVault', 'deleteVault')

// ==================== PIN MANAGEMENT ====================

/**
 * Check if a vault at a given index has a PIN set.
 */
function vaultHasPin(vaultIndex) {
    const vaults = loadVaults();
    const vault = vaults[vaultIndex];
    return !!vault && vault.pin !== null && vault.pin !== "";
}

/**
 * Validate entered PIN against stored PIN for a vault.
 */
function validatePin(enteredPin, vaultIndex) {
    const vaults = loadVaults();
    const vault = vaults[vaultIndex];
    return !!vault && vault.pin === enteredPin;
}

/**
 * Show PIN overlay and set callback for after successful PIN entry.
 */
function requestPinForAction(index, actionType, callback) {
    const vaults = loadVaults();
    if (!vaults[index]) {
        console.error("Vault not found for PIN request");
        showNotification("Vault not found.", "error");
        return;
    }

    // If revealing password and no PIN, skip PIN entry
    if (actionType === 'revealPassword' && !vaultHasPin(index)) {
        if (callback) callback();
        return;
    }

    currentVaultIndexForPin = index;
    pinActionType = actionType;
    pinRequestCallback = callback;

    const overlay = document.getElementById('pin-request-overlay');
    const input = document.getElementById('pin-input');

    if (overlay && input) {
        input.value = '';
        overlay.classList.remove('hidden');
        overlay.style.display = 'flex';
        input.focus();
    } else {
        console.error("PIN overlay/input not found");
        showNotification("UI Error: Cannot request PIN.", "error");
    }
}

/**
 * Handle PIN submit button click.
 */
function handlePinSubmit() {
    const input = document.getElementById('pin-input');
    const overlay = document.getElementById('pin-request-overlay');
    const enteredPin = input.value;

    if (validatePin(enteredPin, currentVaultIndexForPin)) {
        overlay.classList.add('hidden');
        overlay.style.display = 'none';
        if (pinRequestCallback) pinRequestCallback();
    } else {
        showNotification('Incorrect PIN. Please try again.', 'error');
        input.focus();
    }

    input.value = '';
    currentVaultIndexForPin = null;
    pinRequestCallback = null;
    pinActionType = null;
}

/**
 * Handle PIN cancel button click.
 */
function handlePinCancel() {
    const overlay = document.getElementById('pin-request-overlay');
    const input = document.getElementById('pin-input');
    overlay.classList.add('hidden');
    overlay.style.display = 'none';
    input.value = '';
    currentVaultIndexForPin = null;
    pinRequestCallback = null;
    pinActionType = null;
}

// ==================== VAULT CRUD ====================

/**
 * Delete a vault by index, with confirmation.
 */
function deleteVault(index) {
    if (confirm("Are you sure you want to delete this vault? This action cannot be undone.")) {
        let vaults = loadVaults();
        if (index >= 0 && index < vaults.length) {
            vaults.splice(index, 1);
            if (updateAllVaults(vaults)) {
                showNotification('Vault deleted successfully.', 'success');
                displayVaults();
            }
        } else {
            console.error("Invalid vault index for deletion");
            showNotification("Error: Could not delete vault.", "error");
        }
    }
}

/**
 * Open edit overlay and populate with vault data.
 */
function openEditVaultOverlay(index) {
    vaultIndexToEdit = index;
    const vaults = loadVaults();
    const vault = vaults[index];

    const overlay = document.getElementById('edit-vault-overlay');
    const verifySection = document.getElementById('edit-pin-verify-section');
    const usePinCheckbox = document.getElementById('edit-use-pin');
    const pinField = document.getElementById('edit-pin-field');

    if (!vault || !overlay || !verifySection || !usePinCheckbox || !pinField) {
        console.error("Could not open edit overlay");
        showNotification("Error: Could not open edit form.", "error");
        return;
    }

    // Fill form fields
    document.getElementById('edit-vault-title').value = vault.title || '';
    document.getElementById('edit-vault-username').value = vault.username || '';
    document.getElementById('edit-vault-email').value = vault.email || '';
    document.getElementById('edit-vault-password').value = vault.password || '';
    document.getElementById('edit-vault-pin').value = '';
    usePinCheckbox.checked = vaultHasPin(index);
    document.getElementById('edit-vault-image').value = '';
    document.getElementById('edit-verify-pin').value = '';

    // Show/hide PIN fields
    pinField.classList.toggle('hidden', !usePinCheckbox.checked);
    verifySection.classList.toggle('hidden', !usePinCheckbox.checked);

    // Toggle PIN fields on checkbox change
    usePinCheckbox.addEventListener('change', () => {
        pinField.classList.toggle('hidden', !usePinCheckbox.checked);
        verifySection.classList.toggle('hidden', !usePinCheckbox.checked);
    });

    overlay.classList.remove('hidden');
    overlay.style.display = 'flex';
}

/**
 * Handle edit vault form submit.
 */
function handleEditVaultSubmit(event) {
    event.preventDefault();

    const vaults = loadVaults();
    if (vaultIndexToEdit === null || !vaults[vaultIndexToEdit]) {
        console.error("Invalid vault index for edit");
        showNotification("Error: Could not save changes.", "error");
        return;
    }

    const vault = vaults[vaultIndexToEdit];

    const verifySection = document.getElementById('edit-pin-verify-section');
    const verifyPinInput = document.getElementById('edit-verify-pin');
    const usePinCheckbox = document.getElementById('edit-use-pin');
    const newPinInput = document.getElementById('edit-vault-pin');
    const imageInput = document.getElementById('edit-vault-image');
    const overlay = document.getElementById('edit-vault-overlay');
    const form = document.getElementById('edit-vault-form');

    let pinVerified = true;

    if (vault.pin && !verifySection.classList.contains('hidden')) {
        if (verifyPinInput.value !== vault.pin) {
            showNotification('Incorrect current PIN. Changes not saved.', 'error');
            pinVerified = false;
        }
    }

    if (!pinVerified) {
        verifyPinInput.focus();
        return;
    }

    const newTitle = document.getElementById('edit-vault-title').value;
    const newUsername = document.getElementById('edit-vault-username').value;
    const newEmail = document.getElementById('edit-vault-email').value;
    const newPassword = document.getElementById('edit-vault-password').value;
    const newPin = usePinCheckbox.checked ? newPinInput.value : null;
    const file = imageInput.files[0];

    const processSave = (imageData) => {
        vaults[vaultIndexToEdit] = {
            ...vault,
            title: newTitle,
            username: newUsername || null,
            email: newEmail || null,
            password: newPassword,
            pin: newPin,
            imageData: imageData
        };

        if (updateAllVaults(vaults)) {
            displayVaults();
            overlay.classList.add('hidden');
            overlay.style.display = 'none';
            form.reset();
            verifySection.classList.add('hidden');
            vaultIndexToEdit = null;
            showNotification("Vault changes saved successfully!", "success");
        }
    };

    if (file) {
        if (file.type.startsWith('image/') && file.size <= 20 * 1024 * 1024) {
            const reader = new FileReader();
            reader.onload = e => processSave(e.target.result);
            reader.onerror = e => {
                console.error("File read error", e);
                showNotification("Error reading image file.", "error");
            };
            reader.readAsDataURL(file);
        } else {
            showNotification('Invalid image file.', 'error');
        }
    } else {
        processSave(vault.imageData);
    }
}

/**
 * Cancel edit vault overlay.
 */
function handleEditVaultCancel() {
    const overlay = document.getElementById('edit-vault-overlay');
    const form = document.getElementById('edit-vault-form');
    const verifySection = document.getElementById('edit-pin-verify-section');

    overlay.classList.add('hidden');
    overlay.style.display = 'none';
    form.reset();
    verifySection.classList.add('hidden');
    vaultIndexToEdit = null;
}

/**
 * Reset optional fields in Add Vault form.
 */
function resetOptionalFields() {
    document.getElementById('use-username').checked = false;
    document.getElementById('use-email').checked = false;
    document.getElementById('use-pin').checked = false;

    const usernameField = document.getElementById('username-field');
    const emailField = document.getElementById('email-field');
    const pinField = document.getElementById('pin-field');

    usernameField.classList.add('hidden');
    usernameField.querySelector('input').value = '';

    emailField.classList.add('hidden');
    emailField.querySelector('input').value = '';

    pinField.classList.add('hidden');
    pinField.querySelector('input').value = '';
}

/**
 * Handle Add Vault form submit.
 */
function handleAddVaultSubmit(event) {
    event.preventDefault();

    const title = document.getElementById('vault-title').value;
    const username = document.getElementById('vault-username').value;
    const email = document.getElementById('vault-email').value;
    const password = document.getElementById('vault-password').value;
    const pin = document.getElementById('vault-pin').value;
    const imageInput = document.getElementById('vault-image');
    const useUsername = document.getElementById('use-username').checked;
    const useEmail = document.getElementById('use-email').checked;
    const usePinCheckbox = document.getElementById('use-pin').checked;

    const file = imageInput.files[0];

    const processSave = (imageData) => {
        const newVault = {
            title: title,
            username: useUsername ? username : null,
            email: useEmail ? email : null,
            password: password,
            pin: usePinCheckbox ? pin : null,
            imageData: imageData
        };

        if (saveVault(newVault)) {
            displayVaults();
            document.getElementById('add-vault-form').reset();
            resetOptionalFields();
            showNotification("Vault created successfully!", "success");
        }
    };

    if (file) {
        if (file.type.startsWith('image/') && file.size <= 20 * 1024 * 1024) {
            const reader = new FileReader();
            reader.onload = e => processSave(e.target.result);
            reader.onerror = e => {
                console.error("File read error", e);
                showNotification("Error reading image file.", "error");
            };
            reader.readAsDataURL(file);
        } else {
            showNotification('Invalid image file.', 'error');
        }
    } else {
        processSave(null);
    }
}

/**
 * Display all vaults in the UI.
 */
function displayVaults() {
    const vaults = loadVaults();
    const container = document.getElementById('vaults-container');
    if (!container) return;

    container.innerHTML = '';

    if (vaults.length === 0) {
        container.innerHTML = '<p>No vaults added yet.</p>';
        return;
    }

    vaults.forEach((vault, index) => {
        const item = document.createElement('div');
        item.classList.add('vault-item');
        item.dataset.index = index;

        const header = document.createElement('div');
        header.classList.add('vault-header');

        const iconContainer = document.createElement('div');
        iconContainer.classList.add('vault-item-icon');
        if (vault.imageData) {
            const img = document.createElement('img');
            img.src = vault.imageData;
            img.alt = `${vault.title || 'Vault'} Icon`;
            img.loading = 'lazy';
            iconContainer.appendChild(img);
        } else {
            iconContainer.textContent = '🔒';
        }
        header.appendChild(iconContainer);

        const titleEl = document.createElement('h3');
        titleEl.textContent = vault.title || 'Untitled Vault';
        header.appendChild(titleEl);

        item.appendChild(header);

        const details = document.createElement('div');
        details.classList.add('vault-details');
        details.innerHTML = `
            <p><strong>Username:</strong> ${vault.username || 'N/A'}</p>
            <p><strong>Email:</strong> ${vault.email || 'N/A'}</p>
            <p class="password-display">
                <strong>Password:</strong>
                <span class="password-dots">••••••••</span>
                <span class="password-text hidden">${vault.password || ''}</span>
                <button class="action-button show-password-button">Show</button>
            </p>
            <div class="vault-actions">
                <button class="action-button edit-button">Edit</button>
                <button class="action-button delete-button">Delete</button>
            </div>
        `;
        item.appendChild(details);

        container.appendChild(item);
    });
}

/**
 * Handle clicks inside vault list (show/hide password, edit, delete).
 */
function handleVaultActions(event) {
    const target = event.target;
    const vaultItem = target.closest('.vault-item');
    if (!vaultItem) return;

    const index = parseInt(vaultItem.dataset.index, 10);
    if (isNaN(index)) return;

    if (target.classList.contains('show-password-button')) {
        const dots = vaultItem.querySelector('.password-dots');
        const text = vaultItem.querySelector('.password-text');
        const button = target;

        const reveal = () => {
            dots.classList.add('hidden');
            text.classList.remove('hidden');
            button.textContent = 'Hide';
        };

        if (button.textContent === 'Show') {
            if (vaultHasPin(index)) {
                requestPinForAction(index, 'revealPassword', reveal);
            } else {
                reveal();
            }
        } else {
            dots.classList.remove('hidden');
            text.classList.add('hidden');
            button.textContent = 'Show';
        }
    } else if (target.classList.contains('edit-button')) {
        const edit = () => openEditVaultOverlay(index);
        if (vaultHasPin(index)) {
            requestPinForAction(index, 'editVault', edit);
        } else {
            edit();
        }
    } else if (target.classList.contains('delete-button')) {
        const del = () => deleteVault(index);
        if (vaultHasPin(index)) {
            requestPinForAction(index, 'deleteVault', del);
        } else {
            if (confirm("Are you sure you want to delete this vault? This action cannot be undone.")) {
                del();
            }
        }
    }
}
