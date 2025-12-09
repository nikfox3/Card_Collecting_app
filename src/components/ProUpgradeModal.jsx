import React, { useState } from 'react';
import { API_URL } from '../utils/api';
import { useUser } from '../context/UserContext';

const ProUpgradeModal = ({ isOpen, onClose, feature, limit, current }) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      
      // Create Stripe checkout session
      const response = await fetch(`${API_URL}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      
      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        alert('Failed to start checkout. Please try again.');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[10004] p-4">
      <div className="bg-gray-800/95 backdrop-blur-xl border border-gray-600/50 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-xl font-semibold">Upgrade to Pro</h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-4 border border-blue-500/30">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <h4 className="text-white text-lg font-semibold">Pro Membership</h4>
              </div>
              <p className="text-gray-300 text-sm">
                {feature === 'deck' && `You've reached the limit of ${limit} deck${limit > 1 ? 's' : ''}. Upgrade to Pro for unlimited decks!`}
                {feature === 'binder' && `You've reached the limit of ${limit} binder${limit > 1 ? 's' : ''}. Upgrade to Pro for unlimited binders!`}
                {feature === 'page' && `You've reached the limit of ${limit} pages per binder. Upgrade to Pro for unlimited pages!`}
                {feature === 'scanner' && `You've used all ${limit} free scans. Upgrade to Pro for unlimited card scanning!`}
              </p>
            </div>

            <div className="space-y-3">
              <h5 className="text-white font-semibold">Pro Features:</h5>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-gray-300 text-sm">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Unlimited decks</span>
                </li>
                <li className="flex items-center gap-2 text-gray-300 text-sm">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Unlimited binders</span>
                </li>
                <li className="flex items-center gap-2 text-gray-300 text-sm">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Unlimited pages per binder</span>
                </li>
                <li className="flex items-center gap-2 text-gray-300 text-sm">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Unlimited card scans</span>
                </li>
                <li className="flex items-center gap-2 text-gray-300 text-sm">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>All premium features</span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-white text-3xl font-bold">$9.99</span>
                <span className="text-gray-400 text-sm">/month</span>
              </div>
              <p className="text-gray-400 text-xs">Cancel anytime</p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-lg font-medium transition-colors border border-white/10"
              >
                Maybe Later
              </button>
              <button 
                onClick={handleUpgrade}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Upgrade to Pro'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProUpgradeModal;

