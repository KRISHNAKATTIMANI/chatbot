import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import clsx from 'clsx';

export default function ChatMessage({ message }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={clsx(
      'flex w-full mb-4',
      isUser ? 'justify-end' : 'justify-start'
    )}>
      <div className={clsx(
        'max-w-2xl rounded-lg px-4 py-2 shadow-sm',
        isUser ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800'
      )}>
        <ReactMarkdown
          className="prose dark:prose-invert max-w-none"
          components={{
            code({ node, inline, className, children, ...props }) {
              return (
                <code
                  className={clsx(
                    inline ? 'bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded' : 'block p-4 bg-gray-800 text-gray-100 rounded-lg overflow-x-auto',
                    className
                  )}
                  {...props}
                >
                  {children}
                </code>
              );
            },
            a: ({ node, ...props }) => (
              <a
                {...props}
                className="text-blue-500 hover:text-blue-600 underline"
                target="_blank"
                rel="noopener noreferrer"
              />
            ),
          }}
        >
          {message.content}
        </ReactMarkdown>

        {!isUser && (
          <div className="mt-2 flex items-center gap-2">
            <CopyToClipboard text={message.content} onCopy={handleCopy}>
              <button
                className={clsx(
                  'text-xs px-2 py-1 rounded transition-colors',
                  copied ? 'bg-green-500 text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                )}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </CopyToClipboard>
          </div>
        )}
      </div>
    </div>
  );
}