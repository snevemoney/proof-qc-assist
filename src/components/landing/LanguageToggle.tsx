import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'fr' ? 'en' : 'fr');
  };

  const ariaLabel =
    language === 'fr'
      ? 'Langue actuelle : français. Passer à l’anglais'
      : 'Current language: English. Switch to French';

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="gap-2"
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <Globe className="h-4 w-4" />
      <span className="font-medium" aria-hidden="true">
        <span className={language === 'fr' ? 'text-foreground' : 'text-muted-foreground'}>FR</span>
        <span className="mx-1 text-muted-foreground">|</span>
        <span className={language === 'en' ? 'text-foreground' : 'text-muted-foreground'}>EN</span>
      </span>
    </Button>
  );
};
