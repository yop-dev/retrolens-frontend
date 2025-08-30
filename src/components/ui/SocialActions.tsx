import React, { useState } from 'react';
import { LikeButton } from './LikeButton';
import { CommentSection } from './CommentSection';

interface SocialActionsProps {
  discussionId?: string;
  cameraId?: string;
  initialLikeCount: number;
  initialIsLiked: boolean;
  initialCommentCount: number;
  currentUserId?: string;
  showComments?: boolean;
  className?: string;
}

export const SocialActions: React.FC<SocialActionsProps> = ({
  discussionId,
  cameraId,
  initialLikeCount,
  initialIsLiked,
  initialCommentCount,
  currentUserId,
  showComments = false,
  className = '',
}) => {
  const [commentCount, _setCommentCount] = useState(initialCommentCount);
  const [showCommentSection, setShowCommentSection] = useState(showComments);

  const handleToggleComments = () => {
    setShowCommentSection(!showCommentSection);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Action Bar */}
      <div className="flex items-center justify-between py-2 border-t border-gray-200">
        <div className="flex items-center gap-6">
          {/* Like Button */}
          <LikeButton
            discussionId={discussionId}
            cameraId={cameraId}
            initialLikeCount={initialLikeCount}
            initialIsLiked={initialIsLiked}
            size="md"
            showCount={true}
          />

          {/* Comment Button */}
          <button
            onClick={handleToggleComments}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span className="font-medium">{commentCount}</span>
            <span className="hidden sm:inline">
              {commentCount === 1 ? 'Comment' : 'Comments'}
            </span>
          </button>

          {/* Share Button (Optional) */}
          <button className="flex items-center gap-2 text-gray-500 hover:text-green-600 transition-colors duration-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
              />
            </svg>
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>

        {/* View Count or Additional Info */}
        <div className="text-sm text-gray-500">
          {/* This could show view count or other metrics */}
        </div>
      </div>

      {/* Comment Section */}
      {showCommentSection && (
        <CommentSection
          discussionId={discussionId}
          cameraId={cameraId}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
};