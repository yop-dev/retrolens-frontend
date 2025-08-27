import React, { useState, memo } from 'react';
import { Edit2, Trash2, Share2, Download, Eye, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import type { BaseComponentProps } from '@/types';

export interface ManagedPhotoData {
  id: string;
  originalUrl: string;
  colorizedUrl?: string;
  thumbnailUrl?: string;
  title: string;
  description?: string;
  uploadedAt: Date;
  processedAt?: Date;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  size?: string;
  dimensions?: string;
  tags?: string[];
  isFavorite?: boolean;
}

interface PhotoManagementCardProps extends BaseComponentProps {
  photo: ManagedPhotoData;
  onEdit?: (photoId: string) => void;
  onDelete?: (photoId: string) => void;
  onShare?: (photoId: string) => void;
  onDownload?: (photoId: string) => void;
  onView?: (photoId: string) => void;
  onToggleFavorite?: (photoId: string) => void;
  variant?: 'grid' | 'list';
  selected?: boolean;
  onSelect?: (photoId: string) => void;
}

/**
 * PhotoManagementCard Component
 * 
 * Card component for managing individual photos in user's collection
 * 
 * @example
 * <PhotoManagementCard 
 *   photo={photoData}
 *   onEdit={(id) => handleEdit(id)}
 *   onDelete={(id) => handleDelete(id)}
 *   variant="grid"
 * />
 */
export const PhotoManagementCard: React.FC<PhotoManagementCardProps> = memo(({
  photo,
  onEdit,
  onDelete,
  onShare,
  onDownload,
  onView,
  onToggleFavorite,
  variant = 'grid',
  selected = false,
  onSelect,
  className = ''
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const getStatusIcon = () => {
    switch (photo.status) {
      case 'uploading':
        return <Loader2 className="status-icon status-icon--uploading" size={16} />;
      case 'processing':
        return <Clock className="status-icon status-icon--processing" size={16} />;
      case 'completed':
        return <CheckCircle className="status-icon status-icon--completed" size={16} />;
      case 'failed':
        return <AlertCircle className="status-icon status-icon--failed" size={16} />;
    }
  };

  const getStatusText = () => {
    switch (photo.status) {
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Processing...';
      case 'completed':
        return 'Ready';
      case 'failed':
        return 'Failed';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const imageUrl = photo.thumbnailUrl || photo.colorizedUrl || photo.originalUrl;

  if (variant === 'list') {
    return (
      <div 
        className={`photo-management-card photo-management-card--list ${selected ? 'photo-management-card--selected' : ''} ${className}`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {onSelect && (
          <input
            type="checkbox"
            className="photo-management-card__checkbox"
            checked={selected}
            onChange={() => onSelect(photo.id)}
            aria-label={`Select ${photo.title}`}
          />
        )}
        
        <div className="photo-management-card__image-container" onClick={() => onView?.(photo.id)}>
          {!imageLoaded && <div className="photo-management-card__skeleton" />}
          <img
            src={imageUrl}
            alt={photo.title}
            className="photo-management-card__image"
            onLoad={handleImageLoad}
            loading="lazy"
          />
          <div className="photo-management-card__status-overlay">
            {getStatusIcon()}
          </div>
        </div>

        <div className="photo-management-card__info">
          <h3 className="photo-management-card__title">{photo.title}</h3>
          {photo.description && (
            <p className="photo-management-card__description">{photo.description}</p>
          )}
          <div className="photo-management-card__meta">
            <span className="photo-management-card__date">
              {formatDate(photo.uploadedAt)}
            </span>
            {photo.dimensions && (
              <span className="photo-management-card__dimensions">{photo.dimensions}</span>
            )}
            {photo.size && (
              <span className="photo-management-card__size">{photo.size}</span>
            )}
            <span className={`photo-management-card__status photo-management-card__status--${photo.status}`}>
              {getStatusText()}
            </span>
          </div>
        </div>

        <div className="photo-management-card__actions">
          {onView && (
            <button
              className="photo-management-card__action"
              onClick={() => onView(photo.id)}
              aria-label="View photo"
              title="View"
            >
              <Eye size={18} />
            </button>
          )}
          {onEdit && photo.status === 'completed' && (
            <button
              className="photo-management-card__action"
              onClick={() => onEdit(photo.id)}
              aria-label="Edit photo"
              title="Edit"
            >
              <Edit2 size={18} />
            </button>
          )}
          {onShare && photo.status === 'completed' && (
            <button
              className="photo-management-card__action"
              onClick={() => onShare(photo.id)}
              aria-label="Share photo"
              title="Share"
            >
              <Share2 size={18} />
            </button>
          )}
          {onDownload && photo.status === 'completed' && (
            <button
              className="photo-management-card__action"
              onClick={() => onDownload(photo.id)}
              aria-label="Download photo"
              title="Download"
            >
              <Download size={18} />
            </button>
          )}
          {onDelete && (
            <button
              className="photo-management-card__action photo-management-card__action--danger"
              onClick={() => onDelete(photo.id)}
              aria-label="Delete photo"
              title="Delete"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Grid variant
  return (
    <div 
      className={`photo-management-card photo-management-card--grid ${selected ? 'photo-management-card--selected' : ''} ${className}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="photo-management-card__image-container" onClick={() => onView?.(photo.id)}>
        {!imageLoaded && <div className="photo-management-card__skeleton" />}
        <img
          src={imageUrl}
          alt={photo.title}
          className="photo-management-card__image"
          onLoad={handleImageLoad}
          loading="lazy"
        />
        
        {onSelect && (
          <input
            type="checkbox"
            className="photo-management-card__checkbox"
            checked={selected}
            onChange={() => onSelect(photo.id)}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Select ${photo.title}`}
          />
        )}

        <div className="photo-management-card__status-badge">
          {getStatusIcon()}
          <span>{getStatusText()}</span>
        </div>

        {(showActions || selected) && photo.status === 'completed' && (
          <div className="photo-management-card__overlay">
            <div className="photo-management-card__overlay-actions">
              {onView && (
                <button
                  className="photo-management-card__overlay-action"
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(photo.id);
                  }}
                  aria-label="View photo"
                  title="View"
                >
                  <Eye size={20} />
                </button>
              )}
              {onEdit && (
                <button
                  className="photo-management-card__overlay-action"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(photo.id);
                  }}
                  aria-label="Edit photo"
                  title="Edit"
                >
                  <Edit2 size={20} />
                </button>
              )}
              {onShare && (
                <button
                  className="photo-management-card__overlay-action"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare(photo.id);
                  }}
                  aria-label="Share photo"
                  title="Share"
                >
                  <Share2 size={20} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="photo-management-card__content">
        <h3 className="photo-management-card__title" title={photo.title}>
          {photo.title}
        </h3>
        <div className="photo-management-card__footer">
          <span className="photo-management-card__date">
            {formatDate(photo.uploadedAt)}
          </span>
          <div className="photo-management-card__footer-actions">
            {onDownload && photo.status === 'completed' && (
              <button
                className="photo-management-card__mini-action"
                onClick={() => onDownload(photo.id)}
                aria-label="Download"
                title="Download"
              >
                <Download size={14} />
              </button>
            )}
            {onDelete && (
              <button
                className="photo-management-card__mini-action photo-management-card__mini-action--danger"
                onClick={() => onDelete(photo.id)}
                aria-label="Delete"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

PhotoManagementCard.displayName = 'PhotoManagementCard';

export default PhotoManagementCard;
