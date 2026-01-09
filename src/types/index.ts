// Core Types for ALLINHERE Studio

export enum SubscriptionStatus {
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  PAST_DUE = 'PAST_DUE',
}

export enum SubscriptionPlan {
  BASIC = 'BASIC',
  PRO = 'PRO',
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: UserRole;
  subscription_status: SubscriptionStatus;
  subscription_plan?: SubscriptionPlan;
  trial_start_date?: string;
  trial_end_date?: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
  storage_used: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  thumbnail_url?: string;
  duration: number; // in seconds
  resolution: string; // e.g., "1920x1080"
  fps: number;
  created_at: string;
  updated_at: string;
  last_edited_at: string;
  is_collaborative: boolean;
  locked_by?: string;
}

export interface MediaAsset {
  id: string;
  user_id: string;
  project_id?: string;
  type: 'video' | 'image' | 'audio';
  file_name: string;
  file_size: number;
  file_url: string;
  thumbnail_url?: string;
  duration?: number;
  resolution?: string;
  mime_type: string;
  created_at: string;
}

export interface TimelineClip {
  id: string;
  project_id: string;
  media_asset_id: string;
  track_index: number;
  start_time: number; // Position on timeline in seconds
  end_time: number;
  trim_start: number; // Trim from original media
  trim_end: number;
  volume: number; // 0-1
  layer_index: number;
  transitions?: Transition[];
  filters?: Filter[];
}

export interface Transition {
  id: string;
  type: 'fade' | 'dissolve' | 'wipe' | 'slide';
  duration: number;
  position: 'start' | 'end';
}

export interface Filter {
  id: string;
  name: string;
  type: string;
  intensity: number;
  parameters: Record<string, any>;
}

export interface ExportJob {
  id: string;
  user_id: string;
  project_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  resolution: string;
  quality: string;
  format: string;
  file_size?: number;
  output_url?: string;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  payment_provider: 'stripe' | 'paypal';
  payment_provider_id: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanLimits {
  storage_gb: number;
  max_projects: number; // -1 for unlimited
  max_resolution: '1080p' | '4K';
  watermark_enabled: boolean;
  collaboration_enabled: boolean;
  ar_filters_enabled: boolean;
}

export interface PresenceUser {
  user_id: string;
  full_name: string;
  avatar_url?: string;
  last_seen: string;
  is_editing: boolean;
}

export interface CameraFilter {
  id: string;
  name: string;
  thumbnail_url: string;
  config: Record<string, any>;
  is_premium: boolean;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail_url: string;
  category: string;
  duration: number;
  is_premium: boolean;
  config: Record<string, any>;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}
