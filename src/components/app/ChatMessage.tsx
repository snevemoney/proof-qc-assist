import { useState, useEffect } from 'react';
import { Bot, User, Pencil, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import type { ChatMessage as ChatMessageType, MessageVersion } from '@/hooks/useChatMessages';
import { ArticleSuggestionCard, type ArticleResult } from './ArticleSuggestionCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatRelativeTime, formatFullDateTime } from '@/lib/formatRelativeTime';
interface ChatMessageProps {
  message: ChatMessageType | { id: string; role: 'user' | 'assistant'; content: string; timestamp?: Date; isStreaming?: boolean; createdAt?: Date; isEdited?: boolean; parentMessageId?: string | null };
  onAddArticle?: (article: ArticleResult) => void;
  addedArticleIds?: Set<string>;
  onEditMessage?: (messageId: string, newContent: string) => Promise<void>;
  isEditing?: boolean;
  onGetEditHistory?: (messageId: string) => Promise<MessageVersion[]>;
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
  isEditing: externalEditing = false,
  onGetEditHistory
}: ChatMessageProps) => {
  const { language, t } = useLanguage();
  const isUser = message.role === 'user';
  const [isEditing, setIsEditing] = useState(externalEditing);
  const [editContent, setEditContent] = useState(message.content);
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit history state
  const [editHistory, setEditHistory] = useState<MessageVersion[]>([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [displayContent, setDisplayContent] = useState(message.content);
  
  // Determine if message was edited
  const isEdited = 'isEdited' in message && message.isEdited;
  const hasParent = 'parentMessageId' in message && message.parentMessageId;
  const showEditedBadge = isEdited || hasParent;
  
  // Get message timestamp
  const messageDate = 'createdAt' in message && message.createdAt 
    ? message.createdAt 
    : ('timestamp' in message && message.timestamp ? message.timestamp : new Date());
  
  // Parse articles from assistant messages
  const { textContent, articles } = isUser 
    ? { textContent: displayContent, articles: [] }
    : parseArticlesFromContent(displayContent);

  // Update display content when message content changes
  useEffect(() => {
    setDisplayContent(message.content);
    setCurrentVersionIndex(editHistory.length > 0 ? editHistory.length - 1 : 0);
  }, [message.content, editHistory.length]);

  // Load edit history when user clicks to view versions
  const loadEditHistory = async () => {
    if (!onGetEditHistory || isLoadingHistory || editHistory.length > 0) return;
    
    setIsLoadingHistory(true);
    try {
      const history = await onGetEditHistory(message.id);
      if (history.length > 1) {
        setEditHistory(history);
        setCurrentVersionIndex(history.length - 1);
      }
    } catch (error) {
      console.error('Error loading edit history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const goToPreviousVersion = () => {
    if (currentVersionIndex > 0) {
      const newIndex = currentVersionIndex - 1;
      setCurrentVersionIndex(newIndex);
      setDisplayContent(editHistory[newIndex].content);
    }
  };

  const goToNextVersion = () => {
    if (currentVersionIndex < editHistory.length - 1) {
      const newIndex = currentVersionIndex + 1;
      setCurrentVersionIndex(newIndex);
      setDisplayContent(editHistory[newIndex].content);
    }
  };

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

  const translations = {
    you: language === 'fr' ? 'Vous' : 'You',
    edit: language === 'fr' ? 'Modifier' : 'Edit',
    save: language === 'fr' ? 'Enregistrer et régénérer' : 'Save & Regenerate',
    cancel: language === 'fr' ? 'Annuler' : 'Cancel',
    edited: t('chat.edited'),
    articlesFound: (count: number) => language === 'fr' 
      ? `${count} article(s) trouvé(s):`
      : `${count} article(s) found:`,
  };

  const hasMultipleVersions = editHistory.length > 1;
  const isViewingOldVersion = hasMultipleVersions && currentVersionIndex < editHistory.length - 1;
  
  return (
    <TooltipProvider>
      <div className={cn(
        "group flex gap-3 sm:gap-4 p-4 sm:p-5",
        isUser ? "bg-muted/50" : "bg-background"
      )}>
        <div className={cn(
          "flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center",
          isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
        )}>
          {isUser ? <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <span className="text-xs sm:text-sm font-medium">
                {isUser ? translations.you : 'ProofCheck AI'}
              </span>
              
              {/* Edit history navigation */}
              {showEditedBadge && isUser && (
                <div className="flex items-center gap-1">
                  {hasMultipleVersions ? (
                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-muted-foreground hover:text-foreground"
                        onClick={goToPreviousVersion}
                        disabled={currentVersionIndex === 0}
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </Button>
                      <span className="text-xs text-muted-foreground min-w-[2.5rem] text-center">
                        {currentVersionIndex + 1}/{editHistory.length}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-muted-foreground hover:text-foreground"
                        onClick={goToNextVersion}
                        disabled={currentVersionIndex === editHistory.length - 1}
                      >
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1.5 text-xs text-muted-foreground hover:text-foreground"
                      onClick={loadEditHistory}
                      disabled={isLoadingHistory}
                    >
                      {translations.edited}
                    </Button>
                  )}
                </div>
              )}
              
              {/* Timestamp with tooltip */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    type="button"
                    className="text-[10px] sm:text-xs text-muted-foreground cursor-default hover:text-muted-foreground/80"
                  >
                    {formatRelativeTime(messageDate, language)}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {formatFullDateTime(messageDate, language)}
                </TooltipContent>
              </Tooltip>
            </div>
            
            {isUser && onEditMessage && !isEditing && !('isStreaming' in message && message.isStreaming) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleStartEdit}
              >
                <Pencil className="h-3 w-3 mr-1" />
                {translations.edit}
              </Button>
            )}
          </div>

          {isViewingOldVersion && (
            <div className="text-xs text-muted-foreground italic mb-2">
              {language === 'fr' 
                ? `Affichage de la version ${currentVersionIndex + 1} sur ${editHistory.length}`
                : `Viewing version ${currentVersionIndex + 1} of ${editHistory.length}`
              }
            </div>
          )}

          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[100px] text-sm"
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
                  {translations.cancel}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={isSaving || editContent.trim() === message.content}
                >
                  <Check className="h-3 w-3 mr-1" />
                  {translations.save}
                </Button>
              </div>
            </div>
          ) : (
            <div className={cn(
              "text-sm text-foreground break-words",
              isViewingOldVersion && "opacity-70"
            )}>
              {isUser ? (
                <div className="whitespace-pre-wrap">{displayContent}</div>
              ) : (
                <div className="prose prose-sm max-w-none dark:prose-invert prose-p:mb-2 prose-p:last:mb-0 prose-headings:text-sm prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1 prose-ul:pl-4 prose-ul:mb-2 prose-li:text-sm prose-strong:font-semibold">
                  <ReactMarkdown
                    components={{
                      h1: ({children}) => <h4 className="font-semibold text-sm mt-3 mb-1">{children}</h4>,
                      h2: ({children}) => <h5 className="font-medium text-sm mt-2 mb-1">{children}</h5>,
                      h3: ({children}) => <h6 className="font-medium text-sm mt-2 mb-1">{children}</h6>,
                      p: ({children}) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                      ul: ({children}) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                      ol: ({children}) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                      li: ({children}) => <li className="text-sm leading-relaxed">{children}</li>,
                      strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                      a: ({href, children}) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{children}</a>,
                    }}
                  >
                    {textContent}
                  </ReactMarkdown>
                </div>
              )}
              {'isStreaming' in message && message.isStreaming && (
                <span className="inline-block w-2 h-5 ml-1 bg-primary animate-pulse rounded-sm" />
              )}
            </div>
          )}
          
          {/* Render article suggestions if present */}
          {articles.length > 0 && !isEditing && (
            <div className="mt-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground">
                {translations.articlesFound(articles.length)}
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
    </TooltipProvider>
  );
};
