import { supabase } from '../config/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '../types';

export class AuthService {
  /**
   * Sign up with email and password
   */
  static async signUpWithEmail(
    email: string,
    password: string,
    fullName?: string
  ) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;
    return data;
  }

  /**
   * Sign in with email and password
   */
  static async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Sign in with Google
   */
  static async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'allinherestudio://auth/callback',
      },
    });

    if (error) throw error;
    return data;
  }

  /**
   * Sign in with Apple
   */
  static async signInWithApple() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: 'allinherestudio://auth/callback',
      },
    });

    if (error) throw error;
    return data;
  }

  /**
   * Sign out
   */
  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  /**
   * Get current session
   */
  static async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  /**
   * Get current user
   */
  static async getCurrentUser(): Promise<SupabaseUser | null> {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  }

  /**
   * Get user profile from database
   */
  static async getUserProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data as User;
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(userId: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as User;
  }

  /**
   * Reset password
   */
  static async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'allinherestudio://auth/reset-password',
    });

    if (error) throw error;
    return data;
  }

  /**
   * Update password
   */
  static async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Listen to auth state changes
   */
  static onAuthStateChange(
    callback: (event: string, session: any) => void
  ) {
    return supabase.auth.onAuthStateChange(callback);
  }

  /**
   * Check if user's trial has expired
   */
  static async checkTrialStatus(userId: string): Promise<boolean> {
    const profile = await this.getUserProfile(userId);
    
    if (!profile) return false;

    if (profile.subscription_status === 'TRIAL' && profile.trial_end_date) {
      const trialEndDate = new Date(profile.trial_end_date);
      const now = new Date();
      return now > trialEndDate;
    }

    return false;
  }

  /**
   * Refresh session
   */
  static async refreshSession() {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return data;
  }
}
