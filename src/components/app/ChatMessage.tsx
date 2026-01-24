import { useState, useCallback } from 'react';
import { Bot, User, Pencil, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { ChatMessage as ChatMessageType } from '@/hooks/useChatMessages';
import { ArticleSuggestionCard, type ArticleResult } from './ArticleSuggestionCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { MessageTimestamp } from './MessageTimestamp';
import { EditHistoryNav } from './EditHistoryNav';

interface ChatMessageProps {
  message: ChatMessageType | { 
    id: string; 
    role: 'user' | 'assistant'; 
    content: string; 
    timestamp?: Date; 
    isStreaming?: boolean;
    createdAt?: Date;
    editCount?: number;
    parentMessageId?: string | null;
  };
  onAddArticle?: (article: ArticleResult) => void;
  addedArticleIds?: Set<string>;
  onEditMessage?: (messageId: string, newContent: string) => Promise<void>;
  isEditing?: boolean;
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

export const ChatMessage = ({ 
  message, 
  onAddArticle, 
  addedArticleIds,
  onEditMessage,
  isEditing: externalEditing = false
}: ChatMessageProps) => {
  const { language } = useLanguage();
  const isUser = message.role === 'user';
  const [isEditing, setIsEditing] = useState(externalEditing);
  const [editContent, setEditContent] = useState(message.content);
  const [isSaving, setIsSaving] = useState(false);
  const [displayContent, setDisplayContent] = useState(message.content);
  const [isViewingHistory, setIsViewingHistory] = useState(false);

  // Get timestamp from either createdAt or timestamp field
  const timestamp = 'createdAt' in message ? message.createdAt : ('timestamp' in message ? message.timestamp : undefined);
  const editCount = 'editCount' in message ? message.editCount || 0 : 0;
  const parentMessageId = 'parentMessageId' in message ? message.parentMessageId : null;
  
  // Parse articles from assistant messages
  const { textContent, articles } = isUser 
    ? { textContent: displayContent, articles: [] }
    : parseArticlesFromContent(displayContent);

  // Handle content change when navigating history
  const handleHistoryContentChange = useCallback((content: string, viewingHistory: boolean) => {
    setDisplayContent(content);
    setIsViewingHistory(viewingHistory);
  }, []);

  const handleStartEdit = () => {
    setEditContent(message.content);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!onEditMessage || editContent.trim() === message.content) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onEditMessage(message.id, editContent.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving edit:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const t = {
    you: language === 'fr' ? 'Vous' : 'You',
    edit: language === 'fr' ? 'Modifier' : 'Edit',
    save: language === 'fr' ? 'Enregistrer et régénérer' : 'Save & Regenerate',
    cancel: language === 'fr' ? 'Annuler' : 'Cancel',
    articlesFound: (count: number) => language === 'fr' 
      ? `${count} article(s) trouvé(s):`
      : `${count} article(s) found:`,
  };
  
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
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {isUser ? t.you : 'ProofCheck AI'}
            </span>
            {timestamp && <MessageTimestamp date={timestamp} />}
          </div>
          {isUser && onEditMessage && !isEditing && !isViewingHistory && !('isStreaming' in message && message.isStreaming) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleStartEdit}
            >
              <Pencil className="h-3 w-3 mr-1" />
              {t.edit}
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[80px] text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Escape') handleCancelEdit();
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSaveEdit();
              }}
            />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                <X className="h-3 w-3 mr-1" />
                {t.cancel}
              </Button>
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={isSaving || editContent.trim() === message.content}
              >
                <Check className="h-3 w-3 mr-1" />
                {t.save}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-sm text-foreground whitespace-pre-wrap break-words prose prose-sm max-w-none">
              {isUser ? displayContent : textContent}
              {'isStreaming' in message && message.isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse" />
              )}
            </div>
            
            {/* Edit history navigation for user messages */}
            {isUser && (editCount > 0 || parentMessageId) && (
              <EditHistoryNav
                messageId={message.id}
                currentContent={message.content}
                editCount={editCount}
                parentMessageId={parentMessageId}
                onContentChange={handleHistoryContentChange}
              />
            )}
          </>
        )}
        
        {/* Render article suggestions if present */}
        {articles.length > 0 && !isEditing && (
          <div className="mt-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground">
              {t.articlesFound(articles.length)}
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
