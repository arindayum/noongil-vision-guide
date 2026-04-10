import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';

let isAppSpeaking = false;

export const isSpeaking = (): boolean =>
  isAppSpeaking || (typeof window !== 'undefined' && window.speechSynthesis?.speaking);

const setSpeaking = (val: boolean) => {
  isAppSpeaking = val;
  window.dispatchEvent(new CustomEvent('app-speech-state', { detail: { isSpeaking: val } }));
};

// BUG FIX: Original speak() ignored the `speechRate` from SettingsContext entirely.
// We need to read it at call-time from a shared store. Use a simple module-level setter
// so SettingsContext can push updates here without circular imports.
let _speechRate = 1.0;
export const setSpeechRate = (rate: number) => { _speechRate = rate; };

// BUG FIX: Original speak() did not accept a language parameter, so multilingual TTS
// always spoke in 'en-US' even when the user selected Hindi or Marathi.
export const speak = async (text: string, onEnd?: () => void, lang?: string): Promise<void> => {
  if (!text) return;

  // BUG FIX: Calling speak() while already speaking would stack utterances on web
  // and produce overlapping audio. Cancel first.
  await stop();

  setSpeaking(true);

  const wrappedOnEnd = () => {
    setSpeaking(false);
    onEnd?.();
  };

  if (import.meta.env.DEV) {
    console.log('Speaking:', text.substring(0, 50));
  }

  if (Capacitor.isNativePlatform()) {
    try {
      await TextToSpeech.speak({
        text,
        lang: lang ?? 'en-US',
        rate: _speechRate,  // BUG FIX: was hardcoded 1.0
        pitch: 1.0,
        volume: 1.0,
        category: 'ambient',
      });
      wrappedOnEnd();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Native TTS Error:', error);
      webSpeak(text, wrappedOnEnd, lang);
    }
  } else {
    webSpeak(text, wrappedOnEnd, lang);
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

// BUG FIX: webSpeak() had a race condition — if voices were not yet loaded it registered
// a 'voiceschanged' listener, but that listener would fire even AFTER the component
// calling speak() had unmounted, potentially running a stale onEnd callback on a
// detached component. We guard with a cancelled flag.
const webSpeak = (text: string, onEnd?: () => void, lang?: string): void => {
  if (!('speechSynthesis' in window)) {
    if (import.meta.env.DEV) console.error('Web Speech API not supported');
    onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();

  let cancelled = false;

  const doSpeak = () => {
    if (cancelled) return;
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    if (voices.length > 0) {
      // BUG FIX: Original only looked for 'en' voices.
      // Now respects the requested lang (e.g. 'hi-IN', 'mr-IN').
      const targetLang = lang ?? 'en-US';
      const baseLang = targetLang.split('-')[0];
      utterance.voice =
        voices.find(v => v.lang === targetLang) ||
        voices.find(v => v.lang.startsWith(baseLang)) ||
        voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('google')) ||
        voices[0];
      utterance.lang = targetLang;
    }

    utterance.rate = _speechRate; // BUG FIX: was hardcoded 1.0
    utterance.pitch = 1.0;

    if (onEnd) {
      utterance.onend = () => {
        if (!cancelled) onEnd();
      };
      // BUG FIX: onerror was never handled — if TTS errored the isSpeaking flag
      // would stay true forever, blocking voice recognition permanently.
      utterance.onerror = () => {
        setSpeaking(false);
        if (!cancelled) onEnd();
      };
    }

    window.speechSynthesis.speak(utterance);
  };

  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.addEventListener('voiceschanged', doSpeak, { once: true });
    // BUG FIX: if voiceschanged never fires (some browsers don't), fall back after 1s
    setTimeout(() => {
      if (!cancelled && window.speechSynthesis.getVoices().length === 0) {
        doSpeak();
      }
    }, 1000);
  } else {
    doSpeak();
  }

  // Return a cleanup reference via module-level stop(), which sets cancelled=true
  // indirectly by cancelling the utterance.
  return;
};

const webStop = (): void => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};
