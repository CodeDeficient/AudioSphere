
'use client';

import React from 'react';
import type { Track } from './MusicPlayer'; // Import Track type
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Music, PlayCircle, PauseCircle } from 'lucide-react'; // Import icons

interface PlaylistProps {
  tracks: Track[];
  currentTrackIndex: number | null;
  onSelectTrack: (index: number) => void;
  isPlaying: boolean;
}

export default function Playlist({
  tracks,
  currentTrackIndex,
  onSelectTrack,
  isPlaying,
}: PlaylistProps) {
  return (
    <ScrollArea className="h-full w-full rounded-md border bg-card/50 p-2">
      <div className="p-2">
        <h4 className="mb-3 text-sm font-medium leading-none text-center">Playlist</h4>
        {tracks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No tracks uploaded yet.</p>
        ) : (
          <ul className="space-y-1">
            {tracks.map((track, index) => {
              const isCurrent = index === currentTrackIndex;
              return (
                <li key={track.id}>
                  <button
                    onClick={() => onSelectTrack(index)}
                    className={cn(
                      'w-full flex items-center justify-between p-2 rounded-md text-sm text-left transition-colors',
                      isCurrent
                        ? 'bg-primary/20 text-primary-foreground' // Highlight current track
                        : 'hover:bg-muted/50 text-foreground',
                      'focus:outline-none focus:ring-1 focus:ring-ring' // Added focus style
                    )}
                    aria-current={isCurrent ? 'true' : undefined}
                  >
                    <div className="flex items-center space-x-2 truncate">
                       {isCurrent && isPlaying ? (
                         <PauseCircle className="h-4 w-4 text-accent flex-shrink-0" />
                       ) : isCurrent ? (
                         <PlayCircle className="h-4 w-4 text-accent flex-shrink-0" />
                       ) : (
                         <Music className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                       )}
                       <span className="truncate">{track.name}</span>
                    </div>
                     {/* Optionally add duration or other info here */}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </ScrollArea>
  );
}
