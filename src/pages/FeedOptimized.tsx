import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Eye, 
  MessageCircle, 
  Heart, 
  Share2, 
  Plus,
  X,
  Send,
  Camera,
  Image
} from 'lucide-react'
import { useUser } from '@clerk/clerk-react'
import { useApiWithAuth } from '@/hooks'
import { discussionService } from '@/services/api/discussions.service'
import { cacheService } from '@/services/cache/cache.service'
import { DiscussionSkeleton } from '@/components/ui/DiscussionSkeleton'
import type { PageComponent, Discussion, DiscussionCategory } from '@/types'
import '@/css/pages/Feed.css'
import '@/css/components/skeleton.css'

// Constants
const DISCUSSIONS_PER_PAGE = 10
const CACHE_TTL = 2 * 60 * 1000 // 2 minutes cache

const categories = [
  { id: 'all', name: 'All Topics', icon: '📢', count: 0 },
  { id: 'general', name: 'General', icon: '💬', count: 0 },
  { id: 'restoration', name: 'Restoration', icon: '🔧', count: 0 },
  { id: 'show-tell', name: 'Show & Tell', icon: '📸', count: 0 },
  { id: 'film-tech', name: 'Film & Tech', icon: '🎞️', count: 0 },
  { id: 'market', name: 'Market', icon: '💰', count: 0 },
  { id: 'resources', name: 'Resources', icon: '📚', count: 0 }
]

const popularTags = [
  { tag: 'leica', count: 234 },
  { tag: 'hasselblad', count: 189 },
  { tag: '35mm', count: 167 },
  { tag: 'repair', count: 145 },
  { tag: 'film', count: 134 },
  { tag: 'nikon', count: 128 }
]

// Individual Image Component with its own loading state
const DiscussionImage = React.memo<{ src: string; alt: string }>(({ src, alt }) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  return (
    <div className="image-container">
      {!imageLoaded && !imageError && (
        <div className="skeleton skeleton-image" style={{ height: '200px' }}></div>
      )}
      <img 
        src={src} 
        alt={alt}
        className="discussion-image"
        loading="lazy"
        onLoad={() => {
          console.log('Image loaded:', src)
          setImageLoaded(true)
        }}
        onError={(e) => {
          console.error('Failed to load image:', src)
          setImageError(true)
          e.currentTarget.style.display = 'none'
        }}
        style={{ display: imageLoaded && !imageError ? 'block' : 'none' }}
      />
    </div>
  )
})

DiscussionImage.displayName = 'DiscussionImage'

// Memoized Discussion Card Component
const DiscussionCard = React.memo<{ 
  discussion: Discussion
  onLike: (id: string) => void
  onShare: (id: string) => void
}>(({ discussion, onLike, onShare }) => {
  return (
    <div className="discussion-card">
      <div className="discussion-header">
        <img 
          src={discussion.author?.avatar || '/api/placeholder/32/32'} 
          alt={`${discussion.author?.username || 'User'} avatar`}
          className="author-avatar"
          loading="lazy"
        />
        <div className="discussion-info">
          <div className="author-line">
            <span className="author-name">@{discussion.author?.username || 'unknown'}</span>
            <span className="discussion-time">{discussion.timeAgo}</span>
          </div>
          <span className="discussion-category">{discussion.category}</span>
        </div>
      </div>

      <div className="discussion-content">
        <h3 className="discussion-title">{discussion.title}</h3>
        <p className="discussion-excerpt">
          {discussion.content}
          {discussion.content && discussion.content.length > 200 && (
            <button className="read-more-btn">Read More</button>
          )}
        </p>

        {/* Images */}
        {discussion.images && discussion.images.length > 0 && (
          <div className="discussion-images">
            {discussion.images.filter((img: string) => img && img.trim() !== '').map((image, index) => {
              console.log('Rendering image in discussion:', discussion.id, image)
              return (
                <DiscussionImage 
                  key={`${discussion.id}-${index}`} 
                  src={image} 
                  alt="Discussion attachment" 
                />
              )
            })}
          </div>
        )}

        {/* Tags */}
        {discussion.tags && discussion.tags.length > 0 && (
          <div className="discussion-tags">
            {discussion.tags.map((tag) => (
              <span key={tag} className="tag">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      <div className="discussion-actions">
        <button className="action-btn">
          <Eye size={16} />
          <span>{discussion.stats?.views || 0}</span>
        </button>
        <button className="action-btn">
          <MessageCircle size={16} />
          <span>{discussion.stats?.replies || 0}</span>
        </button>
        <button 
          className="action-btn"
          onClick={() => onLike(discussion.id)}
        >
          <Heart size={16} />
          <span>{discussion.stats?.likes || 0}</span>
        </button>
        <button 
          className="action-btn"
          onClick={() => onShare(discussion.id)}
        >
          <Share2 size={16} />
        </button>
      </div>
    </div>
  )
})

DiscussionCard.displayName = 'DiscussionCard'

export const FeedOptimized: PageComponent = () => {
  const { user } = useUser()
  const navigate = useNavigate()
  const { makeAuthenticatedRequest } = useApiWithAuth()
  
  // State
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [isCreating, setIsCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    description: '',
    imageFile: null as File | null,
    imagePreview: null as string | null
  })
  
  // Refs
  const observerRef = useRef<IntersectionObserver>()
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const usersMapRef = useRef<Map<string, any>>(new Map())

  // Helper function to extract images from markdown
  const extractImagesFromBody = useCallback((body: string): string[] => {
    const imageRegex = /!\[.*?\]\((.*?)\)/g
    const images = []
    let match
    while ((match = imageRegex.exec(body)) !== null) {
      const imageUrl = match[1].replace(/\?$/, '').trim()
      if (imageUrl) {
        images.push(imageUrl)
      }
    }
    return images
  }, [])

  // Helper function to remove markdown images from text
  const removeImagesFromContent = useCallback((body: string): string => {
    return body.replace(/!\[.*?\]\(.*?\)/g, '').trim()
  }, [])

  // Fetch user data with caching
  const fetchUserData = useCallback(async (userIds: string[]) => {
    const newUsers = new Map(usersMapRef.current)
    const uncachedIds = userIds.filter(id => !newUsers.has(id))
    
    if (uncachedIds.length === 0) {
      return newUsers
    }

    // Batch fetch user data
    const userPromises = uncachedIds.map(async (userId) => {
      const cacheKey = cacheService.getUserKey(userId)
      
      // Check cache first
      const cached = cacheService.get(cacheKey)
      if (cached) {
        return { userId, data: cached }
      }

      // Fetch from API
      try {
        const userInfo = await makeAuthenticatedRequest(async (token) => {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/users/${userId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          )
          if (response.ok) {
            return response.json()
          }
          return null
        })
        
        if (userInfo) {
          // Cache the result
          cacheService.set(cacheKey, userInfo, CACHE_TTL)
          return { userId, data: userInfo }
        }
      } catch (error) {
        console.error(`Failed to fetch user ${userId}:`, error)
      }
      
      return { userId, data: null }
    })

    const results = await Promise.all(userPromises)
    results.forEach(({ userId, data }) => {
      if (data) {
        newUsers.set(userId, data)
      }
    })

    usersMapRef.current = newUsers
    return newUsers
  }, [makeAuthenticatedRequest])

  // Load discussions with pagination
  const loadDiscussions = useCallback(async (isLoadMore = false) => {
    if (!user?.id) return
    
    const cacheKey = cacheService.getFeedKey(user.id)
    
    // Use cache for initial load only
    if (!isLoadMore && page === 0) {
      const cached = cacheService.get<Discussion[]>(cacheKey)
      if (cached && cached.length > 0) {
        setDiscussions(cached)
        setLoading(false)
        return
      }
    }
    
    if (isLoadMore) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }

    try {
      // Get following list with caching
      const followingCacheKey = cacheService.getFollowingKey(user.id)
      let followingUserIds = cacheService.get<string[]>(followingCacheKey)
      
      if (!followingUserIds) {
        const followingList = await makeAuthenticatedRequest(async (token) => {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/follows?follower_id=${user.id}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          )
          if (response.ok) {
            return response.json()
          }
          return []
        }).catch(() => [])
        
        followingUserIds = followingList.map((f: any) => f.following_id).filter(Boolean)
        followingUserIds.push(user.id) // Include user's own posts
        
        // Cache the following list
        cacheService.set(followingCacheKey, followingUserIds, CACHE_TTL * 2)
      }

      // Fetch discussions
      const offset = page * DISCUSSIONS_PER_PAGE
      const allDiscussions = await makeAuthenticatedRequest(async (token) =>
        discussionService.getRecentDiscussions(token, DISCUSSIONS_PER_PAGE, offset)
      )
      
      if (!allDiscussions || allDiscussions.length === 0) {
        setHasMore(false)
        return
      }

      // Filter discussions from followed users
      const filteredDiscussions = allDiscussions.filter((discussion: any) => 
        followingUserIds.includes(discussion.user_id)
      )
      
      // Get unique user IDs
      const userIds = [...new Set(filteredDiscussions.map((d: any) => d.user_id).filter(Boolean))]
      
      // Fetch user data in parallel
      const usersMap = await fetchUserData(userIds)
      
      // Transform discussions
      const transformedDiscussions = filteredDiscussions.map((discussion: any) => {
        const userData = usersMap.get(discussion.user_id)
        const bodyContent = discussion.content || discussion.body || ''
        const extractedImages = extractImagesFromBody(bodyContent)
        const cleanContent = removeImagesFromContent(bodyContent)
        
        return {
          ...discussion,
          author: discussion.author || {
            username: userData?.username || userData?.full_name || discussion.username || 'Unknown',
            avatar: userData?.avatar_url || userData?.image_url || '/api/placeholder/32/32'
          },
          timeAgo: discussion.timeAgo || 'Recently',
          stats: discussion.stats || {
            views: 0,
            replies: 0,
            likes: 0
          },
          tags: discussion.tags || [],
          images: (discussion.images && discussion.images.length > 0) ? discussion.images : extractedImages,
          content: cleanContent || discussion.title || ''
        }
      })
      
      if (isLoadMore) {
        setDiscussions(prev => [...prev, ...transformedDiscussions])
      } else {
        setDiscussions(transformedDiscussions)
        // Cache initial results
        if (page === 0) {
          cacheService.set(cacheKey, transformedDiscussions, CACHE_TTL)
        }
      }
      
      setHasMore(transformedDiscussions.length === DISCUSSIONS_PER_PAGE)
      
    } catch (error) {
      console.error('Failed to fetch feed:', error)
      if (!isLoadMore) {
        setDiscussions([])
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [user?.id, page, makeAuthenticatedRequest, fetchUserData, extractImagesFromBody, removeImagesFromContent])

  // Initial load
  useEffect(() => {
    if (user?.id) {
      loadDiscussions(false)
    }
  }, [user?.id])

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    if (loading) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setPage(prev => prev + 1)
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    observerRef.current = observer

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [loading, hasMore, loadingMore])

  // Load more when page changes
  useEffect(() => {
    if (page > 0) {
      loadDiscussions(true)
    }
  }, [page])

  // Memoized callbacks
  const handleLike = useCallback((discussionId: string) => {
    console.log('Like discussion:', discussionId)
    // Optimistic update
    setDiscussions(prev => prev.map(d => 
      d.id === discussionId 
        ? { ...d, stats: { ...d.stats, likes: (d.stats?.likes || 0) + 1 } }
        : d
    ))
  }, [])

  const handleShare = useCallback((discussionId: string) => {
    console.log('Share discussion:', discussionId)
  }, [])

  const handleCreatePost = useCallback(async () => {
    if (!createForm.imageFile || !createForm.description.trim()) {
      alert('Please select an image and add a description')
      return
    }

    setIsCreating(true)
    try {
      let imageUrl = ''
      
      // Upload image
      if (createForm.imageFile) {
        const formData = new FormData()
        formData.append('file', createForm.imageFile)
        
        const uploadResponse = await makeAuthenticatedRequest(async (token) => {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/upload/camera-image?user_id=${user?.id}`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
              },
              body: formData
            }
          )
          
          if (!response.ok) {
            throw new Error('Failed to upload image')
          }
          
          return response.json()
        })
        
        imageUrl = uploadResponse.url || uploadResponse.image_url || ''
      }
      
      // Create discussion
      const newDiscussion = await makeAuthenticatedRequest(async (token) => {
        const discussionData = {
          title: createForm.description.substring(0, 100) || 'New camera photo',
          content: `${createForm.description}${imageUrl ? `\n\n![Camera Photo](${imageUrl})` : ''}`,
          tags: ['photo', 'camera']
        }
        
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/discussions?user_id=${user?.id}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(discussionData)
          }
        )
        
        if (!response.ok) {
          throw new Error('Failed to create post')
        }
        
        return response.json()
      })

      // Add to discussions with optimistic update
      const postWithImage = {
        ...newDiscussion,
        images: imageUrl ? [imageUrl] : [],
        content: createForm.description,
        author: {
          username: user?.username || user?.firstName || 'You',
          avatar: user?.imageUrl || '/default-avatar.png'
        },
        timeAgo: 'Just now',
        stats: {
          views: 0,
          replies: 0,
          likes: 0
        }
      }
      
      setDiscussions([postWithImage, ...discussions])
      
      // Invalidate cache
      cacheService.clear(cacheService.getFeedKey(user?.id || ''))
      
      // Reset form
      if (createForm.imagePreview) {
        URL.revokeObjectURL(createForm.imagePreview)
      }
      setCreateForm({
        description: '',
        imageFile: null,
        imagePreview: null
      })
      setShowCreateModal(false)
      
    } catch (error) {
      console.error('Failed to create post:', error)
      alert('Failed to create post. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }, [createForm, user, discussions, makeAuthenticatedRequest])

  const handleImageSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 10MB')
      return
    }

    // Create preview
    const previewUrl = URL.createObjectURL(file)
    setCreateForm({
      ...createForm,
      imageFile: file,
      imagePreview: previewUrl
    })
  }, [createForm])

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (createForm.imagePreview) {
        URL.revokeObjectURL(createForm.imagePreview)
      }
    }
  }, [])

  // Memoized filtered discussions
  const filteredDiscussions = useMemo(() => {
    if (selectedCategory === 'all') return discussions
    return discussions.filter(d => d.category?.toLowerCase() === selectedCategory.toLowerCase())
  }, [discussions, selectedCategory])

  return (
    <div className="feed-page">
      <div className="feed-container">
        {/* Desktop Sidebar */}
        <aside className="feed-sidebar desktop-only">
          {/* Categories Section */}
          <div className="sidebar-section">
            <h3 className="sidebar-title">Categories</h3>
            <div className="categories-list">
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={`category-item ${selectedCategory === category.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <span className="category-icon">{category.icon}</span>
                  <span className="category-name">{category.name}</span>
                  <span className="category-count">({category.count})</span>
                </button>
              ))}
            </div>
            <button 
              className="new-topic-btn"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={16} />
              Share Photo
            </button>
          </div>

          {/* Popular Tags */}
          <div className="sidebar-section">
            <h3 className="sidebar-title">Popular Tags</h3>
            <div className="tags-list">
              {popularTags.map((item) => (
                <button key={item.tag} className="tag-item">
                  #{item.tag} ({item.count})
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="feed-main">
          {/* Create Post Button for Mobile */}
          <button 
            className="mobile-create-btn"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={20} />
            <span>Share Photo</span>
          </button>

          {/* Discussion Feed */}
          <div className="discussions-feed">
            {loading ? (
              <DiscussionSkeleton count={3} />
            ) : filteredDiscussions.length === 0 ? (
              <div className="empty-state">
                <MessageCircle size={48} />
                <h3>Your feed is empty</h3>
                <p>Follow other users to see their posts here, or share your first photo!</p>
                <div className="empty-state-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowCreateModal(true)}
                  >
                    Share Your First Photo
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => navigate('/discover')}
                  >
                    Discover Users
                  </button>
                </div>
              </div>
            ) : (
              <>
                {filteredDiscussions.map((discussion) => (
                  <DiscussionCard 
                    key={discussion.id}
                    discussion={discussion}
                    onLike={handleLike}
                    onShare={handleShare}
                  />
                ))}
                
                {/* Loading more indicator */}
                {loadingMore && (
                  <DiscussionSkeleton count={2} />
                )}
                
                {/* Intersection observer target */}
                {hasMore && !loadingMore && (
                  <div ref={loadMoreRef} className="load-more-trigger" style={{ height: '20px' }} />
                )}
                
                {/* No more posts message */}
                {!hasMore && filteredDiscussions.length > 0 && (
                  <div className="no-more-posts">
                    <p>You've reached the end of your feed</p>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Create Post Modal - Simplified */}
      {showCreateModal && (
        <div className="create-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="create-modal simple" onClick={(e) => e.stopPropagation()}>
            <div className="create-modal-header">
              <h2>Share Your Camera Photo</h2>
              <button 
                className="close-modal-btn"
                onClick={() => {
                  if (createForm.imagePreview) {
                    URL.revokeObjectURL(createForm.imagePreview)
                  }
                  setCreateForm({
                    description: '',
                    imageFile: null,
                    imagePreview: null
                  })
                  setShowCreateModal(false)
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div className="create-modal-body">
              {/* Image Upload Section */}
              <div className="form-group">
                <label className="image-upload-label">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
                  />
                  {createForm.imagePreview ? (
                    <div className="image-preview-container">
                      <img 
                        src={createForm.imagePreview} 
                        alt="Preview" 
                        className="image-preview"
                      />
                      <div className="image-overlay">
                        <Camera size={24} />
                        <span>Click to change photo</span>
                      </div>
                    </div>
                  ) : (
                    <div className="image-upload-placeholder">
                      <Image size={48} />
                      <h3>Upload Your Photo</h3>
                      <p>Click to select an image from your device</p>
                      <span className="file-info">JPEG, PNG, WebP or GIF • Max 10MB</span>
                    </div>
                  )}
                </label>
              </div>

              {/* Description Section */}
              <div className="form-group">
                <label htmlFor="description">Tell us about this photo</label>
                <textarea
                  id="description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  rows={4}
                  placeholder="Share the story behind this camera or photo..."
                  maxLength={500}
                />
                <span className="char-count">{createForm.description.length}/500</span>
              </div>
            </div>

            <div className="create-modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  if (createForm.imagePreview) {
                    URL.revokeObjectURL(createForm.imagePreview)
                  }
                  setCreateForm({
                    description: '',
                    imageFile: null,
                    imagePreview: null
                  })
                  setShowCreateModal(false)
                }}
                disabled={isCreating}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleCreatePost}
                disabled={isCreating || !createForm.imageFile || !createForm.description.trim()}
              >
                {isCreating ? (
                  <>
                    <div className="spinner-small" />
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <span>Share Photo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FeedOptimized
