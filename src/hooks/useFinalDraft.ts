import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Source, Claim, Intervention } from '@/lib/verification';

export interface GenerateFinalDraftParams {
  draftText: string;
  claims: Claim[];
  interventions: Intervention[];
  sources: Source[];
  language: 'fr' | 'en';
}

export const useFinalDraft = () => {
  const { user } = useAuth();
  const [finalDraft, setFinalDraft] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateFinalDraft = useCallback(async (params: GenerateFinalDraftParams): Promise<boolean> => {
    if (!user) {
      setError('Authentication required');
      return false;
    }

    setIsGenerating(true);
    setError(null);
    setFinalDraft('');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        setError('Authentication required');
        return false;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-final-draft`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            draftText: params.draftText,
            claims: params.claims.map(c => ({
              id: c.id,
              text: c.text,
              status: c.status,
              suggestion: c.suggestion,
              sourceRef: c.sourceRef,
            })),
            interventions: params.interventions.map(i => ({
              id: i.id,
              text: i.text,
              severity: i.severity,
              hasEvidence: i.hasEvidence,
              hasRationale: i.hasRationale,
              suggestion: i.suggestion,
            })),
            sources: params.sources.map(s => ({
              id: s.id,
              title: s.title,
              authors: s.authors,
              year: s.year,
            })),
            language: params.language,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Failed to generate final draft');
        return false;
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        setError('Failed to read response');
        return false;
      }

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        
        // Parse SSE events
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullText += content;
                setFinalDraft(fullText);
              }
            } catch {
              // Not JSON, might be raw content
              fullText += data;
              setFinalDraft(fullText);
            }
          }
        }
      }

      return true;
    } catch (err) {
      console.error('Error generating final draft:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setIsGenerating(false);
    }
  }, [user]);

  const clearFinalDraft = useCallback(() => {
    setFinalDraft('');
    setError(null);
  }, []);

  return {
    finalDraft,
    setFinalDraft,
    isGenerating,
    error,
    generateFinalDraft,
    clearFinalDraft,
  };
};
