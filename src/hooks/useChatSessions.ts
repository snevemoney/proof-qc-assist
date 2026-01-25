import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ChatSession {
  id: string;
  projectId: string | null;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const LOCAL_SESSIONS_KEY = 'proofcheck-chat-sessions';

export const useChatSessions = (projectId: string | null) => {
  const { user, isLoading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load sessions for the project
  useEffect(() => {
    if (authLoading || !projectId) return;

    const loadSessions = async () => {
      setIsLoading(true);

      if (user) {
        const { data, error } = await supabase
          .from('chat_sessions')
          .select('id, project_id, name, created_at, updated_at')
          .eq('project_id', projectId)
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        if (error) {
          console.error('Error loading chat sessions:', error);
        }

        if (data && data.length > 0) {
          const loadedSessions = data.map(s => ({
            id: s.id,
            projectId: s.project_id,
            name: s.name || 'New Chat',
            createdAt: new Date(s.created_at || Date.now()),
            updatedAt: new Date(s.updated_at || Date.now()),
          }));
          setSessions(loadedSessions);
          
          if (!currentSessionId || !loadedSessions.find(s => s.id === currentSessionId)) {
            setCurrentSessionId(loadedSessions[0].id);
          }
        } else {
          // Create default session
          const { data: newSession, error: createError } = await supabase
            .from('chat_sessions')
            .insert({
              project_id: projectId,
              user_id: user.id,
              name: 'New Chat',
            })
            .select('id, project_id, name, created_at, updated_at')
            .single();

          if (createError) {
            console.error('Error creating default session:', createError);
          } else if (newSession) {
            const session: ChatSession = {
              id: newSession.id,
              projectId: newSession.project_id,
              name: newSession.name || 'New Chat',
              createdAt: new Date(newSession.created_at || Date.now()),
              updatedAt: new Date(newSession.updated_at || Date.now()),
            };
            setSessions([session]);
            setCurrentSessionId(session.id);
          }
        }
      } else {
        // Anonymous user - use localStorage
        const stored = localStorage.getItem(`${LOCAL_SESSIONS_KEY}-${projectId}`);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            const loadedSessions = parsed.map((s: any) => ({
              ...s,
              createdAt: new Date(s.createdAt),
              updatedAt: new Date(s.updatedAt),
            }));
            setSessions(loadedSessions);
            if ((loadedSessions?.length ?? 0) > 0 && !currentSessionId) {
              setCurrentSessionId(loadedSessions[0].id);
            }
          } catch (e) {
            console.error('Error parsing stored sessions:', e);
          }
        }
        
        if ((sessions?.length ?? 0) === 0) {
          const defaultSession: ChatSession = {
            id: `local-session-${Date.now()}`,
            projectId,
            name: 'New Chat',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          setSessions([defaultSession]);
          setCurrentSessionId(defaultSession.id);
          localStorage.setItem(`${LOCAL_SESSIONS_KEY}-${projectId}`, JSON.stringify([defaultSession]));
        }
      }

      setIsLoading(false);
    };

    loadSessions();
  }, [user, authLoading, projectId]);

  const saveLocalSessions = useCallback((sessionList: ChatSession[]) => {
    if (!user && projectId) {
      localStorage.setItem(`${LOCAL_SESSIONS_KEY}-${projectId}`, JSON.stringify(
        sessionList.map(s => ({
          ...s,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
        }))
      ));
    }
  }, [user, projectId]);

  const createSession = useCallback(async (name: string = 'New Chat'): Promise<ChatSession | null> => {
    if (!projectId) return null;

    if (user) {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          project_id: projectId,
          user_id: user.id,
          name,
        })
        .select('id, project_id, name, created_at, updated_at')
        .single();

      if (error) {
        console.error('Error creating session:', error);
        return null;
      }

      const newSession: ChatSession = {
        id: data.id,
        projectId: data.project_id,
        name: data.name || name,
        createdAt: new Date(data.created_at || Date.now()),
        updatedAt: new Date(data.updated_at || Date.now()),
      };

      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      return newSession;
    } else {
      const newSession: ChatSession = {
        id: `local-session-${Date.now()}`,
        projectId,
        name,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const newList = [newSession, ...sessions];
      setSessions(newList);
      setCurrentSessionId(newSession.id);
      saveLocalSessions(newList);
      return newSession;
    }
  }, [user, projectId, sessions, saveLocalSessions]);

  const renameSession = useCallback(async (sessionId: string, newName: string) => {
    if (user) {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ name: newName, updated_at: new Date().toISOString() })
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error renaming session:', error);
        return;
      }
    }

    setSessions(prev => {
      const updated = prev.map(s => 
        s.id === sessionId ? { ...s, name: newName, updatedAt: new Date() } : s
      );
      saveLocalSessions(updated);
      return updated;
    });
  }, [user, saveLocalSessions]);

  const deleteSession = useCallback(async (sessionId: string) => {
    if (user) {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting session:', error);
        return;
      }
    }

    setSessions(prev => {
      const updated = prev.filter(s => s.id !== sessionId);
      saveLocalSessions(updated);
      
      if (currentSessionId === sessionId && updated.length > 0) {
        setCurrentSessionId(updated[0].id);
      } else if (updated.length === 0) {
        // Create a new session if we deleted the last one
        createSession();
      }
      
      return updated;
    });
  }, [user, currentSessionId, saveLocalSessions, createSession]);

  const currentSession = sessions.find(s => s.id === currentSessionId) || null;

  return {
    sessions,
    currentSession,
    currentSessionId,
    setCurrentSessionId,
    createSession,
    renameSession,
    deleteSession,
    isLoading: isLoading || authLoading,
  };
};
