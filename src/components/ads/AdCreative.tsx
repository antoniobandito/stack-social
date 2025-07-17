import React, { useState, useRef, useEffect } from 'react';
import { FaImage, FaVideo, FaMusic, FaFile } from 'react-icons/fa';
import { IoMdClose } from 'react-icons/io';
import { IoIosHeart, IoIosHeartEmpty } from 'react-icons/io';
import { IoSyncCircleOutline } from 'react-icons/io5';

interface AdCreativeData {
  adText: string;
  callToAction: string;
  mediaFile: File | null;
  mediaPreview: string | null;
  mediaType: 'image' | 'video' | 'audio' | null;
  headline: string;
  websiteUrl: string;
  originalFileName: string;
}

interface AdCreativeProps {
  initialData?: AdCreativeData;
  onSave: (data: AdCreativeData) => void;
  onNext: () => void;
  onBack: () => void;
  campaignData: any;
}

const AdCreative: React.FC<AdCreativeProps> = ({ 
  initialData, 
  onSave, 
  onNext, 
  onBack, 
  campaignData 
}) => {
  const [adData, setAdData] = useState<AdCreativeData>(
    initialData || {
      adText: '',
      callToAction: 'Contact Us',
      mediaFile: null,
      mediaPreview: null,
      mediaType: null,
      headline: '',
      websiteUrl: '',
      originalFileName: ''
    }
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const callToActionOptions = [
    'Contact Us',
    'Book Now',
    'Download',
    'Get Offer',
    'Donate',
    'Watch Now',
    'Buy Tickets',
    'Learn More',
    'Sign Up',
    'Shop Now'
  ];

  // Update parent state when data changes
  useEffect(() => {
    onSave(adData);
  }, [adData, onSave]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const fileURL = URL.createObjectURL(file);

      let mediaType: 'image' | 'video' | 'audio' = 'image';
      
      if (file.type.startsWith('image/')) {
        mediaType = 'image';
      } else if (file.type.startsWith('video/')) {
        mediaType = 'video';
      } else if (file.type.startsWith('audio/')) {
        mediaType = 'audio';
      }

      setAdData(prev => ({
        ...prev,
        mediaFile: file,
        mediaPreview: fileURL,
        mediaType,
        originalFileName: file.name
      }));
    }
  };

  const handleRemoveMedia = () => {
    if (adData.mediaPreview) {
      URL.revokeObjectURL(adData.mediaPreview);
    }
    setAdData(prev => ({
      ...prev,
      mediaFile: null,
      mediaPreview: null,
      mediaType: null,
      originalFileName: ''
    }));
  };

  const handleInputChange = (field: keyof AdCreativeData, value: string) => {
    setAdData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderMediaPreview = () => {
    if (!adData.mediaPreview) return null;

    switch (adData.mediaType) {
      case 'image':
        return (
          <div className="relative">
            <img 
              src={adData.mediaPreview} 
              alt="Ad media" 
              className="w-full max-h-64 object-cover rounded-md"
            />
            <button
              onClick={handleRemoveMedia}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <IoMdClose size={16} />
            </button>
          </div>
        );
      case 'video':
        return (
          <div className="relative">
            <video
              ref={videoRef}
              src={adData.mediaPreview}
              controls
              className="w-full max-h-64 rounded-md"
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  videoRef.current.volume = 0.1;
                }
              }}
            >
              Your browser does not support the video tag.
            </video>
            <button
              onClick={handleRemoveMedia}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <IoMdClose size={16} />
            </button>
          </div>
        );
      case 'audio':
        return (
          <div className="relative bg-gray-800 p-4 rounded-md">
            <div className="flex items-center mb-2">
              <FaMusic className="mr-2 text-blue-400" />
              <span className="text-white text-sm">{adData.originalFileName}</span>
            </div>
            <audio
              ref={audioRef}
              src={adData.mediaPreview}
              controls
              className="w-full"
              onLoadedMetadata={() => {
                if (audioRef.current) {
                  audioRef.current.volume = 0.5;
                }
              }}
            >
              Your browser does not support the audio tag.
            </audio>
            <button
              onClick={handleRemoveMedia}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <IoMdClose size={16} />
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  const handleNext = () => {
    if (!adData.adText.trim()) {
      alert('Please enter ad text');
      return;
    }
    if (!adData.headline.trim()) {
      alert('Please enter a headline');
      return;
    }
    if (!adData.websiteUrl.trim()) {
      alert('Please enter a website URL');
      return;
    }
    if (!adData.mediaFile) {
      alert('Please select media for your ad');
      return;
    }
    onNext();
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl text-white font-bold mb-6">Ad Creative</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Ad Creation Form */}
        <div className="space-y-6">
          {/* Ad Text */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Ad Text</label>
            <textarea
              value={adData.adText}
              onChange={(e) => handleInputChange('adText', e.target.value)}
              placeholder="Write your ad text here..."
              maxLength={500}
              className="w-full p-3 rounded-md bg-gray-900 border border-gray-700 text-white placeholder-gray-500 h-24 resize-none"
            />
            <div className="text-sm text-gray-500 mt-1 text-right">
              {500 - adData.adText.length} characters left
            </div>
          </div>

          {/* Headline */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Headline</label>
            <input
              type="text"
              value={adData.headline}
              onChange={(e) => handleInputChange('headline', e.target.value)}
              placeholder="Enter a compelling headline"
              maxLength={60}
              className="w-full p-3 rounded-md bg-gray-900 border border-gray-700 text-white placeholder-gray-500"
            />
            <div className="text-sm text-gray-500 mt-1 text-right">
              {60 - adData.headline.length} characters left
            </div>
          </div>

          {/* Call to Action */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Call to Action</label>
            <select
              value={adData.callToAction}
              onChange={(e) => handleInputChange('callToAction', e.target.value)}
              className="w-full p-3 rounded-md bg-gray-900 border border-gray-700 text-white"
            >
              {callToActionOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Website URL */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Website URL</label>
            <input
              type="url"
              value={adData.websiteUrl}
              onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
              placeholder="https://your-website.com"
              className="w-full p-3 rounded-md bg-gray-900 border border-gray-700 text-white placeholder-gray-500"
            />
          </div>

          {/* Media Upload */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Media</label>
            <div className="space-y-3">
              {!adData.mediaFile ? (
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                  <div className="flex justify-center space-x-4 mb-4">
                    <FaImage className="text-gray-400" size={24} />
                    <FaVideo className="text-gray-400" size={24} />
                    <FaMusic className="text-gray-400" size={24} />
                  </div>
                  <p className="text-gray-400 mb-4">Upload media for your ad</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                  >
                    Choose File
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*,audio/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {renderMediaPreview()}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
                  >
                    Change Media
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*,audio/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Ad Preview */}
        <div className="space-y-6">
          <h3 className="text-lg text-white font-semibold">Preview</h3>
          
          {/* Ad Preview */}
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
              {adData.headline && (
                <div className="text-white font-semibold text-lg">
                  {adData.headline}
                </div>
              )}

              {/* Ad Text */}
              {adData.adText && (
                <div className="text-gray-300">
                  {adData.adText}
                </div>
              )}

              {/* Media Preview */}
              {adData.mediaPreview && (
                <div className="rounded-md overflow-hidden">
                  {renderMediaPreview()}
                </div>
              )}

              {/* Call to Action Button */}
              <div className="pt-3">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-semibold transition-colors">
                  {adData.callToAction}
                </button>
              </div>

              {/* Website URL */}
              {adData.websiteUrl && (
                <div className="text-gray-400 text-sm">
                  {adData.websiteUrl}
                </div>
              )}
            </div>

            {/* Post Actions */}
            <div className="flex items-center space-x-4 pt-4 border-t border-gray-600 mt-4">
              <button className="flex items-center space-x-1 text-gray-400 hover:text-white">
                <IoIosHeartEmpty size={20} />
                <span>0</span>
              </button>
              <button className="flex items-center space-x-1 text-gray-400 hover:text-white">
                <IoSyncCircleOutline size={20} />
                <span>0</span>
              </button>
            </div>
          </div>

          {/* Campaign Summary */}
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
            <h4 className="text-white font-semibold mb-3">Campaign Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Objective:</span>
                <span className="text-white capitalize">{campaignData.objective}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Budget:</span>
                <span className="text-white">
                  ${campaignData.budget.amount}/{campaignData.budget.budgetType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Locations:</span>
                <span className="text-white">{campaignData.targeting.locations.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Age Range:</span>
                <span className="text-white">
                  {campaignData.targeting.ageRange.min}-{campaignData.targeting.ageRange.max}
                </span>
              </div>
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
          onClick={handleNext}
          className="bg-white text-black px-6 py-2 rounded-full font-semibold hover:bg-gray-200 transition-colors"
        >
          Review & Launch
        </button>
      </div>
    </div>
  );
};

export default AdCreative;