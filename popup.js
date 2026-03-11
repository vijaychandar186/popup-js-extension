document.addEventListener('DOMContentLoaded', () => {

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`tab-${tab}`).classList.add('active');
            if (tab === 'analytics') renderAnalytics();
        });
    });

    const openWindowBtn = document.getElementById('open-window-btn');
    const windowBtnText = document.getElementById('window-btn-text');
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');

    let monitoringActive = false;

    function setActiveUI() {
        monitoringActive = true;
        statusDot.style.backgroundColor = '#22c55e';
        statusText.textContent = 'Active';
        openWindowBtn.style.background = '#16a34a';
        windowBtnText.textContent = 'Stop Monitoring';
    }

    function setInactiveUI() {
        monitoringActive = false;
        statusDot.style.backgroundColor = '#6b7280';
        statusText.textContent = 'Inactive';
        openWindowBtn.style.background = '';
        windowBtnText.textContent = 'Start Monitoring';
    }

    async function checkWindowStatus() {
        try {
            const response = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
            if (response.isOpen) setActiveUI(); else setInactiveUI();
        } catch (e) {
            statusText.textContent = 'Error';
        }
    }

    openWindowBtn.addEventListener('click', async () => {
        openWindowBtn.disabled = true;
        try {
            if (monitoringActive) {
                windowBtnText.textContent = 'Stopping...';
                await chrome.runtime.sendMessage({ type: 'CLOSE_APP_WINDOW' });
                setInactiveUI();
            } else {
                windowBtnText.textContent = 'Starting...';
                await chrome.runtime.sendMessage({ type: 'OPEN_APP_WINDOW' });
                setActiveUI();
            }
        } catch (e) {
            windowBtnText.textContent = 'Error - Retry';
        } finally {
            openWindowBtn.disabled = false;
        }
    });

    checkWindowStatus();

    chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== 'session' || !('appWindowId' in changes)) return;
        if (changes.appWindowId.newValue != null) setActiveUI(); else setInactiveUI();
    });

    const statWellness = document.getElementById('stat-wellness');
    const statDistance = document.getElementById('stat-distance');
    const statSession = document.getElementById('stat-session');
    const statBlinks = document.getElementById('stat-blinks');
    const statPosture = document.getElementById('stat-posture');
    const lastUpdated = document.getElementById('last-updated');

    let lastStatsTimestamp = 0;

    function applyStats(s) {
        statWellness.textContent = s.wellnessScore ?? '--';
        statDistance.textContent = s.distance ?? '--';
        statSession.textContent = s.sessionMinutes != null ? `${s.sessionMinutes}m` : '--';
        statBlinks.textContent = s.blinkCount ?? '--';
        statPosture.textContent = s.posture ?? '--';
        lastStatsTimestamp = s.timestamp;
        updateStatusLabel();
    }

    function updateStatusLabel() {
        if (!lastStatsTimestamp) {
            if (!monitoringActive) lastUpdated.textContent = 'Open the monitoring window to start tracking';
            return;
        }
        const age = Date.now() - lastStatsTimestamp;
        if (age < 10000) {
            lastUpdated.textContent = `Updated ${Math.round(age / 1000)}s ago`;
        } else if (monitoringActive) {
            lastUpdated.textContent = 'Monitoring active (window minimized)';
        } else {
            lastUpdated.textContent = 'Monitoring window not running';
        }
    }

    setInterval(updateStatusLabel, 1000);

    window.addEventListener('storage', (e) => {
        if (e.key !== 'monitorStatus' || !e.newValue) return;
        try { applyStats(JSON.parse(e.newValue)); } catch {}
    });

    const existing = localStorage.getItem('monitorStatus');
    if (existing) {
        try { applyStats(JSON.parse(existing)); } catch {}
    } else {
        lastUpdated.textContent = 'Open the monitoring window to start tracking';
    }

    const soundEnabled = document.getElementById('sound-enabled');
    const soundVolume = document.getElementById('sound-volume');
    const volumeDisplay = document.getElementById('volume-display');

    soundVolume.addEventListener('input', () => {
        volumeDisplay.textContent = `${soundVolume.value}%`;
    });

    document.querySelectorAll('.preview-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const inputId = btn.dataset.soundInput;
            const select = document.getElementById(inputId);
            if (!select || !select.value) return;
            const audio = new Audio(chrome.runtime.getURL(select.value));
            audio.volume = parseInt(soundVolume.value) / 100;
            audio.play().catch(() => {});
        });
    });

    const toggleIds = ['notifications', 'zoom', 'ambient', 'breathing', 'wellness',
        'distance', 'blink', 'session', 'posture'];

    const darkModeToggle = document.getElementById('toggle-dark-mode');
    const warmFilterToggle = document.getElementById('toggle-warm-filter');
    const warmIntensitySlider = document.getElementById('warm-intensity');
    const warmIntensityDisplay = document.getElementById('warm-intensity-display');
    const warmIntensityRow = document.getElementById('warm-intensity-row');

    function applyDisplaySettings(settings) {
        document.body.classList.toggle('dark-mode', !!settings.darkMode);
        if (settings.warmFilter) {
            const i = settings.warmIntensity || 30;
            document.body.style.filter = `sepia(${(i * 0.0035).toFixed(3)}) brightness(${(1 - i * 0.001).toFixed(3)}) saturate(${(1 - i * 0.002).toFixed(3)})`;
        } else {
            document.body.style.filter = '';
        }
        if (warmIntensityRow) {
            warmIntensityRow.style.display = settings.warmFilter ? 'flex' : 'none';
        }
    }

    function saveDisplaySettings() {
        const settings = {
            darkMode: darkModeToggle ? darkModeToggle.checked : false,
            warmFilter: warmFilterToggle ? warmFilterToggle.checked : false,
            warmIntensity: warmIntensitySlider ? parseInt(warmIntensitySlider.value) : 30,
        };
        localStorage.setItem('displaySettings', JSON.stringify(settings));
        chrome.storage.local.set({ displaySettings: settings });
        applyDisplaySettings(settings);
        localStorage.setItem('settingsUpdated', Date.now().toString());
    }

    if (darkModeToggle) darkModeToggle.addEventListener('change', saveDisplaySettings);
    if (warmFilterToggle) warmFilterToggle.addEventListener('change', saveDisplaySettings);
    if (warmIntensitySlider) {
        warmIntensitySlider.addEventListener('input', () => {
            if (warmIntensityDisplay) warmIntensityDisplay.textContent = `${warmIntensitySlider.value}%`;
            saveDisplaySettings();
        });
    }

    function renderAnalytics() {
        const history = JSON.parse(localStorage.getItem('analyticsHistory') || '[]');
        const currentStatus = JSON.parse(localStorage.getItem('monitorStatus') || '{}');
        const today = new Date().toISOString().split('T')[0];
        const todayData = history.find(d => d.date === today) || {};

        const anaSession = document.getElementById('analytics-session');
        const anaBlinks = document.getElementById('analytics-blinks');
        const anaDist = document.getElementById('analytics-distance');
        const anaWellness = document.getElementById('analytics-wellness');

        if (anaSession) anaSession.textContent = (todayData.sessionMinutes ?? currentStatus.sessionMinutes ?? '--') + (todayData.sessionMinutes != null ? 'm' : '');
        if (anaBlinks) anaBlinks.textContent = todayData.blinkCount ?? currentStatus.blinkCount ?? '--';
        if (anaDist) anaDist.textContent = todayData.avgDistance != null ? `${todayData.avgDistance}cm` : (currentStatus.distance != null ? `${currentStatus.distance}cm` : '--');
        if (anaWellness) anaWellness.textContent = todayData.avgWellnessScore ?? currentStatus.wellnessScore ?? '--';

        const tbody = document.getElementById('analytics-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        const recent = history.slice(0, 7);
        if (recent.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:0.75rem;color:#6b7280;font-size:0.75rem">No data yet. Start monitoring to collect data.</td></tr>';
            return;
        }
        recent.forEach(row => {
            const tr = document.createElement('tr');
            const d = new Date(row.date + 'T00:00:00');
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            tr.innerHTML = `<td>${dateStr}</td><td>${row.sessionMinutes || 0}m</td><td>${row.avgDistance != null ? row.avgDistance + 'cm' : '--'}</td><td>${row.blinkCount || 0}</td><td>${row.avgWellnessScore ?? '--'}</td><td>${(row.distanceAlerts || 0) + (row.blinkAlerts || 0)}</td>`;
            tbody.appendChild(tr);
        });
    }

    const exportBtn = document.getElementById('analytics-export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: chrome.runtime.getURL('templates/analytics.html') });
        });
    }

    function loadSettings() {
        const savedToggles = localStorage.getItem('featureToggles');
        if (savedToggles) {
            const parsed = JSON.parse(savedToggles);
            toggleIds.forEach(key => {
                const el = document.getElementById(`toggle-${key}`);
                if (el && parsed[key] !== undefined) el.checked = parsed[key];
            });
        }

        const savedConfig = localStorage.getItem('config');
        if (savedConfig) {
            const c = JSON.parse(savedConfig);
            const el = id => document.getElementById(id);
            if (c.MIN_DISTANCE) el('config-min-distance').value = c.MIN_DISTANCE;
            if (c.OPTIMAL_DISTANCE) el('config-optimal-distance').value = c.OPTIMAL_DISTANCE;
            if (c.MAX_DISTANCE) el('config-max-distance').value = c.MAX_DISTANCE;
            if (c.NOTIFICATION_COOLDOWN) el('config-notification-cooldown').value = c.NOTIFICATION_COOLDOWN / 1000;
            if (c.BREAK_REMINDER) el('config-break-reminder').value = c.BREAK_REMINDER / 60000;
            if (c.BREATHING_REMINDER) el('config-breathing-reminder').value = c.BREATHING_REMINDER / 60000;
            if (c.BLINK_THRESHOLD) el('config-blink-threshold').value = c.BLINK_THRESHOLD;
            if (c.BLINK_TIMEOUT) el('config-blink-timeout').value = c.BLINK_TIMEOUT / 1000;
            if (c.SCREEN_TIME_LIMIT) el('config-screen-time-limit').value = c.SCREEN_TIME_LIMIT / 60000;
        }

        const savedSound = localStorage.getItem('soundSettings');
        if (savedSound) {
            const s = JSON.parse(savedSound);
            soundEnabled.checked = s.enabled !== false;
            if (s.volume != null) {
                soundVolume.value = s.volume;
                volumeDisplay.textContent = `${s.volume}%`;
            }
            if (s.sounds) {
                ['distance', 'blink', 'break', 'session', 'notify'].forEach(type => {
                    const sel = document.getElementById(`sound-${type}`);
                    if (sel && s.sounds[type] !== undefined) sel.value = s.sounds[type];
                });
            }
        }

        const savedDisplay = localStorage.getItem('displaySettings');
        if (savedDisplay) {
            const s = JSON.parse(savedDisplay);
            if (darkModeToggle) darkModeToggle.checked = !!s.darkMode;
            if (warmFilterToggle) warmFilterToggle.checked = !!s.warmFilter;
            if (warmIntensitySlider) {
                warmIntensitySlider.value = s.warmIntensity || 30;
                if (warmIntensityDisplay) warmIntensityDisplay.textContent = `${s.warmIntensity || 30}%`;
            }
            applyDisplaySettings(s);
        }
    }

    document.getElementById('save-settings').addEventListener('click', () => {
        const toggles = {};
        toggleIds.forEach(key => {
            const el = document.getElementById(`toggle-${key}`);
            if (el) toggles[key] = el.checked;
        });
        localStorage.setItem('featureToggles', JSON.stringify(toggles));

        const el = id => document.getElementById(id);
        const config = {
            MIN_DISTANCE: parseFloat(el('config-min-distance').value) || 35,
            OPTIMAL_DISTANCE: parseFloat(el('config-optimal-distance').value) || 55,
            MAX_DISTANCE: parseFloat(el('config-max-distance').value) || 80,
            NOTIFICATION_COOLDOWN: (parseFloat(el('config-notification-cooldown').value) || 30) * 1000,
            BREAK_REMINDER: (parseFloat(el('config-break-reminder').value) || 20) * 60000,
            BREATHING_REMINDER: (parseFloat(el('config-breathing-reminder').value) || 5) * 60000,
            BLINK_THRESHOLD: parseFloat(el('config-blink-threshold').value) || 0.015,
            BLINK_TIMEOUT: (parseFloat(el('config-blink-timeout').value) || 20) * 1000,
            SCREEN_TIME_LIMIT: (parseFloat(el('config-screen-time-limit').value) || 30) * 60000,
        };
        localStorage.setItem('config', JSON.stringify(config));

        const soundSettings = {
            enabled: soundEnabled.checked,
            volume: parseInt(soundVolume.value),
            sounds: {
                distance: document.getElementById('sound-distance').value,
                blink: document.getElementById('sound-blink').value,
                break: document.getElementById('sound-break').value,
                session: document.getElementById('sound-session').value,
                notify: document.getElementById('sound-notify').value,
            },
        };
        localStorage.setItem('soundSettings', JSON.stringify(soundSettings));

        const btn = document.getElementById('save-settings');
        btn.textContent = 'Saved!';
        btn.style.background = '#16a34a';
        setTimeout(() => {
            btn.textContent = 'Save Settings';
            btn.style.background = '';
        }, 1500);

        localStorage.setItem('settingsUpdated', Date.now().toString());
    });

    loadSettings();
});
