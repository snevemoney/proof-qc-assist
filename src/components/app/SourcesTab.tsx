import { Plus, FileText } from 'lucide-react';
import { FileUpload } from './FileUpload';
import { SourceCard } from './SourceCard';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Source } from '@/lib/verification';

interface SourcesTabProps {
  sources: Source[];
  onAddSources: (sources: Source[]) => void;
  onDeleteSource: (id: string) => void;
}

export const SourcesTab = ({ sources, onAddSources, onDeleteSource }: SourcesTabProps) => {
  const { t } = useLanguage();

  const handleFilesSelected = (files: File[]) => {
    // Demo: create placeholder sources from file names
    const newSources: Source[] = files.map((file, idx) => ({
      id: `${Date.now()}-${idx}`,
      title: file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
      authors: t('source.extracting'),
      year: new Date().getFullYear().toString(),
      abstract: t('source.processingText'),
      content: '', // Would be extracted from PDF in production
    }));
    onAddSources(newSources);
  };

  return (
    <div className="space-y-6">
      <FileUpload onFilesSelected={handleFilesSelected} />
      
      {sources.length === 0 ? (
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
              onDelete={onDeleteSource}
            />
          ))}
        </div>
      )}
    </div>
  );
};
