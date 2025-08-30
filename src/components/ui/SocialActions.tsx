import React, { useEffect, useState } from 'react';
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
  postData?: {
    title: string;
    content?: string;
    images?: string[];
    author?: {
      username: string;
      avatar?: string;
    };
    timeAgo?: string;
  };
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
  postData,
}) => {
  const [commentCount, _setCommentCount] = useState(initialCommentCount);
  const [showCommentSection, setShowCommentSection] = useState(showComments);
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Prevent body scroll when modal is open on mobile
  useEffect(() => {
    if (isMobile && showCommentSection) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobile, showCommentSection]);

  const handleToggleComments = () => {
    setShowCommentSection(!showCommentSection);
  };

  const handleCloseModal = () => {
    setShowCommentSection(false);
  };

  return (
    <>
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

        {/* Comment Section - Desktop (inline) */}
        {showCommentSection && !isMobile && (
          <CommentSection
            discussionId={discussionId}
            cameraId={cameraId}
            currentUserId={currentUserId}
          />
        )}
      </div>

      {/* Comment Section - Mobile (modal) */}
      {showCommentSection && isMobile && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-50">
          {/* Modal Header with Back Button */}
          <div className="flex items-center p-4 border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
            <button
              onClick={handleCloseModal}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors duration-200 mr-4 p-2 rounded-lg hover:bg-gray-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-semibold text-base">Back</span>
            </button>
            <h2 className="text-lg font-semibold text-gray-900">Post & Comments</h2>
          </div>

          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Post Content */}
            {postData && (
              <div className="bg-white border-b border-gray-200 p-4">
                {/* Author Header */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className="relative">
                    <img
                      src={postData.author?.avatar || '/default-avatar.jpg'}
                      alt={postData.author?.username || 'User'}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {postData.author?.username || 'Anonymous'}
                    </p>
                    <p className="text-xs text-gray-500">{postData.timeAgo}</p>
                  </div>
                </div>

                {/* Post Title */}
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  {postData.title}
                </h2>

                {/* Post Content */}
                {postData.content && postData.content.trim() && (
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                    {postData.content}
                  </p>
                )}

                {/* Post Images */}
                {postData.images && postData.images.length > 0 && (
                  <div className="mb-4">
                    <div className={`grid gap-2 ${postData.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {postData.images.slice(0, 4).map((image: string, idx: number) => (
                        <div key={idx} className="relative aspect-square">
                          <img
                            src={image}
                            alt={`Image ${idx + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          {postData.images!.length > 4 && idx === 3 && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                              <span className="text-white text-xl font-semibold">
                                +{postData.images!.length - 4}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social Actions in Modal */}
                <div className="flex items-center justify-between py-2 border-t border-gray-200">
                  <div className="flex items-center gap-6">
                    <LikeButton
                      discussionId={discussionId}
                      cameraId={cameraId}
                      initialLikeCount={initialLikeCount}
                      initialIsLiked={initialIsLiked}
                      size="md"
                      showCount={true}
                    />
                    <div className="flex items-center gap-2 text-gray-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      <span className="font-medium">{commentCount}</span>
                      <span>{commentCount === 1 ? 'Comment' : 'Comments'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div className="p-4">
              <CommentSection
                discussionId={discussionId}
                cameraId={cameraId}
                currentUserId={currentUserId}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};