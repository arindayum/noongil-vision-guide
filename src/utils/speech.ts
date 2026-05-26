import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';

let isAppSpeaking = false;

export const isSpeaking = (): boolean =>
  isAppSpeaking || (typeof window !== 'undefined' && window.speechSynthesis?.speaking);

const setSpeaking = (val: boolean) => {
  isAppSpeaking = val;
  window.dispatchEvent(new CustomEvent('app-speech-state', { detail: { isSpeaking: val } }));
};

/**
 * Speak text with full language/accent support.
 * @param text    - Text to speak
 * @param lang    - BCP-47 language tag e.g. 'hi-IN', 'mr-IN', 'en-IN', 'en-US'
 * @param onEnd   - Callback when speech finishes
 * @param rate    - Speech rate (default 1.0)
 */
export const speak = async (
  text: string,
  lang: string = 'en-IN',
  onEnd?: () => void,
  rate = 1.0,
): Promise<void> => {
  if (!text) return;

  setSpeaking(true);

  const wrappedOnEnd = () => {
    setSpeaking(false);
    onEnd?.();
  };

  if (import.meta.env.DEV) console.log(`Speaking [${lang}]:`, text.substring(0, 60));

  if (Capacitor.isNativePlatform()) {
    try {
      await TextToSpeech.speak({
        text,
        lang,          // ✅ Pass actual lang (hi-IN / mr-IN / en-IN)
        rate,
        pitch: 1.0,
        volume: 1.0,
        category: 'playback', // 'playback' ensures audio plays even in silent mode
      });
      wrappedOnEnd();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Native TTS Error:', error);
      // Fallback to web speech with correct lang
      webSpeak(text, lang, wrappedOnEnd, rate);
    }
  } else {
    webSpeak(text, lang, wrappedOnEnd, rate);
  }
};

export const stop = async (): Promise<void> => {
  setSpeaking(false);
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

/**
 * Pick the best available voice for a given BCP-47 lang.
 * Prefers Indian-accented Google voices for hi-IN / mr-IN / en-IN.
 */
const pickVoice = (voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | undefined => {
  // Exact match first (e.g. 'hi-IN')
  let v = voices.find(v => v.lang === lang);
  if (v) return v;

  // Prefix match (e.g. 'hi' matches 'hi-IN')
  const prefix = lang.split('-')[0];
  v = voices.find(v => v.lang.startsWith(prefix));
  if (v) return v;

  // For English fallback, prefer Indian English
  if (lang.startsWith('en')) {
    v = voices.find(v => v.lang === 'en-IN') ||
        voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('india')) ||
        voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('google'));
    if (v) return v;
  }

  // Last resort: first available voice
  return voices[0];
};

const webSpeak = (text: string, lang: string, onEnd?: () => void, rate = 1.0): void => {
  if (!('speechSynthesis' in window)) {
    if (import.meta.env.DEV) console.error('Web Speech API not supported');
    setSpeaking(false);
    onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();

  const doSpeak = () => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const chosen = pickVoice(voices, lang);
      if (chosen) utterance.voice = chosen;
    }

    utterance.onend = () => {
      setSpeaking(false);
      onEnd?.();
    };
    utterance.onerror = () => {
      setSpeaking(false);
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  };

  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.addEventListener('voiceschanged', doSpeak, { once: true });
  } else {
    doSpeak();
  }
};

const webStop = (): void => {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
};
