import { FileText, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

interface SourceCardProps {
  id: string;
  index: number;
  title: string;
  authors: string;
  year: string;
  journal?: string;
  abstract?: string;
  onDelete: (id: string) => void;
}

export const SourceCard = ({ 
  id, 
  index, 
  title, 
  authors, 
  year, 
  journal, 
  abstract,
  onDelete 
}: SourceCardProps) => {
  const { language } = useLanguage();
  const tagLabel = `[S${index}]`;

  return (
    <Card className="group relative">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 items-center rounded-md bg-primary px-2 text-xs font-bold text-primary-foreground">
              {tagLabel}
            </span>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onDelete(id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
        <h3 className="text-sm font-medium leading-tight line-clamp-2 mt-2">
          {title}
        </h3>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-muted-foreground">
          {authors} ({year})
        </p>
        {journal && (
          <p className="text-xs text-muted-foreground italic mt-1 line-clamp-1">
            {journal}
          </p>
        )}
        {abstract && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-3">
            {abstract}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
