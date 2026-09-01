const SCHEMA_URL = './schema.json';

const SECTION_DESCRIPTION_TARGETS = [
    { path: 'advertisement', elementId: 'advertisementSectionDesc' },
    { path: 'crossPromo', elementId: 'crossPromoSectionDesc' },
    { path: 'dailyRewards', elementId: 'dailyRewardsSectionDesc' },
    { path: 'tasks', elementId: 'tasksSectionDesc' },
    { path: 'achievements', elementId: 'achievementsSectionDesc' },
    { path: 'payments', elementId: 'paymentsSectionDesc' },
    { path: 'leaderboards', elementId: 'leaderboardsSectionDesc' },
    { path: 'notifications', elementId: 'notificationsSectionDesc' },
    { path: 'videoPreviews', elementId: 'videoPreviewsSectionDesc' },
    { path: 'saas', elementId: 'saasSectionDesc' }
];

// SaaS features that support per-platform enablement via saas.<feature>.platforms
const SAAS_FEATURES = ['leaderboards', 'social'];

// Keys of advertisement.advancedBanners that are settings, everything else is a placement
const ADVANCED_BANNERS_SETTING_KEYS = ['disable', 'placementFallback'];

// Keys of an advanced banners placement that are settings, everything else is a condition
const ADVANCED_BANNERS_PLACEMENT_SETTING_KEYS = ['action'];

// Condition key applied when no other condition of the placement matches
const ADVANCED_BANNERS_DEFAULT_CONDITION = 'default';

// CSS box of a single advanced banner container
const ADVANCED_BANNER_FIELDS = ['width', 'height', 'top', 'bottom', 'left', 'right'];

// All known platform ids, sourced from the schema
function getAllPlatformIds() {
    const def = schema && schema.definitions && schema.definitions.platformId;
    return (def && Array.isArray(def.enum)) ? def.enum.slice() : [];
}

// Platform ids that can carry an ad placement override, sourced from the schema
function getAdPlacementPlatformIds() {
    const def = schema && schema.definitions && schema.definitions.adPlacement;
    if (!def || !def.properties) return [];
    return Object.keys(def.properties).filter((key) => key !== 'id');
}

let schema = null;
let config = {};
let defaultConfig = {};

// Tracks the button that owns the currently-visible info popover.
let activeInfoBtn = null;

// ---------- InfoTooltip helpers ----------

function getFieldDescription(path) {
    const map = window.FIELD_DESCRIPTIONS;
    if (!map || !path) return null;
    const entry = map[path];
    if (!entry || typeof entry !== 'object') return null;
    return entry;
}

function escapeAttr(value) {
    return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function infoBtnHtml(path) {
    if (!getFieldDescription(path)) return '';
    return `<button class="info-btn" type="button" tabindex="0" aria-label="More info" data-info-path="${escapeAttr(path)}">?</button>`;
}

function ensureInfoPopover() {
    let popover = document.getElementById('infoPopover');
    if (popover) return popover;

    popover = document.createElement('div');
    popover.id = 'infoPopover';
    popover.className = 'info-popover';
    popover.setAttribute('role', 'tooltip');
    document.body.appendChild(popover);
    return popover;
}

function showInfoPopover(button) {
    if (!button) return;
    const path = button.dataset.infoPath;
    const desc = getFieldDescription(path);
    if (!desc) return;

    const popover = ensureInfoPopover();
    // Clear previous content; we insert text via DOM API to avoid XSS.
    popover.textContent = '';

    const textNode = document.createTextNode(desc.text || '');
    popover.appendChild(textNode);

    if (desc.link) {
        popover.appendChild(document.createElement('br'));
        const link = document.createElement('a');
        link.className = 'info-popover-link';
        link.href = desc.link;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'Learn more →';
        popover.appendChild(link);
    }

    activeInfoBtn = button;
    popover.classList.add('show');
    positionInfoPopover(popover, button);
}

function hideInfoPopover() {
    const popover = document.getElementById('infoPopover');
    if (popover) {
        popover.classList.remove('show');
    }
    activeInfoBtn = null;
}

function positionInfoPopover(popover, button) {
    if (!popover || !button) return;

    const btnRect = button.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const gap = 8;

    // Prefer placing above the button; fall back to below if there is no room.
    let top = btnRect.top - popoverRect.height - gap;
    if (top < 8) {
        top = btnRect.bottom + gap;
    }
    if (top + popoverRect.height > viewportHeight - 8) {
        // Last resort: clamp into viewport.
        top = Math.max(8, viewportHeight - popoverRect.height - 8);
    }

    // Center horizontally over the button, then clamp into viewport.
    let left = btnRect.left + (btnRect.width / 2) - (popoverRect.width / 2);
    const maxLeft = viewportWidth - popoverRect.width - 8;
    if (left < 8) left = 8;
    if (left > maxLeft) left = Math.max(8, maxLeft);

    popover.style.top = `${Math.round(top)}px`;
    popover.style.left = `${Math.round(left)}px`;
}

function setupInfoPopoverGlobalHandlers() {
    ensureInfoPopover();

    document.addEventListener('click', (event) => {
        const btn = event.target.closest('.info-btn');
        if (btn) {
            event.preventDefault();
            event.stopPropagation();
            // Toggle: if same button, close; otherwise re-open with the new one.
            if (activeInfoBtn === btn) {
                hideInfoPopover();
            } else {
                hideInfoPopover();
                showInfoPopover(btn);
            }
            return;
        }

        // Click outside button and popover should close.
        if (!event.target.closest('.info-popover')) {
            hideInfoPopover();
        }
    }, true);

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && activeInfoBtn) {
            hideInfoPopover();
            event.stopPropagation();
        }
    }, true);

    document.addEventListener('focusin', (event) => {
        const btn = event.target.closest && event.target.closest('.info-btn');
        if (btn) {
            // Only show on keyboard focus, not on programmatic mouse focus duplicates.
            if (activeInfoBtn !== btn) {
                hideInfoPopover();
                showInfoPopover(btn);
            }
            return;
        }

        // Focus moved elsewhere; if not into the popover, hide.
        if (!event.target.closest || !event.target.closest('.info-popover')) {
            if (activeInfoBtn) {
                hideInfoPopover();
            }
        }
    });

    window.addEventListener('scroll', () => {
        if (activeInfoBtn) {
            const popover = document.getElementById('infoPopover');
            if (popover) positionInfoPopover(popover, activeInfoBtn);
        }
    }, true);

    window.addEventListener('resize', () => {
        if (activeInfoBtn) {
            const popover = document.getElementById('infoPopover');
            if (popover) positionInfoPopover(popover, activeInfoBtn);
        }
    });
}

// ---------- Required-field validation helpers ----------

// Returns true when a value should be considered "missing" for a required field.
function isMissingRequiredValue(value) {
    if (value === undefined || value === null) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    return false;
}

// Returns the input class string and an optional error block for required-field UX.
function getRequiredValidation(isRequired, value) {
    const missing = isRequired && isMissingRequiredValue(value);
    return {
        invalidClass: missing ? ' invalid' : '',
        errorHtml: missing ? '<div class="field-error">Required.</div>' : ''
    };
}

// ---------- Chip picker ----------

// Renders a list of selected values as removable chips plus a picker for the rest.
// `addHandler` is an inline JS expression, `removeHandler` builds one per value.
function renderChipPicker({ label, infoPath, pickerId, selected, available, addLabel, addHandler, removeHandler }) {
    const chipsHtml = selected.map((value) => `
        <span class="chip">
            ${formatLabel(value)}
            <button type="button"
                    class="chip-remove"
                    aria-label="Remove ${escapeAttr(formatLabel(value))}"
                    onclick="${escapeAttr(removeHandler(value))}">×</button>
        </span>
    `).join('');

    const remaining = available.filter((value) => !selected.includes(value));

    let pickerHtml = '';
    if (remaining.length > 0) {
        const options = remaining
            .map((value) => `<option value="${escapeAttr(value)}">${formatLabel(value)}</option>`)
            .join('');

        pickerHtml = `
            <div class="chip-picker">
                <select id="${pickerId}" class="field-input chip-picker-select">
                    <option value="">Select...</option>
                    ${options}
                </select>
                <button type="button" class="btn btn-primary chip-add-btn" onclick="${escapeAttr(addHandler)}">${addLabel}</button>
            </div>
        `;
    }

    return `
        <div class="field-group">
            <label class="field-label">${label}${infoBtnHtml(infoPath)}</label>
            <div class="chip-list">${chipsHtml}</div>
            ${pickerHtml}
        </div>
    `;
}

function applySectionDescriptions() {
    for (const target of SECTION_DESCRIPTION_TARGETS) {
        const element = document.getElementById(target.elementId);
        if (!element) continue;

        const desc = getFieldDescription(target.path);
        if (desc && desc.text) {
            element.textContent = desc.text;
            element.style.display = '';
        } else {
            element.textContent = '';
            element.style.display = 'none';
        }
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    await initializeEditor();
});

async function initializeEditor() {
    try {
        await loadSchema();
        defaultConfig = buildDefaultConfig(schema);
        config = JSON.parse(JSON.stringify(defaultConfig));
        renderEditor();
        applySectionDescriptions();
        setupInfoPopoverGlobalHandlers();
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

    if (propertySchema.type === 'boolean') {
        return false;
    }

    // Numbers without a schema default stay unset so the SDK/platform default applies
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
    renderDevice();
    renderPlatforms();
    renderAdvertisement();
    renderCrossPromo();
    renderDailyRewards();
    renderTasks();
    renderAchievements();
    renderSaas();
    renderPayments();
    renderLeaderboards();
    renderNotifications();
    renderVideoPreviews();
    updateRequiredPills();
}

function renderGeneral() {
    const container = document.getElementById('generalContainer');
    if (!container) return;

    container.innerHTML = '';

    const generalFields = [
        'forciblySetPlatformId', 'debug', 'sendAnalyticsEvents',
        'disableLoadingLogo', 'showFullLoadingLogo', 'showLoadingText',
        'remoteConfigUrl', 'remoteConfigTimeout', 'remoteConfigTtl'
    ];

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

    const gameSchema = schema.properties.game;
    if (gameSchema && gameSchema.properties && gameSchema.properties.adaptToSafeArea) {
        const fieldValue = (config.game && config.game.adaptToSafeArea) ?? false;
        html += renderField('game.adaptToSafeArea', 'adaptToSafeArea', gameSchema.properties.adaptToSafeArea, fieldValue, false);
    }

    container.innerHTML = html;
}

function renderPlatformSelect(fieldName, fieldSchema, fieldValue) {
    const label = formatLabel(fieldName);

    // Source platform IDs from the schema so newly added platforms show up automatically
    const resolved = resolveRef(fieldSchema, schema) || {};
    const platformIds = Array.isArray(resolved.enum) ? resolved.enum.slice().sort() : [];

    let options = '<option value="">-</option>';
    for (const platform of platformIds) {
        const selected = fieldValue === platform ? 'selected' : '';
        options += `<option value="${platform}" ${selected}>${formatLabel(platform)}</option>`;
    }

    return `
        <div class="field-group">
            <label for="${fieldName}" class="field-label">${label}${infoBtnHtml(fieldName)}</label>
            <select id="${fieldName}"
                    class="field-input"
                    onchange="updateField('${fieldName}', this.value)">
                ${options}
            </select>
        </div>
    `;
}

function renderDevice() {
    const container = document.getElementById('deviceContainer');
    if (!container) return;

    container.innerHTML = '';

    const deviceSchema = schema.properties.device;
    if (!deviceSchema || !deviceSchema.properties) {
        return;
    }

    if (!config.device) {
        config.device = buildDefaultValue(deviceSchema, schema);
    }

    let html = '';

    // Render useBuiltInOrientationPopup checkbox
    if (deviceSchema.properties.useBuiltInOrientationPopup) {
        const fieldValue = config.device.useBuiltInOrientationPopup ?? false;
        html += renderField(
            'device.useBuiltInOrientationPopup',
            'useBuiltInOrientationPopup',
            deviceSchema.properties.useBuiltInOrientationPopup,
            fieldValue,
            false
        );
    }

    // Render supportedOrientations as checkboxes
    if (deviceSchema.properties.supportedOrientations) {
        const orientations = config.device.supportedOrientations || [];
        html += `
            <div class="field-group">
                <label class="field-label">Supported Orientations${infoBtnHtml('device.supportedOrientations')}</label>
                <div style="display: flex; gap: 20px; margin-top: 5px;">
                    <div class="checkbox-group">
                        <input type="checkbox"
                               id="device.supportedOrientations.landscape"
                               class="checkbox-input"
                               ${orientations.includes('landscape') ? 'checked' : ''}
                               onchange="updateDeviceOrientation('landscape', this.checked)">
                        <label for="device.supportedOrientations.landscape" class="field-label" style="margin-bottom: 0;">Landscape</label>
                    </div>
                    <div class="checkbox-group">
                        <input type="checkbox"
                               id="device.supportedOrientations.portrait"
                               class="checkbox-input"
                               ${orientations.includes('portrait') ? 'checked' : ''}
                               onchange="updateDeviceOrientation('portrait', this.checked)">
                        <label for="device.supportedOrientations.portrait" class="field-label" style="margin-bottom: 0;">Portrait</label>
                    </div>
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

function updateDeviceOrientation(orientation, checked) {
    if (!config.device) {
        config.device = {};
    }

    if (!config.device.supportedOrientations) {
        config.device.supportedOrientations = [];
    }

    const index = config.device.supportedOrientations.indexOf(orientation);

    if (checked && index === -1) {
        config.device.supportedOrientations.push(orientation);
    } else if (!checked && index !== -1) {
        config.device.supportedOrientations.splice(index, 1);
    }

    if (config.device.supportedOrientations.length === 0) {
        delete config.device.supportedOrientations;
    }

    cleanupEmptyObjects(config);
    updateJsonOutput();
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

        const platformDiv = document.createElement('div');
        platformDiv.className = 'platform-item';

        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div class="platform-name">${formatLabel(platformName)}${infoBtnHtml('platforms.' + platformName)}</div>
                <button class="btn btn-danger" style="padding: 4px 12px; font-size: 12px;" onclick="removePlatform('${platformName}')">Remove</button>
            </div>
        `;

        if (platformSchema && platformSchema.properties) {
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

        html += renderPlatformSectionOverrides(platformName);

        platformDiv.innerHTML = html;
        container.appendChild(platformDiv);
    }
}

// Keys of a platform section that are not its own settings: root config sections
// (advertisement, device, crossPromo, ...) overridden for this platform only.
function getPlatformSectionOverrides(platformName) {
    const platformSchema = schema.properties.platforms.properties[platformName];
    const ownFields = (platformSchema && platformSchema.properties) ? Object.keys(platformSchema.properties) : [];
    const platformValue = (config.platforms && config.platforms[platformName]) || {};

    const overrides = {};
    for (const key of Object.keys(platformValue)) {
        if (!ownFields.includes(key)) {
            overrides[key] = platformValue[key];
        }
    }

    return overrides;
}

function renderPlatformSectionOverrides(platformName) {
    const overrides = getPlatformSectionOverrides(platformName);
    const value = Object.keys(overrides).length > 0 ? JSON.stringify(overrides, null, 2) : '';

    return `
        <div class="field-group">
            <label for="platformSectionOverrides_${platformName}" class="field-label">Section Overrides${infoBtnHtml('platforms.overrides')}</label>
            <textarea id="platformSectionOverrides_${platformName}"
                      class="field-input overrides-textarea"
                      rows="4"
                      placeholder='{ "advertisement": { "banner": { "disable": true } } }'
                      onchange="updatePlatformSectionOverrides('${platformName}', this.value)">${escapeAttr(value)}</textarea>
            <div class="field-error" id="platformSectionOverridesError_${platformName}" hidden></div>
        </div>
    `;
}

function updatePlatformSectionOverrides(platformName, rawValue) {
    const errorElement = document.getElementById(`platformSectionOverridesError_${platformName}`);
    const setError = (message) => {
        if (!errorElement) return;
        errorElement.textContent = message;
        errorElement.hidden = message === '';
    };

    const text = rawValue.trim();
    let overrides = {};

    if (text !== '') {
        try {
            overrides = JSON.parse(text);
        } catch (error) {
            setError('Invalid JSON.');
            return;
        }

        if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
            setError('Overrides must be a JSON object.');
            return;
        }
    }

    setError('');

    if (!config.platforms) {
        config.platforms = {};
    }

    const platformValue = config.platforms[platformName] || {};
    for (const key of Object.keys(getPlatformSectionOverrides(platformName))) {
        delete platformValue[key];
    }

    Object.assign(platformValue, overrides);
    config.platforms[platformName] = platformValue;

    updateJsonOutput();
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

    // Derive ad-unit subsections from the schema so future ad units appear automatically
    const adUnitTypes = Object.keys(adSchema.properties).filter((key) => {
        const resolved = resolveRef(adSchema.properties[key], schema);
        return resolved && resolved.properties && resolved.properties.placements;
    });

    let html = `<div class="field-group"><p style="margin-bottom: 10px; color: #34495e; display: inline-flex; align-items: center; gap: 6px;"><b>General Settings</b>${infoBtnHtml('advertisement')}</p>`;

    for (const [fieldName, fieldSchema] of Object.entries(adSchema.properties)) {
        if (adUnitTypes.includes(fieldName) || fieldName === 'advancedBanners') {
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

    for (const adType of adUnitTypes) {
        if (!adSchema.properties[adType]) continue;

        html += `<div class="field-group"><p style="margin-bottom: 10px; color: #34495e; display: inline-flex; align-items: center; gap: 6px;"><b>${formatLabel(adType)}</b>${infoBtnHtml('advertisement.' + adType)}</p>`;

        const adTypeSchema = resolveRef(adSchema.properties[adType], schema);
        if (!config.advertisement[adType]) {
            config.advertisement[adType] = buildDefaultValue(adTypeSchema, schema);
        }

        if (adTypeSchema.properties) {
            for (const [fieldName, fieldSchema] of Object.entries(adTypeSchema.properties)) {
                if (fieldName === 'placements' || fieldName === 'autoShow') {
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

            if (adTypeSchema.properties.autoShow) {
                const autoShowItemSchema = resolveRef(adTypeSchema.properties.autoShow.items, schema) || {};
                html += renderChipPicker({
                    label: 'Auto Show',
                    infoPath: `advertisement.${adType}.autoShow`,
                    pickerId: `${adType}AutoShowPicker`,
                    selected: getAdAutoShow(adType),
                    available: Array.isArray(autoShowItemSchema.enum) ? autoShowItemSchema.enum : [],
                    addLabel: '+ Add event',
                    addHandler: `addAdAutoShowFromPicker('${adType}')`,
                    removeHandler: (value) => `removeAdAutoShow('${adType}', '${value}')`
                });
            }
        }

        html += `<div style="margin-top: 15px;">
            <h4 style="margin-bottom: 10px; color: #34495e; font-size: 14px; display: inline-flex; align-items: center; gap: 6px;">Placements${infoBtnHtml('advertisement.' + adType + '.placements')}</h4>
            <div id="${adType}PlacementsContainer" class="array-section"></div>
            <button class="btn btn-primary" onclick="addPlacement('${adType}')">Add Placement</button>
        </div>`;

        html += '</div>';
    }

    const advancedBannersSchema = resolveRef(adSchema.properties.advancedBanners, schema);
    if (advancedBannersSchema && advancedBannersSchema.properties) {
        html += `<div class="field-group"><p style="margin-bottom: 10px; color: #34495e; display: inline-flex; align-items: center; gap: 6px;"><b>Advanced Banners</b>${infoBtnHtml('advertisement.advancedBanners')}</p>`;

        const advancedBanners = config.advertisement.advancedBanners || {};
        for (const [fieldName, fieldSchema] of Object.entries(advancedBannersSchema.properties)) {
            html += renderField(
                `advertisement.advancedBanners.${fieldName}`,
                fieldName,
                fieldSchema,
                advancedBanners[fieldName] ?? buildDefaultValue(fieldSchema, schema),
                false
            );
        }

        html += `<div style="margin-top: 15px;">
            <h4 style="margin-bottom: 10px; color: #34495e; font-size: 14px; display: inline-flex; align-items: center; gap: 6px;">Placements${infoBtnHtml('advertisement.advancedBanners.placements')}</h4>
            <div id="advancedBannersPlacementsContainer" class="array-section"></div>
            <button class="btn btn-primary" onclick="addAdvancedBannersPlacement()">Add Placement</button>
        </div>`;

        html += '</div>';
    }

    container.innerHTML = html;

    // Render placements for each ad type
    for (const adType of adUnitTypes) {
        if (adSchema.properties[adType]) {
            renderPlacements(adType);
        }
    }

    renderAdvancedBannersPlacements();
}

// ---------- Interstitial auto show ----------

function getAdAutoShow(adType) {
    const adUnit = config.advertisement && config.advertisement[adType];
    return (adUnit && Array.isArray(adUnit.autoShow)) ? adUnit.autoShow.slice() : [];
}

function setAdAutoShow(adType, events) {
    if (!config.advertisement[adType]) {
        config.advertisement[adType] = {};
    }

    if (events.length === 0) {
        delete config.advertisement[adType].autoShow;
    } else {
        config.advertisement[adType].autoShow = events;
    }

    cleanupEmptyObjects(config);
    renderAdvertisement();
    updateJsonOutput();
}

function addAdAutoShowFromPicker(adType) {
    const picker = document.getElementById(`${adType}AutoShowPicker`);
    if (!picker || !picker.value) return;

    const events = getAdAutoShow(adType);
    if (events.includes(picker.value)) return;

    events.push(picker.value);
    setAdAutoShow(adType, events);
}

function removeAdAutoShow(adType, event) {
    setAdAutoShow(adType, getAdAutoShow(adType).filter((item) => item !== event));
}

// ---------- Advanced banners ----------

function getAdvancedBanners() {
    if (!config.advertisement) {
        config.advertisement = {};
    }

    if (!config.advertisement.advancedBanners || typeof config.advertisement.advancedBanners !== 'object') {
        config.advertisement.advancedBanners = {};
    }

    return config.advertisement.advancedBanners;
}

function getAdvancedBannersPlacementNames() {
    return Object.keys(getAdvancedBanners()).filter((key) => !ADVANCED_BANNERS_SETTING_KEYS.includes(key));
}

function getAdvancedBannersConditionNames(placementName) {
    const placement = getAdvancedBanners()[placementName];
    if (!placement || typeof placement !== 'object' || Array.isArray(placement)) return [];

    return Object.keys(placement).filter((key) => !ADVANCED_BANNERS_PLACEMENT_SETTING_KEYS.includes(key));
}

// Resolves a placement by its position in the rendered list.
function resolveAdvancedBannersPlacement(placementIndex) {
    const name = getAdvancedBannersPlacementNames()[placementIndex];
    if (name === undefined) return null;

    const placement = getAdvancedBanners()[name];
    if (!placement || typeof placement !== 'object' || Array.isArray(placement)) return null;

    return { name, placement };
}

// Resolves a condition of a placement by their positions in the rendered lists.
function resolveAdvancedBannersCondition(placementIndex, conditionIndex) {
    const resolved = resolveAdvancedBannersPlacement(placementIndex);
    if (!resolved) return null;

    const conditionName = getAdvancedBannersConditionNames(resolved.name)[conditionIndex];
    if (conditionName === undefined) return null;

    return { ...resolved, conditionName };
}

// Renames a key in place so the surrounding key order is preserved.
function renameObjectKey(obj, oldKey, newKey) {
    const entries = Object.entries(obj).map(([key, value]) => [key === oldKey ? newKey : key, value]);

    Object.keys(obj).forEach((key) => delete obj[key]);
    entries.forEach(([key, value]) => { obj[key] = value; });
}

function buildUniqueKey(existingKeys, base) {
    let index = 1;
    while (existingKeys.includes(`${base}_${index}`)) {
        index += 1;
    }

    return `${base}_${index}`;
}

function renderAdvancedBannersPlacements() {
    const container = document.getElementById('advancedBannersPlacementsContainer');
    if (!container) return;

    container.innerHTML = '';

    const placementSchema = resolveRef(schema.definitions.advancedBannersPlacement, schema);
    const actions = (placementSchema.properties.action && placementSchema.properties.action.enum) || [];

    getAdvancedBannersPlacementNames().forEach((placementName, placementIndex) => {
        const placement = getAdvancedBanners()[placementName] || {};
        const action = placement.action || placementSchema.properties.action.default;

        const placementDiv = document.createElement('div');
        placementDiv.className = 'nested-item';

        const actionOptions = actions
            .map((option) => `<option value="${option}" ${action === option ? 'selected' : ''}>${formatLabel(option)}</option>`)
            .join('');

        let html = `
            <div style="display: flex; gap: 10px; align-items: flex-start;">
                <div style="flex: 1;">
                    <label class="field-label">Placement Name${infoBtnHtml('advertisement.advancedBanners.placementName')}</label>
                    <input type="text"
                           class="field-input"
                           value="${escapeAttr(placementName)}"
                           placeholder="gameplay_started"
                           onchange="renameAdvancedBannersPlacement(${placementIndex}, this.value)">
                </div>
                <div style="flex: 0 0 160px;">
                    <label class="field-label">Action${infoBtnHtml('advertisement.advancedBanners.action')}</label>
                    <select class="field-input" onchange="updateAdvancedBannersAction(${placementIndex}, this.value)">${actionOptions}</select>
                </div>
                <button class="btn btn-danger" onclick="removeAdvancedBannersPlacement(${placementIndex})" style="margin-top: 22px;">Remove</button>
            </div>
        `;

        if (action !== 'hide') {
            html += `
                <div style="margin-top: 12px;">
                    <h4 style="margin-bottom: 8px; color: #34495e; font-size: 13px; display: inline-flex; align-items: center; gap: 6px;">Conditions${infoBtnHtml('advertisement.advancedBanners.condition')}</h4>
                    <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 10px;">
                        ${renderAdvancedBannersConditions(placementIndex, placementName)}
                    </div>
                    <button class="btn btn-primary" onclick="addAdvancedBannersCondition(${placementIndex})" style="font-size: 12px; padding: 6px 12px;">Add Condition</button>
                </div>
            `;
        }

        placementDiv.innerHTML = html;
        container.appendChild(placementDiv);
    });
}

function renderAdvancedBannersConditions(placementIndex, placementName) {
    const placement = getAdvancedBanners()[placementName] || {};

    return getAdvancedBannersConditionNames(placementName).map((conditionName, conditionIndex) => {
        const banners = Array.isArray(placement[conditionName]) ? placement[conditionName] : [];

        const bannersHtml = banners.map((banner, bannerIndex) => {
            const fields = ADVANCED_BANNER_FIELDS.map((field) => {
                const percent = parseFloat(banner[field]);

                return `
                    <div>
                        <label class="field-label" style="margin-bottom: 4px;">${formatLabel(field)}</label>
                        <div class="percent-input">
                            <input type="number"
                                   class="field-input"
                                   step="any"
                                   value="${Number.isNaN(percent) ? '' : percent}"
                                   placeholder="auto"
                                   onchange="updateAdvancedBanner(${placementIndex}, ${conditionIndex}, ${bannerIndex}, '${field}', this.value)">
                            <span class="percent-suffix">%</span>
                        </div>
                    </div>
                `;
            }).join('');

            return `
                <div class="banner-box">
                    <div class="banner-box-grid">${fields}</div>
                    <button class="btn btn-danger" onclick="removeAdvancedBanner(${placementIndex}, ${conditionIndex}, ${bannerIndex})" style="font-size: 11px; padding: 5px 10px; align-self: flex-start;">Remove Banner</button>
                </div>
            `;
        }).join('');

        return `
            <div class="nested-item-inner">
                <div style="display: flex; gap: 10px; align-items: flex-start;">
                    <div style="flex: 1;">
                        <label class="field-label">Condition</label>
                        <input type="text"
                               class="field-input"
                               value="${escapeAttr(conditionName)}"
                               placeholder="mobile:portrait"
                               onchange="renameAdvancedBannersCondition(${placementIndex}, ${conditionIndex}, this.value)">
                    </div>
                    <button class="btn btn-danger" onclick="removeAdvancedBannersCondition(${placementIndex}, ${conditionIndex})" style="margin-top: 22px; font-size: 11px; padding: 5px 10px;">Remove</button>
                </div>
                <h4 style="margin: 10px 0 8px; color: #34495e; font-size: 13px; display: inline-flex; align-items: center; gap: 6px;">Banners${infoBtnHtml('advertisement.advancedBanners.banner')}</h4>
                <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px;">${bannersHtml}</div>
                <button class="btn btn-primary" onclick="addAdvancedBanner(${placementIndex}, ${conditionIndex})" style="font-size: 12px; padding: 6px 12px;">Add Banner</button>
            </div>
        `;
    }).join('');
}

function addAdvancedBannersPlacement() {
    const advancedBanners = getAdvancedBanners();
    const name = buildUniqueKey(Object.keys(advancedBanners), 'placement');

    advancedBanners[name] = { [ADVANCED_BANNERS_DEFAULT_CONDITION]: [] };
    renderAdvancedBannersPlacements();
    updateJsonOutput();
}

function removeAdvancedBannersPlacement(placementIndex) {
    const resolved = resolveAdvancedBannersPlacement(placementIndex);
    if (!resolved) return;

    delete getAdvancedBanners()[resolved.name];
    renderAdvancedBannersPlacements();
    updateJsonOutput();
}

function renameAdvancedBannersPlacement(placementIndex, newName) {
    const advancedBanners = getAdvancedBanners();
    const resolved = resolveAdvancedBannersPlacement(placementIndex);
    if (!resolved) return;

    const name = newName.trim();
    const isTaken = name === '' || name in advancedBanners || ADVANCED_BANNERS_SETTING_KEYS.includes(name);

    if (name !== resolved.name && !isTaken) {
        renameObjectKey(advancedBanners, resolved.name, name);
        updateJsonOutput();
    }

    renderAdvancedBannersPlacements();
}

function updateAdvancedBannersAction(placementIndex, value) {
    const resolved = resolveAdvancedBannersPlacement(placementIndex);
    if (!resolved) return;

    resolved.placement.action = value;
    renderAdvancedBannersPlacements();
    updateJsonOutput();
}

function addAdvancedBannersCondition(placementIndex) {
    const resolved = resolveAdvancedBannersPlacement(placementIndex);
    if (!resolved) return;

    const { placement } = resolved;
    const name = ADVANCED_BANNERS_DEFAULT_CONDITION in placement
        ? buildUniqueKey(Object.keys(placement), 'condition')
        : ADVANCED_BANNERS_DEFAULT_CONDITION;

    placement[name] = [];
    renderAdvancedBannersPlacements();
    updateJsonOutput();
}

function removeAdvancedBannersCondition(placementIndex, conditionIndex) {
    const resolved = resolveAdvancedBannersCondition(placementIndex, conditionIndex);
    if (!resolved) return;

    delete resolved.placement[resolved.conditionName];
    renderAdvancedBannersPlacements();
    updateJsonOutput();
}

function renameAdvancedBannersCondition(placementIndex, conditionIndex, newName) {
    const resolved = resolveAdvancedBannersCondition(placementIndex, conditionIndex);
    if (!resolved) return;

    const { placement, conditionName } = resolved;
    const name = newName.trim();
    const isTaken = name === '' || name in placement || ADVANCED_BANNERS_PLACEMENT_SETTING_KEYS.includes(name);

    if (name !== conditionName && !isTaken) {
        renameObjectKey(placement, conditionName, name);
        updateJsonOutput();
    }

    renderAdvancedBannersPlacements();
}

function addAdvancedBanner(placementIndex, conditionIndex) {
    const resolved = resolveAdvancedBannersCondition(placementIndex, conditionIndex);
    if (!resolved) return;

    const { placement, conditionName } = resolved;
    if (!Array.isArray(placement[conditionName])) {
        placement[conditionName] = [];
    }

    placement[conditionName].push({});
    renderAdvancedBannersPlacements();
    updateJsonOutput();
}

function removeAdvancedBanner(placementIndex, conditionIndex, bannerIndex) {
    const resolved = resolveAdvancedBannersCondition(placementIndex, conditionIndex);
    if (!resolved || !Array.isArray(resolved.placement[resolved.conditionName])) return;

    resolved.placement[resolved.conditionName].splice(bannerIndex, 1);
    renderAdvancedBannersPlacements();
    updateJsonOutput();
}

// Banner boxes are only expressed as a percentage of the screen, so the entered
// number is always stored with a % unit.
function updateAdvancedBanner(placementIndex, conditionIndex, bannerIndex, field, rawValue) {
    const resolved = resolveAdvancedBannersCondition(placementIndex, conditionIndex);
    if (!resolved) return;

    const banner = Array.isArray(resolved.placement[resolved.conditionName])
        && resolved.placement[resolved.conditionName][bannerIndex];
    if (!banner) return;

    const percent = parseFloat(rawValue);
    if (Number.isNaN(percent)) {
        delete banner[field];
    } else {
        banner[field] = `${percent}%`;
    }

    updateJsonOutput();
}

function getKnownPlatformIds() {
    return getAllPlatformIds().sort();
}

function renderSaas() {
    const container = document.getElementById('saasContainer');
    if (!container) return;

    container.innerHTML = '';

    const saasSchema = schema.properties.saas;
    if (!saasSchema || !saasSchema.properties) {
        return;
    }

    // Read current values without forcing config.saas to exist on disk
    const saasValue = config.saas || {};
    const baseUrl = saasValue.baseUrl || '';
    const publicToken = saasValue.publicToken || '';

    let html = '';

    // Base URL
    html += `
        <div class="field-group">
            <label for="saas.baseUrl" class="field-label">Base Url${infoBtnHtml('saas.baseUrl')}</label>
            <input type="text"
                   id="saas.baseUrl"
                   class="field-input"
                   value="${escapeAttr(baseUrl)}"
                   onchange="updateField('saas.baseUrl', this.value)">
        </div>
    `;

    // Public Token
    html += `
        <div class="field-group">
            <label for="saas.publicToken" class="field-label">Public Token${infoBtnHtml('saas.publicToken')}</label>
            <input type="text"
                   id="saas.publicToken"
                   class="field-input"
                   value="${escapeAttr(publicToken)}"
                   onchange="updateField('saas.publicToken', this.value)">
        </div>
    `;

    // Per-feature SaaS platforms — chip pickers
    const knownIds = getKnownPlatformIds();

    for (const feature of SAAS_FEATURES) {
        if (!saasSchema.properties[feature]) continue;

        const selectedPlatforms = (saasValue[feature] && Array.isArray(saasValue[feature].platforms))
            ? saasValue[feature].platforms.slice()
            : [];

        html += renderChipPicker({
            label: `${formatLabel(feature)} Platforms`,
            infoPath: `saas.${feature}.platforms`,
            pickerId: `saasPlatformPicker_${feature}`,
            selected: selectedPlatforms,
            available: knownIds,
            addLabel: '+ Add platform',
            addHandler: `addSaasFeaturePlatformFromPicker('${feature}')`,
            removeHandler: (id) => `removeSaasFeaturePlatform('${feature}', '${id}')`
        });
    }

    container.innerHTML = html;
}

function getSaasFeaturePlatforms(feature) {
    return (config.saas && config.saas[feature] && Array.isArray(config.saas[feature].platforms))
        ? config.saas[feature].platforms.slice()
        : [];
}

function setSaasFeaturePlatforms(feature, arr) {
    if (!Array.isArray(arr) || arr.length === 0) {
        if (config.saas && config.saas[feature]) {
            delete config.saas[feature].platforms;
        }
    } else {
        if (!config.saas) config.saas = {};
        if (!config.saas[feature]) config.saas[feature] = {};
        config.saas[feature].platforms = arr;
    }

    cleanupEmptyObjects(config);
    updateJsonOutput();
    renderSaas();
}

function addSaasFeaturePlatformFromPicker(feature) {
    const picker = document.getElementById(`saasPlatformPicker_${feature}`);
    if (!picker || !picker.value) return;

    const current = getSaasFeaturePlatforms(feature);
    if (current.includes(picker.value)) return;

    current.push(picker.value);
    setSaasFeaturePlatforms(feature, current);
}

function removeSaasFeaturePlatform(feature, platformId) {
    const next = getSaasFeaturePlatforms(feature).filter((id) => id !== platformId);
    setSaasFeaturePlatforms(feature, next);
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

        const idValidation = getRequiredValidation(true, payment.id);
        let html = `
            <div style="display: flex; gap: 10px; align-items: center;">
                <div style="flex: 1;">
                    <label class="field-label">Product ID *${infoBtnHtml('payments.id')}</label>
                    <input type="text"
                           class="field-input${idValidation.invalidClass}"
                           value="${escapeAttr(payment.id || '')}"
                           onchange="updatePaymentField(${index}, 'id', this.value)"
                           placeholder="Product ID">
                    ${idValidation.errorHtml}
                </div>
                <button class="btn btn-danger" onclick="removePayment(${index})" style="margin-top: 20px;">Remove</button>
            </div>
        `;

        html += `
            <div style="margin-top: 10px;">
                <h4 style="margin-bottom: 10px; color: #34495e; font-size: 13px; display: inline-flex; align-items: center; gap: 6px;">Platform Configurations${infoBtnHtml('payments')}</h4>
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
                <h4 style="margin: 0; color: #2c3e50; font-size: 14px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">${formatLabel(platformName)}${infoBtnHtml('payments.' + platformName)}</h4>
                <button class="btn btn-danger" onclick="removePaymentPlatform(${paymentIndex}, '${platformName}')" style="font-size: 11px; padding: 5px 10px;">Remove</button>
            </div>
        `;

        if (platformSchema.properties) {
            for (const [fieldName, fieldSchema] of Object.entries(platformSchema.properties)) {
                const fieldPath = `${platformName}.${fieldName}`;
                const fieldValue = payment[platformName]?.[fieldName] ?? '';
                const isRequired = platformSchema.required && platformSchema.required.includes(fieldName);

                html += `<div style="margin-bottom: 4px;">
                    <label style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; margin-bottom: 4px; color: #555;">
                        ${formatLabel(fieldName)}${isRequired ? ' *' : ''}${infoBtnHtml('payments.' + platformName + '.' + fieldName)}
                    </label>
                    ${renderFieldInput(fieldPath, fieldSchema, fieldValue, paymentIndex, isRequired)}
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
    const info = infoBtnHtml(path);

    if (Array.isArray(fieldSchema.enum)) {
        const v = getRequiredValidation(isRequired, fieldValue);
        let options = isRequired ? '' : '<option value="">-</option>';
        for (const option of fieldSchema.enum) {
            const selected = fieldValue === option ? 'selected' : '';
            options += `<option value="${escapeAttr(option)}" ${selected}>${formatLabel(option)}</option>`;
        }
        return `
            <div class="field-group">
                <label for="${path}" class="field-label">${label}${requiredMark}${info}</label>
                <select id="${path}"
                        class="field-input${v.invalidClass}"
                        onchange="updateField('${path}', this.value)">
                    ${options}
                </select>
                ${v.errorHtml}
            </div>
        `;
    } else if (fieldSchema.type === 'boolean') {
        return `
            <div class="field-group">
                <div class="checkbox-group">
                    <input type="checkbox"
                           id="${path}"
                           class="checkbox-input"
                           ${fieldValue ? 'checked' : ''}
                           onchange="updateField('${path}', this.checked)">
                    <label for="${path}" class="field-label">${label}${requiredMark}${info}</label>
                </div>
            </div>
        `;
    } else if (fieldSchema.type === 'string') {
        const v = getRequiredValidation(isRequired, fieldValue);
        return `
            <div class="field-group">
                <label for="${path}" class="field-label">${label}${requiredMark}${info}</label>
                <input type="text"
                       id="${path}"
                       class="field-input${v.invalidClass}"
                       value="${escapeAttr(fieldValue || '')}"
                       onchange="updateField('${path}', this.value)">
                ${v.errorHtml}
            </div>
        `;
    } else if (fieldSchema.type === 'number') {
        const v = getRequiredValidation(isRequired, fieldValue);
        return `
            <div class="field-group">
                <label for="${path}" class="field-label">${label}${requiredMark}${info}</label>
                <input type="number"
                       id="${path}"
                       class="field-input${v.invalidClass}"
                       value="${typeof fieldValue === 'number' ? fieldValue : ''}"
                       onchange="updateNumberField('${path}', this.value)">
                ${v.errorHtml}
            </div>
        `;
    }

    return '';
}

function renderFieldInput(fieldPath, fieldSchema, fieldValue, paymentIndex, isRequired) {
    const fullPath = `payments.${paymentIndex}.${fieldPath}`;
    const v = getRequiredValidation(isRequired, fieldValue);

    if (fieldSchema.type === 'string') {
        return `<input type="text"
                       class="field-input${v.invalidClass}"
                       value="${escapeAttr(fieldValue || '')}"
                       onchange="updateField('${fullPath}', this.value)"
                       style="width: 100%;">${v.errorHtml}`;
    } else if (fieldSchema.type === 'number') {
        return `<input type="number"
                       class="field-input${v.invalidClass}"
                       value="${typeof fieldValue === 'number' ? fieldValue : ''}"
                       onchange="updateNumberField('${fullPath}', this.value)"
                       style="width: 100%;">${v.errorHtml}`;
    } else if (fieldSchema.type === 'boolean') {
        return `<input type="checkbox"
                       class="checkbox-input"
                       ${fieldValue ? 'checked' : ''}
                       onchange="updateField('${fullPath}', this.checked)">`;
    }

    return '';
}

// Number inputs: empty input removes the field, invalid input is ignored
function updateNumberField(path, rawValue) {
    if (rawValue === '') {
        updateField(path, null);
        return;
    }

    const parsed = Number(rawValue);
    if (Number.isNaN(parsed)) {
        return;
    }

    updateField(path, parsed);
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

    // Platform entries survive while empty: the user added them explicitly and
    // the exported config drops empty objects anyway.
    const keepEmpty = obj === config.platforms;

    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[key];

            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                cleanupEmptyObjects(value);

                if (!keepEmpty && Object.keys(value).length === 0) {
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

        const lbIdValidation = getRequiredValidation(true, leaderboard.id);
        let html = `
            <div style="display: flex; gap: 10px; align-items: center;">
                <div style="flex: 1;">
                    <label class="field-label">Leaderboard ID *${infoBtnHtml('leaderboards.id')}</label>
                    <input type="text"
                           class="field-input${lbIdValidation.invalidClass}"
                           value="${escapeAttr(leaderboard.id || '')}"
                           onchange="updateLeaderboardField(${index}, 'id', this.value)"
                           placeholder="Leaderboard ID">
                    ${lbIdValidation.errorHtml}
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
                        <label for="leaderboard_${index}_isMain" class="field-label">Is Main${infoBtnHtml('leaderboards.isMain')}</label>
                    </div>
                </div>
            `;
        }

        html += `
            <div style="margin-top: 10px;">
                <h4 style="margin-bottom: 10px; color: #34495e; font-size: 13px; display: inline-flex; align-items: center; gap: 6px;">Platform Overrides${infoBtnHtml('leaderboards')}</h4>
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
                <div style="font-size: 13px; font-weight: 600; color: #2c3e50; display: inline-flex; align-items: center; gap: 6px;">${formatLabel(platformName)}${infoBtnHtml('leaderboards.' + platformName)}</div>
            </div>
            <div style="flex: 0.6;">
                <label style="display: block; font-size: 11px; font-weight: 500; color: #7f8c8d; margin-bottom: 4px;">Override ID</label>
                <input type="text"
                       class="field-input"
                       value="${escapeAttr(value || '')}"
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

// ---------- Notifications ----------

// Platform mapping keys of a notification item, sourced from the schema
function getNotificationPlatformKeys(notificationItemSchema) {
    return Object.keys(notificationItemSchema.properties).filter((key) => key !== 'id');
}

function getNotificationItemSchema() {
    return resolveRef(schema.properties.notifications.items, schema);
}

function renderNotifications() {
    renderNotificationsSettings();

    const container = document.getElementById('notificationsContainer');
    if (!container) return;

    container.innerHTML = '';

    if (!Array.isArray(config.notifications)) {
        config.notifications = [];
    }

    const notificationItemSchema = getNotificationItemSchema();
    const platformKeys = getNotificationPlatformKeys(notificationItemSchema);

    config.notifications.forEach((notification, index) => {
        const notificationDiv = document.createElement('div');
        notificationDiv.className = 'array-item';
        notificationDiv.style.flexDirection = 'column';
        notificationDiv.style.alignItems = 'stretch';
        notificationDiv.style.gap = '15px';
        notificationDiv.style.padding = '15px';
        notificationDiv.style.border = '1px solid #ddd';
        notificationDiv.style.borderRadius = '6px';
        notificationDiv.style.background = '#fafafa';

        const idValidation = getRequiredValidation(true, notification.id);
        let html = `
            <div style="display: flex; gap: 10px; align-items: center;">
                <div style="flex: 1;">
                    <label class="field-label">Notification ID *${infoBtnHtml('notifications.id')}</label>
                    <input type="text"
                           class="field-input${idValidation.invalidClass}"
                           value="${escapeAttr(notification.id || '')}"
                           onchange="updateNotificationField(${index}, 'id', this.value)"
                           placeholder="Notification ID">
                    ${idValidation.errorHtml}
                </div>
                <button class="btn btn-danger" onclick="removeNotification(${index})" style="margin-top: 20px;">Remove</button>
            </div>
        `;

        if (platformKeys.length > 0) {
            const rows = platformKeys
                .map((platformName) => renderNotificationPlatformRow(index, platformName, notification[platformName]))
                .join('');

            html += `
                <div style="margin-top: 10px;">
                    <h4 style="margin-bottom: 10px; color: #34495e; font-size: 13px; display: inline-flex; align-items: center; gap: 6px;">Platform Mapping${infoBtnHtml('notifications')}</h4>
                    <div style="display: flex; flex-direction: column; gap: 10px;">${rows}</div>
                </div>
            `;
        }

        notificationDiv.innerHTML = html;
        container.appendChild(notificationDiv);
    });
}

function renderNotificationsSettings() {
    const container = document.getElementById('notificationsSettingsContainer');
    if (!container) return;

    const fieldSchema = schema.properties.disableAutoNotifications;
    if (!fieldSchema) {
        container.innerHTML = '';
        return;
    }

    const fieldValue = config.disableAutoNotifications ?? false;
    container.innerHTML = renderField('disableAutoNotifications', 'disableAutoNotifications', fieldSchema, fieldValue, false);
}

// A platform maps a notification either to its own id or, on MSN, to a numeric type
function renderNotificationPlatformRow(index, platformName, value) {
    const platformSchema = getNotificationItemSchema().properties[platformName];
    const isNumber = platformSchema.type === 'integer' || platformSchema.type === 'number';

    let inputHtml;
    if (isNumber) {
        const min = platformSchema.minimum;
        const max = platformSchema.maximum;
        const placeholder = (min !== undefined && max !== undefined) ? `${min}-${max}` : 'Notification type';
        inputHtml = `
            <input type="number"
                   class="field-input"
                   value="${typeof value === 'number' ? value : ''}"
                   ${min !== undefined ? `min="${min}"` : ''}
                   ${max !== undefined ? `max="${max}"` : ''}
                   onchange="updateNotificationPlatformValue(${index}, '${platformName}', this.value)"
                   placeholder="${placeholder}"
                   style="font-size: 12px; padding: 6px 10px;">
        `;
    } else {
        inputHtml = `
            <input type="text"
                   class="field-input"
                   value="${escapeAttr(value || '')}"
                   onchange="updateNotificationPlatformValue(${index}, '${platformName}', this.value)"
                   placeholder="Platform ID"
                   style="font-size: 12px; padding: 6px 10px;">
        `;
    }

    return `
        <div style="display: flex; gap: 10px; align-items: center; padding: 8px; background: white; border-radius: 4px; border: 1px solid #e0e0e0;">
            <div style="flex: 0.4;">
                <label style="display: block; font-size: 11px; font-weight: 500; color: #7f8c8d; margin-bottom: 4px;">Platform</label>
                <div style="font-size: 13px; font-weight: 600; color: #2c3e50; display: inline-flex; align-items: center; gap: 6px;">${formatLabel(platformName)}${infoBtnHtml('notifications.' + platformName)}</div>
            </div>
            <div style="flex: 0.6;">
                <label style="display: block; font-size: 11px; font-weight: 500; color: #7f8c8d; margin-bottom: 4px;">${isNumber ? 'Notification Type' : 'Notification ID'}</label>
                ${inputHtml}
            </div>
        </div>
    `;
}

function addNotification() {
    if (!Array.isArray(config.notifications)) {
        config.notifications = [];
    }

    config.notifications.push(buildDefaultValue(getNotificationItemSchema(), schema));
    renderNotifications();
    updateJsonOutput();
}

function removeNotification(index) {
    if (!Array.isArray(config.notifications)) return;

    config.notifications.splice(index, 1);
    renderNotifications();
    updateJsonOutput();
}

function updateNotificationField(index, field, value) {
    const notification = Array.isArray(config.notifications) && config.notifications[index];
    if (!notification) return;

    notification[field] = value;
    renderNotifications();
    updateJsonOutput();
}

function updateNotificationPlatformValue(index, platformName, rawValue) {
    const notification = Array.isArray(config.notifications) && config.notifications[index];
    if (!notification) return;

    const platformSchema = getNotificationItemSchema().properties[platformName];
    const isNumber = platformSchema.type === 'integer' || platformSchema.type === 'number';

    if (rawValue.trim() === '') {
        delete notification[platformName];
    } else if (isNumber) {
        const parsed = Number(rawValue);
        if (Number.isNaN(parsed)) return;
        notification[platformName] = parsed;
    } else {
        notification[platformName] = rawValue;
    }

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

        const placementIdValidation = getRequiredValidation(true, placement.id);
        let html = `
            <div style="display: flex; gap: 10px; align-items: center;">
                <div style="flex: 1;">
                    <label class="field-label">Placement ID *${infoBtnHtml('adPlacement.id')}</label>
                    <input type="text"
                           class="field-input${placementIdValidation.invalidClass}"
                           value="${escapeAttr(placement.id || '')}"
                           onchange="updatePlacementField('${adType}', ${index}, 'id', this.value)"
                           placeholder="Placement ID">
                    ${placementIdValidation.errorHtml}
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

    const placementPlatformIds = getAdPlacementPlatformIds();

    for (const [key, value] of Object.entries(placement)) {
        if (key === 'id') continue;
        if (!placementPlatformIds.includes(key)) continue;

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
                <div style="font-size: 13px; font-weight: 600; color: #2c3e50; display: inline-flex; align-items: center; gap: 6px;">${formatLabel(key)}${infoBtnHtml('adPlacement.' + key)}</div>
            </div>
            <div style="flex: 0.6;">
                <label style="display: block; font-size: 11px; font-weight: 500; color: #7f8c8d; margin-bottom: 4px;">Override ID</label>
                <input type="text"
                       class="field-input"
                       value="${escapeAttr(value || '')}"
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

    const placementPlatformIds = getAdPlacementPlatformIds();
    const alreadyAddedPlatforms = Object.keys(placement).filter(key => key !== 'id' && placementPlatformIds.includes(key));

    const filteredPlatforms = placementPlatformIds.filter(platformName => {
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

// ---------- Video Previews ----------

function renderVideoPreviews() {
    const container = document.getElementById('videoPreviewsContainer');
    if (!container) return;

    container.innerHTML = '';

    if (!Array.isArray(config.videoPreviews)) {
        config.videoPreviews = [];
    }

    config.videoPreviews.forEach((preview, index) => {
        const imageValidation = getRequiredValidation(true, preview.image);
        const videoIdValidation = getRequiredValidation(true, preview.videoId);

        const previewDiv = document.createElement('div');
        previewDiv.className = 'array-item';
        previewDiv.style.alignItems = 'flex-start';
        previewDiv.innerHTML = `
            <div style="flex: 1;">
                <label class="field-label">Image *${infoBtnHtml('videoPreviews.image')}</label>
                <input type="text"
                       class="field-input${imageValidation.invalidClass}"
                       value="${escapeAttr(preview.image || '')}"
                       placeholder="video-previews/preview.png"
                       onchange="updateVideoPreview(${index}, 'image', this.value)">
                ${imageValidation.errorHtml}
            </div>
            <div style="flex: 1;">
                <label class="field-label">Video Id *${infoBtnHtml('videoPreviews.videoId')}</label>
                <input type="text"
                       class="field-input${videoIdValidation.invalidClass}"
                       value="${escapeAttr(preview.videoId || '')}"
                       placeholder="YouTube video id"
                       onchange="updateVideoPreview(${index}, 'videoId', this.value)">
                ${videoIdValidation.errorHtml}
            </div>
            <button class="btn btn-danger" onclick="removeVideoPreview(${index})" style="margin-top: 22px;">Remove</button>
        `;

        container.appendChild(previewDiv);
    });
}

function addVideoPreview() {
    if (!Array.isArray(config.videoPreviews)) {
        config.videoPreviews = [];
    }

    config.videoPreviews.push({ image: '', videoId: '' });
    renderVideoPreviews();
    updateJsonOutput();
}

function removeVideoPreview(index) {
    if (!Array.isArray(config.videoPreviews)) return;

    config.videoPreviews.splice(index, 1);
    renderVideoPreviews();
    updateJsonOutput();
}

function updateVideoPreview(index, field, value) {
    const preview = Array.isArray(config.videoPreviews) && config.videoPreviews[index];
    if (!preview) return;

    preview[field] = value;
    renderVideoPreviews();
    updateJsonOutput();
}

// ---------- Cross Promo ----------

function renderCrossPromo() {
    const container = document.getElementById('crossPromoContainer');
    if (!container) return;

    container.innerHTML = '';

    const cpSchema = schema.properties.crossPromo;
    if (!cpSchema || !cpSchema.properties) return;

    const crossPromo = config.crossPromo || {};

    let html = '';
    html += renderField('crossPromo.title', 'title', cpSchema.properties.title, crossPromo.title || '', false);
    html += renderField('crossPromo.source', 'source', cpSchema.properties.source, crossPromo.source || cpSchema.properties.source.default || '', false);
    html += `
        <div class="field-group">
            <label class="field-label">Games${infoBtnHtml('crossPromo.games')}</label>
            <div class="array-section" id="crossPromoGamesContainer"></div>
            <button class="btn btn-primary" onclick="addCrossPromoGame()">Add Game</button>
        </div>
    `;
    container.innerHTML = html;

    renderCrossPromoGames();
}

function renderCrossPromoGames() {
    const container = document.getElementById('crossPromoGamesContainer');
    if (!container) return;

    container.innerHTML = '';

    const games = (config.crossPromo && Array.isArray(config.crossPromo.games)) ? config.crossPromo.games : [];

    games.forEach((game, index) => {
        const gameDiv = document.createElement('div');
        gameDiv.className = 'array-item';
        gameDiv.style.flexDirection = 'column';
        gameDiv.style.alignItems = 'stretch';
        gameDiv.style.gap = '10px';

        const urlValidation = getRequiredValidation(true, game.url);
        gameDiv.innerHTML = `
            <div style="display: flex; gap: 10px; align-items: center;">
                <div style="flex: 1;">
                    <label class="field-label">Url *${infoBtnHtml('crossPromo.games.url')}</label>
                    <input type="text"
                           class="field-input${urlValidation.invalidClass}"
                           value="${escapeAttr(game.url || '')}"
                           onchange="updateCrossPromoGame(${index}, 'url', this.value)"
                           placeholder="https://...">
                    ${urlValidation.errorHtml}
                </div>
                <button class="btn btn-danger" onclick="removeCrossPromoGame(${index})" style="margin-top: 20px;">Remove</button>
            </div>
            <div style="display: flex; gap: 10px;">
                <div style="flex: 1;">
                    <label class="field-label">Name${infoBtnHtml('crossPromo.games.name')}</label>
                    <input type="text"
                           class="field-input"
                           value="${escapeAttr(game.name || '')}"
                           onchange="updateCrossPromoGame(${index}, 'name', this.value)">
                </div>
                <div style="flex: 1;">
                    <label class="field-label">Icon${infoBtnHtml('crossPromo.games.icon')}</label>
                    <input type="text"
                           class="field-input"
                           value="${escapeAttr(game.icon || '')}"
                           onchange="updateCrossPromoGame(${index}, 'icon', this.value)">
                </div>
            </div>
        `;
        container.appendChild(gameDiv);
    });
}

function addCrossPromoGame() {
    if (!config.crossPromo) config.crossPromo = {};
    if (!Array.isArray(config.crossPromo.games)) config.crossPromo.games = [];

    config.crossPromo.games.push({ url: '' });
    renderCrossPromoGames();
    updateJsonOutput();
}

function removeCrossPromoGame(index) {
    if (!config.crossPromo || !Array.isArray(config.crossPromo.games)) return;

    config.crossPromo.games.splice(index, 1);
    renderCrossPromoGames();
    updateJsonOutput();
}

function updateCrossPromoGame(index, field, value) {
    const game = config.crossPromo && Array.isArray(config.crossPromo.games) && config.crossPromo.games[index];
    if (!game) return;

    if (value && value.trim() !== '') {
        game[field] = value;
    } else if (field === 'url') {
        game.url = '';
    } else {
        delete game[field];
    }

    renderCrossPromoGames();
    updateJsonOutput();
}

// ---------- Daily Rewards ----------

function renderDailyRewards() {
    const container = document.getElementById('dailyRewardsContainer');
    if (!container) return;

    container.innerHTML = '';

    const drSchema = schema.properties.dailyRewards;
    if (!drSchema || !drSchema.properties) return;

    const dailyRewards = config.dailyRewards || {};

    let html = `
        <div class="field-group">
            <label class="field-label">Rewards *${infoBtnHtml('dailyRewards.rewards')}</label>
            <div class="array-section" id="dailyRewardsListContainer"></div>
            <button class="btn btn-primary" onclick="addDailyReward()">Add Reward</button>
        </div>
    `;
    html += renderField('dailyRewards.cycle', 'cycle', drSchema.properties.cycle, dailyRewards.cycle ?? true, false);
    html += renderField('dailyRewards.resetOnMiss', 'resetOnMiss', drSchema.properties.resetOnMiss, dailyRewards.resetOnMiss ?? true, false);

    container.innerHTML = html;

    renderDailyRewardsList();
}

function renderDailyRewardsList() {
    const container = document.getElementById('dailyRewardsListContainer');
    if (!container) return;

    container.innerHTML = '';

    const rewards = (config.dailyRewards && Array.isArray(config.dailyRewards.rewards)) ? config.dailyRewards.rewards : [];

    rewards.forEach((reward, index) => {
        const v = getRequiredValidation(true, reward);
        const rewardDiv = document.createElement('div');
        rewardDiv.className = 'array-item';
        rewardDiv.innerHTML = `
            <span style="flex: 0 0 60px; font-size: 12px; font-weight: 600; color: #7f8c8d;">Day ${index + 1}</span>
            <input type="text"
                   class="array-input${v.invalidClass}"
                   value="${escapeAttr(reward || '')}"
                   onchange="updateDailyReward(${index}, this.value)"
                   placeholder="Reward ID">
            <button class="btn btn-danger" onclick="removeDailyReward(${index})" style="font-size: 11px; padding: 5px 10px;">Remove</button>
        `;
        container.appendChild(rewardDiv);
    });
}

function addDailyReward() {
    if (!config.dailyRewards) config.dailyRewards = {};
    if (!Array.isArray(config.dailyRewards.rewards)) config.dailyRewards.rewards = [];

    config.dailyRewards.rewards.push('');
    renderDailyRewardsList();
    updateJsonOutput();
}

function removeDailyReward(index) {
    if (!config.dailyRewards || !Array.isArray(config.dailyRewards.rewards)) return;

    config.dailyRewards.rewards.splice(index, 1);
    renderDailyRewardsList();
    updateJsonOutput();
}

function updateDailyReward(index, value) {
    if (!config.dailyRewards || !Array.isArray(config.dailyRewards.rewards)) return;

    config.dailyRewards.rewards[index] = value;
    renderDailyRewardsList();
    updateJsonOutput();
}

// ---------- Tasks ----------

function renderTasks() {
    const container = document.getElementById('tasksContainer');
    if (!container) return;

    container.innerHTML = '';

    if (!config.tasks) {
        config.tasks = [];
    }

    const groupSchema = resolveRef(schema.properties.tasks.items, schema);
    const typeOptions = (groupSchema.properties.type && groupSchema.properties.type.enum) || [];

    config.tasks.forEach((group, groupIndex) => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'array-item';
        groupDiv.style.flexDirection = 'column';
        groupDiv.style.alignItems = 'stretch';
        groupDiv.style.gap = '15px';
        groupDiv.style.padding = '15px';
        groupDiv.style.border = '1px solid #ddd';
        groupDiv.style.borderRadius = '6px';
        groupDiv.style.background = '#fafafa';

        const idValidation = getRequiredValidation(true, group.id);
        let options = '';
        for (const option of typeOptions) {
            options += `<option value="${option}" ${group.type === option ? 'selected' : ''}>${formatLabel(option)}</option>`;
        }

        groupDiv.innerHTML = `
            <div style="display: flex; gap: 10px; align-items: flex-start;">
                <div style="flex: 1;">
                    <label class="field-label">Group ID *${infoBtnHtml('tasks.id')}</label>
                    <input type="text"
                           class="field-input${idValidation.invalidClass}"
                           value="${escapeAttr(group.id || '')}"
                           onchange="updateTaskGroupField(${groupIndex}, 'id', this.value)"
                           placeholder="Group ID">
                    ${idValidation.errorHtml}
                </div>
                <div style="flex: 1;">
                    <label class="field-label">Type *${infoBtnHtml('tasks.type')}</label>
                    <select class="field-input" onchange="updateTaskGroupField(${groupIndex}, 'type', this.value)">${options}</select>
                </div>
                <button class="btn btn-danger" onclick="removeTaskGroup(${groupIndex})" style="margin-top: 22px;">Remove</button>
            </div>
            <div>
                <h4 style="margin-bottom: 10px; color: #34495e; font-size: 13px; display: inline-flex; align-items: center; gap: 6px;">Tasks${infoBtnHtml('tasks.items')}</h4>
                <div id="task_group_${groupIndex}_items" style="display: flex; flex-direction: column; gap: 10px;"></div>
                <button class="btn btn-primary" onclick="addTaskItem(${groupIndex})" style="margin-top: 10px; font-size: 12px; padding: 6px 12px;">Add Task</button>
            </div>
        `;

        container.appendChild(groupDiv);
        renderTaskItems(groupIndex);
    });
}

function renderTaskItems(groupIndex) {
    const group = config.tasks[groupIndex];
    const container = document.getElementById(`task_group_${groupIndex}_items`);
    if (!container || !group) return;

    container.innerHTML = '';

    (group.items || []).forEach((item, itemIndex) => {
        const itemDiv = document.createElement('div');
        itemDiv.style.display = 'flex';
        itemDiv.style.flexDirection = 'column';
        itemDiv.style.gap = '10px';
        itemDiv.style.padding = '12px';
        itemDiv.style.background = 'white';
        itemDiv.style.borderRadius = '6px';
        itemDiv.style.border = '1px solid #e0e0e0';

        const idValidation = getRequiredValidation(true, item.id);
        itemDiv.innerHTML = `
            <div style="display: flex; gap: 10px; align-items: center;">
                <div style="flex: 1;">
                    <label class="field-label">Task ID *${infoBtnHtml('tasks.items.id')}</label>
                    <input type="text"
                           class="field-input${idValidation.invalidClass}"
                           value="${escapeAttr(item.id || '')}"
                           onchange="updateTaskItemId(${groupIndex}, ${itemIndex}, this.value)"
                           placeholder="Task ID">
                    ${idValidation.errorHtml}
                </div>
                <button class="btn btn-danger" onclick="removeTaskItem(${groupIndex}, ${itemIndex})" style="margin-top: 20px; font-size: 11px; padding: 5px 10px;">Remove</button>
            </div>
            ${renderTaskEntriesHtml(groupIndex, itemIndex, 'targets')}
            ${renderTaskEntriesHtml(groupIndex, itemIndex, 'rewards')}
        `;

        container.appendChild(itemDiv);
    });
}

function renderTaskEntriesHtml(groupIndex, itemIndex, kind) {
    const item = config.tasks[groupIndex].items[itemIndex];
    const entries = Array.isArray(item[kind]) ? item[kind] : [];

    let rows = '';
    entries.forEach((entry, entryIndex) => {
        const idValidation = getRequiredValidation(true, entry.id);
        const amountValidation = getRequiredValidation(true, entry.amount);
        rows += `
            <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 6px;">
                <input type="text"
                       class="array-input${idValidation.invalidClass}"
                       value="${escapeAttr(entry.id || '')}"
                       placeholder="ID"
                       onchange="updateTaskEntry(${groupIndex}, ${itemIndex}, '${kind}', ${entryIndex}, 'id', this.value)">
                <input type="number"
                       class="array-input${amountValidation.invalidClass}"
                       style="flex: 0 0 110px;"
                       value="${typeof entry.amount === 'number' ? entry.amount : ''}"
                       placeholder="Amount"
                       onchange="updateTaskEntry(${groupIndex}, ${itemIndex}, '${kind}', ${entryIndex}, 'amount', this.value)">
                <button class="btn btn-danger" style="font-size: 11px; padding: 5px 10px;" onclick="removeTaskEntry(${groupIndex}, ${itemIndex}, '${kind}', ${entryIndex})">×</button>
            </div>
        `;
    });

    return `
        <div>
            <h4 style="margin-bottom: 8px; color: #34495e; font-size: 13px; display: inline-flex; align-items: center; gap: 6px;">${formatLabel(kind)}${infoBtnHtml('tasks.items.' + kind)}</h4>
            ${rows}
            <button class="btn btn-primary" style="font-size: 12px; padding: 6px 12px;" onclick="addTaskEntry(${groupIndex}, ${itemIndex}, '${kind}')">Add ${kind === 'targets' ? 'Target' : 'Reward'}</button>
        </div>
    `;
}

function addTaskGroup() {
    if (!config.tasks) config.tasks = [];

    config.tasks.push({ id: '', type: 'daily', items: [] });
    renderTasks();
    updateJsonOutput();
}

function removeTaskGroup(groupIndex) {
    config.tasks.splice(groupIndex, 1);
    renderTasks();
    updateJsonOutput();
}

function updateTaskGroupField(groupIndex, field, value) {
    const group = config.tasks[groupIndex];
    if (!group) return;

    group[field] = value;
    renderTasks();
    updateJsonOutput();
}

function addTaskItem(groupIndex) {
    const group = config.tasks[groupIndex];
    if (!group) return;

    if (!Array.isArray(group.items)) group.items = [];
    group.items.push({ id: '', targets: [], rewards: [] });
    renderTaskItems(groupIndex);
    updateJsonOutput();
}

function removeTaskItem(groupIndex, itemIndex) {
    const group = config.tasks[groupIndex];
    if (!group || !Array.isArray(group.items)) return;

    group.items.splice(itemIndex, 1);
    renderTaskItems(groupIndex);
    updateJsonOutput();
}

function updateTaskItemId(groupIndex, itemIndex, value) {
    const item = config.tasks[groupIndex] && config.tasks[groupIndex].items[itemIndex];
    if (!item) return;

    item.id = value;
    renderTaskItems(groupIndex);
    updateJsonOutput();
}

function addTaskEntry(groupIndex, itemIndex, kind) {
    const item = config.tasks[groupIndex] && config.tasks[groupIndex].items[itemIndex];
    if (!item) return;

    if (!Array.isArray(item[kind])) item[kind] = [];
    item[kind].push({ id: '', amount: 1 });
    renderTaskItems(groupIndex);
    updateJsonOutput();
}

function removeTaskEntry(groupIndex, itemIndex, kind, entryIndex) {
    const item = config.tasks[groupIndex] && config.tasks[groupIndex].items[itemIndex];
    if (!item || !Array.isArray(item[kind])) return;

    item[kind].splice(entryIndex, 1);
    renderTaskItems(groupIndex);
    updateJsonOutput();
}

function updateTaskEntry(groupIndex, itemIndex, kind, entryIndex, field, value) {
    const item = config.tasks[groupIndex] && config.tasks[groupIndex].items[itemIndex];
    const entry = item && Array.isArray(item[kind]) && item[kind][entryIndex];
    if (!entry) return;

    if (field === 'amount') {
        if (value === '') {
            delete entry.amount;
        } else {
            const parsed = Number(value);
            if (Number.isNaN(parsed)) return;
            entry.amount = parsed;
        }
    } else {
        entry[field] = value;
    }

    renderTaskItems(groupIndex);
    updateJsonOutput();
}

// ---------- Achievements ----------

function getAchievementPlatformKeys(achievementSchema) {
    return Object.keys(achievementSchema.properties).filter((key) => !['id', 'name', 'description'].includes(key));
}

function renderAchievements() {
    const container = document.getElementById('achievementsContainer');
    if (!container) return;

    container.innerHTML = '';

    if (!config.achievements) {
        config.achievements = [];
    }

    const achievementSchema = resolveRef(schema.properties.achievements.items, schema);
    const platformKeys = getAchievementPlatformKeys(achievementSchema);

    config.achievements.forEach((achievement, index) => {
        const achievementDiv = document.createElement('div');
        achievementDiv.className = 'array-item';
        achievementDiv.style.flexDirection = 'column';
        achievementDiv.style.alignItems = 'stretch';
        achievementDiv.style.gap = '15px';
        achievementDiv.style.padding = '15px';
        achievementDiv.style.border = '1px solid #ddd';
        achievementDiv.style.borderRadius = '6px';
        achievementDiv.style.background = '#fafafa';

        const idValidation = getRequiredValidation(true, achievement.id);
        let html = `
            <div style="display: flex; gap: 10px; align-items: center;">
                <div style="flex: 1;">
                    <label class="field-label">Achievement ID *${infoBtnHtml('achievements.id')}</label>
                    <input type="text"
                           class="field-input${idValidation.invalidClass}"
                           value="${escapeAttr(achievement.id || '')}"
                           onchange="updateAchievementField(${index}, 'id', this.value)"
                           placeholder="Achievement ID">
                    ${idValidation.errorHtml}
                </div>
                <button class="btn btn-danger" onclick="removeAchievement(${index})" style="margin-top: 20px;">Remove</button>
            </div>
            <div style="display: flex; gap: 10px;">
                <div style="flex: 1;">
                    <label class="field-label">Name${infoBtnHtml('achievements.name')}</label>
                    <input type="text"
                           class="field-input"
                           value="${escapeAttr(achievement.name || '')}"
                           onchange="updateAchievementField(${index}, 'name', this.value)">
                </div>
                <div style="flex: 1;">
                    <label class="field-label">Description${infoBtnHtml('achievements.description')}</label>
                    <input type="text"
                           class="field-input"
                           value="${escapeAttr(achievement.description || '')}"
                           onchange="updateAchievementField(${index}, 'description', this.value)">
                </div>
            </div>
        `;

        let mappingsHtml = '';
        let addButtonsHtml = '';
        for (const platformName of platformKeys) {
            const platformSchema = achievementSchema.properties[platformName];
            const mapping = achievement[platformName];

            if (!mapping) {
                addButtonsHtml += `<button class="btn btn-primary" onclick="addAchievementPlatform(${index}, '${platformName}')" style="font-size: 12px; padding: 6px 12px;">Add ${formatLabel(platformName)} Mapping</button>`;
                continue;
            }

            let fields = '';
            for (const [fieldName, fieldSchema] of Object.entries(platformSchema.properties || {})) {
                const isRequired = platformSchema.required && platformSchema.required.includes(fieldName);
                const v = getRequiredValidation(isRequired, mapping[fieldName]);
                fields += `
                    <div style="margin-bottom: 4px;">
                        <label style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; margin-bottom: 4px; color: #555;">
                            ${formatLabel(fieldName)}${isRequired ? ' *' : ''}${infoBtnHtml('achievements.' + platformName + '.' + fieldName)}
                        </label>
                        <input type="text"
                               class="field-input${v.invalidClass}"
                               value="${escapeAttr(mapping[fieldName] || '')}"
                               onchange="updateAchievementPlatformField(${index}, '${platformName}', '${fieldName}', this.value)"
                               style="width: 100%;">
                        ${v.errorHtml}
                    </div>
                `;
            }

            mappingsHtml += `
                <div style="display: flex; flex-direction: column; gap: 10px; padding: 12px; background: white; border-radius: 6px; border: 1px solid #e0e0e0;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h4 style="margin: 0; color: #2c3e50; font-size: 14px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">${formatLabel(platformName)}${infoBtnHtml('achievements.' + platformName)}</h4>
                        <button class="btn btn-danger" onclick="removeAchievementPlatform(${index}, '${platformName}')" style="font-size: 11px; padding: 5px 10px;">Remove</button>
                    </div>
                    ${fields}
                </div>
            `;
        }

        html += `
            <div>
                <h4 style="margin-bottom: 10px; color: #34495e; font-size: 13px; display: inline-flex; align-items: center; gap: 6px;">Platform Mappings${infoBtnHtml('achievements')}</h4>
                <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 10px;">${mappingsHtml}</div>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">${addButtonsHtml}</div>
            </div>
        `;

        achievementDiv.innerHTML = html;
        container.appendChild(achievementDiv);
    });
}

function addAchievement() {
    if (!config.achievements) config.achievements = [];

    config.achievements.push({ id: '' });
    renderAchievements();
    updateJsonOutput();
}

function removeAchievement(index) {
    config.achievements.splice(index, 1);
    renderAchievements();
    updateJsonOutput();
}

function updateAchievementField(index, field, value) {
    const achievement = config.achievements[index];
    if (!achievement) return;

    if (field === 'id') {
        achievement.id = value;
    } else if (value && value.trim() !== '') {
        achievement[field] = value;
    } else {
        delete achievement[field];
    }

    renderAchievements();
    updateJsonOutput();
}

function addAchievementPlatform(index, platformName) {
    const achievement = config.achievements[index];
    if (!achievement) return;

    const achievementSchema = resolveRef(schema.properties.achievements.items, schema);
    const platformSchema = achievementSchema.properties[platformName];
    if (!platformSchema) return;

    achievement[platformName] = buildDefaultValue(platformSchema, schema);
    renderAchievements();
    updateJsonOutput();
}

function removeAchievementPlatform(index, platformName) {
    const achievement = config.achievements[index];
    if (!achievement) return;

    delete achievement[platformName];
    renderAchievements();
    updateJsonOutput();
}

function updateAchievementPlatformField(index, platformName, field, value) {
    const mapping = config.achievements[index] && config.achievements[index][platformName];
    if (!mapping) return;

    mapping[field] = value;
    renderAchievements();
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

// Returns the sub-schema for an object property, honoring properties,
// patternProperties and additionalProperties. Returns null when unknown.
function getChildSchema(objectSchema, key) {
    if (!objectSchema) return null;

    if (objectSchema.properties && objectSchema.properties[key]) {
        return resolveRef(objectSchema.properties[key], schema);
    }

    if (objectSchema.patternProperties) {
        for (const [pattern, childSchema] of Object.entries(objectSchema.patternProperties)) {
            if (new RegExp(pattern).test(key)) {
                return resolveRef(childSchema, schema);
            }
        }
    }

    if (objectSchema.additionalProperties && typeof objectSchema.additionalProperties === 'object') {
        return resolveRef(objectSchema.additionalProperties, schema);
    }

    return null;
}

// Builds the exported config: drops empty strings, NaN numbers, values equal
// to their schema default (absent value means default in the SDK) and empty
// objects/arrays. Values without a known schema are kept verbatim so manually
// pasted platform overrides survive the round-trip.
function filterConfigValue(value, valueSchema) {
    if (typeof value === 'string') {
        if (value.trim() === '') return undefined;
        if (valueSchema && value === valueSchema.default) return undefined;
        return value;
    }

    if (typeof value === 'boolean') {
        if (valueSchema && valueSchema.type === 'boolean' && value === (valueSchema.default ?? false)) {
            return undefined;
        }
        return value;
    }

    if (typeof value === 'number') {
        if (Number.isNaN(value)) return undefined;
        if (valueSchema && value === valueSchema.default) return undefined;
        return value;
    }

    if (Array.isArray(value)) {
        const itemSchema = valueSchema && valueSchema.items ? resolveRef(valueSchema.items, schema) : null;
        const filtered = value
            .map((item) => filterConfigValue(item, itemSchema))
            .filter((item) => item !== undefined);
        return filtered.length > 0 ? filtered : undefined;
    }

    if (typeof value === 'object' && value !== null) {
        const result = {};
        for (const [key, childValue] of Object.entries(value)) {
            const childSchema = getChildSchema(valueSchema, key);
            const filtered = (childSchema || valueSchema)
                ? filterConfigValue(childValue, childSchema)
                : JSON.parse(JSON.stringify(childValue));

            if (filtered !== undefined) {
                result[key] = filtered;
            }
        }
        return Object.keys(result).length > 0 ? result : undefined;
    }

    return value === null || value === undefined ? undefined : value;
}

function getFilteredConfig() {
    return filterConfigValue(config, schema) || {};
}

function updateJsonOutput() {
    const output = document.getElementById('jsonOutput');
    if (!output) return;

    const filteredConfig = getFilteredConfig();
    const jsonString = JSON.stringify(filteredConfig, null, 2);
    const highlightedJson = highlightJson(jsonString);
    output.innerHTML = highlightedJson;

    updateRequiredPills();
}

// ---------- Section missing-required pills ----------

function countPlatformsMissing() {
    if (!schema || !schema.properties || !schema.properties.platforms || !schema.properties.platforms.properties) {
        return 0;
    }
    if (!config.platforms) return 0;

    let total = 0;
    const platformsSchema = schema.properties.platforms.properties;

    for (const [platformName, platformValue] of Object.entries(config.platforms)) {
        const platformSchema = platformsSchema[platformName];
        if (!platformSchema) continue;
        const requiredFields = platformSchema.required || [];
        for (const fieldName of requiredFields) {
            if (isMissingRequiredValue(platformValue ? platformValue[fieldName] : undefined)) {
                total += 1;
            }
        }
    }

    return total;
}

function countAdvertisementMissing() {
    if (!schema || !schema.properties || !schema.properties.advertisement) return 0;
    const adSchema = schema.properties.advertisement;
    if (!adSchema.properties) return 0;
    if (!config.advertisement) return 0;

    let total = 0;

    const adUnitTypes = Object.keys(adSchema.properties).filter((key) => {
        const resolved = resolveRef(adSchema.properties[key], schema);
        return resolved && resolved.properties && resolved.properties.placements;
    });

    for (const adType of adUnitTypes) {
        const unit = config.advertisement[adType];
        if (!unit) continue;
        const placements = Array.isArray(unit.placements) ? unit.placements : [];
        for (const placement of placements) {
            if (!placement || isMissingRequiredValue(placement.id)) {
                total += 1;
            }
        }
    }

    return total;
}

function countPaymentsMissing() {
    if (!schema || !schema.properties || !schema.properties.payments) return 0;
    if (!Array.isArray(config.payments)) return 0;

    const paymentItemSchema = resolveRef(schema.properties.payments.items, schema);
    if (!paymentItemSchema || !paymentItemSchema.properties) return 0;

    let total = 0;

    for (const payment of config.payments) {
        if (!payment) continue;
        if (isMissingRequiredValue(payment.id)) total += 1;

        for (const [platformName, platformValue] of Object.entries(payment)) {
            if (platformName === 'id') continue;
            const platformSchema = paymentItemSchema.properties[platformName];
            if (!platformSchema) continue;
            const requiredFields = platformSchema.required || [];
            for (const fieldName of requiredFields) {
                if (isMissingRequiredValue(platformValue ? platformValue[fieldName] : undefined)) {
                    total += 1;
                }
            }
        }
    }

    return total;
}

function countLeaderboardsMissing() {
    if (!Array.isArray(config.leaderboards)) return 0;

    let total = 0;
    for (const leaderboard of config.leaderboards) {
        if (!leaderboard) continue;
        if (isMissingRequiredValue(leaderboard.id)) total += 1;
    }

    return total;
}

function countNotificationsMissing() {
    if (!Array.isArray(config.notifications)) return 0;

    let total = 0;
    for (const notification of config.notifications) {
        if (!notification) continue;
        if (isMissingRequiredValue(notification.id)) total += 1;
    }

    return total;
}

function countVideoPreviewsMissing() {
    if (!Array.isArray(config.videoPreviews)) return 0;

    let total = 0;
    for (const preview of config.videoPreviews) {
        if (!preview) continue;
        if (isMissingRequiredValue(preview.image)) total += 1;
        if (isMissingRequiredValue(preview.videoId)) total += 1;
    }

    return total;
}

function countCrossPromoMissing() {
    const games = (config.crossPromo && Array.isArray(config.crossPromo.games)) ? config.crossPromo.games : [];

    let total = 0;
    for (const game of games) {
        if (!game || isMissingRequiredValue(game.url)) total += 1;
    }

    return total;
}

function countDailyRewardsMissing() {
    const dailyRewards = config.dailyRewards;
    if (!dailyRewards) return 0;

    const rewards = Array.isArray(dailyRewards.rewards) ? dailyRewards.rewards : [];

    let total = 0;
    for (const reward of rewards) {
        if (isMissingRequiredValue(reward)) total += 1;
    }

    // The section is meaningless without rewards; flag it when other fields are set
    const sectionUsed = rewards.length > 0
        || dailyRewards.cycle === false
        || dailyRewards.resetOnMiss === false;
    if (sectionUsed && rewards.length === 0) total += 1;

    return total;
}

function countTasksMissing() {
    if (!Array.isArray(config.tasks)) return 0;

    let total = 0;
    for (const group of config.tasks) {
        if (!group) continue;
        if (isMissingRequiredValue(group.id)) total += 1;
        if (isMissingRequiredValue(group.type)) total += 1;

        for (const item of (Array.isArray(group.items) ? group.items : [])) {
            if (!item) continue;
            if (isMissingRequiredValue(item.id)) total += 1;

            for (const kind of ['targets', 'rewards']) {
                for (const entry of (Array.isArray(item[kind]) ? item[kind] : [])) {
                    if (!entry) continue;
                    if (isMissingRequiredValue(entry.id)) total += 1;
                    if (isMissingRequiredValue(entry.amount)) total += 1;
                }
            }
        }
    }

    return total;
}

function countAchievementsMissing() {
    if (!Array.isArray(config.achievements)) return 0;

    const achievementSchema = resolveRef(schema.properties.achievements.items, schema);
    const platformKeys = getAchievementPlatformKeys(achievementSchema);

    let total = 0;
    for (const achievement of config.achievements) {
        if (!achievement) continue;
        if (isMissingRequiredValue(achievement.id)) total += 1;

        for (const platformName of platformKeys) {
            const mapping = achievement[platformName];
            if (!mapping) continue;

            const platformSchema = achievementSchema.properties[platformName];
            for (const fieldName of (platformSchema.required || [])) {
                if (isMissingRequiredValue(mapping[fieldName])) total += 1;
            }
        }
    }

    return total;
}

function setRequiredPill(elementId, count) {
    const el = document.getElementById(elementId);
    if (!el) return;
    if (count > 0) {
        el.textContent = `${count} missing`;
        el.hidden = false;
    } else {
        el.textContent = '';
        el.hidden = true;
    }
}

function updateRequiredPills() {
    setRequiredPill('platformsRequiredPill', countPlatformsMissing());
    setRequiredPill('advertisementRequiredPill', countAdvertisementMissing());
    setRequiredPill('crossPromoRequiredPill', countCrossPromoMissing());
    setRequiredPill('dailyRewardsRequiredPill', countDailyRewardsMissing());
    setRequiredPill('tasksRequiredPill', countTasksMissing());
    setRequiredPill('achievementsRequiredPill', countAchievementsMissing());
    setRequiredPill('paymentsRequiredPill', countPaymentsMissing());
    setRequiredPill('leaderboardsRequiredPill', countLeaderboardsMissing());
    setRequiredPill('notificationsRequiredPill', countNotificationsMissing());
    setRequiredPill('videoPreviewsRequiredPill', countVideoPreviewsMissing());
}

// ---------- Copy JSON to clipboard ----------

let copyFeedbackTimer = null;

async function copyJsonToClipboard() {
    const btn = document.getElementById('copyJsonBtn');
    const json = JSON.stringify(getFilteredConfig(), null, 2);

    let copied = false;
    try {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            await navigator.clipboard.writeText(json);
            copied = true;
        }
    } catch (err) {
        copied = false;
    }

    if (!copied) {
        // Fallback for environments without async clipboard support.
        try {
            const textarea = document.createElement('textarea');
            textarea.value = json;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            copied = true;
        } catch (err) {
            copied = false;
        }
    }

    if (!btn) return;

    if (copied) {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
    } else {
        btn.textContent = 'Failed';
    }

    if (copyFeedbackTimer) {
        clearTimeout(copyFeedbackTimer);
    }
    copyFeedbackTimer = setTimeout(() => {
        btn.textContent = 'Copy';
        btn.classList.remove('copied');
        copyFeedbackTimer = null;
    }, 1500);
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

    // Every platform can be added: those without dedicated settings still accept
    // per-platform overrides of the root config sections.
    const availablePlatforms = getKnownPlatformIds();
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

        const allFields = Object.keys((platformSchema && platformSchema.properties) || {});

        let description = 'Section overrides only';
        if (allFields.length > 0) {
            const fieldsList = allFields.slice(0, 3).map(f => formatLabel(f)).join(', ');
            const moreCount = allFields.length - 3;
            description = `Settings: ${fieldsList}` + (moreCount > 0 ? `, +${moreCount} more` : '');
        }

        platformDiv.innerHTML = `
            <div class="platform-option-name">
                ${formatLabel(platformName)}
            </div>
            <div class="platform-option-description">${isAdded ? '✓ Already added' : description}</div>
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

    config.platforms[platformName] = platformSchema ? buildDefaultValue(platformSchema, schema) : {};

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
