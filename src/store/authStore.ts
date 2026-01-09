import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, Tables } from '../config/supabase';
import { User, SubscriptionStatus, SubscriptionPlan } from '../types';

interface AuthState {
  user: User | null;
  session: any | null;
  loading: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const USER_SESSION_KEY = '@allinhere_user_session';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,

  initialize: async () => {
    try {
      set({ loading: true });

      // Get session from Supabase
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        set({ loading: false });
        return;
      }

      if (session) {
        // Fetch user profile
        const { data: user, error: userError } = await supabase
          .from(Tables.USERS)
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (userError) {
          console.error('Error fetching user profile:', userError);
        } else if (user) {
          set({ user: user as User, session });
        }
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const { data: user } = await supabase
            .from(Tables.USERS)
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (user) {
            set({ user: user as User, session });
          }
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, session: null });
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      set({ loading: false });
    }
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        const { data: user } = await supabase
          .from(Tables.USERS)
          .select('*')
          .eq('id', data.session.user.id)
          .single();

        if (user) {
          set({ user: user as User, session: data.session });
          await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
        }
      }
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email: string, password: string, fullName?: string) => {
    set({ loading: true });
    try {
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

      // User profile will be created by the database trigger
      // No additional action needed here
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    try {
      await AsyncStorage.removeItem(USER_SESSION_KEY);
      await supabase.auth.signOut();
      set({ user: null, session: null });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  },

  updateUser: async (updates: Partial<User>) => {
    const { user } = get();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from(Tables.USERS)
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      set({ user: data as User });
      await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  refreshUser: async () => {
    const { session } = get();
    if (!session) return;

    try {
      const { data: user, error } = await supabase
        .from(Tables.USERS)
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;

      set({ user: user as User });
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  },
}));
