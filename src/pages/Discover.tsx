import React, { useCallback, useMemo, useState } from 'react';
import { Clock, Filter, Grid3x3, List, Shuffle, Sparkles, TrendingUp } from 'lucide-react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { SearchBar } from '@/components/ui';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { SocialActions } from '@/components/ui/SocialActions';
import { DiscussionCardSkeleton } from '@/components/ui/Skeletons';
import { DiscoverLoadingScreen } from '@/components/ui/LoadingScreen';
import { discussionService } from '@/services/api/discussions.service';
import { userService } from '@/services/api/users.service';
import { usePrefetchDiscussion, usePrefetchUser } from '@/hooks/useOptimizedQueries';
import { perf } from '@/utils/performance';
import type { Discussion, PageComponent, UserProfile } from '@/types';

const POSTS_PER_PAGE = 10;

interface DiscoverPost extends Discussion {
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

type Category = 'all' | 'portraits' | 'landscapes' | 'street' | 'vintage' | 'colorized';
type SortOption = 'recent' | 'popular' | 'quality' | 'random';
type ViewMode = 'grid' | 'list' | 'compact';

/**
 * Discover Page Component
 * 
 * Explore and discover posts from users you don't follow
 */
export const Discover: PageComponent = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // Prefetch hooks for instant navigation
  const prefetchUser = usePrefetchUser();
  const prefetchDiscussion = usePrefetchDiscussion();

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

  // First fetch the list of users the current user is following (only if signed in)
  const { data: followingUsers, isLoading: isLoadingFollowing } = useQuery({
    queryKey: ['following', user?.id],
    queryFn: async () => {
      if (!user?.id || !isSignedIn) {
        return [];
      }
      const token = await getToken();
      try {
        const following = await userService.getUserFollowing(user.id, token || undefined);
        return following;
      } catch (error) {
        console.error('Error fetching following list:', error);
        return [];
      }
    },
    enabled: !!user?.id && isSignedIn,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Use infinite query for pagination to get discover posts
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey: ['discover', sortBy, followingUsers?.map(u => u.id), user?.id, isSignedIn],
    queryFn: async ({ pageParam = 0 }) => {
      perf.mark('discover-fetch');
      const token = isSignedIn ? await getToken() : null;
      
      // Get the IDs of users being followed (only if signed in)
      const followingIds = isSignedIn && followingUsers ? followingUsers.map(u => u.id) : [];
      
      // Also exclude the current user from discover (they see their own posts in feed) - only if signed in
      if (isSignedIn && user?.id && !followingIds.includes(user.id)) {
        followingIds.push(user.id);
      }
      
      // Fetch all discussions
      const allDiscussions = await discussionService.getAllDiscussions(token || undefined, {
        limit: 100, // Fetch more to account for filtering
        page: pageParam,
        sortBy: sortBy === 'recent' ? 'created_at' : sortBy === 'popular' ? 'view_count' : 'created_at',
        sortOrder: 'desc'
      });
      
      // Filter discussions based on user authentication status
      let discussions: Discussion[];
      if (isSignedIn) {
        // For signed-in users: filter out posts from users they're following
        discussions = allDiscussions.filter((d: Discussion) => 
          !followingIds.includes(d.user_id)
        ).slice(0, POSTS_PER_PAGE) as Discussion[];
      } else {
        // For guest users: show all posts
        discussions = allDiscussions.slice(0, POSTS_PER_PAGE) as Discussion[];
      }
      
      // Get unique user IDs and check cache first
      const userIds = [...new Set(discussions.map((d: Discussion) => d.user_id).filter(Boolean))];
      const usersMap = new Map();
      
      // Only fetch users that aren't in cache
      const uncachedUserIds: string[] = [];
      for (const userId of userIds) {
        const cachedUser = queryClient.getQueryData(['users', userId]) as UserProfile | undefined;
        if (cachedUser) {
          usersMap.set(userId, cachedUser);
        } else {
          uncachedUserIds.push(userId);
        }
      }
      
      // Batch fetch only uncached users (max 5 at a time to avoid timeouts)
      if (uncachedUserIds.length > 0) {
        const batchSize = 5;
        for (let i = 0; i < uncachedUserIds.length; i += batchSize) {
          const batch = uncachedUserIds.slice(i, i + batchSize);
          const batchPromises = batch.map(async (userId) => {
            try {
              const userData = await userService.getUserById(userId, token || undefined);
              // Cache the user data
              queryClient.setQueryData(['users', userId], userData);
              return { userId, data: userData };
            } catch (_error) {
              // Don't log errors for missing users, it's expected
              return { userId, data: null };
            }
          });
          
          const batchResults = await Promise.allSettled(batchPromises);
          batchResults.forEach((result) => {
            if (result.status === 'fulfilled' && result.value.data) {
              usersMap.set(result.value.userId, result.value.data);
            }
          });
        }
      }
      
      // Transform discussions with user data
      const transformedDiscussions = discussions.map((discussion: Discussion) => {
        const userData = usersMap.get(discussion.user_id);
        const bodyContent = (discussion as any).content || discussion.body || '';
        const extractedImages = extractImagesFromBody(bodyContent);
        const cleanContent = removeImagesFromContent(bodyContent);
        
        return {
          ...discussion,
          author: {
            username: userData?.display_name || userData?.username || (discussion as any).username || 'Anonymous',
            avatar: userData?.avatar_url || (userData as any)?.image_url || '/default-avatar.jpg'
          },
          images: ((discussion as any).images && (discussion as any).images.length > 0) ? (discussion as any).images : extractedImages,
          content: cleanContent,
          stats: {
            views: discussion.view_count || 0,
            replies: discussion.comment_count || 0,
            likes: discussion.like_count || 0
          },
          category: discussion.category_name || 'General'
        };
      });
      
      perf.measure('discover-fetch');
      return transformedDiscussions;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: DiscoverPost[], pages: DiscoverPost[][]) => {
      if (lastPage.length < POSTS_PER_PAGE) {
        return undefined;
      }
      return pages.length;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: isSignedIn ? (!!user?.id && followingUsers !== undefined) : true, // For guests: always enabled, for signed-in: wait for following list
  });

  // Filter discussions based on search and category
  const filteredDiscussions = useMemo(() => {
    // Flatten all pages of discussions
    const allDiscussions = (data?.pages.flat() || []) as DiscoverPost[];
    let filtered = [...allDiscussions];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(discussion => 
        discussion.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        discussion.author?.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        discussion.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        discussion.content?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(discussion => {
        switch (selectedCategory) {
          case 'portraits':
            return discussion.tags?.includes('portrait') || discussion.tags?.includes('portraits');
          case 'landscapes':
            return discussion.tags?.includes('landscape') || discussion.tags?.includes('landscapes');
          case 'street':
            return discussion.tags?.includes('street');
          case 'vintage':
            return discussion.tags?.includes('vintage');
          case 'colorized':
            return discussion.images && discussion.images.length > 0;
          default:
            return true;
        }
      });
    }

    // Apply client-side sorting if needed (server already sorts, but we can re-sort for random)
    if (sortBy === 'random') {
      filtered.sort(() => Math.random() - 0.5);
    }

    return filtered;
  }, [data?.pages, searchQuery, selectedCategory, sortBy]);

  // Handlers
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleCategoryChange = useCallback((category: Category) => {
    setSelectedCategory(category);
  }, []);

  const handleSortChange = useCallback((sort: SortOption) => {
    setSortBy(sort);
  }, []);

  // Prefetch on hover for instant navigation
  const handleMouseEnterDiscussion = useCallback((discussionId: string) => {
    prefetchDiscussion(discussionId);
  }, [prefetchDiscussion]);

  const handleMouseEnterUser = useCallback((userId: string) => {
    prefetchUser(userId);
  }, [prefetchUser]);

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

  // Show loading screen first, before any other content
  if (isLoading || isLoadingFollowing) {
    return <DiscoverLoadingScreen />;
  }

  return (
    <div className="discover-page">
      {/* Header Section */}
      <div className="discover-header">
        <div className="discover-header__content">
          <h1 className="discover-header__title">Discover</h1>
          <p className="discover-header__subtitle">
            {isSignedIn 
              ? "Explore posts from new users and discover amazing content from the community"
              : "Browse amazing content from the RetroLens community"
            }
          </p>
          {!isSignedIn && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 text-sm">
                 You're browsing as a guest! 
                <Link to="/" className="ml-1 font-medium text-amber-600 hover:text-amber-700 underline">
                  Sign up
                </Link> to like posts, comment, and follow other users.
              </p>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="discover-search">
          <SearchBar
            placeholder="Search posts, users, tags..."
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
        {isError ? (
          <div className="text-center py-12">
            <p className="text-red-600">Error loading discover posts: {error?.message}</p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
            >
              Try Again
            </button>
          </div>
        ) : filteredDiscussions.length === 0 ? (
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
              <h2 className="empty-state__title">No posts found</h2>
              <p className="empty-state__subtitle">
                {searchQuery || selectedCategory !== 'all' 
                  ? 'Try adjusting your filters or search terms'
                  : 'No new posts to discover right now. Check back later!'
                }
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className={`space-y-4 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : ''}`}>
              {filteredDiscussions.map(discussion => (
                <article
                  key={discussion.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                  onMouseEnter={() => handleMouseEnterDiscussion(discussion.id)}
                >
                  {/* Author Header */}
                  <div className="p-4 pb-3">
                    <div className="flex items-center justify-between">
                      {isSignedIn ? (
                        <Link
                          to={`/profile/${discussion.user_id}`}
                          className="flex items-center space-x-3 group"
                          onMouseEnter={() => handleMouseEnterUser(discussion.user_id)}
                        >
                          <div className="relative">
                            <OptimizedImage
                              src={discussion.author?.avatar || '/default-avatar.jpg'}
                              alt={discussion.author?.username || 'User'}
                              className="w-10 h-10 rounded-full"
                              priority={false}
                            />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 group-hover:text-orange-600 transition-colors">
                              {discussion.author?.username || 'Anonymous'}
                            </p>
                            <p className="text-xs text-gray-500">{formatRelativeTime(discussion.created_at)}</p>
                          </div>
                        </Link>
                      ) : (
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <OptimizedImage
                              src={discussion.author?.avatar || '/default-avatar.jpg'}
                              alt={discussion.author?.username || 'User'}
                              className="w-10 h-10 rounded-full"
                              priority={false}
                            />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {discussion.author?.username || 'Anonymous'}
                            </p>
                            <p className="text-xs text-gray-500">{formatRelativeTime(discussion.created_at)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div
                    className="px-4 pb-3 cursor-pointer"
                    onClick={() => {
                      if (isSignedIn) {
                        navigate(`/discussion/${discussion.id}`);
                      } else {
                        // For guests, show a modal or redirect to sign up
                        const shouldSignUp = window.confirm('Sign up to view full discussions and interact with the community!');
                        if (shouldSignUp) {
                          navigate('/');
                        }
                      }
                    }}
                  >
                    <h2 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {discussion.title}
                    </h2>
                    {/* Only show content if it's different from the title */}
                    {discussion.content && discussion.content.trim() && discussion.content !== discussion.title && (
                      <p className="text-gray-600 text-sm line-clamp-3">
                        {discussion.content}
                      </p>
                    )}

                    {/* Tags */}
                    {discussion.tags && discussion.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {discussion.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-orange-700 bg-orange-50 rounded-md"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Images (if any) */}
                  {discussion.images && discussion.images.length > 0 && (
                    <div className="px-4 pb-3">
                      <div className={`grid gap-2 ${discussion.images!.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {discussion.images!.slice(0, 4).map((image: string, idx: number) => (
                          <div key={idx} className="relative aspect-square">
                            <OptimizedImage
                              src={image}
                              alt={`Image ${idx + 1}`}
                              className="w-full h-full object-cover rounded-lg"
                              priority={idx === 0}
                            />
                            {discussion.images!.length > 4 && idx === 3 && (
                              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                                <span className="text-white text-2xl font-semibold">
                                  +{discussion.images!.length - 4}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Social Actions */}
                  {isSignedIn ? (
                    <SocialActions
                      discussionId={discussion.id}
                      initialLikeCount={discussion.like_count || 0}
                      initialIsLiked={discussion.is_liked || false}
                      initialCommentCount={discussion.comment_count || 0}
                      currentUserId={user?.id}
                      className="px-4"
                    />
                  ) : (
                    <div className="px-4 pb-4">
                      <div className="flex items-center justify-between text-gray-500 text-sm">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span>{discussion.like_count || 0}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span>{discussion.comment_count || 0}</span>
                          </span>
                        </div>
                        <button
                          onClick={() => navigate('/')}
                          className="text-amber-600 hover:text-amber-700 font-medium text-xs"
                        >
                          Sign up to interact
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>

            {/* Infinite scroll trigger */}
            {hasNextPage && (
              <div className="py-4">
                {isFetchingNextPage ? (
                  <DiscussionCardSkeleton />
                ) : (
                  <div className="text-center">
                    <button
                      onClick={() => fetchNextPage()}
                      className="text-orange-600 hover:text-orange-700 font-medium px-4 py-2 border border-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
                    >
                      Load More Posts
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {!hasNextPage && filteredDiscussions.length > 0 && (
              <div className="text-center py-8 text-gray-500">
                You've discovered all available posts!
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
