import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface WritingProfile {
  id: string;
  user_id: string;
  vocabulary_level: string;
  avg_sentence_length: number;
  avg_paragraph_length: number;
  uses_contractions: boolean;
  formality_level: string;
  preferred_voice: string;
  transition_phrases: string[];
  opening_patterns: string[];
  closing_patterns: string[];
  primary_language: string;
  quebec_french_markers: boolean;
  samples_analyzed: number;
  confidence_score: number;
  created_at: string;
  updated_at: string;
}

export const useWritingProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<WritingProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch the user's writing profile
  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_writing_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching writing profile:', error);
      }

      setProfile(data as WritingProfile | null);
    } catch (error) {
      console.error('Error fetching writing profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Analyze writing style from user's texts
  const analyzeStyle = useCallback(async (language: 'fr' | 'en'): Promise<boolean> => {
    if (!user) return false;

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-writing-style', {
        body: { language },
      });

      if (error) {
        console.error('Error analyzing writing style:', error);
        return false;
      }

      if (data?.error) {
        console.error('Analysis error:', data.error);
        return false;
      }

      // Refetch the profile
      await fetchProfile();
      return true;
    } catch (error) {
      console.error('Error analyzing writing style:', error);
      return false;
    } finally {
      setIsAnalyzing(false);
    }
  }, [user, fetchProfile]);

  // Delete the writing profile
  const deleteProfile = useCallback(async (): Promise<boolean> => {
    if (!user || !profile) return false;

    try {
      const { error } = await supabase
        .from('user_writing_profiles')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting writing profile:', error);
        return false;
      }

      setProfile(null);
      return true;
    } catch (error) {
      console.error('Error deleting writing profile:', error);
      return false;
    }
  }, [user, profile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    isLoading,
    isAnalyzing,
    analyzeStyle,
    deleteProfile,
    refreshProfile: fetchProfile,
  };
};
