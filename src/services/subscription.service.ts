import { supabase, Tables } from '@config/supabase';
import {
  User,
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
  PlanLimits,
} from '../types';

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
  errorCode?: 'SUBSCRIPTION_EXPIRED' | 'TRIAL_EXPIRED' | 'LIMIT_EXCEEDED' | 'STORAGE_EXCEEDED';
}

export class SubscriptionError extends Error {
  constructor(
    message: string,
    public code: 'SUBSCRIPTION_EXPIRED' | 'TRIAL_EXPIRED' | 'LIMIT_EXCEEDED' | 'STORAGE_EXCEEDED' | 'INVALID_SUBSCRIPTION',
    public action?: string
  ) {
    super(message);
    this.name = 'SubscriptionError';
  }
}

export class SubscriptionService {
  /**
   * Get plan limits based on subscription plan
   */
  static getPlanLimits(plan: SubscriptionPlan): PlanLimits {
    const limits: Record<SubscriptionPlan, PlanLimits> = {
      BASIC: {
        storage_gb: 5,
        max_projects: 10,
        max_resolution: '1080p',
        watermark_enabled: true,
        collaboration_enabled: false,
        ar_filters_enabled: false,
      },
      PRO: {
        storage_gb: 25,
        max_projects: -1, // Unlimited
        max_resolution: '4K',
        watermark_enabled: false,
        collaboration_enabled: true,
        ar_filters_enabled: true,
      },
    };

    return limits[plan];
  }

  /**
   * Check if user can create new project
   * Throws SubscriptionError if validation fails
   */
  static async canCreateProject(userId: string): Promise<boolean> {
    const validation = await this.validateBeforeAction(userId, 'create_project');
    if (!validation.isValid) {
      throw new SubscriptionError(
        validation.errorMessage || 'Cannot create project',
        validation.errorCode || 'INVALID_SUBSCRIPTION',
        'create_project'
      );
    }
    return true;
  }

  /**
   * Check if user can export project
   * Throws SubscriptionError if validation fails
   */
  static async canExportProject(userId: string): Promise<boolean> {
    const validation = await this.validateBeforeAction(userId, 'export');
    if (!validation.isValid) {
      throw new SubscriptionError(
        validation.errorMessage || 'Cannot export project',
        validation.errorCode || 'INVALID_SUBSCRIPTION',
        'export'
      );
    }
    return true;
  }

  /**
   * Check if user can upload media
   * Throws SubscriptionError if validation fails
   */
  static async canUploadMedia(userId: string, fileSize?: number): Promise<boolean> {
    const validation = await this.validateBeforeAction(userId, 'upload_media', fileSize);
    if (!validation.isValid) {
      throw new SubscriptionError(
        validation.errorMessage || 'Cannot upload media',
        validation.errorCode || 'INVALID_SUBSCRIPTION',
        'upload_media'
      );
    }
    return true;
  }

  /**
   * Check if user can use AR filters
   */
  static async canUseARFilters(userId: string): Promise<boolean> {
    const user = await this.getUserWithSubscription(userId);

    if (!user) return false;

    const plan = (user.subscription_plan as SubscriptionPlan) || SubscriptionPlan.BASIC;
    const limits = this.getPlanLimits(plan);

    return limits.ar_filters_enabled;
  }

  /**
   * Check if user can use collaboration
   */
  static async canUseCollaboration(userId: string): Promise<boolean> {
    const user = await this.getUserWithSubscription(userId);

    if (!user) return false;

    const plan = (user.subscription_plan as SubscriptionPlan) || SubscriptionPlan.BASIC;
    const limits = this.getPlanLimits(plan);

    return limits.collaboration_enabled;
  }

  /**
   * Check if user has enough storage
   */
  static async hasStorageAvailable(
    userId: string,
    requiredBytes: number
  ): Promise<boolean> {
    const user = await this.getUserWithSubscription(userId);

    if (!user) return false;

    const plan = (user.subscription_plan as SubscriptionPlan) || SubscriptionPlan.BASIC;
    const limits = this.getPlanLimits(plan);
    const maxStorageBytes = limits.storage_gb * 1024 * 1024 * 1024; // Convert GB to bytes

    return user.storage_used + requiredBytes <= maxStorageBytes;
  }

  /**
   * Get user with subscription details
   */
  static async getUserWithSubscription(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from(Tables.USERS)
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data as User;
  }

  /**
   * Check if trial is expired
   */
  static async isTrialExpired(userId: string): Promise<boolean> {
    const user = await this.getUserWithSubscription(userId);

    if (!user || user.subscription_status !== 'TRIAL') {
      return false;
    }

    if (!user.trial_end_date) return false;

    const trialEndDate = new Date(user.trial_end_date);
    const now = new Date();

    return now > trialEndDate;
  }

  /**
   * Get days remaining in trial
   */
  static async getTrialDaysRemaining(userId: string): Promise<number> {
    const user = await this.getUserWithSubscription(userId);

    if (!user || user.subscription_status !== 'TRIAL' || !user.trial_end_date) {
      return 0;
    }

    const trialEndDate = new Date(user.trial_end_date);
    const now = new Date();
    const diffTime = trialEndDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }

  /**
   * Get user's active subscription
   */
  static async getUserSubscription(
    userId: string
  ): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from(Tables.SUBSCRIPTIONS)
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No subscription found
      throw error;
    }

    return data as Subscription;
  }

  /**
   * Create or update subscription
   */
  static async upsertSubscription(
    userId: string,
    subscriptionData: Partial<Subscription>
  ): Promise<Subscription> {
    const { data, error } = await supabase
      .from(Tables.SUBSCRIPTIONS)
      .upsert({
        user_id: userId,
        ...subscriptionData,
      })
      .select()
      .single();

    if (error) throw error;

    // Update user subscription status
    await supabase
      .from(Tables.USERS)
      .update({
        subscription_status: subscriptionData.status,
        subscription_plan: subscriptionData.plan,
      })
      .eq('id', userId);

    return data as Subscription;
  }

  /**
   * Cancel subscription at period end
   */
  static async cancelSubscription(userId: string): Promise<void> {
    const { error } = await supabase
      .from(Tables.SUBSCRIPTIONS)
      .update({ cancel_at_period_end: true })
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Reactivate subscription
   */
  static async reactivateSubscription(userId: string): Promise<void> {
    const { error } = await supabase
      .from(Tables.SUBSCRIPTIONS)
      .update({ cancel_at_period_end: false })
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Get storage usage percentage
   */
  static async getStorageUsagePercentage(userId: string): Promise<number> {
    const user = await this.getUserWithSubscription(userId);

    if (!user) return 0;

    const plan = (user.subscription_plan as SubscriptionPlan) || SubscriptionPlan.BASIC;
    const limits = this.getPlanLimits(plan);
    const maxStorageBytes = limits.storage_gb * 1024 * 1024 * 1024;

    return (user.storage_used / maxStorageBytes) * 100;
  }

  /**
   * Get max resolution based on plan
   */
  static getMaxResolution(plan: SubscriptionPlan): string {
    const limits = this.getPlanLimits(plan);
    return limits.max_resolution;
  }

  /**
   * Check if watermark should be applied
   */
  static shouldApplyWatermark(plan: SubscriptionPlan): boolean {
    const limits = this.getPlanLimits(plan);
    return limits.watermark_enabled;
  }

  /**
   * Validate before performing an action
   * Returns validation result with error message if invalid
   */
  static async validateBeforeAction(
    userId: string,
    action: 'create_project' | 'upload_media' | 'export' | 'access_editor',
    fileSize?: number
  ): Promise<ValidationResult> {
    const user = await this.getUserWithSubscription(userId);

    if (!user) {
      return {
        isValid: false,
        errorMessage: 'User not found',
        errorCode: 'INVALID_SUBSCRIPTION',
      };
    }

    // Check subscription status
    if (user.subscription_status === SubscriptionStatus.EXPIRED) {
      return {
        isValid: false,
        errorMessage: 'Your subscription has expired. Please upgrade to continue.',
        errorCode: 'SUBSCRIPTION_EXPIRED',
      };
    }

    // Check trial expiration
    if (user.subscription_status === SubscriptionStatus.TRIAL) {
      const isExpired = await this.isTrialExpired(userId);
      if (isExpired) {
        return {
          isValid: false,
          errorMessage: 'Your trial has expired. Please upgrade to continue.',
          errorCode: 'TRIAL_EXPIRED',
        };
      }
    }

    // Action-specific validations
    if (action === 'create_project') {
      const plan = (user.subscription_plan as SubscriptionPlan) || SubscriptionPlan.BASIC;
      const limits = this.getPlanLimits(plan);

      if (limits.max_projects === -1) {
        return { isValid: true }; // Unlimited
      }

      const { count, error } = await supabase
        .from(Tables.PROJECTS)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        return {
          isValid: false,
          errorMessage: 'Error checking project limit',
          errorCode: 'INVALID_SUBSCRIPTION',
        };
      }

      if ((count || 0) >= limits.max_projects) {
        return {
          isValid: false,
          errorMessage: `You've reached your project limit (${limits.max_projects} projects). Upgrade to PRO for unlimited projects.`,
          errorCode: 'LIMIT_EXCEEDED',
        };
      }
    }

    if (action === 'upload_media' && fileSize !== undefined) {
      const plan = (user.subscription_plan as SubscriptionPlan) || SubscriptionPlan.BASIC;
      const limits = this.getPlanLimits(plan);
      const maxStorageBytes = limits.storage_gb * 1024 * 1024 * 1024;

      if (user.storage_used + fileSize > maxStorageBytes) {
        return {
          isValid: false,
          errorMessage: `Storage limit exceeded. You have ${limits.storage_gb} GB available. Upgrade to increase storage.`,
          errorCode: 'STORAGE_EXCEEDED',
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Check and refresh subscription status
   * Updates user's subscription status if trial expired
   */
  static async checkSubscriptionStatus(userId: string): Promise<User> {
    const user = await this.getUserWithSubscription(userId);
    
    if (!user) {
      throw new SubscriptionError('User not found', 'INVALID_SUBSCRIPTION');
    }

    // Check if trial expired and update status
    if (user.subscription_status === SubscriptionStatus.TRIAL) {
      const isExpired = await this.isTrialExpired(userId);
      if (isExpired) {
        // Update status to expired
        const { data, error } = await supabase
          .from(Tables.USERS)
          .update({ subscription_status: SubscriptionStatus.EXPIRED })
          .eq('id', userId)
          .select()
          .single();

        if (error) throw error;
        return data as User;
      }
    }

    return user;
  }
}
