import React, { useState, memo } from 'react';
import { MoreVertical, Eye } from 'lucide-react';
import { SocialActions } from './SocialActions';
import { OptimizedImage } from './OptimizedImage';
import { formatRelativeTime } from '@/utils/date.utils';
import type { Camera } from '@/types';

interface CameraCardProps {
  camera: Camera;
  onViewDetails?: (cameraId: string) => void;
  currentUserId?: string;
  variant?: 'grid' | 'list' | 'compact';
  showActions?: boolean;
  className?: string;
}

/**
 * CameraCard Component
 * 
 * Displays a camera with metadata, images, and social interaction options
 */
export const CameraCard: React.FC<CameraCardProps> = memo(({
  camera,
  onViewDetails,
  currentUserId,
  variant = 'grid',
  showActions = true,
  className = ''
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);

  const handleCardClick = () => {
    if (onViewDetails) {
      onViewDetails(camera.id);
    }
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (camera.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % camera.images.length);
    }
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (camera.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + camera.images.length) % camera.images.length);
    }
  };

  const timeAgo = formatRelativeTime(camera.created_at);
  const primaryImage = camera.images[currentImageIndex] || camera.images[0];

  if (variant === 'compact') {
    return (
      <div 
        className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer ${className}`}
        onClick={handleCardClick}
      >
        <div className="relative aspect-square">
          {primaryImage ? (
            <OptimizedImage
              src={primaryImage.image_url}
              alt={`${camera.brand_name} ${camera.model}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">No Image</span>
            </div>
          )}
          
          {/* Image counter */}
          {camera.images.length > 1 && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
              {currentImageIndex + 1}/{camera.images.length}
            </div>
          )}
        </div>
        
        <div className="p-3">
          <h3 className="font-medium text-gray-900 text-sm truncate">
            {camera.brand_name} {camera.model}
          </h3>
          <p className="text-xs text-gray-500 mt-1">@{camera.owner_username}</p>
        </div>
      </div>
    );
  }

  return (
    <article 
      className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center space-x-3 cursor-pointer"
            onClick={handleCardClick}
          >
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
              {camera.owner_avatar ? (
                <OptimizedImage
                  src={camera.owner_avatar}
                  alt={camera.owner_username || 'User'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-600 text-sm font-medium">
                  {(camera.owner_username || 'U')[0].toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {camera.owner_username || 'Anonymous'}
              </p>
              <p className="text-xs text-gray-500">{timeAgo}</p>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Camera Info */}
      <div className="px-4 pb-3">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          {camera.brand_name} {camera.model}
        </h2>
        {camera.year && (
          <p className="text-sm text-gray-600 mb-2">Year: {camera.year}</p>
        )}
        {camera.acquisition_story && (
          <p className="text-gray-600 text-sm line-clamp-3 mb-3">
            {camera.acquisition_story}
          </p>
        )}
        
        {/* Camera Details */}
        <div className="flex flex-wrap gap-2 text-xs">
          {camera.camera_type && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {camera.camera_type}
            </span>
          )}
          {camera.film_format && (
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
              {camera.film_format}
            </span>
          )}
          {camera.condition && (
            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              {camera.condition}
            </span>
          )}
          {camera.is_for_sale && (
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
              For Sale
            </span>
          )}
          {camera.is_for_trade && (
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
              For Trade
            </span>
          )}
        </div>
      </div>

      {/* Images */}
      {camera.images && camera.images.length > 0 && (
        <div className="relative">
          <div className="aspect-square">
            <OptimizedImage
              src={primaryImage.image_url}
              alt={`${camera.brand_name} ${camera.model}`}
              className="w-full h-full object-cover cursor-pointer"
              onClick={handleCardClick}
            />
          </div>
          
          {/* Image Navigation */}
          {camera.images.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
                aria-label="Previous image"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
                aria-label="Next image"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              {/* Image Dots */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                {camera.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                    }`}
                    aria-label={`View image ${index + 1}`}
                  />
                ))}
              </div>
              
              {/* Image Counter */}
              <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                {currentImageIndex + 1}/{camera.images.length}
              </div>
            </>
          )}
        </div>
      )}

      {/* Social Actions */}
      {showActions && (
        <SocialActions
          cameraId={camera.id}
          initialLikeCount={camera.like_count || 0}
          initialIsLiked={camera.is_liked || false}
          initialCommentCount={camera.comment_count || 0}
          currentUserId={currentUserId}
          showComments={showComments}
          className="px-4"
        />
      )}

      {/* Stats Footer */}
      <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {camera.view_count || 0} views
          </span>
        </div>
        <span>{timeAgo}</span>
      </div>
    </article>
  );
});

CameraCard.displayName = 'CameraCard';

export default CameraCard;