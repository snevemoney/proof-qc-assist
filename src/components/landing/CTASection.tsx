import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export const CTASection = () => {
  const { t } = useLanguage();

  return (
    <section className="py-20 md:py-28 bg-primary text-primary-foreground">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            {t('cta.title')}
          </h2>
          <p className="text-lg opacity-90 mb-8">
            {t('cta.subtitle')}
          </p>
          <Button size="lg" variant="secondary" className="gap-2 px-8">
            {t('cta.button')}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};
