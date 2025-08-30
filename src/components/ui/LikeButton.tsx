import React, { useCallback, useState } from 'react';
import { useApiWithAuth } from '@/hooks';
import { likeService } from '@/services/api';
import { logError } from '@/utils';

interface LikeButtonProps {
  discussionId?: string;
  cameraId?: string;
  commentId?: string;
  initialLikeCount: number;
  initialIsLiked: boolean;
  onLikeChange?: (isLiked: boolean, newCount: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

export const LikeButton: React.FC<LikeButtonProps> = ({
  discussionId,
  cameraId,
  commentId,
  initialLikeCount,
  initialIsLiked,
  onLikeChange,
  size = 'md',
  showCount = true,
  className = '',
}) => {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);
  const { makeAuthenticatedRequest } = useApiWithAuth();

  const handleLikeToggle = useCallback(async () => {
    if (isLoading) {return;}

    setIsLoading(true);
    try {
      const likeData = {
        discussion_id: discussionId,
        camera_id: cameraId,
        comment_id: commentId,
      };

      if (isLiked) {
        // Remove like
        await makeAuthenticatedRequest((token) => 
          likeService.removeLike(likeData, token)
        );
        setIsLiked(false);
        setLikeCount(prev => prev - 1);
        onLikeChange?.(false, likeCount - 1);
      } else {
        // Add like
        await makeAuthenticatedRequest((token) => 
          likeService.createLike(likeData, token)
        );
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
        onLikeChange?.(true, likeCount + 1);
      }
    } catch (error) {
      logError(error, 'LikeButton.handleLikeToggle');
      // Optionally show error toast here
    } finally {
      setIsLoading(false);
    }
  }, [isLiked, isLoading, likeCount, discussionId, cameraId, commentId, makeAuthenticatedRequest, onLikeChange]);

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <button
      onClick={handleLikeToggle}
      disabled={isLoading}
      className={`
        flex items-center gap-1 transition-all duration-200 
        ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
        ${sizeClasses[size]}
        ${className}
      `}
      aria-label={isLiked ? 'Unlike' : 'Like'}
    >
      {/* Heart Icon */}
      <svg
        className={`${iconSizeClasses[size]} transition-all duration-200 ${isLiked ? 'fill-current' : 'stroke-current fill-none'}`}
        viewBox="0 0 24 24"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        />
      </svg>
      
      {/* Like Count */}
      {showCount && (
        <span className="font-medium">
          {likeCount}
        </span>
      )}
    </button>
  );
};