import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Sparkles, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getUserSubscription, getUserOrders } from '../lib/stripeApi';
import { getProductByPriceId } from '../stripe-config';

export default function SuccessPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [purchaseInfo, setPurchaseInfo] = useState<{
    productName: string;
    isLifetime: boolean;
  } | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchPurchaseInfo = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        
        if (!sessionId) {
          // Fallback: check recent subscription or order
          const [subscription, orders] = await Promise.all([
            getUserSubscription(),
            getUserOrders()
          ]);

          if (subscription && subscription.price_id) {
            const product = getProductByPriceId(subscription.price_id);
            if (product) {
              setPurchaseInfo({
                productName: product.name,
                isLifetime: false
              });
            }
          } else if (orders.length > 0) {
            // Check for recent completed order (within last hour)
            const recentOrder = orders.find(order => {
              const orderDate = new Date(order.order_date);
              const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
              return orderDate > oneHourAgo && order.order_status === 'completed';
            });

            if (recentOrder) {
              setPurchaseInfo({
                productName: 'Pro Lifetime',
                isLifetime: true
              });
            }
          }
        } else {
          // If we have a session ID, we can assume it's a recent purchase
          // Check both subscription and orders to determine the type
          const [subscription, orders] = await Promise.all([
            getUserSubscription(),
            getUserOrders()
          ]);

          // Check for recent order first (lifetime purchase)
          const recentOrder = orders.find(order => {
            const orderDate = new Date(order.order_date);
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            return orderDate > oneHourAgo;
          });

          if (recentOrder) {
            setPurchaseInfo({
              productName: 'Pro Lifetime',
              isLifetime: true
            });
          } else if (subscription && subscription.price_id) {
            const product = getProductByPriceId(subscription.price_id);
            if (product) {
              setPurchaseInfo({
                productName: product.name,
                isLifetime: false
              });
            }
          }
        }
      } catch (error) {
        console.error('Error fetching purchase info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPurchaseInfo();
  }, [user, navigate, searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="spinner-apple" style={{ width: '48px', height: '48px', borderWidth: '4px' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-500/20 mb-8 border border-green-500/30">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            
            <h1 className="text-apple-headline text-white mb-6">
              Payment Successful!
            </h1>
            
            {purchaseInfo ? (
              <div className="mb-8">
                <div className="card-apple p-8 mb-6">
                  <div className="flex items-center justify-center mb-4">
                    {purchaseInfo.isLifetime ? (
                      <Crown size={32} className="text-purple-500 mr-3" />
                    ) : (
                      <Sparkles size={32} className="text-orange-500 mr-3" />
                    )}
                    <h2 className="text-2xl font-semibold text-white text-apple-title">
                      {purchaseInfo.productName}
                    </h2>
                  </div>
                  
                  <p className="text-gray-400 text-apple-body mb-6">
                    {purchaseInfo.isLifetime 
                      ? 'You now have lifetime access to embeddable audio players! Your collections can be embedded anywhere on the web, forever.'
                      : 'Your subscription is now active! You can embed your audio collections anywhere on the web.'
                    }
                  </p>
                  
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h3 className="font-semibold text-white mb-2 text-apple-caption">What's included:</h3>
                    <ul className="text-sm text-gray-300 space-y-1 text-left">
                      <li>• Unlimited audio collections</li>
                      <li>• Embeddable players for any website</li>
                      <li>• Custom player styling</li>
                      <li>• Advanced analytics</li>
                      <li>• Priority support</li>
                      {purchaseInfo.isLifetime && <li>• No recurring payments ever</li>}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-apple-subheadline text-gray-400 mb-8">
                Thank you for your purchase! You can now access all premium features.
              </p>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/upload')}
                className="btn-apple-primary px-8 py-4 text-lg"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Start Creating
                <ArrowRight className="ml-2 h-5 w-5" />
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/library')}
                className="btn-apple-secondary px-8 py-4 text-lg"
              >
                View Library
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}