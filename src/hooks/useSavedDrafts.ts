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

const LOCAL_DRAFTS_KEY = 'proofcheck-saved-drafts';

export const useSavedDrafts = () => {
  const { user } = useAuth();
  const [savedDrafts, setSavedDrafts] = useState<SavedDraft[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDrafts = useCallback(async () => {
    setIsLoading(true);
    try {
      if (user) {
        // Authenticated users: load from Supabase
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
      } else {
        // Anonymous users: load from localStorage
        const stored = localStorage.getItem(LOCAL_DRAFTS_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setSavedDrafts(
              (parsed || []).map((draft: any) => ({
                ...draft,
                createdAt: new Date(draft.createdAt),
                updatedAt: new Date(draft.updatedAt),
              }))
            );
          } catch (e) {
            console.error('Error parsing saved drafts from localStorage:', e);
            setSavedDrafts([]);
          }
        } else {
          setSavedDrafts([]);
        }
      }
    } catch (error) {
      console.error('Error fetching saved drafts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const saveLocalDrafts = useCallback((drafts: SavedDraft[]) => {
    const serializable = drafts.map((draft) => ({
      ...draft,
      createdAt: draft.createdAt.toISOString(),
      updatedAt: draft.updatedAt.toISOString(),
    }));
    localStorage.setItem(LOCAL_DRAFTS_KEY, JSON.stringify(serializable));
  }, []);

  const saveDraft = useCallback(
    async (name: string, content: string) => {
      try {
        if (user) {
          // Authenticated users: save to Supabase
          const { error } = await supabase.from('saved_drafts').insert({
            user_id: user.id,
            name,
            content,
          });

          if (error) throw error;
          await fetchDrafts();
        } else {
          // Anonymous users: save to localStorage
          const now = new Date();
          const newDraft: SavedDraft = {
            id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name,
            content,
            createdAt: now,
            updatedAt: now,
          };

          const updatedDrafts = [newDraft, ...savedDrafts];
          setSavedDrafts(updatedDrafts);
          saveLocalDrafts(updatedDrafts);
        }
      } catch (error) {
        console.error('Error saving draft:', error);
        throw error;
      }
    },
    [user, fetchDrafts, savedDrafts, saveLocalDrafts]
  );

  const deleteDraft = useCallback(
    async (id: string) => {
      try {
        if (user) {
          // Authenticated users: delete from Supabase
          const { error } = await supabase
            .from('saved_drafts')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

          if (error) throw error;
          await fetchDrafts();
        } else {
          // Anonymous users: delete from localStorage
          const updatedDrafts = savedDrafts.filter((draft) => draft.id !== id);
          setSavedDrafts(updatedDrafts);
          saveLocalDrafts(updatedDrafts);
        }
      } catch (error) {
        console.error('Error deleting draft:', error);
        throw error;
      }
    },
    [user, fetchDrafts, savedDrafts, saveLocalDrafts]
  );

  const renameDraft = useCallback(
    async (id: string, newName: string) => {
      try {
        if (user) {
          // Authenticated users: update in Supabase
          const { error } = await supabase
            .from('saved_drafts')
            .update({ name: newName })
            .eq('id', id)
            .eq('user_id', user.id);

          if (error) throw error;
          await fetchDrafts();
        } else {
          // Anonymous users: update in localStorage
          const updatedDrafts = savedDrafts.map((draft) =>
            draft.id === id
              ? { ...draft, name: newName, updatedAt: new Date() }
              : draft
          );
          setSavedDrafts(updatedDrafts);
          saveLocalDrafts(updatedDrafts);
        }
      } catch (error) {
        console.error('Error renaming draft:', error);
        throw error;
      }
    },
    [user, fetchDrafts, savedDrafts, saveLocalDrafts]
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
