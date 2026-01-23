import { FileCheck } from 'lucide-react';
import { LanguageToggle } from '@/components/landing/LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';

export const AppHeader = () => {
  const { t } = useLanguage();

  return (
    <header className="border-b bg-card">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <FileCheck className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-foreground">ProofCheck QC</span>
        </div>
        
        <div className="flex items-center gap-3">
          <LanguageToggle />
        </div>
      </div>
    </header>
  );
};
