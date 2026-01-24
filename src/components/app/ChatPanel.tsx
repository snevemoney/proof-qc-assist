import { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, Sparkles, Trash2, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useChat } from '@/contexts/ChatContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChatMessage } from './ChatMessage';
import { QuickActions } from './QuickActions';
import { PICOSearchForm } from './PICOSearchForm';
import { NursingDatabaseLinks } from './NursingDatabaseLinks';
import { cn } from '@/lib/utils';

export const ChatPanel = () => {
  const { language } = useLanguage();
  const { 
    messages, 
    isLoading, 
    isPanelOpen, 
    setIsPanelOpen, 
    sendMessage,
    clearMessages,
    projectContext,
    addedArticleIds,
    addSourceFromSearch,
  } = useChat();
  
  const [inputValue, setInputValue] = useState('');
  const [isResearchMode, setIsResearchMode] = useState(false);
  const [showPICO, setShowPICO] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isPanelOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isPanelOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    
    const message = inputValue;
    setInputValue('');
    await sendMessage(message, isResearchMode ? 'research' : 'chat');
  };

  const handleQuickAction = async (message: string, action: 'chat' | 'research' | 'find-sources') => {
    await sendMessage(message, action);
  };

  const hasVerificationResults = projectContext.claims.length > 0;

  return (
    <>
      {!isPanelOpen && (
        <Button
          onClick={() => setIsPanelOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {isPanelOpen && (
        <Sheet open={isPanelOpen} onOpenChange={setIsPanelOpen}>
        <SheetContent side="right" className="w-full sm:w-[450px] sm:max-w-[450px] p-0 flex flex-col h-full overflow-hidden">
          <SheetHeader className="p-4 border-b border-border flex-shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {language === 'fr' ? 'Assistant ProofCheck' : 'ProofCheck Assistant'}
              </SheetTitle>
              {messages.length > 0 && (
                <Button variant="ghost" size="icon" onClick={clearMessages} className="h-8 w-8">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={cn(
                "text-xs px-2 py-1 rounded-full",
                projectContext.sources.length > 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {projectContext.sources.length} sources
              </span>
              <span className={cn(
                "text-xs px-2 py-1 rounded-full",
                projectContext.draftText.length > 0 ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {language === 'fr' ? 'Brouillon' : 'Draft'} {projectContext.draftText.length > 0 ? '✓' : '—'}
              </span>
              <span className={cn(
                "text-xs px-2 py-1 rounded-full",
                hasVerificationResults ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
              )}>
                {projectContext.claims.length} {language === 'fr' ? 'affirmations' : 'claims'}
              </span>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1" viewportRef={scrollRef}>
            {messages.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary/50" />
                <h3 className="font-medium mb-2">
                  {language === 'fr' ? 'Comment puis-je vous aider?' : 'How can I help you?'}
                </h3>
                <p className="text-sm">
                  {language === 'fr' 
                    ? 'Je connais vos sources, votre brouillon et vos résultats de vérification.'
                    : 'I know your sources, draft, and verification results.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {messages.map((message) => (
                  <ChatMessage 
                    key={message.id} 
                    message={message}
                    onAddArticle={addSourceFromSearch}
                    addedArticleIds={addedArticleIds}
                  />
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Nursing Database Links */}
          <NursingDatabaseLinks />

          {showPICO ? (
            <div className="p-4 border-t border-border">
              <PICOSearchForm 
                onSearch={handleQuickAction}
                onClose={() => setShowPICO(false)}
                disabled={isLoading}
              />
            </div>
          ) : (
            <QuickActions onAction={handleQuickAction} hasVerificationResults={hasVerificationResults} disabled={isLoading} />
          )}

          <form onSubmit={handleSubmit} className="p-4 border-t border-border flex-shrink-0">
            <div className="flex gap-2 mb-2">
              <Button
                type="button"
                variant={isResearchMode ? "default" : "outline"}
                size="sm"
                className="text-xs gap-1"
                onClick={() => setIsResearchMode(!isResearchMode)}
              >
                <Sparkles className="h-3 w-3" />
                {language === 'fr' ? 'Mode recherche' : 'Research mode'}
              </Button>
              <Button
                type="button"
                variant={showPICO ? "default" : "outline"}
                size="sm"
                className="text-xs gap-1"
                onClick={() => setShowPICO(!showPICO)}
              >
                <Stethoscope className="h-3 w-3" />
                PICO
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={language === 'fr' ? 'Posez une question...' : 'Ask a question...'}
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </SheetContent>
        </Sheet>
      )}
    </>
  );
};
