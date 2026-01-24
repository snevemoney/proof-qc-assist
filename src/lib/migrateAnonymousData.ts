import { supabase } from '@/integrations/supabase/client';

interface LocalProject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface LocalProjectState {
  sources: unknown[];
  draftText: string;
  claims: unknown[];
  interventions: unknown[];
  summary: unknown | null;
  chatMessages: unknown[];
  activeTab: string;
  strictMode: boolean;
  hasVerified: boolean;
}

interface LocalChatSession {
  id: string;
  projectId: string | null;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface LocalChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  parentMessageId: string | null;
  isActive: boolean;
  createdAt: string;
}

const LOCAL_PROJECTS_KEY = 'proofcheck-projects';
const LOCAL_PROJECT_PREFIX = 'proofcheck-project-';
const LOCAL_SESSIONS_PREFIX = 'proofcheck-chat-sessions-';
const LOCAL_MESSAGES_PREFIX = 'proofcheck-chat-messages-';
const LOCAL_VERIFICATION_PREFIX = 'proofcheck-verification-history-';

/**
 * Migrates all anonymous user data from localStorage to Supabase
 * @param userId - The authenticated user's ID
 * @returns true if migration was successful, false otherwise
 */
export async function migrateAnonymousData(userId: string): Promise<boolean> {
  try {
    // Get all local projects
    const localProjectsJson = localStorage.getItem(LOCAL_PROJECTS_KEY);
    if (!localProjectsJson) {
      console.log('No anonymous projects to migrate');
      return false;
    }

    const localProjects: LocalProject[] = JSON.parse(localProjectsJson);
    if (localProjects.length === 0) {
      return false;
    }

    console.log(`Migrating ${localProjects.length} anonymous projects...`);

    // Maps to track old ID -> new ID relationships
    const projectIdMap = new Map<string, string>();
    const sessionIdMap = new Map<string, string>();

    // Step 1: Migrate projects
    for (const localProject of localProjects) {
      // Get the full project state
      const projectStateJson = localStorage.getItem(`${LOCAL_PROJECT_PREFIX}${localProject.id}`);
      const projectState: LocalProjectState = projectStateJson 
        ? JSON.parse(projectStateJson) 
        : {
            sources: [],
            draftText: '',
            claims: [],
            interventions: [],
            summary: null,
            chatMessages: [],
            activeTab: 'sources',
            strictMode: false,
            hasVerified: false,
          };

      // Insert project into database
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: userId,
          name: localProject.name,
          sources: projectState.sources as never,
          draft_text: projectState.draftText,
          claims: projectState.claims as never,
          interventions: projectState.interventions as never,
          summary: projectState.summary as never,
          chat_messages: projectState.chatMessages as never,
          active_tab: projectState.activeTab,
          strict_mode: projectState.strictMode,
          has_verified: projectState.hasVerified,
          created_at: localProject.createdAt,
          updated_at: localProject.updatedAt,
        })
        .select()
        .single();

      if (projectError) {
        console.error('Error migrating project:', projectError);
        continue;
      }

      projectIdMap.set(localProject.id, newProject.id);
      console.log(`Migrated project: ${localProject.name} (${localProject.id} -> ${newProject.id})`);

      // Step 2: Migrate chat sessions for this project
      const sessionsJson = localStorage.getItem(`${LOCAL_SESSIONS_PREFIX}${localProject.id}`);
      if (sessionsJson) {
        const localSessions: LocalChatSession[] = JSON.parse(sessionsJson);
        
        for (const localSession of localSessions) {
          const { data: newSession, error: sessionError } = await supabase
            .from('chat_sessions')
            .insert({
              user_id: userId,
              project_id: newProject.id,
              name: localSession.name,
              created_at: localSession.createdAt,
              updated_at: localSession.updatedAt,
            })
            .select()
            .single();

          if (sessionError) {
            console.error('Error migrating session:', sessionError);
            continue;
          }

          sessionIdMap.set(localSession.id, newSession.id);
          console.log(`Migrated session: ${localSession.name}`);

          // Step 3: Migrate chat messages for this session
          const messagesJson = localStorage.getItem(`${LOCAL_MESSAGES_PREFIX}${localSession.id}`);
          if (messagesJson) {
            const localMessages: LocalChatMessage[] = JSON.parse(messagesJson);
            
            // We need to insert messages in order and track ID mapping for parent references
            const messageIdMap = new Map<string, string>();
            
            for (const localMessage of localMessages) {
              // Determine the new parent message ID if it exists
              let newParentMessageId: string | null = null;
              if (localMessage.parentMessageId) {
                newParentMessageId = messageIdMap.get(localMessage.parentMessageId) || null;
              }

              const { data: newMessage, error: messageError } = await supabase
                .from('chat_messages')
                .insert({
                  user_id: userId,
                  session_id: newSession.id,
                  role: localMessage.role,
                  content: localMessage.content,
                  parent_message_id: newParentMessageId,
                  is_active: localMessage.isActive,
                  created_at: localMessage.createdAt,
                })
                .select()
                .single();

              if (messageError) {
                console.error('Error migrating message:', messageError);
                continue;
              }

              messageIdMap.set(localMessage.id, newMessage.id);
            }
            
            console.log(`Migrated ${localMessages.length} messages for session`);
          }
        }
      }

      // Step 4: Migrate verification history for this project
      const historyJson = localStorage.getItem(`${LOCAL_VERIFICATION_PREFIX}${localProject.id}`);
      if (historyJson) {
        try {
          const localHistory = JSON.parse(historyJson);
          if (Array.isArray(localHistory) && localHistory.length > 0) {
            for (const historyEntry of localHistory) {
              await supabase
                .from('verification_history')
                .insert({
                  user_id: userId,
                  project_id: newProject.id,
                  claims: historyEntry.claims || [],
                  interventions: historyEntry.interventions || [],
                  draft_text: historyEntry.draftText || '',
                  sources_snapshot: historyEntry.sourcesSnapshot || [],
                  summary: historyEntry.summary || null,
                  strict_mode: historyEntry.strictMode || false,
                  created_at: historyEntry.createdAt || new Date().toISOString(),
                });
            }
            console.log(`Migrated ${localHistory.length} verification history entries`);
          }
        } catch (e) {
          console.error('Error parsing verification history:', e);
        }
      }
    }

    // Step 5: Clear all migrated localStorage data
    clearAnonymousData(localProjects);

    console.log('Migration complete!');
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
}

/**
 * Clears all anonymous data from localStorage after successful migration
 */
function clearAnonymousData(localProjects: LocalProject[]) {
  // Clear main projects list
  localStorage.removeItem(LOCAL_PROJECTS_KEY);

  // Clear project-specific data
  for (const project of localProjects) {
    localStorage.removeItem(`${LOCAL_PROJECT_PREFIX}${project.id}`);
    
    // Get sessions for this project to clear their messages
    const sessionsJson = localStorage.getItem(`${LOCAL_SESSIONS_PREFIX}${project.id}`);
    if (sessionsJson) {
      const sessions: LocalChatSession[] = JSON.parse(sessionsJson);
      for (const session of sessions) {
        localStorage.removeItem(`${LOCAL_MESSAGES_PREFIX}${session.id}`);
      }
    }
    
    localStorage.removeItem(`${LOCAL_SESSIONS_PREFIX}${project.id}`);
    localStorage.removeItem(`${LOCAL_VERIFICATION_PREFIX}${project.id}`);
  }

  console.log('Cleared anonymous data from localStorage');
}

/**
 * Checks if there is any anonymous data to migrate
 */
export function hasAnonymousData(): boolean {
  const localProjectsJson = localStorage.getItem(LOCAL_PROJECTS_KEY);
  if (!localProjectsJson) return false;
  
  try {
    const projects = JSON.parse(localProjectsJson);
    return Array.isArray(projects) && projects.length > 0;
  } catch {
    return false;
  }
}
