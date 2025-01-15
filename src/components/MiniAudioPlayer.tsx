import React, { useRef, useState, useCallback, useMemo } from 'react';
import { IoIosPause, IoIosPlay, IoIosRepeat, IoMdClose } from "react-icons/io";
import { useAudioPlayer } from '../context/AudioPlayerContent';

interface MiniAudioPlayerProps {
  onClose?: () => void;
}

const MiniAudioPlayer = React.memo(({ onClose }: MiniAudioPlayerProps) => {
  const {
    currentAudio,
    isPlaying,
    progress,
    duration,
    currentTime,
    miniPlayerPosition,
    isRepeatEnabled,
    playAudio,
    pauseAudio,
    seekTo,
    setMiniPlayerPosition,
    toggleRepeat,
    hideMiniPlayer,
    formatTime
  } = useAudioPlayer();

  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Define all callbacks before any conditional returns
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;

    setMiniPlayerPosition({
      x: Math.max(0, Math.min(window.innerWidth - 288, newX)),
      y: Math.max(0, Math.min(window.innerHeight - 80, newY))
    });
  }, [isDragging, setMiniPlayerPosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!playerRef.current) return;

    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - miniPlayerPosition.x,
      y: e.clientY - miniPlayerPosition.y
    };
    e.preventDefault();
  }, [miniPlayerPosition.x, miniPlayerPosition.y]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = (clickX / rect.width) * 100;
    seekTo(percentage);
  }, [seekTo]);

  const handleClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    hideMiniPlayer();
    onClose?.();
  }, [hideMiniPlayer, onClose]);

  const handlePlayPause = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      pauseAudio();
    } else if (currentAudio.url) {
      playAudio(currentAudio.url, currentAudio.title!);
    }
  }, [isPlaying, pauseAudio, playAudio, currentAudio]);

  const handleHover = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const hoverPosition = (hoverX / rect.width) * duration;
    setHoverTime(hoverPosition);
  }, [duration]);

  const handleRepeatToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleRepeat();
  }, [toggleRepeat]);

  // Effect for drag listeners
  React.useEffect(() => {
    if (!isDragging) return;

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Memoize style object
  const containerStyle = useMemo(() => ({
    top: `${miniPlayerPosition.y}px`,
    left: `${miniPlayerPosition.x}px`,
    width: '288px',
    padding: '16px',
    zIndex: 1000,
    cursor: isDragging ? 'grabbing' : 'grab',
  }), [miniPlayerPosition.y, miniPlayerPosition.x, isDragging]);

  // Early return AFTER all hooks
  if (!currentAudio.url) return null;

  return (
    <div
      ref={playerRef}
      className="mini-audio-player fixed bg-white rounded-lg shadow-md pointer-events-auto drag-handle"
      style={containerStyle}
    >
      <div
        className="absolute top-0 right-0 left-0 h-6 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      />

      <div className="flex items-center gap-3 mb-2">
        <button
          type="button"
          onClick={handlePlayPause}
          className="text-black active:text-gray-700 p-1"
        >
          {isPlaying ? <IoIosPause size={24} /> : <IoIosPlay size={24} />}
        </button>
        
        <div className="flex-grow">
          <div className='text-sm font-medium truncate'>
            {currentAudio.title}
          </div>
          <div className='text-xs text-gray-500'>
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        <button
          type="button"
          onClick={handleRepeatToggle}
          className={`p-1 ${isRepeatEnabled ? 'text-black' : 'text-gray-500'} active:text-gray-700 select-none`}
        >
          <IoIosRepeat size={20} />
        </button>

        <button
          type="button"
          onClick={handleClose}
          className="text-gray-500 active:text-gray-700 p-1"
        >
          <IoMdClose size={20} />
        </button>
      </div>

      <div 
        className="h-1 bg-gray-200 rounded cursor-pointer relative"
        onClick={handleSeek}
        onMouseMove={handleHover}
        onMouseLeave={() => setHoverTime(null)}
      >
        <div 
          className="h-full bg-gray-400 rounded" 
          style={{ width: `${progress}%` }} 
        />
        {hoverTime !== null && (
          <div 
            className="absolute bg-gray-700 text-white text-xs p-1 rounded -translate-x-1/2 -top-6"
            style={{ left: `${(hoverTime / duration) * 100}%` }}
          >
            {formatTime(hoverTime)}
          </div>
        )}
      </div>
    </div>
  );
});

MiniAudioPlayer.displayName = 'MiniAudioPlayer';

export default MiniAudioPlayer;