import { supabase } from '@/integrations/supabase/client';
import { VerificationError, classifyError } from './verificationErrors';

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

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  baseDelayMs: 2000,
  maxDelayMs: 8000,
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  onRetry?: (attempt: number, error: Error, delayMs: number) => void
): Promise<T> {
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry non-retryable errors
      if (error instanceof VerificationError && !error.isRetryable) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt >= config.maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelayMs * Math.pow(2, attempt),
        config.maxDelayMs
      );

      // Check if error has a specific retry-after value
      const retryAfter = (error as VerificationError)?.retryAfterMs;
      const actualDelay = retryAfter || delay;

      onRetry?.(attempt + 1, lastError, actualDelay);
      await sleep(actualDelay);
    }
  }

  throw lastError;
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
