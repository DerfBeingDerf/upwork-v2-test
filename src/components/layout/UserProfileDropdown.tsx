import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Crown, Zap, CreditCard, Calendar, LogOut, Settings, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { getUserSubscription, hasLifetimeAccess } from '../../lib/stripeApi';
import type { StripeSubscription } from '../../lib/stripeApi';

type UserProfileDropdownProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function UserProfileDropdown({ isOpen, onClose }: UserProfileDropdownProps) {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<StripeSubscription | null>(null);
  const [hasLifetime, setHasLifetime] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !isOpen) return;

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
  }, [user, isOpen]);

  const handleSignOut = async () => {
    try {
      onClose(); // Close dropdown first
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      // Still navigate to login even if signOut fails
      navigate('/login');
    }
  };

  const handleProfileClick = () => {
    navigate('/profile');
    onClose();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
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
        return 'Free Trial';
      case 'paused':
        return 'Trial Ended';
      case 'past_due':
        return 'Past Due';
      case 'canceled':
        return 'Canceled';
      case 'unpaid':
        return 'Unpaid';
      case 'not_started':
        return 'Free Plan';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getDaysRemaining = () => {
    if (!subscription?.current_period_end) return null;
    
    const endDate = new Date(subscription.current_period_end * 1000);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  if (!user) return null;

  const daysRemaining = getDaysRemaining();
  const isActive = subscription && ['active', 'trialing'].includes(subscription.subscription_status);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2 }}
          className="modal-apple rounded-2xl shadow-apple-lg min-w-[320px] max-w-[380px]"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center mr-3 border border-white/10">
                <User size={24} className="text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white text-apple-title truncate">
                  {user.email?.split('@')[0]}
                </h3>
                <p className="text-sm text-gray-400 text-apple-body truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Subscription Status */}
          <div className="p-6 border-b border-white/10">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-white/10 rounded w-2/3 mb-2"></div>
                <div className="h-3 bg-white/5 rounded w-1/2"></div>
              </div>
            ) : isAdmin ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center mr-3 border border-blue-500/30">
                    <Shield size={16} className="text-blue-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm text-apple-caption">Admin Access</h4>
                    <p className="text-xs text-blue-400">Full platform access</p>
                  </div>
                </div>
              </div>
            ) : hasLifetime ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center mr-3 border border-purple-500/30">
                    <Crown size={16} className="text-purple-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm text-apple-caption">Pro Lifetime</h4>
                    <p className="text-xs text-purple-400">Lifetime access</p>
                  </div>
                </div>
              </div>
            ) : subscription && subscription.subscription_status !== 'not_started' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center mr-3 border ${
                      isActive 
                        ? 'bg-orange-500/20 border-orange-500/30' 
                        : 'bg-gray-500/20 border-gray-500/30'
                    }`}>
                      <Zap size={16} className={isActive ? 'text-orange-500' : 'text-gray-500'} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm text-apple-caption">Pro Monthly</h4>
                      <p className={`text-xs ${getStatusColor(subscription.subscription_status)}`}>
                        {getStatusText(subscription.subscription_status)}
                      </p>
                    </div>
                  </div>
                </div>

                {subscription.current_period_end && (
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">
                        {subscription.cancel_at_period_end ? 'Ends:' : 
                         subscription.subscription_status === 'trialing' ? 'Trial ends:' : 'Renews:'}
                      </span>
                      <span className="text-white font-medium">
                        {formatDate(subscription.current_period_end)}
                      </span>
                    </div>
                    {daysRemaining !== null && (
                      <div className="flex justify-between items-center text-xs mt-1">
                        <span className="text-gray-400">Days left:</span>
                        <span className={`font-medium ${
                          daysRemaining <= 3 ? 'text-orange-400' : 
                          daysRemaining <= 7 ? 'text-yellow-400' : 'text-green-400'
                        }`}>
                          {daysRemaining}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {subscription.subscription_status === 'paused' && (
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                    <p className="text-xs text-orange-400">
                      Trial ended. Reactivate to continue using embeddable players.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-lg bg-gray-500/20 flex items-center justify-center mr-3 border border-gray-500/30">
                  <CreditCard size={16} className="text-gray-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm text-apple-caption">Free Plan</h4>
                  <p className="text-xs text-gray-400">Basic features only</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-4">
            <div className="space-y-2">
              <button
                onClick={handleProfileClick}
                className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors flex items-center border border-white/10"
              >
                <Settings size={16} className="text-gray-400 mr-3" />
                <span className="text-white font-medium text-sm">Profile Settings</span>
              </button>
              
              <button
                onClick={handleSignOut}
                className="w-full text-left p-3 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors flex items-center border border-red-500/20"
              >
                <LogOut size={16} className="text-red-400 mr-3" />
                <span className="text-red-400 font-medium text-sm">Sign Out</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}