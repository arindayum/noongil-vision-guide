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

### 2. Add your OpenRouter API key to `.env`
Ensure you have created a `.env` file in the root directory and populated it:
```env
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### 3. Build the web app
```bash
npm run build
```
This outputs the built assets to `dist/`. With `base: './'` configured in `vite.config.ts`, all assets use relative paths, which is required for Capacitor.

### 4. Sync to Android
```bash
npx cap sync android
```
This copies the contents of `dist/` → `android/app/src/main/assets/public/` and updates native plugin configurations.

### 5. Open in Android Studio
```bash
npx cap open android
```

### 6. Build APK in Android Studio
- Wait for the Gradle sync to finish.
- Select: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
- The built APK will be located at: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## Voice Commands Reference

The application continuously listens for voice inputs when activated. The voice commands supported across languages are:

| Command | Language | Action |
|---------|----------|--------|
| "describe scene" / "दृश्य दिखाओ" / "दृश्य दाखवा" | EN/HI/MR | Opens camera → object detection |
| "read text" / "टेक्स्ट पढ़ो" / "मजकूर वाच" | EN/HI/MR | Opens camera → OCR mode |
| "hazard scan" / "खतरा" / "धोका" | EN/HI/MR | Opens camera → hazard detection |
| "emergency" / "help" / "मदद" / "मदत" | EN/HI/MR | Opens emergency help screen |
| "stop" / "बंद" / "थांबा" | EN/HI/MR | Stops the alert or audio and returns home |
| "back" / "पीछे" / "मागे" | EN/HI/MR | Navigates back |
| "hindi" / "हिंदी" | EN/HI | Switches app to Hindi mode |
| "marathi" / "मराठी" | EN/MR | Switches app to Marathi mode |
| "english" / "अंग्रेजी" | HI/MR | Switches app to English mode |
