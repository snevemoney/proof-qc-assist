import { Lightbulb, Search, BookOpen, PenTool, GraduationCap, HeartPulse, Stethoscope, ClipboardCheck, BarChart3, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuickActionsProps {
  onAction: (message: string, action: 'chat' | 'research' | 'find-sources') => void;
  hasVerificationResults: boolean;
  hasInstructions?: boolean;
  hasEvaluationGrid?: boolean;
  disabled?: boolean;
}

export const QuickActions = ({ 
  onAction, 
  hasVerificationResults, 
  hasInstructions = false,
  hasEvaluationGrid = false,
  disabled 
}: QuickActionsProps) => {
  const { language } = useLanguage();
  
  const actions = [
    {
      icon: GraduationCap,
      label: language === 'fr' ? 'Trouver des articles' : 'Find articles',
      message: '__AUTO_SEARCH_CONTEXT__',
      action: 'find-sources' as const,
      requiresResults: false,
      requiresInstructions: false,
      requiresEvaluationGrid: false,
      primary: true,
    },
    {
      icon: Database,
      label: language === 'fr' ? 'Chercher bases de données' : 'Search databases',
      message: language === 'fr'
        ? 'Aide-moi à trouver des sources dans les bases de données infirmières (PubMed, CINAHL, Cochrane, INESSS, OIIQ, Santékom). Cherche des articles pertinents pour mon sujet de travail.'
        : 'Help me find sources in nursing databases (PubMed, CINAHL, Cochrane, INESSS, OIIQ, Santékom). Search for articles relevant to my assignment topic.',
      action: 'research' as const,
      requiresResults: false,
      requiresInstructions: false,
      requiresEvaluationGrid: false,
    },
    {
      icon: ClipboardCheck,
      label: language === 'fr' ? 'Vérifier exigences' : 'Check requirements',
      message: language === 'fr'
        ? 'Analyse mon brouillon par rapport aux consignes du travail. Quelles exigences ne sont pas respectées et comment puis-je les corriger?'
        : 'Analyze my draft against the assignment instructions. Which requirements are not met and how can I fix them?',
      action: 'chat' as const,
      requiresResults: false,
      requiresInstructions: true,
      requiresEvaluationGrid: false,
    },
    {
      icon: BarChart3,
      label: language === 'fr' ? 'Améliorer mes scores' : 'Improve my scores',
      message: language === 'fr'
        ? 'D\'après la grille d\'évaluation et mes scores actuels, quelles sont les améliorations prioritaires pour maximiser ma note? Concentre-toi sur les critères à fort poids et les scores les plus faibles.'
        : 'Based on the evaluation grid and my current scores, what are the priority improvements to maximize my grade? Focus on high-weight criteria and lowest scores.',
      action: 'chat' as const,
      requiresResults: true,
      requiresInstructions: false,
      requiresEvaluationGrid: true,
    },
    {
      icon: HeartPulse,
      label: language === 'fr' ? 'Vérifier plan de soins' : 'Care Plan Check',
      message: language === 'fr'
        ? 'Vérifie mon plan de soins infirmiers. Les interventions sont-elles fondées sur des preuves? Identifie les lacunes dans les justifications cliniques.'
        : 'Check my nursing care plan. Are the interventions evidence-based? Identify gaps in clinical rationales.',
      action: 'chat' as const,
      requiresResults: false,
      requiresInstructions: false,
      requiresEvaluationGrid: false,
    },
    {
      icon: Stethoscope,
      label: language === 'fr' ? 'Question clinique' : 'Clinical Question',
      message: language === 'fr'
        ? 'Aide-moi à formuler une question clinique PICO basée sur mon brouillon. Quel est le problème de santé, l\'intervention proposée et les résultats attendus?'
        : 'Help me formulate a PICO clinical question based on my draft. What is the health problem, proposed intervention, and expected outcomes?',
      action: 'chat' as const,
      requiresResults: false,
      requiresInstructions: false,
      requiresEvaluationGrid: false,
    },
    {
      icon: Lightbulb,
      label: language === 'fr' ? 'Expliquer mes résultats' : 'Explain my results',
      message: language === 'fr' 
        ? 'Peux-tu m\'expliquer mes résultats de vérification? Quelles sont mes affirmations les plus faibles et comment puis-je les améliorer?'
        : 'Can you explain my verification results? What are my weakest claims and how can I improve them?',
      action: 'chat' as const,
      requiresResults: true,
      requiresInstructions: false,
      requiresEvaluationGrid: false,
    },
    {
      icon: Search,
      label: language === 'fr' ? 'Chercher pour affirmations faibles' : 'Search for weak claims',
      message: '__AUTO_SEARCH_WEAK_CLAIMS__',
      action: 'find-sources' as const,
      requiresResults: true,
      requiresInstructions: false,
      requiresEvaluationGrid: false,
    },
    {
      icon: BookOpen,
      label: language === 'fr' ? 'Aide aux citations' : 'Citation help',
      message: language === 'fr'
        ? 'Comment puis-je citer correctement mes sources dans mon travail? Donne-moi des exemples en format APA.'
        : 'How should I properly cite my sources in my work? Give me examples in APA format.',
      action: 'chat' as const,
      requiresResults: false,
      requiresInstructions: false,
      requiresEvaluationGrid: false,
    },
    {
      icon: PenTool,
      label: language === 'fr' ? 'Améliorer mon écriture' : 'Improve my writing',
      message: language === 'fr'
        ? 'Analyse mon brouillon et suggère des améliorations pour le ton académique et la clarté de mes arguments.'
        : 'Analyze my draft and suggest improvements for academic tone and argument clarity.',
      action: 'chat' as const,
      requiresResults: false,
      requiresInstructions: false,
      requiresEvaluationGrid: false,
    },
  ];
  
  const availableActions = actions.filter(a => {
    // Check results requirement
    if (a.requiresResults && !hasVerificationResults) return false;
    // Check instructions requirement
    if (a.requiresInstructions && !hasInstructions) return false;
    // Check evaluation grid requirement
    if (a.requiresEvaluationGrid && !hasEvaluationGrid) return false;
    return true;
  });
  
  return (
    <div className="p-2 sm:p-3 border-t border-border">
      <div className="text-[10px] sm:text-xs text-muted-foreground mb-1.5">
        {language === 'fr' ? 'Actions rapides' : 'Quick actions'}
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1.5 -mx-2 px-2 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible sm:pb-0">
        {availableActions.map((action, index) => (
          <Button
            key={index}
            variant={action.primary ? 'default' : 'ghost'}
            size="sm"
            className="h-7 gap-1 px-2 text-[11px] sm:text-xs whitespace-nowrap flex-shrink-0"
            onClick={() => onAction(action.message, action.action)}
            disabled={disabled}
          >
            <action.icon className="h-3 w-3" />
            <span className="hidden sm:inline">{action.label}</span>
            <span className="sm:hidden">{action.label.split(' ').slice(0, 2).join(' ')}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};
