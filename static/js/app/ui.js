import { CONFIG } from './config.js';
import { state, featureToggles } from './state.js';
import { getPostureStatus, updateZoom, updateAmbient } from './wellness.js';

export const updateFeatureVisibility = (elements) => {
    elements.notificationBar.classList.toggle('hidden', !featureToggles.notifications);
    elements.ambientOverlay.classList.toggle('hidden', !featureToggles.ambient);
    elements.breathingGuide.classList.toggle('hidden', !featureToggles.breathing);
    elements.distanceStatus.classList.toggle('hidden', !featureToggles.distance);
    elements.wellnessScore.classList.toggle('hidden', !featureToggles.wellness);
    elements.blinkCounterContainer.classList.toggle('hidden', !featureToggles.blink);
    elements.sessionTimeContainer.classList.toggle('hidden', !featureToggles.session);
    elements.postureStatusContainer.classList.toggle('hidden', !featureToggles.posture);
    elements.statsBar.classList.toggle('hidden',
        !featureToggles.wellness && !featureToggles.blink && !featureToggles.session && !featureToggles.posture);
    if (!featureToggles.zoom) document.body.style.transform = 'scale(1)';
};

export const updateUI = (elements) => {
    const distance = Math.round(state.smoothedDistance);
    const sessionMinutes = Math.floor((Date.now() - state.startTime) / 60000);

    if (featureToggles.distance) {
        elements.distanceValue.textContent = distance;
        const isOutOfRange = distance < CONFIG.MIN_DISTANCE || distance > CONFIG.MAX_DISTANCE;
        elements.distanceIndicator.classList.toggle('alert', isOutOfRange);
    }

    if (featureToggles.wellness) {
        if (state.wellnessScore >= 80) {
            elements.wellnessScore.className = 'score-good';
        } else if (state.wellnessScore >= 60) {
            elements.wellnessScore.className = 'score-mid';
        } else {
            elements.wellnessScore.className = 'score-low';
        }
        elements.scoreValue.textContent = state.wellnessScore;
    }

    elements.postureStatus.textContent = featureToggles.posture ? getPostureStatus() : 'No Face';
    if (featureToggles.blink) elements.blinkCounter.textContent = state.blinkCount;
    if (featureToggles.session) elements.sessionTime.textContent = `${sessionMinutes}m`;
    if (featureToggles.zoom) updateZoom();
    if (featureToggles.ambient) updateAmbient(elements.ambientOverlay);

    localStorage.setItem('monitorStatus', JSON.stringify({
        wellnessScore: state.wellnessScore,
        distance,
        sessionMinutes,
        blinkCount: state.blinkCount,
        posture: getPostureStatus(),
        timestamp: Date.now(),
    }));
};
