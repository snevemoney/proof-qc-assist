import { supabase } from '@/integrations/supabase/client';

export interface Source {
  id: string;
  title: string;
  authors: string;
  year: string;
  journal?: string;
  abstract?: string;
  content?: string;
}

export interface Claim {
  id: string;
  text: string;
  status: 'supported' | 'partial' | 'unsupported' | 'contradicted';
  sourceRef?: string;
  evidence?: string;
  suggestion?: string;
}

export interface VerificationSummary {
  totalClaims: number;
  supported: number;
  partial: number;
  unsupported: number;
  contradicted: number;
  overallFeedback?: string;
}

export interface VerificationResult {
  claims: Claim[];
  summary: VerificationSummary;
}

export async function verifyClaims(
  sources: Source[],
  draftText: string,
  strictMode: boolean,
  language: 'fr' | 'en'
): Promise<VerificationResult> {
  const { data, error } = await supabase.functions.invoke('verify-claims', {
    body: {
      sources: sources.map(s => ({
        id: s.id,
        title: s.title,
        authors: s.authors,
        year: s.year,
        content: s.content || s.abstract || '',
      })),
      draftText,
      strictMode,
      language,
    },
  });

  if (error) {
    // Try to extract a more specific error message
    const errorMessage = error.message || '';
    
    if (errorMessage.includes('402') || errorMessage.includes('Payment')) {
      throw new Error(language === 'fr' 
        ? 'Crédits IA insuffisants. Veuillez réessayer plus tard ou contacter le support.'
        : 'Insufficient AI credits. Please try again later or contact support.');
    }
    
    if (errorMessage.includes('429') || errorMessage.includes('Rate')) {
      throw new Error(language === 'fr'
        ? 'Limite de requêtes atteinte. Veuillez patienter quelques minutes.'
        : 'Rate limit exceeded. Please wait a few minutes.');
    }
    
    throw new Error(errorMessage || (language === 'fr' ? 'La vérification a échoué' : 'Verification failed'));
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data as VerificationResult;
}
