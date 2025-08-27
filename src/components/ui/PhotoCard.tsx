import React, { useState, memo } from 'react';
import { Heart, MessageCircle, Share2, MoreVertical, Eye } from 'lucide-react';
import type { BaseComponentProps } from '@/types';

export interface PhotoData {
  id: string;
  originalUrl: string;
  colorizedUrl?: string;
  title?: string;
  description?: string;
  username: string;
  userAvatar?: string;
  likes: number;
  comments: number;
  views: number;
  isLiked?: boolean;
  tags?: string[];
  createdAt: Date;
}

interface PhotoCardProps extends BaseComponentProps {
  photo: PhotoData;
  onLike?: (photoId: string) => void;
  onComment?: (photoId: string) => void;
  onShare?: (photoId: string) => void;
  onViewDetails?: (photoId: string) => void;
  variant?: 'grid' | 'list' | 'compact';
  showActions?: boolean;
}

/**
 * PhotoCard Component
 * 
 * Displays a photo with metadata and interaction options
 * 
 * @example
 * <PhotoCard 
 *   photo={photoData}
 *   onLike={(id) => handleLike(id)}
 *   variant="grid"
 * />
 */
export const PhotoCard: React.FC<PhotoCardProps> = memo(({
  photo,
  onLike,
  onComment,
  onShare,
  onViewDetails,
  variant = 'grid',
  showActions = true,
  className = ''
}) => {
  const [isShowingOriginal, setIsShowingOriginal] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLike) {
      onLike(photo.id);
    }
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onComment) {
      onComment(photo.id);
    }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShare) {
      onShare(photo.id);
    }
  };

  const handleCardClick = () => {
    if (onViewDetails) {
      onViewDetails(photo.id);
    }
  };

  const currentImageUrl = isShowingOriginal ? photo.originalUrl : (photo.colorizedUrl || photo.originalUrl);

  if (variant === 'compact') {
    return (
      <div 
        className={`photo-card photo-card--compact ${className}`}
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        aria-label={`Photo by ${photo.username}`}
      >
        <div className="photo-card__image-container">
          {!imageLoaded && <div className="photo-card__skeleton" />}
          {imageError ? (
            <div className="photo-card__error">
              <Eye size={24} />
              <span>Unable to load image</span>
            </div>
          ) : (
            <img
              src={currentImageUrl}
              alt={photo.title || 'Photo'}
              className="photo-card__image"
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading="lazy"
            />
          )}
          {showActions && (
            <button
              className={`photo-card__like-overlay ${photo.isLiked ? 'photo-card__like-overlay--liked' : ''}`}
              onClick={handleLikeClick}
              aria-label={photo.isLiked ? 'Unlike photo' : 'Like photo'}
            >
              <Heart size={16} fill={photo.isLiked ? 'currentColor' : 'none'} />
              {photo.likes > 0 && <span>{photo.likes}</span>}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`photo-card photo-card--${variant} ${className}`}
      onClick={handleCardClick}
      role="article"
      aria-label={`Photo by ${photo.username}`}
    >
      <div className="photo-card__image-container">
        {!imageLoaded && <div className="photo-card__skeleton" />}
        {imageError ? (
          <div className="photo-card__error">
            <Eye size={32} />
            <span>Unable to load image</span>
          </div>
        ) : (
          <img
            src={currentImageUrl}
            alt={photo.title || 'Photo'}
            className="photo-card__image"
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
          />
        )}
        
        {photo.colorizedUrl && (
          <div className="photo-card__toggle-container">
            <button
              className={`photo-card__toggle ${!isShowingOriginal ? 'photo-card__toggle--active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsShowingOriginal(false);
              }}
              aria-label="Show colorized version"
            >
              Color
            </button>
            <button
              className={`photo-card__toggle ${isShowingOriginal ? 'photo-card__toggle--active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsShowingOriginal(true);
              }}
              aria-label="Show original version"
            >
              B&W
            </button>
          </div>
        )}
      </div>

      <div className="photo-card__content">
        <div className="photo-card__header">
          <div className="photo-card__user">
            {photo.userAvatar && (
              <img
                src={photo.userAvatar}
                alt={photo.username}
                className="photo-card__avatar"
              />
            )}
            <span className="photo-card__username">@{photo.username}</span>
          </div>
          <button
            className="photo-card__more"
            onClick={(e) => e.stopPropagation()}
            aria-label="More options"
          >
            <MoreVertical size={16} />
          </button>
        </div>

        {photo.title && (
          <h3 className="photo-card__title">{photo.title}</h3>
        )}

        {photo.description && variant === 'list' && (
          <p className="photo-card__description">{photo.description}</p>
        )}

        {showActions && (
          <div className="photo-card__actions">
            <button
              className={`photo-card__action ${photo.isLiked ? 'photo-card__action--liked' : ''}`}
              onClick={handleLikeClick}
              aria-label={`${photo.likes} likes`}
            >
              <Heart size={18} fill={photo.isLiked ? 'currentColor' : 'none'} />
              <span>{photo.likes}</span>
            </button>
            
            <button
              className="photo-card__action"
              onClick={handleCommentClick}
              aria-label={`${photo.comments} comments`}
            >
              <MessageCircle size={18} />
              <span>{photo.comments}</span>
            </button>
            
            <button
              className="photo-card__action"
              onClick={handleShareClick}
              aria-label="Share photo"
            >
              <Share2 size={18} />
            </button>

            <span className="photo-card__views">
              <Eye size={18} />
              <span>{photo.views}</span>
            </span>
          </div>
        )}

        {photo.tags && photo.tags.length > 0 && (variant === 'grid' || variant === 'list') && (
          <div className="photo-card__tags">
            {photo.tags.slice(0, 3).map(tag => (
              <span key={tag} className="photo-card__tag">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

PhotoCard.displayName = 'PhotoCard';

export default PhotoCard;
