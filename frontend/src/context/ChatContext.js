import { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchChats = useCallback(async () => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch chats');
      
      const data = await response.json();
      setChats(data);
      
      // Set current chat to the most recent one if none selected
      if (!currentChat && data.length > 0) {
        setCurrentChat(data[0]);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  }, [user, currentChat]);

  const createNewChat = useCallback(async () => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chats/new`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to create new chat');
      
      const { id } = await response.json();
      const newChat = { id, messages: [], createdAt: Date.now() };
      setChats(prev => [newChat, ...prev]);
      setCurrentChat(newChat);
      return newChat;
    } catch (error) {
      console.error('Error creating new chat:', error);
      return null;
    }
  }, [user]);

  const sendMessage = useCallback(async (message) => {
    if (!user || !currentChat) return;
    
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: message,
          chatId: currentChat.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(5);
            if (data === '[DONE]') break;
            
            try {
              const parsed = JSON.parse(data);
              fullResponse += parsed.text;
              
              // Update current chat with streamed response
              setCurrentChat(prev => ({
                ...prev,
                messages: [
                  ...prev.messages,
                  {
                    role: 'assistant',
                    content: fullResponse,
                    timestamp: Date.now(),
                  },
                ],
              }));
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }

      // Refresh chat list after message is sent
      await fetchChats();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [user, currentChat, fetchChats]);

  return (
    <ChatContext.Provider
      value={{
        chats,
        currentChat,
        setCurrentChat,
        loading,
        fetchChats,
        createNewChat,
        sendMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};