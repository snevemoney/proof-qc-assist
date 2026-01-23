import { useState } from 'react';
import { Copy, Download, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import type { Source } from '@/lib/verification';
import { 
  generateCitation, 
  generateAllCitations, 
  downloadAsRTF,
  type CitationFormat 
} from '@/lib/citations';

interface CitationExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sources: Source[];
}

export const CitationExportModal = ({ 
  open, 
  onOpenChange, 
  sources 
}: CitationExportModalProps) => {
  const { language } = useLanguage();
  const [format, setFormat] = useState<CitationFormat>('apa7');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(sources.map(s => s.id))
  );
  const [copied, setCopied] = useState(false);
  
  const selectedSources = sources.filter(s => selectedIds.has(s.id));
  
  const toggleSource = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  
  const selectAll = () => {
    setSelectedIds(new Set(sources.map(s => s.id)));
  };
  
  const deselectAll = () => {
    setSelectedIds(new Set());
  };
  
  const handleCopy = async () => {
    const citations = generateAllCitations(selectedSources, format);
    await navigator.clipboard.writeText(citations);
    setCopied(true);
    toast.success(
      language === 'fr' 
        ? `${selectedSources.length} citation(s) copiée(s)!` 
        : `${selectedSources.length} citation(s) copied!`
    );
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleDownload = () => {
    const citations = generateAllCitations(selectedSources, format);
    const formatNames = {
      apa7: 'APA7',
      mla9: 'MLA9',
      chicago17: 'Chicago17',
      vancouver: 'Vancouver',
    };
    downloadAsRTF(citations, `citations-${formatNames[format]}.rtf`);
    toast.success(
      language === 'fr' 
        ? 'Fichier téléchargé!' 
        : 'File downloaded!'
    );
  };
  
  const formatLabels = {
    apa7: 'APA 7',
    mla9: 'MLA 9',
    chicago17: 'Chicago 17',
    vancouver: 'Vancouver',
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {language === 'fr' ? 'Exporter les citations' : 'Export Citations'}
          </DialogTitle>
          <DialogDescription>
            {language === 'fr' 
              ? 'Sélectionnez les sources et le format de citation'
              : 'Select sources and citation format'}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={format} onValueChange={(v) => setFormat(v as CitationFormat)}>
          <TabsList className="grid w-full grid-cols-4">
            {Object.entries(formatLabels).map(([key, label]) => (
              <TabsTrigger key={key} value={key}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <div className="mt-4 space-y-4">
            {/* Source selection */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {language === 'fr' 
                  ? `${selectedSources.length} source(s) sélectionnée(s)`
                  : `${selectedSources.length} source(s) selected`}
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  {language === 'fr' ? 'Tout' : 'All'}
                </Button>
                <Button variant="ghost" size="sm" onClick={deselectAll}>
                  {language === 'fr' ? 'Aucun' : 'None'}
                </Button>
              </div>
            </div>
            
            <ScrollArea className="h-[120px] border rounded-md p-2">
              <div className="space-y-2">
                {sources.map((source, index) => (
                  <div key={source.id} className="flex items-center gap-2">
                    <Checkbox
                      id={source.id}
                      checked={selectedIds.has(source.id)}
                      onCheckedChange={() => toggleSource(source.id)}
                    />
                    <label 
                      htmlFor={source.id}
                      className="text-sm cursor-pointer flex-1 truncate"
                    >
                      [S{index + 1}] {source.title}
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            {/* Preview */}
            {Object.keys(formatLabels).map((key) => (
              <TabsContent key={key} value={key} className="mt-0">
                <ScrollArea className="h-[200px] border rounded-md p-3 bg-muted/30">
                  <div className="space-y-3 text-sm">
                    {selectedSources.length === 0 ? (
                      <p className="text-muted-foreground italic">
                        {language === 'fr' 
                          ? 'Sélectionnez au moins une source'
                          : 'Select at least one source'}
                      </p>
                    ) : (
                      selectedSources.map((source, index) => (
                        <p key={source.id} className="leading-relaxed">
                          {generateCitation(
                            source, 
                            key as CitationFormat, 
                            key === 'vancouver' ? index : undefined
                          )}
                        </p>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </div>
        </Tabs>
        
        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            className="flex-1 gap-2" 
            onClick={handleCopy}
            disabled={selectedSources.length === 0}
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {language === 'fr' ? 'Copier' : 'Copy'}
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 gap-2"
            onClick={handleDownload}
            disabled={selectedSources.length === 0}
          >
            <Download className="h-4 w-4" />
            {language === 'fr' ? 'Télécharger .rtf' : 'Download .rtf'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
