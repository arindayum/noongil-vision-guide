import React, { useState, useEffect, useCallback } from 'react';
import { Eye, FileText, AlertTriangle, Clock, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Camera from '@/components/Camera';
import VisionAnalysis from '@/components/VisionAnalysis';
import EmergencyHelp from '@/components/EmergencyHelp';
import HistoryScreen from '@/components/HistoryScreen';
import { useToast } from '@/hooks/use-toast';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';
import { useHistory } from '@/hooks/useHistory';
import { useLanguage, LANGUAGES, type AppLanguage } from '@/contexts/LanguageContext';
import { speak, stop } from '@/utils/speech';

type AppMode = 'home' | 'camera' | 'analysis' | 'emergency' | 'history';
type AnalysisMode = 'object' | 'text';

const Index = () => {
  const [currentMode, setCurrentMode] = useState<AppMode>('home');
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('object');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAutoCapturing, setIsAutoCapturing] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  const { toast } = useToast();
  const { addEntry } = useHistory();
  const { language, setLanguage } = useLanguage();

  const { isListening, error: voiceError } = useVoiceCommands(
    {
      onDescribe: useCallback(() => {
        setAnalysisMode('object');
        setCurrentMode('camera');
        setIsAutoCapturing(true);
        speak('Detecting objects. Capturing in three seconds. Please hold your phone steady.');
      }, []),
      onRead: useCallback(() => {
        setAnalysisMode('text');
        setCurrentMode('camera');
        setIsAutoCapturing(true);
        speak('Reading text. Capturing in three seconds. Please hold your phone steady.');
      }, []),
      onEmergency: useCallback(() => {
        setCurrentMode('emergency');
        speak('Emergency help activated');
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      }, []),
      onStop: useCallback(() => {
        setCurrentMode('home');
        setCapturedImage(null);
        setIsAutoCapturing(false);
        stop();
      }, []),
    },
    hasInteracted,
    language.voiceLang,
  );

  useEffect(() => {
    if (voiceError) {
      toast({ title: "Voice Control Error", description: voiceError, variant: "destructive" });
    }
  }, [voiceError, toast]);

  useEffect(() => {
    if (hasInteracted) {
      speak('NoonGil activated. Say "Describe scene" or "Read text" to start.');
    }
  }, [hasInteracted]);

  const handleDetectObjects = () => {
    setAnalysisMode('object');
    setCurrentMode('camera');
    if (navigator.vibrate) navigator.vibrate(50);
    speak('Opening camera for object detection');
  };

  const handleReadText = () => {
    setAnalysisMode('text');
    setCurrentMode('camera');
    if (navigator.vibrate) navigator.vibrate(50);
    speak('Opening camera for text recognition');
  };

  const handleEmergencyHelp = () => {
    setCurrentMode('emergency');
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    speak('Emergency help activated');
  };

  const handleImageCapture = (imageSrc: string) => {
    setCapturedImage(imageSrc);
    setCurrentMode('analysis');
    setIsAutoCapturing(false);
    toast({ title: "Photo Captured", description: "Analysing image…" });
  };

  const handleBackToHome = useCallback(() => {
    setCurrentMode('home');
    setCapturedImage(null);
    setIsAutoCapturing(false);
    stop();
    if (navigator.vibrate) navigator.vibrate(50);
  }, []);

  const handleActivate = () => {
    setHasInteracted(true);
    speak('NoonGil activated');
    if (navigator.vibrate) navigator.vibrate([50, 50]);
  };

  // Activate screen
  if (!hasInteracted) {
    return (
      <main className="min-h-screen bg-primary flex items-center justify-center p-8">
        <h1 className="sr-only">NoonGil — Assistive Vision App</h1>
        <Button
          onClick={handleActivate}
          className="w-full h-64 text-4xl font-bold bg-white text-primary rounded-3xl shadow-2xl transition-transform active:scale-95"
          aria-label="Tap to activate NoonGil Voice Assistant"
        >
          TAP ANYWHERE TO START NOONGIL
        </Button>
      </main>
    );
  }

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

  if (currentMode === 'analysis' && capturedImage) {
    return (
      <VisionAnalysis
        imageSrc={capturedImage}
        mode={analysisMode}
        onBack={() => setCurrentMode('camera')}
        onSaveToHistory={addEntry}
      />
    );
  }

  if (currentMode === 'emergency') {
    return <EmergencyHelp onClose={handleBackToHome} />;
  }

  if (currentMode === 'history') {
    return <HistoryScreen onClose={handleBackToHome} />;
  }

  // Home screen
  return (
    <main className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div
              className={`h-3 w-3 rounded-full ${isListening ? 'bg-success animate-pulse' : 'bg-destructive'}`}
              aria-hidden="true"
            />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Voice Control {isListening ? 'Active' : 'Inactive'}
            </span>
          </div>
          {voiceError && (
            <div role="alert" className="bg-destructive/10 text-destructive text-xs p-2 rounded-md mb-4 font-medium">
              Voice Error: {voiceError}
            </div>
          )}
          <h1 className="text-3xl font-bold mb-2">NoonGil</h1>
          <p className="text-lg text-muted-foreground">AI Vision Assistant</p>
        </div>

        {/* Language selector */}
        <div className="mb-6">
          <button
            onClick={() => setShowLanguagePicker(p => !p)}
            className="flex items-center gap-2 mx-auto text-sm text-muted-foreground hover:text-foreground transition-colors"
            aria-label={`Current language: ${language.label}. Tap to change.`}
            aria-expanded={showLanguagePicker}
          >
            <Globe className="h-4 w-4" />
            {language.label}
          </button>
          {showLanguagePicker && (
            <div className="flex justify-center gap-2 mt-3" role="radiogroup" aria-label="Select language">
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  role="radio"
                  aria-checked={language.code === l.code}
                  onClick={() => { setLanguage(l.code as AppLanguage); setShowLanguagePicker(false); }}
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

        {/* Main actions */}
        <div className="space-y-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Eye className="h-6 w-6 text-primary" />
                Detect Objects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-accessible text-muted-foreground mb-4">
                Identify objects, people, and surroundings with distance estimation
              </p>
              <Button size="xl" onClick={handleDetectObjects} className="w-full" aria-label="Start object detection">
                <Eye className="mr-3" /> Detect Objects
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
                <FileText className="mr-3" /> Read Text
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
                Sound alarm and connect to emergency services
              </p>
              <Button size="xl" variant="destructive" onClick={handleEmergencyHelp} className="w-full" aria-label="Activate emergency help">
                <AlertTriangle className="mr-3" /> Emergency Help
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer actions */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={() => setCurrentMode('history')}
            aria-label="View analysis history"
            className="flex items-center gap-2 text-muted-foreground"
          >
            <Clock className="h-4 w-4" />
            View History
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Tap any button or use voice commands to get started.
        </p>
      </div>
    </main>
  );
};

export default Index;
