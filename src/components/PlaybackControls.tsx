import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX } from 'lucide-react';

interface PlaybackControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  progress: number;
  duration: number;
  onSeek: (progress: number) => void;
  currentTrackName?: string | null;
}

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds === Infinity) {
    return '--:--';
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default function PlaybackControls({
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
  volume,
  onVolumeChange,
  progress,
  duration,
  onSeek,
  currentTrackName,
}: PlaybackControlsProps) {
  const handleSliderChange = (value: number[]) => {
    onSeek(value[0]);
  };

  const handleVolumeSliderChange = (value: number[]) => {
    onVolumeChange(value[0]);
  };

  const currentPosition = duration * progress;

  return (
    <div className="flex flex-col items-center space-y-2 sm:space-y-3 px-2 py-1 sm:px-4 sm:py-2 rounded-xl   relative overflow-hidden group">
      {/* SVG Noise Overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none  " xmlns="http://www.w3.org/2000/svg"><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#noiseFilter)"/></svg>
      {/* Current Track Name */}
      <div className="text-sm text-foreground truncate w-full text-center min-h-[1.25rem]">
        {currentTrackName || 'No track selected'}
      </div>
      {/* Progress Bar */}
      <div className="w-full flex items-center space-x-2">
        <span className="text-xs text-foreground w-10 text-right">
          {formatTime(currentPosition)}
        </span>
        <Slider
          value={[progress]}
          max={1}
          step={0.01}
          onValueChange={handleSliderChange}
          className="w-full cursor-pointer"
          aria-label="Seek track progress"
        />
        <span className="text-xs text-foreground w-10 text-left">
          {formatTime(duration)}
        </span>
      </div>
      {/* Main Controls */}
      <div className="flex items-center justify-center space-x-2 sm:space-x-4">
        <Button variant="ghost" size="icon" onClick={onPrevious} aria-label="Previous track">
          <SkipBack className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onPlayPause} aria-label={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={onNext} aria-label="Next track">
          <SkipForward className="h-5 w-5" />
        </Button>
        {/* Volume Control */}
        <div className="flex items-center space-x-1 sm:space-x-2 w-full max-w-[120px] sm:max-w-[128px]">
          {volume > 0 ? <Volume2 className="h-5 w-5 text-foreground" /> : <VolumeX className="h-5 w-5 text-foreground" />}
          <Slider
            value={[volume]}
            max={1}
            step={0.01}
            onValueChange={handleVolumeSliderChange}
            className="w-full cursor-pointer"
            aria-label="Volume control"
          />
        </div>
      </div>
    </div>
  );
}
