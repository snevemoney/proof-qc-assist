import { useState } from 'react';
import { FolderOpen, Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
import { cn } from '@/lib/utils';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useLanguage } from '@/contexts/LanguageContext';

export const ProjectSidebar = () => {
  const { language } = useLanguage();
  const {
    projects,
    currentProjectId,
    setCurrentProjectId,
    createProject,
    renameProject,
    deleteProject,
  } = useProjectContext();

  const [projectsOpen, setProjectsOpen] = useState(true);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);

  const t = {
    projects: language === 'fr' ? 'Projets' : 'Projects',
    newProject: language === 'fr' ? 'Nouveau projet' : 'New Project',
    deleteProject: language === 'fr' ? 'Supprimer le projet?' : 'Delete project?',
    deleteProjectDesc: language === 'fr' 
      ? 'Toutes les sources, brouillons et conversations seront supprimés.'
      : 'All sources, drafts, and conversations will be deleted.',
    cancel: language === 'fr' ? 'Annuler' : 'Cancel',
    delete: language === 'fr' ? 'Supprimer' : 'Delete',
  };

  const handleStartEditProject = (projectId: string, currentName: string) => {
    setEditingProjectId(projectId);
    setEditName(currentName);
  };

  const handleSaveProjectName = async () => {
    if (editingProjectId && editName.trim()) {
      await renameProject(editingProjectId, editName.trim());
    }
    setEditingProjectId(null);
    setEditName('');
  };

  const handleConfirmDeleteProject = async () => {
    if (deleteProjectId) {
      await deleteProject(deleteProjectId);
      setDeleteProjectId(null);
    }
  };

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Projects Section */}
          <Collapsible open={projectsOpen} onOpenChange={setProjectsOpen}>
            <div className="flex items-center justify-between">
              <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
                {projectsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <FolderOpen className="h-4 w-4" />
                {t.projects}
              </CollapsibleTrigger>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => createProject()}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <CollapsibleContent className="mt-2 space-y-1">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={cn(
                    "group flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors cursor-pointer",
                    currentProjectId === project.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  onClick={() => setCurrentProjectId(project.id)}
                >
                  {editingProjectId === project.id ? (
                    <div className="flex items-center gap-1 flex-1">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-6 text-xs"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveProjectName();
                          if (e.key === 'Escape') setEditingProjectId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveProjectName();
                        }}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProjectId(null);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 truncate">{project.name}</span>
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEditProject(project.id, project.name);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        {projects.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteProjectId(project.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>

      {/* Delete Project Dialog */}
      <AlertDialog open={!!deleteProjectId} onOpenChange={() => setDeleteProjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteProject}</AlertDialogTitle>
            <AlertDialogDescription>{t.deleteProjectDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteProject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
};
