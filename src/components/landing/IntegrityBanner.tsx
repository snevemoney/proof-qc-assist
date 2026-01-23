import { useLanguage } from '@/contexts/LanguageContext';
import { ShieldCheck } from 'lucide-react';

export const IntegrityBanner = () => {
  const { t } = useLanguage();

  return (
    <div className="bg-primary/5 border-y border-primary/10">
      <div className="container py-4">
        <div className="flex items-center justify-center gap-3 text-center">
          <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
          <div>
            <span className="font-semibold text-foreground">{t('integrity.title')}</span>
            <span className="mx-2 text-muted-foreground">—</span>
            <span className="text-muted-foreground">{t('integrity.description')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
