import React, { useState, useEffect } from 'react';

interface BudgetData {
  budgetType: 'daily' | 'lifetime';
  amount: number;
  duration: number; // days
  bidStrategy: 'automatic' | 'manual';
  maxBid?: number;
}

interface ROIMetrics {
  estimatedReach: number;
  estimatedImpressions: number;
  estimatedClicks: number;
  costPerClick: number;
  costPerImpression: number;
}

interface ReturnOnInvestmentProps {
  initialData?: any;
  campaignData: any;
  onSave: (data: BudgetData) => void;
  onBack: () => void;
  onNext: () => void;
}

const ReturnOnInvestment: React.FC<ReturnOnInvestmentProps> = ({ 
  initialData, 
  campaignData, 
  onSave, 
  onBack, 
  onNext 
}) => {
  const [budgetData, setBudgetData] = useState<BudgetData>(
    initialData || {
      budgetType: 'daily',
      amount: 50,
      duration: 7,
      bidStrategy: 'automatic',
    }
  );

  const [roiMetrics, setROIMetrics] = useState<ROIMetrics>({
    estimatedReach: 0,
    estimatedImpressions: 0,
    estimatedClicks: 0,
    costPerClick: 0,
    costPerImpression: 0,
  });

  // Update parent state when data changes
  useEffect(() => {
    onSave(budgetData);
  }, [budgetData, onSave]);

  // Calculate ROI metrics based on budget
  useEffect(() => {
    const calculateMetrics = () => {
      const totalBudget = budgetData.budgetType === 'daily' 
        ? budgetData.amount * budgetData.duration 
        : budgetData.amount;

      // Base calculations (these would normally come from your ad platform's API)
      const baseReach = totalBudget * 50; // 50 people per dollar
      const baseImpressions = totalBudget * 100; // 100 impressions per dollar
      const baseClicks = totalBudget * 5; // 5 clicks per dollar
      
      const cpc = totalBudget / baseClicks;
      const cpm = (totalBudget / baseImpressions) * 1000;

      setROIMetrics({
        estimatedReach: Math.floor(baseReach),
        estimatedImpressions: Math.floor(baseImpressions),
        estimatedClicks: Math.floor(baseClicks),
        costPerClick: Number(cpc.toFixed(2)),
        costPerImpression: Number(cpm.toFixed(2)),
      });
    };

    calculateMetrics();
  }, [budgetData]);

  const handleBudgetChange = (field: keyof BudgetData, value: any) => {
    setBudgetData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getTotalBudget = () => {
    return budgetData.budgetType === 'daily' 
      ? budgetData.amount * budgetData.duration 
      : budgetData.amount;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl text-white font-bold mb-6">Return on Investment</h1>

      {/* Budget Type */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">Budget Type</label>
        <div className="flex gap-3">
          <button
            onClick={() => handleBudgetChange('budgetType', 'daily')}
            className={`px-4 py-2 rounded-md border flex-1 ${
              budgetData.budgetType === 'daily'
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800'
            }`}
          >
            Daily Budget
          </button>
          <button
            onClick={() => handleBudgetChange('budgetType', 'lifetime')}
            className={`px-4 py-2 rounded-md border flex-1 ${
              budgetData.budgetType === 'lifetime'
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800'
            }`}
          >
            Lifetime Budget
          </button>
        </div>
      </div>

      {/* Budget Amount */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">
          {budgetData.budgetType === 'daily' ? 'Daily Budget' : 'Total Budget'}
        </label>
        <div className="bg-gray-900 p-4 rounded-md border border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-white text-lg">$</span>
            <input
              type="number"
              min="1"
              max="10000"
              value={budgetData.amount}
              onChange={(e) => handleBudgetChange('amount', parseInt(e.target.value) || 0)}
              className="flex-1 p-2 bg-gray-800 border border-gray-600 rounded text-white text-lg"
            />
          </div>
          <div className="mt-2 text-sm text-gray-400">
            Minimum: $1, Maximum: $10,000
          </div>
        </div>
      </div>

      {/* Campaign Duration (only for daily budget) */}
      {budgetData.budgetType === 'daily' && (
        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">Campaign Duration</label>
          <div className="bg-gray-900 p-4 rounded-md border border-gray-700">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="90"
                value={budgetData.duration}
                onChange={(e) => handleBudgetChange('duration', parseInt(e.target.value) || 1)}
                className="w-20 p-2 bg-gray-800 border border-gray-600 rounded text-white"
              />
              <span className="text-white">days</span>
            </div>
            <div className="mt-2 text-sm text-gray-400">
              Total budget: {formatCurrency(getTotalBudget())}
            </div>
          </div>
        </div>
      )}

      {/* Bid Strategy */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">Bid Strategy</label>
        <div className="space-y-3">
          <div
            onClick={() => handleBudgetChange('bidStrategy', 'automatic')}
            className={`p-4 rounded-md border cursor-pointer ${
              budgetData.bidStrategy === 'automatic'
                ? 'bg-blue-600 border-blue-600'
                : 'bg-gray-900 border-gray-700 hover:bg-gray-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                type="radio"
                checked={budgetData.bidStrategy === 'automatic'}
                onChange={() => handleBudgetChange('bidStrategy', 'automatic')}
                className="text-blue-600"
              />
              <div>
                <h3 className="text-white font-semibold">Automatic Bidding</h3>
                <p className="text-sm text-gray-400">
                  Let us optimize bids to get the best results within your budget
                </p>
              </div>
            </div>
          </div>

          <div
            onClick={() => handleBudgetChange('bidStrategy', 'manual')}
            className={`p-4 rounded-md border cursor-pointer ${
              budgetData.bidStrategy === 'manual'
                ? 'bg-blue-600 border-blue-600'
                : 'bg-gray-900 border-gray-700 hover:bg-gray-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                type="radio"
                checked={budgetData.bidStrategy === 'manual'}
                onChange={() => handleBudgetChange('bidStrategy', 'manual')}
                className="text-blue-600"
              />
              <div>
                <h3 className="text-white font-semibold">Manual Bidding</h3>
                <p className="text-sm text-gray-400">
                  Set your own maximum bid amount
                </p>
              </div>
            </div>
          </div>
        </div>

        {budgetData.bidStrategy === 'manual' && (
          <div className="mt-4 bg-gray-900 p-4 rounded-md border border-gray-700">
            <label className="block text-sm text-gray-400 mb-2">Maximum Bid per Click</label>
            <div className="flex items-center gap-2">
              <span className="text-white">$</span>
              <input
                type="number"
                min="0.01"
                max="100"
                step="0.01"
                value={budgetData.maxBid || ''}
                onChange={(e) => handleBudgetChange('maxBid', parseFloat(e.target.value) || 0)}
                className="flex-1 p-2 bg-gray-800 border border-gray-600 rounded text-white"
                placeholder="0.00"
              />
            </div>
          </div>
        )}
      </div>

      {/* ROI Predictions */}
      <div className="mb-6">
        <h3 className="text-white font-semibold mb-4">Estimated Performance</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900 p-4 rounded-md border border-gray-700">
            <div className="text-2xl text-blue-400 font-bold">
              {roiMetrics.estimatedReach.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">People Reached</div>
          </div>
          
          <div className="bg-gray-900 p-4 rounded-md border border-gray-700">
            <div className="text-2xl text-green-400 font-bold">
              {roiMetrics.estimatedImpressions.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">Impressions</div>
          </div>
          
          <div className="bg-gray-900 p-4 rounded-md border border-gray-700">
            <div className="text-2xl text-purple-400 font-bold">
              {roiMetrics.estimatedClicks.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">Clicks</div>
          </div>
          
          <div className="bg-gray-900 p-4 rounded-md border border-gray-700">
            <div className="text-2xl text-yellow-400 font-bold">
              {formatCurrency(roiMetrics.costPerClick)}
            </div>
            <div className="text-sm text-gray-400">Cost per Click</div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-6">
        <div className="bg-gray-900 p-4 rounded-md border border-gray-700">
          <h3 className="text-white font-semibold mb-3">Campaign Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Budget Type:</span>
              <span className="text-white capitalize">{budgetData.budgetType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Budget:</span>
              <span className="text-white">{formatCurrency(getTotalBudget())}</span>
            </div>
            {budgetData.budgetType === 'daily' && (
              <div className="flex justify-between">
                <span className="text-gray-400">Duration:</span>
                <span className="text-white">{budgetData.duration} days</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400">Bid Strategy:</span>
              <span className="text-white capitalize">{budgetData.bidStrategy}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Expected ROI:</span>
              <span className="text-green-400">
                {((roiMetrics.estimatedClicks * 2) / getTotalBudget() * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <button 
          onClick={onBack}
          className="text-gray-400 text-sm hover:underline"
        >
          Back
        </button>
        <button 
          onClick={onNext}
          className="bg-white text-black px-6 py-2 rounded-full font-semibold hover:bg-gray-200 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ReturnOnInvestment;