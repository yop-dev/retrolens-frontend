import React from 'react';
import { CommentSection } from './CommentSection';

// Demo component to showcase the new comment section design
export const CommentSectionDemo: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Modern Comment Section
        </h1>
        <p className="text-gray-600">
          A beautiful, responsive comment system with modern design and smooth animations.
        </p>
      </div>

      {/* Demo Content Card */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          Sample Discussion: "Best Vintage Camera for Beginners?"
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          I'm new to film photography and looking for my first vintage camera. 
          I've been considering a Canon AE-1 or Pentax K1000. What would you recommend 
          for someone just starting out with analog photography?
        </p>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>Posted 2 hours ago</span>
          <span>•</span>
          <span>12 views</span>
          <span>•</span>
          <span>Photography</span>
        </div>
      </div>

      {/* Comment Section */}
      <CommentSection 
        discussionId="demo-discussion-1"
        currentUserId="demo-user-1"
        className="mb-8"
      />

      {/* Feature Highlights */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ✨ Features Included
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-gray-800">🎨 Modern Design</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Glassmorphism effects</li>
              <li>• Smooth animations</li>
              <li>• Gradient accents</li>
              <li>• Responsive layout</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-gray-800">📱 Mobile Optimized</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Touch-friendly buttons</li>
              <li>• Optimized spacing</li>
              <li>• Swipe gestures ready</li>
              <li>• Keyboard shortcuts</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-gray-800">🔧 Interactive Features</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Real-time editing</li>
              <li>• Nested replies</li>
              <li>• Like system</li>
              <li>• User avatars</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-gray-800">♿ Accessibility</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Keyboard navigation</li>
              <li>• Screen reader friendly</li>
              <li>• Focus indicators</li>
              <li>• ARIA labels</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentSectionDemo;