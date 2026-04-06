import { useEffect, useState, useCallback, useRef } from 'react';
import { isSpeaking as checkGlobalSpeaking } from '@/utils/speech';

interface VoiceCommandOptions {
  onDescribe: () => void;
  onRead: () => void;
  onEmergency: () => void;
  onStop: () => void;
}

export const useVoiceCommands = (
  options: VoiceCommandOptions,
  enabled: boolean = true,
  lang: string = 'en-US',
) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const optionsRef = useRef(options);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  // useRef for error so onend closure always sees the current value
  const errorRef = useRef<string | null>(null);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      const msg = 'App must be served over HTTPS for voice and camera to work.';
      setError(msg);
      errorRef.current = msg;
    }
  }, []);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.onerror = null;
      try {
        recognitionRef.current.stop();
      } catch {
        // Already stopped
      }
      recognitionRef.current = null;
      setIsListening(false);
    }
  }, []);

  const startListening = useCallback(() => {
    // Explicit parentheses for clarity
    if (!enabled || (!window.isSecureContext && window.location.hostname !== 'localhost')) return;

    const SpeechRecognition =
      window.SpeechRecognition ?? (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      const msg = 'Speech recognition not supported in this browser.';
      setError(msg);
      errorRef.current = msg;
      return;
    }

    stopRecognition();

    const recognition: SpeechRecognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = lang;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      errorRef.current = null;
      if (import.meta.env.DEV) console.log('Speech recognition active, lang:', lang);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[event.results.length - 1][0].transcript
        .toLowerCase()
        .trim();

      if (import.meta.env.DEV) console.log('Voice command heard:', transcript);

      if (checkGlobalSpeaking()) {
        if (import.meta.env.DEV) console.log('Ignoring command because app is speaking');
        return;
      }

      // Hindi and Marathi expanded keywords
      const isDescribe =
        transcript.includes('describe') ||
        transcript.includes('scene') ||
        transcript.includes('look') ||
        transcript.includes('क्या है') || // Hindi: what is
        transcript.includes('दिखाओ') ||   // Hindi: show
        transcript.includes('काय आहे') || // Marathi: what is
        transcript.includes('दाखवा');    // Marathi: show

      const isRead =
        transcript.includes('read') ||
        transcript.includes('text') ||
        transcript.includes('पढ़ो') ||   // Hindi: read
        transcript.includes('लिखा') ||   // Hindi: written
        transcript.includes('वाच') ||    // Marathi: read
        transcript.includes('लिहिलेला'); // Marathi: written

      const isEmergency =
        transcript.includes('emergency') ||
        transcript.includes('911') ||
        transcript.includes('help') ||
        transcript.includes('मदद') ||    // Hindi: help
        transcript.includes('बचाओ') ||   // Hindi: save
        transcript.includes('मदत') ||    // Marathi: help
        transcript.includes('वाचवा');    // Marathi: save

      const isStop =
        transcript.includes('stop') ||
        transcript.includes('cancel') ||
        transcript.includes('रुको') ||   // Hindi: stop
        transcript.includes('बंद') ||   // Hindi/Marathi: close/stop
        transcript.includes('थांबा');    // Marathi: stop

      if (isDescribe) {
        optionsRef.current.onDescribe();
      } else if (isRead) {
        optionsRef.current.onRead();
      } else if (isEmergency) {
        optionsRef.current.onEmergency();
      } else if (isStop) {
        optionsRef.current.onStop();
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (import.meta.env.DEV) console.error('Speech recognition error:', event.error);

      if (event.error === 'not-allowed') {
        const msg = 'Microphone permission denied.';
        setError(msg);
        errorRef.current = msg;
      } else if (event.error === 'network') {
        const msg = 'Network error: Voice control requires internet connection.';
        setError(msg);
        errorRef.current = msg;
      } else if (event.error === 'aborted') {
        // Expected when stopped by code — not an error
      } else {
        const msg = `Voice error: ${event.error}`;
        setError(msg);
        errorRef.current = msg;
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Use errorRef (not state) to avoid stale closure
      if (enabled && !errorRef.current) {
        setTimeout(() => {
          if (enabled) startListening();
        }, 1000);
      }
    };

    try {
      recognition.start();
    } catch {
      const msg = 'Could not start voice control.';
      setError(msg);
      errorRef.current = msg;
    }
  }, [enabled, lang, stopRecognition]);

  useEffect(() => {
    const handleSpeechState = (e: any) => {
      const isAppSpeaking = e.detail.isSpeaking;
      if (isAppSpeaking) {
        // Just stop recognition for now, onend will restart it if enabled
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch { }
        }
      } else if (enabled) {
        startListening();
      }
    };
    window.addEventListener('app-speech-state', handleSpeechState);
    return () => window.removeEventListener('app-speech-state', handleSpeechState);
  }, [enabled, startListening]);

  useEffect(() => {
    if (enabled && !checkGlobalSpeaking()) {
      startListening();
    } else {
      stopRecognition();
    }
    return () => stopRecognition();
  }, [enabled, startListening, stopRecognition]);

  return { isListening, error };
};
