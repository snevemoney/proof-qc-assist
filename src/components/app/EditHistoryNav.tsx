import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface EditVersion {
  id: string;
  content: string;
  createdAt: Date;
  editCount: number;
}

interface EditHistoryNavProps {
  messageId: string;
  currentContent: string;
  editCount: number;
  parentMessageId: string | null;
  onContentChange: (content: string, isViewingHistory: boolean) => void;
}

export const EditHistoryNav = ({
  messageId,
  currentContent,
  editCount,
  parentMessageId,
  onContentChange,
}: EditHistoryNavProps) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [versions, setVersions] = useState<EditVersion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all versions in the edit chain
  const fetchVersions = useCallback(async () => {
    if (!parentMessageId && editCount === 0) return;
    
    setIsLoading(true);
    const allVersions: EditVersion[] = [];

    // Start with current message
    allVersions.push({
      id: messageId,
      content: currentContent,
      createdAt: new Date(),
      editCount: editCount,
    });

    // Follow parent chain backwards
    let currentParentId = parentMessageId;
    
    if (user) {
      while (currentParentId) {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('id, content, created_at, edit_count, parent_message_id')
          .eq('id', currentParentId)
          .eq('user_id', user.id)
          .single();

        if (error || !data) break;

        allVersions.unshift({
          id: data.id,
          content: data.content,
          createdAt: new Date(data.created_at),
          editCount: data.edit_count || 0,
        });

        currentParentId = data.parent_message_id;
      }
    } else {
      // For anonymous users, we don't have edit history persistence
      // Just show the current version
    }

    setVersions(allVersions);
    setCurrentIndex(allVersions.length - 1); // Start at current (latest) version
    setIsLoading(false);
  }, [messageId, currentContent, editCount, parentMessageId, user]);

  useEffect(() => {
    if (editCount > 0 || parentMessageId) {
      fetchVersions();
    }
  }, [editCount, parentMessageId, fetchVersions]);

  const totalVersions = versions.length > 0 ? versions.length : editCount + 1;
  const displayIndex = versions.length > 0 ? currentIndex + 1 : editCount + 1;

  const handlePrevious = () => {
    if (currentIndex > 0 && versions.length > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      onContentChange(versions[newIndex].content, true);
    }
  };

  const handleNext = () => {
    if (currentIndex < versions.length - 1 && versions.length > 0) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      const isLatest = newIndex === versions.length - 1;
      onContentChange(versions[newIndex].content, !isLatest);
    }
  };

  // Only show if there's edit history
  if (editCount === 0 && !parentMessageId) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handlePrevious}
          disabled={isLoading || currentIndex === 0 || versions.length === 0}
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>
        
        <span className="text-xs text-muted-foreground min-w-[40px] text-center">
          {isLoading ? '...' : `${displayIndex}/${totalVersions}`}
        </span>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleNext}
          disabled={isLoading || currentIndex >= versions.length - 1 || versions.length === 0}
        >
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>

      <Badge variant="secondary" className="text-xs px-2 py-0.5">
        {language === 'fr' ? 'Modifié' : 'Edited'}
      </Badge>
    </div>
  );
};
