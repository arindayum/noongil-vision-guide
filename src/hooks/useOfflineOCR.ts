import { useState, useCallback, useRef } from 'react';

export type OcrStatus = 'idle' | 'loading' | 'running' | 'done' | 'error';

interface OcrResult {
  text: string;
  confidence: number; // 0–100 from Tesseract
}

export const useOfflineOCR = () => {
  const [status, setStatus] = useState<OcrStatus>('idle');
  const [progress, setProgress] = useState(0);
  // Store worker reference to reuse it (expensive to create)
  const workerRef = useRef<any>(null);
  const loadingRef = useRef(false);

  /**
   * Dynamically import Tesseract.js (bundled via npm, not CDN).
   * This ensures the worker files are included in the Capacitor build.
   */
  const getWorker = useCallback(async () => {
    if (workerRef.current) return workerRef.current;
    if (loadingRef.current) {
      // Wait for ongoing load
      await new Promise(r => setTimeout(r, 200));
      return workerRef.current;
    }

    loadingRef.current = true;
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng', 1, {
        // ✅ Mobile-optimized settings
        logger: (m: any) => {
          if (m.status === 'recognizing text' && typeof m.progress === 'number') {
            setProgress(Math.round(m.progress * 100));
          }
        },
        // ✅ Use bundled worker files (works offline in Capacitor)
        workerPath: undefined,   // use default from npm package
        langPath: undefined,     // use default
        corePath: undefined,
        cacheMethod: 'write',    // cache language data after first load
      });
      workerRef.current = worker;
      return worker;
    } finally {
      loadingRef.current = false;
    }
  }, []);

  const recognizeText = useCallback(async (imageSrc: string): Promise<OcrResult | null> => {
    setStatus('loading');
    setProgress(0);

    try {
      setStatus('loading');
      const worker = await getWorker();

      setStatus('running');
      setProgress(10);

      const result = await worker.recognize(imageSrc);
      const text = result.data.text?.trim() || '';
      const confidence = Math.round(result.data.confidence ?? 0);

      setProgress(100);
      setStatus('done');

      return {
        text: text || 'No text detected in this image.',
        confidence,
      };
    } catch (error) {
      setStatus('error');
      if (import.meta.env.DEV) console.error('Tesseract OCR error:', error);
      return null;
    }
  }, [getWorker]);

  const terminate = useCallback(async () => {
    if (workerRef.current) {
      try {
        await workerRef.current.terminate();
      } catch {}
      workerRef.current = null;
    }
    setStatus('idle');
    setProgress(0);
  }, []);

  return { recognizeText, terminate, status, progress };
};
