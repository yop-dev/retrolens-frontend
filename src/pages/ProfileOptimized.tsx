import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useClerk, useUser } from '@clerk/clerk-react';
import { ArrowLeft, Camera as CameraIcon, Compass, FolderOpen, Home, Link as LinkIcon, LogOut, Mail, MapPin, MessageCircle, Save, Search, Settings, User, UserPlus, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { UserListModal } from '@/components/profile/UserListModal';

import { userService } from '@/services/api/users.service';
import { cameraService } from '@/services/api/cameras.service';
import { discussionService } from '@/services/api/discussions.service';
import { apiClient } from '@/services/api/base';
import { useApiWithAuth } from '@/hooks';
import { API_ENDPOINTS } from '@/constants';
import { cacheService } from '@/services/cache/cache.service';
import type { Camera, Discussion, UserProfile } from '@/types';
import '@/css/pages/Profile.css';
import '@/css/components/skeleton.css';

// Constants
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes cache for profile data

/**
 * Profile tab types
 */
type TabType = 'collection' | 'posts' | 'about';

// Profile Skeleton Component
const ProfileSkeleton = () => (
  <div className="profile-skeleton">
    <div className="profile-info-section">
      <div className="profile-left">
        <div className="skeleton skeleton-profile-avatar"></div>
      </div>
      <div className="profile-right">
        <div className="skeleton skeleton-title" style={{ width: '200px', marginBottom: '10px' }}></div>
        <div className="skeleton skeleton-text" style={{ width: '100%' }}></div>
        <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
        <div className="skeleton skeleton-text" style={{ width: '60%' }}></div>
      </div>
    </div>
    <div className="skeleton-stats">
      <div className="skeleton skeleton-stat"></div>
      <div className="skeleton skeleton-stat"></div>
      <div className="skeleton skeleton-stat"></div>
      <div className="skeleton skeleton-stat"></div>
    </div>
    <div className="skeleton-grid">
      <div className="skeleton skeleton-camera-card"></div>
      <div className="skeleton skeleton-camera-card"></div>
      <div className="skeleton skeleton-camera-card"></div>
    </div>
  </div>
);

// Memoized Camera Card Component
const CameraCard = React.memo<{ camera: Camera }>(({ camera }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="camera-card">
      <div className="camera-image">
        {!imageLoaded && <div className="skeleton skeleton-image" style={{ height: '200px' }}></div>}
        <img 
          src={camera.images?.[0]?.image_url || '/camera-placeholder.png'} 
          alt={`${camera.brand_name} ${camera.model}`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/camera-placeholder.png';
            setImageLoaded(true);
          }}
          style={{ display: imageLoaded ? 'block' : 'none' }}
        />
      </div>
      <div className="camera-info">
        <h4>{camera.brand_name} {camera.model}</h4>
        {camera.year && <p className="camera-year">{camera.year}</p>}
        {camera.condition && <p className="camera-condition">{camera.condition}</p>}
      </div>
    </div>
  );
});

CameraCard.displayName = 'CameraCard';

export function ProfileOptimized() {
  const { user, isLoaded: userLoaded } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const { makeAuthenticatedRequest } = useApiWithAuth();
  
  // State
  const [activeTab, setActiveTab] = useState<TabType>('collection');
  const [isFollowing, setIsFollowing] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userCameras, setUserCameras] = useState<Camera[]>([]);
  const [userDiscussions, setUserDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    display_name: '',
    bio: '',
    avatar_url: ''
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null);
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

  // Create fallback profile from Clerk user data
  const createFallbackProfile = useCallback((): UserProfile => {
    const username = user?.username || user?.firstName || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || `user_${user?.id?.slice(-8)}`;
    
    return {
      id: user?.id || '',
      username: username,
      display_name: user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || username,
      bio: '',
      avatar_url: user?.imageUrl || '',
      location: '',
      expertise_level: 'beginner',
      website_url: '',
      instagram_url: '',
      created_at: user?.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString(),
      camera_count: 0,
      discussion_count: 0,
      follower_count: 0,
      following_count: 0
    };
  }, [user]);

  // Fetch user data with caching
  const fetchUserData = useCallback(async () => {
    if (!user?.id) {return;}

    // Check cache first
    const cacheKey = cacheService.getUserKey(user.id);
    const cachedProfile = cacheService.get<UserProfile>(cacheKey);
    const cachedCameras = cacheService.get<Camera[]>(cacheService.getUserCamerasKey(user.id));
    const cachedDiscussions = cacheService.get<Discussion[]>(cacheService.getUserDiscussionsKey(user.id));

    // Use cached data if available
    if (cachedProfile && cachedCameras && cachedDiscussions) {
      setUserProfile(cachedProfile);
      setUserCameras(cachedCameras);
      setUserDiscussions(cachedDiscussions);
      setIsOwnProfile(cachedProfile.id === user.id);
      setEditFormData({
        display_name: cachedProfile.display_name || cachedProfile.username || '',
        bio: cachedProfile.bio || '',
        avatar_url: cachedProfile.avatar_url || ''
      });
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Test API connectivity
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      try {
        const healthCheck = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/health`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!healthCheck.ok) {
          throw new Error('API not available');
        }
      } catch {
        // Use fallback if API is down
        const fallbackProfile = createFallbackProfile();
        setUserProfile(fallbackProfile);
        setUserCameras([]);
        setUserDiscussions([]);
        setLoading(false);
        return;
      }

      const username = user.username || user.firstName || user.primaryEmailAddress?.emailAddress?.split('@')[0] || `user_${user.id.slice(-8)}`;

      // Fetch profile, cameras, and discussions in parallel
      const [profileResult, camerasResult, discussionsResult] = await Promise.allSettled([
        // Fetch profile
        (async () => {
          let profile: UserProfile | null = null;
          
          // Try to fetch by ID first
          try {
            profile = await makeAuthenticatedRequest(async (token) => 
              userService.getUserById(user.id, token)
            );
          } catch {
            // Try by username
            try {
              profile = await makeAuthenticatedRequest(async (token) => 
                userService.getUserByUsername(username, token)
              );
            } catch {
              // Try to create new profile
              try {
                profile = await makeAuthenticatedRequest(async (token) => 
                  userService.createUser({
                    username: username,
                    email: user.primaryEmailAddress?.emailAddress || '',
                    full_name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                    avatar_url: '',
                  }, token)
                );
              } catch {
                profile = null;
              }
            }
          }
          
          return profile || createFallbackProfile();
        })(),

        // Fetch cameras
        makeAuthenticatedRequest(async (token) => 
          cameraService.getAllCameras(token)
        ).catch(() => []),

        // Fetch discussions
        makeAuthenticatedRequest(async (token) => 
          discussionService.getAllDiscussions(token)
        ).catch(() => [])
      ]);

      // Process results
      const profile = profileResult.status === 'fulfilled' ? profileResult.value : createFallbackProfile();
      const allCameras = camerasResult.status === 'fulfilled' ? camerasResult.value : [];
      const allDiscussions = discussionsResult.status === 'fulfilled' ? discussionsResult.value : [];

      // Filter cameras and discussions for this user
      const userCameras = allCameras?.filter(camera => camera.user_id === profile.id) || [];
      const userDiscussions = allDiscussions?.filter(discussion => discussion.user_id === profile.id) || [];

      // Cache the results
      cacheService.set(cacheKey, profile, CACHE_TTL);
      cacheService.set(cacheService.getUserCamerasKey(user.id), userCameras, CACHE_TTL);
      cacheService.set(cacheService.getUserDiscussionsKey(user.id), userDiscussions, CACHE_TTL);

      // Update state
      setUserProfile(profile);
      setUserCameras(userCameras);
      setUserDiscussions(userDiscussions);
      setIsOwnProfile(profile.id === user.id);
      setEditFormData({
        display_name: profile.display_name || profile.username || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || ''
      });

    } catch (err) {
      console.error('Error fetching user data:', err);
      // Use fallback profile on error
      const fallbackProfile = createFallbackProfile();
      setUserProfile(fallbackProfile);
      setUserCameras([]);
      setUserDiscussions([]);
    } finally {
      setLoading(false);
    }
  }, [user, makeAuthenticatedRequest, createFallbackProfile]);

  // Initial data fetch
  useEffect(() => {
    // Wait for Clerk to finish loading
    if (!userLoaded) {
      return;
    }
    
    if (user?.id) {
      fetchUserData();
    } else {
      // User is loaded but no user (not logged in)
      setLoading(false);
    }
  }, [user?.id, user, userLoaded, fetchUserData]);

  // Memoized callbacks
  const handleOpenEditModal = useCallback(() => {
    if (userProfile) {
      setEditFormData({
        display_name: userProfile.display_name || userProfile.username || '',
        bio: userProfile.bio || '',
        avatar_url: userProfile.avatar_url || ''
      });
      setEditAvatarPreview(userProfile.avatar_url || user?.imageUrl || null);
      setEditAvatarFile(null);
      setShowEditModal(true);
    }
  }, [userProfile, user]);

  const handleEditFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleEditAvatarSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {return;}

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setEditAvatarPreview(previewUrl);
    setEditAvatarFile(file);
  }, []);

  const handleSaveProfile = useCallback(async () => {
    if (!userProfile) {return;}

    setIsUpdatingProfile(true);

    try {
      let avatarUrl = editFormData.avatar_url;

      // Upload new avatar if selected
      if (editAvatarFile) {
        const formData = new FormData();
        formData.append('file', editAvatarFile);

        const uploadResponse = await makeAuthenticatedRequest(async (token) => {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${API_ENDPOINTS.UPLOAD_AVATAR}?user_id=${userProfile.id}`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
              },
              body: formData
            }
          );

          if (!response.ok) {
            throw new Error('Failed to upload avatar');
          }

          return response.json();
        });

        avatarUrl = uploadResponse.url || avatarUrl;
      }

      // Update profile
      const updateData = {
        display_name: editFormData.display_name,
        bio: editFormData.bio,
        avatar_url: avatarUrl
      };

      const updatedProfile = await makeAuthenticatedRequest(async (token) => 
        apiClient.authenticatedRequest(
          API_ENDPOINTS.USER_UPDATE(userProfile.id),
          token || null,
          {
            method: 'PATCH',
            body: JSON.stringify(updateData)
          }
        )
      );

      // Update local state and cache
      setUserProfile(updatedProfile as UserProfile);
      cacheService.invalidateUserCache(userProfile.id);
      setShowEditModal(false);
      
      // Clean up preview URL
      if (editAvatarPreview && editAvatarFile) {
        URL.revokeObjectURL(editAvatarPreview);
      }
      
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsUpdatingProfile(false);
    }
  }, [userProfile, editFormData, editAvatarFile, editAvatarPreview, makeAuthenticatedRequest]);

  const handleFollowToggle = useCallback(async () => {
    if (!userProfile) {return;}

    try {
      if (isFollowing) {
        await makeAuthenticatedRequest(async (token) => 
          apiClient.authenticatedRequest(
            API_ENDPOINTS.USER_UNFOLLOW(userProfile.id),
            token || null,
            { method: 'DELETE', body: '{}' }
          )
        );
      } else {
        await makeAuthenticatedRequest(async (token) => 
          apiClient.authenticatedRequest(
            API_ENDPOINTS.USER_FOLLOW(userProfile.id),
            token || null,
            { method: 'POST', body: '{}' }
          )
        );
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Failed to update follow status:', error);
    }
  }, [userProfile, isFollowing, makeAuthenticatedRequest]);

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (editAvatarPreview && editAvatarFile) {
        URL.revokeObjectURL(editAvatarPreview);
      }
    };
  }, [editAvatarPreview, editAvatarFile]);

  // Memoized filtered content based on active tab
  const _tabContent = useMemo(() => {
    switch (activeTab) {
      case 'collection':
        return userCameras;
      case 'posts':
        return userDiscussions;
      default:
        return null;
    }
  }, [activeTab, userCameras, userDiscussions]);

  // Show loading state if Clerk is still loading or data is being fetched
  if (!userLoaded || loading) {
    return (
      <div className="profile-page">
        <div className="mobile-profile-header">
          <button onClick={() => navigate(-1)} className="back-btn">
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <h1>Profile</h1>
          <div style={{ width: '32px' }}></div>
        </div>
        <div className="profile-container">
          <ProfileSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Mobile Header */}
      <div className="mobile-profile-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <h1>Profile</h1>
        {isOwnProfile ? (
          <button 
            className="logout-header-btn"
            onClick={() => setShowLogoutConfirm(true)}
            title="Sign Out"
          >
            <LogOut size={20} />
          </button>
        ) : (
          <div style={{ width: '32px' }}></div>
        )}
      </div>
      
      <div className="profile-container">
        {/* Profile Info Section */}
        <div className="profile-info-section">
          {isOwnProfile && (
            <button 
              className="settings-card-btn"
              onClick={handleOpenEditModal}
              title="Edit Profile"
            >
              <Settings size={20} />
            </button>
          )}
          
          {/* Left Column - Avatar and Actions */}
          <div className="profile-left">
            <div className="avatar-container">
              <img 
                src={
                  (userProfile?.avatar_url && userProfile.avatar_url.trim() !== '') 
                    ? userProfile.avatar_url 
                    : user?.imageUrl || '/default-avatar.png'
                } 
                alt="Profile" 
                className="profile-avatar-large"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (user?.imageUrl && target.src !== user.imageUrl) {
                    target.src = user.imageUrl;
                  } else {
                    target.src = '/default-avatar.png';
                  }
                }}
              />
            </div>
            
            {/* Desktop Action Buttons */}
            <div className="desktop-actions">
              {!isOwnProfile && (
                <>
                  <button className="action-btn btn-message" disabled title="Messaging coming soon">
                    <Mail size={18} />
                    <span>Send Message</span>
                  </button>
                  <button 
                    className={`action-btn ${isFollowing ? 'btn-following' : 'btn-follow'}`}
                    onClick={handleFollowToggle}
                  >
                    <UserPlus size={18} />
                    <span>{isFollowing ? 'Following' : 'Follow User'}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right Column - User Details */}
          <div className="profile-right">
            <div className="profile-details">
              <h1 className="display-name">
                {userProfile?.display_name || userProfile?.username || 'User'}
              </h1>
              
              {userProfile?.bio && (
                <p className="bio">{userProfile.bio}</p>
              )}

              <div className="user-meta">
                {userProfile?.location && (
                  <div className="meta-item">
                    <MapPin size={16} />
                    <span>{userProfile.location}</span>
                  </div>
                )}
                {userProfile?.website_url && (
                  <div className="meta-item">
                    <LinkIcon size={16} />
                    <a href={userProfile.website_url} target="_blank" rel="noopener noreferrer" className="social-link">
                      {userProfile.website_url.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Action Buttons */}
            <div className="mobile-actions">
              {!isOwnProfile && (
                <>
                  <button className="action-btn-mobile" disabled title="Messaging coming soon">
                    <Mail size={20} />
                    <span>Message</span>
                  </button>
                  <button 
                    className={`action-btn-mobile ${isFollowing ? 'following' : ''}`}
                    onClick={handleFollowToggle}
                  >
                    <UserPlus size={20} />
                    <span>{isFollowing ? 'Following' : 'Follow'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="stats-section">
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Cameras</span>
              <span className="stat-value">{userCameras.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Discussions</span>
              <span className="stat-value">{userDiscussions.length}</span>
            </div>
            <button 
              className="stat-item stat-clickable"
              onClick={() => setShowFollowersModal(true)}
              disabled={!userProfile || userProfile.follower_count === 0}
            >
              <span className="stat-label">Followers</span>
              <span className="stat-value">{userProfile?.follower_count || 0}</span>
            </button>
            <button 
              className="stat-item stat-clickable"
              onClick={() => setShowFollowingModal(true)}
              disabled={!userProfile || userProfile.following_count === 0}
            >
              <span className="stat-label">Following</span>
              <span className="stat-value">{userProfile?.following_count || 0}</span>
            </button>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="profile-tabs">
          <button 
            className={`tab-btn ${activeTab === 'collection' ? 'active' : ''}`}
            onClick={() => setActiveTab('collection')}
          >
            Collection
          </button>
          <button 
            className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            Discussion Posts
          </button>
          <button 
            className={`tab-btn ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            About
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'collection' && (
            <div className="collection-section">
              <div className="section-header">
                <h3>My Camera Collection ({userCameras.length} items)</h3>
                <select className="sort-select">
                  <option value="date">Sort by: Date ↓</option>
                  <option value="name">Sort by: Name</option>
                  <option value="year">Sort by: Year</option>
                </select>
              </div>

              {userCameras.length > 0 ? (
                <div className="cameras-grid">
                  {userCameras.map((camera) => (
                    <CameraCard key={camera.id} camera={camera} />
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <CameraIcon size={48} />
                  <p>No cameras in collection yet</p>
                  {isOwnProfile && (
                    <>
                      <p className="empty-subtitle">Add your first camera to get started</p>
                      <button 
                        className="btn btn-primary mt-4"
                        onClick={() => navigate('/add-camera')}
                      >
                        Add Camera
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'posts' && (
            <div className="posts-section">
              <h3>Discussion Posts ({userDiscussions.length})</h3>
              {userDiscussions.length > 0 ? (
                <div className="posts-list">
                  {userDiscussions.map((discussion) => (
                    <div key={discussion.id} className="post-item">
                      <h4>{discussion.title}</h4>
                      <p>{discussion.body?.substring(0, 150)}...</p>
                      <div className="post-meta">
                        <span>{discussion.comment_count || 0} replies</span>
                        <span>{new Date(discussion.created_at).toLocaleDateString()}</span>
                        <span>{discussion.view_count || 0} views</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <MessageCircle size={48} />
                  <p>No discussion posts yet</p>
                  {isOwnProfile && (
                    <p className="empty-subtitle">Start a discussion to share your knowledge</p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="about-section">
              <h3>About</h3>
              <div className="about-content">
                <p><strong>Joined:</strong> {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'Recently'}</p>
                {userProfile?.expertise_level && (
                  <p><strong>Expertise Level:</strong> {userProfile.expertise_level.charAt(0).toUpperCase() + userProfile.expertise_level.slice(1)}</p>
                )}
                {userProfile?.location && (
                  <p><strong>Location:</strong> {userProfile.location}</p>
                )}
                {userProfile?.bio && (
                  <p><strong>Bio:</strong> {userProfile.bio}</p>
                )}
                {!userProfile?.bio && !userProfile?.location && !userProfile?.expertise_level && (
                  <div className="empty-state">
                    <User size={48} />
                    <p>No additional information available</p>
                    <p className="empty-subtitle">Complete your profile to share more about yourself</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="edit-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="edit-modal-header">
              <h2>Edit Profile</h2>
              <button 
                className="close-modal-btn"
                onClick={() => setShowEditModal(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="edit-modal-body">
              {/* Avatar Section */}
              <div className="edit-avatar-section">
                <div 
                  className="edit-avatar-container"
                  onClick={() => editFileInputRef.current?.click()}
                  title="Click to change profile picture"
                >
                  <img 
                    src={editAvatarPreview || userProfile?.avatar_url || '/default-avatar.png'} 
                    alt="Profile" 
                    className="edit-avatar-preview"
                  />
                  <div className="avatar-overlay">
                    <CameraIcon size={24} />
                    <span>Change Photo</span>
                  </div>
                </div>
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleEditAvatarSelect}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Form Fields */}
              <div className="edit-form">
                <div className="form-group">
                  <label htmlFor="display_name">Display Name</label>
                  <input
                    type="text"
                    id="display_name"
                    name="display_name"
                    value={editFormData.display_name}
                    onChange={handleEditFormChange}
                    placeholder="Enter your display name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={editFormData.bio}
                    onChange={handleEditFormChange}
                    rows={4}
                    placeholder="Tell us about yourself..."
                    maxLength={500}
                  />
                  <span className="char-count">{editFormData.bio.length}/500</span>
                </div>
              </div>
            </div>

            <div className="edit-modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowEditModal(false)}
                disabled={isUpdatingProfile}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSaveProfile}
                disabled={isUpdatingProfile}
              >
                {isUpdatingProfile ? (
                  <>
                    <div className="spinner-small" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="logout-confirm-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="logout-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <p className="logout-confirm-message">
              Are you sure you want to sign out?
            </p>
            <div className="logout-confirm-buttons">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-logout"
                onClick={() => signOut()}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User List Modals */}
      <UserListModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        userId={userProfile?.id || ''}
        type="followers"
        currentUserId={user?.id}
      />
      
      <UserListModal
        isOpen={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        userId={userProfile?.id || ''}
        type="following"
        currentUserId={user?.id}
      />

      {/* Mobile Bottom Navigation */}
      <nav className="profile-mobile-nav">
        <Link to="/feed" className="nav-item">
          <Home size={20} />
          <span>Feed</span>
        </Link>
        <Link to="/search" className="nav-item">
          <Search size={20} />
          <span>Search</span>
        </Link>
        <Link to="/discover" className="nav-item">
          <Compass size={20} />
          <span>Discover</span>
        </Link>
        <Link to="/collection" className="nav-item">
          <FolderOpen size={20} />
          <span>Collection</span>
        </Link>
        <Link to="/profile" className="nav-item active">
          <div className="nav-avatar">
            <img 
              src={userProfile?.avatar_url || user?.imageUrl || '/default-avatar.png'} 
              alt="Profile" 
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (user?.imageUrl && target.src !== user.imageUrl) {
                  target.src = user.imageUrl;
                } else {
                  target.src = '/default-avatar.png';
                }
              }}
            />
          </div>
          <span>Profile</span>
        </Link>
      </nav>
    </div>
  );
}

export default ProfileOptimized;
