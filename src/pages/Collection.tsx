import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  Plus, Grid3x3, List, Upload, Download, Share2, Trash2, 
  Edit2, Filter, SortAsc, SortDesc, Image, Heart, Clock,
  CheckSquare, Square, MoreVertical, Loader2
} from 'lucide-react';
import { PhotoManagementCard, UploadModal } from '@/components/ui';
import type { PageComponent } from '@/types';
import type { ManagedPhotoData } from '@/components/ui/PhotoManagementCard';

// Mock data generator
const generateMockPhotos = (count: number, tab: string): ManagedPhotoData[] => {
  const photos: ManagedPhotoData[] = [];
  const titles = [
    'Sunset Over Mountains',
    'Family Portrait 1965',
    'Downtown Streets 1950',
    'Wedding Day',
    'Old Farm House',
    'Railroad Station',
    'Beach Vacation',
    'City Skyline',
    'Vintage Car Rally',
    'School Days'
  ];
  
  const statuses: ManagedPhotoData['status'][] = 
    tab === 'processing' ? ['processing', 'uploading'] :
    tab === 'drafts' ? ['failed'] :
    ['completed'];
  
  for (let i = 0; i < count; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    photos.push({
      id: `photo-${tab}-${i}`,
      originalUrl: `https://picsum.photos/seed/${tab}${i}/400/300?grayscale`,
      colorizedUrl: status === 'completed' ? `https://picsum.photos/seed/${tab}${i}/400/300` : undefined,
      thumbnailUrl: `https://picsum.photos/seed/${tab}${i}/200/150`,
      title: titles[i % titles.length],
      description: 'A beautiful vintage photograph from my personal collection.',
      uploadedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      processedAt: status === 'completed' ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) : undefined,
      status,
      size: `${(Math.random() * 5 + 1).toFixed(1)} MB`,
      dimensions: '1920x1080',
      tags: ['vintage', 'family', 'nostalgia'].slice(0, Math.floor(Math.random() * 3) + 1),
      isFavorite: tab === 'favorites'
    });
  }
  
  return photos;
};

type TabType = 'my-photos' | 'favorites' | 'processing' | 'drafts';
type SortOption = 'recent' | 'oldest' | 'name' | 'size';
type ViewMode = 'grid' | 'list';

/**
 * Collection Page Component
 * 
 * User's personal photo collection management
 */
export const Collection: PageComponent = () => {
  // State management
  const [activeTab, setActiveTab] = useState<TabType>('my-photos');
  const [photos, setPhotos] = useState<ManagedPhotoData[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectMode, setSelectMode] = useState(false);

  // Tab configuration
  const tabs = [
    { id: 'my-photos' as TabType, label: 'My Photos', icon: <Image size={16} /> },
    { id: 'favorites' as TabType, label: 'Favorites', icon: <Heart size={16} /> },
    { id: 'processing' as TabType, label: 'Processing', icon: <Clock size={16} /> },
    { id: 'drafts' as TabType, label: 'Drafts', icon: <Edit2 size={16} /> }
  ];

  // Load photos based on active tab
  useEffect(() => {
    const loadPhotos = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        const mockPhotos = generateMockPhotos(
          activeTab === 'processing' ? 3 : 
          activeTab === 'drafts' ? 2 : 12, 
          activeTab
        );
        setPhotos(mockPhotos);
        setSelectedPhotos(new Set());
        setSelectMode(false);
      } catch (error) {
        console.error('Error loading photos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPhotos();
  }, [activeTab]);

  // Sort photos
  const sortedPhotos = useMemo(() => {
    const sorted = [...photos];
    
    switch (sortBy) {
      case 'recent':
        sorted.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
        break;
      case 'oldest':
        sorted.sort((a, b) => a.uploadedAt.getTime() - b.uploadedAt.getTime());
        break;
      case 'name':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'size':
        sorted.sort((a, b) => {
          const sizeA = parseFloat(a.size || '0');
          const sizeB = parseFloat(b.size || '0');
          return sizeB - sizeA;
        });
        break;
    }

    if (sortOrder === 'asc' && sortBy !== 'oldest') {
      sorted.reverse();
    }

    return sorted;
  }, [photos, sortBy, sortOrder]);

  // Handlers
  const handleUpload = useCallback(async (files: File[]) => {
    console.log('Uploading files:', files);
    // Simulate upload process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Add new photos to the collection
    const newPhotos: ManagedPhotoData[] = files.map((file, index) => ({
      id: `new-photo-${Date.now()}-${index}`,
      originalUrl: URL.createObjectURL(file),
      title: file.name.replace(/\.[^/.]+$/, ''),
      uploadedAt: new Date(),
      status: 'processing' as const,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
    }));
    
    setPhotos(prev => [...newPhotos, ...prev]);
    setActiveTab('processing');
  }, []);

  const handleSelect = useCallback((photoId: string) => {
    setSelectedPhotos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedPhotos.size === sortedPhotos.length) {
      setSelectedPhotos(new Set());
    } else {
      setSelectedPhotos(new Set(sortedPhotos.map(p => p.id)));
    }
  }, [selectedPhotos.size, sortedPhotos]);

  const handleDelete = useCallback((photoId: string) => {
    if (confirm('Are you sure you want to delete this photo?')) {
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      setSelectedPhotos(prev => {
        const newSet = new Set(prev);
        newSet.delete(photoId);
        return newSet;
      });
    }
  }, []);

  const handleBulkDelete = useCallback(() => {
    if (selectedPhotos.size === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedPhotos.size} photos?`)) {
      setPhotos(prev => prev.filter(p => !selectedPhotos.has(p.id)));
      setSelectedPhotos(new Set());
    }
  }, [selectedPhotos]);

  const handleEdit = useCallback((photoId: string) => {
    console.log('Edit photo:', photoId);
    // Navigate to edit page or open edit modal
  }, []);

  const handleShare = useCallback((photoId: string) => {
    console.log('Share photo:', photoId);
    // Open share modal
  }, []);

  const handleDownload = useCallback((photoId: string) => {
    const photo = photos.find(p => p.id === photoId);
    if (photo) {
      // Simulate download
      const link = document.createElement('a');
      link.href = photo.colorizedUrl || photo.originalUrl;
      link.download = `${photo.title}.jpg`;
      link.click();
    }
  }, [photos]);

  const handleView = useCallback((photoId: string) => {
    console.log('View photo:', photoId);
    // Open photo viewer modal
  }, []);

  const getTabCount = (tabId: TabType) => {
    if (tabId === activeTab) return sortedPhotos.length;
    // In real app, these would be fetched from API
    switch (tabId) {
      case 'my-photos': return 24;
      case 'favorites': return 8;
      case 'processing': return 3;
      case 'drafts': return 2;
      default: return 0;
    }
  };

  return (
    <div className="collection-page">
      {/* Header */}
      <div className="collection-header">
        <div className="collection-header__top">
          <div className="collection-header__title-section">
            <h1 className="collection-header__title">My Collection</h1>
            <p className="collection-header__subtitle">
              Manage your vintage photo collection
            </p>
          </div>
          <button
            className="collection-header__upload-button"
            onClick={() => setShowUploadModal(true)}
          >
            <Plus size={20} />
            <span>Upload Photos</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="collection-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`collection-tab ${activeTab === tab.id ? 'collection-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span className="collection-tab__count">{getTabCount(tab.id)}</span>
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="collection-controls">
          <div className="collection-controls__left">
            {selectMode && (
              <div className="collection-select-controls">
                <button
                  className="collection-select-all"
                  onClick={handleSelectAll}
                  aria-label={selectedPhotos.size === sortedPhotos.length ? 'Deselect all' : 'Select all'}
                >
                  {selectedPhotos.size === sortedPhotos.length ? 
                    <CheckSquare size={18} /> : 
                    <Square size={18} />
                  }
                  <span>
                    {selectedPhotos.size === sortedPhotos.length ? 'Deselect All' : 'Select All'}
                  </span>
                </button>
                {selectedPhotos.size > 0 && (
                  <>
                    <span className="collection-select-count">
                      {selectedPhotos.size} selected
                    </span>
                    <button
                      className="collection-bulk-action"
                      onClick={() => {
                        // Bulk download
                        selectedPhotos.forEach(id => handleDownload(id));
                      }}
                      aria-label="Download selected"
                    >
                      <Download size={18} />
                    </button>
                    <button
                      className="collection-bulk-action"
                      onClick={() => {
                        // Bulk share
                        console.log('Share selected:', Array.from(selectedPhotos));
                      }}
                      aria-label="Share selected"
                    >
                      <Share2 size={18} />
                    </button>
                    <button
                      className="collection-bulk-action collection-bulk-action--danger"
                      onClick={handleBulkDelete}
                      aria-label="Delete selected"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
              </div>
            )}
            
            <div className="collection-view-toggle">
              <button
                className={`view-button ${viewMode === 'grid' ? 'view-button--active' : ''}`}
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
              >
                <Grid3x3 size={18} />
              </button>
              <button
                className={`view-button ${viewMode === 'list' ? 'view-button--active' : ''}`}
                onClick={() => setViewMode('list')}
                aria-label="List view"
              >
                <List size={18} />
              </button>
            </div>
          </div>

          <div className="collection-controls__right">
            <button
              className={`collection-select-mode ${selectMode ? 'collection-select-mode--active' : ''}`}
              onClick={() => {
                setSelectMode(!selectMode);
                setSelectedPhotos(new Set());
              }}
            >
              <CheckSquare size={18} />
              <span>Select</span>
            </button>
            
            <div className="collection-sort">
              <label htmlFor="sort-select" className="collection-sort__label">
                Sort by:
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="collection-sort__select"
              >
                <option value="recent">Recent</option>
                <option value="oldest">Oldest</option>
                <option value="name">Name</option>
                <option value="size">Size</option>
              </select>
              <button
                className="collection-sort__order"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                aria-label={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
              >
                {sortOrder === 'asc' ? <SortAsc size={18} /> : <SortDesc size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="collection-content">
        {isLoading ? (
          <div className="collection-loading">
            <Loader2 className="collection-loading__spinner" size={48} />
            <p>Loading your photos...</p>
          </div>
        ) : sortedPhotos.length === 0 ? (
          <div className="collection-empty">
            <div className="empty-state">
              <Upload size={64} className="empty-state__icon" />
              <h2 className="empty-state__title">
                {activeTab === 'favorites' ? 'No favorite photos yet' :
                 activeTab === 'processing' ? 'No photos being processed' :
                 activeTab === 'drafts' ? 'No draft photos' :
                 'No photos in your collection'}
              </h2>
              <p className="empty-state__subtitle">
                {activeTab === 'favorites' ? 'Mark photos as favorites to see them here' :
                 activeTab === 'processing' ? 'Upload photos to start colorization' :
                 activeTab === 'drafts' ? 'Failed uploads will appear here' :
                 'Upload your first photo to get started'}
              </p>
              {activeTab === 'my-photos' && (
                <button
                  className="empty-state__button"
                  onClick={() => setShowUploadModal(true)}
                >
                  <Upload size={20} />
                  <span>Upload Photos</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className={`photo-management-grid photo-management-grid--${viewMode}`}>
            {sortedPhotos.map(photo => (
              <PhotoManagementCard
                key={photo.id}
                photo={photo}
                variant={viewMode}
                selected={selectedPhotos.has(photo.id)}
                onSelect={selectMode ? handleSelect : undefined}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onShare={handleShare}
                onDownload={handleDownload}
                onView={handleView}
              />
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUpload}
      />
    </div>
  );
};

Collection.displayName = 'Collection';

export default Collection;
