import React, { useEffect, useState } from 'react';
import { X, User, UserCheck, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { userService } from '@/services/api/users.service';
import type { UserProfile } from '@/types';

interface UserListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: 'followers' | 'following';
  currentUserId?: string | undefined;
}

export const UserListModal: React.FC<UserListModalProps> = ({
  isOpen,
  onClose,
  userId,
  type,
  currentUserId,
}) => {
  const { getToken } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [followingStatus, setFollowingStatus] = useState<{ [key: string]: boolean }>({});
  const [loadingFollow, setLoadingFollow] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, userId, type]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      let userList: UserProfile[] = [];
      
      if (type === 'followers') {
        userList = await userService.getUserFollowers(userId, token || undefined);
      } else {
        userList = await userService.getUserFollowing(userId, token || undefined);
      }
      
      setUsers(userList);
      
      // Check following status for each user if current user is logged in
      if (currentUserId && token) {
        const status: { [key: string]: boolean } = {};
        const followingList = await userService.getUserFollowing(currentUserId, token);
        followingList.forEach(user => {
          status[user.id] = true;
        });
        setFollowingStatus(status);
      }
    } catch (error) {
      console.error(`Failed to fetch ${type}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (targetUserId: string) => {
    if (!currentUserId) return;
    
    setLoadingFollow({ ...loadingFollow, [targetUserId]: true });
    try {
      const token = await getToken();
      
      if (followingStatus[targetUserId]) {
        await userService.unfollowUser(targetUserId, currentUserId, token || undefined);
        setFollowingStatus({ ...followingStatus, [targetUserId]: false });
      } else {
        await userService.followUser(targetUserId, currentUserId, token || undefined);
        setFollowingStatus({ ...followingStatus, [targetUserId]: true });
      }
    } catch (error) {
      console.error('Failed to follow/unfollow user:', error);
    } finally {
      setLoadingFollow({ ...loadingFollow, [targetUserId]: false });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold capitalize">
            {type === 'followers' ? 'Followers' : 'Following'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading...
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <User className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-500 dark:text-gray-400">
                {type === 'followers' 
                  ? "No followers yet" 
                  : "Not following anyone yet"}
              </p>
            </div>
          ) : (
            <div className="divide-y dark:divide-gray-700">
              {users.map((user) => (
                <div 
                  key={user.id} 
                  className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <Link 
                    to={`/user/${user.username}`}
                    className="flex items-center space-x-3 flex-1"
                    onClick={onClose}
                  >
                    <img
                      src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.display_name || user.username}&background=random`}
                      alt={user.display_name || user.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {user.display_name || user.username}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        @{user.username}
                      </p>
                      {user.bio && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                          {user.bio}
                        </p>
                      )}
                    </div>
                  </Link>
                  
                  {currentUserId && currentUserId !== user.id && (
                    <button
                      onClick={() => handleFollow(user.id)}
                      disabled={loadingFollow[user.id]}
                      className={`ml-3 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        followingStatus[user.id]
                          ? 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                          : 'bg-orange-500 text-white hover:bg-orange-600'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {loadingFollow[user.id] ? (
                        <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : followingStatus[user.id] ? (
                        <span className="flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5" />
                          Following
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <UserPlus className="w-3.5 h-3.5" />
                          Follow
                        </span>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
