chrome.runtime.onMessage.addListener((message) => {
    if (message.type !== 'APPLY_ZOOM') return;
    document.documentElement.style.zoom = message.zoom;
});
