import { CONFIG } from './config.js';
import { state, featureToggles } from './state.js';
import { smoothValue, addToBuffer, calculateDistance } from './utils.js';
import { detectBlink } from './blink.js';
import { updateWellnessScores } from './wellness.js';
import { checkForReminders } from './notifications.js';
import { updateUI } from './ui.js';

export const initCamera = async (elements) => {
    elements.canvas.width = 640;
    elements.canvas.height = 480;
    const ctx = elements.canvas.getContext('2d');

    const faceMesh = new FaceMesh({
        locateFile: file => chrome.runtime.getURL(`libs/${file}`),
    });
    faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
    });

    faceMesh.onResults((results) => {
        state.frameCount++;
        if (!document.hidden) {
            ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
            ctx.drawImage(elements.video, 0, 0, elements.canvas.width, elements.canvas.height);
        }
        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
            if (featureToggles.distance) elements.distanceValue.textContent = '--';
            if (featureToggles.posture) elements.postureStatus.textContent = 'No Face';
            return;
        }
        const landmarks = results.multiFaceLandmarks[0];
        const pixelDistance = calculateDistance(landmarks[145], landmarks[374]) * elements.canvas.width;
        state.smoothedDistance = smoothValue(
            addToBuffer(state, (CONFIG.AVG_PUPIL_DISTANCE * CONFIG.FOCAL_LENGTH) / pixelDistance),
            state.smoothedDistance,
            CONFIG.DISTANCE_SMOOTHING
        );
        detectBlink(landmarks);
        if (featureToggles.wellness) updateWellnessScores();
        if (state.frameCount % 30 === 0) checkForReminders(elements);
        updateUI(elements);
    });

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480, facingMode: 'user' },
        });
        elements.video.srcObject = stream;
        await new Promise(resolve => { elements.video.onloadedmetadata = resolve; });
        await elements.video.play();
        elements.loadingSpinner.classList.add('hidden');

        const hiddenCanvas = document.createElement('canvas');
        const hiddenCtx = hiddenCanvas.getContext('2d', { willReadFrequently: true });

        const cameraWorker = new Worker(URL.createObjectURL(new Blob([`
            self.onmessage = function(e) {
                if (e.data === 'start') setInterval(() => postMessage('tick'), 100);
            };
        `], { type: 'application/javascript' })));

        let sending = false;
        let lastSendTime = 0;

        cameraWorker.onmessage = async () => {
            if (sending && (Date.now() - lastSendTime > 2000)) sending = false;
            if (document.hidden && elements.video.paused) elements.video.play().catch(() => {});
            if (sending || elements.video.readyState < 2) return;
            sending = true;
            lastSendTime = Date.now();
            try {
                hiddenCanvas.width = elements.video.videoWidth;
                hiddenCanvas.height = elements.video.videoHeight;
                hiddenCtx.drawImage(elements.video, 0, 0);
                await Promise.race([
                    faceMesh.send({ image: hiddenCanvas }),
                    new Promise(resolve => setTimeout(resolve, 1900)),
                ]);
            } finally {
                sending = false;
            }
        };

        cameraWorker.postMessage('start');

    } catch (err) {
        elements.loadingSpinner.classList.add('hidden');
        elements.errorMessage.classList.remove('hidden');
        elements.errorMessage.querySelector('p').textContent =
            'Camera access failed. Ensure permissions are granted.';
    }
};
