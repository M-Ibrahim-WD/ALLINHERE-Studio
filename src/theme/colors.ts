export const lightColors = {
  primary: '#6366F1',
  secondary: '#8B5CF6',
  accent: '#EC4899',
  background: '#FFFFFF',
  surface: '#F9FAFB',
  card: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',
  disabled: '#9CA3AF',
  placeholder: '#D1D5DB',
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Timeline specific
  timelineBackground: '#1F2937',
  timelineTrack: '#374151',
  timelineClip: '#6366F1',
  timelinePlayhead: '#EC4899',
  
  // Status colors
  trial: '#F59E0B',
  active: '#10B981',
  expired: '#EF4444',
};

export const darkColors = {
  primary: '#818CF8',
  secondary: '#A78BFA',
  accent: '#F472B6',
  background: '#111827',
  surface: '#1F2937',
  card: '#1F2937',
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
  border: '#374151',
  error: '#F87171',
  success: '#34D399',
  warning: '#FBBF24',
  info: '#60A5FA',
  disabled: '#6B7280',
  placeholder: '#4B5563',
  overlay: 'rgba(0, 0, 0, 0.7)',
  
  // Timeline specific
  timelineBackground: '#0F172A',
  timelineTrack: '#1E293B',
  timelineClip: '#818CF8',
  timelinePlayhead: '#F472B6',
  
  // Status colors
  trial: '#FBBF24',
  active: '#34D399',
  expired: '#F87171',
};

export type ColorScheme = typeof lightColors;
