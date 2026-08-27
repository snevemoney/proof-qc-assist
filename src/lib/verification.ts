import { supabase } from '@/integrations/supabase/client';
import { VerificationError, classifyError } from './verificationErrors';
import { withRetry, DEFAULT_RETRY_CONFIG } from './retry';

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

export type InterventionSeverity = 'critical' | 'standard' | 'optional';

export interface Intervention {
  id: string;
  text: string;
  severity: InterventionSeverity;
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

export interface RequirementCheck {
  id: string;
  instruction: string;
  status: 'met' | 'partial' | 'not_met' | 'unable_to_verify';
  evidence?: string;
  suggestion?: string;
}

export interface RubricScore {
  criterionId: string;
  criterionName: string;
  estimatedScore: number;
  maxScore: number;
  feedback?: string;
  improvements?: string[];
}

export interface VerificationResult {
  claims: Claim[];
  interventions: Intervention[];
  summary: VerificationSummary;
  requirementChecks?: RequirementCheck[];
  rubricScores?: RubricScore[];
}

async function performVerification(
  sources: Source[],
  draftText: string,
  strictMode: boolean,
  language: 'fr' | 'en',
  instructions?: string,
  evaluationGrid?: any[]
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
    instructions,
    evaluationGrid,
  };

  console.log('verifyClaims: Request body:', JSON.stringify(requestBody, null, 2).substring(0, 500));

  const { data, error } = await supabase.functions.invoke('verify-claims', {
    body: requestBody,
  });

  console.log('verifyClaims: Response - data:', data, 'error:', error);

  if (error) {
    throw classifyError(error, language);
  }

  if (data?.error) {
    const serverError = new Error(data.error);
    throw classifyError(serverError, language);
  }

  if (!data || !Array.isArray(data.claims)) {
    throw new VerificationError(
      'parse_error',
      language === 'fr' 
        ? 'Réponse invalide du serveur' 
        : 'Invalid server response',
      true
    );
  }

  return data as VerificationResult;
}

export async function verifyClaims(
  sources: Source[],
  draftText: string,
  strictMode: boolean,
  language: 'fr' | 'en',
  onRetry?: (attempt: number, error: Error, delayMs: number) => void,
  instructions?: string,
  evaluationGrid?: any[]
): Promise<VerificationResult> {
  return withRetry(
    () => performVerification(sources, draftText, strictMode, language, instructions, evaluationGrid),
    DEFAULT_RETRY_CONFIG,
    onRetry
  );
}

// Re-export VerificationError for convenience
export { VerificationError } from './verificationErrors';
