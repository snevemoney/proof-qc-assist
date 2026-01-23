import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Claim, VerificationSummary, Source } from '@/lib/verification';
import type { Json } from '@/integrations/supabase/types';

export interface VerificationHistoryEntry {
  id: string;
  claims: Claim[];
  summary: VerificationSummary | null;
  draftText: string;
  sourcesSnapshot: Source[];
  strictMode: boolean;
  createdAt: Date;
}

export const useVerificationHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<VerificationHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!user) {
      setHistory([]);
      return;
    }

    setIsLoading(true);
    try {
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
        summary: row.summary as unknown as VerificationSummary | null,
        draftText: row.draft_text || '',
        sourcesSnapshot: (row.sources_snapshot as unknown as Source[]) || [],
        strictMode: row.strict_mode || false,
        createdAt: new Date(row.created_at || Date.now()),
      }));

      setHistory(entries);
    } catch (err) {
      console.error('Error in fetchHistory:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const saveToHistory = useCallback(
    async (entry: Omit<VerificationHistoryEntry, 'id' | 'createdAt'>) => {
      if (!user) return null;

      try {
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
            summary: entry.summary as unknown as Json,
            draft_text: entry.draftText,
            sources_snapshot: entry.sourcesSnapshot as unknown as Json,
            strict_mode: entry.strictMode,
          })
          .select()
          .single();

        if (error) {
          console.error('Error saving to history:', error);
          return null;
        }

        // Refresh history list
        await fetchHistory();

        return data.id;
      } catch (err) {
        console.error('Error in saveToHistory:', err);
        return null;
      }
    },
    [user, fetchHistory]
  );

  const deleteFromHistory = useCallback(
    async (id: string) => {
      if (!user) return false;

      try {
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
      } catch (err) {
        console.error('Error in deleteFromHistory:', err);
        return false;
      }
    },
    [user, fetchHistory]
  );

  return {
    history,
    isLoading,
    saveToHistory,
    deleteFromHistory,
    refreshHistory: fetchHistory,
  };
};
