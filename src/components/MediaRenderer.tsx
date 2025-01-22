import React from 'react';
import AudioPlayer from './AudioPlayer';

interface MediaRendererProps {
    mediaSource: string;
    mediaType: 'image' | 'gif' | 'video' | 'audio';
    fileURL?: string;
    originalFileName?: string;
    onPlay?: (url: string) => void;
}

const MediaRenderer: React.FC<MediaRendererProps> = ({
    mediaSource,
    mediaType,
    fileURL,
    originalFileName,
    onPlay
    }) => {
      console.log('MediaRenderer props:', {
        mediaSource, 
        mediaType,
        fileURL,
        originalFileName
      });

const handleAudioPlay = () => {
    console.log('MediaRenderer audio play:', {
    mediaSource,
    originalFileName
      }),
      onPlay?.(mediaSource);
    };

    switch (mediaType) {
      case 'gif':
        return <img src={mediaSource} alt="uploaded GIF" className="w-full h-auto object-cover" />;
    
    case 'video':            
      return (
        <video controls className="w-full h-auto object-cover">
          <source src={mediaSource} type="video/mp4" />
          <source src={mediaSource} type="video/webm" />
          <source src={mediaSource} type="video/ogg" />
          <source src={mediaSource} type="video/quicktime" />
          Your browser does not support the video tag
        </video>
      );
    
    case 'audio':
      console.log('MediaRenderer rendering AudioPlayer with:', {
        mediaSource, 
        originalFileName,
        fileURL
      });
      return (
      <AudioPlayer
        audioSrc={mediaSource}
        audioTitle={originalFileName}
        fileURL={fileURL || mediaSource}
        onPlay={() => onPlay?.(mediaSource)}
      />
    );

    case 'image':
    default:
      return <img src={mediaSource} alt="uploaded media" className="w-full h-auto object-cover" />;
  }    
};

export default MediaRenderer