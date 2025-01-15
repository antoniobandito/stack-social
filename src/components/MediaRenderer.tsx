import React from 'react';
import AudioPlayer from './AudioPlayer';
import { useAudioPlayer } from '../context/AudioPlayerContent';

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
    fileURL = '',
    originalFileName,
    onPlay
    }) => {
      const { playAudio } = useAudioPlayer();

      const handleAudioPlay = () => {
        // Use the cleanest available filename
        const audioTitle = originalFileName ||
                          fileURL?.split('/').pop()?.split('?')[0] ||
                          'Audio File';
        
        // Call both the context's playAudio and the parent's onPlay if provided
        playAudio(mediaSource, audioTitle);
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
      return (
      <AudioPlayer
        audioSrc={mediaSource}
        audioTitle={originalFileName}
        fileURL={fileURL || mediaSource}
        onPlay={handleAudioPlay}
      />
    );

    case 'image':
    default:
      return <img src={mediaSource} alt="uploaded media" className="w-full h-auto object-cover" />;
  }    
};

export default MediaRenderer