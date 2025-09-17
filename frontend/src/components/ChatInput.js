import { useState } from 'react';
import { useChat } from '@/context/ChatContext';

export default function ChatInput() {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { sendMessage, currentChat } = useChat();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || !currentChat || isLoading) return;

    try {
      setIsLoading(true);
      await sendMessage(message.trim());
      setMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-4 border-t dark:border-gray-700">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        className="flex-1 p-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={isLoading || !currentChat}
      />
      <button
        type="submit"
        disabled={isLoading || !message.trim() || !currentChat}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Sending...' : 'Send'}
      </button>
    </form>
  );
}