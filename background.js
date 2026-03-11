chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.session.remove('appWindowId');
});

async function getStoredWindowId() {
    const result = await chrome.storage.session.get('appWindowId');
    return result.appWindowId ?? null;
}

async function isWindowOpen(windowId) {
    if (windowId === null) return false;
    try {
        await chrome.windows.get(windowId);
        return true;
    } catch {
        return false;
    }
}

async function openOrFocusAppWindow() {
    const windowId = await getStoredWindowId();
    if (await isWindowOpen(windowId)) {
        await chrome.windows.update(windowId, { focused: true });
        return windowId;
    }
    const win = await chrome.windows.create({
        url: chrome.runtime.getURL('app.html'),
        type: 'popup',
        width: 980,
        height: 760,
        focused: true,
    });
    await chrome.storage.session.set({ appWindowId: win.id });
    return win.id;
}

async function resetAllTabZoom() {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
        if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) continue;
        chrome.tabs.setZoom(tab.id, 1).catch(() => {});
    }
}

chrome.windows.onRemoved.addListener(async (windowId) => {
    const stored = await getStoredWindowId();
    if (windowId === stored) {
        await chrome.storage.session.remove('appWindowId');
        chrome.alarms.clearAll();
        resetAllTabZoom();
    }
});

const ALARM_MESSAGES = {
    'wm_break': {
        title: 'Break Reminder',
        text: 'Follow the 20-20-20 rule: Look 20 feet away for 20 seconds.',
    },
    'wm_breathing': {
        title: 'Breathing Reminder',
        text: 'Take a moment for a deep breath.',
    },
    'wm_session': {
        title: 'Session Alert',
        text: 'Take a longer break after extended screen time.',
    },
};

chrome.alarms.onAlarm.addListener(alarm => {
    const msg = ALARM_MESSAGES[alarm.name];
    if (!msg) return;
    chrome.notifications.create(`wellness_${alarm.name}_${Date.now()}`, {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('assets/android-chrome-192x192.png'),
        title: msg.title,
        message: msg.text,
        priority: 2,
    });
    chrome.storage.session.get(['breakMinutes', 'breathingMinutes', 'sessionMinutes']).then(cfg => {
        if (alarm.name === 'wm_break') {
            chrome.alarms.create('wm_break', { delayInMinutes: cfg.breakMinutes ?? 20 });
        } else if (alarm.name === 'wm_breathing') {
            chrome.alarms.create('wm_breathing', { delayInMinutes: cfg.breathingMinutes ?? 5 });
        } else if (alarm.name === 'wm_session') {
            chrome.alarms.create('wm_session', { delayInMinutes: cfg.sessionMinutes ?? 30 });
        }
    });
});

function applyDisplayToTab(tabId, settings) {
    chrome.scripting.executeScript({
        target: { tabId },
        func: (s) => {
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
        },
        args: [settings],
    }).catch(() => {});
}

chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !('displaySettings' in changes)) return;
    const settings = changes.displaySettings.newValue || {};
    chrome.tabs.query({}, tabs => {
        tabs.forEach(tab => {
            if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) return;
            applyDisplayToTab(tab.id, settings);
        });
    });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    if (message.type === 'OPEN_APP_WINDOW') {
        openOrFocusAppWindow()
            .then(id => sendResponse({ success: true, windowId: id }))
            .catch(e => sendResponse({ success: false, error: e.message }));
        return true;
    }

    if (message.type === 'CLOSE_APP_WINDOW') {
        (async () => {
            const windowId = await getStoredWindowId();
            if (await isWindowOpen(windowId)) {
                await chrome.windows.remove(windowId);
            }
            sendResponse({ success: true });
        })();
        return true;
    }

    if (message.type === 'GET_STATUS') {
        (async () => {
            const windowId = await getStoredWindowId();
            sendResponse({ isOpen: await isWindowOpen(windowId), windowId });
        })();
        return true;
    }

    if (message.type === 'START_BACKGROUND_ALARMS') {
        const { breakMinutes, breathingMinutes, sessionMinutes } = message.data;
        chrome.storage.session.set({ breakMinutes, breathingMinutes, sessionMinutes });
        chrome.alarms.create('wm_break', { delayInMinutes: breakMinutes });
        chrome.alarms.create('wm_breathing', { delayInMinutes: breathingMinutes });
        if (sessionMinutes > 0) {
            chrome.alarms.create('wm_session', { delayInMinutes: sessionMinutes });
        }
        sendResponse({ success: true });
        return true;
    }

    if (message.type === 'STOP_BACKGROUND_ALARMS') {
        chrome.alarms.clearAll();
        sendResponse({ success: true });
        return true;
    }

    if (message.type === 'SET_GLOBAL_ZOOM') {
        const { zoom } = message.data;
        chrome.tabs.query({}, tabs => {
            tabs.forEach(tab => {
                if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) return;
                chrome.tabs.setZoom(tab.id, zoom).catch(() => {});
            });
        });
        return false;
    }

    if (message.type === 'SHOW_SYSTEM_NOTIFICATION') {
        const { title, text } = message.data;
        chrome.notifications.create(`wellness_${Date.now()}`, {
            type: 'basic',
            iconUrl: chrome.runtime.getURL('assets/android-chrome-192x192.png'),
            title,
            message: text,
            priority: 2,
        });
    }
});
