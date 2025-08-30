import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { 
  Clock, Edit2, Grid3x3, Hash, Heart, 
  Image, List, SortAsc,
  SortDesc, Upload
} from 'lucide-react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { SocialActions } from '@/components/ui/SocialActions';
import { CollectionLoadingScreen } from '@/components/ui/LoadingScreen';
import { discussionService } from '@/services/api/discussions.service';
import { userService } from '@/services/api/users.service';
import type { Discussion, PageComponent } from '@/types';

interface CollectionPost extends Discussion {
  author?: {
    username: string;
    avatar?: string;
  };
  timeAgo?: string;
  stats?: {
    views: number;
    replies: number;
    likes: number;
  };
  category?: string;
  content?: string;
  images?: string[];
}

type TabType = 'my-photos' | 'favorites' | 'processing' | 'drafts';
type SortOption = 'recent' | 'oldest' | 'name' | 'size';
type ViewMode = 'grid' | 'list';

/**
 * Collection Page Component
 * 
 * User's personal posts collection
 */
export const Collection: PageComponent = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { getToken } = useAuth();
  
  // State management
  const [activeTab, setActiveTab] = useState<TabType>('my-photos');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Helper function to extract images from markdown
  const extractImagesFromBody = useCallback((body: string): string[] => {
    const imageRegex = /!\[.*?\]\((.*?)\)/g;
    const images = [];
    let match;
    while ((match = imageRegex.exec(body)) !== null) {
      const imageUrl = match[1]?.replace(/\?$/, '').trim() || '';
      if (imageUrl) {
        images.push(imageUrl);
      }
    }
    return images;
  }, []);

  // Helper function to remove markdown images from text
  const removeImagesFromContent = useCallback((body: string): string => {
    return body.replace(/!\[.*?\]\(.*?\)/g, '').trim();
  }, []);

  // Format relative time
  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffMs = now.getTime() - postDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'just now';
    }
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    if (diffDays < 30) {
      return `${diffDays}d ago`;
    }
    return postDate.toLocaleDateString();
  };

  // Fetch user's discussions
  const { data: userDiscussions, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['userDiscussions', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return [];
      }
      const token = await getToken();
      
      try {
        // Get user's discussions
        const discussions = await discussionService.getUserDiscussions(user.id, token || undefined, {
          sortBy: 'created_at',
          sortOrder: 'desc'
        });
        
        // Get user data for author info
        const userData = await userService.getUserById(user.id, token || undefined);
        
        // Transform discussions with user data
        const transformedDiscussions = discussions.map((discussion: Discussion): CollectionPost => {
          const extendedDiscussion = discussion as Discussion & { 
            content?: string; 
            username?: string; 
            images?: string[] 
          };
          const bodyContent = extendedDiscussion.content || discussion.body || '';
          const extractedImages = extractImagesFromBody(bodyContent);
          const cleanContent = removeImagesFromContent(bodyContent);
          
          return {
            ...discussion,
            author: {
              username: userData?.display_name || userData?.username || extendedDiscussion.username || 'Anonymous',
              avatar: userData?.avatar_url || '/default-avatar.jpg'
            },
            images: (extendedDiscussion.images && extendedDiscussion.images.length > 0) ? extendedDiscussion.images : extractedImages,
            content: cleanContent,
            stats: {
              views: discussion.view_count || 0,
              replies: discussion.comment_count || 0,
              likes: discussion.like_count || 0
            },
            category: discussion.category_name || 'General'
          };
        });
        
        return transformedDiscussions;
      } catch (error) {
        console.error('Error fetching user discussions:', error);
        return [];
      }
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Tab configuration
  const tabs = [
    { id: 'my-photos' as TabType, label: 'My Posts', icon: <Image size={16} /> },
    { id: 'favorites' as TabType, label: 'Favorites', icon: <Heart size={16} /> },
    { id: 'processing' as TabType, label: 'Processing', icon: <Clock size={16} /> },
    { id: 'drafts' as TabType, label: 'Drafts', icon: <Edit2 size={16} /> }
  ];

  // Filter and sort posts based on active tab
  const filteredAndSortedPosts = useMemo(() => {
    if (!userDiscussions) {
      return [];
    }

    const filtered = [...userDiscussions];
    
    // For now, we'll show all posts in "my-photos" tab
    // In the future, you could implement favorites, processing, drafts logic
    if (activeTab !== 'my-photos') {
      // For other tabs, return empty for now
      // You can implement favorites logic, processing status, etc. later
      return [];
    }
    
    // Sort posts
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'name':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'size':
        // Sort by view count as a proxy for "size"
        filtered.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
        break;
    }

    if (sortOrder === 'asc' && sortBy !== 'oldest') {
      filtered.reverse();
    }

    return filtered;
  }, [userDiscussions, activeTab, sortBy, sortOrder]);

  // Reset selection when tab changes
  useEffect(() => {
    // Tab change logic if needed
  }, [activeTab]);

  const handleView = useCallback((postId: string) => {
    navigate(`/discussion/${postId}`);
  }, [navigate]);

  const getTabCount = (tabId: TabType) => {
    if (tabId === activeTab) {
      return filteredAndSortedPosts.length;
    }
    // For now, only show count for my-photos tab
    switch (tabId) {
      case 'my-photos': 
        return userDiscussions?.length || 0;
      case 'favorites': 
      case 'processing': 
      case 'drafts': 
        return 0; // These features can be implemented later
      default: 
        return 0;
    }
  };

  // Show loading screen first, before any other content
  if (isLoading) {
    return <CollectionLoadingScreen />;
  }

  return (
    <div className="collection-page">
      {/* Header */}
      <div className="collection-header">
        <div className="collection-header__top">
          <div className="collection-header__title-section">
            <h1 className="collection-header__title">My Collection</h1>
            <p className="collection-header__subtitle">
              Your posts and discussions
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="collection-tabs">
          {tabs.filter(tab => tab.id === 'my-photos').map(tab => (
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
        {isError ? (
          <div className="text-center py-12">
            <p className="text-red-600">Error loading your posts: {error?.message}</p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
            >
              Try Again
            </button>
          </div>
        ) : filteredAndSortedPosts.length === 0 ? (
          <div className="collection-empty">
            <div className="empty-state">
              <Upload size={64} className="empty-state__icon" />
              <h2 className="empty-state__title">
                {activeTab === 'favorites' ? 'No favorite posts yet' :
                 activeTab === 'processing' ? 'No posts being processed' :
                 activeTab === 'drafts' ? 'No draft posts' :
                 'No posts in your collection'}
              </h2>
              <p className="empty-state__subtitle">
                {activeTab === 'favorites' ? 'Mark posts as favorites to see them here' :
                 activeTab === 'processing' ? 'Posts being processed will appear here' :
                 activeTab === 'drafts' ? 'Draft posts will appear here' :
                 'Create your first post to get started'}
              </p>
              {activeTab === 'my-photos' && (
                <p className="empty-state__hint">
                  Go to the Feed page to create your first post
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
            {filteredAndSortedPosts.map(post => (
              <article
                key={post.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                {/* Author Header */}
                <div className="p-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <OptimizedImage
                          src={post.author?.avatar || '/default-avatar.jpg'}
                          alt={post.author?.username || 'User'}
                          className="w-10 h-10 rounded-full"
                          priority={false}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {post.author?.username || 'Anonymous'}
                        </p>
                        <p className="text-xs text-gray-500">{formatRelativeTime(post.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div
                  className="px-4 pb-3 cursor-pointer"
                  onClick={() => handleView(post.id)}
                >
                  <h2 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {post.title}
                  </h2>
                  {post.content && post.content.trim() && post.content !== post.title && (
                    <p className="text-gray-600 text-sm line-clamp-3">
                      {post.content}
                    </p>
                  )}

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-orange-700 bg-orange-50 rounded-md"
                        >
                          <Hash className="w-3 h-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Images (if any) */}
                {post.images && post.images.length > 0 && (
                  <div className="px-4 pb-3">
                    <div className={`grid gap-2 ${post.images!.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {post.images!.slice(0, 4).map((image: string, idx: number) => (
                        <div key={idx} className="relative aspect-square">
                          <OptimizedImage
                            src={image}
                            alt={`Image ${idx + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                            priority={idx === 0}
                          />
                          {post.images!.length > 4 && idx === 3 && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                              <span className="text-white text-2xl font-semibold">
                                +{post.images!.length - 4}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social Actions */}
                <SocialActions
                  discussionId={post.id}
                  initialLikeCount={post.like_count || 0}
                  initialIsLiked={post.is_liked || false}
                  initialCommentCount={post.comment_count || 0}
                  currentUserId={user?.id}
                  className="px-4"
                />
              </article>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

Collection.displayName = 'Collection';

export default Collection;
