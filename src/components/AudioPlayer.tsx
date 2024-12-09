import React, { useState, useRef, useEffect } from 'react';
import { FaPlay, FaPause } from 'react-icons/fa';

interface AudioPlayerProps {
  audioSrc: string;
  audioTitle?: string;
  fileURL: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioSrc, audioTitle, fileURL }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [title, setTitle] = useState(audioTitle || 'Audio File');
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
   // Extract file name from the URL if title isnt provided 
   if (audioTitle) {
    //Extract the part after the UUID pattern
    const match = audioTitle.match(/^[a-f0-9-]+-(.+)$/);
    const cleanedTitle = match ? match[1] : audioTitle;
    setTitle(cleanedTitle);
   } else if (audioSrc) {
    // Fallback method using URL
    const decodedUrl = decodeURIComponent(audioSrc);
    const filename = decodedUrl.split('/').pop()?.split('?')[0] || 'Audio File';
    const cleanedTitle = filename.replace(/^[a-f0-9-]+-/, '').replace(/\.[^/.]+$/, '');
    setTitle(cleanedTitle);
    }
   }, [audioTitle, audioSrc]);

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const updateProgress = () => {
    if (audioRef.current) {
        const currentTime = audioRef.current.currentTime;
        const duration = audioRef.current.duration;
        if (!isNaN(duration)) {
        setProgress((currentTime / duration) * 100);
      }
    }
  };   

  const handleSeek = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (audioRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newTime = (clickX / rect.width) * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
      setProgress((newTime / audioRef.current.duration) * 100);
    }
  };

  useEffect(() => {
    const interval = setInterval(updateProgress, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="audio-player flex flex-col items-center p-2 rounded-lg mb-1 shadow-sm border-black max-w-full">
     <div className='flex items-center w-full'>
      <button
        onClick={togglePlayback}
        className="mr-3 p-2  text-black transition-colors duration-200"
        tabIndex={0}
      >
        {isPlaying ? 
          <FaPause className="w-4 h-4" />
        :
          <FaPlay className="w-4 h-4" />
        }
      </button>

      <div className="flex-grow mb-2">
        <div className='flex items-center'>
          <span className="text-sm flex-grow ">{title}</span>
          </div>
        </div>
      </div>

      <div className='w-52 bg-slate-300 h-1 rounded mt-3'>
        <div
        className='bg-black h-1 rounded'
        onClick={handleSeek}
        style={{ width: `${progress}%` }}
        ></div>
    </div>

      <audio
        ref={audioRef}
        src={fileURL}
        className="hidden"
        onEnded={() => setIsPlaying(false)}
        onTimeUpdate={updateProgress}
      >
        Your browser does not support the audio tag.
      </audio>
    </div>
  );
};

export default AudioPlayer;