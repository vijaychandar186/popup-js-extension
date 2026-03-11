function applyGlobalDisplay(s) {
    const filters = [];
    if (s.darkMode) filters.push('invert(1) hue-rotate(180deg)');
    if (s.warmFilter) {
        const i = s.warmIntensity || 30;
        filters.push(`sepia(${(i * 0.0035).toFixed(3)}) brightness(${(1 - i * 0.001).toFixed(3)}) saturate(${(1 - i * 0.002).toFixed(3)})`);
    }

    let styleEl = document.getElementById('wm-display-style');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'wm-display-style';
        (document.head || document.documentElement).appendChild(styleEl);
    }

    if (filters.length > 0) {
        const reinvert = s.darkMode ? 'invert(1) hue-rotate(180deg)' : 'none';
        styleEl.textContent = `html{filter:${filters.join(' ')}!important}img,video,canvas,svg,iframe,picture{filter:${reinvert}!important}`;
    } else {
        styleEl.textContent = '';
    }
}

chrome.storage.local.get('displaySettings', (result) => {
    applyGlobalDisplay(result.displaySettings || {});
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && 'displaySettings' in changes) {
        applyGlobalDisplay(changes.displaySettings.newValue || {});
    }
});
