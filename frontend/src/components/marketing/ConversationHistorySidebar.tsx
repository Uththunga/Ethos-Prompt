import React, { useEffect, useState } from 'react';
import { conversationService, type Conversation } from '@/services/conversationService';

interface Props {
  onSelect: (conversationId: string) => void;
}

export function ConversationHistorySidebar({ onSelect }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    const unsub = conversationService.subscribeToConversations((items) => {
      setConversations(items);
    }, 25);
    return () => unsub();
  }, []);

  if (conversations.length === 0) {
    return <div className="px-6 py-3 text-xs text-gray-500">No conversations yet</div>;
  }

  return (
    <div className="px-6 py-2 flex flex-col gap-1">
      {conversations.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          className="w-full text-left text-xs px-3 py-2 rounded-lg border border-gray-200 bg-white hover:border-ethos-purple hover:bg-ethos-purple/5 transition-all duration-200 text-gray-700 hover:text-ethos-purple"
        >
          <div className="flex items-center justify-between">
            <span className="font-medium truncate max-w-[70%]">{c.title || 'Conversation'}</span>
            {c.lastMessageAt && (
              <span className="text-xs text-gray-500">
                {c.lastMessageAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          {c.lastMessagePreview && (
            <div className="text-xs text-gray-500 truncate">{c.lastMessagePreview}</div>
          )}
        </button>
      ))}
    </div>
  );
}
