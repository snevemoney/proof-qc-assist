import React, { createContext, useContext, ReactNode } from 'react';
import { useProjects, Project } from '@/hooks/useProjects';
import { useChatSessions, ChatSession } from '@/hooks/useChatSessions';

interface ProjectContextType {
  // Projects
  projects: Project[];
  currentProject: Project | null;
  currentProjectId: string | null;
  setCurrentProjectId: (id: string | null) => void;
  createProject: (name?: string) => Promise<Project | null>;
  renameProject: (projectId: string, newName: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  projectsLoading: boolean;
  
  // Chat Sessions
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  currentSessionId: string | null;
  setCurrentSessionId: (id: string | null) => void;
  createSession: (name?: string) => Promise<ChatSession | null>;
  renameSession: (sessionId: string, newName: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  sessionsLoading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectContextProvider = ({ children }: { children: ReactNode }) => {
  const {
    projects,
    currentProject,
    currentProjectId,
    setCurrentProjectId,
    createProject,
    renameProject,
    deleteProject,
    isLoading: projectsLoading,
  } = useProjects();

  const {
    sessions,
    currentSession,
    currentSessionId,
    setCurrentSessionId,
    createSession,
    renameSession,
    deleteSession,
    isLoading: sessionsLoading,
  } = useChatSessions(currentProjectId);

  return (
    <ProjectContext.Provider value={{
      projects,
      currentProject,
      currentProjectId,
      setCurrentProjectId,
      createProject,
      renameProject,
      deleteProject,
      projectsLoading,
      sessions,
      currentSession,
      currentSessionId,
      setCurrentSessionId,
      createSession,
      renameSession,
      deleteSession,
      sessionsLoading,
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjectContext = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjectContext must be used within a ProjectContextProvider');
  }
  return context;
};
