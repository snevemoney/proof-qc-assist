import { useState, useEffect } from 'react';
import { FileText, Edit3, BarChart3, Search, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';

const ONBOARDING_KEY = 'proofcheck-onboarding-seen';

interface OnboardingStep {
  icon: React.ElementType;
  titleEn: string;
  titleFr: string;
  descriptionEn: string;
  descriptionFr: string;
}

const steps: OnboardingStep[] = [
  {
    icon: FileText,
    titleEn: 'Upload Your Sources',
    titleFr: 'Téléchargez vos sources',
    descriptionEn: 'Start by uploading the PDFs, articles, and documents you used for your research. These become your evidence base.',
    descriptionFr: 'Commencez par télécharger les PDF, articles et documents utilisés pour votre recherche. Ils deviennent votre base de preuves.',
  },
  {
    icon: Edit3,
    titleEn: 'Add Your Draft',
    titleFr: 'Ajoutez votre brouillon',
    descriptionEn: 'Paste or upload your assignment text. The AI will identify all claims that need evidence.',
    descriptionFr: 'Collez ou téléchargez le texte de votre travail. L\'IA identifiera toutes les affirmations nécessitant des preuves.',
  },
  {
    icon: BarChart3,
    titleEn: 'Verify Your Claims',
    titleFr: 'Vérifiez vos affirmations',
    descriptionEn: 'Click "Verify Now" to analyze your claims against your sources. Get instant feedback on what\'s supported and what needs more evidence.',
    descriptionFr: 'Cliquez sur "Vérifier maintenant" pour analyser vos affirmations. Obtenez un retour instantané sur ce qui est soutenu et ce qui nécessite plus de preuves.',
  },
  {
    icon: Search,
    titleEn: 'Find More Evidence',
    titleFr: 'Trouvez plus de preuves',
    descriptionEn: 'Use PICO search or ask the AI assistant to find academic articles for weak claims. Perfect for nursing and health science students!',
    descriptionFr: 'Utilisez la recherche PICO ou demandez à l\'assistant IA de trouver des articles pour les affirmations faibles. Parfait pour les étudiants en sciences infirmières!',
  },
];

export const OnboardingModal = () => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem(ONBOARDING_KEY);
    if (!hasSeenOnboarding) {
      // Small delay to let the page load first
      const timer = setTimeout(() => setIsOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      localStorage.setItem(ONBOARDING_KEY, 'true');
    }
    setIsOpen(open);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleOpenChange(false);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {language === 'fr' ? 'Bienvenue sur ProofCheck' : 'Welcome to ProofCheck'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {language === 'fr' 
              ? 'Guide de démarrage pour ProofCheck' 
              : 'Getting started guide for ProofCheck'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {/* Step indicator */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 w-8 rounded-full transition-colors ${
                  idx === currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Step content */}
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">
              {language === 'fr' ? step.titleFr : step.titleEn}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {language === 'fr' ? step.descriptionFr : step.descriptionEn}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            {language === 'fr' ? 'Précédent' : 'Previous'}
          </Button>

          <span className="text-xs text-muted-foreground">
            {currentStep + 1} / {steps.length}
          </span>

          <Button onClick={handleNext} className="gap-1">
            {currentStep === steps.length - 1 ? (
              language === 'fr' ? 'Commencer' : 'Get Started'
            ) : (
              <>
                {language === 'fr' ? 'Suivant' : 'Next'}
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
