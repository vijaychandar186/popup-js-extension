import { CONFIG } from './config.js';
import { featureToggles, soundSettings } from './state.js';
import { applyDisplaySettings } from './display.js';
import { updateFeatureVisibility } from './ui.js';

let _elements = null;

export const initSettings = (elements) => {
    _elements = elements;
};

export const loadSettings = () => {
    const savedToggles = localStorage.getItem('featureToggles');
    if (savedToggles) {
        const parsed = JSON.parse(savedToggles);
        Object.keys(featureToggles).forEach(key => {
            if (parsed[key] !== undefined) featureToggles[key] = parsed[key];
        });
    }

    const savedConfig = localStorage.getItem('config');
    if (savedConfig) {
        const c = JSON.parse(savedConfig);
        if (c.MIN_DISTANCE) CONFIG.MIN_DISTANCE = c.MIN_DISTANCE;
        if (c.OPTIMAL_DISTANCE) CONFIG.OPTIMAL_DISTANCE = c.OPTIMAL_DISTANCE;
        if (c.MAX_DISTANCE) CONFIG.MAX_DISTANCE = c.MAX_DISTANCE;
        if (c.NOTIFICATION_COOLDOWN) CONFIG.NOTIFICATION_COOLDOWN = c.NOTIFICATION_COOLDOWN;
        if (c.BLINK_THRESHOLD) CONFIG.BLINK_THRESHOLD = c.BLINK_THRESHOLD;
        if (c.BLINK_TIMEOUT) CONFIG.BLINK_TIMEOUT = c.BLINK_TIMEOUT;
        if (c.SCREEN_TIME_LIMIT) CONFIG.SCREEN_TIME_LIMIT = c.SCREEN_TIME_LIMIT;
        if (c.BREAK_REMINDER) CONFIG.BREAK_REMINDER = c.BREAK_REMINDER;
        if (c.BREATHING_REMINDER) CONFIG.BREATHING_REMINDER = c.BREATHING_REMINDER;
    }

    const savedSound = localStorage.getItem('soundSettings');
    if (savedSound) {
        const s = JSON.parse(savedSound);
        Object.assign(soundSettings, s);
        if (s.sounds) Object.assign(soundSettings.sounds, s.sounds);
    }

    if (_elements) {
        _elements.targetDistance.textContent = CONFIG.OPTIMAL_DISTANCE;
        updateFeatureVisibility(_elements);
    }

    applyDisplaySettings();
};
