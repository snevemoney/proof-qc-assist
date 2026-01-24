import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Source, Claim, Intervention, VerificationSummary, RequirementCheck, RubricScore } from '@/lib/verification';
import type { Json } from '@/integrations/supabase/types';
import { EvaluationCriterion } from '@/lib/evaluationTemplates';

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
  interventions: Intervention[];
  summary: VerificationSummary | null;
  requirementChecks: RequirementCheck[];
  rubricScores: RubricScore[];
  chatMessages: ChatMessage[];
  activeTab: string;
  strictMode: boolean;
  hasVerified: boolean;
  instructions: string;
  evaluationGrid: EvaluationCriterion[];
  verificationLanguage: 'fr' | 'en' | null;
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
  interventions: [],
  summary: null,
  requirementChecks: [],
  rubricScores: [],
  chatMessages: [],
  activeTab: 'sources',
  strictMode: false,
  hasVerified: false,
  instructions: '',
  evaluationGrid: [],
  verificationLanguage: null,
};

const STORAGE_KEY = 'proofcheck-project';
const SAVE_DEBOUNCE_MS = 2000;

export const useProject = (projectId: string | null = null) => {
  const { user, isLoading: authLoading } = useAuth();
  const [state, setState] = useState<ProjectState>(DEFAULT_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);
  const currentProjectIdRef = useRef<string | null>(projectId);

  // Track project changes and reset state when project changes
  useEffect(() => {
    if (currentProjectIdRef.current !== projectId) {
      currentProjectIdRef.current = projectId;
      // Reset to default state when project changes (will be loaded fresh)
      setState(DEFAULT_STATE);
      setIsLoading(true);
      isInitialLoadRef.current = true;
    }
  }, [projectId]);

  // Load project on mount or auth/project change
  useEffect(() => {
    if (authLoading) return;

    const loadProject = async () => {
      setIsLoading(true);
      isInitialLoadRef.current = true;

      if (user) {
        // Load from database
        let query = supabase.from('projects').select('*');
        
        if (projectId) {
          // Load specific project by ID
          query = query.eq('id', projectId).eq('user_id', user.id);
        } else {
          // Fallback: load user's default project (first one)
          query = query.eq('user_id', user.id);
        }
        
        const { data, error } = await query.maybeSingle();

        if (error) {
          console.error('Error loading project:', error);
        }

        if (data) {
          setState({
            sources: (data.sources as unknown as Source[]) || [],
            draftText: data.draft_text || '',
            claims: (data.claims as unknown as Claim[]) || [],
            interventions: ((data as any).interventions as unknown as Intervention[]) || [],
            summary: data.summary as unknown as VerificationSummary | null,
            requirementChecks: ((data as any).requirement_checks as unknown as RequirementCheck[]) || [],
            rubricScores: ((data as any).rubric_scores as unknown as RubricScore[]) || [],
            chatMessages: ((data.chat_messages as unknown as ChatMessage[]) || []).map((msg) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })),
            activeTab: data.active_tab || 'sources',
            strictMode: data.strict_mode || false,
            hasVerified: data.has_verified || false,
            instructions: (data as any).instructions || '',
            evaluationGrid: ((data as any).evaluation_grid as unknown as EvaluationCriterion[]) || [],
            verificationLanguage: ((data as any).verification_language as 'fr' | 'en') || null,
          });
        } else {
          // New project - start with default state (empty for new projects)
          setState({
            ...DEFAULT_STATE,
            sources: [], // Don't include demo sources for new projects
            verificationLanguage: null,
          });
        }
      } else {
        // Load from localStorage for anonymous users (use projectId-specific key if provided)
        const storageKey = projectId ? `${STORAGE_KEY}-${projectId}` : STORAGE_KEY;
        const stored = localStorage.getItem(storageKey);
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
          setState({
            ...DEFAULT_STATE,
            sources: [], // Don't include demo sources for new projects
            verificationLanguage: null,
          });
        }
      }

      setIsLoading(false);
      // Allow saves after a short delay
      setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 500);
    };

    loadProject();
  }, [user, authLoading, projectId]);

  // Core save logic (extracted for reuse)
  const performSave = useCallback(
    async (newState: ProjectState) => {
      setIsSaving(true);

      try {
        if (user) {
          const chatMessagesJson = newState.chatMessages.map((msg) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp.toISOString(),
            isStreaming: msg.isStreaming,
          })) as unknown as Json;

          const projectData = {
            sources: newState.sources as unknown as Json,
            draft_text: newState.draftText,
            claims: newState.claims as unknown as Json,
            interventions: newState.interventions as unknown as Json,
            summary: newState.summary as unknown as Json,
            requirement_checks: newState.requirementChecks as unknown as Json,
            rubric_scores: newState.rubricScores as unknown as Json,
            chat_messages: chatMessagesJson,
            active_tab: newState.activeTab,
            strict_mode: newState.strictMode,
            has_verified: newState.hasVerified,
            instructions: newState.instructions,
            evaluation_grid: newState.evaluationGrid as unknown as Json,
            verification_language: newState.verificationLanguage,
            updated_at: new Date().toISOString(),
          };

          let error;
          if (projectId) {
            // Update specific project by ID
            ({ error } = await supabase
              .from('projects')
              .update(projectData)
              .eq('id', projectId)
              .eq('user_id', user.id));
          } else {
            // Fallback: check if user has a project and update/insert
            const { data: existing } = await supabase
              .from('projects')
              .select('id')
              .eq('user_id', user.id)
              .maybeSingle();

            if (existing) {
              ({ error } = await supabase
                .from('projects')
                .update({ ...projectData, user_id: user.id })
                .eq('user_id', user.id));
            } else {
              ({ error } = await supabase
                .from('projects')
                .insert({ ...projectData, user_id: user.id }));
            }
          }

          if (error) {
            console.error('Error saving project:', error);
          } else {
            console.log('Project saved successfully');
          }
        } else {
          // Save to localStorage for anonymous users (use projectId-specific key if provided)
          const storageKey = projectId ? `${STORAGE_KEY}-${projectId}` : STORAGE_KEY;
          localStorage.setItem(storageKey, JSON.stringify({
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
    [user, projectId]
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

  const setInterventions = useCallback(
    (interventions: Intervention[]) => {
      setState((prev) => {
        const newState = { ...prev, interventions };
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

  const setInstructions = useCallback(
    (instructions: string) => {
      setState((prev) => {
        const newState = { ...prev, instructions };
        saveProject(newState);
        return newState;
      });
    },
    [saveProject]
  );

  const setEvaluationGrid = useCallback(
    (evaluationGrid: EvaluationCriterion[]) => {
      setState((prev) => {
        const newState = { ...prev, evaluationGrid };
        saveProject(newState);
        return newState;
      });
    },
    [saveProject]
  );

  const setVerificationLanguage = useCallback(
    (verificationLanguage: 'fr' | 'en' | null) => {
      setState((prev) => {
        const newState = { ...prev, verificationLanguage };
        saveProject(newState);
        return newState;
      });
    },
    [saveProject]
  );

  const setRequirementChecks = useCallback(
    (requirementChecks: RequirementCheck[]) => {
      setState((prev) => {
        const newState = { ...prev, requirementChecks };
        saveProject(newState);
        return newState;
      });
    },
    [saveProject]
  );

  const setRubricScores = useCallback(
    (rubricScores: RubricScore[]) => {
      setState((prev) => {
        const newState = { ...prev, rubricScores };
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
    setInterventions,
    setSummary,
    setRequirementChecks,
    setRubricScores,
    setChatMessages,
    setActiveTab,
    setStrictMode,
    setHasVerified,
    setInstructions,
    setEvaluationGrid,
    setVerificationLanguage,
    updateState,
    updateStateImmediate,
  };
};
