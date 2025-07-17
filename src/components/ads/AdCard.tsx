import React from 'react';
import { Link } from 'react-router-dom';

interface AdCardProps {
  id: string;
  companyName: string;
  message: string;
  imageUrl?: string;
  link: string;
}

const AdCard: React.FC<AdCardProps> = ({
  companyName,
  message,
  imageUrl,
  link
}) => {
  return (
    <div className="grid-item media-post p-2 mt-3 rounded-md shadow-md relative post-container ad-card">
      <div className="flex justify-between items-center mb-2">
        <div className="font-bold p-1 text-blue-700">Sponsored</div>
        <div className="text-sm text-gray-500 font-semibold">{companyName}</div>
      </div>

      {message && <div className="post-content p-1 mb-3">{message}</div>}

      {imageUrl && (
        <img
          src={imageUrl}
          alt={`${companyName} ad`}
          className="w-full rounded-md mb-2"
        />
      )}

      <div className="flex justify-end">
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline text-sm font-semibold"
        >
          Learn more →
        </a>
      </div>
    </div>
  );
};

export default AdCard;
