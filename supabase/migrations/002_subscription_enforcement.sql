-- ALLINHERE Studio Subscription Enforcement Migration
-- This migration adds server-side enforcement of subscription limits and trial status

-- ============================================================================
-- 1. HELPER FUNCTIONS FOR PLAN LIMITS
-- ============================================================================

-- Function to get user plan limits as JSON
CREATE OR REPLACE FUNCTION public.get_user_plan_limits(user_id UUID)
RETURNS JSONB AS $$
DECLARE
  user_plan subscription_plan;
  limits JSONB;
BEGIN
  -- Get user's plan (default to BASIC if null)
  SELECT COALESCE(subscription_plan, 'BASIC'::subscription_plan)
  INTO user_plan
  FROM public.users
  WHERE id = user_id;

  -- Return plan limits as JSONB
  CASE user_plan
    WHEN 'BASIC' THEN
      limits := jsonb_build_object(
        'storage_gb', 5,
        'max_projects', 10,
        'max_resolution', '1080p',
        'watermark_enabled', true,
        'collaboration_enabled', false,
        'ar_filters_enabled', false
      );
    WHEN 'PRO' THEN
      limits := jsonb_build_object(
        'storage_gb', 25,
        'max_projects', -1, -- -1 means unlimited
        'max_resolution', '4K',
        'watermark_enabled', false,
        'collaboration_enabled', true,
        'ar_filters_enabled', true
      );
    ELSE
      -- Default to BASIC
      limits := jsonb_build_object(
        'storage_gb', 5,
        'max_projects', 10,
        'max_resolution', '1080p',
        'watermark_enabled', true,
        'collaboration_enabled', false,
        'ar_filters_enabled', false
      );
  END CASE;

  RETURN limits;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 2. SUBSCRIPTION VALIDATION FUNCTIONS
-- ============================================================================

-- Function to validate user subscription status
CREATE OR REPLACE FUNCTION public.validate_user_subscription(user_id UUID)
RETURNS TABLE(
  is_valid BOOLEAN,
  status subscription_status,
  plan subscription_plan,
  trial_expired BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  user_record RECORD;
  trial_expired_flag BOOLEAN := FALSE;
BEGIN
  SELECT subscription_status, subscription_plan, trial_end_date
  INTO user_record
  FROM public.users
  WHERE id = user_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::subscription_status, NULL::subscription_plan, FALSE, 'User not found';
    RETURN;
  END IF;

  -- Check if trial expired
  IF user_record.subscription_status = 'TRIAL' AND user_record.trial_end_date IS NOT NULL THEN
    IF user_record.trial_end_date < NOW() THEN
      trial_expired_flag := TRUE;
      -- Auto-update status to EXPIRED
      UPDATE public.users
      SET subscription_status = 'EXPIRED'
      WHERE id = user_id;
    END IF;
  END IF;

  -- Validate subscription status
  IF user_record.subscription_status = 'EXPIRED' OR trial_expired_flag THEN
    RETURN QUERY SELECT 
      FALSE,
      COALESCE(user_record.subscription_status, 'EXPIRED'::subscription_status),
      user_record.subscription_plan,
      trial_expired_flag,
      'Subscription has expired. Please upgrade to continue.';
    RETURN;
  END IF;

  IF user_record.subscription_status = 'CANCELLED' THEN
    RETURN QUERY SELECT 
      FALSE,
      user_record.subscription_status,
      user_record.subscription_plan,
      FALSE,
      'Subscription has been cancelled. Please reactivate to continue.';
    RETURN;
  END IF;

  -- Valid subscription
  RETURN QUERY SELECT 
    TRUE,
    user_record.subscription_status,
    user_record.subscription_plan,
    FALSE,
    NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to check if user can create projects
CREATE OR REPLACE FUNCTION public.check_project_limit(user_id UUID)
RETURNS TABLE(can_create BOOLEAN, error_message TEXT) AS $$
DECLARE
  user_record RECORD;
  project_count INTEGER;
  max_projects INTEGER;
  validation_result RECORD;
BEGIN
  -- First validate subscription status
  SELECT * INTO validation_result
  FROM public.validate_user_subscription(user_id);

  IF NOT validation_result.is_valid THEN
    RETURN QUERY SELECT FALSE, validation_result.error_message;
    RETURN;
  END IF;

  -- Get user plan limits
  SELECT (get_user_plan_limits(user_id)->>'max_projects')::INTEGER INTO max_projects;

  -- Unlimited projects (-1)
  IF max_projects = -1 THEN
    RETURN QUERY SELECT TRUE, NULL;
    RETURN;
  END IF;

  -- Count existing projects
  SELECT COUNT(*) INTO project_count
  FROM public.projects
  WHERE projects.user_id = user_id;

  IF project_count >= max_projects THEN
    RETURN QUERY SELECT FALSE, format('Project limit reached (%s projects). Upgrade to PRO for unlimited projects.', max_projects);
    RETURN;
  END IF;

  RETURN QUERY SELECT TRUE, NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to check storage limit
CREATE OR REPLACE FUNCTION public.check_storage_limit(user_id UUID, required_bytes BIGINT)
RETURNS TABLE(has_storage BOOLEAN, error_message TEXT) AS $$
DECLARE
  user_record RECORD;
  storage_gb INTEGER;
  max_storage_bytes BIGINT;
  validation_result RECORD;
BEGIN
  -- First validate subscription status
  SELECT * INTO validation_result
  FROM public.validate_user_subscription(user_id);

  IF NOT validation_result.is_valid THEN
    RETURN QUERY SELECT FALSE, validation_result.error_message;
    RETURN;
  END IF;

  -- Get user's current storage usage and plan
  SELECT storage_used, (get_user_plan_limits(user_id)->>'storage_gb')::INTEGER
  INTO user_record.storage_used, storage_gb
  FROM public.users
  WHERE id = user_id;

  -- Convert GB to bytes
  max_storage_bytes := storage_gb * 1024 * 1024 * 1024;

  IF user_record.storage_used + required_bytes > max_storage_bytes THEN
    RETURN QUERY SELECT FALSE, format('Storage limit exceeded. You have %s GB available. Upgrade to increase storage.', storage_gb);
    RETURN;
  END IF;

  RETURN QUERY SELECT TRUE, NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to validate trial is active
CREATE OR REPLACE FUNCTION public.validate_trial_active(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_record RECORD;
BEGIN
  SELECT subscription_status, trial_end_date
  INTO user_record
  FROM public.users
  WHERE id = user_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- If not on trial, return true (they have active subscription)
  IF user_record.subscription_status != 'TRIAL' THEN
    RETURN TRUE;
  END IF;

  -- Check if trial expired
  IF user_record.trial_end_date IS NOT NULL AND user_record.trial_end_date < NOW() THEN
    -- Auto-update status
    UPDATE public.users
    SET subscription_status = 'EXPIRED'
    WHERE id = user_id;
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- 3. TRIGGERS FOR PROJECT LIMITS
-- ============================================================================

-- Function to enforce project creation limits
CREATE OR REPLACE FUNCTION public.enforce_project_limits()
RETURNS TRIGGER AS $$
DECLARE
  limit_check RECORD;
BEGIN
  -- Check if user can create project
  SELECT * INTO limit_check
  FROM public.check_project_limit(NEW.user_id);

  IF NOT limit_check.can_create THEN
    RAISE EXCEPTION '%', limit_check.error_message
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger before project insertion
DROP TRIGGER IF EXISTS enforce_project_limits_trigger ON public.projects;
CREATE TRIGGER enforce_project_limits_trigger
  BEFORE INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_project_limits();

-- ============================================================================
-- 4. TRIGGERS FOR STORAGE LIMITS
-- ============================================================================

-- Function to enforce storage limits (before storage update)
CREATE OR REPLACE FUNCTION public.enforce_storage_limits()
RETURNS TRIGGER AS $$
DECLARE
  storage_check RECORD;
BEGIN
  -- Check storage limit before allowing insertion
  SELECT * INTO storage_check
  FROM public.check_storage_limit(NEW.user_id, NEW.file_size);

  IF NOT storage_check.has_storage THEN
    RAISE EXCEPTION '%', storage_check.error_message
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger before media asset insertion (before storage update trigger)
DROP TRIGGER IF EXISTS enforce_storage_limits_trigger ON public.media_assets;
CREATE TRIGGER enforce_storage_limits_trigger
  BEFORE INSERT ON public.media_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_storage_limits();

-- ============================================================================
-- 5. BOOLEAN HELPER FUNCTIONS FOR RLS POLICIES
-- ============================================================================

-- Simple boolean function for RLS policies
CREATE OR REPLACE FUNCTION public.is_user_subscription_valid(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  validation_result RECORD;
BEGIN
  SELECT is_valid INTO validation_result
  FROM public.validate_user_subscription(user_id);
  RETURN validation_result.is_valid;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Simple boolean function for project limit check
CREATE OR REPLACE FUNCTION public.can_user_create_project(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  limit_check RECORD;
BEGIN
  SELECT can_create INTO limit_check
  FROM public.check_project_limit(user_id);
  RETURN limit_check.can_create;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- 6. ENHANCED RLS POLICIES
-- ============================================================================

-- Drop existing policies that need enhancement
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create media" ON public.media_assets;
DROP POLICY IF EXISTS "Users can create export jobs" ON public.export_jobs;

-- Enhanced policy: Users can create projects (with subscription validation)
-- Note: Triggers will enforce project limits, RLS just checks subscription status
CREATE POLICY "Users can create projects" ON public.projects
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_user_subscription_valid(auth.uid())
  );

-- Enhanced policy: Users can create media (with subscription validation)
-- Note: Triggers will enforce storage limits, RLS just checks subscription status
CREATE POLICY "Users can create media" ON public.media_assets
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_user_subscription_valid(auth.uid())
  );

-- Enhanced policy: Users can create export jobs (with subscription validation)
CREATE POLICY "Users can create export jobs" ON public.export_jobs
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_user_subscription_valid(auth.uid())
  );

-- ============================================================================
-- 7. AUTOMATIC TRIAL EXPIRATION
-- ============================================================================

-- Enhanced function to check and update trial expiration
CREATE OR REPLACE FUNCTION public.check_and_expire_trials()
RETURNS void AS $$
BEGIN
  -- Update expired trials
  UPDATE public.users
  SET subscription_status = 'EXPIRED'
  WHERE subscription_status = 'TRIAL'
    AND trial_end_date IS NOT NULL
    AND trial_end_date < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check trial expiration on user access (called via trigger)
CREATE OR REPLACE FUNCTION public.check_trial_on_access()
RETURNS TRIGGER AS $$
BEGIN
  -- If user is on trial and trial has expired, update status
  IF NEW.subscription_status = 'TRIAL' AND NEW.trial_end_date IS NOT NULL THEN
    IF NEW.trial_end_date < NOW() THEN
      NEW.subscription_status := 'EXPIRED';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check trial expiration before SELECT (via BEFORE UPDATE)
DROP TRIGGER IF EXISTS check_trial_expiration_trigger ON public.users;
CREATE TRIGGER check_trial_expiration_trigger
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  WHEN (NEW.subscription_status = 'TRIAL')
  EXECUTE FUNCTION public.check_trial_on_access();

-- Note: For automatic daily expiration, set up pg_cron job:
-- SELECT cron.schedule('expire-trials', '0 0 * * *', 'SELECT public.check_and_expire_trials();');
-- This requires pg_cron extension to be enabled in Supabase
