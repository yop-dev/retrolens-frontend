import { useUser } from '@clerk/clerk-react'
import { Camera, MessageSquare, Users, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

export function Dashboard() {
  const { user } = useUser()
  const [stats, setStats] = useState({
    cameras: 0,
    discussions: 0,
    followers: 0,
    following: 0
  })

  useEffect(() => {
    // TODO: Fetch actual user stats from API
    // For now, using mock data
    setStats({
      cameras: 3,
      discussions: 12,
      followers: 45,
      following: 23
    })
  }, [])

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.firstName || user?.username || 'User'}!</h1>
        <p>Here's what's happening in your vintage camera world</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <Camera className="stat-icon" />
          <div className="stat-content">
            <span className="stat-value">{stats.cameras}</span>
            <span className="stat-label">Cameras</span>
          </div>
        </div>
        <div className="stat-card">
          <MessageSquare className="stat-icon" />
          <div className="stat-content">
            <span className="stat-value">{stats.discussions}</span>
            <span className="stat-label">Discussions</span>
          </div>
        </div>
        <div className="stat-card">
          <Users className="stat-icon" />
          <div className="stat-content">
            <span className="stat-value">{stats.followers}</span>
            <span className="stat-label">Followers</span>
          </div>
        </div>
        <div className="stat-card">
          <TrendingUp className="stat-icon" />
          <div className="stat-content">
            <span className="stat-value">{stats.following}</span>
            <span className="stat-label">Following</span>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <Link to="/add-camera" className="action-btn">
            <Camera size={24} />
            <span>Add Camera</span>
          </Link>
          <Link to="/discover" className="action-btn">
            <Users size={24} />
            <span>Browse Collections</span>
          </Link>
          <Link to="/discussions" className="action-btn">
            <MessageSquare size={24} />
            <span>Join Discussions</span>
          </Link>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="recent-activity">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">
                <Camera size={16} />
              </div>
              <div className="activity-content">
                <p><strong>John Doe</strong> added a Leica M3 to their collection</p>
                <span className="activity-time">2 hours ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">
                <MessageSquare size={16} />
              </div>
              <div className="activity-content">
                <p><strong>Jane Smith</strong> started a discussion about film development</p>
                <span className="activity-time">5 hours ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">
                <Users size={16} />
              </div>
              <div className="activity-content">
                <p><strong>Mike Johnson</strong> started following you</p>
                <span className="activity-time">1 day ago</span>
              </div>
            </div>
          </div>
        </div>

        <div className="user-info-card">
          <h2>Your Profile</h2>
          <div className="profile-preview">
            <img 
              src={user?.imageUrl || 'https://via.placeholder.com/100'} 
              alt="Profile" 
              className="profile-avatar"
            />
            <div className="profile-details">
              <h3>{user?.fullName}</h3>
              <p className="profile-email">{user?.primaryEmailAddress?.emailAddress}</p>
              <p className="profile-id">ID: {user?.id?.substring(0, 8)}...</p>
            </div>
          </div>
          <Link to="/profile" className="btn btn-secondary">
            Edit Profile
          </Link>
        </div>
      </div>
    </div>
  )
}
