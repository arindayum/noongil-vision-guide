import { useEffect, useState, useCallback, useRef } from 'react';

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

      if (transcript.includes('describe') || transcript.includes('scene') || transcript.includes('look')) {
        optionsRef.current.onDescribe();
      } else if (transcript.includes('read') || transcript.includes('text')) {
        optionsRef.current.onRead();
      } else if (
        transcript.includes('emergency') ||
        transcript.includes('911') ||
        transcript.includes('help') ||
        transcript.includes('मदद') || // Hindi: help
        transcript.includes('मदत')    // Marathi: help
      ) {
        optionsRef.current.onEmergency();
      } else if (transcript.includes('stop') || transcript.includes('cancel') || transcript.includes('रुको')) {
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
    if (enabled) {
      startListening();
    } else {
      stopRecognition();
    }
    return () => stopRecognition();
  }, [enabled, startListening, stopRecognition]);

  return { isListening, error };
};
