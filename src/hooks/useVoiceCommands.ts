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
  const errorRef = useRef<string | null>(null);
  // BUG FIX: enabledRef needed so the onend closure always sees the current enabled value
  // without being stale. Previously enabled was captured at closure creation time.
  const enabledRef = useRef(enabled);

  useEffect(() => { optionsRef.current = options; }, [options]);
  useEffect(() => { enabledRef.current = enabled; }, [enabled]);

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
      recognitionRef.current.onresult = null;
      try { recognitionRef.current.stop(); } catch { /* already stopped */ }
      recognitionRef.current = null;
      setIsListening(false);
    }
  }, []);

  // BUG FIX: startListening was recreated every time `lang` changed because it was
  // declared with useCallback([...lang...]) but also referenced stopRecognition.
  // The restart loop would rapidly fire on lang changes. Fixed by using a ref for lang too.
  const langRef = useRef(lang);
  useEffect(() => { langRef.current = lang; }, [lang]);

  const startListening = useCallback(() => {
    if (!enabledRef.current) return;
    if (!window.isSecureContext && window.location.hostname !== 'localhost') return;

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
    // BUG FIX: use langRef so we always get the current lang without re-creating the callback
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

      if (checkGlobalSpeaking()) return;

      const isDescribe =
        transcript.includes('describe') || transcript.includes('scene') ||
        transcript.includes('look') || transcript.includes('क्या है') ||
        transcript.includes('दिखाओ') || transcript.includes('काय आहे') ||
        transcript.includes('दाखवा');

      const isRead =
        transcript.includes('read') || transcript.includes('text') ||
        transcript.includes('पढ़ो') || transcript.includes('लिखा') ||
        transcript.includes('वाच') || transcript.includes('लिहिलेला');

      const isEmergency =
        transcript.includes('emergency') || transcript.includes('911') ||
        transcript.includes('help') || transcript.includes('मदद') ||
        transcript.includes('बचाओ') || transcript.includes('मदत') ||
        transcript.includes('वाचवा');

      const isStop =
        transcript.includes('stop') || transcript.includes('cancel') ||
        transcript.includes('रुको') || transcript.includes('बंद') ||
        transcript.includes('थांबा');

      if (isDescribe) optionsRef.current.onDescribe();
      else if (isRead) optionsRef.current.onRead();
      else if (isEmergency) optionsRef.current.onEmergency();
      else if (isStop) optionsRef.current.onStop();
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed') {
        const msg = 'Microphone permission denied.';
        setError(msg); errorRef.current = msg;
      } else if (event.error === 'network') {
        const msg = 'Network error: Voice control requires internet connection.';
        setError(msg); errorRef.current = msg;
      } else if (event.error === 'aborted') {
        // Expected when stopped programmatically — not an error
      } else {
        const msg = `Voice error: ${event.error}`;
        setError(msg); errorRef.current = msg;
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // BUG FIX: Use enabledRef (not captured `enabled`) to prevent stale closure.
      // Original bug: if enabled changed to false AFTER this closure was created,
      // the restart would still fire because the old value was captured.
      if (enabledRef.current && !errorRef.current) {
        setTimeout(() => {
          if (enabledRef.current) startListening();
        }, 1000);
      }
    };

    try {
      recognition.start();
    } catch {
      const msg = 'Could not start voice control.';
      setError(msg); errorRef.current = msg;
    }
  }, [stopRecognition]); // BUG FIX: removed `enabled` and `lang` from deps — using refs

  // BUG FIX: The 'app-speech-state' listener was registered with [enabled, startListening]
  // deps. Because startListening changed on every lang/enabled change, this registered
  // and removed the listener on every render. Now stable via refs.
  useEffect(() => {
    const handleSpeechState = (e: CustomEvent<{ isSpeaking: boolean }>) => {
      if (e.detail.isSpeaking) {
        // Pause recognition while TTS is speaking to avoid echo commands
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch { /* ignore */ }
        }
      } else if (enabledRef.current) {
        startListening();
      }
    };
    window.addEventListener('app-speech-state', handleSpeechState as EventListener);
    return () => window.removeEventListener('app-speech-state', handleSpeechState as EventListener);
  }, [startListening]);

  useEffect(() => {
    if (enabled && !checkGlobalSpeaking()) {
      startListening();
    } else {
      stopRecognition();
    }
    return () => stopRecognition();
  }, [enabled, startListening, stopRecognition]);

  // BUG FIX: When the language changes, restart recognition with the new lang.
  // Without this the recognition would keep using the old language even after a
  // language switch in settings.
  useEffect(() => {
    if (enabled && isListening) {
      stopRecognition();
      setTimeout(() => { if (enabledRef.current) startListening(); }, 300);
    }
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps

  return { isListening, error };
};
