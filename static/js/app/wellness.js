import { CONFIG } from './config.js';
import { state, featureToggles } from './state.js';
import { smoothValue } from './utils.js';
import { playSound } from './sound.js';

export const getPostureStatus = () => {
    const d = Math.round(state.smoothedDistance);
    if (d >= CONFIG.OPTIMAL_DISTANCE - 10 && d <= CONFIG.OPTIMAL_DISTANCE + 10) return 'Excellent';
    if (d >= CONFIG.MIN_DISTANCE && d <= CONFIG.MAX_DISTANCE) return 'Good';
    return 'Adjust';
};

export const updateWellnessScores = () => {
    if (!featureToggles.wellness) return;
    const now = Date.now();
    const deltaTime = (now - state.lastScoreUpdateTime) / 1000;
    state.lastScoreUpdateTime = now;
    const alpha = Math.min(1, deltaTime / 30);
    const distance = state.smoothedDistance;
    const timeSinceLastBlink = now - state.lastBlinkTime;
    const isOptimalDistance = distance >= CONFIG.OPTIMAL_DISTANCE - 10 && distance <= CONFIG.OPTIMAL_DISTANCE + 10;
    state.distanceScore = state.distanceScore * (1 - alpha) + (isOptimalDistance ? 100 : 0) * alpha;
    const isBlinkingRegularly = timeSinceLastBlink < CONFIG.BLINK_TIMEOUT;
    state.blinkScore = state.blinkScore * (1 - alpha) + (isBlinkingRegularly ? 100 : 0) * alpha;
    state.wellnessScore = Math.round((state.distanceScore + state.blinkScore) / 2);
};

export const updateZoom = () => {
    if (!featureToggles.zoom) return;
    const distance = state.smoothedDistance;
    if (distance < CONFIG.MIN_DISTANCE - state.zoomDeadzone) {
        state.targetZoom = Math.max(0.85, 1 - (CONFIG.MIN_DISTANCE - distance) * 0.01);
    } else if (distance > CONFIG.MAX_DISTANCE + state.zoomDeadzone) {
        state.targetZoom = Math.min(1.15, 1 + (distance - CONFIG.MAX_DISTANCE) * 0.005);
    } else {
        state.targetZoom = 1;
    }
    if (Math.abs(state.currentZoom - state.targetZoom) > 0.005) {
        state.currentZoom = smoothValue(state.targetZoom, state.currentZoom, 0.92);
        chrome.runtime.sendMessage({
            type: 'SET_GLOBAL_ZOOM',
            data: { zoom: Math.round(state.currentZoom * 100) / 100 },
        }).catch(() => {});
    }
};

export const updateAmbient = (ambientOverlay) => {
    if (!featureToggles.ambient) return;
    const distance = state.smoothedDistance;
    const timeSinceLastBlink = Date.now() - state.lastBlinkTime;
    const isAlert = distance < CONFIG.MIN_DISTANCE || distance > CONFIG.MAX_DISTANCE || timeSinceLastBlink > 15000;
    ambientOverlay.style.opacity = isAlert ? '0.05' : '0';
};

export const triggerBreathingReminder = (elements) => {
    if (!featureToggles.breathing) return;
    elements.breathingGuide.style.opacity = '1';
    elements.breathingCircle.style.transform = 'scale(1.5)';
    setTimeout(() => { elements.breathingCircle.style.transform = 'scale(1)'; }, 2000);
    setTimeout(() => { elements.breathingGuide.style.opacity = '0'; }, 8000);
    playSound('notify');
};
