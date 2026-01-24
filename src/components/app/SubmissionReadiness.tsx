import { useLanguage } from '@/contexts/LanguageContext';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Claim } from '@/lib/verification';

interface SubmissionReadinessProps {
  claims: Claim[];
  hasVerified: boolean;
  onNavigateToReport?: () => void;
}

export const SubmissionReadiness = ({ 
  claims, 
  hasVerified, 
  onNavigateToReport 
}: SubmissionReadinessProps) => {
  const { t, language } = useLanguage();

  if (!hasVerified || claims.length === 0) {
    return null;
  }

  // Calculate readiness score
  const supported = claims.filter(c => c.status === 'supported').length;
  const partial = claims.filter(c => c.status === 'partial').length;
  const unsupported = claims.filter(c => c.status === 'unsupported').length;
  const contradicted = claims.filter(c => c.status === 'contradicted').length;
  
  const score = ((supported * 1.0 + partial * 0.5) / claims.length) * 100;
  const roundedScore = Math.round(score);
  const issuesCount = unsupported + contradicted;

  // Determine status level and colors
  const getStatusConfig = () => {
    if (roundedScore >= 100) {
      return {
        colorClass: 'bg-success',
        textColorClass: 'text-success',
        icon: CheckCircle2,
        messageKey: 'readiness.ready',
      };
    } else if (roundedScore >= 80) {
      return {
        colorClass: 'bg-success',
        textColorClass: 'text-success',
        icon: CheckCircle2,
        messageKey: 'readiness.almostReady',
      };
    } else if (roundedScore >= 50) {
      return {
        colorClass: 'bg-warning',
        textColorClass: 'text-warning',
        icon: Clock,
        messageKey: 'readiness.goodProgress',
      };
    } else {
      return {
        colorClass: 'bg-destructive',
        textColorClass: 'text-destructive',
        icon: AlertCircle,
        messageKey: 'readiness.needsWork',
      };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="mb-4 p-4 rounded-lg border bg-card">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-5 w-5", config.textColorClass)} />
          <span className="font-medium text-sm">
            {t('readiness.title')}
          </span>
        </div>
        <span className={cn("font-bold text-lg", config.textColorClass)}>
          {roundedScore}% {language === 'fr' ? 'Prêt' : 'Ready'}
        </span>
      </div>
      
      <div className="relative">
        <Progress 
          value={roundedScore} 
          className="h-3 bg-muted"
        />
        <div 
          className={cn(
            "absolute top-0 left-0 h-3 rounded-full transition-all duration-500",
            config.colorClass
          )}
          style={{ width: `${roundedScore}%` }}
        />
      </div>
      
      <div className="mt-2 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t(config.messageKey)}
        </p>
        
        {issuesCount > 0 && onNavigateToReport && (
          <button
            onClick={onNavigateToReport}
            className={cn(
              "text-sm font-medium hover:underline",
              config.textColorClass
            )}
          >
            {language === 'fr' 
              ? `${issuesCount} affirmation${issuesCount > 1 ? 's' : ''} à corriger →`
              : `${issuesCount} claim${issuesCount > 1 ? 's' : ''} need${issuesCount === 1 ? 's' : ''} attention →`
            }
          </button>
        )}
      </div>
    </div>
  );
};
