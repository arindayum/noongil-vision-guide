# DoorDrushti — Build Instructions (Production-Ready APK)

## Prerequisites
- Node.js 18+
- Android Studio (with SDK 34+)
- Java 17+
- `npx cap` (comes from `@capacitor/cli` in devDependencies)

---

## Step-by-Step Build

### 1. Install dependencies
```bash
npm install
```

### 2. Copy your Gemini API key to .env
```
VITE_GEMINI_API_KEY=your_key_here
```

### 3. Build the web app
```bash
npm run build
```
This outputs to `dist/`. With `base: './'` in vite.config, all assets use relative paths — required for Capacitor.

### 4. Sync to Android
```bash
npx cap sync android
```
This copies `dist/` → `android/app/src/main/assets/public/` and updates plugins.

### 5. Open Android Studio
```bash
npx cap open android
```

### 6. Build APK in Android Studio
- Select: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
- APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## Key Fixes Applied (What Was Broken & Why)

### 🔴 Blank Screen → FIXED
**Root cause**: `BrowserRouter` (HTML5 history routing) breaks on Android's `file://` or `capacitor://` scheme — there's no server to handle routes.
**Fix**: `HashRouter` in `App.tsx`. Hash-based URLs (`/#/`) work on any scheme.

### 🔴 Asset 404s → FIXED
**Root cause**: Vite was building with absolute paths (`/assets/index.js`), which fail on `file://`.
**Fix**: `base: './'` in `vite.config.ts` makes all paths relative (`./assets/index.js`).

### 🔴 Service Worker breaking Capacitor → FIXED
**Root cause**: SW registration on `file://` throws security errors.
**Fix**: Guard with `Capacitor.isNativePlatform()` check in `main.tsx`.

### 🔴 Hindi/Marathi in English accent → FIXED
**Root cause**: `speak()` always passed `lang: 'en-US'` to TTS, ignoring the current language.
**Fix**: `speak(text, lang)` now accepts language tag. Passes `hi-IN`/`mr-IN`/`en-IN` to both native TTS and Web Speech API.

### 🔴 App crash on startup → FIXED
**Root cause**: `handleBackToHome` was referenced in `useVoiceCommands`'s `onBack` before it was declared (JavaScript TDZ error).
**Fix**: Moved `handleBackToHome` definition above `useVoiceCommands` in `Index.tsx`.

### 🔴 Offline OCR unreliable → FIXED
**Root cause**: `useOfflineOCR` loaded Tesseract from jsDelivr CDN at runtime — fails offline and on Android.
**Fix**: Uses `import('tesseract.js')` (bundled by Vite) — works 100% offline and is Capacitor-safe.

### 🔴 Emergency not triggering on screen open → FIXED
**Root cause**: Vibration and speech only happened after pressing the button.
**Fix**: `EmergencyHelp` mounts and immediately triggers vibration + voice announcement.

### 🔴 CALL_PHONE permission missing → FIXED
**Fix**: Added `CALL_PHONE` and `CHANGE_AUDIO_SETTINGS` to `AndroidManifest.xml`.

---

## Voice Commands Reference

| Command | Language | Action |
|---------|----------|--------|
| "describe scene" / "दृश्य दिखाओ" / "दृश्य दाखवा" | EN/HI/MR | Opens camera → object detection |
| "read text" / "टेक्स्ट पढ़ो" / "मजकूर वाच" | EN/HI/MR | Opens camera → OCR mode |
| "hazard scan" / "खतरा" / "धोका" | EN/HI/MR | Opens camera → hazard detection |
| "emergency" / "help" / "मदद" / "मदत" | EN/HI/MR | Opens emergency screen |
| "stop" / "बंद" / "थांबा" | EN/HI/MR | Stops and returns home |
| "back" / "पीछे" / "मागे" | EN/HI/MR | Goes back |
| "hindi" / "हिंदी" | EN/HI | Switches to Hindi mode |
| "marathi" / "मराठी" | EN/MR | Switches to Marathi mode |
| "english" / "अंग्रेजी" | HI/MR | Switches to English mode |

