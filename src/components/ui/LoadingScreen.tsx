import React from 'react';
import { Camera, Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  type?: 'feed' | 'discover' | 'collection' | 'profile' | 'general';
  message?: string;
  showLogo?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  type = 'general', 
  message,
  showLogo = true 
}) => {
  const getLoadingMessage = () => {
    if (message) {
      return message;
    }
    
    switch (type) {
      case 'feed':
        return 'Loading your personalized feed...';
      case 'discover':
        return 'Discovering amazing content...';
      case 'collection':
        return 'Loading your collection...';
      case 'profile':
        return 'Loading profile...';
      default:
        return 'Loading...';
    }
  };

  const getLoadingIcon = () => {
    switch (type) {
      case 'feed':
      case 'discover':
      case 'collection':
        return <Camera className="w-12 h-12 text-amber-600 animate-pulse" />;
      case 'profile':
        return <div className="w-12 h-12 bg-amber-600 rounded-full animate-pulse" />;
      default:
        return <Loader2 className="w-12 h-12 text-amber-600 animate-spin" />;
    }
  };

  return (
    <div className="loading-screen" style={{ zIndex: 9999, position: 'fixed', inset: 0 }}>
      <div className="loading-screen__container">
        {showLogo && (
          <div className="loading-screen__logo">
            <div className="loading-screen__brand">
              <Camera className="w-8 h-8 text-amber-600" />
              <span className="loading-screen__brand-text">RetroLens</span>
            </div>
          </div>
        )}
        
        <div className="loading-screen__content">
          <div className="loading-screen__icon">
            {getLoadingIcon()}
          </div>
          
          <div className="loading-screen__text">
            <h2 className="loading-screen__message">{getLoadingMessage()}</h2>
            <div className="loading-screen__dots">
              <span className="loading-screen__dot loading-screen__dot--1"></span>
              <span className="loading-screen__dot loading-screen__dot--2"></span>
              <span className="loading-screen__dot loading-screen__dot--3"></span>
            </div>
          </div>
        </div>
        
        <div className="loading-screen__progress">
          <div className="loading-screen__progress-bar">
            <div className="loading-screen__progress-fill"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Page-specific loading components
export const FeedLoadingScreen: React.FC = () => (
  <LoadingScreen type="feed" />
);

export const DiscoverLoadingScreen: React.FC = () => (
  <LoadingScreen type="discover" />
);

export const CollectionLoadingScreen: React.FC = () => (
  <LoadingScreen type="collection" />
);

export const ProfileLoadingScreen: React.FC = () => (
  <LoadingScreen type="profile" />
);

// Compact loading for smaller sections
export const CompactLoadingScreen: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="compact-loading">
    <div className="compact-loading__content">
      <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
      <span className="compact-loading__message">{message}</span>
    </div>
  </div>
);

// Full page loading that definitely covers everything
export const FullPageLoadingScreen: React.FC<LoadingScreenProps> = (props) => {
  return (
    <div 
      className="loading-screen" 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10000,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(254, 247, 224, 0.98)'
      }}
    >
      <LoadingScreen {...props} showLogo={true} />
    </div>
  );
};

export default LoadingScreen;