import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';

Modal.setAppElement('#root'); // Ensure this matches your app root ID

interface CampaignDetailsProps {
  initialData?: any;
  onSave: (data: any) => void;
  onNext: () => void;
}

const CampaignDetails: React.FC<CampaignDetailsProps> = ({ initialData, onSave, onNext }) => {
  const [objective, setObjective] = useState(initialData?.objective || 'sales');
  const [name, setName] = useState(initialData?.name || '...name your campaign');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const campaignOptions = [
    {
      label: 'reach',
      desc: 'Maximize your ad\'s reach',
    },
    {
      label: 'video views',
      desc: 'Get people to watch your video',
    },
    {
      label: 'sales',
      desc: 'Promote purchases on your website',
    },
    {
      label: 'website traffic',
      desc: 'Drive traffic to your website',
    },
  ];

  // Update parent state when data changes
  useEffect(() => {
    onSave({ objective, name });
  }, [objective, name, onSave]);

  const handleNext = () => {
    if (name.trim() === '...name your campaign' || name.trim() === '') {
      alert('Please enter a campaign name');
      return;
    }
    onNext();
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl text-white font-bold mb-6">Campaign Details</h1>

      {/* Objective Section */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">Objective</label>
        <div className="flex items-center justify-between bg-gray-900 p-4 rounded-md border border-gray-700">
          <div>
            <h2 className="text-lg text-white font-semibold capitalize">{objective}</h2>
            <p className="text-sm text-gray-400">
              {
                campaignOptions.find((opt) => opt.label === objective)?.desc ||
                'Choose your campaign goal'
              }
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-blue-400 text-sm hover:underline"
          >
            Edit
          </button>
        </div>
      </div>

      {/* Name Section */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">Campaign Name</label>
        <input
          type="text"
          value={name}
          maxLength={255}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 rounded-md bg-gray-900 border border-gray-700 text-white placeholder-gray-500"
          placeholder="Enter campaign name..."
        />
        <div className="text-sm text-gray-500 mt-1 text-right">{255 - name.length} characters left</div>
      </div>

      {/* Campaign Type */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">Campaign Type</label>
        <div className="bg-gray-900 p-4 rounded-md border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">A</span>
            </div>
            <div>
              <h3 className="text-white font-semibold">Automatic</h3>
              <p className="text-sm text-gray-400">
                We'll optimize your campaign automatically
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-500 underline cursor-pointer mb-6 hover:text-gray-400">
        Show advanced settings
      </div>

      <div className="flex justify-between items-center">
        <button className="text-gray-400 text-sm hover:underline">
          Exit
        </button>
        <button 
          onClick={handleNext}
          className="bg-white text-black px-6 py-2 rounded-full font-semibold hover:bg-gray-200 transition-colors"
        >
          Next
        </button>
      </div>

      {/* Objective Modal */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        className="bg-[#1f1f1f] p-6 rounded-md shadow-lg max-w-md w-full mx-auto text-white border border-gray-700"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <h2 className="text-xl font-bold mb-4">Choose Campaign Objective</h2>

        <div className="space-y-3">
          {campaignOptions.map((opt) => (
            <div
              key={opt.label}
              className={`border rounded-md p-3 cursor-pointer transition-colors ${
                objective === opt.label
                  ? 'border-blue-500 bg-blue-600 bg-opacity-20'
                  : 'border-gray-600 hover:bg-gray-800'
              }`}
              onClick={() => {
                setObjective(opt.label);
                setIsModalOpen(false);
              }}
            >
              <h3 className="font-semibold capitalize">{opt.label}</h3>
              <p className="text-sm text-gray-400">{opt.desc}</p>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end mt-6">
          <button
            onClick={() => setIsModalOpen(false)}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default CampaignDetails;