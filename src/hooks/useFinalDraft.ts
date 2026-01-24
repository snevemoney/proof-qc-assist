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
  feedback?: string;
  previousVersion?: string;
}

export interface DraftVersion {
  text: string;
  feedback?: string;
  timestamp: Date;
}

export const useFinalDraft = () => {
  const { user } = useAuth();
  const [finalDraft, setFinalDraft] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [versions, setVersions] = useState<DraftVersion[]>([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(-1);

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
            feedback: params.feedback,
            previousVersion: params.previousVersion,
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
      let textBuffer = ''; // Buffer for incomplete lines

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        // Process line-by-line as data arrives
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          // Handle CRLF
          if (line.endsWith('\r')) line = line.slice(0, -1);
          
          // Skip SSE comments and empty lines
          if (line.startsWith(':') || line.trim() === '') continue;
          
          // Only process data lines
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setFinalDraft(fullText);
            }
          } catch {
            // Incomplete JSON split across chunks - put it back and wait for more data
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final flush for any remaining buffered data
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setFinalDraft(fullText);
            }
          } catch {
            // Ignore incomplete data at the end
          }
        }
      }

      // Save to version history
      setVersions(prev => [...prev, { 
        text: fullText, 
        feedback: params.feedback,
        timestamp: new Date() 
      }]);
      setCurrentVersionIndex(prev => prev + 1);

      return true;
    } catch (err) {
      console.error('Error generating final draft:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setIsGenerating(false);
    }
  }, [user]);

  const regenerateWithFeedback = useCallback(async (
    feedback: string,
    params: Omit<GenerateFinalDraftParams, 'feedback' | 'previousVersion'>
  ): Promise<boolean> => {
    if (!finalDraft) return false;
    
    return generateFinalDraft({
      ...params,
      feedback,
      previousVersion: finalDraft,
    });
  }, [finalDraft, generateFinalDraft]);

  const goToPreviousVersion = useCallback(() => {
    if (currentVersionIndex > 0 && versions.length > 0) {
      const prevIndex = currentVersionIndex - 1;
      if (versions[prevIndex]?.text) {
        setCurrentVersionIndex(prevIndex);
        setFinalDraft(versions[prevIndex].text);
      }
    }
  }, [currentVersionIndex, versions]);

  const goToNextVersion = useCallback(() => {
    if (currentVersionIndex < versions.length - 1 && versions.length > 0) {
      const nextIndex = currentVersionIndex + 1;
      if (versions[nextIndex]?.text) {
        setCurrentVersionIndex(nextIndex);
        setFinalDraft(versions[nextIndex].text);
      }
    }
  }, [currentVersionIndex, versions]);

  const clearFinalDraft = useCallback(() => {
    setFinalDraft('');
    setError(null);
    setVersions([]);
    setCurrentVersionIndex(-1);
  }, []);

  return {
    finalDraft,
    setFinalDraft,
    isGenerating,
    error,
    generateFinalDraft,
    regenerateWithFeedback,
    clearFinalDraft,
    versions,
    currentVersionIndex,
    goToPreviousVersion,
    goToNextVersion,
  };
};
