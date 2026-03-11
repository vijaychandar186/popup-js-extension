import { CONFIG } from './config.js';
import { state, featureToggles } from './state.js';
import { calculateDistance } from './utils.js';

export const detectBlink = (landmarks) => {
    if (!featureToggles.blink && !featureToggles.wellness) return;
    const avgEyeHeight = (
        calculateDistance(landmarks[159], landmarks[23]) +
        calculateDistance(landmarks[386], landmarks[374])
    ) / 2;
    const isBlinking = avgEyeHeight < CONFIG.BLINK_THRESHOLD;
    if (!isBlinking && state.eyeOpenState === false) {
        state.blinkCount++;
        state.lastBlinkTime = Date.now();
    }
    state.eyeOpenState = !isBlinking;
};
