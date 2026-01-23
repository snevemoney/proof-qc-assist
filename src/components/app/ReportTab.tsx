import { FileText, Download, Copy, CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

type ClaimStatus = 'supported' | 'partial' | 'unsupported' | 'contradicted';

interface Claim {
  id: string;
  text: string;
  status: ClaimStatus;
  sourceRef?: string;
  evidence?: string;
  suggestion?: string;
}

interface ReportTabProps {
  hasVerified: boolean;
  claims: Claim[];
  sourcesCount: number;
  draftLength: number;
}

const statusConfig: Record<ClaimStatus, { icon: typeof CheckCircle2; colorClass: string; label: string }> = {
  supported: { icon: CheckCircle2, colorClass: 'text-success', label: 'Supported' },
  partial: { icon: AlertTriangle, colorClass: 'text-warning', label: 'Partial' },
  unsupported: { icon: HelpCircle, colorClass: 'text-caution', label: 'Not Found' },
  contradicted: { icon: XCircle, colorClass: 'text-destructive', label: 'Contradicted' },
};

export const ReportTab = ({ hasVerified, claims, sourcesCount, draftLength }: ReportTabProps) => {
  const { t } = useLanguage();

  if (!hasVerified) {
    return (
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
    );
  }

  const supported = claims.filter(c => c.status === 'supported').length;
  const partial = claims.filter(c => c.status === 'partial').length;
  const unsupported = claims.filter(c => c.status === 'unsupported').length;
  const contradicted = claims.filter(c => c.status === 'contradicted').length;

  return (
    <div className="space-y-6">
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

      {/* Claims List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('report.claimAnalysis')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {claims.map((claim) => {
            const config = statusConfig[claim.status];
            const Icon = config.icon;
            
            return (
              <div key={claim.id} className="border-b pb-4 last:border-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <Icon className={`h-5 w-5 mt-0.5 ${config.colorClass}`} />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm text-foreground">{claim.text}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {config.label}
                      </Badge>
                      {claim.sourceRef && (
                        <Badge variant="secondary" className="text-xs">
                          {claim.sourceRef}
                        </Badge>
                      )}
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
          })}
        </CardContent>
      </Card>
    </div>
  );
};
