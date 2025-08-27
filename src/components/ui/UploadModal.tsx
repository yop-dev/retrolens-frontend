import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, Image, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import type { BaseComponentProps } from '@/types';

interface UploadModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => Promise<void>;
  acceptedFormats?: string[];
  maxFileSize?: number; // in MB
  maxFiles?: number;
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

/**
 * UploadModal Component
 * 
 * Modal for uploading photos with drag-and-drop support
 * 
 * @example
 * <UploadModal 
 *   isOpen={showUpload}
 *   onClose={() => setShowUpload(false)}
 *   onUpload={handleUpload}
 * />
 */
export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  acceptedFormats = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'],
  maxFileSize = 10, // 10MB default
  maxFiles = 10,
  className = ''
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const validateFiles = (fileList: File[]): { valid: File[]; errors: string[] } => {
    const valid: File[] = [];
    const errors: string[] = [];

    fileList.forEach(file => {
      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        errors.push(`${file.name} exceeds ${maxFileSize}MB`);
        return;
      }

      // Check file format
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!acceptedFormats.some(format => format.toLowerCase() === extension)) {
        errors.push(`${file.name} has unsupported format`);
        return;
      }

      valid.push(file);
    });

    // Check max files
    if (valid.length + files.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`);
      return { valid: valid.slice(0, maxFiles - files.length), errors };
    }

    return { valid, errors };
  };

  const handleFiles = useCallback((fileList: FileList | File[]) => {
    const filesArray = Array.from(fileList);
    const { valid, errors } = validateFiles(filesArray);

    if (errors.length > 0) {
      setErrorMessage(errors.join(', '));
      setTimeout(() => setErrorMessage(''), 5000);
    }

    if (valid.length > 0) {
      setFiles(prev => [...prev, ...valid]);

      // Generate previews
      valid.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  }, [files.length, maxFiles, maxFileSize, acceptedFormats]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpload = useCallback(async () => {
    if (files.length === 0) return;

    setUploadStatus('uploading');
    setErrorMessage('');

    try {
      await onUpload(files);
      setUploadStatus('success');
      setTimeout(() => {
        onClose();
        setFiles([]);
        setPreviews([]);
        setUploadStatus('idle');
      }, 1500);
    } catch (error) {
      setUploadStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed');
    }
  }, [files, onUpload, onClose]);

  const handleClose = useCallback(() => {
    if (uploadStatus !== 'uploading') {
      onClose();
      setFiles([]);
      setPreviews([]);
      setUploadStatus('idle');
      setErrorMessage('');
    }
  }, [uploadStatus, onClose]);

  if (!isOpen) return null;

  return (
    <div className={`upload-modal-overlay ${className}`} onClick={handleClose}>
      <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="upload-modal__header">
          <h2 className="upload-modal__title">Upload Photos</h2>
          <button
            className="upload-modal__close"
            onClick={handleClose}
            disabled={uploadStatus === 'uploading'}
            aria-label="Close upload modal"
          >
            <X size={24} />
          </button>
        </div>

        <div className="upload-modal__content">
          {files.length === 0 ? (
            <div
              className={`upload-dropzone ${isDragging ? 'upload-dropzone--dragging' : ''}`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={acceptedFormats.join(',')}
                onChange={handleFileSelect}
                className="upload-input-hidden"
              />
              
              <Upload size={48} className="upload-dropzone__icon" />
              <h3 className="upload-dropzone__title">
                Drag & drop your photos here
              </h3>
              <p className="upload-dropzone__subtitle">
                or{' '}
                <button
                  className="upload-dropzone__button"
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  browse files
                </button>
              </p>
              <p className="upload-dropzone__info">
                Supported formats: {acceptedFormats.join(', ')}<br />
                Max file size: {maxFileSize}MB • Max {maxFiles} files
              </p>
            </div>
          ) : (
            <div className="upload-preview">
              <div className="upload-preview__grid">
                {previews.map((preview, index) => (
                  <div key={index} className="upload-preview__item">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="upload-preview__image"
                    />
                    <button
                      className="upload-preview__remove"
                      onClick={() => removeFile(index)}
                      disabled={uploadStatus === 'uploading'}
                      aria-label={`Remove ${files[index].name}`}
                    >
                      <X size={16} />
                    </button>
                    <div className="upload-preview__name">
                      {files[index].name}
                    </div>
                  </div>
                ))}
                {files.length < maxFiles && (
                  <button
                    className="upload-preview__add"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadStatus === 'uploading'}
                  >
                    <Upload size={24} />
                    <span>Add more</span>
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={acceptedFormats.join(',')}
                onChange={handleFileSelect}
                className="upload-input-hidden"
              />
            </div>
          )}

          {errorMessage && (
            <div className="upload-modal__error">
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {uploadStatus === 'success' && (
            <div className="upload-modal__success">
              <CheckCircle size={16} />
              <span>Upload successful!</span>
            </div>
          )}
        </div>

        <div className="upload-modal__footer">
          <button
            className="upload-modal__cancel"
            onClick={handleClose}
            disabled={uploadStatus === 'uploading'}
          >
            Cancel
          </button>
          <button
            className="upload-modal__submit"
            onClick={handleUpload}
            disabled={files.length === 0 || uploadStatus === 'uploading'}
          >
            {uploadStatus === 'uploading' ? (
              <>
                <Loader2 className="upload-modal__spinner" size={16} />
                Uploading...
              </>
            ) : (
              `Upload ${files.length} ${files.length === 1 ? 'Photo' : 'Photos'}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

UploadModal.displayName = 'UploadModal';

export default UploadModal;
