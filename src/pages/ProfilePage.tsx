import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, CreditCard, Calendar, Crown, Zap, LogOut, ArrowLeft, ExternalLink, AlertTriangle, Receipt, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getUserSubscription, getUserOrders, hasLifetimeAccess, cancelSubscription, createCustomerPortalSession } from '../lib/stripeApi';
import type { StripeSubscription } from '../lib/stripeApi';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<StripeSubscription | null>(null);
  const [hasLifetime, setHasLifetime] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchUserData = async () => {
      try {
        const [subscriptionData, lifetimeAccess, ordersData] = await Promise.all([
          getUserSubscription(),
          hasLifetimeAccess(),
          getUserOrders()
        ]);
        
        setSubscription(subscriptionData);
        setHasLifetime(lifetimeAccess);
        setOrders(ordersData);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleCancelSubscription = async () => {
    if (!subscription?.subscription_id) return;

    try {
      setIsCanceling(true);
      await cancelSubscription();
      
      // Refresh subscription data
      const updatedSubscription = await getUserSubscription();
      setSubscription(updatedSubscription);
      
      setShowCancelModal(false);
    } catch (error) {
      console.error('Error canceling subscription:', error);
      // You could show an error toast here
    } finally {
      setIsCanceling(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      setIsLoadingPortal(true);
      const { url } = await createCustomerPortalSession();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating customer portal session:', error);
      // You could show an error toast here
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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
        return 'Not Started';
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="spinner-apple" style={{ width: '48px', height: '48px', borderWidth: '4px' }} />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const daysRemaining = getDaysRemaining();
  const isActive = subscription && ['active', 'trialing'].includes(subscription.subscription_status);
  const canCancel = subscription && subscription.subscription_id && !subscription.cancel_at_period_end && subscription.subscription_status !== 'paused';

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back
          </button>
          
          <div className="flex items-center">
            <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center mr-4 border border-white/10">
              <User size={32} className="text-blue-500" />
            </div>
            <div>
              <h1 className="text-apple-headline text-white">Profile</h1>
              <p className="text-gray-400 text-apple-body">Manage your account and subscription</p>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Account Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="card-apple p-8">
              <h2 className="text-2xl font-semibold text-white mb-6 text-apple-title">Account Information</h2>
              
              <div className="space-y-6">
                <div className="flex items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                  <Mail size={20} className="text-blue-500 mr-4 flex-shrink-0" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                    <p className="text-white font-medium">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                  <Calendar size={20} className="text-green-500 mr-4 flex-shrink-0" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Member Since</label>
                    <p className="text-white font-medium">
                      {new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Subscription Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Current Plan */}
            <div className="card-apple p-6">
              <h3 className="text-xl font-semibold text-white mb-4 text-apple-title">Current Plan</h3>
              
              {hasLifetime ? (
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center mr-3 border border-purple-500/30">
                      <Crown size={20} className="text-purple-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-apple-title">Pro Lifetime</h4>
                      <p className="text-sm text-purple-400">Lifetime access</p>
                    </div>
                  </div>
                </div>
              ) : subscription && subscription.subscription_status !== 'not_started' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center mr-3 border ${
                        isActive 
                          ? 'bg-orange-500/20 border-orange-500/30' 
                          : 'bg-gray-500/20 border-gray-500/30'
                      }`}>
                        <Zap size={20} className={isActive ? 'text-orange-500' : 'text-gray-500'} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-apple-title">Pro Monthly</h4>
                        <p className={`text-sm ${getStatusColor(subscription.subscription_status)}`}>
                          {getStatusText(subscription.subscription_status)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {subscription.current_period_end && (
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">
                          {subscription.cancel_at_period_end ? 'Ends on:' : 
                           subscription.subscription_status === 'trialing' ? 'Trial ends:' : 'Renews on:'}
                        </span>
                        <span className="text-white font-medium">
                          {formatDate(subscription.current_period_end)}
                        </span>
                      </div>
                      {daysRemaining !== null && (
                        <div className="flex justify-between items-center text-sm mt-1">
                          <span className="text-gray-400">Days remaining:</span>
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
                    <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                      <p className="text-sm text-orange-400 mb-2">
                        Your trial has ended. Reactivate to continue using embeddable players.
                      </p>
                      <button
                        onClick={() => navigate('/pricing')}
                        className="text-xs text-orange-300 hover:text-orange-200 underline"
                      >
                        Reactivate subscription →
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-xl bg-gray-500/20 flex items-center justify-center mr-3 border border-gray-500/30">
                      <CreditCard size={20} className="text-gray-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-apple-title">Free Plan</h4>
                      <p className="text-sm text-gray-400">Basic features only</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Upgrade Button */}
              {!hasLifetime && (!subscription || subscription.subscription_status === 'not_started' || subscription.subscription_status === 'paused') && (
                <button
                  onClick={() => navigate('/pricing')}
                  className="btn-apple-primary w-full mt-4"
                >
                  <ExternalLink size={16} className="mr-2" />
                  Upgrade Plan
                </button>
              )}

              {/* Subscription Management */}
              {subscription && subscription.subscription_id && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <h4 className="text-lg font-semibold text-white mb-4 text-apple-title">Subscription Management</h4>
                  <div className="space-y-3">
                    {canCancel && (
                      <button
                        onClick={() => setShowCancelModal(true)}
                        className="w-full text-left p-3 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors border border-red-500/20"
                      >
                        <div className="flex items-center">
                          <AlertTriangle size={16} className="text-red-400 mr-3" />
                          <span className="text-red-400 font-medium">Cancel Subscription</span>
                        </div>
                      </button>
                    )}
                    
                    {subscription.cancel_at_period_end && (
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                        <p className="text-sm text-yellow-400">
                          <AlertTriangle size={14} className="inline mr-1" />
                          Your subscription will end on {subscription.current_period_end && formatDate(subscription.current_period_end)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method */}
            {subscription?.payment_method_brand && subscription?.payment_method_last4 && (
              <div className="card-apple p-6">
                <h3 className="text-xl font-semibold text-white mb-4 text-apple-title">Payment Method</h3>
                <div className="flex items-center p-3 bg-white/5 rounded-xl border border-white/10">
                  <CreditCard size={20} className="text-blue-500 mr-3" />
                  <div>
                    <p className="text-white font-medium capitalize">
                      {subscription.payment_method_brand} ••••{subscription.payment_method_last4}
                    </p>
                    <p className="text-sm text-gray-400">Primary payment method</p>
                  </div>
                </div>
              </div>
            )}

            {/* Billing History */}
            <div className="card-apple p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white text-apple-title">Billing & History</h3>
                {subscription?.subscription_id && (
                  <button
                    onClick={handleManageBilling}
                    disabled={isLoadingPortal}
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
                  >
                    {isLoadingPortal ? 'Loading...' : 'Manage Billing'}
                  </button>
                )}
              </div>
              
              {orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.order_id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex items-center">
                        <Receipt size={16} className="text-green-500 mr-3" />
                        <div>
                          <p className="text-white font-medium text-sm">
                            ${(order.amount_total / 100).toFixed(2)} {order.currency.toUpperCase()}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(order.order_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          order.order_status === 'completed' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {order.order_status}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {orders.length > 5 && (
                    <button
                      onClick={handleManageBilling}
                      disabled={isLoadingPortal}
                      className="w-full text-center p-3 text-blue-400 hover:text-blue-300 transition-colors text-sm disabled:opacity-50"
                    >
                      View all billing history
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Receipt size={32} className="text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No billing history yet</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="card-apple p-6">
              <h3 className="text-xl font-semibold text-white mb-4 text-apple-title">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/pricing')}
                  className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/10"
                >
                  <div className="flex items-center">
                    <CreditCard size={16} className="text-blue-500 mr-3" />
                    <span className="text-white font-medium">View Pricing</span>
                  </div>
                </button>
                
                <button
                  onClick={handleSignOut}
                  className="w-full text-left p-3 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors border border-red-500/20"
                >
                  <div className="flex items-center">
                    <LogOut size={16} className="text-red-400 mr-3" />
                    <span className="text-red-400 font-medium">Sign Out</span>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCancelModal(false)}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative modal-apple modal-responsive"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500/20 mr-3">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white text-apple-title">Cancel Subscription</h3>
              </div>
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={isCanceling}
                className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            {/* Content */}
            <div className="p-6">
              <div className="mb-6">
                <p className="text-gray-300 mb-4 text-apple-body">
                  Are you sure you want to cancel your subscription? You'll lose access to embeddable players at the end of your current billing period.
                </p>
                
                {subscription?.current_period_end && (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                    <p className="text-yellow-200 text-sm text-apple-body">
                      <strong>Your subscription will remain active until:</strong><br />
                      {formatDate(subscription.current_period_end)}
                    </p>
                  </div>
                )}
              </div>
            </div>
              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  disabled={isCanceling}
                  className="btn-apple-secondary btn-responsive disabled:opacity-50"
                >
                  Keep Subscription
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={isCanceling}
                  className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-full font-medium transition-colors disabled:opacity-50 btn-responsive"
                >
                  {isCanceling ? (
                    <span className="flex items-center justify-center">
                      <div className="spinner-apple mr-2" />
                      Canceling...
                    </span>
                  ) : (
                    'Cancel Subscription'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}