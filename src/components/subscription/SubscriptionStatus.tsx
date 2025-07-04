import React, { useState, useEffect } from 'react';
import { Crown, Zap, Calendar, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import { getUserSubscription, getUserOrders, hasLifetimeAccess } from '../../lib/stripeApi';
import type { StripeSubscription } from '../../lib/stripeApi';

export default function SubscriptionStatus() {
  const [subscription, setSubscription] = useState<StripeSubscription | null>(null);
  const [hasLifetime, setHasLifetime] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        const [subscriptionData, lifetimeAccess] = await Promise.all([
          getUserSubscription(),
          hasLifetimeAccess()
        ]);
        
        setSubscription(subscriptionData);
        setHasLifetime(lifetimeAccess);
      } catch (error) {
        console.error('Error fetching subscription data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionData();
  }, []);

  if (isLoading) {
    return (
      <div className="card-apple-subtle p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-white/10 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-white/5 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-500';
      case 'trialing':
        return 'text-blue-500';
      case 'paused':
        return 'text-orange-500';
      case 'past_due':
        return 'text-yellow-500';
      case 'canceled':
      case 'unpaid':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'trialing':
        return 'Trial';
      case 'paused':
        return 'Trial Ended';
      case 'past_due':
        return 'Past Due';
      case 'canceled':
        return 'Canceled';
      case 'unpaid':
        return 'Unpaid';
      case 'not_started':
        return 'Not Started';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  if (hasLifetime) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-apple-subtle p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center mr-3 border border-purple-500/30">
              <Crown size={20} className="text-purple-500" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-apple-title">Pro Lifetime</h3>
              <p className="text-sm text-gray-400 text-apple-body">Lifetime access to all features</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-purple-400">Lifetime</div>
            <div className="text-xs text-gray-500">No expiration</div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!subscription || subscription.subscription_status === 'not_started') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-apple-subtle p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-xl bg-gray-500/20 flex items-center justify-center mr-3 border border-gray-500/30">
              <CreditCard size={20} className="text-gray-500" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-apple-title">Free Plan</h3>
              <p className="text-sm text-gray-400 text-apple-body">Basic features only</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-400">Free</div>
            <div className="text-xs text-gray-500">No embed access</div>
          </div>
        </div>
      </motion.div>
    );
  }

  const isActive = ['active', 'trialing'].includes(subscription.subscription_status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-apple-subtle p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center mr-3 border ${
            isActive 
              ? 'bg-orange-500/20 border-orange-500/30' 
              : 'bg-gray-500/20 border-gray-500/30'
          }`}>
            <Zap size={20} className={isActive ? 'text-orange-500' : 'text-gray-500'} />
          </div>
          <div>
            <h3 className="font-semibold text-white text-apple-title">Pro Monthly</h3>
            <p className="text-sm text-gray-400 text-apple-body">
              Status: <span className={getStatusColor(subscription.subscription_status)}>
                {getStatusText(subscription.subscription_status)}
              </span>
            </p>
            {subscription.subscription_status === 'paused' && (
              <p className="text-xs text-orange-400 mt-1">
                Trial ended - Reactivate to continue
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-sm font-medium ${
            isActive ? 'text-orange-400' : 
            subscription.subscription_status === 'paused' ? 'text-orange-400' : 
            'text-gray-400'
          }`}>
            {isActive ? 'Active' : 
             subscription.subscription_status === 'paused' ? 'Trial Ended' : 
             'Inactive'}
          </div>
          {subscription.current_period_end && (
            <div className="text-xs text-gray-500">
              {subscription.cancel_at_period_end ? 'Ends' : 'Renews'}: {formatDate(subscription.current_period_end)}
            </div>
          )}
        </div>
      </div>

      {subscription.payment_method_brand && subscription.payment_method_last4 && (
        <div className="flex items-center text-sm text-gray-400 pt-3 border-t border-white/10">
          <CreditCard size={14} className="mr-2" />
          <span className="capitalize">{subscription.payment_method_brand}</span>
          <span className="mx-1">••••</span>
          <span>{subscription.payment_method_last4}</span>
        </div>
      )}

      {subscription.cancel_at_period_end && (
        <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
          <p className="text-sm text-yellow-400">
            <Calendar size={14} className="inline mr-1" />
            Your subscription will end on {subscription.current_period_end && formatDate(subscription.current_period_end)}
          </p>
        </div>
      )}

      {subscription.subscription_status === 'paused' && (
        <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
          <p className="text-sm text-orange-400 mb-2">
            <Calendar size={14} className="inline mr-1" />
            Your trial has ended. Reactivate to continue using embeddable players.
          </p>
          <a 
            href="/pricing" 
            className="text-xs text-orange-300 hover:text-orange-200 underline"
          >
            Reactivate subscription →
          </a>
        </div>
      )}
    </motion.div>
  );
}