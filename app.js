const SCHEMA_URL = './schema.json';

const ALL_PLATFORMS = [
    'facebook', 'yandex', 'game_distribution', 'telegram', 'y8', 'lagged',
    'huawei', 'msn', 'discord', 'gamepush', 'jio_games', 'crazy_games',
    'youtube', 'vk', 'ok', 'absolute_games', 'playgama', 'playdeck',
    'poki', 'mock', 'qa_tool', 'bitquest', 'portal', 'reddit'
];

let schema = null;
let config = {};
let defaultConfig = {};

document.addEventListener('DOMContentLoaded', async function() {
    await initializeEditor();
});

async function initializeEditor() {
    try {
        await loadSchema();
        defaultConfig = buildDefaultConfig(schema);
        config = JSON.parse(JSON.stringify(defaultConfig));
        renderEditor();
        updateJsonOutput();
    } catch (error) {
        console.error('Failed to initialize editor:', error);
        alert('Failed to load schema. Please check your internet connection and refresh the page.');
    }
}

async function loadSchema() {
    try {
        const response = await fetch(SCHEMA_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch schema: ${response.status}`);
        }
        schema = await response.json();
    } catch (error) {
        console.error('Error loading schema:', error);
        throw error;
    }
}

function buildDefaultConfig(schema) {
    const config = {};

    if (!schema || !schema.properties) {
        return config;
    }

    for (const [key, value] of Object.entries(schema.properties)) {
        if (key === 'platforms') {
            config[key] = {};
        } else {
            config[key] = buildDefaultValue(value, schema);
        }
    }

    return config;
}

function buildDefaultValue(propertySchema, rootSchema) {
    if (propertySchema.$ref) {
        const refPath = propertySchema.$ref.replace('#/', '').split('/');
        let refSchema = rootSchema;
        for (const path of refPath) {
            refSchema = refSchema[path];
        }
        return buildDefaultValue(refSchema, rootSchema);
    }

    if (propertySchema.type === 'object') {
        const obj = {};
        if (propertySchema.properties) {
            for (const [key, value] of Object.entries(propertySchema.properties)) {
                if (value.default !== undefined) {
                    obj[key] = value.default;
                } else if (propertySchema.required && propertySchema.required.includes(key)) {
                    obj[key] = buildDefaultValue(value, rootSchema);
                }
            }
        }
        return obj;
    }

    if (propertySchema.type === 'array') {
        return [];
    }

    if (propertySchema.default !== undefined) {
        return propertySchema.default;
    }

    if (propertySchema.type === 'string') {
        return '';
    }

    if (propertySchema.type === 'number') {
        return 0;
    }

    if (propertySchema.type === 'boolean') {
        return false;
    }

    return null;
}

function download() {
    const filteredConfig = getFilteredConfig();
    const jsonString = JSON.stringify(filteredConfig, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'playgama-bridge-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function reset() {
    if (confirm('Are you sure you want to reset the configuration?')) {
        config = JSON.parse(JSON.stringify(defaultConfig));
        renderEditor();
        updateJsonOutput();
    }
}

function renderEditor() {
    if (!schema || !schema.properties) {
        return;
    }

    renderGeneral();
    renderPlatforms();
    renderAdvertisement();
    renderPayments();
    renderLeaderboards();
}

function renderGeneral() {
    const container = document.getElementById('generalContainer');
    if (!container) return;

    container.innerHTML = '';

    const generalFields = ['forciblySetPlatformId', 'sendAnalyticsEvents', 'disableLoadingLogo', 'showFullLoadingLogo'];

    let html = '';
    for (const fieldName of generalFields) {
        const fieldSchema = schema.properties[fieldName];
        if (!fieldSchema) continue;

        const fieldValue = config[fieldName] ?? buildDefaultValue(fieldSchema, schema);

        if (fieldName === 'forciblySetPlatformId') {
            html += renderPlatformSelect(fieldName, fieldSchema, fieldValue);
        } else {
            html += renderField(fieldName, fieldName, fieldSchema, fieldValue, false);
        }
    }

    container.innerHTML = html;
}

function renderPlatformSelect(fieldName, fieldSchema, fieldValue) {
    const label = formatLabel(fieldName);

    let options = '<option value="">-</option>';
    for (const platform of ALL_PLATFORMS) {
        const selected = fieldValue === platform ? 'selected' : '';
        options += `<option value="${platform}" ${selected}>${formatLabel(platform)}</option>`;
    }

    return `
        <div class="field-group">
            <label for="${fieldName}" class="field-label">${label}</label>
            <select id="${fieldName}"
                    class="field-input"
                    onchange="updateField('${fieldName}', this.value)">
                ${options}
            </select>
        </div>
    `;
}

function renderPlatforms() {
    const container = document.getElementById('platformsContainer');
    if (!container) return;

    container.innerHTML = '';

    const platformsSchema = schema.properties.platforms;
    if (!platformsSchema || !platformsSchema.properties) {
        return;
    }

    if (!config.platforms) {
        config.platforms = {};
    }

    const addedPlatforms = Object.keys(config.platforms);

    if (addedPlatforms.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📱</div>
                <p>No platforms added yet</p>
                <p style="font-size: 14px; margin-top: 5px;">Click 'Add Platform' to get started</p>
            </div>
        `;
        return;
    }

    for (const platformName of addedPlatforms) {
        const platformSchema = platformsSchema.properties[platformName];
        if (!platformSchema) continue;

        const platformDiv = document.createElement('div');
        platformDiv.className = 'platform-item';

        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div class="platform-name">${formatLabel(platformName)}</div>
                <button class="btn btn-danger" style="padding: 4px 12px; font-size: 12px;" onclick="removePlatform('${platformName}')">Remove</button>
            </div>
        `;

        if (platformSchema.properties) {
            for (const [fieldName, fieldSchema] of Object.entries(platformSchema.properties)) {
                const fieldValue = config.platforms[platformName][fieldName] ?? buildDefaultValue(fieldSchema, schema);
                const isRequired = platformSchema.required && platformSchema.required.includes(fieldName);

                html += renderField(
                    `platforms.${platformName}.${fieldName}`,
                    fieldName,
                    fieldSchema,
                    fieldValue,
                    isRequired
                );
            }
        }

        platformDiv.innerHTML = html;
        container.appendChild(platformDiv);
    }
}

function renderAdvertisement() {
    const container = document.getElementById('advertisementContainer');
    if (!container) return;

    container.innerHTML = '';

    const adSchema = schema.properties.advertisement;
    if (!adSchema || !adSchema.properties) {
        return;
    }

    if (!config.advertisement) {
        config.advertisement = buildDefaultValue(adSchema, schema);
    }

    let html = '<div class="field-group"><p style="margin-bottom: 10px; color: #34495e;"><b>General Settings</b></p>';

    for (const [fieldName, fieldSchema] of Object.entries(adSchema.properties)) {
        if (fieldName === 'interstitial' || fieldName === 'rewarded') {
            continue;
        }

        const fieldValue = config.advertisement[fieldName] ?? buildDefaultValue(fieldSchema, schema);
        html += renderField(
            `advertisement.${fieldName}`,
            fieldName,
            fieldSchema,
            fieldValue,
            false
        );
    }

    html += '</div>';

    for (const adType of ['interstitial', 'rewarded']) {
        if (!adSchema.properties[adType]) continue;

        html += `<div class="field-group"><p style="margin-bottom: 10px; color: #34495e;"><b>${formatLabel(adType)}</b></p>`;

        const adTypeSchema = resolveRef(adSchema.properties[adType], schema);
        if (!config.advertisement[adType]) {
            config.advertisement[adType] = buildDefaultValue(adTypeSchema, schema);
        }

        if (adTypeSchema.properties) {
            for (const [fieldName, fieldSchema] of Object.entries(adTypeSchema.properties)) {
                if (fieldName === 'placements') {
                    continue;
                }

                const fieldValue = config.advertisement[adType][fieldName] ?? buildDefaultValue(fieldSchema, schema);
                html += renderField(
                    `advertisement.${adType}.${fieldName}`,
                    fieldName,
                    fieldSchema,
                    fieldValue,
                    false
                );
            }
        }

        html += `<div style="margin-top: 15px;">
            <h4 style="margin-bottom: 10px; color: #34495e; font-size: 14px;">Placements</h4>
            <div id="${adType}PlacementsContainer" class="array-section"></div>
            <button class="btn btn-primary" onclick="addPlacement('${adType}')">Add Placement</button>
        </div>`;

        html += '</div>';
    }

    container.innerHTML = html;

    // Render placements for each ad type
    for (const adType of ['interstitial', 'rewarded']) {
        if (adSchema.properties[adType]) {
            renderPlacements(adType);
        }
    }
}

function renderPayments() {
    const container = document.getElementById('paymentsContainer');
    if (!container) return;

    container.innerHTML = '';

    if (!config.payments) {
        config.payments = [];
    }

    config.payments.forEach((payment, index) => {
        const paymentDiv = document.createElement('div');
        paymentDiv.className = 'array-item';
        paymentDiv.style.flexDirection = 'column';
        paymentDiv.style.alignItems = 'stretch';
        paymentDiv.style.gap = '15px';
        paymentDiv.style.padding = '15px';
        paymentDiv.style.border = '1px solid #ddd';
        paymentDiv.style.borderRadius = '6px';
        paymentDiv.style.background = '#fafafa';

        let html = `
            <div style="display: flex; gap: 10px; align-items: center;">
                <div style="flex: 1;">
                    <label class="field-label">Product ID *</label>
                    <input type="text"
                           class="field-input"
                           value="${payment.id || ''}"
                           onchange="updatePaymentField(${index}, 'id', this.value)"
                           placeholder="Product ID">
                </div>
                <button class="btn btn-danger" onclick="removePayment(${index})" style="margin-top: 20px;">Remove</button>
            </div>
        `;

        html += `
            <div style="margin-top: 10px;">
                <h4 style="margin-bottom: 10px; color: #34495e; font-size: 13px;">Platform Configurations</h4>
                <div id="payment_${index}_platforms" style="display: flex; flex-direction: column; gap: 10px;"></div>
                <button class="btn btn-primary" onclick="addPaymentPlatform(${index})" style="margin-top: 10px; font-size: 12px; padding: 6px 12px;">Add Platform</button>
            </div>
        `;

        paymentDiv.innerHTML = html;
        container.appendChild(paymentDiv);

        renderPaymentPlatforms(index);
    });
}

function renderPaymentPlatforms(paymentIndex) {
    const payment = config.payments[paymentIndex];
    const container = document.getElementById(`payment_${paymentIndex}_platforms`);
    if (!container || !payment) return;

    container.innerHTML = '';

    const paymentsSchema = schema.properties.payments;
    const paymentItemSchema = resolveRef(paymentsSchema.items, schema);

    for (const [platformName, value] of Object.entries(payment)) {
        if (platformName === 'id') continue;

        const platformSchema = paymentItemSchema.properties[platformName];
        if (!platformSchema) continue;

        const platformDiv = document.createElement('div');
        platformDiv.style.display = 'flex';
        platformDiv.style.flexDirection = 'column';
        platformDiv.style.gap = '10px';
        platformDiv.style.padding = '12px';
        platformDiv.style.background = 'white';
        platformDiv.style.borderRadius = '6px';
        platformDiv.style.border = '1px solid #e0e0e0';

        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h4 style="margin: 0; color: #2c3e50; font-size: 14px; font-weight: 600;">${formatLabel(platformName)}</h4>
                <button class="btn btn-danger" onclick="removePaymentPlatform(${paymentIndex}, '${platformName}')" style="font-size: 11px; padding: 5px 10px;">Remove</button>
            </div>
        `;

        if (platformSchema.properties) {
            for (const [fieldName, fieldSchema] of Object.entries(platformSchema.properties)) {
                const fieldPath = `${platformName}.${fieldName}`;
                const fieldValue = payment[platformName]?.[fieldName] ?? '';
                const isRequired = platformSchema.required && platformSchema.required.includes(fieldName);

                html += `<div style="margin-bottom: 4px;">
                    <label style="display: block; font-size: 12px; font-weight: 500; margin-bottom: 4px; color: #555;">
                        ${formatLabel(fieldName)}${isRequired ? ' *' : ''}
                    </label>
                    ${renderFieldInput(fieldPath, fieldSchema, fieldValue, paymentIndex)}
                </div>`;
            }
        }

        platformDiv.innerHTML = html;
        container.appendChild(platformDiv);
    }
}

function renderField(path, fieldName, fieldSchema, fieldValue, isRequired) {
    const label = formatLabel(fieldName);
    const requiredMark = isRequired ? ' *' : '';

    if (fieldSchema.type === 'boolean') {
        return `
            <div class="field-group">
                <div class="checkbox-group">
                    <input type="checkbox"
                           id="${path}"
                           class="checkbox-input"
                           ${fieldValue ? 'checked' : ''}
                           onchange="updateField('${path}', this.checked)">
                    <label for="${path}" class="field-label">${label}${requiredMark}</label>
                </div>
            </div>
        `;
    } else if (fieldSchema.type === 'string') {
        return `
            <div class="field-group">
                <label for="${path}" class="field-label">${label}${requiredMark}</label>
                <input type="text"
                       id="${path}"
                       class="field-input"
                       value="${fieldValue || ''}"
                       onchange="updateField('${path}', this.value)">
            </div>
        `;
    } else if (fieldSchema.type === 'number') {
        return `
            <div class="field-group">
                <label for="${path}" class="field-label">${label}${requiredMark}</label>
                <input type="number"
                       id="${path}"
                       class="field-input"
                       value="${fieldValue || ''}"
                       onchange="updateField('${path}', parseFloat(this.value) || 0)">
            </div>
        `;
    }

    return '';
}

function renderFieldInput(fieldPath, fieldSchema, fieldValue, paymentIndex) {
    const fullPath = `payments.${paymentIndex}.${fieldPath}`;

    if (fieldSchema.type === 'string') {
        return `<input type="text"
                       class="field-input"
                       value="${fieldValue || ''}"
                       onchange="updateField('${fullPath}', this.value)"
                       style="width: 100%;">`;
    } else if (fieldSchema.type === 'number') {
        return `<input type="number"
                       class="field-input"
                       value="${fieldValue || ''}"
                       onchange="updateField('${fullPath}', parseFloat(this.value) || null)"
                       style="width: 100%;">`;
    } else if (fieldSchema.type === 'boolean') {
        return `<input type="checkbox"
                       class="checkbox-input"
                       ${fieldValue ? 'checked' : ''}
                       onchange="updateField('${fullPath}', this.checked)">`;
    }

    return '';
}

function updateField(path, value) {
    const parts = path.split('.');
    let current = config;

    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        const nextPart = parts[i + 1];

        if (!isNaN(nextPart)) {
            if (!current[part]) {
                current[part] = [];
            }
            current = current[part];
        } else {
            if (!current[part]) {
                current[part] = {};
            }
            current = current[part];
        }
    }

    const lastPart = parts[parts.length - 1];

    if (typeof value === 'string' && value.trim() === '') {
        delete current[lastPart];
    } else if (value === null || value === undefined) {
        delete current[lastPart];
    } else {
        current[lastPart] = value;
    }

    cleanupEmptyObjects(config);
    updateJsonOutput();
}

function cleanupEmptyObjects(obj) {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
        return obj;
    }

    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[key];

            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                cleanupEmptyObjects(value);

                if (Object.keys(value).length === 0) {
                    delete obj[key];
                }
            }
        }
    }
}

function updatePaymentField(index, fieldPath, value) {
    if (fieldPath === 'id') {
        config.payments[index].id = value;
    } else {
        updateField(`payments.${index}.${fieldPath}`, value);
    }

    updateJsonOutput();
}

function addPayment() {
    const paymentsSchema = schema.properties.payments;
    const paymentItemSchema = resolveRef(paymentsSchema.items, schema);
    const newPayment = buildDefaultValue(paymentItemSchema, schema);

    config.payments.push(newPayment);
    renderPayments();
    updateJsonOutput();
}

function removePayment(index) {
    config.payments.splice(index, 1);
    renderPayments();
    updateJsonOutput();
}

let paymentPlatformContext = null;

function addPaymentPlatform(paymentIndex) {
    paymentPlatformContext = paymentIndex;
    openPaymentPlatformSelector();
}

function removePaymentPlatform(paymentIndex, platformName) {
    const payment = config.payments[paymentIndex];
    if (!payment) return;

    delete payment[platformName];
    renderPaymentPlatforms(paymentIndex);
    updateJsonOutput();
}

function openPaymentPlatformSelector() {
    const overlay = document.getElementById('paymentPlatformSelectorOverlay');
    const listContainer = document.getElementById('paymentPlatformSelectorList');
    const searchInput = document.getElementById('paymentPlatformSearch');

    if (!overlay || !listContainer) return;

    if (searchInput) {
        searchInput.value = '';
    }

    renderPaymentPlatformList();
    overlay.classList.add('show');

    if (searchInput) {
        setTimeout(() => searchInput.focus(), 100);
    }
}

function closePaymentPlatformSelector(event) {
    if (event && event.target && event.target.id !== 'paymentPlatformSelectorOverlay') {
        return;
    }

    const overlay = document.getElementById('paymentPlatformSelectorOverlay');
    const searchInput = document.getElementById('paymentPlatformSearch');

    if (overlay) {
        overlay.classList.remove('show');
    }

    if (searchInput) {
        searchInput.value = '';
    }

    paymentPlatformContext = null;
}

function renderPaymentPlatformList(filterText = '') {
    const listContainer = document.getElementById('paymentPlatformSelectorList');
    if (!listContainer || paymentPlatformContext === null) return;

    listContainer.innerHTML = '';

    const paymentIndex = paymentPlatformContext;
    const payment = config.payments[paymentIndex];
    if (!payment) return;

    const paymentsSchema = schema.properties.payments;
    const paymentItemSchema = resolveRef(paymentsSchema.items, schema);

    const alreadyAddedPlatforms = Object.keys(payment).filter(key => key !== 'id');
    const availablePlatforms = Object.keys(paymentItemSchema.properties).filter(key => key !== 'id');

    const filteredPlatforms = availablePlatforms.filter(platformName => {
        if (!filterText) return true;
        const label = formatLabel(platformName).toLowerCase();
        return label.includes(filterText.toLowerCase()) || platformName.toLowerCase().includes(filterText.toLowerCase());
    });

    if (filteredPlatforms.length === 0) {
        listContainer.innerHTML = `
            <div class="no-platforms-found">
                <div style="font-size: 48px; margin-bottom: 10px;">🔍</div>
                <p>No platforms found</p>
                <p style="font-size: 14px; margin-top: 5px;">Try a different search term</p>
            </div>
        `;
        return;
    }

    for (const platformName of filteredPlatforms) {
        const isAdded = alreadyAddedPlatforms.includes(platformName);
        const platformSchema = paymentItemSchema.properties[platformName];
        const platformDiv = document.createElement('div');
        platformDiv.className = `platform-option ${isAdded ? 'disabled' : ''}`;
        platformDiv.dataset.platformName = platformName;

        const allFields = Object.keys(platformSchema.properties || {});
        const requiredFields = platformSchema.required || [];

        let description = '';
        if (allFields.length > 0) {
            const fieldsList = allFields.map(f => {
                const isReq = requiredFields.includes(f);
                return `${formatLabel(f)}${isReq ? ' *' : ''}`;
            }).join(', ');
            description = fieldsList;
        }

        platformDiv.innerHTML = `
            <div class="platform-option-name">
                ${formatLabel(platformName)}
            </div>
            ${isAdded ? '<div class="platform-option-description">✓ Already added</div>' : (description ? `<div class="platform-option-description">Fields: ${description}</div>` : '')}
        `;

        if (!isAdded) {
            platformDiv.onclick = () => selectPaymentPlatform(platformName);
        }

        listContainer.appendChild(platformDiv);
    }
}

function filterPaymentPlatforms(filterText) {
    renderPaymentPlatformList(filterText);
}

function selectPaymentPlatform(platformName) {
    if (paymentPlatformContext === null) return;

    const paymentIndex = paymentPlatformContext;
    const payment = config.payments[paymentIndex];
    if (!payment) return;

    const paymentsSchema = schema.properties.payments;
    const paymentItemSchema = resolveRef(paymentsSchema.items, schema);
    const platformSchema = paymentItemSchema.properties[platformName];

    if (!platformSchema) return;

    payment[platformName] = buildDefaultValue(platformSchema, schema);

    closePaymentPlatformSelector();
    renderPaymentPlatforms(paymentIndex);
    updateJsonOutput();
}

function renderLeaderboards() {
    const container = document.getElementById('leaderboardsContainer');
    if (!container) return;

    container.innerHTML = '';

    if (!config.leaderboards) {
        config.leaderboards = [];
    }

    const leaderboardsSchema = schema.properties.leaderboards;
    const leaderboardItemSchema = resolveRef(leaderboardsSchema.items, schema);

    config.leaderboards.forEach((leaderboard, index) => {
        const leaderboardDiv = document.createElement('div');
        leaderboardDiv.className = 'array-item';
        leaderboardDiv.style.flexDirection = 'column';
        leaderboardDiv.style.alignItems = 'stretch';
        leaderboardDiv.style.gap = '15px';
        leaderboardDiv.style.padding = '15px';
        leaderboardDiv.style.border = '1px solid #ddd';
        leaderboardDiv.style.borderRadius = '6px';
        leaderboardDiv.style.background = '#fafafa';

        let html = `
            <div style="display: flex; gap: 10px; align-items: center;">
                <div style="flex: 1;">
                    <label class="field-label">Leaderboard ID *</label>
                    <input type="text"
                           class="field-input"
                           value="${leaderboard.id || ''}"
                           onchange="updateLeaderboardField(${index}, 'id', this.value)"
                           placeholder="Leaderboard ID">
                </div>
                <button class="btn btn-danger" onclick="removeLeaderboard(${index})" style="margin-top: 20px;">Remove</button>
            </div>
        `;

        if (leaderboardItemSchema.properties.isMain) {
            const isMainValue = leaderboard.isMain || false;
            html += `
                <div class="field-group">
                    <div class="checkbox-group">
                        <input type="checkbox"
                               id="leaderboard_${index}_isMain"
                               class="checkbox-input"
                               ${isMainValue ? 'checked' : ''}
                               onchange="updateLeaderboardField(${index}, 'isMain', this.checked)">
                        <label for="leaderboard_${index}_isMain" class="field-label">Is Main</label>
                    </div>
                </div>
            `;
        }

        html += `
            <div style="margin-top: 10px;">
                <h4 style="margin-bottom: 10px; color: #34495e; font-size: 13px;">Platform Overrides</h4>
                <div id="leaderboard_${index}_platforms" style="display: flex; flex-direction: column; gap: 10px;"></div>
                <button class="btn btn-primary" onclick="addLeaderboardPlatform(${index})" style="margin-top: 10px; font-size: 12px; padding: 6px 12px;">Add Platform Override</button>
            </div>
        `;

        leaderboardDiv.innerHTML = html;
        container.appendChild(leaderboardDiv);

        renderLeaderboardPlatforms(index);
    });
}

function addLeaderboard() {
    const leaderboardsSchema = schema.properties.leaderboards;
    const leaderboardItemSchema = resolveRef(leaderboardsSchema.items, schema);
    const newLeaderboard = buildDefaultValue(leaderboardItemSchema, schema);

    config.leaderboards.push(newLeaderboard);
    renderLeaderboards();
    updateJsonOutput();
}

function removeLeaderboard(index) {
    config.leaderboards.splice(index, 1);
    renderLeaderboards();
    updateJsonOutput();
}

function updateLeaderboardField(index, field, value) {
    if (!config.leaderboards[index]) {
        return;
    }

    if (field === 'id') {
        config.leaderboards[index].id = value;
    } else if (field === 'isMain') {
        if (value === true) {
            config.leaderboards[index].isMain = value;
        } else {
            delete config.leaderboards[index].isMain;
        }
    } else {
        if (value && value.trim() !== '') {
            config.leaderboards[index][field] = value;
        } else {
            delete config.leaderboards[index][field];
        }
    }

    updateJsonOutput();
}

function renderLeaderboardPlatforms(leaderboardIndex) {
    const leaderboard = config.leaderboards[leaderboardIndex];
    const container = document.getElementById(`leaderboard_${leaderboardIndex}_platforms`);
    if (!container || !leaderboard) return;

    container.innerHTML = '';

    const leaderboardsSchema = schema.properties.leaderboards;
    const leaderboardItemSchema = resolveRef(leaderboardsSchema.items, schema);

    for (const [platformName, value] of Object.entries(leaderboard)) {
        if (platformName === 'id' || platformName === 'isMain') continue;

        const platformSchema = leaderboardItemSchema.properties[platformName];
        if (!platformSchema) continue;

        const platformDiv = document.createElement('div');
        platformDiv.style.display = 'flex';
        platformDiv.style.gap = '10px';
        platformDiv.style.alignItems = 'center';
        platformDiv.style.padding = '8px';
        platformDiv.style.background = 'white';
        platformDiv.style.borderRadius = '4px';
        platformDiv.style.border = '1px solid #e0e0e0';

        platformDiv.innerHTML = `
            <div style="flex: 0.4;">
                <label style="display: block; font-size: 11px; font-weight: 500; color: #7f8c8d; margin-bottom: 4px;">Platform</label>
                <div style="font-size: 13px; font-weight: 600; color: #2c3e50;">${formatLabel(platformName)}</div>
            </div>
            <div style="flex: 0.6;">
                <label style="display: block; font-size: 11px; font-weight: 500; color: #7f8c8d; margin-bottom: 4px;">Override ID</label>
                <input type="text"
                       class="field-input"
                       value="${value || ''}"
                       onchange="updateLeaderboardPlatformId(${leaderboardIndex}, '${platformName}', this.value)"
                       placeholder="Platform ID"
                       style="font-size: 12px; padding: 6px 10px;">
            </div>
            <button class="btn btn-danger" onclick="removeLeaderboardPlatform(${leaderboardIndex}, '${platformName}')" style="font-size: 11px; padding: 5px 10px; align-self: flex-end; margin-bottom: 2px;">Remove</button>
        `;

        container.appendChild(platformDiv);
    }
}

let leaderboardPlatformContext = null;

function addLeaderboardPlatform(leaderboardIndex) {
    leaderboardPlatformContext = leaderboardIndex;
    openLeaderboardPlatformSelector();
}

function removeLeaderboardPlatform(leaderboardIndex, platformName) {
    const leaderboard = config.leaderboards[leaderboardIndex];
    if (!leaderboard) return;

    delete leaderboard[platformName];
    renderLeaderboardPlatforms(leaderboardIndex);
    updateJsonOutput();
}

function updateLeaderboardPlatformId(leaderboardIndex, platformName, value) {
    const leaderboard = config.leaderboards[leaderboardIndex];
    if (!leaderboard) return;

    if (value && value.trim() !== '') {
        leaderboard[platformName] = value;
    } else {
        leaderboard[platformName] = '';
    }

    updateJsonOutput();
}

function openLeaderboardPlatformSelector() {
    const overlay = document.getElementById('leaderboardPlatformSelectorOverlay');
    const listContainer = document.getElementById('leaderboardPlatformSelectorList');
    const searchInput = document.getElementById('leaderboardPlatformSearch');

    if (!overlay || !listContainer) return;

    if (searchInput) {
        searchInput.value = '';
    }

    renderLeaderboardPlatformList();
    overlay.classList.add('show');

    if (searchInput) {
        setTimeout(() => searchInput.focus(), 100);
    }
}

function closeLeaderboardPlatformSelector(event) {
    if (event && event.target && event.target.id !== 'leaderboardPlatformSelectorOverlay') {
        return;
    }

    const overlay = document.getElementById('leaderboardPlatformSelectorOverlay');
    const searchInput = document.getElementById('leaderboardPlatformSearch');

    if (overlay) {
        overlay.classList.remove('show');
    }

    if (searchInput) {
        searchInput.value = '';
    }

    leaderboardPlatformContext = null;
}

function renderLeaderboardPlatformList(filterText = '') {
    const listContainer = document.getElementById('leaderboardPlatformSelectorList');
    if (!listContainer || leaderboardPlatformContext === null) return;

    listContainer.innerHTML = '';

    const leaderboardIndex = leaderboardPlatformContext;
    const leaderboard = config.leaderboards[leaderboardIndex];
    if (!leaderboard) return;

    const leaderboardsSchema = schema.properties.leaderboards;
    const leaderboardItemSchema = resolveRef(leaderboardsSchema.items, schema);

    const alreadyAddedPlatforms = Object.keys(leaderboard).filter(key => key !== 'id' && key !== 'isMain');
    const availablePlatforms = Object.keys(leaderboardItemSchema.properties).filter(key => key !== 'id' && key !== 'isMain');

    const filteredPlatforms = availablePlatforms.filter(platformName => {
        if (!filterText) return true;
        const label = formatLabel(platformName).toLowerCase();
        return label.includes(filterText.toLowerCase()) || platformName.toLowerCase().includes(filterText.toLowerCase());
    });

    if (filteredPlatforms.length === 0) {
        listContainer.innerHTML = `
            <div class="no-platforms-found">
                <div style="font-size: 48px; margin-bottom: 10px;">🔍</div>
                <p>No platforms found</p>
                <p style="font-size: 14px; margin-top: 5px;">Try a different search term</p>
            </div>
        `;
        return;
    }

    for (const platformName of filteredPlatforms) {
        const isAdded = alreadyAddedPlatforms.includes(platformName);
        const platformDiv = document.createElement('div');
        platformDiv.className = `platform-option ${isAdded ? 'disabled' : ''}`;
        platformDiv.dataset.platformName = platformName;

        platformDiv.innerHTML = `
            <div class="platform-option-name">
                ${formatLabel(platformName)}
            </div>
            ${isAdded ? '<div class="platform-option-description">✓ Already added</div>' : ''}
        `;

        if (!isAdded) {
            platformDiv.onclick = () => selectLeaderboardPlatform(platformName);
        }

        listContainer.appendChild(platformDiv);
    }
}

function filterLeaderboardPlatforms(filterText) {
    renderLeaderboardPlatformList(filterText);
}

function selectLeaderboardPlatform(platformName) {
    if (leaderboardPlatformContext === null) return;

    const leaderboardIndex = leaderboardPlatformContext;
    const leaderboard = config.leaderboards[leaderboardIndex];
    if (!leaderboard) return;

    leaderboard[platformName] = '';

    closeLeaderboardPlatformSelector();
    renderLeaderboardPlatforms(leaderboardIndex);
    updateJsonOutput();
}

function renderPlacements(adType) {
    const container = document.getElementById(`${adType}PlacementsContainer`);
    if (!container) return;

    container.innerHTML = '';

    if (!config.advertisement[adType].placements) {
        config.advertisement[adType].placements = [];
    }

    config.advertisement[adType].placements.forEach((placement, index) => {
        const placementDiv = document.createElement('div');
        placementDiv.className = 'array-item';
        placementDiv.style.flexDirection = 'column';
        placementDiv.style.alignItems = 'stretch';
        placementDiv.style.gap = '15px';
        placementDiv.style.padding = '15px';
        placementDiv.style.border = '1px solid #ddd';
        placementDiv.style.borderRadius = '6px';
        placementDiv.style.background = '#fafafa';

        let html = `
            <div style="display: flex; gap: 10px; align-items: center;">
                <div style="flex: 1;">
                    <label class="field-label">Placement ID *</label>
                    <input type="text"
                           class="field-input"
                           value="${placement.id || ''}"
                           onchange="updatePlacementField('${adType}', ${index}, 'id', this.value)"
                           placeholder="Placement ID">
                </div>
                <button class="btn btn-danger" onclick="removePlacement('${adType}', ${index})" style="margin-top: 20px;">Remove</button>
            </div>
        `;

        html += `
            <div style="margin-top: 10px;">
                <h4 style="margin-bottom: 10px; color: #34495e; font-size: 13px;">Platform Overrides</h4>
                <div id="${adType}_placement_${index}_overrides" style="display: flex; flex-direction: column; gap: 10px;"></div>
                <button class="btn btn-primary" onclick="addPlatformOverride('${adType}', ${index})" style="margin-top: 10px; font-size: 12px; padding: 6px 12px;">Add Platform Override</button>
            </div>
        `;

        placementDiv.innerHTML = html;
        container.appendChild(placementDiv);

        renderPlatformOverrides(adType, index);
    });
}

function renderPlatformOverrides(adType, placementIndex) {
    const placement = config.advertisement[adType].placements[placementIndex];
    const container = document.getElementById(`${adType}_placement_${placementIndex}_overrides`);
    if (!container) return;

    container.innerHTML = '';

    for (const [key, value] of Object.entries(placement)) {
        if (key === 'id') continue;
        if (!ALL_PLATFORMS.includes(key)) continue;

        const overrideDiv = document.createElement('div');
        overrideDiv.style.display = 'flex';
        overrideDiv.style.gap = '10px';
        overrideDiv.style.alignItems = 'center';
        overrideDiv.style.padding = '8px';
        overrideDiv.style.background = 'white';
        overrideDiv.style.borderRadius = '4px';
        overrideDiv.style.border = '1px solid #e0e0e0';

        overrideDiv.innerHTML = `
            <div style="flex: 0.4;">
                <label style="display: block; font-size: 11px; font-weight: 500; color: #7f8c8d; margin-bottom: 4px;">Platform</label>
                <div style="font-size: 13px; font-weight: 600; color: #2c3e50;">${formatLabel(key)}</div>
            </div>
            <div style="flex: 0.6;">
                <label style="display: block; font-size: 11px; font-weight: 500; color: #7f8c8d; margin-bottom: 4px;">Override ID</label>
                <input type="text"
                       class="field-input"
                       value="${value || ''}"
                       onchange="updatePlatformOverrideId('${adType}', ${placementIndex}, '${key}', this.value)"
                       placeholder="Platform ID"
                       style="font-size: 12px; padding: 6px 10px;">
            </div>
            <button class="btn btn-danger" onclick="removePlatformOverride('${adType}', ${placementIndex}, '${key}')" style="font-size: 11px; padding: 5px 10px; align-self: flex-end; margin-bottom: 2px;">Remove</button>
        `;

        container.appendChild(overrideDiv);
    }
}

function addPlacement(adType) {
    if (!config.advertisement[adType].placements) {
        config.advertisement[adType].placements = [];
    }

    const newPlacement = {
        id: ''
    };

    config.advertisement[adType].placements.push(newPlacement);
    renderPlacements(adType);
    updateJsonOutput();
}

function removePlacement(adType, index) {
    config.advertisement[adType].placements.splice(index, 1);
    renderPlacements(adType);
    updateJsonOutput();
}

function updatePlacementField(adType, index, field, value) {
    if (!config.advertisement[adType].placements[index]) {
        return;
    }

    if (field === 'id') {
        if (value && value.trim() !== '') {
            config.advertisement[adType].placements[index][field] = value;
        } else {
            config.advertisement[adType].placements[index][field] = '';
        }
    }

    updateJsonOutput();
}

let overridePlatformContext = null;

function addPlatformOverride(adType, placementIndex) {
    overridePlatformContext = { adType, placementIndex };
    openOverridePlatformSelector();
}

function openOverridePlatformSelector() {
    const overlay = document.getElementById('overridePlatformSelectorOverlay');
    const listContainer = document.getElementById('overridePlatformSelectorList');
    const searchInput = document.getElementById('overridePlatformSearch');

    if (!overlay || !listContainer) return;

    if (searchInput) {
        searchInput.value = '';
    }

    renderOverridePlatformList();
    overlay.classList.add('show');

    if (searchInput) {
        setTimeout(() => searchInput.focus(), 100);
    }
}

function closeOverridePlatformSelector(event) {
    if (event && event.target && event.target.id !== 'overridePlatformSelectorOverlay') {
        return;
    }

    const overlay = document.getElementById('overridePlatformSelectorOverlay');
    const searchInput = document.getElementById('overridePlatformSearch');

    if (overlay) {
        overlay.classList.remove('show');
    }

    if (searchInput) {
        searchInput.value = '';
    }

    overridePlatformContext = null;
}

function renderOverridePlatformList(filterText = '') {
    const listContainer = document.getElementById('overridePlatformSelectorList');
    if (!listContainer || !overridePlatformContext) return;

    listContainer.innerHTML = '';

    const { adType, placementIndex } = overridePlatformContext;
    const placement = config.advertisement[adType].placements[placementIndex];
    if (!placement) return;

    const alreadyAddedPlatforms = Object.keys(placement).filter(key => key !== 'id' && ALL_PLATFORMS.includes(key));

    const filteredPlatforms = ALL_PLATFORMS.filter(platformName => {
        if (!filterText) return true;
        const label = formatLabel(platformName).toLowerCase();
        return label.includes(filterText.toLowerCase()) || platformName.toLowerCase().includes(filterText.toLowerCase());
    });

    if (filteredPlatforms.length === 0) {
        listContainer.innerHTML = `
            <div class="no-platforms-found">
                <div style="font-size: 48px; margin-bottom: 10px;">🔍</div>
                <p>No platforms found</p>
                <p style="font-size: 14px; margin-top: 5px;">Try a different search term</p>
            </div>
        `;
        return;
    }

    for (const platformName of filteredPlatforms) {
        const isAdded = alreadyAddedPlatforms.includes(platformName);
        const platformDiv = document.createElement('div');
        platformDiv.className = `platform-option ${isAdded ? 'disabled' : ''}`;
        platformDiv.dataset.platformName = platformName;

        platformDiv.innerHTML = `
            <div class="platform-option-name">
                ${formatLabel(platformName)}
            </div>
            ${isAdded ? '<div class="platform-option-description">✓ Already added</div>' : ''}
        `;

        if (!isAdded) {
            platformDiv.onclick = () => selectOverridePlatform(platformName);
        }

        listContainer.appendChild(platformDiv);
    }
}

function filterOverridePlatforms(filterText) {
    renderOverridePlatformList(filterText);
}

function selectOverridePlatform(platformName) {
    if (!overridePlatformContext) return;

    const { adType, placementIndex } = overridePlatformContext;
    const placement = config.advertisement[adType].placements[placementIndex];
    if (!placement) return;

    placement[platformName] = '';
    closeOverridePlatformSelector();
    renderPlatformOverrides(adType, placementIndex);
    updateJsonOutput();
}

function updatePlatformOverrideId(adType, placementIndex, platformName, value) {
    const placement = config.advertisement[adType].placements[placementIndex];
    if (!placement) return;

    if (value && value.trim() !== '') {
        placement[platformName] = value;
    } else {
        placement[platformName] = '';
    }

    updateJsonOutput();
}

function removePlatformOverride(adType, placementIndex, platformName) {
    const placement = config.advertisement[adType].placements[placementIndex];
    if (!placement) return;

    delete placement[platformName];
    renderPlatformOverrides(adType, placementIndex);
    updateJsonOutput();
}

function formatLabel(str) {
    return str
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function resolveRef(propertySchema, rootSchema) {
    if (!propertySchema) return null;

    if (propertySchema.$ref) {
        const refPath = propertySchema.$ref.replace('#/', '').split('/');
        let refSchema = rootSchema;
        for (const path of refPath) {
            refSchema = refSchema[path];
        }
        return refSchema;
    }

    return propertySchema;
}

function isPlatformEmpty(platform) {
    for (const [fieldName, fieldValue] of Object.entries(platform)) {
        if (typeof fieldValue === 'string' && fieldValue.trim() !== '') {
            return false;
        }

        if (typeof fieldValue === 'boolean' && fieldValue === true) {
            return false;
        }

        if (typeof fieldValue === 'number' && fieldValue !== 0) {
            return false;
        }
    }

    return true;
}

function getFilteredConfig() {
    const filteredConfig = JSON.parse(JSON.stringify(config));

    if (filteredConfig.platforms) {
        const filteredPlatforms = {};
        for (const [platformName, platform] of Object.entries(filteredConfig.platforms)) {
            if (!isPlatformEmpty(platform)) {
                filteredPlatforms[platformName] = platform;
            }
        }
        filteredConfig.platforms = filteredPlatforms;
    }

    function removeFalseBooleans(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(removeFalseBooleans).filter(item => {
                if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
                    return Object.keys(item).length > 0;
                }
                return true;
            });
        }

        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'boolean' && value === false) {
                continue;
            } else if (typeof value === 'string' && value.trim() === '') {
                continue;
            } else if (typeof value === 'object' && value !== null) {
                const filteredValue = removeFalseBooleans(value);
                if (Array.isArray(filteredValue)) {
                    if (filteredValue.length > 0) {
                        result[key] = filteredValue;
                    }
                } else if (Object.keys(filteredValue).length > 0) {
                    result[key] = filteredValue;
                }
            } else {
                result[key] = value;
            }
        }
        return result;
    }

    return removeFalseBooleans(filteredConfig);
}

function updateJsonOutput() {
    const output = document.getElementById('jsonOutput');
    if (!output) return;

    const filteredConfig = getFilteredConfig();
    const jsonString = JSON.stringify(filteredConfig, null, 2);
    const highlightedJson = highlightJson(jsonString);
    output.innerHTML = highlightedJson;
}

function highlightJson(json) {
    return json
        .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'json-key';
                } else {
                    cls = 'json-string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });
}

function toggleUpload() {
    const uploadSection = document.getElementById('uploadSection');
    const jsonTextarea = document.getElementById('jsonTextarea');

    if (uploadSection.style.display === 'none') {
        uploadSection.style.display = 'block';
        jsonTextarea.focus();
    } else {
        uploadSection.style.display = 'none';
    }
}

function cancelUpload() {
    const uploadSection = document.getElementById('uploadSection');
    uploadSection.style.display = 'none';
}

function loadJson() {
    const jsonTextarea = document.getElementById('jsonTextarea');
    const jsonString = jsonTextarea.value.trim();

    if (!jsonString) {
        alert('Invalid JSON');
        return;
    }

    try {
        const newConfig = JSON.parse(jsonString);

        if (!newConfig || typeof newConfig !== 'object') {
            throw new Error('Invalid JSON');
        }

        config = mergeWithDefault(newConfig);
        renderEditor();
        updateJsonOutput();
        cancelUpload();
        jsonTextarea.value = '';
    } catch (error) {
        alert('JSON parsing error');
        console.error('JSON parsing error:', error);
    }
}

function openPlatformSelector() {
    const overlay = document.getElementById('platformSelectorOverlay');
    const listContainer = document.getElementById('platformSelectorList');
    const searchInput = document.getElementById('platformSearch');

    if (!overlay || !listContainer) return;

    if (searchInput) {
        searchInput.value = '';
    }

    renderPlatformList();
    overlay.classList.add('show');

    if (searchInput) {
        setTimeout(() => searchInput.focus(), 100);
    }
}

function renderPlatformList(filterText = '') {
    const listContainer = document.getElementById('platformSelectorList');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    const platformsSchema = schema.properties.platforms;
    if (!platformsSchema || !platformsSchema.properties) {
        return;
    }

    const availablePlatforms = Object.keys(platformsSchema.properties);
    const addedPlatforms = Object.keys(config.platforms || {});

    const filteredPlatforms = availablePlatforms.filter(platformName => {
        if (!filterText) return true;
        const label = formatLabel(platformName).toLowerCase();
        return label.includes(filterText.toLowerCase()) || platformName.toLowerCase().includes(filterText.toLowerCase());
    });

    if (filteredPlatforms.length === 0) {
        listContainer.innerHTML = `
            <div class="no-platforms-found">
                <div style="font-size: 48px; margin-bottom: 10px;">🔍</div>
                <p>No platforms found</p>
                <p style="font-size: 14px; margin-top: 5px;">Try a different search term</p>
            </div>
        `;
        return;
    }

    for (const platformName of filteredPlatforms) {
        const isAdded = addedPlatforms.includes(platformName);
        const platformSchema = platformsSchema.properties[platformName];
        const platformDiv = document.createElement('div');
        platformDiv.className = `platform-option ${isAdded ? 'disabled' : ''}`;
        platformDiv.dataset.platformName = platformName;

        const allFields = Object.keys(platformSchema.properties || {});

        let description = '';
        if (allFields.length > 0) {
            const fieldsList = allFields.slice(0, 3).map(f => formatLabel(f)).join(', ');
            const moreCount = allFields.length - 3;
            description = fieldsList + (moreCount > 0 ? `, +${moreCount} more` : '');
        }

        platformDiv.innerHTML = `
            <div class="platform-option-name">
                ${formatLabel(platformName)}
            </div>
            ${isAdded ? '<div class="platform-option-description">✓ Already added</div>' : (description ? `<div class="platform-option-description">Settings: ${description}</div>` : '')}
        `;

        if (!isAdded) {
            platformDiv.onclick = () => selectPlatform(platformName);
        }

        listContainer.appendChild(platformDiv);
    }
}

function filterPlatforms(filterText) {
    renderPlatformList(filterText);
}

function closePlatformSelector(event) {
    if (event && event.target && event.target.id !== 'platformSelectorOverlay') {
        return;
    }

    const overlay = document.getElementById('platformSelectorOverlay');
    const searchInput = document.getElementById('platformSearch');

    if (overlay) {
        overlay.classList.remove('show');
    }

    if (searchInput) {
        searchInput.value = '';
    }
}

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const platformOverlay = document.getElementById('platformSelectorOverlay');
        if (platformOverlay && platformOverlay.classList.contains('show')) {
            closePlatformSelector();
            return;
        }

        const overrideOverlay = document.getElementById('overridePlatformSelectorOverlay');
        if (overrideOverlay && overrideOverlay.classList.contains('show')) {
            closeOverridePlatformSelector();
            return;
        }

        const paymentPlatformOverlay = document.getElementById('paymentPlatformSelectorOverlay');
        if (paymentPlatformOverlay && paymentPlatformOverlay.classList.contains('show')) {
            closePaymentPlatformSelector();
            return;
        }

        const leaderboardPlatformOverlay = document.getElementById('leaderboardPlatformSelectorOverlay');
        if (leaderboardPlatformOverlay && leaderboardPlatformOverlay.classList.contains('show')) {
            closeLeaderboardPlatformSelector();
        }
    }
});

function selectPlatform(platformName) {
    const platformsSchema = schema.properties.platforms;
    const platformSchema = platformsSchema.properties[platformName];

    if (!config.platforms) {
        config.platforms = {};
    }

    config.platforms[platformName] = buildDefaultValue(platformSchema, schema);

    closePlatformSelector();
    renderPlatforms();
    updateJsonOutput();
}

function removePlatform(platformName) {
    if (!config.platforms || !config.platforms[platformName]) {
        return;
    }

    if (confirm(`Are you sure you want to remove ${formatLabel(platformName)}?`)) {
        delete config.platforms[platformName];
        renderPlatforms();
        updateJsonOutput();
    }
}

function mergeWithDefault(newConfig) {
    const mergedConfig = JSON.parse(JSON.stringify(defaultConfig));

    function deepMerge(target, source) {
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    if (!target[key] || typeof target[key] !== 'object') {
                        target[key] = {};
                    }
                    deepMerge(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        }
    }

    deepMerge(mergedConfig, newConfig);
    return mergedConfig;
}
