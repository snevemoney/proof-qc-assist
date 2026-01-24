import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { X, MessageSquare, Send } from 'lucide-react';

interface SelectionFeedbackPopoverProps {
  selectedText: string;
  position: { x: number; y: number };
  onAddFeedback: (feedback: string) => void;
  onClose: () => void;
  language: 'fr' | 'en';
}

const quickActions = {
  fr: [
    { label: 'Reformuler', value: 'Reformuler cette partie' },
    { label: 'Simplifier', value: 'Simplifier ce passage' },
    { label: 'Trop formel', value: 'Trop formel, rendre plus naturel' },
    { label: 'Développer', value: 'Développer davantage' },
    { label: 'Réduire', value: 'Réduire/raccourcir' },
  ],
  en: [
    { label: 'Rephrase', value: 'Rephrase this part' },
    { label: 'Simplify', value: 'Simplify this passage' },
    { label: 'Too formal', value: 'Too formal, make it more natural' },
    { label: 'Expand', value: 'Expand on this' },
    { label: 'Shorten', value: 'Shorten this' },
  ],
};

export const SelectionFeedbackPopover = ({
  selectedText,
  position,
  onAddFeedback,
  onClose,
  language,
}: SelectionFeedbackPopoverProps) => {
  const [customFeedback, setCustomFeedback] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Truncate selected text for display
  const truncatedText = selectedText.length > 60 
    ? selectedText.substring(0, 60) + '...' 
    : selectedText;

  // Format feedback with context
  const formatFeedback = (comment: string) => {
    const cleanText = selectedText.replace(/\n/g, ' ').trim();
    const truncatedForFeedback = cleanText.length > 100 
      ? cleanText.substring(0, 100) + '...' 
      : cleanText;
    return `[${language === 'fr' ? 'Concernant' : 'Regarding'}: "${truncatedForFeedback}"] ${comment}`;
  };

  const handleQuickAction = (value: string) => {
    onAddFeedback(formatFeedback(value));
    onClose();
  };

  const handleCustomSubmit = () => {
    if (customFeedback.trim()) {
      onAddFeedback(formatFeedback(customFeedback.trim()));
      setCustomFeedback('');
      onClose();
    }
  };

  // Position the popover
  useEffect(() => {
    if (popoverRef.current) {
      const rect = popoverRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Adjust horizontal position if overflowing
      let left = position.x;
      if (left + rect.width > viewportWidth - 20) {
        left = viewportWidth - rect.width - 20;
      }
      if (left < 20) left = 20;
      
      // Adjust vertical position if overflowing
      let top = position.y + 10;
      if (top + rect.height > viewportHeight - 20) {
        top = position.y - rect.height - 10;
      }
      if (top < 20) top = 20;
      
      popoverRef.current.style.left = `${left}px`;
      popoverRef.current.style.top = `${top}px`;
    }
  }, [position]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    // Delay to prevent immediate close from selection click
    const timeout = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);
    
    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <Card
      ref={popoverRef}
      className="fixed z-50 w-80 shadow-lg border-primary/20"
      style={{ left: position.x, top: position.y }}
    >
      <CardContent className="p-3 space-y-3">
        {/* Header with selected text preview */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-1 min-w-0">
            <MessageSquare className="h-3 w-3 shrink-0" />
            <span className="truncate italic">"{truncatedText}"</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-5 w-5 shrink-0" 
            onClick={onClose}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Quick action chips */}
        <div className="flex flex-wrap gap-1.5">
          {quickActions[language].map((action) => (
            <Button
              key={action.label}
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2"
              onClick={() => handleQuickAction(action.value)}
            >
              {action.label}
            </Button>
          ))}
        </div>

        {/* Custom feedback input */}
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={customFeedback}
            onChange={(e) => setCustomFeedback(e.target.value)}
            placeholder={language === 'fr' 
              ? "Votre commentaire spécifique..." 
              : "Your specific feedback..."}
            className="min-h-[60px] text-sm resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleCustomSubmit();
              }
            }}
          />
        </div>

        {/* Submit button */}
        <Button
          size="sm"
          className="w-full"
          onClick={handleCustomSubmit}
          disabled={!customFeedback.trim()}
        >
          <Send className="h-3 w-3 mr-2" />
          {language === 'fr' ? 'Ajouter aux commentaires' : 'Add to feedback'}
        </Button>
      </CardContent>
    </Card>
  );
};
