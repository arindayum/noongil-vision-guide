import React, { useRef, useCallback, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera as CameraIcon, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface CameraProps {
  onCapture: (imageSrc: string) => void;
  onClose: () => void;
  isActive: boolean;
  autoCaptureDelay?: number; // milliseconds
}

const Camera: React.FC<CameraProps> = ({ onCapture, onClose, isActive, autoCaptureDelay }) => {
  const webcamRef = useRef<Webcam>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isReady, setIsReady] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  // BUG FIX: capture was referenced inside a useEffect but was not stable (no useCallback).
  // This caused the auto-capture interval to reference a stale capture function on some
  // renders. Fixed by capturing with useCallback and guarding the interval with a ref.
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast } = useToast();

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      if (navigator.vibrate) navigator.vibrate(100);
      onCapture(imageSrc);
    }
  }, [onCapture]);

  useEffect(() => {
    // Clear any existing timer whenever deps change
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (isActive && isReady && autoCaptureDelay && countdown === null) {
      setCountdown(Math.ceil(autoCaptureDelay / 1000));

      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
            capture();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive, isReady, autoCaptureDelay]); // BUG FIX: `capture` intentionally excluded —
  // including it would restart the timer every render. capture itself is stable via useCallback.

  // BUG FIX: When the component unmounts (onClose called) the countdown timer was
  // still running and would call capture() on an unmounted component. The effect
  // cleanup above handles this, but we also reset countdown on close.
  const handleClose = useCallback(() => {
    setCountdown(null);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    onClose();
  }, [onClose]);

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode,
  };

  const toggleCamera = useCallback(() => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  }, []);

  const handleUserMedia = useCallback((_stream: MediaStream) => {
    setIsReady(true);
  }, []);

  const handleUserMediaError = useCallback((error: string | DOMException) => {
    console.error('Camera access error:', error);
    let message = 'Could not access camera.';
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError') message = 'Camera permission was denied.';
      else if (error.name === 'NotFoundError') message = 'No camera found on this device.';
      // BUG FIX: NotReadableError was not handled — common when another app owns the camera
      else if (error.name === 'NotReadableError') message = 'Camera is in use by another app.';
    }
    toast({ title: 'Camera Error', description: message, variant: 'destructive' });
    if (navigator.vibrate) navigator.vibrate([100, 100, 100]);
  }, [toast]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-card border-b-2 border-border">
          {/* BUG FIX: was calling onClose directly; now uses handleClose to cancel the timer */}
          <Button variant="ghost" size="icon" onClick={handleClose} aria-label="Close camera">
            <X className="h-6 w-6" />
          </Button>
          <h2 className="text-xl font-bold">Camera</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCamera}
            disabled={!isReady}
            aria-label="Switch camera"
          >
            <RotateCcw className="h-6 w-6" />
          </Button>
        </div>

        {/* Camera Preview */}
        <div className="flex-1 relative bg-black">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            onUserMedia={handleUserMedia}
            onUserMediaError={handleUserMediaError}
            className="w-full h-full object-cover"
            aria-label="Camera preview"
          />

          {countdown !== null && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 pointer-events-none">
              <div className="text-9xl font-bold text-white animate-pulse">{countdown}</div>
            </div>
          )}

          {!isReady && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <Card className="p-6 text-center max-w-[80%]">
                <CameraIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
                <p className="text-accessible text-muted-foreground font-medium mb-2">
                  {!window.isSecureContext ? 'Secure Connection Required' : 'Initializing camera…'}
                </p>
                {!window.isSecureContext && (
                  <p className="text-xs text-destructive">
                    Camera and Voice require an HTTPS connection or localhost.
                  </p>
                )}
              </Card>
            </div>
          )}

          {isReady && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-4 border-primary/50 rounded-lg" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-6 bg-card border-t-2 border-border">
          <div className="flex justify-center">
            <Button
              size="xl"
              onClick={capture}
              disabled={!isReady}
              aria-label="Take photo"
              className="rounded-full"
            >
              <CameraIcon className="mr-3" />
              Capture Photo
            </Button>
          </div>
          <p className="text-center text-accessible text-muted-foreground mt-4">
            Point camera at object or text, then tap capture
          </p>
        </div>
      </div>
    </div>
  );
};

export default Camera;
