import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Eye, 
  MessageCircle, 
  Heart, 
  Share2, 
  Pin, 
  Plus,
  Search,
  Bell,
  User,
  Menu,
  Tag,
  X,
  Send,
  Camera,
  Image
} from 'lucide-react'
import { useUser } from '@clerk/clerk-react'
import { useApiWithAuth } from '@/hooks'
import { discussionService } from '@/services/api/discussions.service'
import type { PageComponent, Discussion, DiscussionCategory } from '@/types'
import '@/css/pages/Feed.css'

// Mock data for discussions
const mockDiscussions = [
  {
    id: '1',
    title: 'Help! My Leica M3 shutter is stuck at 1/50',
    content: 'Hi everyone, I just got a Leica M3 from an estate sale and the shutter seems to be stuck at 1/50. I\'ve tried the basic troubleshooting but nothing seems to work...',
    author: {
      username: 'vintage_lover',
      avatar: '/api/placeholder/32/32'
    },
    category: 'Restoration',
    timeAgo: '2h ago',
    stats: {
      views: 45,
      replies: 8,
      likes: 12
    },
    tags: ['leica', 'repair', 'help'],
    images: ['/api/placeholder/300/200'],
    isPinned: false
  },
  {
    id: '2',
    title: 'Just acquired this rare 1950s Exakta!',
    content: 'Look what I found at a garage sale this morning! A pristine Exakta Varex VX with the original leather case and three lenses. The owner had no idea what they had...',
    author: {
      username: 'camera_historian',
      avatar: '/api/placeholder/32/32'
    },
    category: 'Show & Tell',
    timeAgo: '5h ago',
    stats: {
      views: 234,
      replies: 45,
      likes: 89
    },
    tags: ['exakta', 'vintage', 'find'],
    images: ['/api/placeholder/400/300'],
    isPinned: false
  },
  {
    id: '3',
    title: 'Best film stocks for vintage cameras?',
    content: 'I\'m getting back into film photography with my grandfather\'s old Nikon F. What film stocks do you recommend for achieving that classic vintage look?',
    author: {
      username: 'film_enthusiast',
      avatar: '/api/placeholder/32/32'
    },
    category: 'Film & Tech',
    timeAgo: '8h ago',
    stats: {
      views: 123,
      replies: 34,
      likes: 56
    },
    tags: ['film', 'advice'],
    images: [],
    isPinned: false
  },
  {
    id: '4',
    title: 'Price check: Hasselblad 500C/M with 3 lenses',
    content: 'Looking to sell my Hasselblad 500C/M kit. Includes 80mm, 50mm, and 150mm lenses, all in excellent condition. What would be a fair asking price?',
    author: {
      username: 'collector_nyc',
      avatar: '/api/placeholder/32/32'
    },
    category: 'Market',
    timeAgo: '1d ago',
    stats: {
      views: 89,
      replies: 15,
      likes: 23
    },
    tags: ['hasselblad', 'selling'],
    images: [],
    isPinned: false
  }
]

const categories = [
  { id: 'all', name: 'All Topics', icon: '📢', count: 1245 },
  { id: 'general', name: 'General', icon: '💬', count: 324 },
  { id: 'restoration', name: 'Restoration', icon: '🔧', count: 186 },
  { id: 'show-tell', name: 'Show & Tell', icon: '📸', count: 298 },
  { id: 'film-tech', name: 'Film & Tech', icon: '🎞️', count: 167 },
  { id: 'market', name: 'Market', icon: '💰', count: 89 },
  { id: 'resources', name: 'Resources', icon: '📚', count: 234 }
]

const popularTags = [
  { tag: 'leica', count: 234 },
  { tag: 'hasselblad', count: 189 },
  { tag: '35mm', count: 167 },
  { tag: 'repair', count: 145 },
  { tag: 'film', count: 134 },
  { tag: 'nikon', count: 128 }
]

const activeMembers = [
  { username: 'user1', isOnline: true },
  { username: 'user2', isOnline: true },
  { username: 'user3', isOnline: true },
  { username: 'user4', isOnline: true },
  { username: 'user5', isOnline: true }
]

export const Feed: PageComponent = () => {
  const { user } = useUser()
  const navigate = useNavigate()
  const { makeAuthenticatedRequest } = useApiWithAuth()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [apiCategories, setApiCategories] = useState<DiscussionCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    description: '',
    imageFile: null as File | null,
    imagePreview: null as string | null
  })

  // Fetch discussions from followed users only
  useEffect(() => {
    const fetchFollowerFeed = async () => {
      if (!user?.id) return
      
      setLoading(true)
      try {
        // First, get the list of users the current user is following
        const followingResponse = await makeAuthenticatedRequest(async (token) => {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/users/${user.id}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          )
          return response.json()
        })
        
        // Get the list of user IDs that current user follows
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
        
        // Extract following user IDs
        const followingUserIds = followingList.map((f: any) => f.following_id).filter(Boolean)
        
        // Always include user's own posts
        followingUserIds.push(user.id)
        
        // Fetch all discussions
        const allDiscussions = await makeAuthenticatedRequest(async (token) =>
          discussionService.getRecentDiscussions(token, 100)
        )
        
        // Filter discussions to only show from followed users and self
        const filteredDiscussions = (allDiscussions || []).filter((discussion: any) => 
          followingUserIds.includes(discussion.user_id)
        )
        
        // Fetch user information for all discussions
        const userIds = [...new Set(filteredDiscussions.map((d: any) => d.user_id).filter(Boolean))]
        const usersMap = new Map()
        
        // Fetch user details for each unique user ID
        for (const userId of userIds) {
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
              usersMap.set(userId, userInfo)
            }
          } catch (error) {
            console.error(`Failed to fetch user ${userId}:`, error)
          }
        }
        
        // Helper function to extract image URLs from markdown
        const extractImagesFromBody = (body: string): string[] => {
          const imageRegex = /!\[.*?\]\((.*?)\)/g
          const images = []
          let match
          while ((match = imageRegex.exec(body)) !== null) {
            // Clean up the URL - remove any trailing '?' or whitespace
            const imageUrl = match[1].replace(/\?$/, '').trim()
            if (imageUrl) {
              images.push(imageUrl)
            }
          }
          return images
        }
        
        // Helper function to remove markdown images from text
        const removeImagesFromContent = (body: string): string => {
          return body.replace(/!\[.*?\]\(.*?\)/g, '').trim()
        }
        
        // Transform discussions to include proper author structure
        const transformedDiscussions = filteredDiscussions.map((discussion: any) => {
          const userData = usersMap.get(discussion.user_id)
          // Try both 'content' and 'body' fields for backward compatibility
          const bodyContent = discussion.content || discussion.body || ''
          const extractedImages = extractImagesFromBody(bodyContent)
          const cleanContent = removeImagesFromContent(bodyContent)
          
          // Debug logging - always log to see what's in the body
          console.log('Processing discussion:', discussion.id, {
            originalBody: bodyContent,
            hasMarkdownImages: bodyContent.includes('!['),
            extractedImages,
            cleanContent,
            existingImages: discussion.images,
            title: discussion.title
          })
          
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
            // Use existing images first, then try to extract from body
            images: (discussion.images && discussion.images.length > 0) ? discussion.images : extractedImages,
            // If body is empty but we have a title, use the title as content
            content: cleanContent || discussion.title || ''
          }
        })
        
        // If no discussions from followed users, show a message
        if (transformedDiscussions.length === 0 && followingUserIds.length <= 1) {
          // User is not following anyone except themselves
          setDiscussions([])
        } else {
          setDiscussions(transformedDiscussions)
        }
        
        // Fetch categories
        const fetchedCategories = await makeAuthenticatedRequest(async (token) =>
          discussionService.getCategories(token)
        )
        setApiCategories(fetchedCategories || [])
      } catch (error) {
        console.error('Failed to fetch feed:', error)
        setDiscussions([])
      } finally {
        setLoading(false)
      }
    }
    
    if (user?.id) {
      fetchFollowerFeed()
    }
  }, [user?.id, makeAuthenticatedRequest])

  const handleLike = (discussionId: string) => {
    // TODO: Implement like functionality
    console.log('Like discussion:', discussionId)
  }

  const handleShare = (discussionId: string) => {
    // TODO: Implement share functionality
    console.log('Share discussion:', discussionId)
  }

  const handleCreatePost = async () => {
    if (!createForm.imageFile) {
      alert('Please select an image to share')
      return
    }

    if (!createForm.description.trim()) {
      alert('Please add a description for your post')
      return
    }

    setIsCreating(true)
    try {
      let imageUrl = ''
      
      // First, upload the image
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
      
      // Create the discussion/post
      const newDiscussion = await makeAuthenticatedRequest(async (token) => {
        // Prepare the discussion data - only use fields the API supports
        const discussionData = {
          title: createForm.description.substring(0, 100) || 'New camera photo',
          content: `${createForm.description}${imageUrl ? `\n\n![Camera Photo](${imageUrl})` : ''}`, // Include image URL in content as markdown
          tags: ['photo', 'camera']
        }
        
        console.log('Sending discussion data:', discussionData)
        console.log('JSON stringified:', JSON.stringify(discussionData))
        
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
          const errorData = await response.text()
          console.error('Failed to create discussion:', errorData)
          throw new Error('Failed to create post')
        }
        
        return response.json()
      })

      // Add new discussion to the list with proper image
      const postWithImage = {
        ...newDiscussion,
        images: imageUrl ? [imageUrl] : createForm.imagePreview ? [createForm.imagePreview] : [],
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
      
      // Reset form and close modal
      if (createForm.imagePreview) {
        URL.revokeObjectURL(createForm.imagePreview)
      }
      setCreateForm({
        description: '',
        imageFile: null,
        imagePreview: null
      })
      setShowCreateModal(false)
      
      // Show success message
      alert('Photo shared successfully! Your followers will see it in their feed.')
    } catch (error) {
      console.error('Failed to create post:', error)
      alert('Failed to create post. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, WebP, or GIF)')
      return
    }

    // Validate file size (max 10MB)
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
  }

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (createForm.imagePreview) {
        URL.revokeObjectURL(createForm.imagePreview)
      }
    }
  }, [])

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

          {/* Active Members */}
          <div className="sidebar-section">
            <h3 className="sidebar-title">Active Members</h3>
            <div className="members-list">
              {activeMembers.map((member) => (
                <div key={member.username} className="member-item">
                  <div className={`member-status ${member.isOnline ? 'online' : 'offline'}`}></div>
                  <span className="member-name">@{member.username}</span>
                </div>
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
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading discussions...</p>
              </div>
            ) : discussions.length === 0 ? (
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
              discussions.map((discussion: any) => (
              <div key={discussion.id} className="discussion-card">
                <div className="discussion-header">
                  <img 
                    src={discussion.author?.avatar || '/api/placeholder/32/32'} 
                    alt={`${discussion.author?.username || 'User'} avatar`}
                    className="author-avatar"
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
                        console.log('Rendering image:', image)
                        return (
                          <img 
                            key={index}
                            src={image} 
                            alt="Discussion attachment"
                            className="discussion-image"
                            onError={(e) => {
                              console.error('Failed to load image:', image)
                              e.currentTarget.style.display = 'none'
                            }}
                            onLoad={() => console.log('Successfully loaded image:', image)}
                          />
                        )
                      })}
                    </div>
                  )}

                  {/* Tags */}
                  {discussion.tags.length > 0 && (
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
                    <span>{discussion.stats.views}</span>
                  </button>
                  <button className="action-btn">
                    <MessageCircle size={16} />
                    <span>{discussion.stats.replies}</span>
                  </button>
                  <button 
                    className="action-btn"
                    onClick={() => handleLike(discussion.id)}
                  >
                    <Heart size={16} />
                    <span>{discussion.stats.likes}</span>
                  </button>
                  <button 
                    className="action-btn"
                    onClick={() => handleShare(discussion.id)}
                  >
                    <Share2 size={16} />
                  </button>
                </div>
              </div>
            ))
            )}

            {/* Load More Button */}
            <button className="load-more-btn">Load More</button>
          </div>

        </main>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <h3>Categories</h3>
              <button 
                className="close-menu-btn"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="mobile-categories">
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={`mobile-category-item ${selectedCategory === category.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedCategory(category.id)
                    setIsMobileMenuOpen(false)
                  }}
                >
                  <span className="category-icon">{category.icon}</span>
                  <span className="category-name">{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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

export default Feed
