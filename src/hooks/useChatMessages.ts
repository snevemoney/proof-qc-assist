import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  parentMessageId: string | null;
  isActive: boolean;
  createdAt: Date;
  isStreaming?: boolean;
  editCount: number;
}

const LOCAL_MESSAGES_KEY = 'proofcheck-chat-messages';

export const useChatMessages = (sessionId: string | null) => {
  const { user, isLoading: authLoading } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load messages for the session
  useEffect(() => {
    if (authLoading || !sessionId) return;

    const loadMessages = async () => {
      setIsLoading(true);

      if (user) {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', sessionId)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error loading chat messages:', error);
        }

        if (data) {
          const loadedMessages = data.map(m => ({
            id: m.id,
            sessionId: m.session_id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            parentMessageId: m.parent_message_id,
            isActive: m.is_active,
            createdAt: new Date(m.created_at),
            editCount: m.edit_count || 0,
          }));
          setMessages(loadedMessages);
        }
      } else {
        // Anonymous user
        const stored = localStorage.getItem(`${LOCAL_MESSAGES_KEY}-${sessionId}`);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            const loadedMessages = parsed
              .filter((m: any) => m.isActive !== false)
              .map((m: any) => ({
                ...m,
                createdAt: new Date(m.createdAt),
                editCount: m.editCount || 0,
              }));
            setMessages(loadedMessages);
          } catch (e) {
            console.error('Error parsing stored messages:', e);
          }
        } else {
          setMessages([]);
        }
      }

      setIsLoading(false);
    };

    loadMessages();
  }, [user, authLoading, sessionId]);

  const saveLocalMessages = useCallback((messageList: ChatMessage[]) => {
    if (!user && sessionId) {
      localStorage.setItem(`${LOCAL_MESSAGES_KEY}-${sessionId}`, JSON.stringify(
        messageList.map(m => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
        }))
      ));
    }
  }, [user, sessionId]);

  const addMessage = useCallback(async (
    role: 'user' | 'assistant',
    content: string,
    isStreaming?: boolean
  ): Promise<ChatMessage | null> => {
    if (!sessionId) return null;

    const tempId = `temp-${Date.now()}`;
    const newMessage: ChatMessage = {
      id: tempId,
      sessionId,
      role,
      content,
      parentMessageId: null,
      isActive: true,
      createdAt: new Date(),
      isStreaming,
      editCount: 0,
    };

    // Optimistically add to state
    setMessages(prev => [...prev, newMessage]);

    if (user) {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          role,
          content,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding message:', error);
        // Remove optimistic update on error
        setMessages(prev => prev.filter(m => m.id !== tempId));
        return null;
      }

      // Replace temp message with real one
      const realMessage: ChatMessage = {
        id: data.id,
        sessionId: data.session_id,
        role: data.role as 'user' | 'assistant',
        content: data.content,
        parentMessageId: data.parent_message_id,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        isStreaming,
        editCount: data.edit_count || 0,
      };

      setMessages(prev => prev.map(m => m.id === tempId ? realMessage : m));
      return realMessage;
    } else {
      // For local storage, keep the temp ID
      const localMessage = { ...newMessage, id: `local-msg-${Date.now()}`, editCount: 0 };
      setMessages(prev => prev.map(m => m.id === tempId ? localMessage : m));
      saveLocalMessages([...messages, localMessage]);
      return localMessage;
    }
  }, [user, sessionId, messages, saveLocalMessages]);

  const updateMessage = useCallback(async (messageId: string, content: string) => {
    if (user) {
      const { error } = await supabase
        .from('chat_messages')
        .update({ content })
        .eq('id', messageId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating message:', error);
        return;
      }
    }

    setMessages(prev => {
      const updated = prev.map(m => 
        m.id === messageId ? { ...m, content } : m
      );
      saveLocalMessages(updated);
      return updated;
    });
  }, [user, saveLocalMessages]);

  const updateMessageStreaming = useCallback((messageId: string, content: string, isStreaming: boolean) => {
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, content, isStreaming } : m
    ));
  }, []);

  const editMessageAndFork = useCallback(async (
    messageId: string,
    newContent: string
  ): Promise<{ editedMessage: ChatMessage; removedMessages: ChatMessage[] } | null> => {
    if (!sessionId) return null;

    // Find the message and all messages after it
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return null;

    const targetMessage = messages[messageIndex];
    const subsequentMessages = messages.slice(messageIndex + 1);
    const newEditCount = (targetMessage.editCount || 0) + 1;

    if (user) {
      // Mark old message and subsequent messages as inactive
      const messageIdsToDeactivate = [messageId, ...subsequentMessages.map(m => m.id)];
      
      for (const id of messageIdsToDeactivate) {
        if (!id.startsWith('temp-') && !id.startsWith('local-')) {
          await supabase
            .from('chat_messages')
            .update({ is_active: false })
            .eq('id', id)
            .eq('user_id', user.id);
        }
      }

      // Insert new edited message with incremented edit count
      const { data: newMessage, error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          role: targetMessage.role,
          content: newContent,
          parent_message_id: targetMessage.id,
          is_active: true,
          edit_count: newEditCount,
        })
        .select()
        .single();

      if (error) {
        console.error('Error editing message:', error);
        return null;
      }

      const editedMessage: ChatMessage = {
        id: newMessage.id,
        sessionId: newMessage.session_id,
        role: newMessage.role as 'user' | 'assistant',
        content: newMessage.content,
        parentMessageId: newMessage.parent_message_id,
        isActive: newMessage.is_active,
        createdAt: new Date(newMessage.created_at),
        editCount: newMessage.edit_count || 0,
      };

      // Update local state: remove subsequent messages, replace target with edited
      setMessages(prev => {
        const beforeEdit = prev.slice(0, messageIndex);
        return [...beforeEdit, editedMessage];
      });

      return { editedMessage, removedMessages: subsequentMessages };
    } else {
      // Local storage version
      const editedMessage: ChatMessage = {
        ...targetMessage,
        id: `local-msg-${Date.now()}`,
        content: newContent,
        parentMessageId: targetMessage.id,
        createdAt: new Date(),
        editCount: newEditCount,
      };

      setMessages(prev => {
        const beforeEdit = prev.slice(0, messageIndex);
        const updated = [...beforeEdit, editedMessage];
        saveLocalMessages(updated);
        return updated;
      });

      return { editedMessage, removedMessages: subsequentMessages };
    }
  }, [user, sessionId, messages, saveLocalMessages]);

  const clearMessages = useCallback(async () => {
    if (!sessionId) return;

    if (user) {
      // Mark all messages as inactive
      const { error } = await supabase
        .from('chat_messages')
        .update({ is_active: false })
        .eq('session_id', sessionId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error clearing messages:', error);
        return;
      }
    }

    setMessages([]);
    if (!user) {
      localStorage.removeItem(`${LOCAL_MESSAGES_KEY}-${sessionId}`);
    }
  }, [user, sessionId]);

  // Helper to get messages for API calls (only active, formatted)
  const getMessagesForAPI = useCallback(() => {
    return messages
      .filter(m => m.isActive && !m.isStreaming)
      .map(m => ({
        role: m.role,
        content: m.content,
      }));
  }, [messages]);

  return {
    messages,
    setMessages,
    addMessage,
    updateMessage,
    updateMessageStreaming,
    editMessageAndFork,
    clearMessages,
    getMessagesForAPI,
    isLoading: isLoading || authLoading,
  };
};
