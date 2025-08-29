# RetroLens API Reference

## Overview
- **Version**: 1.0.0
- **Base URL**: `http://localhost:8000` (development)
- **Authentication**: Bearer token (JWT from Clerk)

## Table of Contents
- [Authentication](#authentication)
- [Users](#users)
- [Cameras](#cameras)
- [Discussions](#discussions)
- [Comments](#comments)
- [Likes](#likes)
- [Categories](#categories)
- [File Upload](#file-upload)
- [Data Models](#data-models)

---

## Authentication

Most endpoints require authentication using a Bearer token from Clerk.

**Header Format:**
```
Authorization: Bearer <your-clerk-token>
```

### Endpoints

#### Get Current User Info
- **GET** `/api/v1/auth/me`
- **Auth Required**: Yes
- **Response**: Current user information

#### Sync User With Database
- **POST** `/api/v1/auth/sync-user`
- **Auth Required**: Yes
- **Response**: `UserPublic`
- **Description**: Creates or updates user in database from Clerk data

#### Verify Token
- **GET** `/api/v1/auth/verify-token`
- **Auth Required**: Yes
- **Response**: Token validation status

---

## Users

### Endpoints

#### Sync User from Clerk
- **POST** `/api/v1/users/sync`
- **Auth Required**: No
- **Request Body**: `UserSyncRequest`
```json
{
  "clerk_id": "string",
  "email": "string",
  "username": "string",
  "full_name": "string",
  "avatar_url": "string",
  "metadata": {}
}
```

#### Create User
- **POST** `/api/v1/users/`
- **Request Body**: `UserCreate`
```json
{
  "username": "string",
  "email": "user@example.com",
  "display_name": "string",
  "bio": "string",
  "avatar_url": "string",
  "location": "string",
  "expertise_level": "beginner|intermediate|expert",
  "website_url": "string",
  "instagram_url": "string"
}
```

#### List Users
- **GET** `/api/v1/users/`
- **Query Parameters**:
  - `limit` (int, max: 100, default: 20)
  - `offset` (int, min: 0, default: 0)
- **Response**: Array of `UserPublic`

#### Get User by ID
- **GET** `/api/v1/users/{user_id}`
- **Response**: `UserPublic`

#### Get User by Username
- **GET** `/api/v1/users/username/{username}`
- **Response**: `UserPublic`

#### Update User
- **PATCH** `/api/v1/users/{user_id}`
- **Request Body**: `UserUpdate` (all fields optional)

#### Follow User
- **POST** `/api/v1/users/{user_id}/follow`
- **Request Body**: `{}`

#### Unfollow User
- **DELETE** `/api/v1/users/{user_id}/unfollow`
- **Request Body**: `{}`

---

## Cameras

### Endpoints

#### List Cameras
- **GET** `/api/v1/cameras/`
- **Query Parameters**:
  - `limit` (int, max: 100, default: 20)
  - `offset` (int, min: 0, default: 0)
- **Response**: Array of `CameraPublic`

#### Create Camera
- **POST** `/api/v1/cameras/`
- **Query Parameters**:
  - `user_id` (uuid, required)
- **Request Body**: `CameraCreate`
```json
{
  "brand_name": "string",
  "model": "string",
  "year": "string",
  "camera_type": "string",
  "film_format": "string",
  "condition": "mint|excellent|good|fair|poor|for_parts",
  "acquisition_story": "string",
  "technical_specs": {},
  "market_value_min": 0,
  "market_value_max": 0,
  "is_for_sale": false,
  "is_for_trade": false,
  "is_public": true
}
```

#### Get Camera by ID
- **GET** `/api/v1/cameras/{camera_id}`
- **Response**: `CameraPublic`

---

## Discussions

### Endpoints

#### List Discussions
- **GET** `/api/v1/discussions/`
- **Query Parameters**:
  - `limit` (int, max: 100, default: 20)
  - `offset` (int, min: 0, default: 0)
- **Response**: Array of `DiscussionPublic`

#### Create Discussion
- **POST** `/api/v1/discussions/`
- **Query Parameters**:
  - `user_id` (uuid, required)
- **Request Body**: `DiscussionCreate`
```json
{
  "title": "string",
  "body": "string",
  "category_id": "uuid",
  "tags": ["string"]
}
```

#### Get Discussion by ID
- **GET** `/api/v1/discussions/{discussion_id}`
- **Response**: `DiscussionPublic`

---

## Comments

### Endpoints

#### List Comments
- **GET** `/api/v1/comments/`
- **Query Parameters**:
  - `discussion_id` (string, optional): Get comments for a specific discussion
  - `camera_id` (string, optional): Get comments for a specific camera
  - `limit` (int, max: 100, default: 50)
  - `offset` (int, min: 0, default: 0)
- **Response**: Array of comments with author info, like counts
- **Note**: Either `discussion_id` or `camera_id` must be provided

#### Create Comment
- **POST** `/api/v1/comments/`
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "body": "string",
  "discussion_id": "string (optional)",
  "camera_id": "string (optional)", 
  "parent_id": "string (optional)"
}
```
- **Response**: Created comment with author info
- **Restriction**: Only users who mutually follow each other can comment on each other's posts

#### Update Comment
- **PUT** `/api/v1/comments/{comment_id}`
- **Auth Required**: Yes (must be comment author)
- **Request Body**:
```json
{
  "body": "string"
}
```

#### Delete Comment
- **DELETE** `/api/v1/comments/{comment_id}`
- **Auth Required**: Yes (must be comment author)

---

## Likes

### Endpoints

#### Create Like
- **POST** `/api/v1/likes/`
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "discussion_id": "string (optional)",
  "camera_id": "string (optional)",
  "comment_id": "string (optional)"
}
```
- **Response**: Success message with like ID
- **Restriction**: Only users who mutually follow each other can like each other's posts
- **Note**: Exactly one of `discussion_id`, `camera_id`, or `comment_id` must be provided

#### Remove Like
- **DELETE** `/api/v1/likes/`
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "discussion_id": "string (optional)",
  "camera_id": "string (optional)",
  "comment_id": "string (optional)"
}
```
- **Response**: Success message
- **Note**: Exactly one of `discussion_id`, `camera_id`, or `comment_id` must be provided

#### Check Like Status
- **GET** `/api/v1/likes/check`
- **Auth Required**: Yes
- **Query Parameters**:
  - `discussion_id` (string, optional)
  - `camera_id` (string, optional)
  - `comment_id` (string, optional)
- **Response**: `{"is_liked": boolean}`
- **Note**: Exactly one of the query parameters must be provided

#### Get Like Count
- **GET** `/api/v1/likes/count`
- **Query Parameters**:
  - `discussion_id` (string, optional)
  - `camera_id` (string, optional)
  - `comment_id` (string, optional)
- **Response**: `{"like_count": number}`
- **Note**: Exactly one of the query parameters must be provided

---

## Categories

### Endpoints

#### List Categories
- **GET** `/api/v1/categories/`
- **Response**: Array of `Category`

---

## File Upload

### Endpoints

#### Upload Camera Image
- **POST** `/api/v1/upload/camera-image`
- **Query Parameters**:
  - `user_id` (string, optional)
- **Request Body**: Multipart form data with `file` field
- **Response**: Object with image URLs

#### Upload Avatar
- **POST** `/api/v1/upload/avatar`
- **Query Parameters**:
  - `user_id` (string, optional)
- **Request Body**: Multipart form data with `file` field
- **Response**: Object with avatar URL

---

## Data Models

### UserPublic
```typescript
interface UserPublic {
  id: string;
  username: string;
  email: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
  expertise_level?: "beginner" | "intermediate" | "expert";
  website_url?: string;
  instagram_url?: string;
  created_at: string; // ISO 8601 datetime
  camera_count: number;
  discussion_count: number;
  follower_count: number;
  following_count: number;
}
```

### CameraPublic
```typescript
interface CameraPublic {
  id: string; // UUID
  user_id: string; // UUID
  brand_name: string;
  model: string;
  year?: string;
  camera_type?: string;
  film_format?: string;
  condition?: "mint" | "excellent" | "good" | "fair" | "poor" | "for_parts";
  acquisition_story?: string;
  technical_specs?: object;
  market_value_min?: string;
  market_value_max?: string;
  is_for_sale: boolean;
  is_for_trade: boolean;
  is_public: boolean;
  view_count: number;
  created_at: string; // ISO 8601 datetime
  updated_at: string; // ISO 8601 datetime
  images: CameraImage[];
  owner_username?: string;
  owner_avatar?: string;
  like_count?: number;
  comment_count?: number;
  is_liked?: boolean;
}
```

### CameraImage
```typescript
interface CameraImage {
  id: string; // UUID
  camera_id: string; // UUID
  image_url: string;
  thumbnail_url?: string;
  is_primary: boolean;
  display_order: number;
  created_at: string; // ISO 8601 datetime
}
```

### DiscussionPublic
```typescript
interface DiscussionPublic {
  id: string; // UUID
  user_id: string; // UUID
  category_id?: string; // UUID
  title: string;
  body: string;
  tags: string[];
  is_pinned: boolean;
  is_locked: boolean;
  view_count: number;
  created_at: string; // ISO 8601 datetime
  updated_at: string; // ISO 8601 datetime
  author_username?: string;
  author_avatar?: string;
  category_name?: string;
  comment_count?: number;
  like_count?: number;
  is_liked?: boolean;
  last_comment_at?: string; // ISO 8601 datetime
}
```

### Category
```typescript
interface Category {
  id: string; // UUID
  name: string;
  description?: string;
  icon?: string;
  display_order: number;
  created_at: string; // ISO 8601 datetime
}
```

### UserSyncRequest
```typescript
interface UserSyncRequest {
  clerk_id: string;
  email: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  metadata?: object;
}
```

### Validation Error Response
```typescript
interface HTTPValidationError {
  detail: Array<{
    loc: (string | number)[];
    msg: string;
    type: string;
  }>;
}
```

---

## Common Response Codes

- **200**: Success
- **400**: Bad Request (invalid data)
- **401**: Unauthorized (missing or invalid token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **422**: Validation Error (invalid request body)
- **500**: Internal Server Error

---

## Notes

### Authentication Flow
1. User signs in via Clerk on frontend
2. Frontend gets JWT token from Clerk
3. Frontend syncs user data with backend using `/api/v1/users/sync`
4. All subsequent API calls include Bearer token in Authorization header

### Pagination
Most list endpoints support pagination with:
- `limit`: Number of items to return (max 100)
- `offset`: Number of items to skip

### Camera Conditions
Valid values: `mint`, `excellent`, `good`, `fair`, `poor`, `for_parts`

### User Expertise Levels
Valid values: `beginner`, `intermediate`, `expert`

### UUID Format
All IDs are in UUID v4 format: `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`

### Datetime Format
All datetime fields use ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`

---

## Example Usage

### Fetch User Profile
```javascript
const response = await fetch('/api/v1/users/username/johndoe', {
  headers: {
    'Authorization': `Bearer ${clerkToken}`
  }
});
const user = await response.json();
```

### Create a Camera
```javascript
const response = await fetch('/api/v1/cameras/?user_id=123e4567-e89b-12d3-a456-426614174000', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${clerkToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    brand_name: 'Leica',
    model: 'M6',
    year: '1984',
    condition: 'excellent',
    film_format: '35mm'
  })
});
const camera = await response.json();
```

### List Discussions with Pagination
```javascript
const response = await fetch('/api/v1/discussions/?limit=10&offset=20', {
  headers: {
    'Authorization': `Bearer ${clerkToken}`
  }
});
const discussions = await response.json();
```
