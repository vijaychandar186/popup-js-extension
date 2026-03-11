export const applyDisplaySettings = () => {
    const saved = localStorage.getItem('displaySettings');
    if (!saved) return;
    const s = JSON.parse(saved);
    document.body.classList.toggle('dark-mode', !!s.darkMode);
    if (s.warmFilter) {
        const i = s.warmIntensity || 30;
        document.body.style.filter = `sepia(${(i * 0.0035).toFixed(3)}) brightness(${(1 - i * 0.001).toFixed(3)}) saturate(${(1 - i * 0.002).toFixed(3)})`;
    } else {
        document.body.style.filter = '';
    }
};
