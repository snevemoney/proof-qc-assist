import { supabase } from '@/integrations/supabase/client';

export interface Source {
  id: string;
  title: string;
  authors: string;
  year: string;
  journal?: string;
  abstract?: string;
  content?: string;
  studyType?: string;
  studyTypeFr?: string;
  verificationStatus?: 'verified' | 'partial';
  verificationLinks?: {
    doi?: string;
    pubmed?: string;
    publisher?: string;
    googleScholar?: string;
  };
  citationAPA?: string;
  keyFindings?: string[];
  url?: string;
  relevanceExplanation?: string;
}

export interface Claim {
  id: string;
  text: string;
  status: 'supported' | 'partial' | 'unsupported' | 'contradicted';
  sourceRef?: string;
  evidence?: string;
  suggestion?: string;
}

export interface Intervention {
  id: string;
  text: string;
  hasEvidence: boolean;
  hasRationale: boolean;
  sourceRef?: string;
  rationaleText?: string;
  suggestion?: string;
}

export interface VerificationSummary {
  totalClaims: number;
  supported: number;
  partial: number;
  unsupported: number;
  contradicted: number;
  overallFeedback?: string;
  // Intervention tracking
  totalInterventions: number;
  interventionsWithEvidence: number;
  interventionsWithRationale: number;
}

export interface VerificationResult {
  claims: Claim[];
  interventions: Intervention[];
  summary: VerificationSummary;
}

export async function verifyClaims(
  sources: Source[],
  draftText: string,
  strictMode: boolean,
  language: 'fr' | 'en'
): Promise<VerificationResult> {
  console.log('verifyClaims: Starting with', sources.length, 'sources, draftText length:', draftText.length);
  
  const requestBody = {
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
  };
  
  console.log('verifyClaims: Request body:', JSON.stringify(requestBody, null, 2).substring(0, 500));
  
  const { data, error } = await supabase.functions.invoke('verify-claims', {
    body: requestBody,
  });
  
  console.log('verifyClaims: Response - data:', data, 'error:', error);

  if (error) {
    // Try to extract a more specific error message from FunctionsHttpError.context
    // supabase-js often wraps non-2xx responses with a generic message.
    const anyErr = error as unknown as {
      message?: string;
      context?: { status?: number; body?: string | unknown };
    };

    let status = anyErr.context?.status;
    let errorMessage = anyErr.message || '';

    const body = anyErr.context?.body;
    if (typeof body === 'string' && body.trim()) {
      try {
        const parsed = JSON.parse(body);
        if (typeof parsed?.error === 'string' && parsed.error.trim()) {
          errorMessage = parsed.error;
        }
      } catch {
        // keep generic message
      }
    } else if (body && typeof body === 'object') {
      const maybe = body as any;
      if (typeof maybe?.error === 'string' && maybe.error.trim()) {
        errorMessage = maybe.error;
      }
    }
    
    if (status === 402 || errorMessage.includes('402') || errorMessage.includes('Payment')) {
      throw new Error(language === 'fr' 
        ? 'Crédits IA insuffisants. Veuillez réessayer plus tard ou contacter le support.'
        : 'Insufficient AI credits. Please try again later or contact support.');
    }
    
    if (status === 429 || errorMessage.includes('429') || errorMessage.includes('Rate')) {
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
