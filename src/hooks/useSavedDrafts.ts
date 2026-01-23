import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SavedDraft {
  id: string;
  name: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export const useSavedDrafts = () => {
  const { user } = useAuth();
  const [savedDrafts, setSavedDrafts] = useState<SavedDraft[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDrafts = useCallback(async () => {
    if (!user) {
      setSavedDrafts([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_drafts')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setSavedDrafts(
        (data || []).map((draft) => ({
          id: draft.id,
          name: draft.name,
          content: draft.content,
          createdAt: new Date(draft.created_at),
          updatedAt: new Date(draft.updated_at),
        }))
      );
    } catch (error) {
      console.error('Error fetching saved drafts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const saveDraft = useCallback(
    async (name: string, content: string) => {
      if (!user) return;

      const { error } = await supabase.from('saved_drafts').insert({
        user_id: user.id,
        name,
        content,
      });

      if (error) throw error;
      await fetchDrafts();
    },
    [user, fetchDrafts]
  );

  const deleteDraft = useCallback(
    async (id: string) => {
      if (!user) return;

      const { error } = await supabase
        .from('saved_drafts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchDrafts();
    },
    [user, fetchDrafts]
  );

  const renameDraft = useCallback(
    async (id: string, newName: string) => {
      if (!user) return;

      const { error } = await supabase
        .from('saved_drafts')
        .update({ name: newName })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchDrafts();
    },
    [user, fetchDrafts]
  );

  return {
    savedDrafts,
    isLoading,
    saveDraft,
    deleteDraft,
    renameDraft,
    refreshDrafts: fetchDrafts,
  };
};
