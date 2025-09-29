import React, { useState, useEffect } from 'react';
import { Eye, FileText, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VisionAnalysisProps {
  imageSrc: string;
  mode: 'object' | 'text';
  onBack: () => void;
}

interface AnalysisResult {
  description: string;
  confidence?: number;
  detectedText?: string;
}

const VisionAnalysis: React.FC<VisionAnalysisProps> = ({ imageSrc, mode, onBack }) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    analyzeImage();
  }, [imageSrc, mode]);

  const analyzeImage = async () => {
    setIsLoading(true);
    setAnalysis(null);

    try {
      // Convert base64 to blob for better handling
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      const base64Data = imageSrc.split(',')[1];

      const { data, error } = await supabase.functions.invoke('vision-analysis', {
        body: {
          image: base64Data,
          mode: mode,
        },
      });

      if (error) {
        console.error('Vision analysis error:', error);
        throw new Error(error.message || 'Failed to analyze image');
      }

      if (data) {
        setAnalysis(data);
        // Provide haptic feedback for successful analysis
        if (navigator.vibrate) {
          navigator.vibrate([50, 50, 50]);
        }
        
        // Auto-speak the result
        setTimeout(() => {
          speakText(data.description || data.detectedText || 'Analysis complete');
        }, 500);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze image. Please try again.",
        variant: "destructive",
      });
      
      // Error haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      // Stop any current speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      utterance.onstart = () => {
        setIsSpeaking(true);
        // Provide haptic feedback when speech starts
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        toast({
          title: "Speech Error",
          description: "Unable to read text aloud",
          variant: "destructive",
        });
      };

      window.speechSynthesis.speak(utterance);
    } else {
      toast({
        title: "Speech Not Available",
        description: "Text-to-speech is not supported on this device",
        variant: "destructive",
      });
    }
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      stopSpeech();
    } else {
      const textToSpeak = analysis?.description || analysis?.detectedText;
      if (textToSpeak) {
        speakText(textToSpeak);
      }
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'object':
        return 'Object Detection';
      case 'text':
        return 'Text Recognition';
      default:
        return 'Analysis';
    }
  };

  const getIcon = () => {
    switch (mode) {
      case 'object':
        return <Eye className="h-6 w-6" />;
      case 'text':
        return <FileText className="h-6 w-6" />;
      default:
        return <Eye className="h-6 w-6" />;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={onBack}
            aria-label="Go back"
          >
            ← Back
          </Button>
          <h1 className="text-2xl font-bold">{getTitle()}</h1>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>

        {/* Captured Image */}
        <Card>
          <CardContent className="p-4">
            <img
              src={imageSrc}
              alt="Captured image for analysis"
              className="w-full h-64 object-cover rounded-lg border-2 border-border"
            />
          </CardContent>
        </Card>

        {/* Analysis Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {getIcon()}
              Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-accessible text-muted-foreground">
                  Analyzing image...
                </p>
              </div>
            ) : analysis ? (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-accessible font-medium">
                    {mode === 'object' ? analysis.description : analysis.detectedText}
                  </p>
                  {analysis.confidence && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Confidence: {Math.round(analysis.confidence * 100)}%
                    </p>
                  )}
                </div>

                {/* Speech Controls */}
                <div className="flex gap-3">
                  <Button
                    size="lg"
                    variant={isSpeaking ? "destructive" : "accent"}
                    onClick={toggleSpeech}
                    className="flex-1"
                  >
                    {isSpeaking ? (
                      <>
                        <VolumeX className="mr-2" />
                        Stop Reading
                      </>
                    ) : (
                      <>
                        <Volume2 className="mr-2" />
                        Read Aloud
                      </>
                    )}
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    onClick={analyzeImage}
                    disabled={isLoading}
                  >
                    <RotateCcw className="mr-2" />
                    Re-analyze
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-accessible text-muted-foreground">
                  No results found. Try taking another photo.
                </p>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={analyzeImage}
                  className="mt-4"
                >
                  <RotateCcw className="mr-2" />
                  Try Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VisionAnalysis;