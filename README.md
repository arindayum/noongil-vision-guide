# NoonGil — Assistive Vision AI

> An Android application that helps visually impaired users understand their surroundings using AI-powered object detection, text recognition, and hazard scanning — with full voice control and multilingual support.

---

## Table of Contents

- [About This Branch](#about-this-branch)
- [What Changed in rachana_version](#what-changed-in-rachana_version)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running on Android](#running-on-android)
- [Project Structure](#project-structure)
- [Voice Commands](#voice-commands)
- [Offline Mode](#offline-mode)
- [Known Limitations](#known-limitations)

---

## About This Branch

This is `rachana_version` — a feature branch built on top of the original `main` branch.

It introduces significant improvements across four areas: AI prompt engineering, new features, offline support, and accessibility depth. The `main` branch is untouched. Once testing is complete, this branch will be merged into `main`.

---

## What Changed in rachana_version

### Week 1 — Foundation & Bug Fixes
- **Structured Gemini prompts** — AI now returns JSON with `summary`, `objects`, `warnings`, and `confidence` instead of plain text. Warnings are always spoken first.
- **Fixed `speech.ts`** — Added `onEnd` callback so the speaking state is accurate. Fixed a race condition when voices load. Removed unnecessary 50ms delay.
- **Fixed `useVoiceCommands.ts`** — Resolved stale closure bug where the auto-restart loop checked old error state. Typed `SpeechRecognition` ref properly.
- **Fixed `use-toast.ts`** — `TOAST_REMOVE_DELAY` was set to ~16 minutes (1,000,000ms), leaking every toast in memory. Fixed to 1,000ms. Also fixed `useEffect` dep array causing listener churn.
- **Fixed `EmergencyHelp.tsx`** — `AudioContext` was being created on every beep and never closed (browser limit: ~6 contexts). Now reuses one context per alert session. Fixed stale `isAlertActive` closure in the alert loop using `useRef`.
- **Removed duplicate speech code** — `Index.tsx` was calling `window.speechSynthesis` directly, bypassing the native TTS fallback. All speech now goes through `speech.ts`.
- **Fixed `NotFound.tsx`** — Now uses React Router `<Link>` instead of `<a href>`, uses semantic design tokens, and updates `document.title`.
- **Removed unused `App.css`** — Was Vite scaffold boilerplate with no relation to the app.

### Week 2 — New Features
- **History screen** — Stores last 10 analyses in `localStorage`. Each entry shows the captured image, summary, detected objects, warnings, and timestamp. Can be replayed aloud, expanded, or deleted.
- **Language support** — English, हिंदी (Hindi), and मराठी (Marathi). Language selection persists across sessions. The selected language is passed to the Gemini prompt so AI responds in the chosen language. Voice recognition language also switches accordingly.
- **`LanguageContext`** — New React context managing language state across the app.
- **`useHistory` hook** — Manages history entries with add, remove, and clear operations.

### Week 3 — Depth & Polish
- **Onboarding screen** — 3-step tutorial shown on first launch. Each step has a "Read aloud" button so visually impaired users can hear the instructions. Skippable. Only shown once.
- **Settings screen** — Font size (Normal / Large / X-Large), speech rate slider with live test button, theme (Light / Dark / System), high contrast toggle, auto-speak toggle, emergency contacts manager.
- **Custom emergency contacts** — Users can save any name and phone number as an emergency contact (e.g. "Mum", "Doctor"). Replaces the hardcoded 911 number. Contacts appear as individual call buttons in the Emergency Help screen.
- **Offline OCR** — When there is no network connection and the user is in Text Recognition mode, the app falls back to on-device OCR using Tesseract.js (loaded from CDN on first use). An "Offline mode" badge is shown on results. Accuracy is lower than Gemini but the app remains functional.
- **`SettingsContext`** — New React context applying font size, theme, and high contrast changes to the document root in real time.
- **`useEmergencyContacts` hook** — Manages contacts in `localStorage` with add, remove, and update operations.
- **`useOfflineOCR` hook** — Lazy-loads Tesseract.js, reuses the worker across calls, and exposes progress state for the loading bar UI.

### Week 4 — Viva Ready
- **Hazard Detection mode** — A dedicated AI mode with a prompt focused entirely on safety hazards (stairs, wet floors, obstacles, traffic). Results include position and distance for every hazard. All-clear state is shown when no hazards are found. Haptic feedback is more urgent when hazards are detected.
- **Usage analytics** — Tracks object detections, text reads, hazard scans, emergency activations, offline OCR uses, total sessions, and first/last used dates — all stored locally. A collapsible stats card on the home screen shows these numbers.
- **Confidence-based response framing** — AI responses are prefixed based on the confidence field: "I can clearly see" (high), "I think I can see" (medium), "I'm not entirely sure, but" (low). Shown in both the UI and spoken aloud.
- **PWA + Service Worker** — App can be installed on Android via "Add to Home Screen" without an APK. Service worker caches the app shell for offline navigation. `manifest.json` updated with correct icons, theme colour, and app metadata.
- **`useAnalytics` hook** — Tracks all events in `localStorage` with a clean `track(event)` API.
- **`StatsCard` component** — Collapsible stats panel, only visible after some usage.
- **Updated `main.tsx`** — Registers the service worker on app load. Added null check on root element.

---

## Features

| Feature | Description |
|---|---|
| Object Detection | Describes scene with object names, positions, and distances |
| Text Recognition | Reads any visible text aloud, flags urgent items |
| Hazard Detection | Scans for safety hazards with position and distance |
| Emergency Help | Loud alarm, vibration, and call to saved contacts |
| Voice Control | Hands-free navigation via speech commands |
| Multilingual | English, Hindi, Marathi — AI responds in chosen language |
| Offline OCR | Basic text recognition without internet |
| History | Last 10 analyses stored and replayable |
| Settings | Font size, speech rate, theme, high contrast, contacts |
| PWA | Installable on Android without APK distribution |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript + Vite |
| Mobile | Capacitor 8 (Android) |
| AI | Google Gemini 2.5 Flash (Vision) |
| Offline OCR | Tesseract.js 5 (CDN) |
| UI | shadcn/ui + Tailwind CSS |
| Voice Input | Web Speech API (SpeechRecognition) |
| Voice Output | Capacitor Text-to-Speech (native Android) + Web Speech API (fallback) |
| State | React Context + localStorage |

---

## Prerequisites

Make sure you have all of the following installed before proceeding:

| Tool | Version | Download |
|---|---|---|
| Node.js | 18 or higher | [nodejs.org](https://nodejs.org) |
| npm | comes with Node.js | — |
| Capacitor CLI | 8.x | `npm install -g @capacitor/cli` |
| Android Studio | Latest stable | [developer.android.com/studio](https://developer.android.com/studio) |
| Android SDK | API 22+ | Install via Android Studio SDK Manager |
| Java JDK | 17 | Install via Android Studio or separately |

Also required:
- A **Google Gemini API key** — get one free at [aistudio.google.com](https://aistudio.google.com)
- An Android device or emulator with camera access

---

## Getting Started

### 1. Clone and switch to this branch

```bash
git clone https://github.com/<your-org>/noongil-vision-guide.git
cd noongil-vision-guide
git checkout rachana_version
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the project root:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

> ⚠️ Never commit this file. It is already listed in `.gitignore`.

### 4. Build the project

```bash
npm run build
```

### 5. Sync with Android

```bash
npx cap sync android
```

### 6. Open in Android Studio

```bash
npx cap open android
```

Then in Android Studio:
- Wait for Gradle sync to complete
- Connect your Android device via USB (enable USB Debugging in Developer Options)
- Click **Run** (the green play button)

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_GEMINI_API_KEY` | Yes | Google Gemini API key for AI vision analysis |

No other environment variables are needed. All user preferences (language, settings, history, contacts) are stored in `localStorage` on the device.

---

## Running on Android

### Physical device (recommended)
1. Enable **Developer Options** on your Android phone (tap Build Number 7 times in Settings → About Phone)
2. Enable **USB Debugging**
3. Connect via USB
4. Run from Android Studio

### Emulator
1. Open Android Studio → Device Manager → Create Virtual Device
2. Choose a device with a camera (e.g. Pixel 6)
3. Select API 30 or higher
4. Run the app on the emulator

> Note: Voice commands and camera may behave differently on emulators. Physical device testing is strongly recommended.

---

## Project Structure

```
src/
├── components/
│   ├── Camera.tsx              # Camera capture with auto-capture countdown
│   ├── EmergencyHelp.tsx       # Emergency alarm + contacts
│   ├── HistoryScreen.tsx       # Last 10 analyses
│   ├── OnboardingScreen.tsx    # First-time tutorial (3 steps)
│   ├── SettingsScreen.tsx      # All user preferences
│   ├── StatsCard.tsx           # Usage analytics card
│   ├── VisionAnalysis.tsx      # AI analysis results (object / text / hazard)
│   └── ui/                     # shadcn/ui components (do not modify)
├── contexts/
│   ├── LanguageContext.tsx     # English / Hindi / Marathi
│   └── SettingsContext.tsx     # Font size, theme, speech rate, high contrast
├── hooks/
│   ├── useAnalytics.ts         # Local usage tracking
│   ├── useEmergencyContacts.ts # Saved emergency contacts
│   ├── useHistory.ts           # Analysis history in localStorage
│   ├── useOfflineOCR.ts        # Tesseract.js offline text recognition
│   ├── use-toast.ts            # Toast notifications
│   └── useVoiceCommands.ts     # Speech recognition + voice command routing
├── pages/
│   ├── Index.tsx               # Main app screen and navigation
│   └── NotFound.tsx            # 404 page
├── utils/
│   └── speech.ts               # TTS (native + web fallback)
├── App.tsx                     # Provider setup and routing
└── main.tsx                    # Entry point + service worker registration

public/
├── icons/
│   ├── icon-192.png            # PWA icon
│   └── icon-512.png            # PWA icon
├── manifest.json               # PWA manifest
└── sw.js                       # Service worker
```

---

## Voice Commands

The app listens continuously once activated. Supported commands:

| Say | Action |
|---|---|
| "Describe scene" / "Look" / "Describe" | Opens camera in Object Detection mode |
| "Read text" / "Read" | Opens camera in Text Recognition mode |
| "Emergency" / "Help" | Opens Emergency Help screen |
| "Stop" / "Cancel" | Returns to home screen |

Hindi and Marathi voice commands are also supported when the respective language is selected. The app recognises "मदद" (Hindi: help) and "मदत" (Marathi: help) as emergency triggers.

---

## Offline Mode

When there is no internet connection:

- **Object Detection** — not available offline (requires Gemini)
- **Hazard Detection** — not available offline (requires Gemini)
- **Text Recognition** — falls back to on-device OCR via Tesseract.js. Results are less accurate but functional. An "Offline mode" badge is displayed.
- **All other features** — fully available offline (history, settings, emergency contacts, TTS)

---

## Known Limitations

- Gemini API key is bundled in the client build. For production, this should be proxied through a backend server.
- Speech recognition requires an active internet connection on Android (Web Speech API uses Google's servers).
- Tesseract.js offline OCR is English-only regardless of language setting.
- Object Detection and Hazard Detection modes do not have an offline fallback.
- Distance estimation in Object Detection is approximate — Gemini estimates based on visual cues, not sensor data.

---

## License

This project was developed as a final year engineering project.
All rights reserved © 2025 
