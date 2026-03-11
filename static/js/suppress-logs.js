(function () {
    const SUPPRESS = [
        'WebGL', 'wasm', 'Successfully created', 'put_char', '_fd_write',
        'GL_', 'EXT_', 'OES_', 'WEBGL_',
    ];
    const shouldSuppress = msg => typeof msg === 'string' && SUPPRESS.some(s => msg.includes(s));
    ['log', 'warn', 'error', 'info'].forEach(method => {
        const orig = console[method].bind(console);
        console[method] = (...args) => {
            if (args.some(shouldSuppress)) return;
            orig(...args);
        };
    });

    
    
    try {
        const keepAliveCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = keepAliveCtx.createOscillator();
        const gainNode = keepAliveCtx.createGain();
        gainNode.gain.value = 0; 
        oscillator.connect(gainNode);
        gainNode.connect(keepAliveCtx.destination);
        oscillator.start();
    } catch(e) {}

    
    const originalRaf = window.requestAnimationFrame;
    const originalCancel = window.cancelAnimationFrame;
    const rafMap = new Map();
    let rAFCounter = 0;

    window.requestAnimationFrame = function(cb) {
        const id = ++rAFCounter;
        if (document.hidden) {
            const timeoutId = setTimeout(() => {
                rafMap.delete(id);
                cb(performance.now());
            }, 33);
            rafMap.set(id, { type: 'timeout', val: timeoutId });
        } else {
            const rafId = originalRaf((time) => {
                rafMap.delete(id);
                cb(time);
            });
            rafMap.set(id, { type: 'raf', val: rafId });
        }
        return id;
    };

    window.cancelAnimationFrame = function(id) {
        const item = rafMap.get(id);
        if (!item) return;
        if (item.type === 'timeout') clearTimeout(item.val);
        else originalCancel(item.val);
        rafMap.delete(id);
    };

})();
