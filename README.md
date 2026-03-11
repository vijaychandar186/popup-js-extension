# PopUp Wellness Monitor

**PopUp Wellness Monitor** is a Chrome extension that uses AI-powered facial landmark detection to promote better digital health. It monitors eye strain, posture, and screen time via live webcam input — running fully in the background while you work in other tabs, delivering feedback through OS-level notifications and sound alerts.

---

## Features

- **Face Tracking**: Real-time facial landmark detection using MediaPipe FaceMesh (runs locally, no data sent to any server).
- **Distance Monitoring**: Measures your distance from the screen with configurable min/optimal/max thresholds.
- **Blink Detection**: Tracks blink frequency to reduce eye strain; alerts when blinking too infrequently.
- **Posture Feedback**: Infers posture from facial position relative to the camera.
- **Wellness Score**: Dynamic score calculated from distance consistency and blink frequency.
- **Break Reminders**: 20-20-20 rule reminders at a configurable interval.
- **Breathing Reminders**: Periodic prompts for breathing exercises.
- **Session Limit Alerts**: Notifies when continuous screen time exceeds a configured limit.
- **Background Monitoring**: Monitoring continues when the window is minimized — OS notifications fire from the service worker via `chrome.alarms`, independent of page visibility.
- **Sound Alerts**: Configurable per-alert sound assignment with volume control and preview.
- **Ambient Effects**: Subtle background overlay reflects current wellness state.
- **Zoom Adjustment**: Dynamically scales the monitoring window content based on user distance.
- **Customizable Settings**: Toggle individual features and fine-tune thresholds, timers, and detection sensitivity — all saved and applied live.

---

## Installation

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the project folder.
5. The Wellness Monitor icon will appear in your toolbar.

> **Note**: Webcam access is required. Grant camera permissions when prompted by the monitoring window.

---

## Usage

1. Click the extension icon in the Chrome toolbar to open the popup.
2. Click **Start Monitoring** to open the monitoring window and begin face detection.
3. Minimize the monitoring window — monitoring continues in the background.
4. OS-level notifications appear for distance alerts, blink reminders, break reminders, breathing cues, and session limits even while the window is minimized.
5. The popup **Dashboard** tab shows live stats (wellness score, distance, session time, blink count, posture) updated in real time.
6. Adjust features and thresholds in the **Settings** tab, then click **Save Settings**.
7. Assign alert sounds per event type in the **Sounds** tab.
8. Click **Stop Monitoring** in the popup to close the monitoring window and clear all alarms.

---

## Real-Time Feedback

- **Distance Indicator**: Shows current distance in cm; highlights when out of range.
- **Stats Bar**: Displays blink count, session duration, posture status, and wellness score.
- **Notification Bar**: In-app alerts for distance, blink, break, and session events.
- **Breathing Guide**: Animated prompt appears at the configured breathing interval.
- **Ambient Overlay**: Subtle visual cue when wellness indicators are off.
- **OS Notifications**: System-level alerts fire from the background service worker — visible even when the monitoring window is minimized or behind other windows.

---

## Configuration

Accessible from the **Settings** tab in the popup:

**Features** — toggle on/off individually:
- Notifications, Zoom, Ambient, Breathing, Wellness Score, Distance, Blink, Session, Posture

**Distance** (cm):
- Minimum: 20–50 &nbsp;|&nbsp; Optimal: 40–70 &nbsp;|&nbsp; Maximum: 60–100

**Timing**:
- Notification Cooldown: 10–300 seconds
- Break Reminder: 5–60 minutes
- Breathing Reminder: 1–30 minutes

**Detection**:
- Blink Sensitivity: 0.005–0.05
- Blink Timeout: 5–60 seconds
- Session Limit: 10–120 minutes

---

## Dependencies

All dependencies are bundled locally — no CDN, no internet required at runtime:

- [MediaPipe FaceMesh](https://google.github.io/mediapipe/solutions/face_mesh.html) — facial landmark detection (WASM, runs fully on-device)
- [MediaPipe Camera Utils](https://github.com/google/mediapipe) — camera input helpers

Styling is plain CSS (no Tailwind or external frameworks).

---

## License

This project is licensed under the **MIT License**.

---

## Disclaimer

This app is for general wellness support and is not a medical tool. Please consult a professional for medical advice.
