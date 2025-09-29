import React, { useState, useEffect } from 'react';
import { AlertTriangle, Phone, Volume2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EmergencyHelpProps {
  onClose: () => void;
}

const EmergencyHelp: React.FC<EmergencyHelpProps> = ({ onClose }) => {
  const [isAlertActive, setIsAlertActive] = useState(false);
  const [alertAudio, setAlertAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio context for emergency alert
    const audio = new Audio();
    audio.preload = 'auto';
    
    // Create a simple alert tone using Web Audio API
    const createAlertTone = () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.7, audioContext.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.1, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
      
      return new Promise(resolve => {
        oscillator.onended = resolve;
      });
    };

    setAlertAudio(audio);

    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, []);

  const startEmergencyAlert = async () => {
    setIsAlertActive(true);
    
    // Strong haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([500, 200, 500, 200, 500]);
    }

    // Play alert sound multiple times
    for (let i = 0; i < 5; i++) {
      if (!isAlertActive) break;
      
      try {
        // Create alert tone using Web Audio API
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.8, audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.1, audioContext.currentTime + 0.8);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.8);
        
        await new Promise(resolve => {
          oscillator.onended = resolve;
        });
        
        // Wait between sounds
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error('Audio error:', error);
      }
    }

    // Speak emergency message
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        "Emergency alert activated. This is a request for assistance. Please help if you can hear this message."
      );
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopAlert = () => {
    setIsAlertActive(false);
    
    if (alertAudio) {
      alertAudio.pause();
      alertAudio.currentTime = 0;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (navigator.vibrate) {
      navigator.vibrate(0);
    }
  };

  const callEmergency = () => {
    // In a real app, this would dial emergency services
    // For demo purposes, we'll just show the number
    window.location.href = 'tel:911';
  };

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="min-h-screen p-4">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-destructive">Emergency Help</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close emergency help"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Alert Status */}
          {isAlertActive && (
            <Card className="border-destructive bg-destructive/10">
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4 animate-pulse" />
                <p className="text-xl font-bold text-destructive mb-4">
                  EMERGENCY ALERT ACTIVE
                </p>
                <Button
                  size="xl"
                  variant="destructive"
                  onClick={stopAlert}
                  className="w-full"
                >
                  Stop Alert
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Emergency Actions */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-accent" />
                  Sound Alert
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-accessible text-muted-foreground mb-4">
                  Activate a loud audio alert and vibration to attract attention
                </p>
                <Button
                  size="xl"
                  variant="accent"
                  onClick={startEmergencyAlert}
                  disabled={isAlertActive}
                  className="w-full"
                >
                  <Volume2 className="mr-3" />
                  Activate Sound Alert
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Phone className="h-6 w-6 text-destructive" />
                  Emergency Call
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-accessible text-muted-foreground mb-4">
                  Call emergency services (911 in US)
                </p>
                <Button
                  size="xl"
                  variant="destructive"
                  onClick={callEmergency}
                  className="w-full"
                >
                  <Phone className="mr-3" />
                  Call 911
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Instructions */}
          <Card className="bg-muted">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-3">Emergency Features</h3>
              <ul className="space-y-2 text-accessible">
                <li>• Sound Alert: Plays loud sounds and vibrates your device</li>
                <li>• Emergency Call: Connects to emergency services</li>
                <li>• Voice Announcement: Speaks emergency message aloud</li>
                <li>• Strong Vibration: Attracts attention through touch</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmergencyHelp;