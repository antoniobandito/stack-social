import React, { useState, useEffect } from 'react';
import { collection, getDocs, orderBy, query, startAt, endAt, doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { IoMdContact } from 'react-icons/io';
import { useNavigate } from 'react-router-dom';
import CampaignDetails from '../components/ads/CampaignDetails';
import AutoTargeting from '../components/ads/AutoTargeting';
import ReturnOnInvestment from '../components/ads/ReturnOnInvestment';
import AdCreative from '../components/ads/AdCreative';
import ReviewLaunch from '../components/ads/ReviewLaunch';

interface UserProfileData {
  id: string;
  username?: string;
  profilePicUrl?: string;
}

interface CampaignData {
  objective: string;
  name: string;
  targeting: {
    locations: { country: string }[];
    gender: string;
    ageRange: { min: number; max: number };
    interests: string[];
  };
  budget: {
    budgetType: string;
    amount: number;
    duration: number;
  };
  creative: {
    adText: string;
    callToAction: string;
    mediaFile: File | null;
    mediaPreview: string | null;
    mediaType: 'image' | 'video' | 'audio' | null;
    headline: string;
    websiteUrl: string;
    originalFileName: string;
  };
  status: 'draft' | 'active' | 'paused' | 'completed';
}

const AdsPortal: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState<UserProfileData[]>([]);
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<'campaign' | 'targeting' | 'roi' | 'creative' | 'launch'>('campaign');
  const [campaignData, setCampaignData] = useState<CampaignData>({
    objective: 'sales',
    name: '...name your campaign',
    targeting: {
      locations: [{ country: 'United States' }],
      gender: 'all',
      ageRange: { min: 18, max: 65 },
      interests: []
    },
    budget: {
      budgetType: 'daily',
      amount: 50,
      duration: 7
    },
    creative: {
      adText: '',
      callToAction: 'Contact Us',
      mediaFile: null,
      mediaPreview: null,
      mediaType: null,
      headline: '',
      websiteUrl: '',
      originalFileName: ''
    },
    status: 'draft'
  });

  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // Progress tracking
  const getStepProgress = () => {
    const steps = ['campaign', 'targeting', 'roi', 'creative', 'launch'];
    const currentIndex = steps.indexOf(activeStep);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  const getStepStatus = (step: 'campaign' | 'targeting' | 'roi' | 'creative' | 'launch') => {
    const steps = ['campaign', 'targeting', 'roi', 'creative', 'launch'];
    const currentIndex = steps.indexOf(activeStep);
    const stepIndex = steps.indexOf(step);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  // Fetch current user's profile pic
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUser) return;

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setProfilePicUrl(userData.profilePicUrl || null);
        }
      } catch (error) {
        console.error('Error fetching profile picture:', error);
      }
    };

    fetchUserProfile();
  }, [currentUser]);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setSearchInput(value);

    if (!value) {
      setSuggestions([]);
      return;
    }

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('username'), startAt(value), endAt(value + '\uf8ff'));
      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        username: doc.data().username,
        profilePicUrl: doc.data().profilePicUrl || null,
      }));

      setSuggestions(results);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleProfileClick = (userId: string) => {
    navigate(`/profile/${userId}`);
    setSuggestions([]);
    setSearchInput('');
  };

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Sign out error', error);
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleStepChange = (step: 'campaign' | 'targeting' | 'roi' | 'creative' | 'launch') => {
    setActiveStep(step);
  };

  const handleNext = () => {
    if (activeStep === 'campaign') {
      setActiveStep('targeting');
    } else if (activeStep === 'targeting') {
      setActiveStep('roi');
    } else if (activeStep === 'roi') {
      setActiveStep('creative');
    } else if (activeStep === 'creative') {
      setActiveStep('launch');
    }
  };

  const handleBack = () => {
    if (activeStep === 'targeting') {
      setActiveStep('campaign');
    } else if (activeStep === 'roi') {
      setActiveStep('targeting');
    } else if (activeStep === 'creative') {
      setActiveStep('roi');
    } else if (activeStep === 'launch') {
      setActiveStep('creative');
    }
  };

  const handleCampaignSave = (data: any) => {
    setCampaignData(prev => ({
      ...prev,
      objective: data.objective,
      name: data.name
    }));
  };

  const handleTargetingSave = (data: any) => {
    setCampaignData(prev => ({
      ...prev,
      targeting: data
    }));
  };

  const handleBudgetSave = (data: any) => {
    setCampaignData(prev => ({
      ...prev,
      budget: data
    }));
  };

  const handleCreativeSave = (data: any) => {
    setCampaignData(prev => ({
      ...prev,
      creative: data
    }));
  };

  const handleLaunchCampaign = async () => {
    try {
      // Here you would save the campaign to Firebase
      console.log('Launching campaign:', campaignData);
      
      // For now, just show success and navigate
      alert('Campaign launched successfully!');
      navigate('/'); // Navigate back to home
    } catch (error) {
      console.error('Error launching campaign:', error);
      alert('Failed to launch campaign. Please try again.');
    }
  };

  return (
    <div className="app-container bg-[#0d0d0d] min-h-screen text-white">
      {/* Sticky Navigation Bar */}
      <nav className="sticky-nav">
        {/* Brand/Logo */}
        <div className="nav-brand">
          <h1 className="brand-title">stack</h1>
        </div>

        {/* Empty space where search bar would be */}
        <div className="nav-search">
          {/* Intentionally empty to maintain same layout */}
        </div>

        {/* Profile Dropdown */}
        {currentUser && (
          <div className="nav-profile">
            <div className="profile-dropdown-container">
              <button onClick={toggleDropdown} className="profile-button">
                {profilePicUrl ? (
                  <img 
                    src={profilePicUrl}
                    alt="Profile"
                    className="profile-avatar"
                  />
                ) : (
                  <IoMdContact className="profile-icon" />
                )}
              </button>

              {isDropdownOpen && (
                <div className="profile-dropdown">
                  <button 
                    onClick={() => {
                      navigate(`/profile/${currentUser.uid}`);
                      setIsDropdownOpen(false);
                    }}
                    className="dropdown-item"
                  >
                    profile
                  </button>
                  <button 
                    onClick={handleSignOut}
                    className="dropdown-item signout"
                  >
                    sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Page Layout */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-[#fafafa] p-6 pt-20 min-h-screen">
          <h2 className="text-lg text-black font-bold mb-8">Preferences</h2>
          
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="bg-gray-300 rounded-full h-2 mb-4">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getStepProgress()}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-600">
              Step {['campaign', 'targeting', 'roi', 'creative', 'launch'].indexOf(activeStep) + 1} of 5
            </div>
          </div>

          <nav className="space-y-4">
            <button
              onClick={() => handleStepChange('campaign')}
              className={`block text-left w-full py-2 px-3 rounded transition-colors ${
                activeStep === 'campaign' 
                  ? 'bg-gray-800 text-white font-semibold' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  getStepStatus('campaign') === 'completed' ? 'bg-green-500' :
                  getStepStatus('campaign') === 'current' ? 'bg-blue-500' :
                  'bg-gray-400'
                }`}></div>
                Campaign Details
              </div>
            </button>
            
            <button
              onClick={() => handleStepChange('targeting')}
              className={`block text-left w-full py-2 px-3 rounded transition-colors ${
                activeStep === 'targeting' 
                  ? 'bg-gray-800 text-white font-semibold' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  getStepStatus('targeting') === 'completed' ? 'bg-green-500' :
                  getStepStatus('targeting') === 'current' ? 'bg-blue-500' :
                  'bg-gray-400'
                }`}></div>
                Auto Targeting
              </div>
            </button>
            
            <button
              onClick={() => handleStepChange('roi')}
              className={`block text-left w-full py-2 px-3 rounded transition-colors ${
                activeStep === 'roi' 
                  ? 'bg-gray-800 text-white font-semibold' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  getStepStatus('roi') === 'completed' ? 'bg-green-500' :
                  getStepStatus('roi') === 'current' ? 'bg-blue-500' :
                  'bg-gray-400'
                }`}></div>
                Return on Investment
              </div>
            </button>

            <button
              onClick={() => handleStepChange('creative')}
              className={`block text-left w-full py-2 px-3 rounded transition-colors ${
                activeStep === 'creative' 
                  ? 'bg-gray-800 text-white font-semibold' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  getStepStatus('creative') === 'completed' ? 'bg-green-500' :
                  getStepStatus('creative') === 'current' ? 'bg-blue-500' :
                  'bg-gray-400'
                }`}></div>
                Ad Creative
              </div>
            </button>

            <button
              onClick={() => handleStepChange('launch')}
              className={`block text-left w-full py-2 px-3 rounded transition-colors ${
                activeStep === 'launch' 
                  ? 'bg-gray-800 text-white font-semibold' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  getStepStatus('launch') === 'completed' ? 'bg-green-500' :
                  getStepStatus('launch') === 'current' ? 'bg-blue-500' :
                  'bg-gray-400'
                }`}></div>
                Review & Launch
              </div>
            </button>
          </nav>

          {/* Campaign Summary */}
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Campaign Summary</h3>
            <div className="space-y-1 text-xs text-gray-600">
              <div>Objective: {campaignData.objective}</div>
              <div>Budget: ${campaignData.budget.amount}/{campaignData.budget.budgetType}</div>
              <div>Locations: {campaignData.targeting.locations.length}</div>
              <div>Status: {campaignData.status}</div>
            </div>
          </div>
        </aside>

        {/* Right Panel with Card Look */}
        <main className="flex-1 p-6 pt-20 pb-8 flex justify-center">
          <div className="bg-[#1a1a1a] p-8 rounded-xl border border-gray-700 shadow-md w-full max-w-2xl">
            {activeStep === 'campaign' && (
              <CampaignDetails 
                initialData={campaignData}
                onSave={handleCampaignSave}
                onNext={handleNext}
              />
            )}
            {activeStep === 'targeting' && (
              <AutoTargeting 
                initialData={campaignData.targeting}
                onSave={handleTargetingSave}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {activeStep === 'roi' && (
              <ReturnOnInvestment 
                initialData={campaignData.budget}
                campaignData={campaignData}
                onSave={handleBudgetSave}
                onBack={handleBack}
                onNext={handleNext}
              />
            )}
            {activeStep === 'creative' && (
              <AdCreative
                initialData={campaignData.creative}
                onSave={handleCreativeSave}
                onNext={handleNext}
                onBack={handleBack}
                campaignData={campaignData}
              />
            )}
            {activeStep === 'launch' && (
              <ReviewLaunch
                campaignData={campaignData}
                onBack={handleBack}
                onLaunch={handleLaunchCampaign}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdsPortal;