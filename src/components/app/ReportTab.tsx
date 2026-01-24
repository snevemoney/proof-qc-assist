import { useState } from 'react';
import { FileText, Download, Copy, CheckCircle2, AlertTriangle, XCircle, HelpCircle, MessageCircle, Clock, Trash2, Loader2, RotateCcw, History, Search, Stethoscope, BookOpen, ShieldAlert, Shield, ShieldCheck, X, Languages, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useChat } from '@/contexts/ChatContext';
import type { Claim, Intervention, VerificationSummary, InterventionSeverity } from '@/lib/verification';
import type { VerificationHistoryEntry } from '@/hooks/useVerificationHistory';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

type ClaimStatus = 'supported' | 'partial' | 'unsupported' | 'contradicted';

interface ReportTabProps {
  hasVerified: boolean;
  isLoading?: boolean;
  claims: Claim[];
  interventions: Intervention[];
  summary: VerificationSummary | null;
  sourcesCount: number;
  draftLength: number;
  history: VerificationHistoryEntry[];
  historyLoading: boolean;
  onRestoreHistory: (entry: VerificationHistoryEntry) => void;
  onDeleteHistory: (id: string) => void;
  showAuthPrompt?: boolean;
  onDismissAuthPrompt?: () => void;
  onOpenAuthModal?: () => void;
  verificationLanguage?: 'fr' | 'en' | null;
  onReverify?: () => void;
}

const statusConfig: Record<ClaimStatus, { icon: typeof CheckCircle2; colorClass: string; labelEn: string; labelFr: string }> = {
  supported: { icon: CheckCircle2, colorClass: 'text-success', labelEn: 'Supported', labelFr: 'Soutenu' },
  partial: { icon: AlertTriangle, colorClass: 'text-warning', labelEn: 'Partial', labelFr: 'Partiel' },
  unsupported: { icon: HelpCircle, colorClass: 'text-caution', labelEn: 'Not Found', labelFr: 'Non trouvé' },
  contradicted: { icon: XCircle, colorClass: 'text-destructive', labelEn: 'Contradicted', labelFr: 'Contredit' },
};

// Fallback for unknown statuses from AI
const getStatusConfig = (status: string) => {
  return statusConfig[status as ClaimStatus] || statusConfig['unsupported'];
};

const severityConfig: Record<InterventionSeverity, { icon: typeof ShieldAlert; colorClass: string; bgClass: string }> = {
  critical: { icon: ShieldAlert, colorClass: 'text-destructive', bgClass: 'bg-destructive/10 border-destructive/30' },
  standard: { icon: Shield, colorClass: 'text-primary', bgClass: 'bg-primary/10 border-primary/30' },
  optional: { icon: ShieldCheck, colorClass: 'text-muted-foreground', bgClass: 'bg-muted border-muted-foreground/30' },
};

const getSeverityConfig = (severity: string) => {
  return severityConfig[severity as InterventionSeverity] || severityConfig['standard'];
};

export const ReportTab = ({
  hasVerified,
  isLoading,
  claims,
  interventions,
  summary,
  sourcesCount,
  draftLength,
  history,
  historyLoading,
  onRestoreHistory,
  onDeleteHistory,
  showAuthPrompt,
  onDismissAuthPrompt,
  onOpenAuthModal,
  verificationLanguage,
  onReverify,
}: ReportTabProps) => {
  const { t, language } = useLanguage();
  const { askAboutClaim, findArticlesForClaim } = useChat();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  // Check for language mismatch
  const hasLanguageMismatch = hasVerified && verificationLanguage && verificationLanguage !== language;

  const handleDeleteClick = (id: string) => {
    setEntryToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (entryToDelete) {
      onDeleteHistory(entryToDelete);
      setEntryToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };
  const locale = language === 'fr' ? fr : enUS;

  const getStatusSummary = (entry: VerificationHistoryEntry) => {
    const total = entry.claims.length;
    const supported = entry.claims.filter(c => c.status === 'supported').length;
    return `${supported}/${total}`;
  };

  const renderHistorySection = () => (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-5 w-5" />
          {language === 'fr' ? 'Historique des vérifications' : 'Verification History'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {historyLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {language === 'fr' ? 'Aucun historique disponible' : 'No history available'}
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'fr' ? 'Date' : 'Date'}</TableHead>
                  <TableHead>{language === 'fr' ? 'Brouillon' : 'Draft'}</TableHead>
                  <TableHead>{language === 'fr' ? 'Statut' : 'Status'}</TableHead>
                  <TableHead className="text-right">{language === 'fr' ? 'Actions' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {format(entry.createdAt, 'PP', { locale })}
                        <span className="text-muted-foreground text-xs">
                          {format(entry.createdAt, 'p', { locale })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <p className="truncate text-sm">
                        {entry.draftText.slice(0, 50)}{entry.draftText.length > 50 ? '...' : ''}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1 text-success" />
                          {getStatusSummary(entry)}
                        </Badge>
                        {entry.strictMode && (
                          <Badge variant="secondary" className="text-xs">
                            {language === 'fr' ? 'Strict' : 'Strict'}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRestoreHistory(entry)}
                          className="h-8 px-2"
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          {language === 'fr' ? 'Restaurer' : 'Restore'}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(entry.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );

  // Loading state during tab transition
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">
          {language === 'fr' ? 'Préparation du rapport...' : 'Preparing report...'}
        </p>
      </div>
    );
  }

  if (!hasVerified) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            {t('report.empty.title')}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            {t('report.empty.description')}
          </p>
          
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
              {sourcesCount > 0 ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
              )}
              <span className={sourcesCount > 0 ? 'text-foreground' : 'text-muted-foreground'}>
                {t('report.checklist.sources')} ({sourcesCount})
              </span>
            </div>
            <div className="flex items-center gap-2">
              {draftLength > 0 ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
              )}
              <span className={draftLength > 0 ? 'text-foreground' : 'text-muted-foreground'}>
                {t('report.checklist.draft')}
              </span>
            </div>
          </div>
        </div>
        
        {/* Show history even when no current verification */}
        {renderHistorySection()}
      </div>
    );
  }

  const supported = summary?.supported ?? claims.filter(c => c.status === 'supported').length;
  const partial = summary?.partial ?? claims.filter(c => c.status === 'partial').length;
  const unsupported = summary?.unsupported ?? claims.filter(c => c.status === 'unsupported').length;
  const contradicted = summary?.contradicted ?? claims.filter(c => c.status === 'contradicted').length;

  return (
    <div className="space-y-6">
      {/* Auth Prompt for Anonymous Users */}
      {showAuthPrompt && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <History className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {language === 'fr' 
                      ? 'Enregistrez vos résultats' 
                      : 'Save your results'}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {language === 'fr'
                      ? 'Connectez-vous pour sauvegarder votre historique.'
                      : 'Sign in to save your verification history.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-start">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 px-2 text-muted-foreground"
                  onClick={onDismissAuthPrompt}
                >
                  {language === 'fr' ? 'Plus tard' : 'Later'}
                </Button>
                <Button 
                  size="sm"
                  onClick={onOpenAuthModal}
                  className="whitespace-nowrap"
                >
                  {language === 'fr' ? 'Se connecter' : 'Sign in'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Language Mismatch Warning */}
      {hasLanguageMismatch && (
        <Card className="border-warning/50 bg-warning/10">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Languages className="h-5 w-5 text-warning flex-shrink-0" />
                <p className="text-sm text-foreground">
                  {t('report.languageMismatch')}
                </p>
              </div>
              {onReverify && (
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={onReverify}
                  className="gap-2 whitespace-nowrap"
                >
                  <RefreshCw className="h-4 w-4" />
                  {t('report.reverifyInLanguage')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overall Feedback */}
      {summary?.overallFeedback && (
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <p className="text-sm text-foreground">{summary.overallFeedback}</p>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <div>
                <p className="text-2xl font-bold text-foreground">{supported}</p>
                <p className="text-xs text-muted-foreground">{t('report.supported')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <div>
                <p className="text-2xl font-bold text-foreground">{partial}</p>
                <p className="text-xs text-muted-foreground">{t('report.partial')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-caution" />
              <div>
                <p className="text-2xl font-bold text-foreground">{unsupported}</p>
                <p className="text-xs text-muted-foreground">{t('report.unsupported')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-2xl font-bold text-foreground">{contradicted}</p>
                <p className="text-xs text-muted-foreground">{t('report.contradicted')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Buttons */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          {t('report.exportPdf')}
        </Button>
        <Button variant="outline" size="sm" className="gap-2">
          <Copy className="h-4 w-4" />
          {t('report.copyMarkdown')}
        </Button>
      </div>

      {/* Interventions Section */}
      {interventions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-accent-foreground" />
              {t('intervention.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Group interventions by severity */}
            {(['critical', 'standard', 'optional'] as InterventionSeverity[]).map(severityLevel => {
              const sevConfig = getSeverityConfig(severityLevel);
              const SeverityIcon = sevConfig.icon;
              const interventionsInGroup = interventions.filter(i => (i.severity || 'standard') === severityLevel);
              
              if (interventionsInGroup.length === 0) return null;
              
              return (
                <div key={severityLevel} className="space-y-3">
                  <div className="flex items-center gap-2 pt-2 first:pt-0">
                    <SeverityIcon className={`h-4 w-4 ${sevConfig.colorClass}`} />
                    <span className={`text-sm font-medium ${sevConfig.colorClass}`}>
                      {t(`intervention.${severityLevel}`)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({t(`intervention.${severityLevel}Desc`)})
                    </span>
                  </div>
                  
                  {interventionsInGroup.map((intervention) => {
                    const hasIssues = !intervention.hasEvidence || !intervention.hasRationale;
                    const isCriticalMissingEvidence = severityLevel === 'critical' && !intervention.hasEvidence;
                    
                    return (
                      <div key={intervention.id} className={`border-l-2 pl-4 pb-3 ${isCriticalMissingEvidence ? 'border-destructive bg-destructive/5 rounded-r' : 'border-muted'}`}>
                        <div className="flex items-start gap-3">
                          <Stethoscope className={`h-5 w-5 mt-0.5 ${hasIssues ? (isCriticalMissingEvidence ? 'text-destructive' : 'text-warning') : 'text-success'}`} />
                          <div className="flex-1 space-y-2">
                            <p className="text-sm text-foreground">{intervention.text}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Severity badge */}
                              <Badge 
                                variant="outline"
                                className={`text-xs ${sevConfig.bgClass} ${sevConfig.colorClass}`}
                              >
                                <SeverityIcon className="h-3 w-3 mr-1" />
                                {t(`intervention.${severityLevel}`)}
                              </Badge>
                              
                              {/* Evidence badge */}
                              <Badge 
                                variant={intervention.hasEvidence ? 'default' : 'outline'}
                                className={`text-xs ${intervention.hasEvidence ? 'bg-success/10 text-success border-success/30' : (isCriticalMissingEvidence ? 'text-destructive border-destructive/30' : 'text-caution border-caution/30')}`}
                              >
                                <BookOpen className="h-3 w-3 mr-1" />
                                {intervention.hasEvidence 
                                  ? t('intervention.evidenceBased')
                                  : t('intervention.missingEvidence')
                                }
                              </Badge>
                              
                              {/* Rationale badge */}
                              <Badge 
                                variant={intervention.hasRationale ? 'default' : 'outline'}
                                className={`text-xs ${intervention.hasRationale ? 'bg-success/10 text-success border-success/30' : 'text-caution border-caution/30'}`}
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                {intervention.hasRationale 
                                  ? t('intervention.rationaleProvided')
                                  : t('intervention.missingRationale')
                                }
                              </Badge>
                              
                              {intervention.sourceRef && (
                                <Badge variant="secondary" className="text-xs">
                                  {intervention.sourceRef}
                                </Badge>
                              )}
                              
                              {!intervention.hasEvidence && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                                  onClick={() => {
                                    findArticlesForClaim({ id: intervention.id, text: intervention.text, status: 'unsupported' });
                                  }}
                                >
                                  <Search className="h-3 w-3" />
                                  {t('intervention.findEvidence')}
                                </Button>
                              )}
                            </div>
                            
                            {intervention.rationaleText && (
                              <p className="text-xs text-muted-foreground bg-muted p-2 rounded italic">
                                "{intervention.rationaleText}"
                              </p>
                            )}
                            
                            {intervention.suggestion && (
                              <p className={`text-xs ${isCriticalMissingEvidence ? 'text-destructive font-medium' : 'text-primary'}`}>
                                💡 {intervention.suggestion}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Claims List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('report.claimAnalysis')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {claims.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('report.noClaims')}
            </p>
          ) : (
            claims.map((claim) => {
              const config = getStatusConfig(claim.status);
              const Icon = config.icon;
              const label = language === 'fr' ? config.labelFr : config.labelEn;
              
              return (
                <div key={claim.id} className="border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 mt-0.5 ${config.colorClass}`} />
                    <div className="flex-1 space-y-2">
                      <p className="text-sm text-foreground">{claim.text}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {label}
                        </Badge>
                        {claim.sourceRef && (
                          <Badge variant="secondary" className="text-xs">
                            {claim.sourceRef}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                          onClick={() => askAboutClaim(claim)}
                        >
                          <MessageCircle className="h-3 w-3" />
                          {t('report.askAboutClaim')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                          onClick={() => findArticlesForClaim(claim)}
                        >
                          <Search className="h-3 w-3" />
                          {t('report.findArticles')}
                        </Button>
                      </div>
                      {claim.evidence && (
                        <p className="text-xs text-muted-foreground bg-muted p-2 rounded italic">
                          "{claim.evidence}"
                        </p>
                      )}
                      {claim.suggestion && (
                        <p className="text-xs text-primary">
                          💡 {claim.suggestion}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* History Section */}
      {renderHistorySection()}

      {/* Delete Confirmation Dialog */}
      {/* Always mounted to avoid Radix portal race conditions on tab switches */}
      <AlertDialog
        open={deleteConfirmOpen}
        onOpenChange={(open) => {
          setDeleteConfirmOpen(open);
          if (!open) setEntryToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'fr' ? 'Supprimer cette entrée?' : 'Delete this entry?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'fr'
                ? 'Cette action est irréversible.'
                : 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'fr' ? 'Annuler' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {language === 'fr' ? 'Supprimer' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
