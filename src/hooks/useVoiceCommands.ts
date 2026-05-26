import { useEffect, useState, useCallback, useRef } from 'react';
import { isSpeaking as checkGlobalSpeaking } from '@/utils/speech';

interface VoiceCommandOptions {
  onDescribe: () => void;
  onRead: () => void;
  onEmergency: () => void;
  onStop: () => void;
  onHazardScan?: () => void;
  onBack?: () => void;
  onExit?: () => void;
  onHindi?: () => void;
  onMarathi?: () => void;
  onEnglish?: () => void;
  onAlertSound?: () => void;
  onCallEmergency?: () => void;
}

export const useVoiceCommands = (
  options: VoiceCommandOptions,
  enabled: boolean = true,
  lang: string = 'en-IN',
) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const optionsRef = useRef(options);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const errorRef = useRef<string | null>(null);
  const enabledRef = useRef(enabled);
  const langRef = useRef(lang);

  useEffect(() => { optionsRef.current = options; }, [options]);
  useEffect(() => { enabledRef.current = enabled; }, [enabled]);
  useEffect(() => { langRef.current = lang; }, [lang]);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.onerror = null;
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
      setIsListening(false);
    }
  }, []);

  const startListening = useCallback(() => {
    if (!enabledRef.current) return;

    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      const msg = 'App must be served over HTTPS for voice to work.';
      setError(msg);
      errorRef.current = msg;
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition ?? (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      const msg = 'Speech recognition not supported on this device.';
      setError(msg);
      errorRef.current = msg;
      return;
    }

    stopRecognition();

    const recognition: SpeechRecognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = langRef.current;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      errorRef.current = null;
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[event.results.length - 1][0].transcript
        .toLowerCase()
        .trim();

      if (import.meta.env.DEV) console.log('[VoiceCmd]', transcript);

      // FIX: STOP is always processed first — even during TTS playback.
      // This lets the user interrupt a running description by saying "stop".
      const isStop =
        transcript.includes('stop') ||
        transcript.includes('cancel') ||
        transcript.includes('बंद') ||
        transcript.includes('थांबा') ||
        transcript.includes('रुको');

      if (isStop) {
        optionsRef.current.onStop();
        return;
      }

      // Skip all other commands while TTS is speaking to prevent self-triggering
      if (checkGlobalSpeaking()) return;

      const isDescribe =
        transcript.includes('describe') ||
        transcript.includes('scene') ||
        transcript.includes('object') ||
        transcript.includes('क्या है') ||
        transcript.includes('दृश्य') ||
        transcript.includes('काय आहे') ||
        transcript.includes('दृश्य दाखव');

      const isRead =
        transcript.includes('read') ||
        transcript.includes('text') ||
        transcript.includes('पढ़') ||
        transcript.includes('वाच') ||
        transcript.includes('मजकूर');

      const isEmergency =
        transcript.includes('emergency') ||
        transcript.includes('help') ||
        transcript.includes('sos') ||
        transcript.includes('मदद') ||
        transcript.includes('मदत') ||
        transcript.includes('आपातकाल') ||
        transcript.includes('आणीबाणी');

      const isHazard =
        transcript.includes('hazard') ||
        transcript.includes('danger') ||
        transcript.includes('obstacle') ||
        transcript.includes('scan') ||
        transcript.includes('खतरा') ||
        transcript.includes('धोका');

      const isBack =
        transcript.includes('back') ||
        transcript.includes('go back') ||
        transcript.includes('पीछे') ||
        transcript.includes('मागे');

      const isExit =
        transcript.includes('exit') ||
        transcript.includes('close') ||
        transcript.includes('बाहर') ||
        transcript.includes('बंद कर');

      const isHindi =
        transcript.includes('hindi') ||
        transcript.includes('हिंदी');

      const isMarathi =
        transcript.includes('marathi') ||
        transcript.includes('मराठी');

      const isEnglish =
        transcript.includes('english') ||
        transcript.includes('अंग्रेजी') ||
        transcript.includes('इंग्रजी');

      // FIX: Expanded alarm trigger keywords — covers "alarm", "alert", "siren", "sound", "loud"
      const isAlertSound =
        transcript.includes('alert') ||
        transcript.includes('alarm') ||
        transcript.includes('siren') ||
        transcript.includes('sound alarm') ||
        transcript.includes('make noise') ||
        transcript.includes('अलार्म') ||
        transcript.includes('भोंपू');

      // FIX: Expanded emergency call keywords — covers "call", "dial", "ambulance", "police" etc.
      const isCallEmergency =
        transcript.includes('call emergency') ||
        transcript.includes('call help') ||
        transcript.includes('call 112') ||
        transcript.includes('dial') ||
        transcript.includes('ambulance') ||
        transcript.includes('police') ||
        transcript.includes('fire brigade') ||
        transcript.includes('एम्बुलेंस') ||
        transcript.includes('पोलीस') ||
        transcript.includes('फोन कर');

      // Dispatch — priority order matters
      if (isCallEmergency) {
        optionsRef.current.onCallEmergency?.();
      } else if (isEmergency) {
        optionsRef.current.onEmergency();
      } else if (isHazard) {
        optionsRef.current.onHazardScan?.();
      } else if (isDescribe) {
        optionsRef.current.onDescribe();
      } else if (isRead) {
        optionsRef.current.onRead();
      } else if (isHindi) {
        optionsRef.current.onHindi?.();
      } else if (isMarathi) {
        optionsRef.current.onMarathi?.();
      } else if (isEnglish) {
        optionsRef.current.onEnglish?.();
      } else if (isAlertSound) {
        optionsRef.current.onAlertSound?.();
      } else if (isBack) {
        optionsRef.current.onBack?.();
      } else if (isExit) {
        optionsRef.current.onExit?.();
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed') {
        const msg = 'Microphone permission denied. Please allow it in device settings.';
        setError(msg);
        errorRef.current = msg;
      } else if (event.error === 'network') {
        setIsListening(false);
      } else if (event.error === 'no-speech') {
        setIsListening(false);
      } else if (event.error !== 'aborted') {
        const msg = `Voice error: ${event.error}`;
        setError(msg);
        errorRef.current = msg;
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (enabledRef.current && !errorRef.current) {
        setTimeout(() => {
          if (enabledRef.current) startListening();
        }, 800);
      }
    };

    try {
      recognition.start();
    } catch {
      const msg = 'Could not start voice control.';
      setError(msg);
      errorRef.current = msg;
    }
  }, [stopRecognition]);

  // Start/stop based on enabled + lang changes
  useEffect(() => {
    if (enabled) {
      startListening();
    } else {
      stopRecognition();
    }
    return () => stopRecognition();
  }, [enabled, lang, startListening, stopRecognition]);

  return { isListening, error };
};
