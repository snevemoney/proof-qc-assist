import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Claim, Intervention, VerificationSummary, Source, RequirementCheck, RubricScore } from '@/lib/verification';
import type { Json } from '@/integrations/supabase/types';

export interface VerificationHistoryEntry {
  id: string;
  claims: Claim[];
  interventions: Intervention[];
  summary: VerificationSummary | null;
  requirementChecks: RequirementCheck[];
  rubricScores: RubricScore[];
  draftText: string;
  sourcesSnapshot: Source[];
  strictMode: boolean;
  createdAt: Date;
}

const LOCAL_HISTORY_KEY = 'proofcheck-verification-history';

export const useVerificationHistory = (projectId: string | null = null) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<VerificationHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getLocalStorageKey = useCallback(() => {
    return projectId ? `${LOCAL_HISTORY_KEY}-${projectId}` : LOCAL_HISTORY_KEY;
  }, [projectId]);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      if (user) {
        // Authenticated users: load from Supabase
        const { data, error } = await supabase
          .from('verification_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) {
          console.error('Error fetching verification history:', error);
          return;
        }

        const entries: VerificationHistoryEntry[] = (data || []).map((row) => ({
          id: row.id,
          claims: (row.claims as unknown as Claim[]) || [],
          interventions: ((row as any).interventions as unknown as Intervention[]) || [],
          summary: row.summary as unknown as VerificationSummary | null,
          requirementChecks: ((row as any).requirement_checks as unknown as RequirementCheck[]) || [],
          rubricScores: ((row as any).rubric_scores as unknown as RubricScore[]) || [],
          draftText: row.draft_text || '',
          sourcesSnapshot: (row.sources_snapshot as unknown as Source[]) || [],
          strictMode: row.strict_mode || false,
          createdAt: new Date(row.created_at || Date.now()),
        }));

        setHistory(entries);
      } else {
        // Anonymous users: load from localStorage
        const stored = localStorage.getItem(getLocalStorageKey());
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            const entries: VerificationHistoryEntry[] = (parsed || []).map((entry: any) => ({
              ...entry,
              createdAt: new Date(entry.createdAt),
            }));
            setHistory(entries);
          } catch (e) {
            console.error('Error parsing verification history from localStorage:', e);
            setHistory([]);
          }
        } else {
          setHistory([]);
        }
      }
    } catch (err) {
      console.error('Error in fetchHistory:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, getLocalStorageKey]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const saveLocalHistory = useCallback((entries: VerificationHistoryEntry[]) => {
    const serializable = entries.map((entry) => ({
      ...entry,
      createdAt: entry.createdAt.toISOString(),
    }));
    localStorage.setItem(getLocalStorageKey(), JSON.stringify(serializable));
  }, [getLocalStorageKey]);

  const saveToHistory = useCallback(
    async (entry: Omit<VerificationHistoryEntry, 'id' | 'createdAt'>) => {
      try {
        if (user) {
          // Authenticated users: save to Supabase
          // Get current project ID
          const { data: projectData } = await supabase
            .from('projects')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

          const { data, error } = await supabase
            .from('verification_history')
            .insert({
              user_id: user.id,
              project_id: projectData?.id || null,
              claims: entry.claims as unknown as Json,
              interventions: entry.interventions as unknown as Json,
              summary: entry.summary as unknown as Json,
              requirement_checks: entry.requirementChecks as unknown as Json,
              rubric_scores: entry.rubricScores as unknown as Json,
              draft_text: entry.draftText,
              sources_snapshot: entry.sourcesSnapshot as unknown as Json,
              strict_mode: entry.strictMode,
            } as any)
            .select()
            .single();

          if (error) {
            console.error('Error saving to history:', error);
            return null;
          }

          // Refresh history list
          await fetchHistory();

          return data.id;
        } else {
          // Anonymous users: save to localStorage
          const newEntry: VerificationHistoryEntry = {
            id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ...entry,
            createdAt: new Date(),
          };

          const updatedHistory = [newEntry, ...history].slice(0, 50); // Keep max 50 entries
          setHistory(updatedHistory);
          saveLocalHistory(updatedHistory);

          return newEntry.id;
        }
      } catch (err) {
        console.error('Error in saveToHistory:', err);
        return null;
      }
    },
    [user, fetchHistory, history, saveLocalHistory]
  );

  const deleteFromHistory = useCallback(
    async (id: string) => {
      try {
        if (user) {
          // Authenticated users: delete from Supabase
          const { error } = await supabase
            .from('verification_history')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

          if (error) {
            console.error('Error deleting from history:', error);
            return false;
          }

          await fetchHistory();
          return true;
        } else {
          // Anonymous users: delete from localStorage
          const updatedHistory = history.filter((entry) => entry.id !== id);
          setHistory(updatedHistory);
          saveLocalHistory(updatedHistory);
          return true;
        }
      } catch (err) {
        console.error('Error in deleteFromHistory:', err);
        return false;
      }
    },
    [user, fetchHistory, history, saveLocalHistory]
  );

  return {
    history,
    isLoading,
    saveToHistory,
    deleteFromHistory,
    refreshHistory: fetchHistory,
  };
};
