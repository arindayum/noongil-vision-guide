import React, { useState, useEffect } from 'react';
import { Eye, FileText, AlertTriangle, Settings, Camera as CameraIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Camera from '@/components/Camera';
import VisionAnalysis from '@/components/VisionAnalysis';
import EmergencyHelp from '@/components/EmergencyHelp';
import { useToast } from '@/hooks/use-toast';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';
import { speak, stop } from '@/utils/speech';
import { Capacitor } from '@capacitor/core';

type AppMode = 'home' | 'camera' | 'analysis' | 'emergency';
type AnalysisMode = 'object' | 'text';

const Index = () => {
  const [currentMode, setCurrentMode] = useState<AppMode>('home');
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('object');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAutoCapturing, setIsAutoCapturing] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const { toast } = useToast();

  const speakAnnouncement = (text: string) => {
    speak(text);
  };

  const { isListening, error: voiceError } = useVoiceCommands({
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
    }
  }, hasInteracted);

  useEffect(() => {
    if (voiceError) {
      toast({
        title: "Voice Control Error",
        description: voiceError,
        variant: "destructive",
      });
    }
  }, [voiceError, toast]);

  useEffect(() => {
    if (hasInteracted) {
      speakAnnouncement('DoorDrushti activated. Say "Describe scene" or "Read text" to start.');
    }
  }, [hasInteracted]);

  const handleDetectObjects = () => {
    setAnalysisMode('object');
    setCurrentMode('camera');

    // Provide haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    // Announce action for screen readers
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('Opening camera for object detection');
      utterance.rate = 1.2;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleReadText = () => {
    setAnalysisMode('text');
    setCurrentMode('camera');

    // Provide haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    // Announce action for screen readers
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('Opening camera for text recognition');
      utterance.rate = 1.2;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleEmergencyHelp = () => {
    setCurrentMode('emergency');

    // Strong haptic feedback for emergency
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }

    // Announce emergency mode
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('Emergency help activated');
      utterance.rate = 1.2;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleImageCapture = (imageSrc: string) => {
    setCapturedImage(imageSrc);
    setCurrentMode('analysis');
    setIsAutoCapturing(false);

    toast({
      title: "Photo Captured",
      description: "Analyzing image...",
    });
  };

  const handleBackToHome = () => {
    setCurrentMode('home');
    setCapturedImage(null);
    setIsAutoCapturing(false);

    // Stop any ongoing speech
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // Provide haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const handleBackToCamera = () => {
    setCurrentMode('camera');
    setCapturedImage(null);
  };

  const handleActivate = () => {
    setHasInteracted(true);

    // Prime the speech engine
    speak('DoorDrushti activated');

    if (navigator.vibrate) {
      navigator.vibrate([50, 50]);
    }
  };

  if (!hasInteracted) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center p-8">
        <Button
          onClick={handleActivate}
          className="w-full h-64 text-4xl font-bold bg-white text-primary rounded-3xl shadow-2xl transition-transform active:scale-95"
          aria-label="Tap to activate DoorDrushti Voice Assistant"
        >
          TAP ANYWHERE TO START NOONGIL
        </Button>
      </div>
    );
  }

  // Home Screen
  if (currentMode === 'home') {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className={`h-3 w-3 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Voice Control {isListening ? 'Active' : 'Inactive'}
              </span>
            </div>
            {voiceError && (
              <div className="bg-destructive/10 text-destructive text-xs p-2 rounded-md mb-4 font-medium">
                Voice Error: {voiceError}
              </div>
            )}
            <h1 className="text-3xl font-bold mb-2">DoorDrushti</h1>
            <p className="text-lg text-muted-foreground">AI Vision Assistant</p>
          </div>

          {/* Main Action Buttons */}
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
                  Identify and describe objects, people, and surroundings
                </p>
                <Button
                  size="xl"
                  onClick={handleDetectObjects}
                  className="w-full"
                  aria-label="Start object detection"
                >
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
                <Button
                  size="xl"
                  variant="secondary"
                  onClick={handleReadText}
                  className="w-full"
                  aria-label="Start text recognition"
                >
                  <FileText className="mr-3" />
                  Read Text
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
                <Button
                  size="xl"
                  variant="destructive"
                  onClick={handleEmergencyHelp}
                  className="w-full"
                  aria-label="Activate emergency help"
                >
                  <AlertTriangle className="mr-3" />
                  Emergency Help
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Tap any button to get started. All features include voice guidance.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Camera Mode
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

  // Analysis Mode
  if (currentMode === 'analysis' && capturedImage) {
    return (
      <VisionAnalysis
        imageSrc={capturedImage}
        mode={analysisMode}
        onBack={handleBackToCamera}
      />
    );
  }

  // Emergency Mode
  if (currentMode === 'emergency') {
    return (
      <EmergencyHelp
        onClose={handleBackToHome}
      />
    );
  }

  return null;
};

export default Index;
