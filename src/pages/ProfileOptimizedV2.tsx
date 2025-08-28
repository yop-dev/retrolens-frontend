import React, { useState, useCallback, useMemo } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Settings,
  MapPin,
  Link as LinkIcon,
  MessageCircle,
  UserPlus,
  Mail,
  Camera as CameraIcon,
  User,
  X,
  Save,
  LogOut,
  Home,
  Search,
  Compass,
  FolderOpen,
  Heart,
  Eye,
  Calendar
} from 'lucide-react';

import { queryKeys } from '@/lib/react-query';
import { userService } from '@/services/api/users.service';
import { cameraService } from '@/services/api/cameras.service';
import { discussionService } from '@/services/api/discussions.service';
import { useApiWithAuth } from '@/hooks';
import { ProfileSkeleton, CameraCardSkeleton, DiscussionCardSkeleton } from '@/components/ui/Skeletons';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { UserListModal } from '@/components/profile/UserListModal';
import { formatRelativeTime } from '@/utils/date.utils';
import { perf } from '@/utils/performance';
import type { UserProfile, Camera, Discussion } from '@/types';
import '@/css/pages/Profile.css';

// Constants
type TabType = 'collection' | 'posts' | 'about';

// Memoized Camera Card with OptimizedImage
const CameraCard = React.memo<{ camera: Camera; onMouseEnter?: () => void }>(({ 
  camera, 
  onMouseEnter 
}) => {
  return (
    <div className="camera-card" onMouseEnter={onMouseEnter}>
      <div className="camera-image">
        <OptimizedImage
          src={camera.images?.[0]?.image_url || '/camera-placeholder.png'}
          alt={`${camera.brand_name} ${camera.model}`}
          className="w-full h-48 object-cover rounded-t-lg"
          priority={false}
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

// Memoized Discussion Card
const DiscussionCard = React.memo<{ 
  discussion: Discussion; 
  onMouseEnter?: () => void 
}>(({ discussion, onMouseEnter }) => {
  return (
    <div className="discussion-card" onMouseEnter={onMouseEnter}>
      <div className="discussion-header">
        <h4>{discussion.title}</h4>
        <span className="discussion-time">{formatRelativeTime(discussion.created_at)}</span>
      </div>
      <p className="discussion-excerpt line-clamp-2">
        {discussion.content || discussion.body}
      </p>
      <div className="discussion-stats">
        <span className="stat">
          <Eye size={14} /> {discussion.view_count || 0}
        </span>
        <span className="stat">
          <MessageCircle size={14} /> {discussion.comment_count || 0}
        </span>
        <span className="stat">
          <Heart size={14} /> {discussion.like_count || 0}
        </span>
      </div>
    </div>
  );
});

DiscussionCard.displayName = 'DiscussionCard';

export function ProfileOptimizedV2() {
  const { user: currentUser } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const { username } = useParams<{ username?: string }>();
  const queryClient = useQueryClient();
  const { makeAuthenticatedRequest } = useApiWithAuth();
  
  // State
  const [activeTab, setActiveTab] = useState<TabType>('collection');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    display_name: '',
    bio: '',
    avatar_url: ''
  });
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null);

  // Determine profile to load
  const isOwnProfile = !username || username === currentUser?.username;

  // Fetch user profile with React Query
  const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: username ? queryKeys.users.byUsername(username) : queryKeys.users.byId(currentUser?.id || 'current'),
    queryFn: async () => {
      perf.mark('profile-fetch');
      
      // Wait for currentUser to be available if loading own profile
      if (!username && !currentUser) {
        return null;
      }
      
      const token = await currentUser?.getToken();
      let profile: UserProfile | null = null;
      
      try {
        if (username) {
          // Fetch other user's profile by username
          profile = await userService.getUserByUsername(username, token || undefined);
        } else if (currentUser?.id) {
          // Fetch current user's profile by ID
          try {
            profile = await userService.getUserById(currentUser.id, token || undefined);
          } catch (error) {
            // Try syncing with backend if user doesn't exist
            try {
              const syncResponse = await userService.syncUser({
                clerk_id: currentUser.id,
                email: currentUser.primaryEmailAddress?.emailAddress || '',
                username: currentUser.username || currentUser.firstName || 
                         currentUser.primaryEmailAddress?.emailAddress?.split('@')[0] || 
                         `user_${currentUser.id.slice(-8)}`,
                full_name: currentUser.fullName || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim(),
                avatar_url: currentUser.imageUrl || ''
              }, token || undefined);
              
              // After sync, fetch the profile again
              profile = await userService.getUserById(currentUser.id, token || undefined);
            } catch (syncError) {
              console.error('Failed to sync user:', syncError);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
      
      // Create fallback profile if still no profile and it's the current user
      if (!profile && isOwnProfile && currentUser) {
        const fallbackUsername = currentUser.username || 
          currentUser.firstName || 
          currentUser.primaryEmailAddress?.emailAddress?.split('@')[0] || 
          `user_${currentUser.id?.slice(-8)}`;
        
        profile = {
          id: currentUser.id,
          username: fallbackUsername,
          display_name: currentUser.fullName || fallbackUsername,
          bio: '',
          avatar_url: currentUser.imageUrl || '',
          location: '',
          expertise_level: 'beginner',
          website_url: '',
          instagram_url: '',
          created_at: new Date().toISOString(),
          camera_count: 0,
          discussion_count: 0,
          follower_count: 0,
          following_count: 0
        };
      }
      
      perf.measure('profile-fetch');
      return profile;
    },
    enabled: !!currentUser || !!username,
    staleTime: 3 * 60 * 1000, // 3 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Fetch user cameras
  const { data: userCameras = [], isLoading: isLoadingCameras } = useQuery({
    queryKey: queryKeys.cameras.byUser(userProfile?.id!),
    queryFn: async () => {
      const token = await currentUser?.getToken();
      const allCameras = await cameraService.getAllCameras(token || undefined);
      return allCameras.filter(camera => camera.user_id === userProfile?.id) || [];
    },
    enabled: !!userProfile?.id,
    staleTime: 3 * 60 * 1000,
  });

  // Fetch user discussions
  const { data: userDiscussions = [], isLoading: isLoadingDiscussions } = useQuery({
    queryKey: queryKeys.discussions.byUser(userProfile?.id!),
    queryFn: async () => {
      const token = await currentUser?.getToken();
      const allDiscussions = await discussionService.getAllDiscussions(token || undefined);
      return allDiscussions.filter(discussion => discussion.user_id === userProfile?.id) || [];
    },
    enabled: !!userProfile?.id,
    staleTime: 2 * 60 * 1000,
  });

  // Fetch followers
  const { data: followers = [] } = useQuery({
    queryKey: queryKeys.users.followers(userProfile?.id!),
    queryFn: async () => {
      const token = await currentUser?.getToken();
      return userService.getUserFollowers(userProfile?.id!, token || undefined);
    },
    enabled: !!userProfile?.id && showFollowersModal,
    staleTime: 2 * 60 * 1000,
  });

  // Fetch following
  const { data: following = [] } = useQuery({
    queryKey: queryKeys.users.following(userProfile?.id!),
    queryFn: async () => {
      const token = await currentUser?.getToken();
      return userService.getUserFollowing(userProfile?.id!, token || undefined);
    },
    enabled: !!userProfile?.id && showFollowingModal,
    staleTime: 2 * 60 * 1000,
  });

  // Check if following
  const { data: isFollowing = false } = useQuery({
    queryKey: ['following-status', userProfile?.id, currentUser?.id],
    queryFn: async () => {
      if (!userProfile?.id || !currentUser?.id || isOwnProfile) return false;
      const token = await currentUser.getToken();
      const userFollowing = await userService.getUserFollowing(currentUser.id, token || undefined);
      return userFollowing.some(u => u.id === userProfile.id);
    },
    enabled: !!userProfile?.id && !!currentUser?.id && !isOwnProfile,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { display_name: string; bio: string; avatar_url: string }) => {
      const token = await currentUser?.getToken();
      return userService.updateUser(userProfile?.id!, data, token || undefined);
    },
    onSuccess: (updatedProfile) => {
      if (username) {
        queryClient.setQueryData(queryKeys.users.byUsername(username), updatedProfile);
      }
      queryClient.setQueryData(queryKeys.users.byId(userProfile?.id!), updatedProfile);
      setShowEditModal(false);
    },
  });

  // Follow/unfollow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      const token = await currentUser?.getToken();
      if (isFollowing) {
        return userService.unfollowUser(userProfile?.id!, currentUser?.id!, token || undefined);
      } else {
        return userService.followUser(userProfile?.id!, currentUser?.id!, token || undefined);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following-status'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.followers(userProfile?.id!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.following(currentUser?.id!) });
    },
  });

  // Prefetch camera details on hover
  const prefetchCamera = useCallback((cameraId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['camera', cameraId],
      queryFn: async () => {
        const token = await currentUser?.getToken();
        return cameraService.getCameraById(cameraId, token || undefined);
      },
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient, currentUser]);

  // Prefetch discussion details on hover
  const prefetchDiscussion = useCallback((discussionId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.discussions.byId(discussionId),
      queryFn: async () => {
        const token = await currentUser?.getToken();
        return discussionService.getDiscussionById(discussionId, token || undefined);
      },
      staleTime: 2 * 60 * 1000,
    });
  }, [queryClient, currentUser]);

  // Handle edit modal
  const handleOpenEditModal = useCallback(() => {
    if (userProfile) {
      setEditFormData({
        display_name: userProfile.display_name || userProfile.username || '',
        bio: userProfile.bio || '',
        avatar_url: userProfile.avatar_url || ''
      });
      setEditAvatarPreview(userProfile.avatar_url || currentUser?.imageUrl || null);
      setEditAvatarFile(null);
      setShowEditModal(true);
    }
  }, [userProfile, currentUser]);

  // Handle save profile
  const handleSaveProfile = useCallback(async () => {
    let avatarUrl = editFormData.avatar_url;

    // Upload avatar if changed
    if (editAvatarFile) {
      const formData = new FormData();
      formData.append('file', editAvatarFile);
      
      const uploadResponse = await makeAuthenticatedRequest(async (token) => {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/upload/avatar?user_id=${userProfile?.id}`,
          {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
          }
        );
        return response.json();
      });
      
      avatarUrl = uploadResponse.url || avatarUrl;
    }

    await updateProfileMutation.mutateAsync({
      ...editFormData,
      avatar_url: avatarUrl
    });

    // Cleanup
    if (editAvatarPreview && editAvatarFile) {
      URL.revokeObjectURL(editAvatarPreview);
    }
  }, [editFormData, editAvatarFile, editAvatarPreview, userProfile, makeAuthenticatedRequest, updateProfileMutation]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    await signOut();
    navigate('/');
  }, [signOut, navigate]);

  // Determine loading state
  const isLoading = isLoadingProfile || (activeTab === 'collection' && isLoadingCameras) || (activeTab === 'posts' && isLoadingDiscussions);

  // Memoized tab content
  const tabContent = useMemo(() => {
    switch (activeTab) {
      case 'collection':
        if (isLoadingCameras) {
          return (
            <div className="cameras-grid">
              {[...Array(6)].map((_, i) => <CameraCardSkeleton key={i} />)}
            </div>
          );
        }
        if (userCameras.length === 0) {
          return (
            <div className="empty-state">
              <CameraIcon size={48} />
              <p>No cameras in collection yet</p>
            </div>
          );
        }
        return (
          <div className="cameras-grid">
            {userCameras.map(camera => (
              <CameraCard
                key={camera.id}
                camera={camera}
                onMouseEnter={() => prefetchCamera(camera.id)}
              />
            ))}
          </div>
        );

      case 'posts':
        if (isLoadingDiscussions) {
          return (
            <div className="discussions-list">
              {[...Array(5)].map((_, i) => <DiscussionCardSkeleton key={i} />)}
            </div>
          );
        }
        if (userDiscussions.length === 0) {
          return (
            <div className="empty-state">
              <MessageCircle size={48} />
              <p>No discussions yet</p>
            </div>
          );
        }
        return (
          <div className="discussions-list">
            {userDiscussions.map(discussion => (
              <DiscussionCard
                key={discussion.id}
                discussion={discussion}
                onMouseEnter={() => prefetchDiscussion(discussion.id)}
              />
            ))}
          </div>
        );

      case 'about':
        return (
          <div className="about-section">
            {userProfile?.bio && (
              <div className="bio-section">
                <h3>Bio</h3>
                <p>{userProfile.bio}</p>
              </div>
            )}
            <div className="info-section">
              {userProfile?.location && (
                <p><MapPin size={16} /> {userProfile.location}</p>
              )}
              {userProfile?.website_url && (
                <p><LinkIcon size={16} /> <a href={userProfile.website_url} target="_blank" rel="noopener noreferrer">{userProfile.website_url}</a></p>
              )}
              {userProfile?.created_at && (
                <p><Calendar size={16} /> Member since {new Date(userProfile.created_at).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        );
    }
  }, [activeTab, isLoadingCameras, isLoadingDiscussions, userCameras, userDiscussions, userProfile, prefetchCamera, prefetchDiscussion]);

  if (isLoadingProfile) {
    return <ProfileSkeleton />;
  }

  if (!userProfile) {
    return (
      <div className="profile-error">
        <User size={48} />
        <h2>User not found</h2>
        <button onClick={() => navigate('/')} className="btn btn-primary">
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Mobile Header */}
      <div className="mobile-header">
        <button onClick={() => navigate(-1)} className="back-button">
          <ArrowLeft size={20} />
        </button>
        <h2>{userProfile.username}</h2>
        {isOwnProfile && (
          <button onClick={handleOpenEditModal} className="settings-button">
            <Settings size={20} />
          </button>
        )}
      </div>

      {/* Profile Info Section */}
      <div className="profile-info-section">
        <div className="profile-left">
          <OptimizedImage
            src={userProfile.avatar_url || currentUser?.imageUrl || '/default-avatar.png'}
            alt={userProfile.display_name || userProfile.username}
            className="profile-avatar"
            priority={true}
          />
        </div>
        <div className="profile-right">
          <div className="profile-name-section">
            <h1>{userProfile.display_name || userProfile.username}</h1>
            {!isOwnProfile && (
              <div className="profile-actions">
                <button
                  className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => followMutation.mutate()}
                  disabled={followMutation.isLoading}
                >
                  {followMutation.isLoading ? '...' : isFollowing ? 'Unfollow' : 'Follow'}
                </button>
                <button className="btn btn-icon">
                  <Mail size={18} />
                </button>
              </div>
            )}
          </div>
          {userProfile.bio && <p className="profile-bio">{userProfile.bio}</p>}
        </div>
      </div>

      {/* Stats Section */}
      <div className="profile-stats">
        <div className="stat-item">
          <span className="stat-value">{userProfile.camera_count || userCameras.length}</span>
          <span className="stat-label">Cameras</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{userProfile.discussion_count || userDiscussions.length}</span>
          <span className="stat-label">Posts</span>
        </div>
        <button 
          className="stat-item clickable"
          onClick={() => setShowFollowersModal(true)}
        >
          <span className="stat-value">{userProfile.follower_count || 0}</span>
          <span className="stat-label">Followers</span>
        </button>
        <button 
          className="stat-item clickable"
          onClick={() => setShowFollowingModal(true)}
        >
          <span className="stat-value">{userProfile.following_count || 0}</span>
          <span className="stat-label">Following</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button
          className={`tab-button ${activeTab === 'collection' ? 'active' : ''}`}
          onClick={() => setActiveTab('collection')}
        >
          <CameraIcon size={18} />
          Collection
        </button>
        <button
          className={`tab-button ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          <MessageCircle size={18} />
          Posts
        </button>
        <button
          className={`tab-button ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveTab('about')}
        >
          <User size={18} />
          About
        </button>
      </div>

      {/* Tab Content */}
      <div className="profile-content">
        {tabContent}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Profile</h2>
              <button onClick={() => setShowEditModal(false)} className="close-button">
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Avatar</label>
                <div className="avatar-upload">
                  {editAvatarPreview && (
                    <img src={editAvatarPreview} alt="Avatar preview" className="avatar-preview" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setEditAvatarFile(file);
                        setEditAvatarPreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Display Name</label>
                <input
                  type="text"
                  value={editFormData.display_name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, display_name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea
                  value={editFormData.bio}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={4}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleSaveProfile}
                disabled={updateProfileMutation.isLoading}
              >
                {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Followers Modal */}
      {showFollowersModal && (
        <UserListModal
          title="Followers"
          users={followers}
          onClose={() => setShowFollowersModal(false)}
        />
      )}

      {/* Following Modal */}
      {showFollowingModal && (
        <UserListModal
          title="Following"
          users={following}
          onClose={() => setShowFollowingModal(false)}
        />
      )}

      {/* Logout Confirm Modal */}
      {showLogoutConfirm && (
        <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="modal-content small" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to log out?</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowLogoutConfirm(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Navigation */}
      {isOwnProfile && (
        <nav className="mobile-nav">
          <button onClick={() => navigate('/')} className="nav-item">
            <Home size={20} />
            <span>Home</span>
          </button>
          <button onClick={() => navigate('/search')} className="nav-item">
            <Search size={20} />
            <span>Search</span>
          </button>
          <button onClick={() => navigate('/discover')} className="nav-item">
            <Compass size={20} />
            <span>Discover</span>
          </button>
          <button onClick={() => navigate('/collection')} className="nav-item">
            <FolderOpen size={20} />
            <span>Collection</span>
          </button>
          <button onClick={() => setShowLogoutConfirm(true)} className="nav-item">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </nav>
      )}
    </div>
  );
}

export default ProfileOptimizedV2;
