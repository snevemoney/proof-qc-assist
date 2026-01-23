import { useState, useEffect } from 'react';
import { FileText, Edit3, BarChart3, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SourcesTab } from './SourcesTab';
import { DraftTab } from './DraftTab';
import { ReportTab } from './ReportTab';
import { ChatPanel } from './ChatPanel';

import { useLanguage } from '@/contexts/LanguageContext';
import { ChatProvider, useChat } from '@/contexts/ChatContext';
import { verifyClaims, type Source } from '@/lib/verification';
import { useToast } from '@/hooks/use-toast';
import { useProject } from '@/hooks/useProject';
import { useVerificationHistory, VerificationHistoryEntry } from '@/hooks/useVerificationHistory';

const ProjectWorkspaceContent = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { setProjectContext, setExternalMessages, setOnMessagesChange } = useChat();
  
  const {
    sources,
    draftText,
    claims,
    summary,
    chatMessages,
    activeTab,
    strictMode,
    hasVerified,
    isLoading,
    isSaving,
    setSources,
    setDraftText,
    setClaims,
    setSummary,
    setChatMessages,
    setActiveTab,
    setStrictMode,
    setHasVerified,
    updateStateImmediate,
  } = useProject();

  const { history, isLoading: historyLoading, saveToHistory, deleteFromHistory } = useVerificationHistory();
  const [isVerifying, setIsVerifying] = useState(false);

  // Sync project context with chat
  useEffect(() => {
    setProjectContext({ sources, draftText, claims, summary });
  }, [sources, draftText, claims, summary, setProjectContext]);

  // Load chat messages from project
  useEffect(() => {
    if (chatMessages.length > 0) {
      setExternalMessages(chatMessages);
    }
  }, [chatMessages, setExternalMessages]);

  // Save chat messages when they change
  useEffect(() => {
    setOnMessagesChange((messages) => {
      setChatMessages(messages);
    });
  }, [setOnMessagesChange, setChatMessages]);

  const handleAddSources = (newSources: Source[]) => {
    setSources(prev => [...prev, ...newSources]);
  };

  const handleDeleteSource = (id: string) => {
    setSources(prev => prev.filter(s => s.id !== id));
  };

  const handleRestoreHistory = (entry: VerificationHistoryEntry) => {
    // Restore the verification state from history
    setClaims(entry.claims);
    setSummary(entry.summary);
    setSources(entry.sourcesSnapshot);
    setDraftText(entry.draftText);
    setStrictMode(entry.strictMode);
    setHasVerified(true);
    setActiveTab('report');
    
    toast({
      title: language === 'fr' ? 'Historique restauré' : 'History restored',
      description: language === 'fr' 
        ? 'Les résultats précédents ont été chargés'
        : 'Previous results have been loaded',
    });
  };

  const handleVerify = async () => {
    console.log('handleVerify: Starting verification...');
    setIsVerifying(true);
    try {
      console.log('handleVerify: Calling verifyClaims with', sources.length, 'sources');
      const result = await verifyClaims(sources, draftText, strictMode, language);
      console.log('handleVerify: Got result:', result);
      
      // Validate result structure
      if (!result || !Array.isArray(result.claims)) {
        throw new Error('Invalid verification response structure');
      }
      
      // Update all state at once and save immediately
      await updateStateImmediate({
        claims: result.claims,
        summary: result.summary,
        hasVerified: true,
        activeTab: 'report',
      });
      
      console.log('handleVerify: State updated and saved');

      // Save to history for logged-in users
      await saveToHistory({
        claims: result.claims,
        summary: result.summary,
        draftText,
        sourcesSnapshot: sources,
        strictMode,
      });
      
      toast({
        title: language === 'fr' ? 'Vérification terminée' : 'Verification complete',
        description: language === 'fr' 
          ? `${result.claims.length} affirmations analysées`
          : `${result.claims.length} claims analyzed`,
      });
    } catch (error) {
      console.error('handleVerify: Error:', error);
      toast({
        title: language === 'fr' ? 'Erreur de vérification' : 'Verification error',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
      console.log('handleVerify: Finished');
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {language === 'fr' ? 'Chargement...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 relative">
      {isSaving && (
        <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          {language === 'fr' ? 'Sauvegarde...' : 'Saving...'}
        </div>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="sources" className="gap-2">
            <FileText className="h-4 w-4" />
            {t('tabs.sources')} ({sources.length})
          </TabsTrigger>
          <TabsTrigger value="draft" className="gap-2">
            <Edit3 className="h-4 w-4" />
            {t('tabs.draft')}
          </TabsTrigger>
          <TabsTrigger value="report" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            {t('tabs.report')}
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="sources" className="mt-0">
            <SourcesTab
              sources={sources}
              onAddSources={handleAddSources}
              onDeleteSource={handleDeleteSource}
            />
          </TabsContent>

          <TabsContent value="draft" className="mt-0">
            <DraftTab
              draftText={draftText}
              onDraftChange={setDraftText}
              onVerify={handleVerify}
              sourcesCount={sources.length}
              isVerifying={isVerifying}
              strictMode={strictMode}
              onStrictModeChange={setStrictMode}
            />
          </TabsContent>

          <TabsContent value="report" className="mt-0">
            <ReportTab
              hasVerified={hasVerified}
              claims={claims}
              summary={summary}
              sourcesCount={sources.length}
              draftLength={draftText.length}
              history={history}
              historyLoading={historyLoading}
              onRestoreHistory={handleRestoreHistory}
              onDeleteHistory={deleteFromHistory}
            />
          </TabsContent>
        </div>
      </Tabs>
      
      {/* Chat Panel */}
      <ChatPanel />
    </div>
  );
};

export const ProjectWorkspace = () => {
  return (
    <ChatProvider>
      <ProjectWorkspaceContent />
    </ChatProvider>
  );
};
