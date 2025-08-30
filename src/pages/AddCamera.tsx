import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera as CameraIcon, Upload, X } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useApiWithAuth } from '@/hooks';
import { API_ENDPOINTS, CAMERA_CONFIG } from '@/constants';
import '@/css/pages/AddCamera.css';

export function AddCamera() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { makeAuthenticatedRequest } = useApiWithAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    brand_name: '',
    model: '',
    year: '',
    camera_type: '',
    film_format: '',
    condition: '',
    acquisition_story: '',
    technical_specs: {},
    market_value_min: '',
    market_value_max: '',
    is_for_sale: false,
    is_for_trade: false,
    is_public: true
  });

  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file types
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      return validTypes.includes(file.type);
    });

    if (validFiles.length !== files.length) {
      alert('Some files were not valid image types. Only JPEG, PNG, WebP, and GIF are allowed.');
    }

    // Limit to 5 images
    if (selectedImages.length + validFiles.length > 5) {
      alert('You can upload a maximum of 5 images.');
      return;
    }

    // Create preview URLs
    const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
    
    setSelectedImages(prev => [...prev, ...validFiles]);
    setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  // Remove selected image
  const removeImage = (index: number) => {
    if (imagePreviewUrls[index]) {
      URL.revokeObjectURL(imagePreviewUrls[index]);
    }
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.brand_name) {
      newErrors.brand_name = 'Brand name is required';
    }
    if (!formData.model) {
      newErrors.model = 'Model is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!user?.id) {
      alert('You must be logged in to add a camera');
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Create the camera
      const cameraData = {
        ...formData,
        market_value_min: formData.market_value_min ? parseFloat(formData.market_value_min) : null,
        market_value_max: formData.market_value_max ? parseFloat(formData.market_value_max) : null,
      };

      const createdCamera = await makeAuthenticatedRequest(async (token) => {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${API_ENDPOINTS.CAMERAS}?user_id=${user.id}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(cameraData)
          }
        );

        if (!response.ok) {
          throw new Error('Failed to create camera');
        }

        return response.json();
      });

      console.warn('Camera created:', createdCamera);

      // Step 2: Upload images if any
      if (selectedImages.length > 0) {
        for (let i = 0; i < selectedImages.length; i++) {
          const formData = new FormData();
          const file = selectedImages[i];
          if (file) {
            formData.append('file', file);
          }

          try {
            const uploadResponse = await makeAuthenticatedRequest(async (token) => {
              const response = await fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${API_ENDPOINTS.UPLOAD_CAMERA_IMAGE}?user_id=${user.id}`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`
                  },
                  body: formData
                }
              );

              if (!response.ok) {
                throw new Error('Failed to upload image');
              }

              return response.json();
            });

            console.warn(`Image ${i + 1} uploaded:`, uploadResponse);
            
            // TODO: Associate uploaded image with the camera
            // This would require an additional endpoint to link images to cameras
            
          } catch (uploadError) {
            console.error(`Failed to upload image ${i + 1}:`, uploadError);
            // Continue with other images even if one fails
          }
        }
      }

      // Success! Navigate back to profile
      alert('Camera added successfully!');
      navigate('/profile');
      
    } catch (error) {
      console.error('Failed to add camera:', error);
      alert('Failed to add camera. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-camera-page">
      {/* Header */}
      <div className="add-camera-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <h1>Add Camera</h1>
        <div style={{ width: '32px' }}></div>
      </div>

      <div className="add-camera-container">
        <form onSubmit={handleSubmit} className="camera-form">
          {/* Basic Information */}
          <div className="form-section">
            <h2>Basic Information</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="brand_name">Brand *</label>
                <select
                  id="brand_name"
                  name="brand_name"
                  value={formData.brand_name}
                  onChange={handleInputChange}
                  className={errors.brand_name ? 'error' : ''}
                  required
                >
                  <option value="">Select a brand</option>
                  {CAMERA_CONFIG.BRANDS.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
                {errors.brand_name && <span className="error-message">{errors.brand_name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="model">Model *</label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  placeholder="e.g., M6, AE-1, F3"
                  className={errors.model ? 'error' : ''}
                  required
                />
                {errors.model && <span className="error-message">{errors.model}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="year">Year</label>
                <input
                  type="text"
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  placeholder="e.g., 1984"
                />
              </div>

              <div className="form-group">
                <label htmlFor="condition">Condition</label>
                <select
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                >
                  <option value="">Select condition</option>
                  <option value="mint">Mint</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                  <option value="for_parts">For Parts</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="camera_type">Camera Type</label>
                <input
                  type="text"
                  id="camera_type"
                  name="camera_type"
                  value={formData.camera_type}
                  onChange={handleInputChange}
                  placeholder="e.g., Rangefinder, SLR, TLR"
                />
              </div>

              <div className="form-group">
                <label htmlFor="film_format">Film Format</label>
                <input
                  type="text"
                  id="film_format"
                  name="film_format"
                  value={formData.film_format}
                  onChange={handleInputChange}
                  placeholder="e.g., 35mm, 120, 4x5"
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="form-section">
            <h2>Images</h2>
            
            <div className="image-upload-area">
              <div className="image-previews">
                {imagePreviewUrls.map((url, index) => (
                  <div key={index} className="image-preview">
                    <img src={url} alt={`Preview ${index + 1}`} />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => removeImage(index)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                
                {selectedImages.length < 5 && (
                  <button
                    type="button"
                    className="add-image-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={24} />
                    <span>Add Photo</span>
                  </button>
                )}
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
                multiple
              />
              
              <p className="image-help-text">Upload up to 5 photos of your camera</p>
            </div>
          </div>

          {/* Story */}
          <div className="form-section">
            <h2>Story</h2>
            
            <div className="form-group">
              <label htmlFor="acquisition_story">Acquisition Story</label>
              <textarea
                id="acquisition_story"
                name="acquisition_story"
                value={formData.acquisition_story}
                onChange={handleInputChange}
                rows={4}
                placeholder="How did you acquire this camera? What's its history?"
              />
            </div>
          </div>

          {/* Market Value */}
          <div className="form-section">
            <h2>Market Value (Optional)</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="market_value_min">Minimum Value ($)</label>
                <input
                  type="number"
                  id="market_value_min"
                  name="market_value_min"
                  value={formData.market_value_min}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label htmlFor="market_value_max">Maximum Value ($)</label>
                <input
                  type="number"
                  id="market_value_max"
                  name="market_value_max"
                  value={formData.market_value_max}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="form-section">
            <h2>Options</h2>
            
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_for_sale"
                  checked={formData.is_for_sale}
                  onChange={handleInputChange}
                />
                <span>Available for sale</span>
              </label>
              
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_for_trade"
                  checked={formData.is_for_trade}
                  onChange={handleInputChange}
                />
                <span>Available for trade</span>
              </label>
              
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_public"
                  checked={formData.is_public}
                  onChange={handleInputChange}
                />
                <span>Make this camera public</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner-small" />
                  <span>Adding Camera...</span>
                </>
              ) : (
                <>
                  <CameraIcon size={20} />
                  <span>Add Camera</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddCamera;
