import React, { createContext, useContext, useRef, useState, useCallback } from 'react';

interface AudioContextType {
  currentAudio: {
    url: string | null;
    title: string | null;
  };
  isPlaying: boolean;
  progress: number;
  duration: number;
  currentTime: number;
  isMiniPlayerVisible: boolean;
  miniPlayerPosition: { x: number; y: number };
  isRepeatEnabled: boolean;
  playAudio: (audioUrl: string, audioTitle?: string) => void;
  pauseAudio: () => void;
  seekTo: (percentage: number) => void;
  updateProgress: (value: number) => void;
  setMiniPlayerPosition: (position: { x: number; y: number }) => void;
  toggleRepeat: () => void;
  hideMiniPlayer: () => void;
  formatTime: (time: number) => string;
  audioRef: React.RefObject<HTMLAudioElement>;
}

const AudioPlayerContext = createContext<AudioContextType | null>(null);

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentAudio, setCurrentAudio] = useState<{ url: string | null; title: string | null }>({
    url: null,
    title: null
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMiniPlayerVisible, setIsMiniPlayerVisible] = useState(false);
  const [isRepeatEnabled, setIsRepeatEnabled] = useState(false);
  const [miniPlayerPosition, setMiniPlayerPosition] = useState({
    x: 20,
    y: window.innerHeight - 120
  });
  const audioRef = useRef<HTMLAudioElement>(null);

  const extractTitle = (audioUrl: string, providedTitle?: string): string => {
    if (providedTitle) {
      return providedTitle; // Use provided title directly if available
    }
    const decodedUrl = decodeURIComponent(audioUrl);
    const filename = decodedUrl.split('/').pop()?.split('?')[0] || 'Audio File';
    return filename.replace(/^[a-f0-9-]+-/, '').replace(/\.[^/.]+$/, '');
  };

  const formatTime = useCallback((timeInSeconds: number): string => {
    if (isNaN(timeInSeconds) || !isFinite(timeInSeconds)) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const playAudio = useCallback((audioUrl: string, audioTitle?: string) => {
    console.log('playAudio called with:', { audioUrl, audioTitle });

    const cleanTitle = audioTitle || extractTitle(audioUrl);
    console.log('Using title:', cleanTitle);
    setCurrentAudio({ url: audioUrl, title: cleanTitle });

    if (audioRef.current) {
      // First pause any currently playing audio 
      audioRef.current.pause();

      // Then set the new source
      audioRef.current.src = audioUrl; 

      // Wait for audo to be loaded before playing
      audioRef.current.load();

      // Use oncanplaythough event to ensure audio is ready
      const  playWhenReady = () => {
      audioRef.current?.play()
      .then(() => {
        console.log('Audio played successfully:', cleanTitle);
          setIsPlaying(true);
          setIsMiniPlayerVisible(true);
        })
        .catch((error) => {
          console.warn('Error playing audio. Retrying...', error);
              setIsPlaying(false);
            });
        // Remove the event listener after its used
        audioRef.current?.removeEventListener('canplaythrough', playWhenReady);
        };

        audioRef.current.addEventListener('canplaythrough', playWhenReady);
    } else {
      console.error('Audio ref is null');
    }
  }, []);

  const pauseAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const seekTo = useCallback((percentage: number) => {
    if (audioRef.current) {
      const time = (percentage / 100) * audioRef.current.duration;
      audioRef.current.currentTime = time;
      setProgress(percentage);
      setCurrentTime(time);
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      const audioDuration = audioRef.current.duration;

      const newProgress = (time / audioDuration) * 100;
      setCurrentTime(time);
      setProgress((prevProgress) => (Math.abs(prevProgress - newProgress) > 0.5 ? newProgress : prevProgress));
    }
  }, []);

  const updateProgress = (value: number) => {
    setProgress(value);
  };

  const toggleRepeat = () => {
    setIsRepeatEnabled((prev) => !prev);
  };

  const hideMiniPlayer = () => {
    pauseAudio();
    setIsMiniPlayerVisible(false);
    setCurrentAudio({ url: null, title: null });
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        currentAudio,
        isPlaying,
        progress,
        duration,
        currentTime,
        isMiniPlayerVisible,
        miniPlayerPosition,
        isRepeatEnabled,
        playAudio,
        pauseAudio,
        seekTo,
        updateProgress,
        setMiniPlayerPosition,
        toggleRepeat,
        hideMiniPlayer,
        formatTime,
        audioRef
      }}
    >
      {children}
      <audio
        ref={audioRef}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration);
          }
        }}
        onEnded={() => {
          if (isRepeatEnabled && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
          } else {
            setIsPlaying(false);
          }
        }}
        onTimeUpdate={handleTimeUpdate}
      />
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};
