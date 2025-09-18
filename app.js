const defaultConfig = {
    "platforms": {
        "game_distribution": {
            "gameId": ""
        },
        "telegram": {
            "adsgramBlockId": ""
        },
        "y8": {
            "gameId": "",
            "adsenseId": "",
            "channelId": ""
        },
        "lagged": {
            "devId": "",
            "publisherId": ""
        },
        "huawei": {
            "appId": ""
        },
        "msn": {
            "gameId": ""
        },
        "discord": {
            "appId": ""
        },
        "gamepush": {
            "projectId": "",
            "publicToken": ""
        },
        "jio_games": {
            "packageName": ""
        },
        "crazy_games": {
            "xsollaProjectId": "",
            "isSandbox": false,
            "useUserToken": false
        },
        "facebook": {
            "subscribeForNotificationsOnStart": true
        },
        "yandex": {
            "useSignedData": false
        }
    },
    "advertisement": {
        "banner": {
            "disable": false
        },
        "interstitial": {
            "disable": false,
            "preloadOnStart": true
        },
        "rewarded": {
            "disable": false,
            "preloadOnStart": true
        },
        "useBuiltInErrorPopup": true,
        "backfillId": ""
    },
    "payments": [],
    "leaderboards": [],
    "sendAnalyticsEvents": true
};

let config = JSON.parse(JSON.stringify(defaultConfig));

document.addEventListener('DOMContentLoaded', function() {
    reset();
    renderEditor();
    updateJsonOutput();
});

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
    renderPlatforms();
    renderGeneral();
    renderAdvertisement();
    renderPayments();
    renderLeaderboards();
}

function renderPlatforms() {
    const container = document.getElementById('platformsContainer');
    container.innerHTML = '';

    Object.keys(config.platforms).forEach(platformName => {
        const platform = config.platforms[platformName];
        const platformDiv = document.createElement('div');
        platformDiv.className = 'platform-item';

        let html = `<div class="platform-name">${platformName}</div>`;

        Object.keys(platform).forEach(fieldName => {
            const fieldValue = platform[fieldName];
            const fieldType = typeof fieldValue;

            if (fieldType === 'boolean') {
                html += `
                    <div class="field-group">
                        <div class="checkbox-group">
                            <input type="checkbox" 
                                   id="${platformName}_${fieldName}" 
                                   class="checkbox-input"
                                   ${fieldValue ? 'checked' : ''}
                                   onchange="updatePlatformField('${platformName}', '${fieldName}', this.checked)">
                            <label for="${platformName}_${fieldName}" class="field-label">${fieldName}</label>
                        </div>
                    </div>
                `;
            } else {
                html += `
                    <div class="field-group">
                        <label for="${platformName}_${fieldName}" class="field-label">${fieldName}</label>
                        <input type="text" 
                               id="${platformName}_${fieldName}" 
                               class="field-input"
                               value="${fieldValue}"
                               onchange="updatePlatformField('${platformName}', '${fieldName}', this.value)">
                    </div>
                `;
            }
        });

        platformDiv.innerHTML = html;
        container.appendChild(platformDiv);
    });
}

function renderGeneral() {
    const container = document.getElementById('generalContainer');
    container.innerHTML = '';

    let html = `
        <div class="field-group">
            <div class="checkbox-group">
                <input type="checkbox" 
                       id="sendAnalyticsEvents" 
                       class="checkbox-input"
                       ${config.sendAnalyticsEvents ? 'checked' : ''}
                       onchange="updateGlobalSetting('sendAnalyticsEvents', this.checked)">
                <label for="sendAnalyticsEvents" class="field-label">Send Analytics Events</label>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

function renderAdvertisement() {
    const container = document.getElementById('advertisementContainer');
    container.innerHTML = '';

    const ad = config.advertisement;
    let html = `
        <div class="field-group">
            <p style="margin-bottom: 10px; color: #34495e;"><b>General Settings</b></p>
            <div class="checkbox-group" style="margin-bottom: 10px;">
                <input type="checkbox" 
                       id="useBuiltInErrorPopup" 
                       class="checkbox-input"
                       ${ad.useBuiltInErrorPopup ? 'checked' : ''}
                       onchange="updateAdvertisementField('useBuiltInErrorPopup', null, this.checked)">
                <label for="useBuiltInErrorPopup" class="field-label">Use built-in error popup</label>
            </div>
            <label for="backfillId" class="field-label">Backfill ID</label>
            <input type="text" 
                   id="backfillId" 
                   class="field-input"
                   value="${ad.backfillId}"
                   onchange="updateAdvertisementField('backfillId', null, this.value)">
        </div>
    `;

    html += `
        <div class="field-group">
            <p style="margin-bottom: 10px; color: #34495e;"><b>Banner</b></p>
            <div class="checkbox-group">
                <input type="checkbox" 
                       id="banner_disable" 
                       class="checkbox-input"
                       ${ad.banner.disable ? 'checked' : ''}
                       onchange="updateAdvertisementField('banner', 'disable', this.checked)">
                <label for="banner_disable" class="field-label">Disable</label>
            </div>
        </div>
    `;

    html += `
        <div class="field-group">
            <p style="margin-bottom: 10px; color: #34495e;"><b>Interstitial</b></p>
            <div class="checkbox-group">
                <input type="checkbox" 
                       id="interstitial_preloadOnStart" 
                       class="checkbox-input"
                       ${ad.interstitial.preloadOnStart ? 'checked' : ''}
                       onchange="updateAdvertisementField('interstitial', 'preloadOnStart', this.checked)">
                <label for="interstitial_preloadOnStart" class="field-label">Preload on start</label>
            </div>
            <div class="checkbox-group" style="margin-bottom: 10px;">
                <input type="checkbox" 
                       id="interstitial_disable" 
                       class="checkbox-input"
                       ${ad.interstitial.disable ? 'checked' : ''}
                       onchange="updateAdvertisementField('interstitial', 'disable', this.checked)">
                <label for="interstitial_disable" class="field-label">Disable</label>
            </div>
        </div>
    `;

    html += `
        <div class="field-group">
            <p style="margin-bottom: 10px; color: #34495e;"><b>Rewarded</b></p>
            <div class="checkbox-group">
                <input type="checkbox" 
                       id="rewarded_preloadOnStart" 
                       class="checkbox-input"
                       ${ad.rewarded.preloadOnStart ? 'checked' : ''}
                       onchange="updateAdvertisementField('rewarded', 'preloadOnStart', this.checked)">
                <label for="rewarded_preloadOnStart" class="field-label">Preload on start</label>
            </div>
            <div class="checkbox-group" style="margin-bottom: 10px;">
                <input type="checkbox" 
                       id="rewarded_disable" 
                       class="checkbox-input"
                       ${ad.rewarded.disable ? 'checked' : ''}
                       onchange="updateAdvertisementField('rewarded', 'disable', this.checked)">
                <label for="rewarded_disable" class="field-label">Disable</label>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

function renderPayments() {
    const container = document.getElementById('paymentsContainer');
    container.innerHTML = '';

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

        paymentDiv.innerHTML = `
            <div style="display: flex; gap: 10px; align-items: center;">
                <input type="text" 
                       class="array-input" 
                       value="${payment.id || ''}"
                       onchange="updatePaymentField(${index}, 'id', this.value)"
                       placeholder="Product ID"
                       style="flex: 1;">
                <button class="btn btn-danger" onclick="removePayment(${index})">Remove</button>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div style="border: 1px solid #e0e0e0; border-radius: 6px; padding: 15px; background: white;">
                    <h4 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 14px; font-weight: 600;">Playgama</h4>
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 500; margin-bottom: 5px; color: #555;">Amount</label>
                        <input type="number" 
                               class="field-input" 
                               value="${payment.playgama?.amount || ''}"
                               onchange="updatePaymentField(${index}, 'playgama.amount', this.value ? parseInt(this.value) : null)"
                               placeholder="Amount">
                    </div>
                </div>
                
                <div style="border: 1px solid #e0e0e0; border-radius: 6px; padding: 15px; background: white;">
                    <h4 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 14px; font-weight: 600;">Playdeck</h4>
                    <div style="margin-bottom: 10px;">
                        <label style="display: block; font-size: 12px; font-weight: 500; margin-bottom: 5px; color: #555;">Amount</label>
                        <input type="number" 
                               class="field-input" 
                               value="${payment.playdeck?.amount || ''}"
                               onchange="updatePaymentField(${index}, 'playdeck.amount', this.value ? parseInt(this.value) : null)"
                               placeholder="Amount">
                    </div>
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 500; margin-bottom: 5px; color: #555;">Description</label>
                        <input type="text" 
                               class="field-input" 
                               value="${payment.playdeck?.description || ''}"
                               onchange="updatePaymentField(${index}, 'playdeck.description', this.value)"
                               placeholder="Description">
                    </div>
                </div>
            </div>
        `;
        container.appendChild(paymentDiv);
    });
}

function renderLeaderboards() {
    const container = document.getElementById('leaderboardsContainer');
    container.innerHTML = '';

    config.leaderboards.forEach((leaderboard, index) => {
        const leaderboardDiv = document.createElement('div');
        leaderboardDiv.className = 'array-item';
        leaderboardDiv.innerHTML = `
            <input type="text" 
                   class="array-input" 
                   value="${leaderboard.id}"
                   onchange="updateLeaderboard(${index}, this.value)"
                   placeholder="Leaderboard ID">
            <button class="btn btn-danger" onclick="removeLeaderboard(${index})">Remove</button>
        `;
        container.appendChild(leaderboardDiv);
    });
}


function updatePlatformField(platformName, fieldName, value) {
    config.platforms[platformName][fieldName] = value;
    updateJsonOutput();
}

function updateAdvertisementField(section, field, value) {
    if (field === null) {
        config.advertisement[section] = value;
    } else {
        config.advertisement[section][field] = value;
    }
    updateJsonOutput();
}

function updatePayment(index, value) {
    config.payments[index].id = value;
    updateJsonOutput();
}

function updatePaymentField(index, fieldPath, value) {
    const payment = config.payments[index];

    if (fieldPath === 'id') {
        payment.id = value;
    } else if (fieldPath === 'playgama.amount') {
        if (value !== null && value !== undefined && value !== '') {
            if (!payment.playgama) {
                payment.playgama = {};
            }
            payment.playgama.amount = value;
        } else {
            if (payment.playgama) {
                delete payment.playgama.amount;
                if (Object.keys(payment.playgama).length === 0) {
                    delete payment.playgama;
                }
            }
        }
    } else if (fieldPath === 'playdeck.amount') {
        if (value !== null && value !== undefined && value !== '') {
            if (!payment.playdeck) {
                payment.playdeck = {};
            }
            payment.playdeck.amount = value;
        } else {
            if (payment.playdeck) {
                delete payment.playdeck.amount;
                if (Object.keys(payment.playdeck).length === 0) {
                    delete payment.playdeck;
                }
            }
        }
    } else if (fieldPath === 'playdeck.description') {
        if (value && value.trim() !== '') {
            if (!payment.playdeck) {
                payment.playdeck = {};
            }
            payment.playdeck.description = value;
        } else {
            if (payment.playdeck) {
                delete payment.playdeck.description;
                if (Object.keys(payment.playdeck).length === 0) {
                    delete payment.playdeck;
                }
            }
        }
    }

    updateJsonOutput();
}

function addPayment() {
    config.payments.push({
        id: ''
    });
    renderPayments();
    updateJsonOutput();
}

function removePayment(index) {
    config.payments.splice(index, 1);
    renderPayments();
    updateJsonOutput();
}

function updateLeaderboard(index, value) {
    config.leaderboards[index].id = value;
    updateJsonOutput();
}

function addLeaderboard() {
    config.leaderboards.push({ id: '' });
    renderLeaderboards();
    updateJsonOutput();
}

function removeLeaderboard(index) {
    config.leaderboards.splice(index, 1);
    renderLeaderboards();
    updateJsonOutput();
}

function updateGlobalSetting(setting, value) {
    config[setting] = value;
    updateJsonOutput();
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

    const filteredPlatforms = {};
    for (const [platformName, platform] of Object.entries(config.platforms)) {
        if (!isPlatformEmpty(platform)) {
            filteredPlatforms[platformName] = platform;
        }
    }

    filteredConfig.platforms = filteredPlatforms;

    function removeFalseBooleans(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(removeFalseBooleans);
        }

        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'boolean' && value === false) {
                continue;
            } else if (typeof value === 'object' && value !== null) {
                const filteredValue = removeFalseBooleans(value);
                if (Array.isArray(filteredValue) ? filteredValue.length > 0 : Object.keys(filteredValue).length > 0) {
                    result[key] = filteredValue;
                }
            } else {
                result[key] = value;
            }
        }
        return result;
    }

    const filteredResult = removeFalseBooleans(filteredConfig);

    if (filteredResult.advertisement && filteredResult.advertisement.backfillId !== undefined && filteredResult.advertisement.backfillId.trim() === '') {
        delete filteredResult.advertisement.backfillId;
    }

    return filteredResult;
}

function updateJsonOutput() {
    const output = document.getElementById('jsonOutput');
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
