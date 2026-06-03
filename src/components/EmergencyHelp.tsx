import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AlertTriangle, Phone, Volume2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { speak } from '@/utils/speech';
import { useEmergencyContacts } from '@/hooks/useEmergencyContacts';
import { useLanguage } from '@/contexts/LanguageContext';

interface EmergencyHelpProps {
  onClose: () => void;
  onRegisterTrigger?: (fn: () => void) => void;
}

const EMERGENCY_STRINGS: Record<string, any> = {
  en: {
    title: 'Emergency Help',
    alertActive: 'EMERGENCY ALERT ACTIVE',
    stopAlert: 'Stop Alert',
    soundAlert: 'Sound Alert',
    soundAlertDesc: 'Plays a loud alternating alarm and vibrates to attract attention',
    activateAlert: 'Activate Sound Alert',
    call: 'Call',
    features: 'Emergency Features',
    f1: '• Sound Alert: Plays alternating alarm tones and vibrates',
    f2: '• Emergency Calls: Connects to your saved contacts',
    f3: '• Voice Announcement: Speaks emergency message aloud',
    f4: '• Contacts can be customised in Settings',
    speech: 'Emergency alert activated. This is a request for assistance. Please help if you can hear this message.',
    close: 'Close emergency help',
    dialEmergency: 'Dial Emergency Services',
    dialDesc: 'Call 112 (National Emergency Number)',
  },
  hi: {
    title: 'आपातकालीन सहायता',
    alertActive: 'आपातकालीन अलर्ट सक्रिय',
    stopAlert: 'अलर्ट बंद करें',
    soundAlert: 'आवाज अलर्ट',
    soundAlertDesc: 'ध्यान आकर्षित करने के लिए तेज़ आवाज़ और कंपन करता है',
    activateAlert: 'आवाज अलर्ट शुरू करें',
    call: 'कॉल करें',
    features: 'आपातकालीन विशेषताएं',
    f1: '• ध्वनि अलर्ट: तेज़ आवाज़ और कंपन',
    f2: '• आपातकालीन कॉल: संपर्कों से जुड़ें',
    f3: '• आवाज घोषणा: संदेश जोर से बोलें',
    f4: '• संपर्क सेटिंग्स में बदलें',
    speech: 'आपातकालीन अलर्ट सक्रिय कर दिया गया है। यह सहायता के लिए अनुरोध है। कृपया मदद करें।',
    close: 'आपातकालीन सहायता बंद करें',
    dialEmergency: 'आपातकालीन सेवाओं को कॉल करें',
    dialDesc: '112 डायल करें (राष्ट्रीय आपातकालीन नंबर)',
  },
  mr: {
    title: 'आणीबाणी मदत',
    alertActive: 'आणीबाणी अलर्ट सक्रिय',
    stopAlert: 'अलर्ट थांबवा',
    soundAlert: 'आवाज अलर्ट',
    soundAlertDesc: 'लक्ष वेधण्यासाठी जोरात आवाज आणि कंपने होतात',
    activateAlert: 'आवाज अलर्ट सुरू करा',
    call: 'कॉल करा',
    features: 'आणीबाणी वैशिष्ट्ये',
    f1: '• ध्वनी अलर्ट: जोरात आवाज आणि कंपने',
    f2: '• आणीबाणी कॉल: संपर्कांशी जोडा',
    f3: '• आवाज घोषणा: संदेश जोरात वाचला जातो',
    f4: '• संपर्क सेटिंग्जमध्ये बदला',
    speech: 'आणीबाणीचा अलर्ट सुरू झाला आहे. ही मदतीची विनंती आहे. कृपया मदत करा.',
    close: 'आणीबाणी मदत बंद करा',
    dialEmergency: 'आणीबाणी सेवांना कॉल करा',
    dialDesc: '112 डायल करा (राष्ट्रीय आणीबाणी क्रमांक)',
  },
};

// ✅ Alternating beep pattern for the alarm — more urgent than original
const playBeepSequence = async (
  audioCtx: AudioContext,
  shouldStop: React.MutableRefObject<boolean>,
  cycles = 8,
): Promise<void> => {
  const playTone = (freq: number, dur: number, gain: number) =>
    new Promise<void>(resolve => {
      if (shouldStop.current) { resolve(); return; }
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.connect(g);
      g.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      osc.type = 'square'; // Sharper, more attention-grabbing than sine
      g.gain.setValueAtTime(0.01, audioCtx.currentTime);
      g.gain.linearRampToValueAtTime(gain, audioCtx.currentTime + 0.05);
      g.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + dur - 0.05);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + dur);
      osc.onended = () => resolve();
    });

  for (let i = 0; i < cycles; i++) {
    if (shouldStop.current) break;
    await playTone(1100, 0.4, 0.7); // High pitch
    if (!shouldStop.current) await new Promise(r => setTimeout(r, 80));
    if (shouldStop.current) break;
    await playTone(660, 0.4, 0.7);  // Low pitch
    if (!shouldStop.current) await new Promise(r => setTimeout(r, 80));
  }
};

const EmergencyHelp: React.FC<EmergencyHelpProps> = ({ onClose, onRegisterTrigger }) => {
  const [isAlertActive, setIsAlertActive] = useState(false);
  const shouldStopRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const alertStatusRef = useRef<HTMLDivElement>(null);
  const { contacts } = useEmergencyContacts();
  const { language } = useLanguage();
  const s = EMERGENCY_STRINGS[language.code] || EMERGENCY_STRINGS.en;
  const voiceLang = language.voiceLang;

  // Auto-trigger vibration + speech announcement when emergency screen opens
  useEffect(() => {
    if (navigator.vibrate) {
      navigator.vibrate([300, 100, 300, 100, 300, 100, 500]);
    }
    const t = setTimeout(() => speak(s.speech, voiceLang), 500);
    return () => clearTimeout(t);
  }, []); // runs once on mount

  const startEmergencyAlert = useCallback(async () => {
    shouldStopRef.current = false;
    setIsAlertActive(true);
    setTimeout(() => alertStatusRef.current?.focus(), 50);

    // ✅ Extended vibration pattern — SOS-like (3 short, 3 long, 3 short)
    if (navigator.vibrate) {
      navigator.vibrate([
        100, 100, 100, 100, 100, 200, // 3 short
        300, 100, 300, 100, 300, 200, // 3 long
        100, 100, 100, 100, 100, 500, // 3 short
      ]);
    }

    // Create or resume AudioContext (must be after user gesture)
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      const AudioCtx = window.AudioContext ?? (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }

    try {
      await playBeepSequence(audioCtxRef.current, shouldStopRef, 8);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Emergency audio error:', err);
    }

    // Speak announcement after alarm finishes
    if (!shouldStopRef.current) {
      speak(s.speech, voiceLang);
    }
  }, [s.speech, voiceLang]);

  // Register this component's alarm trigger so voice commands can fire it
  useEffect(() => {
    if (onRegisterTrigger) {
      onRegisterTrigger(startEmergencyAlert);
    }
  }, [onRegisterTrigger, startEmergencyAlert]);

  const stopAlert = useCallback(() => {
    shouldStopRef.current = true;
    setIsAlertActive(false);
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (navigator.vibrate) navigator.vibrate(0); // Cancel vibration
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldStopRef.current = true;
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
      if (navigator.vibrate) navigator.vibrate(0);
    };
  }, []);

  const dialNumber = useCallback((number: string) => {
    // ✅ tel: links trigger the native dialer on Android — this is the correct approach
    // On web it may ask the OS to handle it; on Android Capacitor it opens the Phone app
    window.location.href = `tel:${number}`;
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="min-h-screen p-4">
        <div className="max-w-lg mx-auto space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-destructive">{s.title}</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { stopAlert(); onClose(); }}
              aria-label={s.close}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Live region for screen readers */}
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
                  <p className="text-xl font-bold text-destructive mb-4">{s.alertActive}</p>
                  <Button size="xl" variant="destructive" onClick={stopAlert} className="w-full">
                    {s.stopAlert}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sound alert button */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-accent" />
                {s.soundAlert}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-accessible text-muted-foreground mb-4">{s.soundAlertDesc}</p>
              <Button
                size="xl"
                variant="accent"
                onClick={startEmergencyAlert}
                disabled={isAlertActive}
                className="w-full"
                aria-label={s.activateAlert}
              >
                <Volume2 className="mr-3" />
                {s.activateAlert}
              </Button>
            </CardContent>
          </Card>

          {/* ✅ National emergency dial button (India: 112) */}
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Phone className="h-6 w-6 text-destructive" />
                {s.dialEmergency}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-accessible text-muted-foreground mb-4">{s.dialDesc}</p>
              <Button
                size="xl"
                variant="destructive"
                onClick={() => dialNumber('112')}
                className="w-full"
                aria-label={s.dialEmergency}
              >
                <Phone className="mr-3" />
                112
              </Button>
            </CardContent>
          </Card>

          {/* Saved emergency contacts */}
          {contacts.map(contact => (
            <Card key={contact.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Phone className="h-6 w-6 text-destructive" />
                  {contact.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-accessible text-muted-foreground mb-4">{contact.number}</p>
                <Button
                  size="xl"
                  variant="destructive"
                  onClick={() => dialNumber(contact.number)}
                  className="w-full"
                  aria-label={`${s.call} ${contact.name}`}
                >
                  <Phone className="mr-3" />
                  {s.call} {contact.name}
                </Button>
              </CardContent>
            </Card>
          ))}

          {/* Info card */}
          <Card className="bg-muted">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-3">{s.features}</h3>
              <ul className="space-y-2 text-accessible">
                <li>{s.f1}</li>
                <li>{s.f2}</li>
                <li>{s.f3}</li>
                <li>{s.f4}</li>
              </ul>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default EmergencyHelp;
