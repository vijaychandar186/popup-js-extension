(function () {
    const saved = localStorage.getItem('displaySettings');
    if (saved) {
        const s = JSON.parse(saved);
        document.body.classList.toggle('dark-mode', !!s.darkMode);
        if (s.warmFilter) {
            const i = s.warmIntensity || 30;
            document.body.style.filter = `sepia(${(i * 0.0035).toFixed(3)}) brightness(${(1 - i * 0.001).toFixed(3)}) saturate(${(1 - i * 0.002).toFixed(3)})`;
        }
    }

    const history = JSON.parse(localStorage.getItem('analyticsHistory') || '[]');

    document.getElementById('report-subtitle').textContent =
        `Generated ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;

    document.getElementById('print-btn').addEventListener('click', () => window.print());

    if (history.length === 0) {
        document.getElementById('summary-grid').innerHTML =
            '<div style="grid-column:1/-1;text-align:center;color:#9ca3af;padding:1rem;font-size:0.875rem">No data yet.</div>';
        return;
    }

    const totalSessions = history.length;
    const totalMinutes = history.reduce((s, d) => s + (d.sessionMinutes || 0), 0);
    const avgWellness = Math.round(history.reduce((s, d) => s + (d.avgWellnessScore || 0), 0) / history.length);
    const avgDist = Math.round(history.reduce((s, d) => s + (d.avgDistance || 0), 0) / history.length);

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    document.getElementById('summary-grid').innerHTML = `
        <div class="summary-card"><div class="summary-card-label">Days Tracked</div><div class="summary-card-value">${totalSessions}</div><div class="summary-card-sub">sessions recorded</div></div>
        <div class="summary-card"><div class="summary-card-label">Total Screen Time</div><div class="summary-card-value">${timeStr}</div><div class="summary-card-sub">across all sessions</div></div>
        <div class="summary-card"><div class="summary-card-label">Avg Wellness Score</div><div class="summary-card-value">${avgWellness}</div><div class="summary-card-sub">out of 100</div></div>
        <div class="summary-card"><div class="summary-card-label">Avg Distance</div><div class="summary-card-value">${avgDist}cm</div><div class="summary-card-sub">recommended 55cm</div></div>
    `;

    document.getElementById('empty-state').style.display = 'none';
    const table = document.getElementById('history-table');
    table.style.display = '';
    const tbody = document.getElementById('history-tbody');

    history.forEach(row => {
        const d = new Date(row.date + 'T00:00:00');
        const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const score = row.avgWellnessScore ?? '--';
        const badgeClass = score >= 80 ? 'badge-good' : score >= 60 ? 'badge-mid' : 'badge-low';
        const statusLabel = score >= 80 ? 'Good' : score >= 60 ? 'Fair' : (score === '--' ? '--' : 'Poor');
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${dateStr}</td>
            <td>${row.sessionMinutes || 0}m</td>
            <td>${row.avgDistance != null ? row.avgDistance + 'cm' : '--'}</td>
            <td>${row.blinkCount || 0}</td>
            <td>${score}</td>
            <td>${row.distanceAlerts || 0}</td>
            <td>${row.blinkAlerts || 0}</td>
            <td><span class="badge ${badgeClass}">${statusLabel}</span></td>
        `;
        tbody.appendChild(tr);
    });

    const trendEmpty = document.getElementById('trend-empty');
    const trendTable = document.getElementById('trend-table');
    const trendWithScores = history.filter(d => d.avgWellnessScore != null);

    if (trendWithScores.length > 0) {
        trendEmpty.style.display = 'none';
        trendTable.style.display = '';
        const trendTbody = document.getElementById('trend-tbody');
        trendWithScores.slice(0, 14).forEach(row => {
            const d = new Date(row.date + 'T00:00:00');
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const score = row.avgWellnessScore;
            const barWidth = Math.round(score * 1.2);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${dateStr}</td>
                <td>${score}</td>
                <td><div class="bar-wrap"><div class="bar" style="width:${barWidth}px"></div><span class="bar-val">${score}/100</span></div></td>
            `;
            trendTbody.appendChild(tr);
        });
    }

    const modalOverlay = document.getElementById('modal-overlay');
    document.getElementById('clear-btn').addEventListener('click', () => {
        modalOverlay.classList.remove('hidden');
    });
    document.getElementById('modal-cancel').addEventListener('click', () => {
        modalOverlay.classList.add('hidden');
    });
    document.getElementById('modal-confirm').addEventListener('click', () => {
        localStorage.removeItem('analyticsHistory');
        location.reload();
    });
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) modalOverlay.classList.add('hidden');
    });
})();
