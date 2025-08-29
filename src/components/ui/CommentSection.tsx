import React, { useState, useEffect, useCallback } from 'react';
import { useApiWithAuth } from '@/hooks';
import { commentService } from '@/services/api';
import { Comment } from '@/services/api/comments.service';
import { CommentItem } from './CommentItem';
import { logError } from '@/utils';

interface CommentSectionProps {
  discussionId?: string;
  cameraId?: string;
  currentUserId?: string;
  className?: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  discussionId,
  cameraId,
  currentUserId,
  className = '',
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { makeAuthenticatedRequest } = useApiWithAuth();

  // Load comments
  const loadComments = useCallback(async () => {
    if (!discussionId && !cameraId) return;

    setIsLoading(true);
    try {
      const commentsData = await commentService.getComments({
        discussion_id: discussionId,
        camera_id: cameraId,
        limit: 50,
      });
      setComments(commentsData);
    } catch (error) {
      logError(error, 'CommentSection.loadComments');
    } finally {
      setIsLoading(false);
    }
  }, [discussionId, cameraId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Submit new comment
  const handleSubmitComment = useCallback(async () => {
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const commentData = await makeAuthenticatedRequest((token) =>
        commentService.createComment({
          body: newComment.trim(),
          discussion_id: discussionId,
          camera_id: cameraId,
        }, token)
      );

      setComments(prev => [...prev, commentData]);
      setNewComment('');
    } catch (error) {
      logError(error, 'CommentSection.handleSubmitComment');
      // Show error message to user
    } finally {
      setIsSubmitting(false);
    }
  }, [newComment, isSubmitting, discussionId, cameraId, makeAuthenticatedRequest]);

  // Submit reply
  const handleSubmitReply = useCallback(async () => {
    if (!replyText.trim() || !replyingTo || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const replyData = await makeAuthenticatedRequest((token) =>
        commentService.createComment({
          body: replyText.trim(),
          discussion_id: discussionId,
          camera_id: cameraId,
          parent_id: replyingTo,
        }, token)
      );

      // Add reply to the parent comment in the threaded structure
      const addReplyToComment = (comments: Comment[]): Comment[] => {
        return comments.map(comment => {
          if (comment.id === replyingTo) {
            return {
              ...comment,
              replies: [...(comment.replies || []), replyData]
            };
          }
          // Also check nested replies
          if (comment.replies && comment.replies.length > 0) {
            return {
              ...comment,
              replies: addReplyToComment(comment.replies)
            };
          }
          return comment;
        });
      };

      setComments(prev => addReplyToComment(prev));
      setReplyText('');
      setReplyingTo(null);
    } catch (error) {
      logError(error, 'CommentSection.handleSubmitReply');
    } finally {
      setIsSubmitting(false);
    }
  }, [replyText, replyingTo, isSubmitting, discussionId, cameraId, makeAuthenticatedRequest]);

  // Handle comment update
  const handleCommentUpdate = useCallback((commentId: string, newBody: string) => {
    const updateCommentInTree = (comments: Comment[]): Comment[] => {
      return comments.map(comment => {
        if (comment.id === commentId) {
          return { ...comment, body: newBody, is_edited: true };
        }
        // Recursively check replies
        if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: updateCommentInTree(comment.replies)
          };
        }
        return comment;
      });
    };

    setComments(prev => updateCommentInTree(prev));
  }, []);

  // Handle comment delete
  const handleCommentDelete = useCallback((commentId: string) => {
    const deleteCommentFromTree = (comments: Comment[]): Comment[] => {
      return comments.filter(comment => {
        if (comment.id === commentId) {
          return false; // Remove this comment
        }
        // Recursively filter replies
        if (comment.replies && comment.replies.length > 0) {
          comment.replies = deleteCommentFromTree(comment.replies);
        }
        return true;
      });
    };

    setComments(prev => deleteCommentFromTree(prev));
  }, []);

  // Handle reply action
  const handleReply = useCallback((parentId: string) => {
    setReplyingTo(parentId);
    setReplyText('');
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent, isReply = false) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (isReply) {
        handleSubmitReply();
      } else {
        handleSubmitComment();
      }
    }
  };

  return (
    <div className={`comment-section space-y-6 ${className}`}>
      {/* Comment Form */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">
                Comments
              </h3>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
              <span className="text-sm font-medium text-gray-600">{comments.length}</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="relative">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => handleKeyPress(e, false)}
                placeholder="Share your thoughts..."
                className="w-full p-4 pr-12 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 placeholder:text-gray-500 bg-gray-50/50 focus:bg-white text-gray-900"
                rows={3}
                disabled={isSubmitting}
              />
              <div className="absolute bottom-3 right-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 hidden sm:block">
                    ⌘+Enter
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="hidden sm:inline">Press Ctrl+Enter to submit quickly</span>
                <span className="sm:hidden">Tap to post your comment</span>
              </p>
              <button
                onClick={handleSubmitComment}
                disabled={isSubmitting || !newComment.trim()}
                className="comment-button px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm hover:shadow-md flex items-center gap-2 justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Posting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Post Comment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <div className="relative">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-gray-500">Loading comments...</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12 px-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No comments yet</h4>
          <p className="text-gray-500 max-w-sm mx-auto">Be the first to share your thoughts and start the conversation!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment, index) => (
            <div key={comment.id} className="animate-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${index * 50}ms` }}>
              <CommentItem
                comment={comment}
                onCommentUpdate={handleCommentUpdate}
                onCommentDelete={handleCommentDelete}
                onReply={handleReply}
                currentUserId={currentUserId}
                replyingTo={replyingTo}
                replyText={replyText}
                setReplyText={setReplyText}
                setReplyingTo={setReplyingTo}
                onSubmitReply={handleSubmitReply}
                isSubmitting={isSubmitting}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};