import { CONFIG } from './config.js';
import { state, featureToggles } from './state.js';
import { playSound } from './sound.js';
import { triggerBreathingReminder } from './wellness.js';

export const canShowNotification = (type) =>
    featureToggles.notifications &&
    (Date.now() - (state.lastNotifications.get(type) || 0)) > CONFIG.NOTIFICATION_COOLDOWN;

export const showNotification = (type, icon, title, text, elements) => {
    if (!canShowNotification(type)) return;
    state.lastNotifications.set(type, Date.now());
    if (type === 'distance') state.distanceAlertCount++;
    if (type === 'blink') state.blinkAlertCount++;
    elements.notificationIcon.innerHTML = icon;
    elements.notificationTitle.textContent = title;
    elements.notificationText.textContent = text;
    elements.notificationBar.classList.remove('hidden');
    setTimeout(() => elements.notificationBar.classList.add('hidden'), 5000);
    playSound(type);
    chrome.runtime.sendMessage({
        type: 'SHOW_SYSTEM_NOTIFICATION',
        data: { title, text },
    }).catch(() => {});
};

export const checkForReminders = (elements) => {
    if (!featureToggles.notifications && !featureToggles.breathing) return;
    const now = Date.now();
    const distance = state.smoothedDistance;
    const timeSinceLastBlink = now - state.lastBlinkTime;
    const distIcon = '<svg class="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>';
    const blinkIcon = '<svg class="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
    if (featureToggles.notifications) {
        if (distance < CONFIG.MIN_DISTANCE) {
            showNotification('distance', distIcon, 'Distance Alert', `You're at ${Math.round(distance)}cm. Move back slightly.`, elements);
        } else if (distance > CONFIG.MAX_DISTANCE) {
            showNotification('distance', distIcon, 'Distance Alert', 'Move closer to reduce eye strain.', elements);
        }
        if (timeSinceLastBlink > CONFIG.BLINK_TIMEOUT) {
            showNotification('blink', blinkIcon, 'Blink Reminder', 'Blink regularly to keep eyes comfortable.', elements);
        }
    }
    if (featureToggles.breathing && now - state.lastBreathingReminder > CONFIG.BREATHING_REMINDER) {
        if (!document.hidden) triggerBreathingReminder(elements);
        else {
            playSound('notify');
            chrome.runtime.sendMessage({
                type: 'SHOW_SYSTEM_NOTIFICATION',
                data: { title: 'Breathing Reminder', text: 'Take a moment for a deep breath.' },
            }).catch(() => {});
        }
        state.lastBreathingReminder = now;
    }
};
