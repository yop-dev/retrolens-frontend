import React from 'react'

interface DiscussionSkeletonProps {
  count?: number
}

export const DiscussionSkeleton: React.FC<DiscussionSkeletonProps> = ({ count = 3 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="discussion-card skeleton-card">
          <div className="discussion-header">
            <div className="skeleton skeleton-avatar"></div>
            <div className="discussion-info">
              <div className="skeleton skeleton-text" style={{ width: '150px' }}></div>
              <div className="skeleton skeleton-text" style={{ width: '100px' }}></div>
            </div>
          </div>
          
          <div className="discussion-content">
            <div className="skeleton skeleton-title" style={{ width: '80%' }}></div>
            <div className="skeleton skeleton-text" style={{ width: '100%' }}></div>
            <div className="skeleton skeleton-text" style={{ width: '90%' }}></div>
            <div className="skeleton skeleton-text" style={{ width: '70%' }}></div>
            
            <div className="skeleton skeleton-image" style={{ height: '200px', marginTop: '1rem' }}></div>
          </div>
          
          <div className="discussion-actions">
            <div className="skeleton skeleton-button" style={{ width: '60px' }}></div>
            <div className="skeleton skeleton-button" style={{ width: '60px' }}></div>
            <div className="skeleton skeleton-button" style={{ width: '60px' }}></div>
            <div className="skeleton skeleton-button" style={{ width: '60px' }}></div>
          </div>
        </div>
      ))}
    </>
  )
}

export default DiscussionSkeleton
