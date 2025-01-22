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
  const playerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

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
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.non-draggable')) {
      return; // Prevent dragging on buttons or duration bar
    }

    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - miniPlayerPosition.x,
      y: e.clientY - miniPlayerPosition.y
    };
    e.preventDefault();
  }, [miniPlayerPosition.x, miniPlayerPosition.y]);

  React.useEffect(() => {
    if (!isDragging) return;

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const containerStyle = useMemo(() => ({
    top: `${miniPlayerPosition.y}px`,
    left: `${miniPlayerPosition.x}px`,
    width: '288px',
    padding: '16px',
    zIndex: 1000,
    cursor: isDragging ? 'grabbing' : 'grab',
    minHeight: '80px'
  }), [miniPlayerPosition.y, miniPlayerPosition.x, isDragging]);

  if (!currentAudio.url) return null;

  return (
    <div
      ref={playerRef}
      className="mini-audio-player fixed bg-white rounded-lg shadow-md pointer-events-auto drag-handle"
      style={containerStyle}
      onMouseDown={handleMouseDown}
    >
      <div className="flex items-center gap-3 mb-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            isPlaying ? pauseAudio() : playAudio(currentAudio.url!, currentAudio.title!);
          }}
          className="text-black active:text-gray-700 p-1"
        >
          {isPlaying ? <IoIosPause size={24} /> : <IoIosPlay size={24} />}
        </button>

        <div className="flex-grow">
          <div className='text-sm font-medium truncate'>
            {currentAudio.title || 'No title available'}
          </div>
          <div className='text-xs text-gray-500'>
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleRepeat();
          }}
          className={`p-1 ${isRepeatEnabled ? 'text-black' : 'text-gray-500'} active:text-gray-700 select-none`}
        >
          <IoIosRepeat size={20} />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            hideMiniPlayer();
            onClose?.();
          }}
          className="text-gray-500 active:text-gray-700 p-1"
        >
          <IoMdClose size={20} />
        </button>
      </div>

      <div 
        className="h-1 bg-gray-200 rounded cursor-pointer relative non-draggable"
        onClick={(e) => {
          e.stopPropagation();
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const percentage = (clickX / rect.width) * 100;
          seekTo(percentage);
        }}
      >
        <div 
          className="h-full bg-gray-400 rounded" 
          style={{ width: `${progress}%` }} 
        />
      </div>
    </div>
  );
});

MiniAudioPlayer.displayName = 'MiniAudioPlayer';

export default MiniAudioPlayer;
