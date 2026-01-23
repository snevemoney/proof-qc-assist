import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Source, Claim, VerificationSummary } from '@/lib/verification';
import type { Json } from '@/integrations/supabase/types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface ProjectState {
  sources: Source[];
  draftText: string;
  claims: Claim[];
  summary: VerificationSummary | null;
  chatMessages: ChatMessage[];
  activeTab: string;
  strictMode: boolean;
  hasVerified: boolean;
}

const DEMO_SOURCES: Source[] = [
  {
    id: '1',
    title: 'The Impact of Climate Change on Arctic Ecosystems',
    authors: 'Smith, J., Johnson, M.',
    year: '2023',
    journal: 'Nature Climate Change',
    abstract: 'This study examines the rapid changes occurring in Arctic ecosystems due to rising temperatures...',
    content: 'Arctic temperatures have increased by approximately 2.5 degrees Celsius since 2013, leading to significant ecosystem disruption. Permafrost thaw has accelerated, releasing methane and carbon dioxide. Wildlife migration patterns have shifted northward by an average of 100km per decade. Sea ice extent has decreased by 13% per decade since satellite measurements began in 1979.',
  },
  {
    id: '2',
    title: 'Biodiversity Loss in Northern Regions: A Meta-Analysis',
    authors: 'Tremblay, P., Roy, S.',
    year: '2022',
    journal: 'Environmental Science & Technology',
    abstract: 'Our meta-analysis of 47 studies reveals significant biodiversity decline in northern latitudes...',
    content: 'Population studies show varying decline rates between 25-45% depending on region for polar bear populations since 2000. Northern ecosystems show lower resilience due to slower regeneration rates compared to temperate and tropical regions. Species adapted to cold climates are experiencing range contractions of up to 50% in some areas. The meta-analysis found that biodiversity loss in the Arctic is occurring at twice the global average rate.',
  },
];

const DEFAULT_STATE: ProjectState = {
  sources: DEMO_SOURCES,
  draftText: '',
  claims: [],
  summary: null,
  chatMessages: [],
  activeTab: 'sources',
  strictMode: false,
  hasVerified: false,
};

const STORAGE_KEY = 'proofcheck-project';
const SAVE_DEBOUNCE_MS = 2000;

export const useProject = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [state, setState] = useState<ProjectState>(DEFAULT_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);

  // Load project on mount or auth change
  useEffect(() => {
    if (authLoading) return;

    const loadProject = async () => {
      setIsLoading(true);
      isInitialLoadRef.current = true;

      if (user) {
        // Load from database
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error loading project:', error);
        }

        if (data) {
          setState({
            sources: (data.sources as unknown as Source[]) || [],
            draftText: data.draft_text || '',
            claims: (data.claims as unknown as Claim[]) || [],
            summary: data.summary as unknown as VerificationSummary | null,
            chatMessages: ((data.chat_messages as unknown as ChatMessage[]) || []).map((msg) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })),
            activeTab: data.active_tab || 'sources',
            strictMode: data.strict_mode || false,
            hasVerified: data.has_verified || false,
          });
        } else {
          // New user - create project with demo data
          setState(DEFAULT_STATE);
        }
      } else {
        // Load from localStorage for anonymous users
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setState({
              ...parsed,
              chatMessages: (parsed.chatMessages || []).map((msg: ChatMessage) => ({
                ...msg,
                timestamp: new Date(msg.timestamp),
              })),
            });
          } catch (e) {
            console.error('Error parsing stored project:', e);
            setState(DEFAULT_STATE);
          }
        } else {
          setState(DEFAULT_STATE);
        }
      }

      setIsLoading(false);
      // Allow saves after a short delay
      setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 500);
    };

    loadProject();
  }, [user, authLoading]);

  // Core save logic (extracted for reuse)
  const performSave = useCallback(
    async (newState: ProjectState) => {
      setIsSaving(true);

      try {
        if (user) {
          // Save to database - check if project exists first
          const { data: existing } = await supabase
            .from('projects')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

          const chatMessagesJson = newState.chatMessages.map((msg) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp.toISOString(),
            isStreaming: msg.isStreaming,
          })) as unknown as Json;

          const projectData = {
            user_id: user.id,
            sources: newState.sources as unknown as Json,
            draft_text: newState.draftText,
            claims: newState.claims as unknown as Json,
            summary: newState.summary as unknown as Json,
            chat_messages: chatMessagesJson,
            active_tab: newState.activeTab,
            strict_mode: newState.strictMode,
            has_verified: newState.hasVerified,
            updated_at: new Date().toISOString(),
          };

          let error;
          if (existing) {
            ({ error } = await supabase
              .from('projects')
              .update(projectData)
              .eq('user_id', user.id));
          } else {
            ({ error } = await supabase
              .from('projects')
              .insert(projectData));
          }

          if (error) {
            console.error('Error saving project:', error);
          } else {
            console.log('Project saved successfully');
          }
        } else {
          // Save to localStorage for anonymous users
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            ...newState,
            chatMessages: newState.chatMessages.map((msg) => ({
              ...msg,
              timestamp: msg.timestamp.toISOString(),
            })),
          }));
          console.log('Project saved to localStorage');
        }
      } catch (err) {
        console.error('Error in performSave:', err);
      } finally {
        setIsSaving(false);
      }
    },
    [user]
  );

  // Debounced save
  const saveProject = useCallback(
    async (newState: ProjectState) => {
      if (isInitialLoadRef.current) return;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        performSave(newState);
      }, SAVE_DEBOUNCE_MS);
    },
    [performSave]
  );

  // Immediate save (bypasses debounce) - for critical operations like verification
  const saveNow = useCallback(
    async (newState: ProjectState) => {
      if (isInitialLoadRef.current) return;

      // Cancel any pending debounced save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }

      await performSave(newState);
    },
    [performSave]
  );

  // Update state and trigger save
  const updateState = useCallback(
    (updates: Partial<ProjectState>) => {
      setState((prev) => {
        const newState = { ...prev, ...updates };
        saveProject(newState);
        return newState;
      });
    },
    [saveProject]
  );

  // Individual setters for convenience
  const setSources = useCallback(
    (sources: Source[] | ((prev: Source[]) => Source[])) => {
      setState((prev) => {
        const newSources = typeof sources === 'function' ? sources(prev.sources) : sources;
        const newState = { ...prev, sources: newSources };
        saveProject(newState);
        return newState;
      });
    },
    [saveProject]
  );

  const setDraftText = useCallback(
    (draftText: string) => {
      setState((prev) => {
        const newState = { ...prev, draftText };
        saveProject(newState);
        return newState;
      });
    },
    [saveProject]
  );

  const setClaims = useCallback(
    (claims: Claim[]) => {
      setState((prev) => {
        const newState = { ...prev, claims };
        saveProject(newState);
        return newState;
      });
    },
    [saveProject]
  );

  const setSummary = useCallback(
    (summary: VerificationSummary | null) => {
      setState((prev) => {
        const newState = { ...prev, summary };
        saveProject(newState);
        return newState;
      });
    },
    [saveProject]
  );

  const setChatMessages = useCallback(
    (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
      setState((prev) => {
        const newMessages = typeof messages === 'function' ? messages(prev.chatMessages) : messages;
        const newState = { ...prev, chatMessages: newMessages };
        saveProject(newState);
        return newState;
      });
    },
    [saveProject]
  );

  const setActiveTab = useCallback(
    (activeTab: string) => {
      setState((prev) => {
        const newState = { ...prev, activeTab };
        saveProject(newState);
        return newState;
      });
    },
    [saveProject]
  );

  const setStrictMode = useCallback(
    (strictMode: boolean) => {
      setState((prev) => {
        const newState = { ...prev, strictMode };
        saveProject(newState);
        return newState;
      });
    },
    [saveProject]
  );

  const setHasVerified = useCallback(
    (hasVerified: boolean) => {
      setState((prev) => {
        const newState = { ...prev, hasVerified };
        saveProject(newState);
        return newState;
      });
    },
    [saveProject]
  );

  // Batch update with immediate save (for verification results)
  const updateStateImmediate = useCallback(
    async (updates: Partial<ProjectState>) => {
      let newState: ProjectState;
      setState((prev) => {
        newState = { ...prev, ...updates };
        return newState;
      });
      // Wait for state to be set, then save immediately
      await saveNow({ ...state, ...updates });
    },
    [saveNow, state]
  );

  return {
    ...state,
    isLoading: isLoading || authLoading,
    isSaving,
    setSources,
    setDraftText,
    setClaims,
    setSummary,
    setChatMessages,
    setActiveTab,
    setStrictMode,
    setHasVerified,
    updateState,
    updateStateImmediate,
  };
};
