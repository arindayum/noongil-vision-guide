import React, { useState } from 'react';
import { Clock, Eye, FileText, AlertTriangle, Trash2, Volume2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useHistory, type HistoryEntry } from '@/hooks/useHistory';
import { speak } from '@/utils/speech';

import { useLanguage } from '@/contexts/LanguageContext';

interface HistoryScreenProps {
  onClose: () => void;
}

const HISTORY_STRINGS: Record<string, any> = {
  en: {
    title: 'History',
    clearAll: 'Clear all',
    noHistory: 'No analyses yet. Capture an image to get started.',
    more: 'More',
    less: 'Less',
    read: 'Read',
    delete: 'Delete',
    objectDetection: 'Object Detection',
    textRecognition: 'Text Recognition',
    warning: 'Warning',
    last: 'Last',
    analysis: 'analysis',
    analyses: 'analyses'
  },
  hi: {
    title: 'इतिहास',
    clearAll: 'सभी मिटाएं',
    noHistory: 'अभी तक कोई विश्लेषण नहीं है। शुरू करने के लिए एक फोटो लें।',
    more: 'अधिक',
    less: 'कम',
    read: 'पढ़ें',
    delete: 'मिटाएं',
    objectDetection: 'वस्तु पहचान',
    textRecognition: 'टेक्स्ट पहचान',
    warning: 'चेतावनी',
    last: 'पिछले',
    analysis: 'विश्लेषण',
    analyses: 'विश्लेषण'
  },
  mr: {
    title: 'इतिहास',
    clearAll: 'सर्व मिटवा',
    noHistory: 'अद्याप कोणतेही विश्लेषण नाही. सुरू करण्यासाठी एक फोटो घ्या.',
    more: 'अधिक',
    less: 'कमी',
    read: 'वाचा',
    delete: 'मिटवा',
    objectDetection: 'वस्तू ओळख',
    textRecognition: 'मजकूर ओळख',
    warning: 'धोका',
    last: 'मागील',
    analysis: 'विश्लेषण',
    analyses: 'विश्लेषणे'
  }
};

const formatTime = (ts: number): string => {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
};

const EntryCard: React.FC<{ entry: HistoryEntry; onDelete: (id: string) => void; strings: any }> = ({
  entry,
  onDelete,
  strings: s,
}) => {
  const [expanded, setExpanded] = useState(false);

  const speakEntry = () => {
    const parts: string[] = [];
    if (entry.warnings.length > 0) parts.push(`${s.warning}: ` + entry.warnings.join('. '));
    parts.push(entry.summary);
    if (entry.detectedText) parts.push('Text: ' + entry.detectedText);
    speak(parts.join('. '));
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Thumbnail + meta */}
        <div className="flex gap-3 p-4">
          <img
            src={entry.imageSrc}
            alt={s.capturedScene}
            className="w-20 h-20 object-cover rounded-lg border border-border shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {entry.mode === 'object'
                ? <Eye className="h-4 w-4 text-primary shrink-0" />
                : <FileText className="h-4 w-4 text-primary shrink-0" />
              }
              <span className="text-sm font-medium">
                {entry.mode === 'object' ? s.objectDetection : s.textRecognition}
              </span>
              <span className="text-xs text-muted-foreground ml-auto shrink-0">
                {entry.language.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{entry.summary}</p>
            {entry.warnings.length > 0 && (
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />
                <span className="text-xs text-destructive font-medium truncate">
                  {entry.warnings[0]}
                </span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              <Clock className="inline h-3 w-3 mr-1" />
              {formatTime(entry.timestamp)}
            </p>
          </div>
        </div>

        {/* Expanded detail */}
        {expanded && (
          <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
            {entry.mode === 'object' && entry.objects.length > 0 && (
              <div className="grid gap-1">
                {entry.objects.map((obj, i) => (
                  <div key={i} className="flex justify-between text-sm bg-muted rounded px-3 py-1">
                    <span className="capitalize">{obj.name}</span>
                    <span className="text-muted-foreground">
                      {[obj.position, obj.distance].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {entry.detectedText && (
              <div className="bg-muted rounded p-3 font-mono text-xs whitespace-pre-wrap">
                {entry.detectedText}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex border-t border-border divide-x divide-border">
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex-1 flex items-center justify-center gap-1 py-3 text-sm text-muted-foreground hover:bg-muted transition-colors"
            aria-label={expanded ? s.less : s.more}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {expanded ? s.less : s.more}
          </button>
          <button
            onClick={speakEntry}
            className="flex-1 flex items-center justify-center gap-1 py-3 text-sm text-muted-foreground hover:bg-muted transition-colors"
            aria-label={s.read}
          >
            <Volume2 className="h-4 w-4" /> {s.read}
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="flex-1 flex items-center justify-center gap-1 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            aria-label={s.delete}
          >
            <Trash2 className="h-4 w-4" /> {s.delete}
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

const HistoryScreen: React.FC<HistoryScreenProps> = ({ onClose }) => {
  const { entries, removeEntry, clearHistory } = useHistory();
  const { language } = useLanguage();
  const s = HISTORY_STRINGS[language.code] || HISTORY_STRINGS.en;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{s.title}</h1>
          <div className="flex gap-2">
            {entries.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearHistory}
                aria-label={s.clearAll}
              >
                <Trash2 className="h-4 w-4 mr-1" /> {s.clearAll}
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close history">
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {entries.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-accessible text-muted-foreground">
                {s.noHistory}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {s.last} {entries.length} {entries.length === 1 ? s.analysis : s.analyses}
            </p>
            {entries.map(entry => (
              <EntryCard key={entry.id} entry={entry} onDelete={removeEntry} strings={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryScreen;
