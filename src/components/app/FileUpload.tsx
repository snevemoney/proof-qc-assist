import { useState, useCallback } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  acceptedTypes?: string;
  multiple?: boolean;
}

const MAX_FILE_BYTES = 6 * 1024 * 1024;

export const FileUpload = ({ 
  onFilesSelected, 
  acceptedTypes = '.pdf,.docx,.doc,.txt',
  multiple = true 
}: FileUploadProps) => {
  const { t } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const acceptFiles = useCallback((files: File[]) => {
    const allowed = acceptedTypes.split(',').map((type) => type.trim().toLowerCase());
    const valid = files.filter((file) => {
      const name = file.name.toLowerCase();
      const matchesType = allowed.some((type) => {
        const ext = type.startsWith('.') ? type : `.${type}`;
        return name.endsWith(ext);
      });
      return matchesType && file.size > 0 && file.size <= MAX_FILE_BYTES;
    });
    if (valid.length > 0) {
      onFilesSelected(valid);
    }
  }, [acceptedTypes, onFilesSelected]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    acceptFiles(Array.from(e.dataTransfer.files));
  }, [acceptFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    acceptFiles(files);
    e.target.value = '';
  }, [acceptFiles]);

  return (
    <div
      className={`
        relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
        ${isDragging 
          ? 'border-primary bg-primary/5' 
          : 'border-border hover:border-primary/50 hover:bg-muted/50'
        }
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept={acceptedTypes}
        multiple={multiple}
        onChange={handleFileSelect}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Upload className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            {t('upload.dragDrop')}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {t('upload.orBrowse')}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          PDF, DOCX, DOC, TXT
        </p>
      </div>
    </div>
  );
};
