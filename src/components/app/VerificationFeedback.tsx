import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { useVerificationFeedback } from '@/hooks/useVerificationFeedback';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface VerificationFeedbackProps {
  verificationId: string | null;
  className?: string;
}

export const VerificationFeedback: React.FC<VerificationFeedbackProps> = ({
  verificationId,
  className,
}) => {
  const { language } = useLanguage();
  const { submitFeedback, isSubmitting } = useVerificationFeedback();
  const [submitted, setSubmitted] = useState<'helpful' | 'not_helpful' | null>(null);

  if (!verificationId || submitted) {
    return submitted ? (
      <div className={cn('text-sm text-muted-foreground text-center py-2', className)}>
        {language === 'fr' 
          ? 'Merci pour votre avis! 🙏' 
          : 'Thanks for your feedback! 🙏'}
      </div>
    ) : null;
  }

  const handleFeedback = async (wasHelpful: boolean) => {
    const success = await submitFeedback(verificationId, wasHelpful);
    if (success) {
      setSubmitted(wasHelpful ? 'helpful' : 'not_helpful');
    }
  };

  return (
    <div className={cn('flex items-center justify-center gap-4 py-3', className)}>
      <span className="text-sm text-muted-foreground">
        {language === 'fr' 
          ? 'Cette vérification était-elle utile?' 
          : 'Was this verification helpful?'}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleFeedback(true)}
          disabled={isSubmitting}
          className="gap-1.5"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ThumbsUp className="h-4 w-4" />
          )}
          {language === 'fr' ? 'Oui' : 'Yes'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleFeedback(false)}
          disabled={isSubmitting}
          className="gap-1.5"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ThumbsDown className="h-4 w-4" />
          )}
          {language === 'fr' ? 'Non' : 'No'}
        </Button>
      </div>
    </div>
  );
};
