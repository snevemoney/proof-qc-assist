import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Json } from '@/integrations/supabase/types';

interface ClaimFeedback {
  claimId: string;
  wasAccurate: boolean;
}

export const useVerificationFeedback = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { language } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitFeedback = useCallback(async (
    verificationId: string,
    wasHelpful: boolean,
    accuracyRating?: number,
    claimFeedback?: ClaimFeedback[]
  ) => {
    if (!user) {
      toast({
        title: language === 'fr' ? 'Connexion requise' : 'Login required',
        description: language === 'fr' 
          ? 'Connectez-vous pour soumettre votre avis' 
          : 'Please log in to submit feedback',
        variant: 'destructive',
      });
      return false;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('verification_feedback')
        .insert([{
          verification_id: verificationId,
          user_id: user.id,
          was_helpful: wasHelpful,
          accuracy_rating: accuracyRating || null,
          claim_feedback: (claimFeedback || []) as unknown as Json,
        }]);

      if (error) {
        console.error('Error submitting feedback:', error);
        toast({
          title: language === 'fr' ? 'Erreur' : 'Error',
          description: language === 'fr' 
            ? 'Impossible de soumettre votre avis' 
            : 'Could not submit feedback',
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: language === 'fr' ? 'Merci!' : 'Thank you!',
        description: language === 'fr' 
          ? 'Votre avis aide à améliorer le système' 
          : 'Your feedback helps improve the system',
      });
      return true;
    } catch (err) {
      console.error('Error in submitFeedback:', err);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [user, toast, language]);

  return {
    submitFeedback,
    isSubmitting,
  };
};
