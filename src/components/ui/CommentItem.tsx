import React, { useCallback, useState } from 'react';
import { useApiWithAuth } from '@/hooks';
import { commentService } from '@/services/api';
import { Comment } from '@/services/api/comments.service';
import { LikeButton } from './LikeButton';
import { logError } from '@/utils';
import { formatRelativeTime } from '@/utils/date.utils';

interface CommentItemProps {
  comment: Comment;
  onCommentUpdate?: (commentId: string, newBody: string) => void;
  onCommentDelete?: (commentId: string) => void;
  onReply?: (parentId: string) => void;
  currentUserId?: string;
  className?: string;
  depth?: number;
  // Reply form props
  replyingTo?: string | null;
  replyText?: string;
  setReplyText?: (text: string) => void;
  setReplyingTo?: (id: string | null) => void;
  onSubmitReply?: () => void;
  isSubmitting?: boolean;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onCommentUpdate,
  onCommentDelete,
  onReply,
  currentUserId,
  className = '',
  depth = 0,
  replyingTo,
  replyText = '',
  setReplyText,
  setReplyingTo,
  onSubmitReply,
  isSubmitting: parentIsSubmitting = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [isLoading, setIsLoading] = useState(false);
  const { makeAuthenticatedRequest } = useApiWithAuth();

  const isOwner = currentUserId === comment.user_id;
  const timeAgo = formatRelativeTime(comment.created_at);
  const isReplyingToThis = replyingTo === comment.id;

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSubmitReply?.();
    }
  };

  const handleSaveEdit = useCallback(async () => {
    if (isLoading || editBody.trim() === comment.body) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      await makeAuthenticatedRequest((token) =>
        commentService.updateComment(comment.id, { body: editBody.trim() }, token)
      );
      onCommentUpdate?.(comment.id, editBody.trim());
      setIsEditing(false);
    } catch (error) {
      logError(error, 'CommentItem.handleSaveEdit');
      // Reset edit body on error
      setEditBody(comment.body);
    } finally {
      setIsLoading(false);
    }
  }, [comment.id, comment.body, editBody, isLoading, makeAuthenticatedRequest, onCommentUpdate]);

  const handleCancelEdit = useCallback(() => {
    setEditBody(comment.body);
    setIsEditing(false);
  }, [comment.body]);

  const handleDelete = useCallback(async () => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {return;}

    setIsLoading(true);
    try {
      await makeAuthenticatedRequest((token) =>
        commentService.deleteComment(comment.id, token)
      );
      onCommentDelete?.(comment.id);
    } catch (error) {
      logError(error, 'CommentItem.handleDelete');
    } finally {
      setIsLoading(false);
    }
  }, [comment.id, makeAuthenticatedRequest, onCommentDelete]);

  return (
    <div className={`comment-item comment-glass group rounded-2xl border border-gray-200/50 hover:border-gray-300/50 transition-all duration-300 hover:shadow-lg hover:shadow-gray-100/50 ${className}`}>
      <div className="p-4 sm:p-6">
        {/* Comment Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center overflow-hidden ring-2 ring-white shadow-sm">
                {comment.author_avatar ? (
                  <img
                    src={comment.author_avatar}
                    alt={comment.author_username || `User_${comment.user_id?.slice(0, 8) || 'Unknown'}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-blue-700 text-sm sm:text-base font-semibold">
                    {(comment.author_username || comment.user_id || 'U')[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
            </div>
            
            {/* Author and Time */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-gray-900 truncate">
                  {comment.author_username || `User_${comment.user_id?.slice(0, 8) || 'Unknown'}`}
                </h4>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{timeAgo}</span>
                  {comment.is_edited && (
                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                      edited
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions Menu */}
          {isOwner && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {!isEditing && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    disabled={isLoading}
                    title="Edit comment"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                    disabled={isLoading}
                    title="Delete comment"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Comment Body */}
        {isEditing ? (
          <div className="mb-4">
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              className="w-full p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 focus:bg-white text-gray-900 placeholder:text-gray-500"
              rows={3}
              placeholder="Edit your comment..."
              disabled={isLoading}
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 font-medium flex items-center gap-2"
                disabled={isLoading || editBody.trim() === ''}
              >
                {isLoading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <p className="comment-text text-gray-900 leading-relaxed whitespace-pre-wrap break-words">{comment.body}</p>
          </div>
        )}

        {/* Comment Actions */}
        {!isEditing && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-6">
              {/* Like Button */}
              <div className="flex items-center">
                <LikeButton
                  commentId={comment.id}
                  initialLikeCount={comment.like_count}
                  initialIsLiked={comment.is_liked}
                  size="sm"
                  showCount={true}
                />
              </div>

              {/* Reply Button */}
              {onReply && (
                <button
                  onClick={() => onReply(comment.id)}
                  className="flex items-center gap-2 text-gray-500 hover:text-blue-600 text-sm font-medium transition-colors duration-200 group/reply"
                >
                  <svg className="w-4 h-4 group-hover/reply:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  Reply
                </button>
              )}
            </div>
            
            {/* Additional metadata */}
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>#{comment.id.slice(-6)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Reply Form */}
      {isReplyingToThis && setReplyText && setReplyingTo && onSubmitReply && (
        <div className="comment-reply-form mt-4 animate-in slide-in-from-top-2 duration-200">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200/50">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <p className="text-sm font-medium text-blue-700">
                Replying to @{comment.author_username || `User_${comment.user_id?.slice(0, 8) || 'Unknown'}`}
              </p>
            </div>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Write your reply..."
              className="w-full p-3 border border-blue-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/80 text-gray-900 placeholder:text-gray-500"
              rows={2}
              disabled={parentIsSubmitting}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setReplyingTo(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-white/50 rounded-lg transition-all duration-200"
                disabled={parentIsSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={onSubmitReply}
                disabled={parentIsSubmitting || !replyText.trim()}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 font-medium flex items-center gap-2"
              >
                {parentIsSubmitting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Replying...
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Reply
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="border-t border-gray-100">
          <div className="comment-replies relative p-4 sm:p-6 pt-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-600">
                {comment.replies.length} {comment.replies.length === 1 ? 'Reply' : 'Replies'}
              </span>
            </div>
            <div className="space-y-4 pl-4">
              {comment.replies.map((reply, index) => (
                <div key={reply.id} className="animate-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="relative">
                    {/* Threading line */}
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-300 to-transparent opacity-50"></div>
                    <div className="pl-6">
                      <CommentItem
                        comment={reply}
                        onCommentUpdate={onCommentUpdate}
                        onCommentDelete={onCommentDelete}
                        onReply={depth < 2 ? onReply : undefined} // Limit nesting to 3 levels
                        currentUserId={currentUserId}
                        depth={depth + 1}
                        className="bg-gradient-to-r from-gray-50/50 to-blue-50/30 border-gray-200/30"
                        replyingTo={replyingTo}
                        replyText={replyText}
                        setReplyText={setReplyText}
                        setReplyingTo={setReplyingTo}
                        onSubmitReply={onSubmitReply}
                        isSubmitting={parentIsSubmitting}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};