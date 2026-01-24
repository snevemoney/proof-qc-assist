import { supabase } from '@/integrations/supabase/client';
import type { Source } from './verification';

export interface ParseProgress {
  fileName: string;
  status: 'pending' | 'parsing' | 'complete' | 'error';
  error?: string;
}

/**
 * Convert a File to base64 string
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Parse a single document file and extract source information
 */
export async function parseDocument(file: File): Promise<Source> {
  const base64Content = await fileToBase64(file);
  
  const { data, error } = await supabase.functions.invoke('parse-document', {
    body: {
      fileName: file.name,
      fileContent: base64Content,
      mimeType: file.type,
    },
  });

  if (error) {
    console.error('Error parsing document:', error);
    throw new Error(`Failed to parse ${file.name}: ${error.message}`);
  }

  if (data?.error) {
    throw new Error(`Failed to parse ${file.name}: ${data.error}`);
  }

  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: data.title,
    authors: data.authors,
    year: data.year,
    journal: data.journal,
    abstract: data.abstract,
    content: data.content,
    studyType: data.studyType,
  };
}

/**
 * Parse multiple documents with progress tracking
 */
export async function parseDocuments(
  files: File[],
  onProgress?: (progress: ParseProgress[]) => void
): Promise<{ sources: Source[]; errors: { fileName: string; error: string }[] }> {
  const progress: ParseProgress[] = files.map(f => ({
    fileName: f.name,
    status: 'pending',
  }));

  const sources: Source[] = [];
  const errors: { fileName: string; error: string }[] = [];

  // Process files sequentially to avoid overwhelming the API
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Update progress to parsing
    progress[i].status = 'parsing';
    onProgress?.(progress);

    try {
      const source = await parseDocument(file);
      sources.push(source);
      progress[i].status = 'complete';
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      progress[i].status = 'error';
      progress[i].error = errorMessage;
      errors.push({ fileName: file.name, error: errorMessage });
    }

    onProgress?.(progress);
  }

  return { sources, errors };
}