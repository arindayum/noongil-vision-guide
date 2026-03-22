import { useState, useCallback, useRef } from 'react';

export type OcrStatus = 'idle' | 'loading' | 'running' | 'done' | 'error';

interface OcrResult {
  text: string;
  confidence: number; // 0–100 from Tesseract
}

// Tesseract is loaded from CDN as a UMD global — declare minimal type
declare const Tesseract: {
  createWorker: (lang: string) => Promise<{
    recognize: (image: string) => Promise<{ data: { text: string; confidence: number } }>;
    terminate: () => Promise<void>;
  }>;
};

const TESSERACT_CDN = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';

const loadTesseract = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof Tesseract !== 'undefined') { resolve(); return; }
    const script = document.createElement('script');
    script.src = TESSERACT_CDN;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Tesseract.js'));
    document.head.appendChild(script);
  });
};

export const useOfflineOCR = () => {
  const [status, setStatus] = useState<OcrStatus>('idle');
  const [progress, setProgress] = useState(0);
  const workerRef = useRef<Awaited<ReturnType<typeof Tesseract.createWorker>> | null>(null);

  const recognizeText = useCallback(async (imageSrc: string): Promise<OcrResult | null> => {
    setStatus('loading');
    setProgress(0);

    try {
      await loadTesseract();
      setStatus('running');
      setProgress(20);

      // Reuse worker if already created
      if (!workerRef.current) {
        workerRef.current = await Tesseract.createWorker('eng');
      }
      setProgress(60);

      const result = await workerRef.current.recognize(imageSrc);
      setProgress(100);
      setStatus('done');

      return {
        text: result.data.text.trim() || 'No text detected in this image.',
        confidence: Math.round(result.data.confidence),
      };
    } catch (error) {
      setStatus('error');
      if (import.meta.env.DEV) console.error('Tesseract error:', error);
      return null;
    }
  }, []);

  const terminate = useCallback(async () => {
    if (workerRef.current) {
      await workerRef.current.terminate();
      workerRef.current = null;
    }
  }, []);

  return { recognizeText, terminate, status, progress };
};
