export type VerificationErrorType =
  | 'network'
  | 'timeout'
  | 'rate_limit'
  | 'payment'
  | 'invalid_input'
  | 'ai_error'
  | 'parse_error'
  | 'unknown';

export class VerificationError extends Error {
  type: VerificationErrorType;
  isRetryable: boolean;
  retryAfterMs?: number;

  constructor(
    type: VerificationErrorType,
    message: string,
    isRetryable = false,
    retryAfterMs?: number
  ) {
    super(message);
    this.name = 'VerificationError';
    this.type = type;
    this.isRetryable = isRetryable;
    this.retryAfterMs = retryAfterMs;
  }
}

export const ERROR_MESSAGES: Record<VerificationErrorType, { fr: string; en: string }> = {
  network: {
    fr: 'Erreur de connexion. Vérifiez votre connexion internet.',
    en: 'Network error. Please check your internet connection.',
  },
  timeout: {
    fr: 'La vérification a pris trop de temps. Veuillez réessayer.',
    en: 'Verification timed out. Please try again.',
  },
  rate_limit: {
    fr: 'Limite de requêtes atteinte. Veuillez patienter quelques secondes.',
    en: 'Rate limit reached. Please wait a few seconds.',
  },
  payment: {
    fr: 'Crédits IA insuffisants. Veuillez contacter le support.',
    en: 'Insufficient AI credits. Please contact support.',
  },
  invalid_input: {
    fr: 'Données invalides. Vérifiez vos sources et votre brouillon.',
    en: 'Invalid input. Please check your sources and draft.',
  },
  ai_error: {
    fr: 'Erreur du service IA. Veuillez réessayer.',
    en: 'AI service error. Please try again.',
  },
  parse_error: {
    fr: 'Erreur lors de l\'analyse de la réponse. Veuillez réessayer.',
    en: 'Error parsing response. Please try again.',
  },
  unknown: {
    fr: 'Une erreur inattendue s\'est produite.',
    en: 'An unexpected error occurred.',
  },
};

export function getErrorMessage(type: VerificationErrorType, language: 'fr' | 'en'): string {
  return ERROR_MESSAGES[type]?.[language] || ERROR_MESSAGES.unknown[language];
}

export function classifyError(error: unknown, language: 'fr' | 'en'): VerificationError {
  const err = error as any;
  const message = err?.message || '';
  const context = err?.context || {};
  const status = context?.status;

  // Network errors (fetch failures)
  if (err?.name === 'TypeError' && (message.includes('fetch') || message.includes('network'))) {
    return new VerificationError('network', getErrorMessage('network', language), true);
  }

  // Abort/Timeout errors
  if (err?.name === 'AbortError' || message.toLowerCase().includes('timeout') || message.toLowerCase().includes('aborted')) {
    return new VerificationError('timeout', getErrorMessage('timeout', language), true);
  }

  // HTTP status code based classification
  if (status === 429 || message.includes('429') || message.toLowerCase().includes('rate')) {
    const retryAfter = context?.headers?.['retry-after'];
    const retryMs = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
    return new VerificationError('rate_limit', getErrorMessage('rate_limit', language), true, retryMs);
  }

  if (status === 402 || message.includes('402') || message.toLowerCase().includes('payment') || message.toLowerCase().includes('credit')) {
    return new VerificationError('payment', getErrorMessage('payment', language), false);
  }

  if (status === 400) {
    return new VerificationError('invalid_input', getErrorMessage('invalid_input', language), false);
  }

  if (status >= 500 || message.toLowerCase().includes('ai verification failed')) {
    return new VerificationError('ai_error', getErrorMessage('ai_error', language), true);
  }

  // Parse errors
  if (message.toLowerCase().includes('parse') || message.toLowerCase().includes('json') || message.toLowerCase().includes('invalid')) {
    return new VerificationError('parse_error', getErrorMessage('parse_error', language), true);
  }

  // Default to unknown but check if the message suggests it's retryable
  const isLikelyRetryable = message.toLowerCase().includes('try again') || 
                            message.toLowerCase().includes('réessayer') ||
                            message.toLowerCase().includes('temporarily');
  
  return new VerificationError(
    'unknown',
    message || getErrorMessage('unknown', language),
    isLikelyRetryable
  );
}
