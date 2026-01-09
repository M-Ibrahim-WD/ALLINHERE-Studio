import { SubscriptionPlan } from '../types';
import { supabase } from '../config/supabase';

// Payment Provider Interface
export interface PaymentProvider {
  createSubscription(
    userId: string,
    plan: SubscriptionPlan
  ): Promise<{ clientSecret: string; subscriptionId: string }>;
  cancelSubscription(subscriptionId: string): Promise<void>;
}

// Stripe Payment Provider
export class StripePaymentProvider implements PaymentProvider {
  private publishableKey: string;

  constructor() {
    this.publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || '';
  }

  async createSubscription(
    userId: string,
    plan: SubscriptionPlan
  ): Promise<{ clientSecret: string; subscriptionId: string }> {
    // Call Supabase Edge Function to create subscription
    const { data, error } = await supabase.functions.invoke('create-subscription', {
      body: {
        userId,
        plan,
        provider: 'stripe',
      },
    });

    if (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }

    return {
      clientSecret: data.clientSecret,
      subscriptionId: data.subscriptionId,
    };
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    const { error } = await supabase.functions.invoke('cancel-subscription', {
      body: {
        subscriptionId,
        provider: 'stripe',
      },
    });

    if (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  getPublishableKey(): string {
    return this.publishableKey;
  }
}

// PayPal Payment Provider
export class PayPalPaymentProvider implements PaymentProvider {
  private clientId: string;
  private mode: 'sandbox' | 'production';

  constructor() {
    this.clientId = process.env.PAYPAL_CLIENT_ID || '';
    this.mode = (process.env.PAYPAL_MODE as 'sandbox' | 'production') || 'sandbox';
  }

  async createSubscription(
    userId: string,
    plan: SubscriptionPlan
  ): Promise<{ clientSecret: string; subscriptionId: string }> {
    console.log('Creating PayPal subscription', { userId, plan });
    // Mock response for PayPal as it's not fully implemented
    return {
      clientSecret: 'mock_paypal_secret',
      subscriptionId: 'mock_paypal_sub_id',
    };
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    console.log('Canceling PayPal subscription', subscriptionId);
    throw new Error('PayPal implementation pending');
  }

  getClientId(): string {
    return this.clientId;
  }

  getMode(): 'sandbox' | 'production' {
    return this.mode;
  }
}

// Payment Service Factory
export class PaymentService {
  private static stripeProvider: StripePaymentProvider;
  private static paypalProvider: PayPalPaymentProvider;

  static getProvider(type: 'stripe' | 'paypal'): PaymentProvider {
    if (type === 'stripe') {
      if (!this.stripeProvider) {
        this.stripeProvider = new StripePaymentProvider();
      }
      return this.stripeProvider;
    } else {
      if (!this.paypalProvider) {
        this.paypalProvider = new PayPalPaymentProvider();
      }
      return this.paypalProvider;
    }
  }

  static async createSubscription(
    provider: 'stripe' | 'paypal',
    userId: string,
    plan: SubscriptionPlan
  ): Promise<any> {
    const paymentProvider = this.getProvider(provider);
    return await paymentProvider.createSubscription(userId, plan);
  }

  static async cancelSubscription(
    provider: 'stripe' | 'paypal',
    subscriptionId: string
  ): Promise<void> {
    const paymentProvider = this.getProvider(provider);
    return await paymentProvider.cancelSubscription(subscriptionId);
  }

  // Plan pricing (should be moved to environment or database in production)
  static getPlanPricing(plan: SubscriptionPlan): { monthly: number; yearly: number } {
    const pricing = {
      BASIC: { monthly: 9.99, yearly: 99.99 },
      PRO: { monthly: 24.99, yearly: 249.99 },
    };
    return pricing[plan];
  }
}
