import React, { useState, useEffect, useCallback } from 'react';
import { Eye, FileText, Volume2, VolumeX, RotateCcw, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { speak, stop } from '@/utils/speech';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSettings } from '@/contexts/SettingsContext';
import type { HistoryEntry } from '@/hooks/useHistory';

export type AnalysisMode = 'object' | 'text' | 'hazard';

interface VisionAnalysisProps {
  imageSrc: string;
  mode: AnalysisMode;
  onBack: () => void;
  onSaveToHistory?: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;
  onAnalysisComplete?: (result: StructuredResult) => void;
}

export interface StructuredResult {
  summary: string;
  objects: { name: string; distance?: string; position?: string }[];
  warnings: string[];
  detectedText?: string;
  confidence: 'high' | 'medium' | 'low';
}

export const CONFIDENCE_PREFIX: Record<string, string> = {
  high: 'I can clearly see',
  medium: 'I think I can see',
  low: "I'm not entirely sure, but",
};

const buildObjectPrompt = (lang: string) => `
You are an assistive vision AI helping a visually impaired person understand their surroundings.
Respond ONLY with a JSON object — no markdown, no preamble.
{
  "summary": "1–2 sentence spoken scene description",
  "objects": [{ "name": "string", "distance": "e.g. 1 metre", "position": "e.g. left, ahead, right" }],
  "warnings": ["safety hazards with position and distance"],
  "confidence": "high" | "medium" | "low"
}
Rules: warnings non-empty if ANY hazard visible. distance+position mandatory if estimable. ${lang}`.trim();

const buildTextPrompt = (lang: string) => `
You are an assistive vision AI helping a visually impaired person read text.
Respond ONLY with a JSON object — no markdown, no preamble.
{
  "summary": "brief spoken intro e.g. 'This is a medicine label'",
  "detectedText": "all visible text, preserving line breaks",
  "warnings": ["urgent items: expiry dates, allergy warnings, danger labels"],
  "objects": [],
  "confidence": "high" | "medium" | "low"
}
Rules: if no text found, detectedText = "No text detected in this image." ${lang}`.trim();

const buildHazardPrompt = (lang: string) => `
You are a safety AI for a visually impaired person. Your ONLY job is to identify safety hazards.
Respond ONLY with a JSON object — no markdown, no preamble.
{
  "summary": "1 sentence safety assessment e.g. 'The path looks clear' or 'There are hazards ahead'",
  "objects": [],
  "warnings": ["every hazard with position + distance: e.g. 'Stairs ahead, 2 metres', 'Wet floor to the left'"],
  "confidence": "high" | "medium" | "low"
}
Rules: if NO hazards visible, warnings = [] and summary = "The path looks clear". Be thorough and specific. ${lang}`.trim();

export const LOCALIZED_STRINGS: Record<string, any> = {
  en: {
    high: 'I can clearly see',
    medium: 'I think I can see',
    low: "I'm not entirely sure, but",
    warning: 'Warning',
    textReads: 'The text reads',
    // Visual labels
    back: 'Back',
    resultsTitle: 'Analysis Results',
    hazardFound: 'Hazards Found',
    pathClear: 'Path looks clear — no hazards detected',
    confidence: 'confidence',
    detectedObjects: 'Detected Objects',
    stopReading: 'Stop Reading',
    readAloud: 'Read Aloud',
    reAnalyse: 'Re-analyse',
    noResults: 'No results. Try taking another photo.',
    tryAgain: 'Try Again',
    scanningHazards: 'Scanning for hazards…',
    analysingImage: 'Analysing image…',
    objectTitle: 'Object Detection',
    textTitle: 'Text Recognition',
    hazardTitle: 'Hazard Detection',
    photoCaptured: 'Photo Captured',
    analyzingImage: 'Analysing image…'
  },
  hi: {
    high: 'मुझे साफ़ दिख रहा है',
    medium: 'मुझे लगता है कि',
    low: 'मैं पूरी तरह से पक्का नहीं हूँ, लेकिन',
    warning: 'चेतावनी',
    textReads: 'लिखा हुआ है',
    // Visual labels
    back: 'पीछे',
    resultsTitle: 'विश्लेषण परिणाम',
    hazardFound: 'खतरे मिले',
    pathClear: 'रास्ता साफ लग रहा है — कोई खतरा नहीं मिला',
    confidence: 'सटीकता',
    detectedObjects: 'पहचाने गए सामान',
    stopReading: 'पढ़ना बंद करें',
    readAloud: 'ज़ोर से पढ़ें',
    reAnalyse: 'फिर से विश्लेषण करें',
    noResults: 'कोई परिणाम नहीं। दूसरी फोटो लेने की कोशिश करें।',
    tryAgain: 'फिर कोशिश करें',
    scanningHazards: 'खतरों की तलाश की जा रही है…',
    analysingImage: 'छवि का विश्लेषण किया जा रहा है…',
    objectTitle: 'वस्तु पहचान',
    textTitle: 'टेक्स्ट पहचान',
    hazardTitle: 'खतरा पहचान',
  },
  mr: {
    high: 'मला स्पष्ट दिसत आहे',
    medium: 'मला असे वाटते की',
    low: 'मला पूर्णपणे खात्री नाही, पण',
    warning: 'धोका',
    textReads: 'लिहिलेले आहे',
    // Visual labels
    back: 'मागे',
    resultsTitle: 'विश्लेषण निकाल',
    hazardFound: 'धोके सापडले',
    pathClear: 'रस्ता मोकळा वाटतो — कोणताही धोका आढळला नाही',
    confidence: 'निश्चितता',
    detectedObjects: 'ओळखल्या गेलेल्या वस्तू',
    stopReading: 'वाचन थांबवा',
    readAloud: 'मोठ्याने वाचा',
    reAnalyse: 'पुन्हा विश्लेषण करा',
    noResults: 'निकाल नाही. दुसरा फोटो घेण्याचा प्रयत्न करा.',
    tryAgain: 'पुन्हा प्रयत्न करा',
    scanningHazards: 'धोक्यांची तपासणी केली जात आहे…',
    analysingImage: 'प्रतिमेचे विश्लेषण केले जात आहे…',
    objectTitle: 'वस्तू ओळख',
    textTitle: 'मजकूर ओळख',
    hazardTitle: 'धोका ओळख',
  }
};

const VisionAnalysis: React.FC<VisionAnalysisProps> = ({
  imageSrc, mode, onBack, onSaveToHistory, onAnalysisComplete,
}) => {
  const [result, setResult] = useState<StructuredResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { toast } = useToast();
  const { language } = useLanguage();
  const { settings } = useSettings();

  const buildTTSText = useCallback((r: StructuredResult): string => {
    const s = LOCALIZED_STRINGS[language.code] || LOCALIZED_STRINGS.en;
    const parts: string[] = [];

    if (r.warnings.length > 0) parts.push(`${s.warning}: ` + r.warnings.join('. '));

    const prefix = s[r.confidence] || s.medium;
    parts.push(`${prefix}: ${r.summary}`);

    if (mode === 'text' && r.detectedText && r.detectedText !== 'No text detected in this image.') {
      parts.push(`${s.textReads}: ` + r.detectedText);
    }

    return parts.join('. ');
  }, [mode, language.code]);

  const speakResult = useCallback((r: StructuredResult) => {
    setIsSpeaking(true);
    // ✅ Pass voiceLang so Hindi/Marathi results are read in the correct accent
    speak(buildTTSText(r), language.voiceLang, () => setIsSpeaking(false), settings.speechRate);
  }, [buildTTSText, settings.speechRate]);

  const analyzeImage = useCallback(async () => {
    setIsLoading(true);
    setResult(null);
    stop();

    const base64Data = imageSrc.split(',')[1];
    const openRouterApiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

    if (!openRouterApiKey) {
      toast({ title: 'API Key Missing', description: 'Add VITE_OPENROUTER_API_KEY to your .env file.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    try {
      const prompt =
        mode === 'object' ? buildObjectPrompt(language.geminiInstruction) :
          mode === 'text' ? buildTextPrompt(language.geminiInstruction) :
            buildHazardPrompt(language.geminiInstruction);

      const response = await fetch(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openRouterApiKey}`,
            'HTTP-Referer': 'https://doordrushti.app',
            'X-Title': 'DoorDrushti',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: prompt,
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:image/jpeg;base64,${base64Data}`,
                    },
                  },
                ],
              },
            ],
            response_format: { type: 'json_object' },
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'OpenRouter API call failed');
      }

      const data = await response.json();
      const rawText = data.choices?.[0]?.message?.content;
      if (!rawText) throw new Error('No response from OpenRouter');

      const parsed: StructuredResult = JSON.parse(rawText.replace(/```json|```/g, '').trim());
      setResult(parsed);

      if (navigator.vibrate) {
        navigator.vibrate(parsed.warnings.length > 0 ? [100, 50, 100, 50, 100] : [50, 50, 50]);
      }

      onSaveToHistory?.({ mode, imageSrc, ...parsed, language: language.code });
      onAnalysisComplete?.(parsed);

      if (settings.autoSpeak) setTimeout(() => speakResult(parsed), 400);

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to analyse image.';
      toast({ title: 'Analysis Failed', description: message, variant: 'destructive' });
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    } finally {
      setIsLoading(false);
    }
  }, [imageSrc, mode, language, settings.autoSpeak, toast, onSaveToHistory, onAnalysisComplete, speakResult]);

  useEffect(() => { analyzeImage(); return () => { stop(); }; }, [analyzeImage]);

  const modeConfig = (s: any) => ({
    object: { title: s.objectTitle, icon: <Eye className="h-6 w-6" /> },
    text: { title: s.textTitle, icon: <FileText className="h-6 w-6" /> },
    hazard: { title: s.hazardTitle, icon: <ShieldAlert className="h-6 w-6 text-accent" /> },
  });

  const confidenceColor = { high: 'text-success', medium: 'text-accent', low: 'text-destructive' };

  const loadingLabel = (s: any) => {
    if (mode === 'hazard') return s.scanningHazards;
    return s.analysingImage;
  };

  const s = LOCALIZED_STRINGS[language.code] || LOCALIZED_STRINGS.en;
  const config = modeConfig(s);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBack} aria-label={s.back}>← {s.back}</Button>
          <h1 className="text-2xl font-bold">{config[mode].title}</h1>
          <div className="w-20" />
        </div>

        <Card>
          <CardContent className="p-4">
            <img src={imageSrc} alt="Captured image for analysis" className="w-full h-64 object-cover rounded-lg border-2 border-border" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">{config[mode].icon} {s.resultsTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8" role="status" aria-label={loadingLabel(s)}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-accessible text-muted-foreground" aria-live="polite">{loadingLabel(s)}</p>
              </div>
            ) : result ? (
              <div className="space-y-4">

                {result.warnings.length > 0 && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      <span className="font-bold text-destructive">{s.hazardFound}</span>
                    </div>
                    <ul className="space-y-1">
                      {result.warnings.map((w, i) => <li key={i} className="text-accessible text-destructive font-medium">• {w}</li>)}
                    </ul>
                  </div>
                )}

                {mode === 'hazard' && result.warnings.length === 0 && (
                  <div className="bg-success/10 border border-success/30 rounded-lg p-4 flex items-center gap-3">
                    <ShieldAlert className="h-6 w-6 text-success shrink-0" />
                    <p className="font-bold text-success">{s.pathClear}</p>
                  </div>
                )}

                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">
                    {s[result.confidence] || result.confidence}:
                  </p>
                  <p className="text-accessible font-medium">{result.summary}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Info className="h-3 w-3 text-muted-foreground" />
                    <span className={`text-sm font-medium ${confidenceColor[result.confidence]}`}>
                      {result.confidence.charAt(0).toUpperCase() + result.confidence.slice(1)} {s.confidence}
                    </span>
                  </div>
                </div>

                {mode === 'object' && result.objects.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{s.detectedObjects}</p>
                    <div className="grid gap-2">
                      {result.objects.map((obj, i) => (
                        <div key={i} className="flex items-center justify-between bg-secondary/50 rounded-lg px-4 py-2">
                          <span className="font-medium capitalize">{obj.name}</span>
                          <span className="text-sm text-muted-foreground">{[obj.position, obj.distance].filter(Boolean).join(' · ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {mode === 'text' && result.detectedText && (
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">{result.detectedText}</div>
                )}

                <div className="flex gap-3">
                  <Button size="lg" variant={isSpeaking ? 'destructive' : 'accent'} onClick={() => { if (isSpeaking) { stop(); setIsSpeaking(false); } else if (result) speakResult(result); }} className="flex-1" aria-label={isSpeaking ? s.stopReading : s.readAloud}>
                    {isSpeaking ? <><VolumeX className="mr-2 h-5 w-5" />{s.stopReading}</> : <><Volume2 className="mr-2 h-5 w-5" />{s.readAloud}</>}
                  </Button>
                  <Button size="lg" variant="outline" onClick={analyzeImage} disabled={isLoading} aria-label={s.reAnalyse}>
                    <RotateCcw className="mr-2 h-5 w-5" />{s.reAnalyse}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-accessible text-muted-foreground">{s.noResults}</p>
                <Button size="lg" variant="outline" onClick={analyzeImage} className="mt-4"><RotateCcw className="mr-2" />{s.tryAgain}</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VisionAnalysis;
