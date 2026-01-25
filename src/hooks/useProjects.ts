import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Json } from '@/integrations/supabase/types';

export interface Project {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const LOCAL_PROJECTS_KEY = 'proofcheck-projects';

export const useProjects = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load projects
  useEffect(() => {
    if (authLoading) return;

    const loadProjects = async () => {
      setIsLoading(true);

      if (user) {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name, created_at, updated_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        if (error) {
          console.error('Error loading projects:', error);
        }

        if (data && data.length > 0) {
          const loadedProjects = data.map(p => ({
            id: p.id,
            name: p.name || 'My Project',
            createdAt: new Date(p.created_at || Date.now()),
            updatedAt: new Date(p.updated_at || Date.now()),
          }));
          setProjects(loadedProjects);
          
          // Set current project to most recently updated
          if (!currentProjectId || !loadedProjects.find(p => p.id === currentProjectId)) {
            setCurrentProjectId(loadedProjects[0].id);
          }
        } else {
          // Create default project for new users
          const { data: newProject, error: createError } = await supabase
            .from('projects')
            .insert({
              user_id: user.id,
              name: 'My Project',
              sources: [] as unknown as Json,
              claims: [] as unknown as Json,
              chat_messages: [] as unknown as Json,
            })
            .select('id, name, created_at, updated_at')
            .single();

          if (createError) {
            console.error('Error creating default project:', createError);
          } else if (newProject) {
            const project = {
              id: newProject.id,
              name: newProject.name || 'My Project',
              createdAt: new Date(newProject.created_at || Date.now()),
              updatedAt: new Date(newProject.updated_at || Date.now()),
            };
            setProjects([project]);
            setCurrentProjectId(project.id);
          }
        }
      } else {
        // Anonymous user - use localStorage
        const stored = localStorage.getItem(LOCAL_PROJECTS_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            const loadedProjects = parsed.map((p: any) => ({
              ...p,
              createdAt: new Date(p.createdAt),
              updatedAt: new Date(p.updatedAt),
            }));
            setProjects(loadedProjects);
            if ((loadedProjects?.length ?? 0) > 0 && !currentProjectId) {
              setCurrentProjectId(loadedProjects[0].id);
            }
          } catch (e) {
            console.error('Error parsing stored projects:', e);
          }
        }
        
        if ((projects?.length ?? 0) === 0) {
          const defaultProject: Project = {
            id: 'local-project-1',
            name: 'My Project',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          setProjects([defaultProject]);
          setCurrentProjectId(defaultProject.id);
          localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify([defaultProject]));
        }
      }

      setIsLoading(false);
    };

    loadProjects();
  }, [user, authLoading]);

  // Save local projects to localStorage
  const saveLocalProjects = useCallback((projectList: Project[]) => {
    if (!user) {
      localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(
        projectList.map(p => ({
          ...p,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        }))
      ));
    }
  }, [user]);

  const createProject = useCallback(async (name: string = 'New Project'): Promise<Project | null> => {
    if (user) {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name,
          sources: [] as unknown as Json,
          claims: [] as unknown as Json,
          chat_messages: [] as unknown as Json,
        })
        .select('id, name, created_at, updated_at')
        .single();

      if (error) {
        console.error('Error creating project:', error);
        return null;
      }

      const newProject: Project = {
        id: data.id,
        name: data.name || name,
        createdAt: new Date(data.created_at || Date.now()),
        updatedAt: new Date(data.updated_at || Date.now()),
      };

      setProjects(prev => [newProject, ...prev]);
      setCurrentProjectId(newProject.id);
      return newProject;
    } else {
      // Local project for anonymous users
      const newProject: Project = {
        id: `local-project-${Date.now()}`,
        name,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const newList = [newProject, ...projects];
      setProjects(newList);
      setCurrentProjectId(newProject.id);
      saveLocalProjects(newList);
      return newProject;
    }
  }, [user, projects, saveLocalProjects]);

  const renameProject = useCallback(async (projectId: string, newName: string) => {
    if (user) {
      const { error } = await supabase
        .from('projects')
        .update({ name: newName, updated_at: new Date().toISOString() })
        .eq('id', projectId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error renaming project:', error);
        return;
      }
    }

    setProjects(prev => {
      const updated = prev.map(p => 
        p.id === projectId ? { ...p, name: newName, updatedAt: new Date() } : p
      );
      saveLocalProjects(updated);
      return updated;
    });
  }, [user, saveLocalProjects]);

  const deleteProject = useCallback(async (projectId: string) => {
    // Don't delete if it's the only project
    if (projects.length <= 1) {
      console.warn('Cannot delete the only project');
      return;
    }

    if (user) {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting project:', error);
        return;
      }
    }

    setProjects(prev => {
      const updated = prev.filter(p => p.id !== projectId);
      saveLocalProjects(updated);
      
      // Switch to another project if we deleted the current one
      if (currentProjectId === projectId && updated.length > 0) {
        setCurrentProjectId(updated[0].id);
      }
      
      return updated;
    });
  }, [user, projects, currentProjectId, saveLocalProjects]);

  const currentProject = projects.find(p => p.id === currentProjectId) || null;

  return {
    projects,
    currentProject,
    currentProjectId,
    setCurrentProjectId,
    createProject,
    renameProject,
    deleteProject,
    isLoading: isLoading || authLoading,
  };
};
