import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.doordrudhti.app',
  appName: 'DoorDrushti',
  webDir: 'dist',
  server: {
    // ✅ 'https' scheme is required for:
    //   - SpeechRecognition (needs isSecureContext = true)
    //   - Camera (getUserMedia requires secure context)
    //   - Service Workers
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    // ✅ Keep enabled for debugging; disable before Play Store release
    webContentsDebuggingEnabled: true,
    // ✅ Ensures back button doesn't instantly kill the app
    handleApplicationNotifications: false,
  },
  plugins: {
    // ✅ SplashScreen config to prevent blank-screen flash on launch
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1e40af',   // Matches app primary color
      androidSplashResourceName: 'splash',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
    // ✅ TTS plugin config — enable Indian English as default fallback
    TextToSpeech: {
      // Handled at runtime; no static config needed
    },
  },
};

export default config;
