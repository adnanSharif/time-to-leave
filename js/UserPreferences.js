const electron = require('electron');
const path = require('path');
const fs = require('fs');
const { validateTime } = require('../js/time_math.js');

const defaultPreferences = {
    'hide-non-working-days': false,
    'hours-per-day': '08:00',
    'notification': 'enabled',
    'working-days-monday': true,
    'working-days-tuesday': true,
    'working-days-wednesday': true,
    'working-days-thursday': true,
    'working-days-friday': true,
    'working-days-saturday': false,
    'working-days-sunday': false,
};

/*
 * Returns the preference file path, considering the userData path
 */
function getPreferencesFilePath() {
    let userDataPath = (electron.app || electron.remote.app).getPath('userData');
    return path.join(userDataPath, 'preferences.json');
}

/*
 * Saves preference to file.
 */
function savePreferences(preferencesOptions) {
    fs.writeFileSync(getPreferencesFilePath(), JSON.stringify(preferencesOptions));
}

/*
 * Loads preference from file.
 */
function readPreferences() {
    var preferences;
    try {
        preferences = JSON.parse(fs.readFileSync(getPreferencesFilePath()));
    } catch(err) {
        preferences = {};
    }
    return preferences ? preferences : {};
}

function getDerivedPrefsFromLoadedPrefs(loadedPreferences){
    var derivedPreferences = {};
    Object.keys(defaultPreferences).forEach(function(key){
        derivedPreferences[key] = loadedPreferences[key] || defaultPreferences[key];
    });

    return defaultPreferences;
}

/*
 * initializes users preferences if it is not already exists
 * or any keys of existing preferences is invalid
 */
function initPreferencesFileIfNotExistsOrInvalid() {
    if (!fs.existsSync(getPreferencesFilePath())) {
        savePreferences(defaultPreferences);
        return;
    }

    var shouldSaveDerivedPrefs = false,
        loadedPrefs = readPreferences(),
        derivedPrefs = getDerivedPrefsFromLoadedPrefs(loadedPrefs),
        loadedPref = Object.keys(loadedPrefs).sort(),
        derivedPrefsKeys = Object.keys(derivedPrefs).sort();

    // Validate keys
    if (JSON.stringify(loadedPref) != JSON.stringify(derivedPrefsKeys)) {
        shouldSaveDerivedPrefs = true;
    }

    // Validate the values
    for(var key of derivedPrefsKeys) {
        var value = derivedPrefs[key];
        switch (key) {
        case 'hours-per-day': {
            if (!validateTime(value)) {
                derivedPrefs[key] = defaultPreferences[key];
                shouldSaveDerivedPrefs = true;
            }
            break;
        }
        case 'notification': {
            if (value != 'enabled' && value != 'disabled') {
                derivedPrefs[key] = defaultPreferences[key];
                shouldSaveDerivedPrefs = true;
            }
            break;
        }
        case 'working-days-monday': 
        case 'working-days-tuesday': 
        case 'working-days-wednesday': 
        case 'working-days-thursday': 
        case 'working-days-friday': 
        case 'working-days-saturday': 
        case 'working-days-sunday': {
            if (value != true && value != false) {
                derivedPrefs[key] = defaultPreferences[key];
                shouldSaveDerivedPrefs = true;
            }
            break;
        }
        case 'hide-non-working-days': {
            if (value != true && value != false) {
                derivedPrefs[key] = defaultPreferences[key];
                shouldSaveDerivedPrefs = true;
            }
            break;
        }
        }
    }

    if(shouldSaveDerivedPrefs) {
        savePreferences(derivedPrefs);
    }
}

/*
 * Returns the user preferences.
 */
function getLoadedOrDerivedUserPreferences() {
    initPreferencesFileIfNotExistsOrInvalid();
    return readPreferences();
}

module.exports = {
    getUserPreferences: getLoadedOrDerivedUserPreferences,
    savePreferences
};