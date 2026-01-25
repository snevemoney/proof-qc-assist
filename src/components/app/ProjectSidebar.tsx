import { useState, useEffect } from 'react';
import { FolderOpen, Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronRight, PanelLeftClose, PanelLeft } from 'lucide-react';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useLanguage } from '@/contexts/LanguageContext';

const SIDEBAR_COLLAPSED_KEY = 'project-sidebar-collapsed';

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

  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return saved === 'true';
  });
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  }, [collapsed]);

  const t = {
    projects: language === 'fr' ? 'Projets' : 'Projects',
    newProject: language === 'fr' ? 'Nouveau projet' : 'New Project',
    deleteProject: language === 'fr' ? 'Supprimer le projet?' : 'Delete project?',
    deleteProjectDesc: language === 'fr' 
      ? 'Toutes les sources, brouillons et conversations seront supprimés.'
      : 'All sources, drafts, and conversations will be deleted.',
    cancel: language === 'fr' ? 'Annuler' : 'Cancel',
    delete: language === 'fr' ? 'Supprimer' : 'Delete',
    collapse: language === 'fr' ? 'Réduire' : 'Collapse',
    expand: language === 'fr' ? 'Développer' : 'Expand',
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
    <aside className={cn(
      "border-r border-border bg-card flex flex-col h-full transition-all duration-200",
      collapsed ? "w-14" : "w-48"
    )}>
      {/* Toggle button */}
      <div className="p-2 border-b border-border flex justify-end">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {collapsed ? t.expand : t.collapse}
          </TooltipContent>
        </Tooltip>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          {/* Projects Section */}
          {collapsed ? (
            // Collapsed view - icons only
            <div className="space-y-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 mx-auto"
                    onClick={() => createProject()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{t.newProject}</TooltipContent>
              </Tooltip>
              {(projects ?? []).map((project) => (
                <Tooltip key={project.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={currentProjectId === project.id ? "secondary" : "ghost"}
                      size="icon"
                      className={cn(
                        "h-8 w-8 mx-auto",
                        currentProjectId === project.id && "bg-primary/10 text-primary"
                      )}
                      onClick={() => setCurrentProjectId(project.id)}
                    >
                      <FolderOpen className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{project.name}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          ) : (
            // Expanded view - full list
            <Collapsible open={projectsOpen} onOpenChange={setProjectsOpen}>
              <div className="flex items-center justify-between">
                <CollapsibleTrigger className="flex items-center gap-1.5 text-xs font-medium text-foreground hover:text-primary transition-colors">
                  {projectsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  <FolderOpen className="h-3 w-3" />
                  {t.projects}
                </CollapsibleTrigger>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => createProject()}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <CollapsibleContent className="mt-1.5 space-y-0.5">
                {(projects ?? []).map((project) => (
                  <div
                    key={project.id}
                    className={cn(
                      "group flex items-center gap-1.5 px-1.5 py-1 rounded-md text-xs transition-colors cursor-pointer",
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
                          className="h-5 text-xs"
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
                          className="h-4 w-4"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveProjectName();
                          }}
                        >
                          <Check className="h-2.5 w-2.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProjectId(null);
                          }}
                        >
                          <X className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 truncate">{project.name}</span>
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEditProject(project.id, project.name);
                            }}
                          >
                            <Pencil className="h-2.5 w-2.5" />
                          </Button>
                          {(projects?.length ?? 0) > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteProjectId(project.id);
                              }}
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
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
