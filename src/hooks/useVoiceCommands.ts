import { useEffect, useState, useCallback, useRef } from 'react';

interface VoiceCommandOptions {
    onDescribe: () => void;
    onRead: () => void;
    onEmergency: () => void;
    onStop: () => void;
}

export const useVoiceCommands = (options: VoiceCommandOptions, enabled: boolean = true) => {
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const optionsRef = useRef(options);
    const recognitionRef = useRef<any>(null);

    // Check for Secure Context (required for Mic/Camera)
    useEffect(() => {
        if (!window.isSecureContext && window.location.hostname !== 'localhost') {
            setError("App must be served over HTTPS for voice and camera to work.");
        }
    }, []);

    const stopRecognition = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.onend = null;
            recognitionRef.current.onerror = null;
            try {
                recognitionRef.current.stop();
            } catch (e) {
                console.warn('Error stopping recognition:', e);
            }
            recognitionRef.current = null;
            setIsListening(false);
        }
    }, []);

    const startListening = useCallback(() => {
        if (!enabled || !window.isSecureContext && window.location.hostname !== 'localhost') return;

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError("Speech recognition not supported in this browser.");
            return;
        }

        stopRecognition();

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
            setError(null);
            console.log('Speech recognition active');
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
            console.log('Voice command heard:', transcript);

            if (transcript.includes('describe') || transcript.includes('scene') || transcript.includes('look')) {
                optionsRef.current.onDescribe();
            } else if (transcript.includes('read') || transcript.includes('text')) {
                optionsRef.current.onRead();
            } else if (transcript.includes('emergency') || transcript.includes('911') || transcript.includes('help')) {
                optionsRef.current.onEmergency();
            } else if (transcript.includes('stop') || transcript.includes('cancel')) {
                optionsRef.current.onStop();
            }
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
                setError("Microphone permission denied.");
            } else if (event.error === 'network') {
                setError("Network error: Voice control requires an active internet connection.");
            } else if (event.error === 'aborted') {
                // Aborted often means it was stopped by code or timed out
                console.log('Recognition aborted.');
            } else {
                setError(`Voice error: ${event.error}`);
            }
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
            // Auto-restart if still enabled (and not manually stopped)
            if (enabled && !error) {
                setTimeout(() => {
                    if (enabled) startListening();
                }, 1000);
            }
        };

        try {
            recognition.start();
        } catch (e) {
            console.error('Recognition start failed:', e);
            setError("Could not start voice control.");
        }
    }, [enabled, stopRecognition]);

    useEffect(() => {
        optionsRef.current = options;
    }, [options]);

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
