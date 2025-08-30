import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Camera,
  Clock,
  Edit,
  EyeOff,
  Hash,
  MoreVertical,
  Plus,
  Trash2,
  TrendingUp,
  Upload,
  X
} from 'lucide-react';

import { queryKeys } from '@/lib/react-query';
import { discussionService } from '@/services/api/discussions.service';
import { userService } from '@/services/api/users.service';
import { DiscussionCardSkeleton, FeedSkeleton } from '@/components/ui/Skeletons';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { SocialActions } from '@/components/ui/SocialActions';
import EditDiscussionModal from '@/components/ui/EditDiscussionModal';
import { usePrefetchDiscussion, usePrefetchUser } from '@/hooks/useOptimizedQueries';
import { perf, throttle } from '@/utils/performance';
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
  content?: string;
  images?: string[];
}

const FeedOptimizedV2: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [sortBy, setSortBy] = useState<'created_at' | 'view_count' | 'comment_count'>('created_at');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [createForm, setCreateForm] = useState({
    description: '',
    imageFile: null as File | null,
    imagePreview: null as string | null
  });

  // Edit/Delete/Hide functionality
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingDiscussion, setEditingDiscussion] = useState<FeedPost | null>(null);
  const [hiddenPosts, setHiddenPosts] = useState<Set<string>>(new Set());
  const [showMenuForPost, setShowMenuForPost] = useState<string | null>(null);
  
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

  // First fetch the list of users the current user is following
  const { data: followingUsers, isLoading: isLoadingFollowing } = useQuery({
    queryKey: ['following', user?.id],
    queryFn: async () => {
      if (!user?.id) {return [];}
      const token = await getToken();
      try {
        const following = await userService.getUserFollowing(user.id, token || undefined);
        // Following users loaded: following.length
        return following;
      } catch (error) {
        console.error('Error fetching following list:', error);
        return [];
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

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
    queryKey: ['feed', sortBy, followingUsers?.map(u => u.id), user?.id],
    queryFn: async ({ pageParam = 0 }) => {
      perf.mark('feed-fetch');
      const token = await getToken();
      
      // Get the IDs of users being followed, including the current user
      const followingIds = followingUsers ? followingUsers.map(u => u.id) : [];
      
      // Always include the current user's posts in their feed
      if (user?.id && !followingIds.includes(user.id)) {
        followingIds.push(user.id);
      }
      
      // If no users to show posts from (shouldn't happen if user is logged in)
      if (followingIds.length === 0) {
        perf.measure('feed-fetch');
        return [];
      }
      
      // Fetch all discussions (we'll filter them client-side for now)
      // In a production app, you'd want to filter server-side
      const allDiscussions = await discussionService.getAllDiscussions(token || undefined, {
        limit: 100, // Fetch more to account for filtering
        page: pageParam,
        sortBy: sortBy as any,
        sortOrder: 'desc'
      });
      
      // Filter discussions to only those from followed users
      const discussions = allDiscussions.filter((d: any) => 
        followingIds.includes(d.user_id)
      ).slice(0, POSTS_PER_PAGE) as Discussion[];
      
      // Get unique user IDs and check cache first
      const userIds = [...new Set(discussions.map((d: any) => d.user_id).filter(Boolean))];
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
    initialPageParam: 0,
    getNextPageParam: (lastPage: any, pages: any[]) => {
      if (lastPage.length < POSTS_PER_PAGE) {return undefined;}
      return pages.length;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!user?.id && !!followingUsers, // Only run if user is logged in and we have following list
  });

  // Flatten all pages of discussions and filter out hidden posts
  const allDiscussions = (data?.pages.flat() || []).filter(discussion => !hiddenPosts.has(discussion.id));

  // Set up infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) {return;}

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
      const _scrolled = window.scrollY > 100;
      // You can add a state here to show/hide a "back to top" button
    }, 100),
    []
  );

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMenuForPost) {
        const target = event.target as HTMLElement;
        // Don't close if clicking on the menu button or menu items
        if (!target.closest('.discussion-menu-container')) {
          setShowMenuForPost(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenuForPost]);

  // Format relative time
  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffMs = now.getTime() - postDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {return 'just now';}
    if (diffMins < 60) {return `${diffMins}m ago`;}
    if (diffHours < 24) {return `${diffHours}h ago`;}
    if (diffDays < 30) {return `${diffDays}d ago`;}
    return postDate.toLocaleDateString();
  };

  // Handle image selection for new post
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image must be less than 10MB');
        return;
      }
      
      setCreateForm(prev => ({
        ...prev,
        imageFile: file,
        imagePreview: URL.createObjectURL(file)
      }));
    }
  };

  // Handle edit, delete, and hide actions
  const handleEdit = (discussion: FeedPost) => {
    setEditingDiscussion(discussion);
    setEditModalOpen(true);
    setShowMenuForPost(null);
  };

  const handleSaveEdit = async (discussionId: string, data: any) => {
    if (!user?.id) {return;}

    try {
      const token = await getToken();
      await discussionService.updateDiscussion(discussionId, user.id, data, token || undefined);
      
      // Invalidate queries to refresh feed
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      
    } catch (error) {
      console.error('Failed to update discussion:', error);
      throw error;
    }
  };

  const handleDelete = async (discussionId: string) => {
    if (!user?.id) {return;}

    try {
      const token = await getToken();
      await discussionService.deleteDiscussion(discussionId, user.id, token || undefined);
      
      // Invalidate queries to refresh feed
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      
    } catch (error) {
      console.error('Failed to delete discussion:', error);
      throw error;
    }
  };

  const handleHide = (discussionId: string) => {
    setHiddenPosts(prev => new Set([...prev, discussionId]));
    setShowMenuForPost(null);
  };

  // Handle create post submission
  const handleCreatePost = async () => {
    if (!createForm.imageFile || !createForm.description.trim()) {
      alert('Please add both an image and a description');
      return;
    }
    
    setIsCreatingPost(true);
    try {
      const token = await getToken();
      let imageUrl = '';
      
      // Upload image first using the correct endpoint from API docs
      if (createForm.imageFile) {
        const formData = new FormData();
        formData.append('file', createForm.imageFile);
        
        // Using /api/v1/upload/camera-image endpoint as per API docs
        const uploadResponse = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/upload/camera-image${user?.id ? `?user_id=${user.id}` : ''}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          }
        );
        
        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.text();
          console.error('Upload failed:', errorData);
          throw new Error('Failed to upload image');
        }
        
        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.url || uploadData.image_url || '';
      }
      
      // Create the discussion/post using the correct endpoint and body structure
      // Note: API uses 'content' field, not 'body' as shown in the error
      const discussionData = {
        title: createForm.description.substring(0, 100) || 'New camera photo',
        content: imageUrl ? `![Camera Photo](${imageUrl})` : createForm.description,
        tags: [],  // No hardcoded tags - let users add their own if needed
        // Note: category_id should be a UUID, not a name. We'll omit it for now
        // You may want to fetch categories and use the actual ID
      };
      
      // Using /api/v1/discussions/ endpoint with user_id as query param as per API docs
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/discussions/?user_id=${user?.id}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(discussionData)
        }
      );
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Create discussion failed:', errorData);
        throw new Error('Failed to create post');
      }
      
      // Invalidate queries to refresh feed
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.discussions.all });
      
      // Clean up and close modal
      if (createForm.imagePreview) {
        URL.revokeObjectURL(createForm.imagePreview);
      }
      setCreateForm({
        description: '',
        imageFile: null,
        imagePreview: null
      });
      setShowCreateModal(false);
      
      // Refresh the feed
      refetch();
      
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsCreatingPost(false);
    }
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
          <div className="relative discussion-menu-container">
            <button 
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowMenuForPost(showMenuForPost === discussion.id ? null : discussion.id);
              }}
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            
            {showMenuForPost === discussion.id && (
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 min-w-[120px]">
                {user?.id === discussion.user_id ? (
                  <>
                    <button
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(discussion);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this post?')) {
                          handleDelete(discussion.id);
                        }
                        setShowMenuForPost(null);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </>
                ) : (
                  <button
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleHide(discussion.id);
                    }}
                  >
                    <EyeOff className="w-4 h-4" />
                    Hide
                  </button>
                )}
              </div>
            )}
          </div>
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
      <SocialActions
        discussionId={discussion.id}
        initialLikeCount={discussion.like_count || 0}
        initialIsLiked={discussion.is_liked || false}
        initialCommentCount={discussion.comment_count || 0}
        currentUserId={user?.id}
        className="px-4"
      />
    </article>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Create New Post</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Image Upload Area */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Camera Photo
                </label>
                {!createForm.imagePreview ? (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Camera className="w-10 h-10 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageSelect}
                    />
                  </label>
                ) : (
                  <div className="relative">
                    <img
                      src={createForm.imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => {
                        if (createForm.imagePreview) {
                          URL.revokeObjectURL(createForm.imagePreview);
                        }
                        setCreateForm(prev => ({
                          ...prev,
                          imageFile: null,
                          imagePreview: null
                        }));
                      }}
                      className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                )}
              </div>

              {/* Description Input */}
              <div className="mb-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  placeholder="Tell us about your camera..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  maxLength={500}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {createForm.description.length}/500 characters
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={isCreatingPost}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePost}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  disabled={isCreatingPost || !createForm.imageFile || !createForm.description.trim()}
                >
                  {isCreatingPost ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Post
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* New Post Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              New Post
            </button>
            
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
        {(isLoading || isLoadingFollowing) ? (
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
            {followingUsers && followingUsers.length === 0 ? (
              <>
                <p className="text-gray-500 text-lg mb-2">Welcome to your feed!</p>
                <p className="text-gray-400 mb-4">Start by creating your first post or follow other users to see their posts here!</p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                  >
                    Create Post
                  </button>
                  <button
                    onClick={() => navigate('/discover')}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Discover Users
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-500 text-lg">No new posts</p>
                <p className="text-gray-400 mt-2">Check back later for updates from people you follow</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {allDiscussions.map((discussion: FeedPost) => renderDiscussionCard(discussion))}
            
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

      {/* Edit Discussion Modal */}
      {editModalOpen && editingDiscussion && (
        <EditDiscussionModal
          discussion={{
            ...editingDiscussion,
            author: {
              username: editingDiscussion.author?.username || 'Unknown',
              avatar: editingDiscussion.author?.avatar || '/default-avatar.jpg'
            }
          } as any}
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setEditingDiscussion(null);
          }}
          onSave={handleSaveEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default FeedOptimizedV2;
