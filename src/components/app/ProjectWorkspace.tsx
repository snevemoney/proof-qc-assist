import { useState, useEffect } from 'react';
import { FileText, Edit3, BarChart3, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SourcesTab } from './SourcesTab';
import { DraftTab } from './DraftTab';
import { ReportTab } from './ReportTab';
import { ChatPanel } from './ChatPanel';
import { OnboardingModal } from './OnboardingModal';
import { ReadinessIndicator } from './ReadinessIndicator';
import { AuthModal } from '@/components/auth/AuthModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChatProvider, useChat } from '@/contexts/ChatContext';
import { useProjectContext } from '@/contexts/ProjectContext';
import { verifyClaims, type Source, VerificationError } from '@/lib/verification';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { useProject } from '@/hooks/useProject';
import { useVerificationHistory, VerificationHistoryEntry } from '@/hooks/useVerificationHistory';
import { useSavedDrafts } from '@/hooks/useSavedDrafts';

const ProjectWorkspaceContent = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const { setProjectContext, setExternalMessages, setOnMessagesChange } = useChat();
  
  const {
    sources,
    draftText,
    claims,
    interventions,
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
    setInterventions,
    setSummary,
    setChatMessages,
    setActiveTab,
    setStrictMode,
    setHasVerified,
    updateStateImmediate,
  } = useProject();

  const { history, isLoading: historyLoading, saveToHistory, deleteFromHistory } = useVerificationHistory();
  const { savedDrafts, isLoading: savedDraftsLoading, saveDraft, deleteDraft } = useSavedDrafts();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<VerificationError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isTransitioningToReport, setIsTransitioningToReport] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Reset stale verification flag for logged-in users when history is empty
  // Skip for anonymous users since they don't have history persistence
  useEffect(() => {
    if (user && !historyLoading && hasVerified && history.length === 0 && claims.length === 0) {
      setHasVerified(false);
    }
  }, [user, historyLoading, hasVerified, history.length, claims.length, setHasVerified]);

  // Sync project context with chat
  useEffect(() => {
    setProjectContext({ sources, draftText, claims, interventions, summary });
  }, [sources, draftText, claims, interventions, summary, setProjectContext]);

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
    setInterventions((entry as any).interventions || []);
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

  const handleDeleteHistory = async (id: string) => {
    const success = await deleteFromHistory(id);
    
    if (success) {
      // Filter out the deleted entry to find remaining history
      const remainingHistory = history.filter(entry => entry.id !== id);
      
      if (remainingHistory.length > 0) {
        // Auto-restore the most recent remaining entry
        const mostRecent = remainingHistory[0]; // Already sorted by created_at desc
        setClaims(mostRecent.claims);
        setInterventions((mostRecent as any).interventions || []);
        setSummary(mostRecent.summary);
        setSources(mostRecent.sourcesSnapshot);
        setDraftText(mostRecent.draftText);
        setStrictMode(mostRecent.strictMode);
        setHasVerified(true);
        
        toast({
          title: language === 'fr' ? 'Rapport supprimé' : 'Report deleted',
          description: language === 'fr' 
            ? 'Le rapport précédent a été restauré'
            : 'Previous report has been restored',
        });
      } else {
        // No remaining history, reset to empty state
        setClaims([]);
        setInterventions([]);
        setSummary(null);
        setHasVerified(false);
        
        toast({
          title: language === 'fr' ? 'Rapport supprimé' : 'Report deleted',
          description: language === 'fr' 
            ? 'Lancez une nouvelle vérification'
            : 'Run a new verification',
        });
      }
    }
  };

  const handleVerify = async () => {
    console.log('handleVerify: Starting verification...');
    setIsVerifying(true);
    setVerificationError(null);
    setRetryCount(0);
    
    try {
      console.log('handleVerify: Calling verifyClaims with', sources.length, 'sources');
      const result = await verifyClaims(
        sources, 
        draftText, 
        strictMode, 
        language,
        (attempt, error, delayMs) => {
          setRetryCount(attempt);
          console.log(`handleVerify: Retry attempt ${attempt}, delay ${delayMs}ms`, error);
          toast({
            title: language === 'fr' ? 'Nouvelle tentative...' : 'Retrying...',
            description: language === 'fr' 
              ? `Tentative ${attempt}/2 - Veuillez patienter` 
              : `Attempt ${attempt}/2 - Please wait`,
          });
        }
      );
      console.log('handleVerify: Got result:', result);
      
      // Validate result structure
      if (!result || !Array.isArray(result.claims)) {
        throw new VerificationError('parse_error', 'Invalid verification response structure', true);
      }
      
      // Clear error on success
      setVerificationError(null);
      
      // Update state except activeTab, then switch tab after a brief delay
      await updateStateImmediate({
        claims: result.claims,
        interventions: result.interventions || [],
        summary: result.summary,
        hasVerified: true,
      });
      
      // Blur any focused tooltip triggers to force-close tooltips before tab switch
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      
      // Show loading state during transition
      setIsTransitioningToReport(true);
      
      // Increased delay before tab switch to let portals properly unmount
      setTimeout(() => {
        setActiveTab('report');
        setIsTransitioningToReport(false);
        
        // Show auth prompt for anonymous users after transition
        if (!user) {
          setShowAuthPrompt(true);
        }
      }, 300);
      
      console.log('handleVerify: State updated and saved');

      // Save to history for logged-in users
      await saveToHistory({
        claims: result.claims,
        interventions: result.interventions || [],
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
      
      // Classify error properly
      const verifyError = error instanceof VerificationError 
        ? error 
        : new VerificationError('unknown', error instanceof Error ? error.message : 'Unknown error', false);
      
      setVerificationError(verifyError);
      
      toast({
        title: language === 'fr' ? 'Erreur de vérification' : 'Verification error',
        description: verifyError.message,
        variant: 'destructive',
        action: verifyError.isRetryable ? (
          <ToastAction altText={language === 'fr' ? 'Réessayer' : 'Retry'} onClick={handleVerify}>
            {language === 'fr' ? 'Réessayer' : 'Retry'}
          </ToastAction>
        ) : undefined,
      });
    } finally {
      setIsVerifying(false);
      setRetryCount(0);
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
    <main className="flex-1 p-6 relative overflow-auto">
      {isSaving && (
        <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          {language === 'fr' ? 'Sauvegarde...' : 'Saving...'}
        </div>
      )}
      
      {/* Submission Readiness Progress Bar */}
      <ReadinessIndicator 
        claims={claims}
        interventions={interventions}
        summary={summary}
        hasVerified={hasVerified}
        onNavigateToReport={() => setActiveTab('report')}
      />
      
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
              savedDrafts={savedDrafts}
              savedDraftsLoading={savedDraftsLoading}
              onSaveDraft={saveDraft}
              onDeleteDraft={deleteDraft}
              verificationError={verificationError}
              retryCount={retryCount}
            />
          </TabsContent>

          <TabsContent value="report" className="mt-0">
            <ReportTab
              hasVerified={hasVerified}
              isLoading={isTransitioningToReport}
              claims={claims}
              interventions={interventions}
              summary={summary}
              sourcesCount={sources.length}
              draftLength={draftText.length}
              history={history}
              historyLoading={historyLoading}
              onRestoreHistory={handleRestoreHistory}
              onDeleteHistory={handleDeleteHistory}
              showAuthPrompt={showAuthPrompt && !user}
              onDismissAuthPrompt={() => setShowAuthPrompt(false)}
              onOpenAuthModal={() => setAuthModalOpen(true)}
            />
          </TabsContent>
        </div>
      </Tabs>
      
      {/* Chat Panel */}
      <ChatPanel />
      
      {/* Onboarding Modal for new users */}
      <OnboardingModal />
      
      {/* Auth Modal for anonymous users */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </main>
  );
};

export const ProjectWorkspace = () => {
  return (
    <ChatProvider>
      <ProjectWorkspaceContent />
    </ChatProvider>
  );
};
