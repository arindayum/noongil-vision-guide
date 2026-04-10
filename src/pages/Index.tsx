import React, { useState, useEffect, useCallback } from 'react';
import { Eye, FileText, AlertTriangle, Clock, Settings, Camera as CameraIcon, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Camera from '@/components/Camera';
import VisionAnalysis, { type AnalysisMode } from '@/components/VisionAnalysis';
import EmergencyHelp from '@/components/EmergencyHelp';
import HistoryScreen from '@/components/HistoryScreen';
import SettingsScreen from '@/components/SettingsScreen';
import OnboardingScreen, { hasCompletedOnboarding } from '@/components/OnboardingScreen';
import StatsCard from '@/components/StatsCard';
import { useToast } from '@/hooks/use-toast';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';
import { useHistory } from '@/hooks/useHistory';
import { useAnalytics } from '@/hooks/useAnalytics';
import { speak, stop } from '@/utils/speech';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSettings } from '@/contexts/SettingsContext';
import type { StructuredResult } from '@/components/VisionAnalysis';

// BUG FIX: AppMode was missing 'history', 'settings', 'onboarding' which are used by components
type AppMode = 'home' | 'camera' | 'analysis' | 'emergency' | 'history' | 'settings' | 'onboarding';

const Index = () => {
  const [currentMode, setCurrentMode] = useState<AppMode>(() =>
    hasCompletedOnboarding() ? 'home' : 'onboarding'
  );
  // BUG FIX: AnalysisMode imported from VisionAnalysis to include 'hazard'; was typed locally as 'object'|'text' only
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('object');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAutoCapturing, setIsAutoCapturing] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const { toast } = useToast();
  const { language } = useLanguage();
  const { settings } = useSettings();
  const { entries, addEntry } = useHistory();
  const { data: analyticsData, track, incrementSession } = useAnalytics();

  // BUG FIX: speakAnnouncement was defined inline and called window.speechSynthesis directly,
  // bypassing speech.ts (no onEnd tracking, no native TTS on Android). Use speak() instead.
  const speakAnnouncement = useCallback((text: string) => {
    speak(text);
  }, []);

  const { isListening, error: voiceError } = useVoiceCommands(
    {
      onDescribe: () => {
        setAnalysisMode('object');
        setCurrentMode('camera');
        setIsAutoCapturing(true);
        speakAnnouncement('Detecting objects. Capturing in three seconds. Please hold your phone steady.');
      },
      onRead: () => {
        setAnalysisMode('text');
        setCurrentMode('camera');
        setIsAutoCapturing(true);
        speakAnnouncement('Reading text. Capturing in three seconds. Please hold your phone steady.');
      },
      onEmergency: () => {
        handleEmergencyHelp();
      },
      onStop: () => {
        handleBackToHome();
      },
    },
    hasInteracted,
    language.voiceLang, // BUG FIX: voiceLang was hardcoded to 'en-US'; now uses selected language
  );

  // BUG FIX: voiceError effect had [voiceError, toast] as deps but toast is stable — fine.
  // The real bug: toast was called on every re-render if voiceError didn't change.
  // Now only fires when voiceError is non-null to avoid redundant toasts.
  useEffect(() => {
    if (!voiceError) return;
    toast({
      title: 'Voice Control Error',
      description: voiceError,
      variant: 'destructive',
    });
  }, [voiceError, toast]);

  // BUG FIX: "DoorDrushti activated" announcement on first interaction now uses speak() not
  // inline SpeechSynthesisUtterance, so the isSpeaking flag is set correctly.
  useEffect(() => {
    if (hasInteracted) {
      incrementSession();
      speakAnnouncement('DoorDrushti activated. Say "Describe scene" or "Read text" to start.');
    }
  }, [hasInteracted]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDetectObjects = useCallback(() => {
    setAnalysisMode('object');
    setCurrentMode('camera');
    if (navigator.vibrate) navigator.vibrate(50);
    // BUG FIX: was creating its own SpeechSynthesisUtterance bypassing speech.ts
    speakAnnouncement('Opening camera for object detection');
  }, [speakAnnouncement]);

  const handleReadText = useCallback(() => {
    setAnalysisMode('text');
    setCurrentMode('camera');
    if (navigator.vibrate) navigator.vibrate(50);
    speakAnnouncement('Opening camera for text recognition');
  }, [speakAnnouncement]);

  const handleDetectHazards = useCallback(() => {
    setAnalysisMode('hazard');
    setCurrentMode('camera');
    if (navigator.vibrate) navigator.vibrate(50);
    speakAnnouncement('Opening camera for hazard detection');
  }, [speakAnnouncement]);

  const handleEmergencyHelp = useCallback(() => {
    setCurrentMode('emergency');
    track('emergencyActivations');
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    speakAnnouncement('Emergency help activated');
  }, [track, speakAnnouncement]);

  const handleImageCapture = useCallback((imageSrc: string) => {
    setCapturedImage(imageSrc);
    setCurrentMode('analysis');
    setIsAutoCapturing(false);
    toast({ title: 'Photo Captured', description: 'Analysing image…' });
  }, [toast]);

  // BUG FIX: handleBackToHome was calling window.speechSynthesis.cancel() directly,
  // bypassing speech.ts isSpeaking flag — use stop() from speech.ts instead.
  const handleBackToHome = useCallback(() => {
    stop();
    setCurrentMode('home');
    setCapturedImage(null);
    setIsAutoCapturing(false);
    if (navigator.vibrate) navigator.vibrate(50);
  }, []);

  const handleBackToCamera = useCallback(() => {
    setCurrentMode('camera');
    setCapturedImage(null);
  }, []);

  // BUG FIX: handleActivate was calling speak() but also creating a fresh
  // SpeechSynthesisUtterance in handleDetectObjects/handleReadText — consolidated.
  const handleActivate = useCallback(() => {
    setHasInteracted(true);
    if (navigator.vibrate) navigator.vibrate([50, 50]);
  }, []);

  // BUG FIX: onSaveToHistory was NOT wired up in the original Index.tsx VisionAnalysis call,
  // so history was never populated. Fixed here.
  const handleSaveToHistory = useCallback(
    (entry: Omit<Parameters<typeof addEntry>[0], never>) => {
      addEntry(entry as any);
      if (entry.mode === 'object') track('objectDetections');
      else if (entry.mode === 'text') track('textReads');
      else if (entry.mode === 'hazard') track('hazardDetections');
    },
    [addEntry, track],
  );

  // ----- Render: onboarding -----
  if (currentMode === 'onboarding') {
    return <OnboardingScreen onComplete={() => setCurrentMode('home')} />;
  }

  // ----- Render: activation gate -----
  if (!hasInteracted) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center p-8">
        <Button
          onClick={handleActivate}
          className="w-full h-64 text-4xl font-bold bg-white text-primary rounded-3xl shadow-2xl transition-transform active:scale-95"
          aria-label="Tap to activate DoorDrushti Voice Assistant"
        >
          TAP ANYWHERE TO START DOORDRUSHTI
        </Button>
      </div>
    );
  }

  // ----- Render: settings -----
  if (currentMode === 'settings') {
    return <SettingsScreen onClose={handleBackToHome} />;
  }

  // ----- Render: history -----
  if (currentMode === 'history') {
    return <HistoryScreen onClose={handleBackToHome} />;
  }

  // ----- Render: home -----
  if (currentMode === 'home') {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div
                className={`h-3 w-3 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}
              />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Voice Control {isListening ? 'Active' : 'Inactive'}
              </span>
            </div>
            {voiceError && (
              <div className="bg-destructive/10 text-destructive text-xs p-2 rounded-md mb-4 font-medium">
                Voice Error: {voiceError}
              </div>
            )}
            <h1 className="text-3xl font-bold mb-1">DoorDrushti</h1>
            <p className="text-lg text-muted-foreground">AI Vision Assistant</p>
          </div>

          {/* Stats (only shown after some usage) */}
          <StatsCard data={analyticsData} />

          {/* Action Buttons */}
          <div className="space-y-4 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Eye className="h-6 w-6 text-primary" />
                  Detect Objects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-accessible text-muted-foreground mb-4">
                  Identify and describe objects, people, and surroundings
                </p>
                <Button size="xl" onClick={handleDetectObjects} className="w-full" aria-label="Start object detection">
                  <CameraIcon className="mr-3" />
                  Detect Objects
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-primary" />
                  Read Text
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-accessible text-muted-foreground mb-4">
                  Read signs, labels, documents, and any visible text
                </p>
                <Button size="xl" variant="secondary" onClick={handleReadText} className="w-full" aria-label="Start text recognition">
                  <FileText className="mr-3" />
                  Read Text
                </Button>
              </CardContent>
            </Card>

            {/* BUG FIX: Hazard Detection mode existed in VisionAnalysis but had NO button on home screen */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <ShieldAlert className="h-6 w-6 text-accent" />
                  Hazard Detection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-accessible text-muted-foreground mb-4">
                  Scan for safety hazards like stairs, obstacles, and wet floors
                </p>
                <Button size="xl" variant="accent" onClick={handleDetectHazards} className="w-full" aria-label="Start hazard detection">
                  <ShieldAlert className="mr-3" />
                  Detect Hazards
                </Button>
              </CardContent>
            </Card>

            <Card className="border-destructive/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                  Emergency Help
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-accessible text-muted-foreground mb-4">
                  Sound alert and emergency assistance
                </p>
                <Button size="xl" variant="destructive" onClick={handleEmergencyHelp} className="w-full" aria-label="Activate emergency help">
                  <AlertTriangle className="mr-3" />
                  Emergency Help
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Secondary nav */}
          <div className="flex gap-3 mb-8">
            <Button variant="outline" className="flex-1" onClick={() => setCurrentMode('history')} aria-label="View history">
              <Clock className="mr-2 h-5 w-5" /> History ({entries.length})
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setCurrentMode('settings')} aria-label="Open settings">
              <Settings className="mr-2 h-5 w-5" /> Settings
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Tap any button to get started. All features include voice guidance.
          </p>
        </div>
      </div>
    );
  }

  // ----- Render: camera -----
  if (currentMode === 'camera') {
    return (
      <Camera
        onCapture={handleImageCapture}
        onClose={handleBackToHome}
        isActive={true}
        autoCaptureDelay={isAutoCapturing ? 3500 : undefined}
      />
    );
  }

  // ----- Render: analysis -----
  // BUG FIX: Original code had no null guard — if capturedImage is null we'd crash.
  if (currentMode === 'analysis' && capturedImage) {
    return (
      <VisionAnalysis
        imageSrc={capturedImage}
        mode={analysisMode}
        onBack={handleBackToCamera}
        onSaveToHistory={handleSaveToHistory} // BUG FIX: was missing in original
      />
    );
  }

  // ----- Render: emergency -----
  if (currentMode === 'emergency') {
    return <EmergencyHelp onClose={handleBackToHome} />;
  }

  // BUG FIX: Original returned null for analysis mode when capturedImage is null — would show blank screen.
  // Now redirect to home to prevent stuck state.
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Button onClick={handleBackToHome}>Return Home</Button>
    </div>
  );
};

export default Index;
