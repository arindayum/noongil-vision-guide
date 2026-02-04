import React, { useState, useEffect } from 'react';
import { Eye, FileText, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { speak, stop } from '@/utils/speech';

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

    const base64Data = imageSrc.split(',')[1];
    const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!geminiApiKey) {
      handleAnalysisError(new Error('Gemini API key is missing. Please add VITE_GEMINI_API_KEY to your .env file.'));
      setIsLoading(false);
      return;
    }

    try {
      const prompt = mode === 'object'
        ? 'You are an assistive vision AI. Provide a crisp, concise description of the scene in 1-2 sentences. Focus on key objects, people, and actions.'
        : 'Extract and return all text visible in this image. Include text from signs, labels, documents, books, screens, or any written content. If no text is found, say "No text detected in this image."';

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: 'image/jpeg', data: base64Data } }
            ]
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Gemini API call failed');
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) throw new Error('No analysis result received from Gemini');

      handleAnalysisSuccess({
        description: mode === 'object' ? text : undefined,
        detectedText: mode === 'text' ? text : undefined,
        confidence: 0.9
      });
    } catch (error) {
      handleAnalysisError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalysisSuccess = (data: AnalysisResult) => {
    setAnalysis(data);
    if (navigator.vibrate) {
      navigator.vibrate([50, 50, 50]);
    }

    setTimeout(() => {
      speakText(data.description || data.detectedText || 'Analysis complete');
    }, 500);
  };

  const handleAnalysisError = (error: any) => {
    console.error('Analysis error:', error);
    toast({
      title: "Analysis Failed",
      description: error instanceof Error ? error.message : "Failed to analyze image. Please try again.",
      variant: "destructive",
    });

    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  };

  const speakText = (text: string) => {
    speak(text);
    // Note: isSpeaking state management might be less accurate with native TTS
    // but better than nothing for visual feedback.
    setIsSpeaking(true);
    setTimeout(() => setIsSpeaking(false), 5000); // Rough estimate fallback
  };

  const stopSpeech = () => {
    stop();
    setIsSpeaking(false);
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