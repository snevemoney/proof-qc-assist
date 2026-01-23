import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useLanguage } from './LanguageContext';
import type { Source, Claim, VerificationSummary } from '@/lib/verification';
import type { ArticleResult } from '@/components/app/ArticleSuggestionCard';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface ChatContextType {
  messages: ChatMessage[];
  isLoading: boolean;
  isPanelOpen: boolean;
  setIsPanelOpen: (open: boolean) => void;
  sendMessage: (content: string, action?: 'chat' | 'research' | 'find-sources') => Promise<void>;
  askAboutClaim: (claim: Claim) => void;
  clearMessages: () => void;
  addedArticleIds: Set<string>;
  addSourceFromSearch: (article: ArticleResult) => void;
  projectContext: {
    sources: Source[];
    draftText: string;
    claims: Claim[];
    summary: VerificationSummary | null;
  };
  setProjectContext: (context: {
    sources: Source[];
    draftText: string;
    claims: Claim[];
    summary: VerificationSummary | null;
  }) => void;
  onAddSources?: (sources: Source[]) => void;
  setOnAddSources: (callback: ((sources: Source[]) => void) | undefined) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/research-chat`;
const SEARCH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-articles`;

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { language, t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [addedArticleIds, setAddedArticleIds] = useState<Set<string>>(new Set());
  const [onAddSourcesCallback, setOnAddSourcesCallback] = useState<((sources: Source[]) => void) | undefined>();
  const [projectContext, setProjectContext] = useState<{
    sources: Source[];
    draftText: string;
    claims: Claim[];
    summary: VerificationSummary | null;
  }>({
    sources: [],
    draftText: '',
    claims: [],
    summary: null,
  });

  // Convert ArticleResult to Source
  const articleToSource = useCallback((article: ArticleResult): Source => {
    return {
      id: article.id,
      title: article.title,
      authors: article.authors,
      year: article.year,
      journal: article.journal,
      abstract: article.abstract,
      content: article.abstract || '',
      studyType: article.studyType,
      studyTypeFr: article.studyTypeFr,
      verificationStatus: article.verificationStatus,
      verificationLinks: article.verificationLinks,
      citationAPA: article.citationAPA,
      keyFindings: article.keyFindings,
      url: article.url,
    };
  }, []);

  const addSourceFromSearch = useCallback((article: ArticleResult) => {
    const source = articleToSource(article);
    setAddedArticleIds(prev => new Set([...prev, article.id]));
    
    if (onAddSourcesCallback) {
      onAddSourcesCallback([source]);
    }
  }, [articleToSource, onAddSourcesCallback]);

  const setOnAddSources = useCallback((callback: ((sources: Source[]) => void) | undefined) => {
    setOnAddSourcesCallback(() => callback);
  }, []);

  const sendMessage = useCallback(async (content: string, action: 'chat' | 'research' | 'find-sources' = 'chat') => {
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    let assistantContent = '';
    const assistantId = `assistant-${Date.now()}`;

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && last.id === assistantId) {
          return prev.map((m, i) => 
            i === prev.length - 1 
              ? { ...m, content: assistantContent }
              : m
          );
        }
        return [...prev, {
          id: assistantId,
          role: 'assistant' as const,
          content: assistantContent,
          timestamp: new Date(),
          isStreaming: true,
        }];
      });
    };

    try {
      // If action is find-sources, first search for articles then stream a response
      if (action === 'find-sources') {
        // Search for articles
        const unsupportedClaims = projectContext.claims
          .filter(c => c.status === 'unsupported' || c.status === 'partial')
          .map(c => c.text);
        
        const searchResp = await fetch(SEARCH_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            query: content,
            language,
            context: {
              draftTopic: projectContext.draftText.substring(0, 200),
              existingSources: projectContext.sources.map(s => s.title),
              unsupportedClaims: unsupportedClaims.slice(0, 3),
            },
          }),
        });

        if (searchResp.ok) {
          const searchData = await searchResp.json();
          const articles = searchData.articles || [];
          
          if (articles.length > 0) {
            // Format articles as JSON block in the message
            const articlesJson = JSON.stringify({ articles }, null, 2);
            const introText = language === 'fr'
              ? `J'ai trouvé ${articles.length} articles académiques pertinents pour votre recherche:\n\n`
              : `I found ${articles.length} relevant academic articles for your research:\n\n`;
            
            assistantContent = introText + `\`\`\`json\n${articlesJson}\n\`\`\``;
            
            setMessages(prev => [...prev, {
              id: assistantId,
              role: 'assistant',
              content: assistantContent,
              timestamp: new Date(),
              isStreaming: false,
            }]);
            
            setIsLoading(false);
            return;
          }
        }
        
        // If search failed or no results, fall back to regular chat
        assistantContent = language === 'fr'
          ? 'Je n\'ai pas pu trouver d\'articles pour cette recherche. Essayez de reformuler votre requête.'
          : 'I couldn\'t find articles for this search. Try rephrasing your query.';
        
        setMessages(prev => [...prev, {
          id: assistantId,
          role: 'assistant',
          content: assistantContent,
          timestamp: new Date(),
        }]);
        
        setIsLoading(false);
        return;
      }

      // Regular chat or research flow
      const chatHistory = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...chatHistory, { role: 'user', content }],
          context: projectContext,
          language,
          action: action === 'research' ? 'research' : 'chat',
        }),
      });

      if (!resp.ok || !resp.body) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to start stream');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) updateAssistant(content);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) updateAssistant(content);
          } catch { /* ignore */ }
        }
      }

      // Mark streaming complete
      setMessages(prev => 
        prev.map(m => 
          m.id === assistantId ? { ...m, isStreaming: false } : m
        )
      );

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: assistantId,
        role: 'assistant',
        content: language === 'fr' 
          ? 'Désolé, une erreur s\'est produite. Veuillez réessayer.'
          : 'Sorry, an error occurred. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, projectContext, language]);

  const askAboutClaim = useCallback((claim: Claim) => {
    setIsPanelOpen(true);
    const statusLabels = {
      supported: language === 'fr' ? 'soutenue' : 'supported',
      partial: language === 'fr' ? 'partielle' : 'partial',
      unsupported: language === 'fr' ? 'non trouvée' : 'unsupported',
      contradicted: language === 'fr' ? 'contredite' : 'contradicted',
    };
    
    const question = language === 'fr'
      ? `Pourquoi mon affirmation "${claim.text}" est-elle marquée comme ${statusLabels[claim.status]}? Comment puis-je l'améliorer?`
      : `Why is my claim "${claim.text}" marked as ${statusLabels[claim.status]}? How can I improve it?`;
    
    sendMessage(question);
  }, [language, sendMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setAddedArticleIds(new Set());
  }, []);

  return (
    <ChatContext.Provider value={{
      messages,
      isLoading,
      isPanelOpen,
      setIsPanelOpen,
      sendMessage,
      askAboutClaim,
      clearMessages,
      addedArticleIds,
      addSourceFromSearch,
      projectContext,
      setProjectContext,
      onAddSources: onAddSourcesCallback,
      setOnAddSources,
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
