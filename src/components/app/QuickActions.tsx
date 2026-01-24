import { Lightbulb, Search, BookOpen, PenTool, GraduationCap, HeartPulse, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuickActionsProps {
  onAction: (message: string, action: 'chat' | 'research' | 'find-sources') => void;
  hasVerificationResults: boolean;
  disabled?: boolean;
}

export const QuickActions = ({ onAction, hasVerificationResults, disabled }: QuickActionsProps) => {
  const { language } = useLanguage();
  
  const actions = [
    {
      icon: GraduationCap,
      label: language === 'fr' ? 'Trouver des articles' : 'Find articles',
      message: '__AUTO_SEARCH_CONTEXT__',
      action: 'find-sources' as const,
      requiresResults: false,
      primary: true,
    },
    {
      icon: HeartPulse,
      label: language === 'fr' ? 'Vérifier plan de soins' : 'Care Plan Check',
      message: language === 'fr'
        ? 'Vérifie mon plan de soins infirmiers. Les interventions sont-elles fondées sur des preuves? Identifie les lacunes dans les justifications cliniques.'
        : 'Check my nursing care plan. Are the interventions evidence-based? Identify gaps in clinical rationales.',
      action: 'chat' as const,
      requiresResults: false,
    },
    {
      icon: Stethoscope,
      label: language === 'fr' ? 'Question clinique' : 'Clinical Question',
      message: language === 'fr'
        ? 'Aide-moi à formuler une question clinique PICO basée sur mon brouillon. Quel est le problème de santé, l\'intervention proposée et les résultats attendus?'
        : 'Help me formulate a PICO clinical question based on my draft. What is the health problem, proposed intervention, and expected outcomes?',
      action: 'chat' as const,
      requiresResults: false,
    },
    {
      icon: Lightbulb,
      label: language === 'fr' ? 'Expliquer mes résultats' : 'Explain my results',
      message: language === 'fr' 
        ? 'Peux-tu m\'expliquer mes résultats de vérification? Quelles sont mes affirmations les plus faibles et comment puis-je les améliorer?'
        : 'Can you explain my verification results? What are my weakest claims and how can I improve them?',
      action: 'chat' as const,
      requiresResults: true,
    },
    {
      icon: Search,
      label: language === 'fr' ? 'Chercher pour affirmations faibles' : 'Search for weak claims',
      message: '__AUTO_SEARCH_WEAK_CLAIMS__',
      action: 'find-sources' as const,
      requiresResults: true,
    },
    {
      icon: BookOpen,
      label: language === 'fr' ? 'Aide aux citations' : 'Citation help',
      message: language === 'fr'
        ? 'Comment puis-je citer correctement mes sources dans mon travail? Donne-moi des exemples en format APA.'
        : 'How should I properly cite my sources in my work? Give me examples in APA format.',
      action: 'chat' as const,
      requiresResults: false,
    },
    {
      icon: PenTool,
      label: language === 'fr' ? 'Améliorer mon écriture' : 'Improve my writing',
      message: language === 'fr'
        ? 'Analyse mon brouillon et suggère des améliorations pour le ton académique et la clarté de mes arguments.'
        : 'Analyze my draft and suggest improvements for academic tone and argument clarity.',
      action: 'chat' as const,
      requiresResults: false,
    },
  ];
  
  const availableActions = actions.filter(a => !a.requiresResults || hasVerificationResults);
  
  return (
    <div className="p-4 border-t border-border">
      <div className="text-xs text-muted-foreground mb-2">
        {language === 'fr' ? 'Actions rapides' : 'Quick actions'}
      </div>
      <div className="flex flex-wrap gap-2">
        {availableActions.map((action, index) => (
          <Button
            key={index}
            variant={action.primary ? 'default' : 'outline'}
            size="sm"
            className="gap-2 text-xs"
            onClick={() => onAction(action.message, action.action)}
            disabled={disabled}
          >
            <action.icon className="h-3 w-3" />
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
