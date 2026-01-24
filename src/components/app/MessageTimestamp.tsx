import { useMemo, useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MessageTimestampProps {
  date: Date;
  className?: string;
}

export const MessageTimestamp = ({ date, className = '' }: MessageTimestampProps) => {
  const { language } = useLanguage();
  const [, setTick] = useState(0);

  // Update every minute for recent messages
  useEffect(() => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = diffMs / (1000 * 60);

    // Only auto-update if message is less than 1 hour old
    if (diffMinutes < 60) {
      const interval = setInterval(() => {
        setTick(t => t + 1);
      }, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [date]);

  const relativeTime = useMemo(() => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffSeconds < 60) {
      return language === 'fr' ? 'À l\'instant' : 'Just now';
    }

    if (diffMinutes < 60) {
      return language === 'fr' ? `Il y a ${diffMinutes}m` : `${diffMinutes}m ago`;
    }

    if (diffHours < 24) {
      return language === 'fr' ? `Il y a ${diffHours}h` : `${diffHours}h ago`;
    }

    if (diffDays === 1) {
      return language === 'fr' ? 'Hier' : 'Yesterday';
    }

    if (diffDays < 7) {
      return language === 'fr' ? `Il y a ${diffDays}j` : `${diffDays}d ago`;
    }

    // Format as date for older messages
    return date.toLocaleDateString(language === 'fr' ? 'fr-CA' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  }, [date, language]);

  const exactTime = useMemo(() => {
    return date.toLocaleString(language === 'fr' ? 'fr-CA' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [date, language]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`text-xs text-muted-foreground cursor-default ${className}`}>
            {relativeTime}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {exactTime}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
