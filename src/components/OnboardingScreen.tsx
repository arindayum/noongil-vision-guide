import React, { useState } from 'react';
import { Eye, FileText, AlertTriangle, ChevronRight, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { speak } from '@/utils/speech';

interface OnboardingProps {
  onComplete: () => void;
}

const ONBOARDING_KEY = 'noongil_onboarded';

export const hasCompletedOnboarding = (): boolean => {
  return localStorage.getItem(ONBOARDING_KEY) === 'true';
};

const steps = [
  {
    icon: <Eye className="h-16 w-16 text-primary" />,
    title: 'Detect Objects',
    description:
      'Point your camera at any scene and NoonGil will describe what it sees — objects, people, and surroundings — including how far away they are.',
    voiceText:
      'Step one. Detect Objects. Point your camera at any scene and NoonGil will describe what it sees, including how far away things are.',
    tip: 'Voice command: say "Describe scene"',
  },
  {
    icon: <FileText className="h-16 w-16 text-primary" />,
    title: 'Read Text',
    description:
      'Capture signs, labels, medicine bottles, documents, or any written text. NoonGil will read it aloud for you.',
    voiceText:
      'Step two. Read Text. Capture any written text — signs, labels, or documents — and NoonGil will read it aloud.',
    tip: 'Voice command: say "Read text"',
  },
  {
    icon: <AlertTriangle className="h-16 w-16 text-destructive" />,
    title: 'Emergency Help',
    description:
      'In an emergency, activate a loud alarm, strong vibration, and a spoken alert. You can also call emergency services directly.',
    voiceText:
      'Step three. Emergency Help. Activate a loud alarm and call emergency services with one tap. Voice command: say "Emergency" or "Help".',
    tip: 'Voice command: say "Emergency" or "Help"',
  },
];

const OnboardingScreen: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const current = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(s => s + 1);
    } else {
      localStorage.setItem(ONBOARDING_KEY, 'true');
      onComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    onComplete();
  };

  const handleSpeak = () => {
    speak(current.voiceText);
  };

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Skip */}
      <div className="flex justify-end p-4">
        <button
          onClick={handleSkip}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
          aria-label="Skip onboarding"
        >
          Skip
        </button>
      </div>

      {/* Step content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center space-y-6">
        <div aria-hidden="true">{current.icon}</div>

        <h1 className="text-3xl font-bold">{current.title}</h1>

        <p className="text-lg text-muted-foreground leading-relaxed max-w-sm">
          {current.description}
        </p>

        <div className="bg-muted rounded-xl px-5 py-3 text-sm font-medium text-muted-foreground">
          💡 {current.tip}
        </div>

        {/* Read aloud button */}
        <Button
          variant="ghost"
          onClick={handleSpeak}
          aria-label="Read this step aloud"
          className="flex items-center gap-2 text-primary"
        >
          <Volume2 className="h-5 w-5" />
          Read aloud
        </Button>
      </div>

      {/* Step indicators + Next */}
      <div className="p-8 space-y-6">
        {/* Dots */}
        <div className="flex justify-center gap-3" role="tablist" aria-label="Onboarding steps">
          {steps.map((s, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === step}
              aria-label={`Step ${i + 1}: ${s.title}`}
              onClick={() => setStep(i)}
              className={`h-3 rounded-full transition-all duration-200 ${
                i === step
                  ? 'w-8 bg-primary'
                  : 'w-3 bg-border hover:bg-muted-foreground'
              }`}
            />
          ))}
        </div>

        <Button
          size="xl"
          onClick={handleNext}
          className="w-full"
          aria-label={step < steps.length - 1 ? `Next: ${steps[step + 1].title}` : 'Get started'}
        >
          {step < steps.length - 1 ? (
            <>Next <ChevronRight className="ml-2 h-5 w-5" /></>
          ) : (
            'Get Started'
          )}
        </Button>
      </div>
    </main>
  );
};

export default OnboardingScreen;
