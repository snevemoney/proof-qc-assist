import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Search, X, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PICOSearchFormProps {
  onSearch: (query: string, action: 'find-sources') => void;
  onClose: () => void;
  disabled?: boolean;
}

interface PICOField {
  key: 'population' | 'intervention' | 'comparison' | 'outcome';
  label: string;
  labelFr: string;
  placeholder: string;
  placeholderFr: string;
  tooltip: string;
  tooltipFr: string;
}

const PICO_FIELDS: PICOField[] = [
  {
    key: 'population',
    label: 'Population',
    labelFr: 'Population',
    placeholder: 'e.g., adults 18-65 with diabetes',
    placeholderFr: 'ex: adultes 18-65 ans diabétiques',
    tooltip: 'Who is your target group? (age, condition, demographics)',
    tooltipFr: 'Qui est votre groupe cible? (âge, condition, démographie)',
  },
  {
    key: 'intervention',
    label: 'Intervention',
    labelFr: 'Intervention',
    placeholder: 'e.g., cognitive behavioral therapy',
    placeholderFr: 'ex: thérapie cognitivo-comportementale',
    tooltip: 'What treatment or action is being studied?',
    tooltipFr: 'Quel traitement ou action est étudié?',
  },
  {
    key: 'comparison',
    label: 'Comparison',
    labelFr: 'Comparaison',
    placeholder: 'e.g., standard care, placebo',
    placeholderFr: 'ex: soins standards, placebo',
    tooltip: 'What is the alternative? (optional)',
    tooltipFr: 'Quelle est l\'alternative? (optionnel)',
  },
  {
    key: 'outcome',
    label: 'Outcome',
    labelFr: 'Résultat',
    placeholder: 'e.g., reduced anxiety, improved sleep',
    placeholderFr: 'ex: réduction de l\'anxiété, meilleur sommeil',
    tooltip: 'What result are you measuring?',
    tooltipFr: 'Quel résultat mesurez-vous?',
  },
];

export const PICOSearchForm = ({ onSearch, onClose, disabled }: PICOSearchFormProps) => {
  const { language } = useLanguage();
  const [values, setValues] = useState({
    population: '',
    intervention: '',
    comparison: '',
    outcome: '',
  });

  const handleChange = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build PICO query
    const parts: string[] = [];
    
    if (values.population.trim()) {
      parts.push(`Population: ${values.population.trim()}`);
    }
    if (values.intervention.trim()) {
      parts.push(`Intervention: ${values.intervention.trim()}`);
    }
    if (values.comparison.trim()) {
      parts.push(`Comparison: ${values.comparison.trim()}`);
    }
    if (values.outcome.trim()) {
      parts.push(`Outcome: ${values.outcome.trim()}`);
    }
    
    if (parts.length === 0) return;
    
    const query = `__PICO_SEARCH__${JSON.stringify(values)}`;
    onSearch(query, 'find-sources');
    onClose();
  };

  const hasInput = Object.values(values).some(v => v.trim());

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              {language === 'fr' ? 'Recherche PICO' : 'PICO Search'}
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              {language === 'fr' 
                ? 'Cadre de recherche pour les sciences de la santé'
                : 'Research framework for health sciences'}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <TooltipProvider>
            {PICO_FIELDS.map((field) => (
              <div key={field.key} className="space-y-1">
                <div className="flex items-center gap-1">
                  <Label htmlFor={field.key} className="text-xs font-medium">
                    <span className="text-primary font-bold">{field.key[0].toUpperCase()}</span>
                    <span className="text-muted-foreground">
                      {' '}- {language === 'fr' ? field.labelFr : field.label}
                    </span>
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[200px]">
                      <p className="text-xs">
                        {language === 'fr' ? field.tooltipFr : field.tooltip}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id={field.key}
                  value={values[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={language === 'fr' ? field.placeholderFr : field.placeholder}
                  className="h-8 text-sm"
                  disabled={disabled}
                />
              </div>
            ))}
          </TooltipProvider>
          
          <Button 
            type="submit" 
            className="w-full gap-2 mt-4" 
            size="sm"
            disabled={disabled || !hasInput}
          >
            <Search className="h-4 w-4" />
            {language === 'fr' ? 'Rechercher des articles' : 'Search for articles'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
