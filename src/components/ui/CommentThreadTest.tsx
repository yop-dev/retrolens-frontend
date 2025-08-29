import React from 'react';
import { CommentSection } from './CommentSection';

// Test component to verify comment threading
export const CommentThreadTest: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Comment Threading Test
        </h1>
        <p className="text-gray-600">
          Test the new threaded comment system with proper reply functionality.
        </p>
      </div>

      {/* Test Instructions */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          🧪 Testing Instructions
        </h2>
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex items-start gap-2">
            <span className="font-medium text-blue-600">1.</span>
            <span>Post a new comment using the form below</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium text-blue-600">2.</span>
            <span>Click the "Reply" button on any comment to start a threaded conversation</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium text-blue-600">3.</span>
            <span>Replies should appear nested under their parent comments with visual threading</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium text-blue-600">4.</span>
            <span>You can reply to replies (up to 3 levels deep)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium text-blue-600">5.</span>
            <span>Use Ctrl+Enter (or ⌘+Enter on Mac) for quick submission</span>
          </div>
        </div>
      </div>

      {/* Comment Section */}
      <CommentSection 
        discussionId="test-discussion-threading"
        currentUserId="test-user-123"
        className="mb-8"
      />

      {/* Expected Behavior */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ✅ Expected Behavior
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Threading Structure:</h4>
            <div className="text-sm text-gray-600 space-y-1 font-mono bg-gray-50 p-3 rounded-lg">
              <div>📝 Parent Comment</div>
              <div className="ml-4">↳ 💬 Reply 1</div>
              <div className="ml-8">↳ 💬 Reply to Reply 1</div>
              <div className="ml-4">↳ 💬 Reply 2</div>
              <div>📝 Another Parent Comment</div>
              <div className="ml-4">↳ 💬 Its Reply</div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Visual Features:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Replies are visually indented</li>
              <li>• Threading lines connect replies to parents</li>
              <li>• Reply forms appear inline</li>
              <li>• Smooth animations for new replies</li>
              <li>• Proper nesting limits (3 levels max)</li>
              <li>• Reply counts shown for each thread</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentThreadTest;