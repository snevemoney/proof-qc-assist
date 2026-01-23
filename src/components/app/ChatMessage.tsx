import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage as ChatMessageType } from '@/contexts/ChatContext';
import { ArticleSuggestionCard, type ArticleResult } from './ArticleSuggestionCard';
import { useLanguage } from '@/contexts/LanguageContext';

interface ChatMessageProps {
  message: ChatMessageType;
  onAddArticle?: (article: ArticleResult) => void;
  addedArticleIds?: Set<string>;
}

// Parse message content for embedded article JSON
function parseArticlesFromContent(content: string): { 
  textContent: string; 
  articles: ArticleResult[];
} {
  // Look for JSON blocks with articles
  const jsonPattern = /```json\s*(\{[\s\S]*?"articles"[\s\S]*?\})\s*```/gi;
  const articlePattern = /\[ARTICLES_START\]([\s\S]*?)\[ARTICLES_END\]/gi;
  
  let articles: ArticleResult[] = [];
  let textContent = content;
  
  // Try to extract JSON blocks
  const jsonMatches = content.matchAll(jsonPattern);
  for (const match of jsonMatches) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed.articles)) {
        articles = [...articles, ...parsed.articles];
        textContent = textContent.replace(match[0], '');
      }
    } catch {
      // Ignore parse errors
    }
  }
  
  // Try to extract marked article blocks
  const articleMatches = content.matchAll(articlePattern);
  for (const match of articleMatches) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed)) {
        articles = [...articles, ...parsed];
      } else if (parsed.articles) {
        articles = [...articles, ...parsed.articles];
      }
      textContent = textContent.replace(match[0], '');
    } catch {
      // Ignore parse errors
    }
  }
  
  return { textContent: textContent.trim(), articles };
}

export const ChatMessage = ({ message, onAddArticle, addedArticleIds }: ChatMessageProps) => {
  const { language } = useLanguage();
  const isUser = message.role === 'user';
  
  // Parse articles from assistant messages
  const { textContent, articles } = isUser 
    ? { textContent: message.content, articles: [] }
    : parseArticlesFromContent(message.content);
  
  return (
    <div className={cn(
      "flex gap-3 p-4",
      isUser ? "bg-muted/50" : "bg-background"
    )}>
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
      )}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium mb-1">
          {isUser ? (language === 'fr' ? 'Vous' : 'You') : 'ProofCheck AI'}
        </div>
        <div className="text-sm text-foreground whitespace-pre-wrap break-words prose prose-sm max-w-none">
          {textContent}
          {message.isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse" />
          )}
        </div>
        
        {/* Render article suggestions if present */}
        {articles.length > 0 && (
          <div className="mt-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground">
              {language === 'fr' 
                ? `${articles.length} article(s) trouvé(s):`
                : `${articles.length} article(s) found:`}
            </p>
            <div className="grid gap-3">
              {articles.map((article) => (
                <ArticleSuggestionCard
                  key={article.id}
                  article={article}
                  onAddToSources={onAddArticle || (() => {})}
                  isAdded={addedArticleIds?.has(article.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
