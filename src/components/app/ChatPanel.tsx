import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, MessageCircle, Sparkles, Trash2, Stethoscope, ChevronDown, Plus, Check, Pencil, X, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useChat } from '@/contexts/ChatContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useChatMessages } from '@/hooks/useChatMessages';
import { ChatMessage } from './ChatMessage';
import { QuickActions } from './QuickActions';
import { NursingDatabaseLinks } from './NursingDatabaseLinks';
import { cn } from '@/lib/utils';

export const ChatPanel = () => {
  const { language } = useLanguage();
  const { 
    currentSessionId, 
    sessions, 
    setCurrentSessionId, 
    createSession, 
    renameSession, 
    deleteSession 
  } = useProjectContext();
  const { 
    messages: contextMessages,
    isLoading: contextLoading,
    sendMessage: sendContextMessage,
    projectContext,
    addedArticleIds,
    addSourceFromSearch,
    isPanelOpen,
    setIsPanelOpen,
    clearMessages: clearContextMessages,
  } = useChat();
  
  // Use persistent chat messages from the hook
  const {
    messages: persistentMessages,
    addMessage,
    updateMessageStreaming,
    editMessageAndFork,
    clearMessages: clearPersistentMessages,
    getMessageEditHistory,
    isLoading: messagesLoading,
  } = useChatMessages(currentSessionId);
  
  // Merge persistent messages with any streaming context messages
  const messages = persistentMessages.length > 0 ? persistentMessages : contextMessages.map(m => ({
    id: m.id,
    sessionId: currentSessionId || '',
    role: m.role,
    content: m.content,
    parentMessageId: null,
    isActive: true,
    createdAt: m.timestamp,
    isStreaming: m.isStreaming,
  }));
  
  const [inputValue, setInputValue] = useState('');
  const [isResearchMode, setIsResearchMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const streamingMessageIdRef = useRef<string | null>(null);
  const sessionDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sessionDropdownRef.current && !sessionDropdownRef.current.contains(event.target as Node)) {
        setShowSessions(false);
        setEditingSessionId(null);
      }
    };
    if (showSessions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSessions]);

  // Clear context messages when switching sessions
  useEffect(() => {
    clearContextMessages();
  }, [currentSessionId, clearContextMessages]);

  const currentSession = sessions.find(s => s.id === currentSessionId);

  const handleCreateNewSession = async () => {
    clearContextMessages();
    await createSession(language === 'fr' ? 'Nouvelle conversation' : 'New chat');
    setShowSessions(false);
  };

  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setShowSessions(false);
    setEditingSessionId(null);
  };

  const handleStartRename = (sessionId: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(sessionId);
    setEditingName(currentName);
  };

  const handleSaveRename = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingName.trim()) {
      await renameSession(sessionId, editingName.trim());
    }
    setEditingSessionId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(null);
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteSession(sessionId);
  };

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

  // Auto-rename session based on first user message
  const autoRenameSession = useCallback(async (content: string) => {
    if (currentSessionId && messages.length === 0) {
      const sessionName = content.slice(0, 40) + (content.length > 40 ? '...' : '');
      await renameSession(currentSessionId, sessionName);
    }
  }, [currentSessionId, messages.length, renameSession]);

  const handleSendMessage = useCallback(async (content: string, action: 'chat' | 'research' | 'find-sources' = 'chat') => {
    if (!content.trim() || isLoading || !currentSessionId) return;
    
    setIsLoading(true);
    
    try {
      // Auto-rename session on first message
      await autoRenameSession(content);
      
      // Add user message to persistent storage
      const userMessage = await addMessage('user', content);
      if (!userMessage) throw new Error('Failed to add user message');
      
      // Create placeholder for assistant message
      const assistantMessage = await addMessage('assistant', '', true);
      if (!assistantMessage) throw new Error('Failed to add assistant message');
      streamingMessageIdRef.current = assistantMessage.id;
      
      // Send to API and stream response
      await sendContextMessage(content, action);
      
      // The context's sendMessage will update the messages via useEffect
      // For now, we'll finalize the streaming message
      if (streamingMessageIdRef.current) {
        // Get the final content from context messages
        const lastContextMessage = contextMessages[contextMessages.length - 1];
        if (lastContextMessage && lastContextMessage.role === 'assistant') {
          updateMessageStreaming(streamingMessageIdRef.current, lastContextMessage.content, false);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
      streamingMessageIdRef.current = null;
    }
  }, [isLoading, currentSessionId, autoRenameSession, addMessage, sendContextMessage, contextMessages, updateMessageStreaming]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    
    const message = inputValue;
    setInputValue('');
    await handleSendMessage(message, isResearchMode ? 'research' : 'chat');
  };

  const handleQuickAction = async (message: string, action: 'chat' | 'research' | 'find-sources') => {
    await handleSendMessage(message, action);
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    const result = await editMessageAndFork(messageId, newContent);
    if (result) {
      // Re-send the edited message to get new AI response
      setIsLoading(true);
      try {
        const assistantMessage = await addMessage('assistant', '', true);
        if (assistantMessage) {
          streamingMessageIdRef.current = assistantMessage.id;
          await sendContextMessage(newContent, 'chat');
          
          const lastContextMessage = contextMessages[contextMessages.length - 1];
          if (lastContextMessage && lastContextMessage.role === 'assistant') {
            updateMessageStreaming(assistantMessage.id, lastContextMessage.content, false);
          }
        }
      } finally {
        setIsLoading(false);
        streamingMessageIdRef.current = null;
      }
    }
  };

  const handleClearMessages = async () => {
    await clearPersistentMessages();
    clearContextMessages();
  };

  const hasVerificationResults = projectContext.claims.length > 0;
  const loading = isLoading || contextLoading || messagesLoading;

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
                <Button variant="ghost" size="icon" onClick={handleClearMessages} className="h-8 w-8">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Chat Sessions Dropdown */}
            <div className="relative mt-2" ref={sessionDropdownRef}>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowSessions(!showSessions)}
                className="w-full justify-between text-sm h-9"
              >
                <span className="flex items-center gap-2 truncate">
                  <MessageCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{currentSession?.name || (language === 'fr' ? 'Nouvelle conversation' : 'New chat')}</span>
                </span>
                <ChevronDown className={cn("h-3.5 w-3.5 flex-shrink-0 transition-transform", showSessions && "rotate-180")} />
              </Button>
              
              {showSessions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-[60] overflow-hidden">
                  <div className="p-2 border-b border-border">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start gap-2 h-8"
                      onClick={handleCreateNewSession}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {language === 'fr' ? 'Nouvelle conversation' : 'New chat'}
                    </Button>
                  </div>
                  <ScrollArea className="max-h-[200px]">
                    {sessions.map((session) => (
                      <div 
                        key={session.id}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 hover:bg-muted cursor-pointer group",
                          currentSessionId === session.id && "bg-primary/10"
                        )}
                        onClick={() => handleSelectSession(session.id)}
                      >
                        {editingSessionId === session.id ? (
                          <div className="flex items-center gap-1 flex-1" onClick={e => e.stopPropagation()}>
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="h-6 text-sm flex-1"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename(session.id, e as any);
                                if (e.key === 'Escape') setEditingSessionId(null);
                              }}
                            />
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => handleSaveRename(session.id, e)}>
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCancelRename}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <span className="truncate text-sm flex-1">{session.name}</span>
                            <div className="flex items-center gap-1">
                              {currentSessionId === session.id && (
                                <Check className="h-3.5 w-3.5 text-primary" />
                              )}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                onClick={(e) => handleStartRename(session.id, session.name, e)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              {sessions.length > 1 && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive pointer-events-auto"
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onClick={(e) => handleDeleteSession(session.id, e)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </ScrollArea>
                </div>
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
                  <div key={message.id} className="group">
                    <ChatMessage 
                      message={message}
                      onAddArticle={addSourceFromSearch}
                      addedArticleIds={addedArticleIds}
                      onEditMessage={message.role === 'user' ? handleEditMessage : undefined}
                      onGetEditHistory={message.role === 'user' ? getMessageEditHistory : undefined}
                    />
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Nursing Database Links */}
          <NursingDatabaseLinks />

          {/* Quick Actions - Always visible */}
          <QuickActions onAction={handleQuickAction} hasVerificationResults={hasVerificationResults} disabled={loading} />

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
                {language === 'fr' ? 'Recherche' : 'Research'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs gap-1"
                disabled={loading || !projectContext.draftText}
                onClick={() => handleQuickAction(
                  language === 'fr' 
                    ? 'Analyse mon brouillon avec le framework PICO et trouve des articles académiques.' 
                    : 'Analyze my draft using the PICO framework and find academic articles.',
                  'find-sources'
                )}
                title={!projectContext.draftText ? (language === 'fr' ? 'Ajoutez un brouillon d\'abord' : 'Add a draft first') : ''}
              >
                <Stethoscope className="h-3 w-3" />
                PICO
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs gap-1"
                disabled={loading || !projectContext.draftText}
                onClick={() => handleQuickAction(
                  language === 'fr' 
                    ? 'Extrais les mots-clés et termes MeSH de mon brouillon et trouve des articles.' 
                    : 'Extract keywords and MeSH terms from my draft and find articles.',
                  'find-sources'
                )}
                title={!projectContext.draftText ? (language === 'fr' ? 'Ajoutez un brouillon d\'abord' : 'Add a draft first') : ''}
              >
                <Key className="h-3 w-3" />
                {language === 'fr' ? 'Mots-clés' : 'Keywords'}
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={language === 'fr' ? 'Posez une question...' : 'Ask a question...'}
                disabled={loading}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={loading || !inputValue.trim()}>
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
