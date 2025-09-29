import React, { useRef, useCallback, useState } from 'react';
import Webcam from 'react-webcam';
import { Camera as CameraIcon, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface CameraProps {
  onCapture: (imageSrc: string) => void;
  onClose: () => void;
  isActive: boolean;
}

const Camera: React.FC<CameraProps> = ({ onCapture, onClose, isActive }) => {
  const webcamRef = useRef<Webcam>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isReady, setIsReady] = useState(false);

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: facingMode
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      // Trigger haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
      onCapture(imageSrc);
    }
  }, [onCapture]);

  const toggleCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  const handleUserMedia = useCallback(() => {
    setIsReady(true);
  }, []);

  const handleUserMediaError = useCallback((error: string | DOMException) => {
    console.error('Camera error:', error);
    // Provide haptic feedback for error
    if (navigator.vibrate) {
      navigator.vibrate([100, 100, 100]);
    }
  }, []);

  if (!isActive) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-card border-b-2 border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close camera"
          >
            <X className="h-6 w-6" />
          </Button>
          <h2 className="text-xl font-bold">Camera</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCamera}
            aria-label="Switch camera"
            disabled={!isReady}
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

          {/* Camera not ready overlay */}
          {!isReady && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <Card className="p-6 text-center">
                <CameraIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-accessible text-muted-foreground">
                  Initializing camera...
                </p>
              </Card>
            </div>
          )}

          {/* Capture guidelines */}
          {isReady && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-4 border-primary/50 rounded-lg"></div>
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