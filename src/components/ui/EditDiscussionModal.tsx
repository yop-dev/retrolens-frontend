import React, { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import type { DiscussionFeedItem, UpdateDiscussionData } from '@/types';

interface EditDiscussionModalProps {
  discussion: DiscussionFeedItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (discussionId: string, data: UpdateDiscussionData) => Promise<void>;
  onDelete: (discussionId: string) => Promise<void>;
  isLoading?: boolean;
}

export const EditDiscussionModal: React.FC<EditDiscussionModalProps> = ({
  discussion,
  isOpen,
  onClose,
  onSave,
  onDelete,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    title: discussion.title || '',
    content: discussion.content || '',
    tags: discussion.tags || []
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset form when discussion changes
  useEffect(() => {
    setFormData({
      title: discussion.title || '',
      content: discussion.content || '',
      tags: discussion.tags || []
    });
  }, [discussion]);

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Title and description are required');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(discussion.id, {
        title: formData.title.trim(),
        body: formData.content.trim(),
        tags: formData.tags
      });
      onClose();
    } catch (error) {
      console.error('Failed to update discussion:', error);
      alert('Failed to update post. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(discussion.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete discussion:', error);
      alert('Failed to delete post. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tagsString = e.target.value;
    const tags = tagsString
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    setFormData({ ...formData, tags });
  };

  if (!isOpen) return null;

  return (
    <div className="create-modal-overlay" onClick={onClose}>
      <div className="create-modal" onClick={(e) => e.stopPropagation()}>
        <div className="create-modal-header">
          <h2>Edit Post</h2>
          <button 
            className="close-modal-btn"
            onClick={onClose}
            disabled={isSaving || isDeleting}
          >
            <X size={24} />
          </button>
        </div>

        <div className="create-modal-body">
          {/* Note about photo editing */}
          <div className="edit-note">
            <p><strong>Note:</strong> You can only edit the title and description. To change the photo, you'll need to delete this post and create a new one.</p>
          </div>

          {/* Title */}
          <div className="form-group">
            <label htmlFor="edit-title">Title</label>
            <input
              id="edit-title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter post title..."
              maxLength={200}
              disabled={isSaving || isDeleting}
            />
            <span className="char-count">{formData.title.length}/200</span>
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="edit-content">Description</label>
            <textarea
              id="edit-content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={6}
              placeholder="Tell us about this photo..."
              maxLength={1000}
              disabled={isSaving || isDeleting}
            />
            <span className="char-count">{formData.content.length}/1000</span>
          </div>

          {/* Tags */}
          <div className="form-group">
            <label htmlFor="edit-tags">Tags (comma-separated)</label>
            <input
              id="edit-tags"
              type="text"
              value={formData.tags.join(', ')}
              onChange={handleTagsChange}
              placeholder="camera, vintage, film..."
              disabled={isSaving || isDeleting}
            />
          </div>

          {/* Current photo preview */}
          {discussion.images && discussion.images.length > 0 && (
            <div className="form-group">
              <label>Current Photo</label>
              <div className="current-photo-preview">
                <img 
                  src={discussion.images[0]} 
                  alt="Current photo" 
                  style={{ 
                    maxWidth: '200px', 
                    maxHeight: '200px', 
                    objectFit: 'cover',
                    borderRadius: '8px'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="create-modal-footer">
          <div className="modal-footer-left">
            <button 
              className="btn btn-danger"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSaving || isDeleting}
            >
              <Trash2 size={18} />
              <span>Delete Post</span>
            </button>
          </div>
          
          <div className="modal-footer-right">
            <button 
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSaving || isDeleting}
            >
              Cancel
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleSave}
              disabled={isSaving || isDeleting || !formData.title.trim() || !formData.content.trim()}
            >
              {isSaving ? (
                <>
                  <div className="spinner-small" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="delete-confirm-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Delete Post</h3>
              <p>Are you sure you want to delete this post? This action cannot be undone.</p>
              <div className="delete-confirm-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <div className="spinner-small" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditDiscussionModal;