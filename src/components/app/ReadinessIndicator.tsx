import { useLanguage } from '@/contexts/LanguageContext';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertCircle, Clock, FileText, Stethoscope } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Claim, Intervention, VerificationSummary } from '@/lib/verification';

interface ReadinessIndicatorProps {
  claims: Claim[];
  interventions: Intervention[];
  summary: VerificationSummary | null;
  hasVerified: boolean;
  onNavigateToReport?: () => void;
}

export const ReadinessIndicator = ({ 
  claims, 
  interventions,
  summary,
  hasVerified, 
  onNavigateToReport 
}: ReadinessIndicatorProps) => {
  const { t, language } = useLanguage();

  if (!hasVerified || (claims.length === 0 && interventions.length === 0)) {
    return null;
  }

  // Calculate fact-check readiness score
  const supported = claims.filter(c => c.status === 'supported').length;
  const partial = claims.filter(c => c.status === 'partial').length;
  const unsupported = claims.filter(c => c.status === 'unsupported').length;
  const contradicted = claims.filter(c => c.status === 'contradicted').length;
  
  const factCheckScore = claims.length > 0 
    ? Math.round(((supported * 1.0 + partial * 0.5) / claims.length) * 100)
    : 0;
  const claimIssuesCount = unsupported + contradicted;

  // Calculate intervention readiness score
  const totalInterventions = summary?.totalInterventions ?? interventions.length;
  const withEvidence = summary?.interventionsWithEvidence ?? interventions.filter(i => i.hasEvidence).length;
  const withRationale = summary?.interventionsWithRationale ?? interventions.filter(i => i.hasRationale).length;
  
  const evidenceScore = totalInterventions > 0 ? (withEvidence / totalInterventions) * 100 : 0;
  const rationaleScore = totalInterventions > 0 ? (withRationale / totalInterventions) * 100 : 0;
  const interventionScore = Math.round((evidenceScore + rationaleScore) / 2);
  
  const interventionIssuesCount = totalInterventions > 0 
    ? (totalInterventions - withEvidence) + (totalInterventions - withRationale)
    : 0;

  // Overall readiness (weighted average)
  const hasInterventions = totalInterventions > 0;
  const overallScore = hasInterventions 
    ? Math.round((factCheckScore * 0.5) + (interventionScore * 0.5))
    : factCheckScore;

  // Determine overall status
  const getOverallConfig = () => {
    if (overallScore >= 90) {
      return {
        colorClass: 'bg-success',
        textColorClass: 'text-success',
        icon: CheckCircle2,
        messageKey: 'readiness.ready',
      };
    } else if (overallScore >= 70) {
      return {
        colorClass: 'bg-success',
        textColorClass: 'text-success',
        icon: CheckCircle2,
        messageKey: 'readiness.almostReady',
      };
    } else if (overallScore >= 50) {
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

  const getScoreColorClass = (score: number) => {
    if (score >= 80) return 'bg-success';
    if (score >= 50) return 'bg-warning';
    return 'bg-destructive';
  };

  const overallConfig = getOverallConfig();
  const OverallIcon = overallConfig.icon;

  return (
    <div className="mb-4 p-3 sm:p-4 rounded-lg border bg-card space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <OverallIcon className={cn("h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0", overallConfig.textColorClass)} />
          <span className="font-medium text-xs sm:text-sm truncate">
            {t('readiness.title')}
          </span>
        </div>
        <span className={cn("font-bold text-base sm:text-lg whitespace-nowrap", overallConfig.textColorClass)}>
          {overallScore}% {language === 'fr' ? 'Prêt' : 'Ready'}
        </span>
      </div>

      {/* Fact-Check Progress */}
      {claims.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">
                {language === 'fr' ? 'Affirmations vérifiées' : 'Fact-Checked'}
              </span>
            </div>
            <span className="font-medium">{factCheckScore}%</span>
          </div>
          <div className="relative h-2">
            <Progress value={0} className="h-2 bg-muted" />
            <div 
              className={cn(
                "absolute top-0 left-0 h-2 rounded-full transition-all duration-500",
                getScoreColorClass(factCheckScore)
              )}
              style={{ width: `${factCheckScore}%` }}
            />
          </div>
          {claimIssuesCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {language === 'fr' 
                ? `${claimIssuesCount} affirmation${claimIssuesCount > 1 ? 's' : ''} ${claimIssuesCount > 1 ? 'ont' : 'a'} besoin de preuves`
                : `${claimIssuesCount} claim${claimIssuesCount > 1 ? 's' : ''} need${claimIssuesCount === 1 ? 's' : ''} supporting evidence`
              }
            </p>
          )}
        </div>
      )}

      {/* Intervention Progress */}
      {totalInterventions > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-accent-foreground" />
              <span className="text-muted-foreground">
                {language === 'fr' ? 'Interventions prêtes' : 'Intervention Ready'}
              </span>
            </div>
            <span className="font-medium">{interventionScore}%</span>
          </div>
          <div className="relative h-2">
            <Progress value={0} className="h-2 bg-muted" />
            <div 
              className={cn(
                "absolute top-0 left-0 h-2 rounded-full transition-all duration-500",
                getScoreColorClass(interventionScore)
              )}
              style={{ width: `${interventionScore}%` }}
            />
          </div>
          {interventionIssuesCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {language === 'fr' 
                ? `${totalInterventions - withEvidence} intervention${(totalInterventions - withEvidence) > 1 ? 's' : ''} sans preuves, ${totalInterventions - withRationale} sans justification`
                : `${totalInterventions - withEvidence} missing evidence, ${totalInterventions - withRationale} missing rationale`
              }
            </p>
          )}
        </div>
      )}

      {/* Status Message & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 sm:pt-1 border-t">
        <p className="text-xs sm:text-sm text-muted-foreground">
          {t(overallConfig.messageKey)}
        </p>
        
        {(claimIssuesCount > 0 || interventionIssuesCount > 0) && onNavigateToReport && (
          <button
            onClick={onNavigateToReport}
            className={cn(
              "text-xs sm:text-sm font-medium hover:underline whitespace-nowrap",
              overallConfig.textColorClass
            )}
          >
            {language === 'fr' ? 'Voir les détails →' : 'View details →'}
          </button>
        )}
      </div>
    </div>
  );
};
