import React, { useState, useRef, useCallback } from 'react';
import { AlertTriangle, Phone, Volume2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { speak } from '@/utils/speech';

interface EmergencyHelpProps {
  onClose: () => void;
  emergencyNumber?: string; // configurable — defaults to 112 (international)
}

// Declare webkitAudioContext once
const AudioCtx = window.AudioContext ?? (window as any).webkitAudioContext;

const playBeep = (audioCtx: AudioContext, frequency = 880, duration = 0.7): Promise<void> => {
  return new Promise(resolve => {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.8, audioCtx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + duration);
    oscillator.onended = () => resolve();
  });
};

const EmergencyHelp: React.FC<EmergencyHelpProps> = ({
  onClose,
  emergencyNumber = '112',
}) => {
  const [isAlertActive, setIsAlertActive] = useState(false);
  const shouldStopRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const alertStatusRef = useRef<HTMLDivElement>(null);

  const startEmergencyAlert = useCallback(async () => {
    shouldStopRef.current = false;
    setIsAlertActive(true);

    // Move focus to alert status for screen readers
    setTimeout(() => alertStatusRef.current?.focus(), 50);

    if (navigator.vibrate) {
      navigator.vibrate([500, 200, 500, 200, 500]);
    }

    // Reuse a single AudioContext for the entire alert sequence
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioCtx();
    }

    for (let i = 0; i < 5; i++) {
      if (shouldStopRef.current) break;
      try {
        // Alternate between two frequencies for a more urgent sound
        await playBeep(audioCtxRef.current, i % 2 === 0 ? 880 : 660, 0.7);
        if (!shouldStopRef.current) {
          await new Promise(resolve => setTimeout(resolve, 250));
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error('Audio error:', error);
      }
    }

    if (!shouldStopRef.current) {
      speak('Emergency alert activated. This is a request for assistance. Please help if you can hear this message.');
    }
  }, []);

  const stopAlert = useCallback(() => {
    shouldStopRef.current = true;
    setIsAlertActive(false);

    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (navigator.vibrate) {
      navigator.vibrate(0);
    }
  }, []);

  const callEmergency = () => {
    window.location.href = `tel:${emergencyNumber}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="min-h-screen p-4">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-destructive">Emergency Help</h1>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close emergency help">
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Alert Status — receives focus when alert activates */}
          <div
            ref={alertStatusRef}
            tabIndex={-1}
            aria-live="assertive"
            aria-atomic="true"
            className="outline-none"
          >
            {isAlertActive && (
              <Card className="border-destructive bg-destructive/10">
                <CardContent className="p-6 text-center">
                  <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4 animate-pulse" />
                  <p className="text-xl font-bold text-destructive mb-4">
                    EMERGENCY ALERT ACTIVE
                  </p>
                  <Button size="xl" variant="destructive" onClick={stopAlert} className="w-full">
                    Stop Alert
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Actions */}
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
                  Plays a loud alternating alarm and vibrates to attract attention
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
                  Call emergency services ({emergencyNumber})
                </p>
                <Button size="xl" variant="destructive" onClick={callEmergency} className="w-full">
                  <Phone className="mr-3" />
                  Call {emergencyNumber}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Info */}
          <Card className="bg-muted">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-3">Emergency Features</h3>
              <ul className="space-y-2 text-accessible">
                <li>• Sound Alert: Plays alternating alarm tones and vibrates</li>
                <li>• Emergency Call: Connects to emergency services ({emergencyNumber})</li>
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
