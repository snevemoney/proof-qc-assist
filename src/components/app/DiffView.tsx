import { useMemo } from 'react';
import { computeWordDiff, DiffSegment } from '@/lib/textDiff';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Percent } from 'lucide-react';

interface DiffViewProps {
  original: string;
  modified: string;
  language: 'fr' | 'en';
}

export const DiffView = ({ original, modified, language }: DiffViewProps) => {
  const diff = useMemo(() => {
    // Stricter type checks - handle undefined, null, and empty strings
    if (typeof original !== 'string' || typeof modified !== 'string') return null;
    if (!original.trim() || !modified.trim()) return null;
    
    try {
      return computeWordDiff(original, modified);
    } catch (error) {
      console.error('Diff computation failed:', error);
      return null;
    }
  }, [original, modified]);

  if (!diff) {
    return (
      <div className="text-center text-muted-foreground py-8">
        {language === 'fr' 
          ? 'Aucune comparaison disponible' 
          : 'No comparison available'}
      </div>
    );
  }

  const { originalSegments, modifiedSegments, stats } = diff;

  // Check if there are actual changes
  const hasChanges = stats.addedWords > 0 || stats.removedWords > 0;

  if (!hasChanges) {
    return (
      <div className="text-center text-muted-foreground py-8">
        {language === 'fr' 
          ? 'Aucune modification détectée' 
          : 'No changes detected'}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Stats bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <Badge variant="outline" className="text-success border-success/30 bg-success/10">
          <Plus className="h-3 w-3 mr-1" />
          {stats.addedWords} {language === 'fr' ? 'mots ajoutés' : 'words added'}
        </Badge>
        <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/10">
          <Minus className="h-3 w-3 mr-1" />
          {stats.removedWords} {language === 'fr' ? 'mots retirés' : 'words removed'}
        </Badge>
        <Badge variant="outline" className="text-muted-foreground">
          <Percent className="h-3 w-3 mr-1" />
          {stats.changePercent}% {language === 'fr' ? 'modifié' : 'changed'}
        </Badge>
      </div>

      {/* Side-by-side diff */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Original with deletions */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            {language === 'fr' ? 'Brouillon original' : 'Original Draft'}
          </h4>
          <div className="min-h-[300px] max-h-[500px] overflow-y-auto font-mono text-sm p-3 border rounded-md bg-muted/30 whitespace-pre-wrap">
            {originalSegments.map((segment, index) => (
              <DiffSegmentSpan key={index} segment={segment} side="original" />
            ))}
          </div>
        </div>

        {/* Modified with additions */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            {language === 'fr' ? 'Version finale' : 'Final Version'}
          </h4>
          <div className="min-h-[300px] max-h-[500px] overflow-y-auto font-mono text-sm p-3 border rounded-md bg-muted/30 whitespace-pre-wrap">
            {modifiedSegments.map((segment, index) => (
              <DiffSegmentSpan key={index} segment={segment} side="modified" />
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 bg-destructive/20 border border-destructive/30 rounded-sm" />
          {language === 'fr' ? 'Texte retiré' : 'Removed text'}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 bg-success/20 border border-success/30 rounded-sm" />
          {language === 'fr' ? 'Texte ajouté' : 'Added text'}
        </span>
      </div>
    </div>
  );
};

interface DiffSegmentSpanProps {
  segment: DiffSegment;
  side: 'original' | 'modified';
}

const DiffSegmentSpan = ({ segment, side }: DiffSegmentSpanProps) => {
  if (segment.type === 'unchanged') {
    return <span>{segment.text}</span>;
  }

  if (segment.type === 'removed' && side === 'original') {
    return (
      <span className="bg-destructive/20 text-destructive line-through decoration-destructive/60">
        {segment.text}
      </span>
    );
  }

  if (segment.type === 'added' && side === 'modified') {
    return (
      <span className="bg-success/20 text-success">
        {segment.text}
      </span>
    );
  }

  // Don't render removed segments on modified side or added segments on original side
  return null;
};
