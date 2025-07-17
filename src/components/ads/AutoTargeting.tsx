import React, { useState, useEffect } from 'react';

interface LocationData {
  country: string;
  region?: string;
  city?: string;
}

interface TargetingData {
  locations: LocationData[];
  gender: 'all' | 'male' | 'female';
  ageRange: {
    min: number;
    max: number;
  };
  interests: string[];
}

interface AutoTargetingProps {
  initialData?: TargetingData;
  onSave: (data: TargetingData) => void;
  onNext: () => void;
  onBack: () => void;
}

const AutoTargeting: React.FC<AutoTargetingProps> = ({ initialData, onSave, onNext, onBack }) => {
  const [targetingData, setTargetingData] = useState<TargetingData>(
    initialData || {
      locations: [{ country: 'United States' }],
      gender: 'all',
      ageRange: { min: 18, max: 65 },
      interests: []
    }
  );

  const [locationInput, setLocationInput] = useState('');
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [interestInput, setInterestInput] = useState('');

  // Update parent state when data changes
  useEffect(() => {
    onSave(targetingData);
  }, [targetingData, onSave]);

  const locationSuggestions = [
    'United States',
    'Canada',
    'United Kingdom',
    'Germany',
    'France',
    'Australia',
    'Japan',
    'Brazil',
    'India',
    'Mexico'
  ];

  const interestSuggestions = [
    'Technology', 'Fashion', 'Sports', 'Travel', 'Food', 'Music',
    'Gaming', 'Fitness', 'Beauty', 'Business', 'Art', 'Photography',
    'Cars', 'Books', 'Movies', 'Health', 'Finance', 'Real Estate'
  ];

  const handleLocationAdd = (location: string) => {
    if (location && !targetingData.locations.some(loc => loc.country === location)) {
      setTargetingData(prev => ({
        ...prev,
        locations: [...prev.locations, { country: location }]
      }));
    }
    setLocationInput('');
    setShowLocationSuggestions(false);
  };

  const handleLocationRemove = (index: number) => {
    setTargetingData(prev => ({
      ...prev,
      locations: prev.locations.filter((_, i) => i !== index)
    }));
  };

  const handleInterestAdd = (interest: string) => {
    if (interest && !targetingData.interests.includes(interest)) {
      setTargetingData(prev => ({
        ...prev,
        interests: [...prev.interests, interest]
      }));
    }
    setInterestInput('');
  };

  const handleInterestRemove = (interest: string) => {
    setTargetingData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
  };

  const handleAgeChange = (type: 'min' | 'max', value: number) => {
    setTargetingData(prev => ({
      ...prev,
      ageRange: {
        ...prev.ageRange,
        [type]: value
      }
    }));
  };

  const estimatedReach = () => {
    let base = 1000000;
    
    // Adjust based on locations
    base *= targetingData.locations.length * 0.8;
    
    // Adjust based on gender
    if (targetingData.gender !== 'all') {
      base *= 0.5;
    }
    
    // Adjust based on age range
    const ageSpan = targetingData.ageRange.max - targetingData.ageRange.min;
    base *= (ageSpan / 47); // 47 is the full adult age range
    
    // Adjust based on interests
    if (targetingData.interests.length > 0) {
      base *= Math.max(0.1, 1 - (targetingData.interests.length * 0.1));
    }
    
    return Math.max(10000, Math.floor(base));
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl text-white font-bold mb-6">Auto Targeting</h1>

      {/* Location Targeting */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">Locations</label>
        <div className="bg-gray-900 p-4 rounded-md border border-gray-700">
          <div className="flex flex-wrap gap-2 mb-3">
            {targetingData.locations.map((location, index) => (
              <div
                key={index}
                className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
              >
                {location.country}
                <button
                  onClick={() => handleLocationRemove(index)}
                  className="text-white hover:text-red-300"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          
          <div className="relative">
            <input
              type="text"
              value={locationInput}
              onChange={(e) => {
                setLocationInput(e.target.value);
                setShowLocationSuggestions(true);
              }}
              placeholder="Add location..."
              className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white text-sm"
            />
            
            {showLocationSuggestions && locationInput && (
              <div className="absolute z-10 w-full bg-gray-800 border border-gray-600 rounded-md mt-1 max-h-40 overflow-y-auto">
                {locationSuggestions
                  .filter(loc => loc.toLowerCase().includes(locationInput.toLowerCase()))
                  .map((location) => (
                    <div
                      key={location}
                      onClick={() => handleLocationAdd(location)}
                      className="p-2 hover:bg-gray-700 cursor-pointer text-white text-sm"
                    >
                      {location}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gender Targeting */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">Gender</label>
        <div className="flex gap-3">
          {[
            { value: 'all', label: 'All' },
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setTargetingData(prev => ({ ...prev, gender: option.value as any }))}
              className={`px-4 py-2 rounded-md border ${
                targetingData.gender === option.value
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Age Range */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">Age Range</label>
        <div className="bg-gray-900 p-4 rounded-md border border-gray-700">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-white text-sm">Min:</label>
              <input
                type="number"
                min="13"
                max="65"
                value={targetingData.ageRange.min}
                onChange={(e) => handleAgeChange('min', parseInt(e.target.value))}
                className="w-16 p-1 rounded bg-gray-800 border border-gray-600 text-white text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-white text-sm">Max:</label>
              <input
                type="number"
                min="13"
                max="65"
                value={targetingData.ageRange.max}
                onChange={(e) => handleAgeChange('max', parseInt(e.target.value))}
                className="w-16 p-1 rounded bg-gray-800 border border-gray-600 text-white text-sm"
              />
            </div>
          </div>
          <div className="text-sm text-gray-400 mt-2">
            Targeting ages {targetingData.ageRange.min} - {targetingData.ageRange.max}
          </div>
        </div>
      </div>

      {/* Interests */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">Interests (Optional)</label>
        <div className="bg-gray-900 p-4 rounded-md border border-gray-700">
          <div className="flex flex-wrap gap-2 mb-3">
            {targetingData.interests.map((interest) => (
              <div
                key={interest}
                className="bg-green-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
              >
                {interest}
                <button
                  onClick={() => handleInterestRemove(interest)}
                  className="text-white hover:text-red-300"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {interestSuggestions
              .filter(interest => !targetingData.interests.includes(interest))
              .slice(0, 8)
              .map((interest) => (
                <button
                  key={interest}
                  onClick={() => handleInterestAdd(interest)}
                  className="p-2 text-left bg-gray-800 hover:bg-gray-700 rounded text-white text-sm"
                >
                  {interest}
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Estimated Reach */}
      <div className="mb-6">
        <div className="bg-gray-900 p-4 rounded-md border border-gray-700">
          <h3 className="text-white font-semibold mb-2">Estimated Reach</h3>
          <div className="text-2xl text-blue-400 font-bold">
            {estimatedReach().toLocaleString()} people
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Based on your targeting criteria
          </p>
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

export default AutoTargeting;