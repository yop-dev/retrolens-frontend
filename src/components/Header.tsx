import { SignedIn, SignedOut, useUser, useClerk } from '@clerk/clerk-react'
import { Camera, Search, Bell, User, Home, Compass, FolderOpen, LogOut, ChevronDown } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { CustomSignIn } from '../components/CustomSignIn'
import { useState, useEffect, useRef } from 'react'
import { useApiWithAuth } from '@/hooks'
import { userService } from '@/services/api/users.service'
import '@/css/components/Header.css'

export function Header() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const navigate = useNavigate()
  const [showCustomSignIn, setShowCustomSignIn] = useState(false)
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const { makeAuthenticatedRequest } = useApiWithAuth()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch user profile to get the backend avatar
  useEffect(() => {
    const fetchUserAvatar = async () => {
      if (!user?.id) return
      
      try {
        const profile = await makeAuthenticatedRequest(async (token) => 
          userService.getUserById(user.id, token)
        )
        if (profile?.avatar_url) {
          setProfileAvatar(profile.avatar_url)
        }
      } catch (error) {
        console.log('Could not fetch profile avatar')
      }
    }

    fetchUserAvatar()
  }, [user?.id, makeAuthenticatedRequest])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      {/* Desktop Header */}
      <header className="desktop-header">
        <div className="header-left">
          <Link to="/feed" className="logo">
            <Camera className="logo-icon" />
            <div>
              <h1>RetroLens</h1>
              <span className="tagline">Vintage Camera Community</span>
            </div>
          </Link>
        </div>

        <nav className="header-nav">
          <Link to="/feed" className="nav-link">Feed</Link>
          <Link to="/discover" className="nav-link">Discover</Link>
          <Link to="/collection" className="nav-link">My Collection</Link>
        </nav>

        <div className="header-right">
          <SignedOut>
            <button 
              className="btn btn-primary"
              onClick={() => setShowCustomSignIn(true)}
            >
              Sign In
            </button>
          </SignedOut>
          <SignedIn>
            <button className="icon-btn" onClick={() => navigate('/search')}>
              <Search size={20} />
            </button>
            <button className="icon-btn">
              <Bell size={20} />
            </button>
            <div className="user-menu">
              <span className="welcome-text">Welcome, {user?.firstName || 'User'}</span>
              <div className="profile-dropdown-container" ref={dropdownRef}>
                <button 
                  className="header-profile-btn"
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  title="Profile Menu"
                >
                  <img 
                    src={profileAvatar || user?.imageUrl || '/default-avatar.png'} 
                    alt="Profile" 
                    className="header-avatar"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      if (user?.imageUrl && target.src !== user.imageUrl) {
                        target.src = user.imageUrl
                      } else {
                        target.src = '/default-avatar.png'
                      }
                    }}
                  />
                  <ChevronDown size={16} className="dropdown-arrow" />
                </button>
                
                {showProfileDropdown && (
                  <div className="profile-dropdown">
                    <div className="dropdown-header">
                      <img 
                        src={profileAvatar || user?.imageUrl || '/default-avatar.png'} 
                        alt="Profile" 
                        className="dropdown-avatar"
                      />
                      <div className="dropdown-user-info">
                        <span className="dropdown-name">{user?.fullName || user?.firstName || 'User'}</span>
                        <span className="dropdown-email">{user?.primaryEmailAddress?.emailAddress}</span>
                      </div>
                    </div>
                    <div className="dropdown-divider"></div>
                    <button 
                      className="dropdown-item"
                      onClick={() => {
                        navigate('/profile')
                        setShowProfileDropdown(false)
                      }}
                    >
                      <User size={18} />
                      <span>View Profile</span>
                    </button>
                    <div className="dropdown-divider"></div>
                    <button 
                      className="dropdown-item logout-item"
                      onClick={() => {
                        setShowProfileDropdown(false)
                        signOut()
                      }}
                    >
                      <LogOut size={18} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </SignedIn>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="mobile-header">
        <div className="mobile-header-top">
          <Link to="/feed" className="mobile-logo">
            <Camera size={24} />
            <span>RetroLens</span>
          </Link>
          <div className="mobile-actions">
            <SignedIn>
              <button className="icon-btn" onClick={() => navigate('/search')}>
                <Search size={20} />
              </button>
              <button className="icon-btn">
                <Bell size={20} />
              </button>
            </SignedIn>
            <SignedOut>
              <button 
                className="btn btn-sm"
                onClick={() => setShowCustomSignIn(true)}
              >
                Sign In
              </button>
            </SignedOut>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <SignedIn>
        <nav className="mobile-nav">
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
          <Link to="/profile" className="nav-item">
            <div className="nav-avatar">
              <img 
                src={profileAvatar || user?.imageUrl || '/default-avatar.png'} 
                alt="Profile" 
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  if (user?.imageUrl && target.src !== user.imageUrl) {
                    target.src = user.imageUrl
                  } else {
                    target.src = '/default-avatar.png'
                  }
                }}
              />
            </div>
            <span>Profile</span>
          </Link>
        </nav>
      </SignedIn>

      {/* Custom Sign In Modal */}
      {showCustomSignIn && (
        <CustomSignIn onClose={() => setShowCustomSignIn(false)} />
      )}
    </>
  )
}