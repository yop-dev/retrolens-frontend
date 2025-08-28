import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Calendar,
  ChevronLeft,
  MoreVertical,
  TrendingUp,
  Clock,
  Hash,
  Eye
} from 'lucide-react';

import { queryKeys } from '@/lib/react-query';
import { discussionService } from '@/services/api/discussions.service';
import { userService } from '@/services/api/users.service';
import { FeedSkeleton, DiscussionCardSkeleton } from '@/components/ui/Skeletons';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { usePrefetchUser, usePrefetchDiscussion } from '@/hooks/useOptimizedQueries';
import { perf, throttle } from '@/utils/performance';
import { formatRelativeTime } from '@/utils/date.utils';
import type { Discussion, UserProfile } from '@/types';

const POSTS_PER_PAGE = 10;

interface FeedPost extends Discussion {
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
}

const FeedOptimizedV2: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [sortBy, setSortBy] = useState<'created_at' | 'view_count' | 'comment_count'>('created_at');
  
  // Prefetch hooks for instant navigation
  const prefetchUser = usePrefetchUser();
  const prefetchDiscussion = usePrefetchDiscussion();
  
  // Intersection observer for infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);

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

  // Use infinite query for pagination
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
    queryKey: queryKeys.discussions.list({ sortBy, sortOrder: 'desc' }),
    queryFn: async ({ pageParam = 0 }) => {
      perf.mark('feed-fetch');
      const token = await getToken();
      
      // Fetch discussions
      const discussions = await discussionService.getAllDiscussions(token || undefined, {
        limit: POSTS_PER_PAGE,
        page: pageParam,
        sortBy: sortBy as any,
        sortOrder: 'desc'
      });
      
      // Get unique user IDs
      const userIds = [...new Set(discussions.map((d: any) => d.user_id).filter(Boolean))];
      
      // Fetch user data in parallel
      const userPromises = userIds.map(async (userId: string) => {
        try {
          const userData = await userService.getUserById(userId, token || undefined);
          return { userId, data: userData };
        } catch (error) {
          console.error(`Failed to fetch user ${userId}:`, error);
          return { userId, data: null };
        }
      });
      
      const userResults = await Promise.all(userPromises);
      const usersMap = new Map(userResults.map(({ userId, data }) => [userId, data]));
      
      // Transform discussions with user data
      const transformedDiscussions = discussions.map((discussion: any) => {
        const userData = usersMap.get(discussion.user_id);
        const bodyContent = discussion.content || discussion.body || '';
        const extractedImages = extractImagesFromBody(bodyContent);
        const cleanContent = removeImagesFromContent(bodyContent);
        
        return {
          ...discussion,
          author: {
            username: userData?.username || userData?.full_name || discussion.username || 'Anonymous',
            avatar: userData?.avatar_url || userData?.image_url || '/default-avatar.jpg'
          },
          images: (discussion.images && discussion.images.length > 0) ? discussion.images : extractedImages,
          content: cleanContent,
          stats: {
            views: discussion.view_count || 0,
            replies: discussion.comment_count || 0,
            likes: discussion.like_count || 0
          },
          category: discussion.category_name || 'General'
        };
      });
      
      perf.measure('feed-fetch');
      return transformedDiscussions;
    },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.length < POSTS_PER_PAGE) return undefined;
      return pages.length;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });

  // Flatten all pages of discussions
  const allDiscussions = data?.pages.flat() || [];

  // Set up infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Prefetch on hover for instant navigation
  const handleMouseEnterDiscussion = useCallback((discussionId: string) => {
    prefetchDiscussion(discussionId);
  }, [prefetchDiscussion]);

  const handleMouseEnterUser = useCallback((userId: string) => {
    prefetchUser(userId);
  }, [prefetchUser]);

  // Handle sort change
  const handleSortChange = (newSort: typeof sortBy) => {
    setSortBy(newSort);
    // Clear the cache for discussions when sort changes
    queryClient.removeQueries({ queryKey: queryKeys.discussions.all });
  };

  // Optimized scroll handler
  const handleScroll = useCallback(
    throttle(() => {
      const scrolled = window.scrollY > 100;
      // You can add a state here to show/hide a "back to top" button
    }, 100),
    []
  );

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Format relative time
  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffMs = now.getTime() - postDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return postDate.toLocaleDateString();
  };

  // Render a single discussion card
  const renderDiscussionCard = (discussion: FeedPost) => (
    <article
      key={discussion.id}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
      onMouseEnter={() => handleMouseEnterDiscussion(discussion.id)}
    >
      {/* Author Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between">
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
          <button className="text-gray-400 hover:text-gray-600">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        className="px-4 pb-3 cursor-pointer"
        onClick={() => navigate(`/discussion/${discussion.id}`)}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {discussion.title}
        </h2>
        <p className="text-gray-600 text-sm line-clamp-3">
          {discussion.body || discussion.content}
        </p>

        {/* Tags */}
        {discussion.tags && discussion.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {discussion.tags.map((tag) => (
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
      {discussion.images && discussion.images.length > 0 && (
        <div className="px-4 pb-3">
          <div className={`grid gap-2 ${discussion.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {discussion.images.slice(0, 4).map((image, idx) => (
              <div key={idx} className="relative aspect-square">
                <OptimizedImage
                  src={image}
                  alt={`Image ${idx + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                  priority={idx === 0}
                />
                {discussion.images.length > 4 && idx === 3 && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                    <span className="text-white text-2xl font-semibold">
                      +{discussion.images.length - 4}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button className="flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-colors">
              <Heart className="w-5 h-5" />
              <span className="text-sm">0</span>
            </button>
            <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors">
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm">{discussion.comment_count || 0}</span>
            </button>
            <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
          <button className="text-gray-500 hover:text-orange-500 transition-colors">
            <Bookmark className="w-5 h-5" />
          </button>
        </div>
      </div>
    </article>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center">
            {/* Sort Options */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleSortChange('created_at')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  sortBy === 'created_at'
                    ? 'bg-orange-100 text-orange-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Clock className="w-4 h-4 inline mr-1" />
                Latest
              </button>
              <button
                onClick={() => handleSortChange('view_count')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  sortBy === 'view_count'
                    ? 'bg-orange-100 text-orange-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <TrendingUp className="w-4 h-4 inline mr-1" />
                Popular
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {isLoading ? (
          <FeedSkeleton />
        ) : isError ? (
          <div className="text-center py-12">
            <p className="text-red-600">Error loading feed: {error?.message}</p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
            >
              Try Again
            </button>
          </div>
        ) : allDiscussions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No discussions yet</p>
            <p className="text-gray-400 mt-2">Be the first to start a conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {allDiscussions.map(renderDiscussionCard)}
            
            {/* Infinite scroll trigger */}
            {hasNextPage && (
              <div ref={loadMoreRef} className="py-4">
                {isFetchingNextPage ? (
                  <DiscussionCardSkeleton />
                ) : (
                  <div className="text-center">
                    <button
                      onClick={() => fetchNextPage()}
                      className="text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Load more
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {!hasNextPage && allDiscussions.length > 0 && (
              <div className="text-center py-8 text-gray-500">
                You've reached the end!
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default FeedOptimizedV2;
