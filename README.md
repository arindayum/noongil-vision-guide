# DoorDrushti — Assistive Vision AI

> An Android application that helps visually impaired users understand their surroundings using AI-powered object detection, text recognition, and hazard scanning — with full voice control and multilingual support.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running on Android](#running-on-android)
- [Project Structure](#project-structure)
- [Voice Commands](#voice-commands)
- [Known Limitations](#known-limitations)

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
| History | Last 10 analyses stored and replayable |
| Settings | Font size, speech rate, theme, high contrast, contacts |
| PWA | Installable on Android without APK distribution |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript + Vite |
| Mobile | Capacitor 8 (Android) |
| AI | OpenRouter Gemini 2.5 Flash (via OpenAI-compatible Chat API) |
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
- An **OpenRouter API key** — get one at [openrouter.ai](https://openrouter.ai)
- An Android device or emulator with camera access

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/<your-org>/doordrushti.git
cd doordrushti
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the project root:

```env
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
```

> ⚠️ Never commit this file. It is listed in `.gitignore`.

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
| `VITE_OPENROUTER_API_KEY` | Yes | OpenRouter API key for AI vision analysis (using model: google/gemini-2.5-flash) |

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

## Known Limitations

- OpenRouter API key is bundled in the client build. For production, this should be proxied through a backend server.
- Speech recognition requires an active internet connection on Android (Web Speech API uses Google's servers).
- Object Detection and Hazard Detection modes do not have an offline fallback.
- Distance estimation in Object Detection is approximate — Gemini estimates based on visual cues, not sensor data.

---

## License

This project was developed as a final year engineering project.
All rights reserved © 2025 
