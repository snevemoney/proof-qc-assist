import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle2, FileText, Shield } from 'lucide-react';

export const HeroSection = () => {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
      
      <div className="container">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
            <Shield className="mr-2 h-3.5 w-3.5" />
            {t('hero.badge')}
          </Badge>
          
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            {t('hero.title')}{' '}
            <span className="text-primary">{t('hero.titleHighlight')}</span>
          </h1>
          
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
            {t('hero.subtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Button size="lg" className="gap-2 px-8">
              {t('hero.cta')}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" className="gap-2">
              {t('hero.ctaSecondary')}
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground italic">
            {t('hero.disclaimer')}
          </p>
        </div>
        
        {/* Hero illustration */}
        <div className="mt-16 mx-auto max-w-5xl">
          <div className="relative rounded-xl border bg-card p-2 shadow-2xl">
            <div className="rounded-lg bg-muted/50 p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2 rounded-full bg-background px-4 py-2 shadow-sm">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">assignment_v2.docx</span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-background px-4 py-2 shadow-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">3 sources</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-lg bg-primary/10 border border-primary/20 p-4">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-foreground">"According to Smith et al. (2023), early intervention significantly improves outcomes..."</p>
                    <p className="text-xs text-muted-foreground mt-1">✓ Supported by [S1] — Page 12, Para 3</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg bg-accent border border-border p-4">
                  <div className="h-5 w-5 rounded-full bg-accent-foreground/20 mt-0.5 shrink-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-accent-foreground">!</span>
                  </div>
                  <div>
                    <p className="text-sm text-foreground">"This treatment has been proven to work in all cases..."</p>
                    <p className="text-xs text-muted-foreground mt-1">⚠ Overgeneralization — Source says "most cases" [S2]</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
