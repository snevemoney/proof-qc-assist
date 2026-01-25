import { useState } from 'react';
import { History, ChevronRight, ChevronLeft, Trash2, Clock, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVerificationHistory, VerificationHistoryEntry } from '@/hooks/useVerificationHistory';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
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

interface HistoryPanelProps {
  onRestoreHistory: (entry: VerificationHistoryEntry) => void;
}

export const HistoryPanel = ({ onRestoreHistory }: HistoryPanelProps) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { history, isLoading, deleteFromHistory } = useVerificationHistory();
  const [isOpen, setIsOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  const locale = language === 'fr' ? fr : enUS;

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteFromHistory(id);
    setDeletingId(null);
    setEntryToDelete(null);
  };

  const getStatusSummary = (entry: VerificationHistoryEntry) => {
    const entryClaims = entry?.claims ?? [];
    const total = entryClaims.length;
    const supported = entryClaims.filter(c => c.status === 'supported').length;
    return `${supported}/${total} ${language === 'fr' ? 'vérifié' : 'verified'}`;
  };

  if (!user) return null;

  return (
    <>
      {/* Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-20 z-40 gap-2"
      >
        <History className="h-4 w-4" />
        {language === 'fr' ? 'Historique' : 'History'}
        {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>

      {/* Panel */}
      <div
        className={`fixed left-0 top-0 h-full bg-background border-r shadow-lg z-30 transition-all duration-300 ${
          isOpen ? 'w-80 translate-x-0' : 'w-80 -translate-x-full'
        }`}
      >
        <div className="p-4 border-b mt-16">
          <h2 className="font-semibold flex items-center gap-2">
            <History className="h-5 w-5" />
            {language === 'fr' ? 'Historique des vérifications' : 'Verification History'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {language === 'fr' 
              ? 'Cliquez pour restaurer un résultat précédent'
              : 'Click to restore a previous result'}
          </p>
        </div>

        <ScrollArea className="h-[calc(100vh-140px)]">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (history?.length ?? 0) === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{language === 'fr' ? 'Aucun historique' : 'No history yet'}</p>
              <p className="text-sm mt-1">
                {language === 'fr' 
                  ? 'Les vérifications apparaîtront ici'
                  : 'Verifications will appear here'}
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {(history ?? []).map((entry) => (
                <div
                  key={entry.id}
                  className="group relative p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => {
                    onRestoreHistory(entry);
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(entry.createdAt, 'PPp', { locale })}
                      </div>
                      <p className="text-sm font-medium mt-1 truncate">
                        {(entry?.draftText ?? '').slice(0, 60)}
                        {(entry?.draftText?.length ?? 0) > 60 ? '...' : ''}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {getStatusSummary(entry)}
                        </span>
                        <span className="text-muted-foreground">
                          {entry?.sourcesSnapshot?.length ?? 0} {language === 'fr' ? 'sources' : 'sources'}
                        </span>
                        {entry?.strictMode && (
                          <span className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs">
                            {language === 'fr' ? 'Strict' : 'Strict'}
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEntryToDelete(entry.id);
                      }}
                    >
                      {deletingId === entry.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Overlay - always mounted with CSS visibility to avoid DOM race conditions */}
      <div
        className={`fixed inset-0 bg-black/20 z-20 transition-opacity ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Single controlled AlertDialog - hoisted outside map to prevent portal race conditions */}
      <AlertDialog 
        open={entryToDelete !== null} 
        onOpenChange={(open) => !open && setEntryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'fr' ? 'Supprimer cette entrée?' : 'Delete this entry?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'fr'
                ? 'Cette action est irréversible.'
                : 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'fr' ? 'Annuler' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => entryToDelete && handleDelete(entryToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {language === 'fr' ? 'Supprimer' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
