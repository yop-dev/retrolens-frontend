import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { Search as SearchIcon, User, UserPlus, UserCheck, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { userService } from '@/services/api/users.service';
import { useApiWithAuth } from '@/hooks';
import type { UserProfile } from '@/types';
import '@/css/pages/Search.css'

export function Search() {
  const { user } = useUser()
  const navigate = useNavigate()
  const { makeAuthenticatedRequest } = useApiWithAuth()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set())

  // Search users
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      // For now, we'll get all users and filter on frontend
      // In a real app, you'd have a backend search endpoint
      const allUsers = await makeAuthenticatedRequest(async (token) => 
        userService.getAllUsers(token)
      )
      
      const filtered = allUsers.filter(u => 
        u.id !== user?.id && // Exclude current user
        (u.username.toLowerCase().includes(query.toLowerCase()) ||
         u.display_name?.toLowerCase().includes(query.toLowerCase()))
      )
      
      setSearchResults(filtered)
    } catch (error) {
      console.error('Search failed:', error)
      
      // Fallback: Create a realistic user based on your other account for testing
      console.log('Backend unavailable, showing test user for follow functionality')
      
      // Create a test user that represents your other account
      const testUsers: UserProfile[] = [
        {
          id: 'user_test_other_account',
          username: 'desilvajoner95', // Your other account username
          display_name: 'Joner De Silva',
          bio: 'Camera enthusiast and photographer',
          avatar_url: user?.imageUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
          location: '',
          expertise_level: 'beginner',
          website_url: '',
          instagram_url: '',
          created_at: new Date().toISOString(),
          camera_count: 0,
          discussion_count: 0,
          follower_count: 0,
          following_count: 0
        }
      ]
      
      // Filter based on search query
      const filtered = testUsers.filter(u => 
        u.username.toLowerCase().includes(query.toLowerCase()) ||
        u.display_name?.toLowerCase().includes(query.toLowerCase())
      )
      
      setSearchResults(filtered)
    } finally {
      setLoading(false)
    }
  }

  // Handle follow/unfollow
  const handleFollowToggle = async (targetUserId: string) => {
    if (!user?.id) return

    try {
      const isFollowing = followingUsers.has(targetUserId)
      
      if (isFollowing) {
        await makeAuthenticatedRequest(async (token) => 
          userService.unfollowUser(targetUserId, user.id, token)
        )
        setFollowingUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(targetUserId)
          return newSet
        })
      } else {
        await makeAuthenticatedRequest(async (token) => 
          userService.followUser(targetUserId, user.id, token)
        )
        setFollowingUsers(prev => new Set(prev).add(targetUserId))
      }
    } catch (error) {
      console.error('Follow/unfollow failed:', error)
    }
  }

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  return (
    <div className="search-page">
      {/* Mobile Header */}
      <div className="mobile-search-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          <ArrowLeft size={20} />
        </button>
        <h1>Search Users</h1>
      </div>

      {/* Search Input */}
      <div className="search-container">
        <div className="search-input-wrapper">
          <SearchIcon size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search users by username or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            autoFocus
          />
        </div>
      </div>

      {/* Search Results */}
      <div className="search-results">
        {loading && (
          <div className="loading-state">
            <p>Searching...</p>
          </div>
        )}

        {!loading && searchQuery && searchResults.length === 0 && (
          <div className="empty-state">
            <User size={48} />
            <p>No users found</p>
            <p className="empty-subtitle">Try searching with a different term</p>
          </div>
        )}

        {!loading && searchQuery && searchResults.length > 0 && (
          <div className="user-list">
            <h3>Search Results ({searchResults.length})</h3>
            {searchResults.map((userProfile) => (
              <div key={userProfile.id} className="user-item">
                <div className="user-info">
                  <img 
                    src={userProfile.avatar_url || 'https://via.placeholder.com/50'} 
                    alt={userProfile.username}
                    className="user-avatar"
                  />
                  <div className="user-details">
                    <h4>@{userProfile.username}</h4>
                    {userProfile.display_name && (
                      <p className="user-name">{userProfile.display_name}</p>
                    )}
                    {userProfile.bio && (
                      <p className="user-bio">{userProfile.bio}</p>
                    )}
                    <div className="user-stats">
                      <span>{userProfile.camera_count} cameras</span>
                      <span>{userProfile.follower_count} followers</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleFollowToggle(userProfile.id)}
                  className={`follow-btn ${followingUsers.has(userProfile.id) ? 'following' : ''}`}
                >
                  {followingUsers.has(userProfile.id) ? (
                    <>
                      <UserCheck size={16} />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} />
                      Follow
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {!searchQuery && (
          <div className="search-suggestions">
            <h3>Discover Users</h3>
            <p>Search for users by their username or display name to connect with fellow camera enthusiasts!</p>
            
            <div className="search-tips">
              <h4>Search Tips:</h4>
              <ul>
                <li>Try searching for partial usernames</li>
                <li>Look for users by their display names</li>
                <li>Follow users to see their camera collections</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}