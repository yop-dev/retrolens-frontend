/**
 * Camera information
 */
export interface Camera {
  readonly id: string;
  user_id: string;
  brand_name: string;
  model: string;
  year?: string;
  camera_type?: CameraType;
  film_format?: FilmFormat;
  condition?: CameraCondition;
  acquisition_story?: string;
  technical_specs?: Record<string, unknown>;
  market_value_min?: number;
  market_value_max?: number;
  is_for_sale: boolean;
  is_for_trade: boolean;
  is_public: boolean;
  view_count: number;
  readonly created_at: string;
  readonly updated_at: string;
  images: CameraImage[];
  owner_username?: string;
  owner_avatar?: string;
  like_count: number;
  comment_count: number;
  is_liked: boolean;
}

/**
 * Camera image information
 */
export interface CameraImage {
  readonly id: string;
  camera_id: string;
  image_url: string;
  thumbnail_url?: string;
  is_primary: boolean;
  display_order: number;
  readonly created_at: string;
}

/**
 * Camera types
 */
export type CameraType = 
  | '35mm_slr'
  | '35mm_rangefinder'
  | 'medium_format'
  | 'large_format'
  | 'instant'
  | 'digital'
  | 'point_and_shoot'
  | 'twin_lens_reflex'
  | 'view_camera';

/**
 * Film formats
 */
export type FilmFormat =
  | '35mm'
  | '120'
  | '220'
  | '4x5'
  | '8x10'
  | 'instant'
  | 'aps'
  | '110'
  | '126';

/**
 * Camera conditions
 */
export type CameraCondition = 
  | 'mint'
  | 'excellent'
  | 'very_good'
  | 'good'
  | 'fair'
  | 'poor'
  | 'parts_only';

/**
 * Camera creation data
 */
export interface CreateCameraData {
  brand_name: string;
  model: string;
  year?: string;
  camera_type?: CameraType;
  film_format?: FilmFormat;
  condition?: CameraCondition;
  acquisition_story?: string;
  technical_specs?: Record<string, unknown>;
  market_value_min?: number;
  market_value_max?: number;
  is_for_sale?: boolean;
  is_for_trade?: boolean;
  is_public?: boolean;
}

/**
 * Camera update data
 */
export interface UpdateCameraData extends Partial<CreateCameraData> {
  id: string;
}

/**
 * Camera filter options
 */
export interface CameraFilters {
  brand_name?: string;
  camera_type?: CameraType;
  film_format?: FilmFormat;
  condition?: CameraCondition;
  min_year?: number;
  max_year?: number;
  is_for_sale?: boolean;
  is_for_trade?: boolean;
}

/**
 * Camera sort options
 */
export type CameraSortBy = 
  | 'created_at'
  | 'updated_at'
  | 'brand_name'
  | 'model'
  | 'year'
  | 'view_count'
  | 'like_count';

export type SortOrder = 'asc' | 'desc';
