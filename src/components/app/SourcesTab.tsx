import { useState } from 'react';
import { FileText, Loader2, AlertCircle } from 'lucide-react';
import { FileUpload } from './FileUpload';
import { SourceCard } from './SourceCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { parseDocuments, ParseProgress } from '@/lib/documentParser';
import { useToast } from '@/hooks/use-toast';
import type { Source } from '@/lib/verification';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface SourcesTabProps {
  sources: Source[];
  onAddSources: (sources: Source[]) => void;
  onDeleteSource: (id: string) => void;
}

interface ProcessingFile {
  fileName: string;
  status: 'pending' | 'parsing' | 'complete' | 'error';
  error?: string;
}

export const SourcesTab = ({ sources, onAddSources, onDeleteSource }: SourcesTabProps) => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [processingFiles, setProcessingFiles] = useState<ProcessingFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProcessingFiles(files.map(f => ({ fileName: f.name, status: 'pending' })));

    try {
      const { sources: parsedSources, errors } = await parseDocuments(
        files,
        (progress: ParseProgress[]) => {
          setProcessingFiles(progress.map(p => ({
            fileName: p.fileName,
            status: p.status,
            error: p.error,
          })));
        }
      );

      if (parsedSources.length > 0) {
        onAddSources(parsedSources);
        toast({
          title: language === 'fr' ? 'Documents traités' : 'Documents processed',
          description: language === 'fr'
            ? `${parsedSources.length} source(s) ajoutée(s)`
            : `${parsedSources.length} source(s) added`,
        });
      }

      if (errors.length > 0) {
        toast({
          title: language === 'fr' ? 'Erreurs de traitement' : 'Processing errors',
          description: errors.map(e => e.fileName).join(', '),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error processing files:', error);
      toast({
        title: language === 'fr' ? 'Erreur' : 'Error',
        description: language === 'fr'
          ? 'Impossible de traiter les fichiers'
          : 'Failed to process files',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      // Clear processing files after a short delay
      setTimeout(() => setProcessingFiles([]), 2000);
    }
  };

  const completedCount = processingFiles.filter(f => f.status === 'complete').length;
  const progressPercent = processingFiles.length > 0 
    ? (completedCount / processingFiles.length) * 100 
    : 0;

  return (
    <div className="space-y-6">
      <FileUpload onFilesSelected={handleFilesSelected} />
      
      {/* Processing Indicator */}
      {isProcessing && processingFiles.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm font-medium">
                {language === 'fr' ? 'Extraction du texte...' : 'Extracting text...'}
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Progress value={progressPercent} className="h-2 mb-3" />
            <div className="space-y-1">
              {processingFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  {file.status === 'pending' && (
                    <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                  )}
                  {file.status === 'parsing' && (
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  )}
                  {file.status === 'complete' && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                  {file.status === 'error' && (
                    <AlertCircle className="h-3 w-3 text-destructive" />
                  )}
                  <span className={file.status === 'error' ? 'text-destructive' : 'text-muted-foreground'}>
                    {file.fileName}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {sources.length === 0 && !isProcessing ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            {t('sources.empty.title')}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            {t('sources.empty.description')}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sources.map((source, index) => (
            <SourceCard
              key={source.id}
              id={source.id}
              index={index + 1}
              title={source.title}
              authors={source.authors}
              year={source.year}
              journal={source.journal}
              abstract={source.abstract}
              studyType={source.studyType}
              onDelete={onDeleteSource}
            />
          ))}
        </div>
      )}
    </div>
  );
};