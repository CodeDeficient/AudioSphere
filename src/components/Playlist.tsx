'use client';

import React, { useEffect, useState } from 'react';
import type { Track } from '@/hooks/useTonePlayer'; // Import Track type
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Music, PlayCircle, PauseCircle, X } from 'lucide-react'; // Import icons
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import type { DroppableProvided, DraggableProvided } from 'react-beautiful-dnd';

interface PlaylistProps {
  tracks: Track[];
  currentTrackIndex: number | null;
  onSelectTrack: (index: number) => void;
  isPlaying: boolean;
  onReorder?: (newTracks: Track[]) => void;
  onRemove?: (trackId: string) => void;
}

export default function Playlist({
  tracks,
  currentTrackIndex,
  onSelectTrack,
  isPlaying,
  onReorder,
  onRemove,
}: PlaylistProps) {
  const handleDragEnd = (result: unknown) => {
    if (
      typeof result === 'object' &&
      result !== null &&
      'destination' in result &&
      'source' in result &&
      (result as any).destination &&
      onReorder
    ) {
      const { source, destination } = result as { source: { index: number }, destination: { index: number } };
      const reordered = Array.from(tracks);
      const [removed] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, removed);
      onReorder(reordered);
    }
  };

  return (
    <ScrollArea className="flex-1 overflow-y-auto">
      <div className="py-2">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="playlist-droppable" isDropDisabled={false} isCombineEnabled={false} ignoreContainerClipping={false}>
            {(provided: DroppableProvided) => (
              <ul
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-1"
              >
                {tracks.map((track, index) => {
                  const isCurrent = index === currentTrackIndex;
                  return (
                    <Draggable key={track.id} draggableId={track.id} index={index}>
                      {(draggableProvided: DraggableProvided) => (
                        <li
                          ref={draggableProvided.innerRef}
                          {...draggableProvided.draggableProps}
                          {...draggableProvided.dragHandleProps}
                          className={cn(
                            "flex items-center justify-between px-2 py-2 rounded cursor-pointer transition-colors",
                            isCurrent ? "bg-accent/30" : "hover:bg-accent/10"
                          )}
                          onClick={() => onSelectTrack(index)}
                        >
                          <div className="flex items-center space-x-2 truncate w-full">
                            {isCurrent && isPlaying ? (
                              <PauseCircle className="h-4 w-4 text-accent flex-shrink-0" />
                            ) : isCurrent ? (
                              <PlayCircle className="h-4 w-4 text-accent flex-shrink-0" />
                            ) : (
                              <Music className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                            <div className="flex flex-col min-w-0">
                              <span className="truncate font-semibold text-base text-foreground leading-tight">
                                {track.title || track.name}
                              </span>
                              {track.artist && (
                                <span className="truncate text-xs text-muted-foreground font-normal leading-tight">
                                  {track.artist}
                                </span>
                              )}
                            </div>
                          </div>
                        </li>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </ScrollArea>
  );
}
