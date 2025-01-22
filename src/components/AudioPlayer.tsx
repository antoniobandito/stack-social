import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { IoIosPause, IoIosPlay, IoIosRepeat } from "react-icons/io";
import { useAudioPlayer } from '../context/AudioPlayerContent';

interface AudioPlayerProps {
  audioSrc: string;
  audioTitle?: string;
  fileURL: string;
  onPlay?: () => void;
  className?: string;
}

const AudioPlayer = React.memo(({ 
  audioSrc, 
  audioTitle, 
  fileURL, 
  onPlay,
  className = ''
}: AudioPlayerProps) => {
  const { 
    currentAudio,
    isPlaying,
    progress,
    isRepeatEnabled,
    playAudio,
    pauseAudio,
    seekTo,
    toggleRepeat,
    duration,
    currentTime,
    formatTime
  } = useAudioPlayer();

  const [title, setTitle] = useState(audioTitle || 'Audio File');
  
  // Memoize current track check
  const isCurrentTrack = useMemo(() => currentAudio.url === fileURL, [currentAudio.url, fileURL]);

  useEffect(() => {
    if (audioTitle) {
      // Clean up the title is needed
      const cleanedTitle = audioTitle.replace(/^[a-f0-9-]+-/, '').replace(/\.[^/.]+$/, '');
      setTitle(cleanedTitle);
    } else if (audioSrc) {
      const decodedUrl = decodeURIComponent(audioSrc);
      const filename = decodedUrl.split('/').pop()?.split('?')[0] || 'Audio File';
      const cleanedTitle = filename.replace(/^[a-f0-9-]+-/, '').replace(/\.[^/.]+$/, '');
      setTitle(cleanedTitle);
    }
  }, [audioTitle, audioSrc]);

  const handlePlayPause = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    console.log('handlePlayPause:', {
      audioSrc,
      audioTitle,
      currentTitle: title,
      fileURL
    });    

    try {
      new URL(fileURL);
    } catch (e) {
      console.error('Invalid URL:', fileURL);
      return;
    }

    if (isCurrentTrack && isPlaying) {
      pauseAudio();
    } else {
      console.log('Calling playAudio with:', fileURL, title);
      playAudio(fileURL, title);
      onPlay?.();
    }
  }, [isCurrentTrack, isPlaying, audioSrc, pauseAudio, playAudio, title, fileURL, audioTitle, onPlay]);

  const handleSeek = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (!isCurrentTrack) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = (clickX / rect.width) * 100;
    seekTo(percentage);
  }, [isCurrentTrack, seekTo]);

  const handleRepeatToggle = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    toggleRepeat();
  }, [toggleRepeat]);

  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      handlePlayPause(event as unknown as React.MouseEvent);
    }
  }, [handlePlayPause]);

  return (
    <div className={`flex flex-col items-center p-4 rounded-lg shadow-md border border-neutral-200 max-w-full ${className}`}>
      <div className="flex items-center w-full gap-3">
        <button
          onClick={handlePlayPause}
          onKeyDown={handleKeyPress}
          className="p-2 rounded-full hover:bg-neutral-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={isCurrentTrack && isPlaying ? 'Pause' : 'Play'}
        >
          {isCurrentTrack && isPlaying ? 
            <IoIosPause className="w-6 h-6" /> :
            <IoIosPlay className="w-6 h-6" />
          }
        </button>

        <div className="flex-grow">
          <span className="text-sm font-medium line-clamp-1" title={title}>
            {title}
          </span>
          {isCurrentTrack && (
            <span className="text-xs text-neutral-500">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          )}
        </div>

        <button 
          onClick={handleRepeatToggle}
          onKeyDown={handleKeyPress}
          className={`p-2 rounded-full hover:bg-neutral-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isRepeatEnabled ? 'text-black' : 'text-neutral-500 active:outline-none'
          }`}
          aria-label="Toggle repeat"
        >
          <IoIosRepeat className="w-5 h-5" />
        </button>
      </div>

      <div 
        className="w-full h-2 bg-neutral-200 rounded-full mt-3 cursor-pointer"
        onClick={handleSeek}
        role="slider"
        aria-label="Audio progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={isCurrentTrack ? progress : 0}
      >
        <div
          className="h-full bg-gray-400 rounded-full transition-all duration-200"
          style={{ width: `${isCurrentTrack ? progress : 0}%` }}
        />
      </div>
    </div>
  );
});

AudioPlayer.displayName = 'AudioPlayer';

export default AudioPlayer;