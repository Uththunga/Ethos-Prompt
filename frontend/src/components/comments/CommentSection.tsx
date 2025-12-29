import {
    ChatBubbleLeftIcon,
    EllipsisVerticalIcon,
    HeartIcon,
    PaperAirplaneIcon,
    ReplyIcon,
} from '@/components/icons';
import React, { useCallback, useEffect, useState } from 'react';
// import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../marketing/ui/button';

interface Comment {
  id: string;
  content: string;
  user: {
    id: string;
    display_name: string;
    photo_url?: string;
    role: string;
  };
  created_at: string | Date | { toDate: () => Date };
  updated_at: string | Date | { toDate: () => Date };
  likes: number;
  replies_count: number;
  replies?: Comment[];
  comment_type: string;
  metadata?: {
    edited: boolean;
    flagged: boolean;
  };
}

interface CommentSectionProps {
  promptId: string;
  allowComments?: boolean;
}

interface FirebaseResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  comments?: Comment[];
}

const CommentSection: React.FC<CommentSectionProps> = ({ promptId, allowComments = true }) => {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    if (promptId) {
      loadComments();
    }
  }, [promptId, loadComments]);

  const loadComments = useCallback(async () => {
    try {
      setLoading(true);
      const getComments = httpsCallable(functions, 'get_comments');
      const result = await getComments({ prompt_id: promptId });
      const data = result.data as FirebaseResponse;

      if (data.success) {
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  }, [promptId]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !currentUser) return;

    try {
      setSubmitting(true);
      const addComment = httpsCallable(functions, 'add_comment');

      const result = await addComment({
        prompt_id: promptId,
        content: newComment,
        type: 'comment',
      });

      const data = result.data as FirebaseResponse;

      if (data.success) {
        setNewComment('');
        loadComments(); // Reload comments
      } else {
        throw new Error(data.error || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim() || !currentUser) return;

    try {
      setSubmitting(true);
      const addComment = httpsCallable(functions, 'add_comment');

      const result = await addComment({
        prompt_id: promptId,
        content: replyContent,
        type: 'comment',
        parent_id: parentId,
      });

      const data = result.data as FirebaseResponse;

      if (data.success) {
        setReplyContent('');
        setReplyingTo(null);
        loadComments(); // Reload comments
      } else {
        throw new Error(data.error || 'Failed to add reply');
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      alert('Failed to add reply. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!currentUser) return;

    try {
      // This would be implemented as a separate Cloud Function
      console.log('Like comment:', commentId);
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const formatDate = (timestamp: string | Date | { toDate: () => Date }) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return (
      date.toLocaleDateString() +
      ' ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  };

  const getRoleColor = (role: string) => {
    const colors = {
      super_admin: 'text-purple-600',
      admin: 'text-ethos-purple',
      user: 'text-gray-600',
    };
    return colors[role as keyof typeof colors] || colors.user;
  };

  if (!allowComments) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <ChatBubbleLeftIcon className="mx-auto h-8 w-8 text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">Comments are disabled for this prompt</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Comment Input */}
      {currentUser && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              {currentUser.photoURL ? (
                <img
                  className="h-8 w-8 rounded-full"
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'User'}
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-ethos-purple focus:border-ethos-purple resize-none"
              />
              <div className="mt-3 flex justify-end">
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || submitting}
                  variant="ethos"
                  size="sm"
                  className="inline-flex items-center"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Posting...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                      Post Comment
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ethos-purple mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading comments...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <ChatBubbleLeftIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No comments yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              {currentUser ? 'Be the first to comment!' : 'Sign in to add a comment.'}
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-white rounded-lg border border-gray-200 p-4">
              {/* Comment Header */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {comment.user.photo_url ? (
                    <img
                      className="h-8 w-8 rounded-full"
                      src={comment.user.photo_url}
                      alt={comment.user.display_name}
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {comment.user.display_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-gray-900">
                      {comment.user.display_name}
                    </h4>
                    <span className={`text-xs font-medium ${getRoleColor(comment.user.role)}`}>
                      {comment.user.role}
                    </span>
                    <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
                    {comment.metadata?.edited && (
                      <span className="text-xs text-gray-400">(edited)</span>
                    )}
                  </div>

                  {/* Comment Content */}
                  <div className="mt-2">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                  </div>

                  {/* Comment Actions */}
                  <div className="mt-3 flex items-center gap-4">
                    <button
                      onClick={() => handleLikeComment(comment.id)}
                      className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600"
                    >
                      <HeartIcon className="h-4 w-4" />
                      <span>{comment.likes}</span>
                    </button>

                    {currentUser && (
                      <button
                        onClick={() => setReplyingTo(comment.id)}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-ethos-purple"
                      >
                        <ReplyIcon className="h-4 w-4" />
                        <span>Reply</span>
                      </button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-gray-700 p-1"
                    >
                      <EllipsisVerticalIcon className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Reply Input */}
                  {replyingTo === comment.id && (
                    <div className="mt-4 ml-4 border-l-2 border-gray-200 pl-4">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write a reply..."
                        rows={2}
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-ethos-purple focus:border-ethos-purple resize-none"
                      />
                      <div className="mt-2 flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyContent('');
                          }}
                          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                        <Button
                          onClick={() => handleSubmitReply(comment.id)}
                          disabled={!replyContent.trim() || submitting}
                          variant="ethos"
                          size="sm"
                          className="px-3 py-1 text-sm"
                        >
                          Reply
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 ml-4 border-l-2 border-gray-200 pl-4">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            {reply.user.photo_url ? (
                              <img
                                className="h-6 w-6 rounded-full"
                                src={reply.user.photo_url}
                                alt={reply.user.display_name}
                              />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-600">
                                  {reply.user.display_name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h5 className="text-sm font-medium text-gray-900">
                                {reply.user.display_name}
                              </h5>
                              <span className="text-xs text-gray-500">
                                {formatDate(reply.created_at)}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                              {reply.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;
