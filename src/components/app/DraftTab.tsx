import { useState } from 'react';
import { Play, Upload, Settings2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';

interface DraftTabProps {
  draftText: string;
  onDraftChange: (text: string) => void;
  onVerify: () => void;
  sourcesCount: number;
  isVerifying: boolean;
}

export const DraftTab = ({ 
  draftText, 
  onDraftChange, 
  onVerify, 
  sourcesCount,
  isVerifying 
}: DraftTabProps) => {
  const { t } = useLanguage();
  const [strictMode, setStrictMode] = useState(false);

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

  return (
    <div className="space-y-4">
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
        className="min-h-[400px] resize-none font-mono text-sm"
      />

      <div className="flex items-center justify-between border-t pt-4">
        <div className="flex items-center gap-3">
          <Switch
            id="strict-mode"
            checked={strictMode}
            onCheckedChange={setStrictMode}
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
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            {isVerifying ? t('draft.verifying') : t('draft.verifyNow')}
          </Button>
        </div>
      </div>
    </div>
  );
};
