import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';

export const speak = async (text: string) => {
    if (!text) return;

    console.log('Speaking:', text.substring(0, 50));

    if (Capacitor.isNativePlatform()) {
        try {
            await TextToSpeech.speak({
                text,
                lang: 'en-US',
                rate: 1.0,
                pitch: 1.0,
                volume: 1.0,
                category: 'ambient',
            });
        } catch (error) {
            console.error('Native TTS Error:', error);
            // Fallback to web if native fails
            webSpeak(text);
        }
    } else {
        webSpeak(text);
    }
};

export const stop = async () => {
    if (Capacitor.isNativePlatform()) {
        try {
            await TextToSpeech.stop();
        } catch (error) {
            console.error('Native Stop Error:', error);
            webStop();
        }
    } else {
        webStop();
    }
};

const webSpeak = (text: string) => {
    if (!('speechSynthesis' in window)) {
        console.error('Web Specch API not supported');
        return;
    }

    window.speechSynthesis.cancel();

    const doSpeak = () => {
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            utterance.voice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || voices[0];
        }
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
            doSpeak();
            window.speechSynthesis.onvoiceschanged = null;
        };
    } else {
        setTimeout(doSpeak, 50);
    }
};

const webStop = () => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
};
