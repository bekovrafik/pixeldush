import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, X, Hand, ArrowUp, Zap, Coins, Trophy, Heart } from 'lucide-react';

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'WELCOME TO PIXEL RUNNER!',
    description: 'Jump over obstacles and run as far as you can!',
    icon: <Hand className="w-12 h-12 text-primary animate-bounce" />,
  },
  {
    title: 'TAP TO JUMP',
    description: 'Tap anywhere on the screen or press SPACE to jump. Tap twice for a double jump!',
    icon: <ArrowUp className="w-12 h-12 text-primary" />,
  },
  {
    title: 'COLLECT COINS',
    description: 'Grab coins to buy character skins and unlock new worlds!',
    icon: <Coins className="w-12 h-12 text-accent" />,
  },
  {
    title: 'GRAB POWER-UPS',
    description: 'Shield protects you, Magnet pulls coins, and 2X doubles your score!',
    icon: <Zap className="w-12 h-12 text-secondary" />,
  },
  {
    title: 'WATCH OUT!',
    description: 'Avoid spikes, blocks, and flying obstacles. Some even move!',
    icon: <Heart className="w-12 h-12 text-destructive" />,
  },
  {
    title: 'CLIMB THE LEADERBOARD',
    description: 'Compete with friends and players worldwide for the highest score!',
    icon: <Trophy className="w-12 h-12 text-yellow-400" />,
  },
];

interface TutorialOverlayProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function TutorialOverlay({ onComplete, onSkip }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const step = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      setIsVisible(false);
      setTimeout(onComplete, 300);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    setTimeout(onSkip, 300);
  };

  return (
    <div 
      className={`fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="max-w-sm w-full">
        {/* Skip button */}
        <div className="flex justify-end mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            <X className="w-4 h-4 mr-1" />
            SKIP
          </Button>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {TUTORIAL_STEPS.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'bg-primary w-6'
                  : index < currentStep
                  ? 'bg-primary/50'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Content card */}
        <div className="bg-card border border-primary/30 rounded-xl p-6 text-center">
          <div className="mb-4 flex justify-center">
            {step.icon}
          </div>
          
          <h2 className="font-pixel text-lg text-primary neon-glow mb-3">
            {step.title}
          </h2>
          
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            {step.description}
          </p>

          {/* Navigation buttons */}
          <div className="flex gap-3">
            {!isFirstStep && (
              <Button
                variant="outline"
                onClick={handlePrev}
                className="flex-1 border-primary/50 text-xs"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                BACK
              </Button>
            )}
            <Button
              onClick={handleNext}
              className={`game-button text-xs ${isFirstStep ? 'w-full' : 'flex-1'}`}
            >
              {isLastStep ? 'START PLAYING' : 'NEXT'}
              {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </div>

        {/* Step counter */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          {currentStep + 1} / {TUTORIAL_STEPS.length}
        </p>
      </div>
    </div>
  );
}
