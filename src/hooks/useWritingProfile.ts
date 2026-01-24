import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface WritingProfile {
  id: string;
  user_id: string;
  vocabulary_level: string | null;
  avg_sentence_length: number | null;
  avg_paragraph_length: number | null;
  uses_contractions: boolean | null;
  formality_level: string | null;
  preferred_voice: string | null;
  transition_phrases: string[] | null;
  opening_patterns: string[] | null;
  closing_patterns: string[] | null;
  primary_language: string | null;
  quebec_french_markers: boolean | null;
  samples_analyzed: number | null;
  confidence_score: number | null;
  created_at: string;
  updated_at: string;
}

export const useWritingProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<WritingProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const lastAnalysisRef = useRef<number>(0);

  // Fetch the user's writing profile
  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_writing_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching writing profile:', error);
        return;
      }

      if (data) {
        setProfile({
          ...data,
          transition_phrases: data.transition_phrases as string[] | null,
          opening_patterns: data.opening_patterns as string[] | null,
          closing_patterns: data.closing_patterns as string[] | null,
        });
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('Error fetching writing profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Analyze writing style from user's texts
  const analyzeStyle = useCallback(async (language: 'fr' | 'en'): Promise<boolean> => {
    if (!user) return false;
    
    // Prevent rapid re-analysis (within 30 seconds)
    const now = Date.now();
    if (now - lastAnalysisRef.current < 30000) {
      return false;
    }

    setIsAnalyzing(true);
    lastAnalysisRef.current = now;

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

  // Auto-analyze if no profile exists or confidence is low (silent, non-blocking)
  const autoAnalyzeIfNeeded = useCallback(async (language: 'fr' | 'en'): Promise<void> => {
    if (!user) return;
    if (isAnalyzing) return;
    
    // Skip if profile exists with good confidence (>= 30%)
    if (profile && (profile.confidence_score ?? 0) >= 0.3) return;
    
    // Trigger silent background analysis
    await analyzeStyle(language);
  }, [user, profile, isAnalyzing, analyzeStyle]);

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
    autoAnalyzeIfNeeded,
    deleteProfile,
    refreshProfile: fetchProfile,
  };
};
