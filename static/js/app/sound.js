import { soundSettings } from './state.js';

export const playSound = (type) => {
    if (!soundSettings.enabled) return;
    const file = soundSettings.sounds[type];
    if (!file) return;
    try {
        const audio = new Audio(chrome.runtime.getURL(file));
        audio.volume = soundSettings.volume / 100;
        audio.play().catch(() => {});
    } catch (e) {}
};
