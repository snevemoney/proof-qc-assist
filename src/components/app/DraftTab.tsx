import { useState } from 'react';
import { Play, Upload, AlertCircle, Loader2, Save, FolderOpen, Trash2, FileText, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { SavedDraft } from '@/hooks/useSavedDrafts';
import { VerificationError } from '@/lib/verificationErrors';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface DraftTabProps {
  draftText: string;
  onDraftChange: (text: string) => void;
  onVerify: () => void;
  sourcesCount: number;
  isVerifying: boolean;
  strictMode: boolean;
  onStrictModeChange: (value: boolean) => void;
  savedDrafts: SavedDraft[];
  savedDraftsLoading: boolean;
  onSaveDraft: (name: string, content: string) => Promise<void>;
  onDeleteDraft: (id: string) => Promise<void>;
  verificationError?: VerificationError | null;
  retryCount?: number;
}

export const DraftTab = ({ 
  draftText, 
  onDraftChange, 
  onVerify, 
  sourcesCount,
  isVerifying,
  strictMode,
  onStrictModeChange,
  savedDrafts,
  savedDraftsLoading,
  onSaveDraft,
  onDeleteDraft,
  verificationError,
  retryCount = 0,
}: DraftTabProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [loadConfirmOpen, setLoadConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<SavedDraft | null>(null);

  const wordCount = draftText.trim() ? draftText.trim().split(/\s+/).length : 0;
  const charCount = draftText.length;
  const canVerify = sourcesCount > 0 && draftText.trim().length > 0;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        onDraftChange(text);
      };
      reader.readAsText(file);
    }
  };

  const handleSaveDraft = async () => {
    if (!draftName.trim() || !draftText.trim()) return;
    
    setIsSaving(true);
    try {
      await onSaveDraft(draftName.trim(), draftText);
      setSaveDialogOpen(false);
      setDraftName('');
      toast.success(t('draft.draftSaved'));
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadDraft = (draft: SavedDraft) => {
    if (draftText.trim()) {
      setSelectedDraft(draft);
      setLoadConfirmOpen(true);
    } else {
      onDraftChange(draft.content);
      toast.success(t('draft.draftLoaded'));
    }
  };

  const confirmLoadDraft = () => {
    if (selectedDraft) {
      onDraftChange(selectedDraft.content);
      toast.success(t('draft.draftLoaded'));
    }
    setLoadConfirmOpen(false);
    setSelectedDraft(null);
  };

  const handleDeleteDraft = (draft: SavedDraft) => {
    setSelectedDraft(draft);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteDraft = async () => {
    if (selectedDraft) {
      try {
        await onDeleteDraft(selectedDraft.id);
        toast.success(t('draft.draftDeleted'));
      } catch (error) {
        console.error('Error deleting draft:', error);
        toast.error('Failed to delete draft');
      }
    }
    setDeleteConfirmOpen(false);
    setSelectedDraft(null);
  };

  return (
    <div className="space-y-4 pb-20 sm:pb-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Label htmlFor="draft-upload" className="cursor-pointer">
            <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Upload className="h-4 w-4" />
              {t('draft.uploadFile')}
            </div>
            <input
              id="draft-upload"
              type="file"
              accept=".txt,.docx,.doc"
              className="hidden"
              onChange={handleFileUpload}
            />
          </Label>
        </div>
        <div className="text-xs text-muted-foreground">
          {wordCount} {t('draft.words')} · {charCount} {t('draft.characters')}
        </div>
      </div>

      <Textarea
        placeholder={t('draft.placeholder')}
        value={draftText}
        onChange={(e) => onDraftChange(e.target.value)}
        className="min-h-[300px] resize-none font-mono text-sm"
        disabled={isVerifying}
      />

      {/* Saved Drafts Section - Only show for logged-in users */}
      {user && (
        <Card>
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t('draft.savedDrafts')}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSaveDialogOpen(true)}
                disabled={!draftText.trim()}
                className="gap-2"
              >
                <Save className="h-3 w-3" />
                {t('draft.saveCurrent')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="py-2">
            {savedDraftsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : savedDrafts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('draft.noSavedDrafts')}
              </p>
            ) : (
              <ScrollArea className="max-h-[200px]">
                <div className="space-y-2">
                  {savedDrafts.map((draft) => (
                    <div
                      key={draft.id}
                      className="flex items-center justify-between p-2 rounded-md border bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-sm font-medium truncate">{draft.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {draft.content.slice(0, 60)}...
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(draft.updatedAt, 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLoadDraft(draft)}
                          className="h-8 px-2"
                        >
                          <FolderOpen className="h-3 w-3 mr-1" />
                          {t('draft.loadDraft')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDraft(draft)}
                          className="h-8 px-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between border-t pt-4">
        <div className="flex items-center gap-3">
          <Switch
            id="strict-mode"
            checked={strictMode}
            onCheckedChange={onStrictModeChange}
            disabled={isVerifying}
          />
          <Label htmlFor="strict-mode" className="text-sm font-normal cursor-pointer">
            {t('draft.strictMode')}
          </Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertCircle className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="text-xs">{t('draft.strictModeTooltip')}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-3">
          {!canVerify && (
            <p className="text-xs text-muted-foreground">
              {sourcesCount === 0 
                ? t('draft.needSources') 
                : t('draft.needText')
              }
            </p>
          )}
          <Button 
            onClick={onVerify} 
            disabled={!canVerify || isVerifying}
            className="gap-2 whitespace-nowrap min-w-fit"
          >
            {isVerifying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('draft.verifying')}
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                {t('draft.verifyNow')}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Alert with Retry */}
      {verificationError && !isVerifying && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
            <span className="flex-1">{verificationError.message}</span>
            {verificationError.isRetryable && (
              <Button variant="outline" size="sm" onClick={onVerify} className="gap-2">
                <RotateCcw className="h-3 w-3" />
                {t('draft.retry')}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Retry Progress Indicator */}
      {isVerifying && retryCount > 0 && (
        <div className="text-xs text-muted-foreground text-center mt-2">
          {t('draft.retrying')} ({retryCount}/2)
        </div>
      )}

      {/* Save Draft Dialog - Always mounted, controlled by open prop */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('draft.saveCurrent')}</DialogTitle>
            <DialogDescription>
              {t('draft.draftNamePlaceholder')}
            </DialogDescription>
          </DialogHeader>
          <Input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder={t('draft.draftNamePlaceholder')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && draftName.trim()) {
                handleSaveDraft();
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDraft} disabled={!draftName.trim() || isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Confirmation Dialog - Always mounted, controlled by open prop */}
      <AlertDialog open={loadConfirmOpen} onOpenChange={setLoadConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('draft.confirmLoad')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('draft.confirmLoadDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLoadDraft}>
              {t('draft.loadDraft')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog - Always mounted, controlled by open prop */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('draft.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('draft.confirmDeleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteDraft} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('draft.deleteDraft')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
