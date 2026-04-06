import React, { useState, useRef, useCallback } from 'react';
import { AlertTriangle, Phone, Volume2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { speak } from '@/utils/speech';
import { useEmergencyContacts } from '@/hooks/useEmergencyContacts';

import { useLanguage } from '@/contexts/LanguageContext';

interface EmergencyHelpProps {
  onClose: () => void;
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
    close: 'Close emergency help'
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
    speech: 'आपातकालीन अलर्ट सक्रिय कर दिया गया है। यह सहायता के लिए अनुरोध है। कृपया मदद करें यदि आप यह संदेश सुन सकते हैं।',
    close: 'आपातकालीन सहायता बंद करें'
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
    speech: 'आणीबाणीचा अलर्ट सुरू झाला आहे. ही मदतीची विनंती आहे. जर तुम्ही हा संदेश ऐकू शकत असाल तर कृपया मदत करा.',
    close: 'आणीबाणी मदत बंद करा'
  }
};

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

const EmergencyHelp: React.FC<EmergencyHelpProps> = ({ onClose }) => {
  const [isAlertActive, setIsAlertActive] = useState(false);
  const shouldStopRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const alertStatusRef = useRef<HTMLDivElement>(null);
  const { contacts } = useEmergencyContacts();
  const { language } = useLanguage();
  const s = EMERGENCY_STRINGS[language.code] || EMERGENCY_STRINGS.en;

  const startEmergencyAlert = useCallback(async () => {
    shouldStopRef.current = false;
    setIsAlertActive(true);
    setTimeout(() => alertStatusRef.current?.focus(), 50);

    if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500]);

    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioCtx();
    }

    for (let i = 0; i < 5; i++) {
      if (shouldStopRef.current) break;
      try {
        await playBeep(audioCtxRef.current, i % 2 === 0 ? 880 : 660, 0.7);
        if (!shouldStopRef.current) await new Promise(r => setTimeout(r, 250));
      } catch (error) {
        if (import.meta.env.DEV) console.error('Audio error:', error);
      }
    }

    if (!shouldStopRef.current) {
      speak(s.speech);
    }
  }, [s.speech]);

  const stopAlert = useCallback(() => {
    shouldStopRef.current = true;
    setIsAlertActive(false);
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (navigator.vibrate) navigator.vibrate(0);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="min-h-screen p-4">
        <div className="max-w-lg mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-destructive">{s.title}</h1>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label={s.close}>
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Alert status */}
          <div ref={alertStatusRef} tabIndex={-1} aria-live="assertive" aria-atomic="true" className="outline-none">
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

          {/* Sound alert */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-accent" />
                {s.soundAlert}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-accessible text-muted-foreground mb-4">
                {s.soundAlertDesc}
              </p>
              <Button size="xl" variant="accent" onClick={startEmergencyAlert} disabled={isAlertActive} className="w-full" aria-label={s.activateAlert}>
                <Volume2 className="mr-3" />
                {s.activateAlert}
              </Button>
            </CardContent>
          </Card>

          {/* Emergency contacts — one card per contact */}
          {contacts.map(contact => (
            <Card key={contact.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Phone className="h-6 w-6 text-destructive" />
                  {contact.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-accessible text-muted-foreground mb-4">
                  {contact.number}
                </p>
                <Button
                  size="xl"
                  variant="destructive"
                  onClick={() => { window.location.href = `tel:${contact.number}`; }}
                  className="w-full"
                  aria-label={`${s.call} ${contact.name}`}
                >
                  <Phone className="mr-3" />
                  {s.call} {contact.name}
                </Button>
              </CardContent>
            </Card>
          ))}

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
