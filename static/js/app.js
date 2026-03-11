import { CONFIG } from './app/config.js';
import { state, featureToggles } from './app/state.js';
import { loadSettings, initSettings } from './app/settings.js';
import { applyDisplaySettings } from './app/display.js';
import { initCamera } from './app/camera.js';
import { saveAnalyticsSnapshot } from './app/analytics.js';
import { getPostureStatus } from './app/wellness.js';
import { showNotification } from './app/notifications.js';
import { triggerBreathingReminder } from './app/wellness.js';

document.addEventListener('DOMContentLoaded', () => {

    const elements = {
        video: document.getElementById('video'),
        canvas: document.getElementById('canvas'),
        distanceStatus: document.getElementById('distance-status'),
        distanceValue: document.getElementById('distance-value'),
        distanceIndicator: document.getElementById('distance-indicator'),
        notificationBar: document.getElementById('notification-bar'),
        notificationTitle: document.getElementById('notification-title'),
        notificationText: document.getElementById('notification-text'),
        notificationIcon: document.getElementById('notification-icon'),
        breathingGuide: document.getElementById('breathing-guide'),
        breathingCircle: document.getElementById('breathing-circle'),
        errorMessage: document.getElementById('error-message'),
        loadingSpinner: document.getElementById('loading-spinner'),
        blinkCounter: document.getElementById('blink-counter'),
        sessionTime: document.getElementById('session-time'),
        postureStatus: document.getElementById('posture-status'),
        scoreValue: document.getElementById('score-value'),
        wellnessScore: document.getElementById('wellness-score'),
        ambientOverlay: document.getElementById('ambient-overlay'),
        statsBar: document.getElementById('stats-bar'),
        blinkCounterContainer: document.getElementById('blink-counter-container'),
        sessionTimeContainer: document.getElementById('session-time-container'),
        postureStatusContainer: document.getElementById('posture-status-container'),
        targetDistance: document.getElementById('target-distance'),
        dismissNotification: document.getElementById('dismiss-notification'),
    };

    elements.dismissNotification.addEventListener('click', () => {
        elements.notificationBar.classList.add('hidden');
    });

    initSettings(elements);
    loadSettings();
    applyDisplaySettings();

    window.addEventListener('storage', (e) => {
        if (e.key === 'settingsUpdated') {
            loadSettings();
            applyDisplaySettings();
        }
    });

    const startBackgroundAlarms = () => {
        const breakMinutes = CONFIG.BREAK_REMINDER / 60000;
        const breathingMinutes = CONFIG.BREATHING_REMINDER / 60000;
        const elapsed = (Date.now() - state.startTime) / 60000;
        const sessionMinutes = Math.max(1, (CONFIG.SCREEN_TIME_LIMIT / 60000) - elapsed);
        chrome.runtime.sendMessage({
            type: 'START_BACKGROUND_ALARMS',
            data: { breakMinutes, breathingMinutes, sessionMinutes },
        }).catch(() => {});
    };

    const stopBackgroundAlarms = () => {
        chrome.runtime.sendMessage({ type: 'STOP_BACKGROUND_ALARMS' }).catch(() => {});
    };

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) startBackgroundAlarms();
        else stopBackgroundAlarms();
    });

    const breakIcon = '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 7.5 15.5 12.5l2.286 6.857L12 15.5 6.5 19.357 8.786 12.5 3 7.5l5.714 1.857L12 3z"></path></svg>';
    const sessionIcon = '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';

    const statsWorker = new Worker(URL.createObjectURL(new Blob([`
        self.onmessage = function(e) {
            if (e.data === 'start') setInterval(() => postMessage('tick'), 5000);
        };
    `], { type: 'application/javascript' })));

    statsWorker.onmessage = () => {
        const now = Date.now();

        if (!document.hidden) {
            if (featureToggles.notifications) {
                if (now - state.lastBreakReminder > CONFIG.BREAK_REMINDER) {
                    showNotification('break', breakIcon, 'Break Reminder',
                        'Follow the 20-20-20 rule: Look 20 feet away for 20 seconds.', elements);
                    state.lastBreakReminder = now;
                }
                if (now - state.startTime > CONFIG.SCREEN_TIME_LIMIT) {
                    showNotification('session', sessionIcon, 'Session Alert',
                        'Take a longer break after extended screen time.', elements);
                    state.startTime = now;
                }
            }
            if (featureToggles.breathing && now - state.lastBreathingReminder > CONFIG.BREATHING_REMINDER) {
                triggerBreathingReminder(elements);
                state.lastBreathingReminder = now;
            }
        }

        state.distanceTotal += Math.round(state.smoothedDistance);
        state.distanceSampleCount++;
        state.wellnessTotal += state.wellnessScore;
        state.wellnessSampleCount++;
        saveAnalyticsSnapshot();

        localStorage.setItem('monitorStatus', JSON.stringify({
            wellnessScore: state.wellnessScore,
            distance: Math.round(state.smoothedDistance),
            sessionMinutes: Math.floor((now - state.startTime) / 60000),
            blinkCount: state.blinkCount,
            posture: getPostureStatus(),
            timestamp: now,
        }));
    };

    statsWorker.postMessage('start');

    initCamera(elements);
});
