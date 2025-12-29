import { conversationService } from '@/services/conversationService';
import type { MarketingChatMessage } from '@/services/marketingChatService';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseChatMessagesOptions {
  conversationId: string | null;
  isOpen: boolean;
}

/**
 * Manages chat messages with Firestore sync
 * Fixes memory leak from subscription race condition
 */
export function useChatMessages({ conversationId, isOpen }: UseChatMessagesOptions) {
  const [messages, setMessages] = useState<MarketingChatMessage[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Firestore real-time subscription
  useEffect(() => {
    if (!conversationId || !isOpen) {
      return;
    }

    let mounted = true;

    async function setupSubscription() {
      if (!conversationId) return; // Null check for TypeScript

      try {
        unsubscribeRef.current = conversationService.subscribeToMessages(
          conversationId,
          (msgs) => {
            if (mounted) {
              setMessages(prev => {
                // Convert Firestore messages to our format
                const firestoreMessages = msgs.map((m) => ({
                  id: m.id,
                  role: m.role as MarketingChatMessage['role'],
                  content: m.content,
                  timestamp: m.createdAt,
                  sources: m.metadata?.sources,
                  suggested_questions: m.metadata?.suggested_questions,
                }));

                // Find local-only messages (optimistic updates not yet in Firestore)
                const localOnlyMessages = prev.filter(localMsg =>
                  (localMsg.id.startsWith('user-') || localMsg.id.startsWith('assistant-')) &&
                  !firestoreMessages.some(fsMsg =>
                    fsMsg.content === localMsg.content && fsMsg.role === localMsg.role
                  )
                );

                // Merge: Firestore messages first (canonical), then local optimistic updates
                return [...firestoreMessages, ...localOnlyMessages];
              });
            }
          }
        );
      } catch (err) {
        // User not authenticated - skip Firestore, use local state only
        if (mounted && (err as any).code !== 'permission-denied') {
          console.error('Subscription error:', err);
          setError(err as Error);
        }
      }
    }

    setupSubscription();

    return () => {
      mounted = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [conversationId, isOpen]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    setMessages,
    clearMessages,
    error,
  };
}
