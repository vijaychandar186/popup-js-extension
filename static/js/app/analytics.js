import { state } from './state.js';

export const saveAnalyticsSnapshot = () => {
    const today = new Date().toISOString().split('T')[0];
    const history = JSON.parse(localStorage.getItem('analyticsHistory') || '[]');
    const sessionMinutes = Math.floor((Date.now() - state.startTime) / 60000);
    const avgDistance = state.distanceSampleCount > 0
        ? Math.round(state.distanceTotal / state.distanceSampleCount)
        : Math.round(state.smoothedDistance);
    const avgWellnessScore = state.wellnessSampleCount > 0
        ? Math.round(state.wellnessTotal / state.wellnessSampleCount)
        : state.wellnessScore;
    const entry = {
        date: today,
        sessionMinutes,
        avgDistance,
        blinkCount: state.blinkCount,
        avgWellnessScore,
        distanceAlerts: state.distanceAlertCount,
        blinkAlerts: state.blinkAlertCount,
    };
    const idx = history.findIndex(d => d.date === today);
    if (idx >= 0) history[idx] = entry;
    else history.unshift(entry);
    if (history.length > 30) history.length = 30;
    localStorage.setItem('analyticsHistory', JSON.stringify(history));
};
