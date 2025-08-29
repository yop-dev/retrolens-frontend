// Base API client
export * from './base';

// Service classes
export * from './users.service';
export * from './cameras.service';
export * from './discussions.service';
export * from './likes.service';
export * from './comments.service';

// Service instances for easy import
export { userService } from './users.service';
export { cameraService } from './cameras.service';
export { discussionService } from './discussions.service';
export { likeService } from './likes.service';
export { commentService } from './comments.service';
