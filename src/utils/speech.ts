import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';

export const speak = async (text: string, onEnd?: () => void): Promise<void> => {
  if (!text) return;

  if (import.meta.env.DEV) {
    console.log('Speaking:', text.substring(0, 50));
  }

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
      onEnd?.();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Native TTS Error:', error);
      webSpeak(text, onEnd);
    }
  } else {
    webSpeak(text, onEnd);
  }
};

export const stop = async (): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    try {
      await TextToSpeech.stop();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Native Stop Error:', error);
      webStop();
    }
  } else {
    webStop();
  }
};

const webSpeak = (text: string, onEnd?: () => void): void => {
  if (!('speechSynthesis' in window)) {
    if (import.meta.env.DEV) console.error('Web Speech API not supported');
    return;
  }

  window.speechSynthesis.cancel();

  const doSpeak = () => {
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      utterance.voice =
        voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) ||
        voices[0];
    }
    utterance.rate = 1.0;
    if (onEnd) {
      utterance.onend = onEnd;
    }
    window.speechSynthesis.speak(utterance);
  };

  if (window.speechSynthesis.getVoices().length === 0) {
    // Use addEventListener with { once: true } to avoid race when multiple
    // speak() calls arrive before voices load
    window.speechSynthesis.addEventListener('voiceschanged', doSpeak, { once: true });
  } else {
    doSpeak();
  }
};

const webStop = (): void => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};
