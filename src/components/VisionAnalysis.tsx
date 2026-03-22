import React, { useState, useEffect, useCallback } from 'react';
import { Eye, FileText, Volume2, VolumeX, RotateCcw, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { speak, stop } from '@/utils/speech';
import { useLanguage } from '@/contexts/LanguageContext';
import type { HistoryEntry } from '@/hooks/useHistory';

interface VisionAnalysisProps {
  imageSrc: string;
  mode: 'object' | 'text';
  onBack: () => void;
  onSaveToHistory?: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;
}

interface StructuredResult {
  summary: string;
  objects: { name: string; distance?: string; position?: string }[];
  warnings: string[];
  detectedText?: string;
  confidence: 'high' | 'medium' | 'low';
}

const CONFIDENCE_PREFIX: Record<string, string> = {
  high: "I can clearly see",
  medium: "I think I can see",
  low: "I'm not entirely sure, but",
};

const buildObjectPrompt = (langInstruction: string): string => `
You are an assistive vision AI helping a visually impaired person understand their surroundings.
Analyse the image and respond ONLY with a JSON object — no markdown, no preamble.

JSON schema:
{
  "summary": "1–2 sentence spoken description of the scene",
  "objects": [{ "name": "string", "distance": "estimated distance e.g. 1 metre", "position": "e.g. left, centre, right, ahead" }],
  "warnings": ["any safety hazards: obstacles, stairs, traffic, wet floors, open flames, etc."],
  "confidence": "high" | "medium" | "low"
}

Rules:
- warnings must be non-empty if ANY hazard is visible — this is safety-critical
- distance and position are mandatory for every object if estimable
- summary should be natural spoken language, not a list
- ${langInstruction}
`.trim();

const buildTextPrompt = (langInstruction: string): string => `
You are an assistive vision AI helping a visually impaired person read text.
Extract all visible text from the image and respond ONLY with a JSON object — no markdown, no preamble.

JSON schema:
{
  "summary": "brief spoken intro e.g. 'This appears to be a medicine label'",
  "detectedText": "full extracted text, preserving line breaks",
  "warnings": ["flag anything urgent: expiry dates, allergy warnings, danger labels, etc."],
  "objects": [],
  "confidence": "high" | "medium" | "low"
}

Rules:
- If no text is found, set detectedText to "No text detected in this image."
- warnings should flag anything a blind person urgently needs to know
- ${langInstruction}
`.trim();

const VisionAnalysis: React.FC<VisionAnalysisProps> = ({
  imageSrc,
  mode,
  onBack,
  onSaveToHistory,
}) => {
  const [result, setResult] = useState<StructuredResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { toast } = useToast();
  const { language } = useLanguage();

  const buildTTSText = useCallback((r: StructuredResult): string => {
    const parts: string[] = [];
    // Warnings first — safety critical
    if (r.warnings.length > 0) {
      parts.push('Warning: ' + r.warnings.join('. '));
    }
    const prefix = CONFIDENCE_PREFIX[r.confidence] ?? CONFIDENCE_PREFIX.medium;
    parts.push(`${prefix}: ${r.summary}`);
    if (mode === 'text' && r.detectedText && r.detectedText !== 'No text detected in this image.') {
      parts.push('The text reads: ' + r.detectedText);
    }
    return parts.join('. ');
  }, [mode]);

  const analyzeImage = useCallback(async () => {
    setIsLoading(true);
    setResult(null);
    stop();

    const base64Data = imageSrc.split(',')[1];
    const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!geminiApiKey) {
      toast({
        title: "API Key Missing",
        description: "Add VITE_GEMINI_API_KEY to your .env file.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const prompt = mode === 'object'
        ? buildObjectPrompt(language.geminiInstruction)
        : buildTextPrompt(language.geminiInstruction);

      const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiApiKey,
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: 'image/jpeg', data: base64Data } },
            ],
          }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Gemini API call failed');
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('No response from Gemini');

      const parsed: StructuredResult = JSON.parse(rawText.replace(/```json|```/g, '').trim());

      setResult(parsed);

      if (navigator.vibrate) navigator.vibrate([50, 50, 50]);

      // Save to history
      onSaveToHistory?.({
        mode,
        imageSrc,
        summary: parsed.summary,
        warnings: parsed.warnings,
        objects: parsed.objects,
        detectedText: parsed.detectedText,
        confidence: parsed.confidence,
        language: language.code,
      });

      // Auto-speak after short delay — warnings first
      setTimeout(() => {
        const ttsText = buildTTSText(parsed);
        setIsSpeaking(true);
        speak(ttsText, () => setIsSpeaking(false));
      }, 400);

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to analyse image.';
      toast({ title: "Analysis Failed", description: message, variant: "destructive" });
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    } finally {
      setIsLoading(false);
    }
  }, [imageSrc, mode, language, toast, onSaveToHistory, buildTTSText]);

  useEffect(() => {
    analyzeImage();
    return () => { stop(); };
  }, [analyzeImage]);

  const toggleSpeech = () => {
    if (isSpeaking) {
      stop();
      setIsSpeaking(false);
    } else if (result) {
      const ttsText = buildTTSText(result);
      setIsSpeaking(true);
      speak(ttsText, () => setIsSpeaking(false));
    }
  };

  const confidenceColor: Record<string, string> = {
    high: 'text-success',
    medium: 'text-accent',
    low: 'text-destructive',
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBack} aria-label="Go back">
            ← Back
          </Button>
          <h1 className="text-2xl font-bold">
            {mode === 'object' ? 'Object Detection' : 'Text Recognition'}
          </h1>
          <div className="w-20" />
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

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {mode === 'object' ? <Eye className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
              Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8" role="status" aria-label="Analysing image">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-accessible text-muted-foreground" aria-live="polite">
                  Analysing image…
                </p>
              </div>
            ) : result ? (
              <div className="space-y-4">

                {/* Warnings — shown first, prominent */}
                {result.warnings.length > 0 && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      <span className="font-bold text-destructive">Hazard Detected</span>
                    </div>
                    <ul className="space-y-1">
                      {result.warnings.map((w, i) => (
                        <li key={i} className="text-accessible text-destructive font-medium">• {w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Summary */}
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-accessible font-medium">{result.summary}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Info className="h-3 w-3 text-muted-foreground" />
                    <span className={`text-sm font-medium ${confidenceColor[result.confidence]}`}>
                      {result.confidence.charAt(0).toUpperCase() + result.confidence.slice(1)} confidence
                    </span>
                  </div>
                </div>

                {/* Objects list */}
                {mode === 'object' && result.objects.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Detected Objects</p>
                    <div className="grid gap-2">
                      {result.objects.map((obj, i) => (
                        <div key={i} className="flex items-center justify-between bg-secondary/50 rounded-lg px-4 py-2">
                          <span className="font-medium capitalize">{obj.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {[obj.position, obj.distance].filter(Boolean).join(' · ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Detected text */}
                {mode === 'text' && result.detectedText && (
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
                    {result.detectedText}
                  </div>
                )}

                {/* Controls */}
                <div className="flex gap-3">
                  <Button
                    size="lg"
                    variant={isSpeaking ? 'destructive' : 'accent'}
                    onClick={toggleSpeech}
                    className="flex-1"
                    aria-label={isSpeaking ? 'Stop reading aloud' : 'Read result aloud'}
                  >
                    {isSpeaking ? (
                      <><VolumeX className="mr-2 h-5 w-5" /> Stop Reading</>
                    ) : (
                      <><Volume2 className="mr-2 h-5 w-5" /> Read Aloud</>
                    )}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={analyzeImage}
                    disabled={isLoading}
                    aria-label="Re-analyse image"
                  >
                    <RotateCcw className="mr-2 h-5 w-5" />
                    Re-analyse
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-accessible text-muted-foreground">
                  No results. Try taking another photo.
                </p>
                <Button size="lg" variant="outline" onClick={analyzeImage} className="mt-4">
                  <RotateCcw className="mr-2" /> Try Again
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
