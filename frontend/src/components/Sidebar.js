import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import clsx from 'clsx';

export default function Sidebar({ isDark, toggleDarkMode }) {
  const { logout } = useAuth();
  const { chats, currentChat, setCurrentChat, createNewChat } = useChat();

  const formatDate = (timestamp) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  };

  return (
    <div className="w-64 h-full flex flex-col bg-gray-50 dark:bg-gray-900 border-r dark:border-gray-800">
      {/* Header */}
      <div className="p-4 border-b dark:border-gray-800">
        <button
          onClick={createNewChat}
          className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New Chat
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => setCurrentChat(chat)}
            className={clsx(
              'w-full p-3 text-left transition-colors',
              chat.id === currentChat?.id
                ? 'bg-blue-50 dark:bg-blue-900/20'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
          >
            <div className="text-sm font-medium truncate">
              {chat.messages?.[0]?.content?.slice(0, 30) || 'New Chat'}...
            </div>
            {chat.updatedAt && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formatDate(chat.updatedAt)}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t dark:border-gray-800 space-y-2">
        <button
          onClick={toggleDarkMode}
          className="w-full px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
        <button
          onClick={logout}
          className="w-full px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}