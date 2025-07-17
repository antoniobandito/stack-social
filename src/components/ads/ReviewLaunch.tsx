import React, { useState } from 'react';
import { IoIosHeart, IoIosHeartEmpty } from 'react-icons/io';
import { IoSyncCircleOutline } from 'react-icons/io5';
import { FaCheckCircle, FaCreditCard } from 'react-icons/fa';

interface ReviewLaunchProps {
  campaignData: any;
  onBack: () => void;
  onLaunch: () => void;
}

const ReviewLaunch: React.FC<ReviewLaunchProps> = ({ 
  campaignData, 
  onBack, 
  onLaunch 
}) => {
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const getTotalBudget = () => {
    return campaignData.budget.budgetType === 'daily' 
      ? campaignData.budget.amount * campaignData.budget.duration 
      : campaignData.budget.amount;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const renderAdPreview = () => {
    const creative = campaignData.creative;
    
    return (
      <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
        {/* Ad Label */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">Ad</span>
            </div>
            <div>
              <div className="text-white font-semibold">Your Business</div>
              <div className="text-gray-400 text-sm">Sponsored</div>
            </div>
          </div>
        </div>

        {/* Ad Content */}
        <div className="space-y-3">
          {/* Headline */}
          {creative.headline && (
            <div className="text-white font-semibold text-lg">
              {creative.headline}
            </div>
          )}

          {/* Ad Text */}
          {creative.adText && (
            <div className="text-gray-300">
              {creative.adText}
            </div>
          )}

          {/* Media Preview */}
          {creative.mediaPreview && (
            <div className="rounded-md overflow-hidden">
              {creative.mediaType === 'image' ? (
                <img 
                  src={creative.mediaPreview} 
                  alt="Ad media" 
                  className="w-full max-h-64 object-cover"
                />
              ) : creative.mediaType === 'video' ? (
                <video 
                  src={creative.mediaPreview} 
                  className="w-full max-h-64"
                  muted
                />
              ) : (
                <div className="bg-gray-700 p-4 rounded">
                  <span className="text-white">{creative.originalFileName}</span>
                </div>
              )}
            </div>
          )}

          {/* Call to Action Button */}
          <div className="pt-3">
            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-semibold">
              {creative.callToAction}
            </button>
          </div>

          {/* Website URL */}
          {creative.websiteUrl && (
            <div className="text-gray-400 text-sm">
              {creative.websiteUrl}
            </div>
          )}
        </div>

        {/* Post Actions */}
        <div className="flex items-center space-x-4 pt-4 border-t border-gray-600 mt-4">
          <button className="flex items-center space-x-1 text-gray-400">
            <IoIosHeartEmpty size={20} />
            <span>0</span>
          </button>
          <button className="flex items-center space-x-1 text-gray-400">
            <IoSyncCircleOutline size={20} />
            <span>0</span>
          </button>
        </div>
      </div>
    );
  };

  const handleLaunch = () => {
    if (!agreedToTerms) {
      alert('Please agree to the terms and conditions');
      return;
    }
    onLaunch();
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl text-white font-bold mb-6">Review & Launch Campaign</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Campaign Review */}
        <div className="space-y-6">
          {/* Campaign Summary */}
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <FaCheckCircle className="text-green-500" />
              Campaign Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Campaign Name:</span>
                <span className="text-white">{campaignData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Objective:</span>
                <span className="text-white capitalize">{campaignData.objective}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Budget Type:</span>
                <span className="text-white capitalize">{campaignData.budget.budgetType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Budget:</span>
                <span className="text-white">{formatCurrency(getTotalBudget())}</span>
              </div>
              {campaignData.budget.budgetType === 'daily' && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Duration:</span>
                  <span className="text-white">{campaignData.budget.duration} days</span>
                </div>
              )}
            </div>
          </div>

          {/* Targeting Summary */}
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
            <h3 className="text-white font-semibold mb-4">Targeting</h3>
            <div className="space-y-3">
              <div>
                <span className="text-gray-400">Locations:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {campaignData.targeting.locations.map((location: any, index: number) => (
                    <span key={index} className="bg-blue-600 text-white px-2 py-1 rounded text-sm">
                      {location.country}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Gender:</span>
                <span className="text-white capitalize">{campaignData.targeting.gender}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Age Range:</span>
                <span className="text-white">
                  {campaignData.targeting.ageRange.min} - {campaignData.targeting.ageRange.max}
                </span>
              </div>
              {campaignData.targeting.interests.length > 0 && (
                <div>
                  <span className="text-gray-400">Interests:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {campaignData.targeting.interests.map((interest: string, index: number) => (
                      <span key={index} className="bg-green-600 text-white px-2 py-1 rounded text-sm">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Section */}
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <FaCreditCard className="text-blue-500" />
              Payment Method
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  id="credit_card"
                  value="credit_card"
                  checked={paymentMethod === 'credit_card'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="text-blue-600"
                />
                <label htmlFor="credit_card" className="text-white">
                  Credit Card
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  id="paypal"
                  value="paypal"
                  checked={paymentMethod === 'paypal'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="text-blue-600"
                />
                <label htmlFor="paypal" className="text-white">
                  PayPal
                </label>
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="terms" className="text-white text-sm">
                I agree to the{' '}
                <a href="#" className="text-blue-400 hover:underline">
                  Terms and Conditions
                </a>{' '}
                and{' '}
                <a href="#" className="text-blue-400 hover:underline">
                  Privacy Policy
                </a>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column - Ad Preview */}
        <div className="space-y-6">
          <h3 className="text-lg text-white font-semibold">Ad Preview</h3>
          {renderAdPreview()}

          {/* Estimated Performance */}
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
            <h3 className="text-white font-semibold mb-4">Estimated Performance</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl text-blue-400 font-bold">
                  {(getTotalBudget() * 50).toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">People Reached</div>
              </div>
              <div className="text-center">
                <div className="text-2xl text-green-400 font-bold">
                  {(getTotalBudget() * 5).toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">Est. Clicks</div>
              </div>
            </div>
          </div>

          {/* Total Cost */}
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Cost:</span>
              <span className="text-2xl text-white font-bold">
                {formatCurrency(getTotalBudget())}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-8">
        <button 
          onClick={onBack}
          className="text-gray-400 text-sm hover:underline"
        >
          Back
        </button>
        <button 
          onClick={handleLaunch}
          className="bg-green-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-green-700 transition-colors"
        >
          Launch Campaign
        </button>
      </div>
    </div>
  );
};

export default ReviewLaunch;