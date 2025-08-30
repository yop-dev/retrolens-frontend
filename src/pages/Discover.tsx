import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Clock, Filter, Grid3x3, List, Loader2, Shuffle, Sparkles, TrendingUp } from 'lucide-react';
import { PhotoCard, SearchBar } from '@/components/ui';
import type { PageComponent } from '@/types';
import type { PhotoData } from '@/components/ui/PhotoCard';

// Mock data generator for demonstration
const generateMockPhotos = (count: number): PhotoData[] => {
  const photos: PhotoData[] = [];
  const usernames = ['vintage_lover', 'retro_collector', 'photo_historian', 'memory_keeper', 'nostalgia_hunter'];
  const titles = [
    'Summer in the 1950s',
    'Old Family Portrait',
    'Vintage Street Scene',
    'Classic Car Show',
    'Historic Downtown',
    'Beach Day 1960',
    'Wedding Day 1945',
    'Farm Life',
    'City Nights',
    'Railroad Station'
  ];
  const tags = ['vintage', 'retro', 'classic', 'nostalgia', 'history', 'family', 'portrait', 'landscape', 'street'];
  
  for (let i = 0; i < count; i++) {
    photos.push({
      id: `photo-${i}`,
      originalUrl: `https://picsum.photos/seed/${i}/400/300?grayscale`,
      colorizedUrl: `https://picsum.photos/seed/${i}/400/300`,
      title: titles[i % titles.length],
      description: 'A beautiful vintage photograph restored and colorized using AI technology.',
      username: usernames[i % usernames.length] || 'anonymous',
      userAvatar: `https://i.pravatar.cc/150?img=${i % 50}`,
      likes: Math.floor(Math.random() * 500),
      comments: Math.floor(Math.random() * 50),
      views: Math.floor(Math.random() * 2000),
      isLiked: Math.random() > 0.7,
      tags: tags.slice(0, Math.floor(Math.random() * 4) + 1),
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    });
  }
  
  return photos;
};

type Category = 'all' | 'portraits' | 'landscapes' | 'street' | 'vintage' | 'colorized';
type SortOption = 'recent' | 'popular' | 'quality' | 'random';
type ViewMode = 'grid' | 'list' | 'compact';

/**
 * Discover Page Component
 * 
 * Explore and discover colorized historical photos
 */
export const Discover: PageComponent = () => {
  // State management
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Categories configuration
  const categories: { value: Category; label: string; icon?: React.ReactNode }[] = [
    { value: 'all', label: 'All' },
    { value: 'portraits', label: 'Portraits' },
    { value: 'landscapes', label: 'Landscapes' },
    { value: 'street', label: 'Street' },
    { value: 'vintage', label: 'Vintage' },
    { value: 'colorized', label: 'Colorized' }
  ];

  // Sort options configuration
  const sortOptions: { value: SortOption; label: string; icon: React.ReactNode }[] = [
    { value: 'recent', label: 'Most Recent', icon: <Clock size={16} /> },
    { value: 'popular', label: 'Most Popular', icon: <TrendingUp size={16} /> },
    { value: 'quality', label: 'Best Quality', icon: <Sparkles size={16} /> },
    { value: 'random', label: 'Random', icon: <Shuffle size={16} /> }
  ];

  // Load initial photos
  useEffect(() => {
    const loadPhotos = async () => {
      setIsLoading(true);
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        const mockPhotos = generateMockPhotos(12);
        setPhotos(mockPhotos);
      } catch (error) {
        console.error('Error loading photos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPhotos();
  }, []);

  // Filter and sort photos
  const filteredPhotos = useMemo(() => {
    let filtered = [...photos];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(photo => 
        photo.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        photo.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        photo.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(photo => {
        switch (selectedCategory) {
          case 'colorized':
            return !!photo.colorizedUrl;
          default:
            return photo.tags?.includes(selectedCategory);
        }
      });
    }

    // Apply sorting
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => b.likes - a.likes);
        break;
      case 'recent':
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case 'quality':
        filtered.sort((a, b) => b.views - a.views);
        break;
      case 'random':
        filtered.sort(() => Math.random() - 0.5);
        break;
    }

    return filtered;
  }, [photos, searchQuery, selectedCategory, sortBy]);

  // Handlers
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setPage(1);
  }, []);

  const handleCategoryChange = useCallback((category: Category) => {
    setSelectedCategory(category);
    setPage(1);
  }, []);

  const handleSortChange = useCallback((sort: SortOption) => {
    setSortBy(sort);
  }, []);

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || isLoading) {return;}
    
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newPhotos = generateMockPhotos(12);
      setPhotos(prev => [...prev, ...newPhotos]);
      setPage(prev => prev + 1);
      
      // Simulate end of data
      if (page >= 3) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more photos:', error);
    } finally {
      setIsLoading(false);
    }
  }, [hasMore, isLoading, page]);

  const handleLike = useCallback((photoId: string) => {
    setPhotos(prev => prev.map(photo => 
      photo.id === photoId 
        ? { ...photo, isLiked: !photo.isLiked, likes: photo.isLiked ? photo.likes - 1 : photo.likes + 1 }
        : photo
    ));
  }, []);

  const handleViewDetails = useCallback((photoId: string) => {
    console.warn('View details for photo:', photoId);
    // Navigate to photo details page
  }, []);

  return (
    <div className="discover-page">
      {/* Header Section */}
      <div className="discover-header">
        <div className="discover-header__content">
          <h1 className="discover-header__title">Discover</h1>
          <p className="discover-header__subtitle">
            Explore amazing colorized historical photos from our community
          </p>
        </div>

        {/* Search Bar */}
        <div className="discover-search">
          <SearchBar
            placeholder="Search photos, users, tags..."
            onSearch={handleSearch}
            showFilter
            onFilterClick={() => setShowFilters(!showFilters)}
            className="discover-search__bar"
          />
        </div>

        {/* Categories */}
        <div className="discover-categories">
          {categories.map(category => (
            <button
              key={category.value}
              className={`category-chip ${selectedCategory === category.value ? 'category-chip--active' : ''}`}
              onClick={() => handleCategoryChange(category.value)}
              aria-pressed={selectedCategory === category.value}
            >
              {category.icon}
              <span>{category.label}</span>
            </button>
          ))}
        </div>

        {/* Filters and View Options */}
        <div className="discover-controls">
          <div className="discover-controls__left">
            <div className="sort-dropdown">
              <label htmlFor="sort-select" className="sort-dropdown__label">
                Sort by:
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as SortOption)}
                className="sort-dropdown__select"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="discover-controls__right">
            <div className="view-toggle" role="group" aria-label="View mode">
              <button
                className={`view-toggle__button ${viewMode === 'grid' ? 'view-toggle__button--active' : ''}`}
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                aria-pressed={viewMode === 'grid'}
              >
                <Grid3x3 size={18} />
              </button>
              <button
                className={`view-toggle__button ${viewMode === 'list' ? 'view-toggle__button--active' : ''}`}
                onClick={() => setViewMode('list')}
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
              >
                <List size={18} />
              </button>
              <button
                className={`view-toggle__button ${viewMode === 'compact' ? 'view-toggle__button--active' : ''}`}
                onClick={() => setViewMode('compact')}
                aria-label="Compact view"
                aria-pressed={viewMode === 'compact'}
              >
                <Filter size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="discover-content">
        {isLoading && photos.length === 0 ? (
          <div className="discover-loading">
            <Loader2 className="discover-loading__spinner" size={48} />
            <p>Loading amazing photos...</p>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="discover-empty">
            <div className="empty-state">
              <svg 
                width="64" 
                height="64" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <h2 className="empty-state__title">No photos found</h2>
              <p className="empty-state__subtitle">
                Try adjusting your filters or search terms
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className={`photo-grid photo-grid--${viewMode}`}>
              {filteredPhotos.map(photo => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  variant={viewMode === 'list' ? 'list' : viewMode === 'compact' ? 'compact' : 'grid'}
                  onLike={handleLike}
                  onViewDetails={handleViewDetails}
                  showActions={viewMode !== 'compact'}
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="discover-load-more">
                <button
                  className="load-more-button"
                  onClick={handleLoadMore}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="load-more-button__spinner" size={20} />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

Discover.displayName = 'Discover';

export default Discover;
