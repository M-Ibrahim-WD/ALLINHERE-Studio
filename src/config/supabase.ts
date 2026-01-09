import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database Tables
export const Tables = {
  USERS: 'users',
  PROJECTS: 'projects',
  MEDIA_ASSETS: 'media_assets',
  TIMELINE_CLIPS: 'timeline_clips',
  SUBSCRIPTIONS: 'subscriptions',
  EXPORT_JOBS: 'export_jobs',
  AUDIT_LOGS: 'audit_logs',
  TEMPLATES: 'templates',
  CAMERA_FILTERS: 'camera_filters',
} as const;

// Storage Buckets
export const Buckets = {
  MEDIA: 'media',
  THUMBNAILS: 'thumbnails',
  EXPORTS: 'exports',
  AVATARS: 'avatars',
} as const;

// Helper function to get authenticated user
export const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

// Helper function to sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
