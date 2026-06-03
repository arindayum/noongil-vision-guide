import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Eye, FileText, AlertTriangle, Clock, Settings, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Camera from '@/components/Camera';
import VisionAnalysis, { type AnalysisMode, type StructuredResult } from '@/components/VisionAnalysis';
import EmergencyHelp from '@/components/EmergencyHelp';
import HistoryScreen from '@/components/HistoryScreen';
import SettingsScreen from '@/components/SettingsScreen';
import StatsCard from '@/components/StatsCard';
import OnboardingScreen, { hasCompletedOnboarding } from '@/components/OnboardingScreen';
import { useToast } from '@/hooks/use-toast';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';
import { useHistory } from '@/hooks/useHistory';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useLanguage, LANGUAGES, type AppLanguage } from '@/contexts/LanguageContext';
import { speak, stop } from '@/utils/speech';

type AppMode = 'home' | 'camera' | 'analysis' | 'emergency' | 'history' | 'settings';

const UI_STRINGS: Record<string, any> = {
  en: {
    detecting: 'Detecting objects. Capturing in 3 seconds. Please hold steady.',
    reading: 'Reading text. Capturing in 3 seconds. Please hold steady.',
    emergency: 'Emergency help activated',
    welcome: 'DoorDrushti activated. Say Describe scene or Read text to start.',
    activated: 'DoorDrushti activated',
    openObject: 'Opening camera for object detection',
    openText: 'Opening camera for text recognition',
    hazardScan: 'Hazard scan. Capturing in 3 seconds.',
    photoCaptured: 'Photo Captured',
    analysing: 'Analysing image',
    btnDetect: 'Detect Objects',
    btnRead: 'Read Text',
    btnHazard: 'Scan for Hazards',
    btnEmergency: 'Emergency Help',
    btnHistory: 'History',
    btnSettings: 'Settings',
    descDetect: 'Identify objects, people, and surroundings with distance estimation',
    descRead: 'Read signs, labels, documents, and any visible text',
    descHazard: 'Scan your surroundings for safety hazards — stairs, obstacles, wet floors',
    descEmergency: 'Sound alarm and connect to emergency services',
    tapToStart: 'TAP ANYWHERE TO START DOORDRUDHTI',
    voiceActive: 'Voice Active',
    voiceInactive: 'Voice Inactive',
    aiAssistant: 'AI Vision Assistant',
  },
  hi: {
    detecting: 'वस्तुओं की पहचान की जा रही है। 3 सेकंड में फोटो ली जाएगी। कृपया स्थिर रहें।',
    reading: 'टेक्स्ट पढ़ा जा रहा है। 3 सेकंड में फोटो ली जाएगी। कृपया स्थिर रहें।',
    emergency: 'आपातकालीन सहायता सक्रिय कर दी गई है।',
    welcome: 'डोरदृष्टि सक्रिय हो गई है। शुरू करने के लिए दृश्य दिखाओ या टेक्स्ट पढ़ो कहें।',
    activated: 'डोरदृष्टि सक्रिय है।',
    openObject: 'वस्तु पहचान के लिए कैमरा खोला जा रहा है',
    openText: 'टेक्स्ट पढ़ने के लिए कैमरा खोला जा रहा है',
    hazardScan: 'खतरों की जांच। 3 सेकंड में फोटो ली जाएगी।',
    photoCaptured: 'फोटो ली गई',
    analysing: 'छवि का विश्लेषण किया जा रहा है',
    btnDetect: 'वस्तुएं पहचानें',
    btnRead: 'टेक्स्ट पढ़ें',
    btnHazard: 'खतरों की जांच',
    btnEmergency: 'आपातकालीन सहायता',
    btnHistory: 'इतिहास',
    btnSettings: 'सेटिंग्स',
    descDetect: 'दूरी के अनुमान के साथ वस्तुओं, लोगों और परिवेश की पहचान करें',
    descRead: 'साइन, लेबल, दस्तावेज़ और कोई भी दिखाई देने वाला टेक्स्ट पढ़ें',
    descHazard: 'सुरक्षा खतरों के लिए अपने परिवेश को स्कैन करें - सीढ़ियां, बाधाएं, गीला फर्श',
    descEmergency: 'अलार्म बजाएं और आपातकालीन सेवाओं से जुड़ें',
    tapToStart: 'डोरदृष्टि शुरू करने के लिए कहीं भी टैप करें',
    voiceActive: 'आवाज सक्रिय',
    voiceInactive: 'आवाज निष्क्रिय',
    aiAssistant: 'एआई विजन असिस्टेंट',
  },
  mr: {
    detecting: 'वस्तू शोधल्या जात आहेत. 3 सेकंदात फोटो घेतला जाईल. कृपया स्थिर रहा.',
    reading: 'मजकूर वाचला जात आहे. 3 सेकंदात फोटो घेतला जाईल. कृपया स्थिर रहा.',
    emergency: 'आणीबाणीची मदत सुरू झाली आहे.',
    welcome: 'डोरदृष्टि कार्यान्वित झाली आहे. सुरू करण्यासाठी दृश्य दाखवा किंवा मजकूर वाच असे म्हणा.',
    activated: 'डोरदृष्टि सुरू आहे.',
    openObject: 'वस्तू ओळखण्यासाठी कॅमेरा उघडला जात आहे',
    openText: 'मजकूर वाचण्यासाठी कॅमेरा उघडला जात आहे',
    hazardScan: 'धोक्यांची तपासणी. 3 सेकंदात फोटो घेतला जाईल.',
    photoCaptured: 'फोटो घेतला',
    analysing: 'प्रतिमेचे विश्लेषण केले जात आहे',
    btnDetect: 'वस्तू ओळखा',
    btnRead: 'मजकूर वाचा',
    btnHazard: 'धोक्यांची तपासणी',
    btnEmergency: 'आणीबाणीची मदत',
    btnHistory: 'इतिहास',
    btnSettings: 'सेटिंग्ज',
    descDetect: 'द्रव्यमानासह वस्तू, लोक आणि परिसराची ओळख करून घ्या',
    descRead: 'चिन्हे, लेबले, दस्तऐवज आणि कोणताही दृश्य मजकूर वाचा',
    descHazard: 'सुरक्षा धोक्यांसाठी आपला परिसर स्कॅन करा - पायऱ्या, अडथळे, ओले मजले',
    descEmergency: 'अलार्म वाजवा आणि आणीबाणी सेवांशी कनेक्ट व्हा',
    tapToStart: 'डोरदृष्टि सुरू करण्यासाठी कोठेही टॅप करा',
    voiceActive: 'आवाज सक्रिय',
    voiceInactive: 'आवाज निष्क्रिय',
    aiAssistant: 'एआई विजन असिस्टंट',
  },
};

const Index = () => {
  const [currentMode, setCurrentMode] = useState<AppMode>('home');
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('object');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAutoCapturing, setIsAutoCapturing] = useState(false);
  // FIX: Always start with the home screen — no "tap to start" gate
  const [hasInteracted, setHasInteracted] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  // Ref so voice commands can trigger the alarm without needing state
  const triggerAlarmRef = useRef<(() => void) | null>(null);

  const { toast } = useToast();
  const { addEntry } = useHistory();
  const { data: analyticsData, track, incrementSession } = useAnalytics();
  const { language, setLanguage } = useLanguage();

  const strings = UI_STRINGS[language.code] || UI_STRINGS.en;
  const voiceLang = language.voiceLang; // e.g. 'hi-IN', 'mr-IN', 'en-IN'

  // ✅ FIX: Define handleBackToHome BEFORE useVoiceCommands so it's
  // available in the onBack callback without a "used before declaration" crash
  const handleBackToHome = useCallback(() => {
    setCurrentMode('home');
    setCapturedImage(null);
    setIsAutoCapturing(false);
    stop();
    if (navigator.vibrate) navigator.vibrate(50);
  }, []);

  const { isListening, error: voiceError } = useVoiceCommands(
    {
      onDescribe: useCallback(() => {
        setAnalysisMode('object');
        setCurrentMode('camera');
        setIsAutoCapturing(true);
        speak(strings.detecting, voiceLang);
      }, [strings.detecting, voiceLang]),

      onRead: useCallback(() => {
        setAnalysisMode('text');
        setCurrentMode('camera');
        setIsAutoCapturing(true);
        speak(strings.reading, voiceLang);
      }, [strings.reading, voiceLang]),

      onEmergency: useCallback(() => {
        setCurrentMode('emergency');
        track('emergencyActivations');
        speak(strings.emergency, voiceLang);
        if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 100]);
      }, [track, strings.emergency, voiceLang]),

      onStop: useCallback(() => {
        setCurrentMode('home');
        setCapturedImage(null);
        setIsAutoCapturing(false);
        stop();
      }, []),

      onHazardScan: useCallback(() => {
        setAnalysisMode('hazard');
        setCurrentMode('camera');
        setIsAutoCapturing(true);
        speak(strings.hazardScan, voiceLang);
      }, [strings.hazardScan, voiceLang]),

      // ✅ FIX: handleBackToHome is now defined above — no crash
      onBack: useCallback(() => {
        handleBackToHome();
      }, [handleBackToHome]),

      onExit: useCallback(() => {
        speak('Closing application', 'en-IN');
        stop();
      }, []),

      onHindi: useCallback(() => {
        setLanguage('hi');
        speak('हिंदी मोड चालू किया गया', 'hi-IN');
      }, [setLanguage]),

      onMarathi: useCallback(() => {
        setLanguage('mr');
        speak('मराठी मोड सुरू केला आहे', 'mr-IN');
      }, [setLanguage]),

      onEnglish: useCallback(() => {
        setLanguage('en');
        speak('English mode activated', 'en-IN');
      }, [setLanguage]),

      onAlertSound: useCallback(() => {
        // FIX: Navigate to emergency screen so alarm can be triggered with audio context
        setCurrentMode('emergency');
        track('emergencyActivations');
        // triggerAlarmRef is set by EmergencyHelp once mounted
        setTimeout(() => {
          if (triggerAlarmRef.current) {
            triggerAlarmRef.current();
          }
        }, 600); // wait for EmergencyHelp to mount and register its trigger
        speak('Emergency alarm activated', voiceLang);
        if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 300, 100, 500]);
      }, [voiceLang, track]),

      onCallEmergency: useCallback(() => {
        speak('Calling emergency services', voiceLang);
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        // FIX: Actually place the call after speaking
        setTimeout(() => {
          window.location.href = 'tel:112';
        }, 1500);
      }, [voiceLang]),
    },
    hasInteracted,
    language.voiceLang,
  );

  useEffect(() => {
    if (voiceError) {
      toast({ title: 'Voice Control Error', description: voiceError, variant: 'destructive' });
    }
  }, [voiceError, toast]);

  useEffect(() => {
    // Show onboarding on very first launch (hasInteracted is always true now)
    if (!hasCompletedOnboarding()) setShowOnboarding(true);
    incrementSession();
    // Announce the app is ready after a short delay
    setTimeout(() => speak(strings.welcome, voiceLang), 800);
  }, []); // once on mount

  const handleAnalysisComplete = useCallback((result: StructuredResult) => {
    if (analysisMode === 'object') track('objectDetections');
    if (analysisMode === 'text') {
      track('textReads');
    }
    if (analysisMode === 'hazard') track('hazardDetections');
    if (result.warnings.length > 0 && analysisMode !== 'hazard') track('hazardDetections');
  }, [analysisMode, track]);

  if (showOnboarding) return <OnboardingScreen onComplete={() => setShowOnboarding(false)} />;

  if (currentMode === 'camera') {
    return (
      <Camera
        onCapture={(imageSrc) => {
          setCapturedImage(imageSrc);
          setCurrentMode('analysis');
          setIsAutoCapturing(false);
          toast({ title: strings.photoCaptured, description: strings.analysing });
        }}
        onClose={handleBackToHome}
        isActive={true}
        autoCaptureDelay={isAutoCapturing ? 3500 : undefined}
      />
    );
  }

  if (currentMode === 'analysis' && capturedImage) {
    return (
      <VisionAnalysis
        imageSrc={capturedImage}
        mode={analysisMode}
        onBack={() => setCurrentMode('camera')}
        onSaveToHistory={addEntry}
        onAnalysisComplete={handleAnalysisComplete}
      />
    );
  }

  if (currentMode === 'emergency') return <EmergencyHelp onClose={handleBackToHome} onRegisterTrigger={(fn) => { triggerAlarmRef.current = fn; }} />;
  if (currentMode === 'history') return <HistoryScreen onClose={handleBackToHome} />;
  if (currentMode === 'settings') return <SettingsScreen onClose={handleBackToHome} />;

  // ── Home screen ──────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div
              className={`h-3 w-3 rounded-full ${isListening ? 'bg-success animate-pulse' : 'bg-destructive'}`}
              aria-hidden="true"
            />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {isListening ? strings.voiceActive : strings.voiceInactive}
            </span>
          </div>
          {voiceError && (
            <div role="alert" className="bg-destructive/10 text-destructive text-xs p-2 rounded-md mb-3 font-medium">
              {voiceError}
            </div>
          )}
          <h1 className="text-3xl font-bold mb-1">DoorDrushti</h1>
          <p className="text-muted-foreground">{strings.aiAssistant}</p>
        </div>

        {/* Language selector */}
        <div className="mb-5">
          <button
            onClick={() => setShowLanguagePicker(p => !p)}
            className="flex items-center gap-2 mx-auto text-sm text-muted-foreground hover:text-foreground transition-colors"
            aria-label={`Language: ${language.label}. Tap to change.`}
            aria-expanded={showLanguagePicker}
          >
            🌐 {language.label}
          </button>
          {showLanguagePicker && (
            <div className="flex justify-center gap-2 mt-3 flex-wrap" role="radiogroup" aria-label="Select language">
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  role="radio"
                  aria-checked={language.code === l.code}
                  onClick={() => {
                    setLanguage(l.code as AppLanguage);
                    setShowLanguagePicker(false);
                    // Announce the change in the new language
                    const announcements: Record<string, [string, string]> = {
                      en: ['English mode activated', 'en-IN'],
                      hi: ['हिंदी मोड चालू किया गया', 'hi-IN'],
                      mr: ['मराठी मोड सुरू केला आहे', 'mr-IN'],
                    };
                    const [msg, lng] = announcements[l.code] ?? ['Language changed', 'en-IN'];
                    setTimeout(() => speak(msg, lng), 100);
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    language.code === l.code
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary-hover'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Stats card */}
        <StatsCard data={analyticsData} />

        {/* Main actions */}
        <div className="space-y-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Eye className="h-6 w-6 text-primary" />{strings.btnDetect}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-accessible text-muted-foreground mb-4">{strings.descDetect}</p>
              <Button
                size="xl"
                onClick={() => {
                  setAnalysisMode('object');
                  setCurrentMode('camera');
                  speak(strings.openObject, voiceLang);
                  if (navigator.vibrate) navigator.vibrate(50);
                }}
                className="w-full"
                aria-label={strings.btnDetect}
              >
                <Eye className="mr-3" />{strings.btnDetect}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-primary" />{strings.btnRead}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-accessible text-muted-foreground mb-4">{strings.descRead}</p>
              <Button
                size="xl"
                variant="secondary"
                onClick={() => {
                  setAnalysisMode('text');
                  setCurrentMode('camera');
                  speak(strings.openText, voiceLang);
                  if (navigator.vibrate) navigator.vibrate(50);
                }}
                className="w-full"
                aria-label={strings.btnRead}
              >
                <FileText className="mr-3" />{strings.btnRead}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-accent/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <ShieldAlert className="h-6 w-6 text-accent" />{strings.btnHazard}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-accessible text-muted-foreground mb-4">{strings.descHazard}</p>
              <Button
                size="xl"
                variant="accent"
                onClick={() => {
                  setAnalysisMode('hazard');
                  setCurrentMode('camera');
                  speak(strings.hazardScan, voiceLang);
                  if (navigator.vibrate) navigator.vibrate(50);
                }}
                className="w-full"
                aria-label={strings.btnHazard}
              >
                <ShieldAlert className="mr-3" />{strings.btnHazard}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-destructive" />{strings.btnEmergency}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-accessible text-muted-foreground mb-4">{strings.descEmergency}</p>
              <Button
                size="xl"
                variant="destructive"
                onClick={() => {
                  setCurrentMode('emergency');
                  track('emergencyActivations');
                  speak(strings.emergency, voiceLang);
                  if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 100]);
                }}
                className="w-full"
                aria-label={strings.btnEmergency}
              >
                <AlertTriangle className="mr-3" />{strings.btnEmergency}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="flex justify-center gap-4 mb-4">
          <Button
            variant="ghost"
            onClick={() => setCurrentMode('history')}
            aria-label={strings.btnHistory}
            className="text-muted-foreground gap-2"
          >
            <Clock className="h-4 w-4" />{strings.btnHistory}
          </Button>
          <Button
            variant="ghost"
            onClick={() => setCurrentMode('settings')}
            aria-label={strings.btnSettings}
            className="text-muted-foreground gap-2"
          >
            <Settings className="h-4 w-4" />{strings.btnSettings}
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Tap any button or use voice commands to get started.
        </p>
      </div>
    </main>
  );
};

export default Index;
