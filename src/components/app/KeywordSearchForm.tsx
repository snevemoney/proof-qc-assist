import React, { useState, useCallback, useMemo } from 'react';
import { X, Plus, Search, Lightbulb, Copy, Check, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  findMatchingMeshTerms, 
  buildMeshQuery, 
  getSuggestions,
  CATEGORY_LABELS,
  type NursingCategory 
} from '@/lib/nursingTerms';

interface KeywordSearchFormProps {
  onSearch: (query: string, action: 'find-sources') => void;
  onClose: () => void;
  disabled?: boolean;
}

interface KeywordTag {
  id: string;
  text: string;
  mesh?: string;
  category?: NursingCategory;
}

const STUDY_TYPE_FILTERS = [
  { value: 'all', labelFr: 'Tous les types', labelEn: 'All types' },
  { value: 'systematic-review', labelFr: 'Revue systématique', labelEn: 'Systematic review' },
  { value: 'meta-analysis', labelFr: 'Méta-analyse', labelEn: 'Meta-analysis' },
  { value: 'rct', labelFr: 'ECR', labelEn: 'RCT' },
  { value: 'cohort', labelFr: 'Étude de cohorte', labelEn: 'Cohort study' },
  { value: 'qualitative', labelFr: 'Étude qualitative', labelEn: 'Qualitative study' },
  { value: 'guideline', labelFr: 'Ligne directrice', labelEn: 'Guideline' },
];

const RECENCY_FILTERS = [
  { value: 'all', labelFr: 'Toutes les années', labelEn: 'All years' },
  { value: 'year', labelFr: 'Dernière année', labelEn: 'Last year' },
  { value: '5years', labelFr: '5 dernières années', labelEn: 'Last 5 years' },
  { value: '10years', labelFr: '10 dernières années', labelEn: 'Last 10 years' },
];

export const KeywordSearchForm = ({ onSearch, onClose, disabled }: KeywordSearchFormProps) => {
  const { language } = useLanguage();
  const [keywords, setKeywords] = useState<KeywordTag[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [operator, setOperator] = useState<'AND' | 'OR'>('AND');
  const [studyType, setStudyType] = useState('all');
  const [recency, setRecency] = useState('all');
  const [copied, setCopied] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Get MeSH suggestions for current input
  const meshSuggestions = useMemo(() => {
    if (inputValue.length < 2) return [];
    return findMatchingMeshTerms(inputValue);
  }, [inputValue]);

  // Get autocomplete suggestions
  const autocompleteSuggestions = useMemo(() => {
    if (inputValue.length < 2) return [];
    return getSuggestions(inputValue, 5);
  }, [inputValue]);

  // Build the final query
  const builtQuery = useMemo(() => {
    if (keywords.length === 0) return { query: '', meshTerms: [], unmatchedKeywords: [] };
    return buildMeshQuery(keywords.map(k => k.text), operator);
  }, [keywords, operator]);

  const addKeyword = useCallback((text: string, mesh?: string, category?: NursingCategory) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (keywords.some(k => k.text.toLowerCase() === trimmed.toLowerCase())) return;
    
    setKeywords(prev => [...prev, {
      id: `kw-${Date.now()}-${Math.random()}`,
      text: trimmed,
      mesh,
      category,
    }]);
    setInputValue('');
    setShowSuggestions(false);
  }, [keywords]);

  const removeKeyword = useCallback((id: string) => {
    setKeywords(prev => prev.filter(k => k.id !== id));
  }, []);

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      // Check if there's a MeSH match
      const matches = findMatchingMeshTerms(inputValue);
      if (matches.length > 0) {
        addKeyword(inputValue, matches[0].mesh, matches[0].category);
      } else {
        addKeyword(inputValue);
      }
    }
  };

  const handleSubmit = () => {
    if (keywords.length === 0) return;
    
    // Build keyword search query with special marker
    const searchPayload = {
      keywords: keywords.map(k => k.text),
      meshTerms: builtQuery.meshTerms,
      operator,
      studyType: studyType !== 'all' ? studyType : undefined,
      recency: recency !== 'all' ? recency : undefined,
    };
    
    const query = `__KEYWORD_SEARCH__${JSON.stringify(searchPayload)}`;
    onSearch(query, 'find-sources');
    onClose();
  };

  const copyPubMedQuery = () => {
    if (builtQuery.query) {
      navigator.clipboard.writeText(builtQuery.query);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const canSubmit = keywords.length > 0 && !disabled;

  return (
    <Card className="border-primary/20 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            {language === 'fr' ? 'Recherche par mots-clés' : 'Keyword Search'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Keyword input */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-muted-foreground">
              {language === 'fr' ? 'Mots-clés' : 'Keywords'}
            </label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    {language === 'fr' 
                      ? 'Ajoutez vos termes de recherche. Les termes MeSH seront suggérés automatiquement pour des recherches plus précises.'
                      : 'Add your search terms. MeSH terms will be suggested automatically for more precise searches.'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="relative">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setShowSuggestions(true);
                }}
                onKeyDown={handleInputKeyDown}
                onFocus={() => setShowSuggestions(true)}
                placeholder={language === 'fr' ? 'Ex: plaie de pression, chute...' : 'Ex: pressure ulcer, fall...'}
                className="flex-1 text-sm"
                disabled={disabled}
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const matches = findMatchingMeshTerms(inputValue);
                  if (matches.length > 0) {
                    addKeyword(inputValue, matches[0].mesh, matches[0].category);
                  } else {
                    addKeyword(inputValue);
                  }
                }}
                disabled={!inputValue.trim() || disabled}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Autocomplete suggestions */}
            {showSuggestions && autocompleteSuggestions.length > 0 && inputValue.length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 max-h-[150px] overflow-auto">
                {autocompleteSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                    onClick={() => {
                      const matches = findMatchingMeshTerms(suggestion);
                      if (matches.length > 0) {
                        addKeyword(suggestion, matches[0].mesh, matches[0].category);
                      } else {
                        addKeyword(suggestion);
                      }
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Keywords tags */}
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {keywords.map((kw) => (
              <Badge
                key={kw.id}
                variant={kw.mesh ? 'default' : 'secondary'}
                className="flex items-center gap-1 text-xs"
              >
                {kw.mesh && <span className="text-[10px] opacity-70">MeSH</span>}
                {kw.text}
                <button
                  onClick={() => removeKeyword(kw.id)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* MeSH suggestions */}
        {meshSuggestions.length > 0 && inputValue.length >= 2 && (
          <div className="p-3 bg-accent/50 rounded-md space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Lightbulb className="h-3 w-3" />
              {language === 'fr' ? 'Termes MeSH suggérés' : 'Suggested MeSH terms'}
            </div>
            <div className="flex flex-wrap gap-2">
              {meshSuggestions.map((suggestion, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => addKeyword(suggestion.term, suggestion.mesh, suggestion.category)}
                >
                  <Plus className="h-3 w-3" />
                  {suggestion.term}
                  <span className="text-[10px] text-muted-foreground ml-1">
                    ({CATEGORY_LABELS[suggestion.category][language === 'fr' ? 'fr' : 'en']})
                  </span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Filters row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              {language === 'fr' ? 'Opérateur' : 'Operator'}
            </label>
            <Select value={operator} onValueChange={(v) => setOperator(v as 'AND' | 'OR')}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AND">AND</SelectItem>
                <SelectItem value="OR">OR</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              {language === 'fr' ? 'Type d\'étude' : 'Study type'}
            </label>
            <Select value={studyType} onValueChange={setStudyType}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STUDY_TYPE_FILTERS.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {language === 'fr' ? filter.labelFr : filter.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              {language === 'fr' ? 'Récence' : 'Recency'}
            </label>
            <Select value={recency} onValueChange={setRecency}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECENCY_FILTERS.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {language === 'fr' ? filter.labelFr : filter.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Built query preview */}
        {builtQuery.query && (
          <div className="p-3 bg-muted/50 rounded-md space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {language === 'fr' ? 'Requête construite' : 'Built query'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 gap-1 text-xs"
                onClick={copyPubMedQuery}
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {language === 'fr' ? 'Copier pour PubMed' : 'Copy for PubMed'}
              </Button>
            </div>
            <ScrollArea className="max-h-[60px]">
              <code className="text-xs text-foreground/80 break-all">
                {builtQuery.query}
              </code>
            </ScrollArea>
          </div>
        )}

        {/* Submit button */}
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full gap-2"
        >
          <Search className="h-4 w-4" />
          {language === 'fr' ? 'Rechercher' : 'Search'}
        </Button>
      </CardContent>
    </Card>
  );
};
