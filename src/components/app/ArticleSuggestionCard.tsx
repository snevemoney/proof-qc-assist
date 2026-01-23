import { ExternalLink, Plus, BookOpen, CheckCircle, AlertCircle, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { getStudyTypeBadgeColor } from '@/lib/studyTypes';
import { useState } from 'react';
import { toast } from 'sonner';

export interface ArticleResult {
  id: string;
  title: string;
  authors: string;
  year: string;
  journal?: string;
  abstract?: string;
  keyFindings?: string[];
  studyType?: string;
  studyTypeFr?: string;
  verificationStatus: 'verified' | 'partial';
  verificationLinks: {
    doi?: string;
    pubmed?: string;
    publisher?: string;
    googleScholar?: string;
  };
  citationAPA?: string;
  url?: string;
  relevanceExplanation?: string;
}

interface ArticleSuggestionCardProps {
  article: ArticleResult;
  onAddToSources: (article: ArticleResult) => void;
  isAdded?: boolean;
}

export const ArticleSuggestionCard = ({ 
  article, 
  onAddToSources,
  isAdded = false,
}: ArticleSuggestionCardProps) => {
  const { language } = useLanguage();
  const [copied, setCopied] = useState(false);
  
  const handleCopyCitation = async () => {
    if (article.citationAPA) {
      await navigator.clipboard.writeText(article.citationAPA);
      setCopied(true);
      toast.success(language === 'fr' ? 'Citation copiée!' : 'Citation copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const studyTypeLabel = language === 'fr' ? article.studyTypeFr : article.studyType;
  const studyTypeBadgeColor = getStudyTypeBadgeColor(article.studyType);
  
  return (
    <Card className="border-primary/20 bg-card/50">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {/* Study type badge */}
          {studyTypeLabel && (
            <Badge variant="outline" className={studyTypeBadgeColor}>
              {studyTypeLabel}
            </Badge>
          )}
          
          {/* Verification badge */}
          {article.verificationStatus === 'verified' ? (
            <Badge variant="outline" className="border-green-500/50 text-green-700 dark:text-green-300">
              <CheckCircle className="h-3 w-3 mr-1" />
              {language === 'fr' ? 'Vérifié' : 'Verified'}
            </Badge>
          ) : (
            <Badge variant="outline" className="border-amber-500/50 text-amber-700 dark:text-amber-300">
              <AlertCircle className="h-3 w-3 mr-1" />
              {language === 'fr' ? 'Vérification partielle' : 'Partial verification'}
            </Badge>
          )}
        </div>
        
        {/* Title */}
        <a 
          href={article.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm font-medium leading-tight hover:text-primary transition-colors line-clamp-2"
        >
          {article.title}
        </a>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {/* Authors and year */}
        <p className="text-xs text-muted-foreground">
          {article.authors} ({article.year})
          {article.journal && <span className="italic"> • {article.journal}</span>}
        </p>
        
        {/* Key findings */}
        {article.keyFindings && article.keyFindings.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              {language === 'fr' ? 'Résultats clés:' : 'Key findings:'}
            </p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              {article.keyFindings.slice(0, 3).map((finding, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-primary mt-0.5">•</span>
                  <span className="line-clamp-2">{finding}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Relevance explanation */}
        {article.relevanceExplanation && (
          <p className="text-xs text-muted-foreground italic bg-muted/50 p-2 rounded">
            <BookOpen className="h-3 w-3 inline mr-1" />
            {article.relevanceExplanation}
          </p>
        )}
        
        {/* Verification links */}
        <div className="flex flex-wrap gap-2 text-xs">
          {article.verificationLinks.doi && (
            <a 
              href={`https://doi.org/${article.verificationLinks.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1"
            >
              DOI <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {article.verificationLinks.pubmed && (
            <a 
              href={article.verificationLinks.pubmed}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1"
            >
              PubMed <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {article.verificationLinks.googleScholar && (
            <a 
              href={article.verificationLinks.googleScholar}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1"
            >
              Scholar <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant={isAdded ? "secondary" : "default"}
            className="flex-1 gap-2"
            onClick={() => onAddToSources(article)}
            disabled={isAdded}
          >
            {isAdded ? (
              <>
                <Check className="h-3 w-3" />
                {language === 'fr' ? 'Ajouté' : 'Added'}
              </>
            ) : (
              <>
                <Plus className="h-3 w-3" />
                {language === 'fr' ? 'Ajouter aux sources' : 'Add to sources'}
              </>
            )}
          </Button>
          
          {article.citationAPA && (
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={handleCopyCitation}
            >
              {copied ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              {language === 'fr' ? 'Citer' : 'Cite'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
