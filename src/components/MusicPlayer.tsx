'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import * as Tone from 'tone';
import PlaybackControls from '@/components/PlaybackControls';
import Playlist from '@/components/Playlist';
import ClientOnly from '@/components/ClientOnly';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Sidebar, SidebarProvider, SidebarTrigger, SidebarContent } from '@/components/ui/sidebar';
import { useDropzone } from 'react-dropzone';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTonePlayer, Track } from '@/hooks/useTonePlayer'; // Import hook and Track type

// Dynamically import SphereVisualizer with SSR disabled
const SphereVisualizer = dynamic(
  () => import('@/components/SphereVisualizer'),
  {
    ssr: false,
    loading: () => <Skeleton className="w-full h-full bg-muted/30" />
   }
);


export interface Track {
  id: string;
  name: string;
  file: File | undefined;
  url: string;
  title?: string;
  artist?: string;
  album?: string;
}

export default function MusicPlayer() {
  const isMobile = useIsMobile();
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);

  const {
    isPlaying,
    progress,
    duration,
    analyser,
    audioContextState,
    showStartOverlay,
    currentTrack, // This is derived inside the hook
    volume, // Volume is now managed by the hook
    playPauseToggle,
    handleNextTrack, // Renamed from hook's perspective, or use hook's name directly
    handlePreviousTrack, // Same as above
    handleVolumeChange, // From hook
    handleSeek, // From hook
    handleStartVisualizer,
    ensureAudioContext, // From hook
    selectTrack, // From hook
  } = useTonePlayer({
    playlist,
    currentTrackIndex,
    setCurrentTrackIndex,
    setPlaylist, // Pass setPlaylist to the hook
    initialVolume: 0.5, // Set initial volume for the hook
  });

   const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
        await ensureAudioContext();
        const files = event.target.files;
        if (files) {
            const newTracks: Track[] = await Promise.all(Array.from(files).map(async (file) => {
                const url = URL.createObjectURL(file);
                const id = `${file.name}-${Date.now()}-${Math.random()}`;
                let title = '';
                let artist = '';
                let album = '';
                try {
                    // @ts-expect-error
                    const jsmediatags = await import('jsmediatags/dist/jsmediatags.min.js');
                    await new Promise<void>((resolve) => {
                        jsmediatags.read(file, {
                            onSuccess: ({ tags }: { tags: any }) => {
                                title = tags.title || '';
                                artist = tags.artist || '';
                                album = tags.album || '';
                                resolve();
                            },
                            onError: () => resolve(),
                        });
                    });
                } catch (e) { /* ignore */ }
                return { id, name: file.name, file, url, title, artist, album };
            }));
            const startIndex = playlist.length;
            setPlaylist((prev) => [...prev, ...newTracks]);
            if (currentTrackIndex === null && newTracks.length > 0) {
                console.log("Playlist was empty, selecting first uploaded track:", newTracks[0].name);
                // Don't set isPlaying=true here, let user initiate playback
                setCurrentTrackIndex(startIndex); // useEffect will load it
                setIsPlaying(false);
            } else {
               console.log("Adding tracks to existing playlist.");
            }
             event.target.value = '';
        }
    },
    [ensureAudioContext, currentTrackIndex, playlist.length, setPlaylist, setCurrentTrackIndex] // Added setPlaylist and setCurrentTrackIndex as they are used
  );

  // Fetch default audio files from /api/audio-list on mount if playlist is empty
  useEffect(() => {
    if (playlist.length === 0) {
      fetch('/api/audio-list')
        .then(res => res.json())
        .then(async data => {
          if (Array.isArray(data.files) && data.files.length > 0) {
            const tracks = await Promise.all(data.files.map(async (filePath: string, idx: number) => {
              const name = filePath.split('/').pop() || `Track ${idx + 1}`;
              let title = '';
              let artist = '';
              let album = '';
              try {
                const response = await fetch(`/${filePath}`);
                const blob = await response.blob();
                // @ts-expect-error
                const jsmediatags = await import('jsmediatags/dist/jsmediatags.min.js');
                await new Promise<void>((resolve) => {
                  jsmediatags.read(blob, {
                    onSuccess: ({ tags }: { tags: any }) => {
                      title = tags.title || '';
                      artist = tags.artist || '';
                      album = tags.album || '';
                      resolve();
                    },
                    onError: () => resolve(),
                  });
                });
              } catch (e) { /* ignore */ }
              return {
                id: `default-${idx}-${name}`,
                name,
                file: undefined,
                url: `/${filePath}`,
                title,
                artist,
                album,
              };
            }));
            setPlaylist(tracks);
            setCurrentTrackIndex(0); // Optionally auto-select first track
          }
        })
        .catch(e => console.error('Failed to fetch default audio list:', e));
    }
  }, []);

  const filteredPlaylist = playlist.filter(track => track.name.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => { setMounted(true); }, []);

  // handleStartVisualizer is now obtained from the hook.
  // The effect for initializing analyser and AudioContext on mount is now inside the hook.

  const handleReorder = (newTracks: Track[]) => {
    setPlaylist(newTracks);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const event = { target: { files: acceptedFiles } } as any;
    handleFileUpload(event);
  }, [handleFileUpload]);
  useDropzone({ onDrop, accept: { 'audio/*': [] }, multiple: true });

  const handleRemove = (trackId: string) => {
    setPlaylist(prev => {
      const idx = prev.findIndex(t => t.id === trackId);
      const newList = prev.filter(t => t.id !== trackId);
      if (idx === currentTrackIndex) {
        // setIsPlaying(false); // This will be handled by the hook's effect when playlist/index changes
        setCurrentTrackIndex(newList.length > 0 ? 0 : null);
      } else if (idx < currentTrackIndex!) {
        setCurrentTrackIndex(i => (i !== null ? i - 1 : null)); // Adjust index if removed item was before current
      }
      return newList;
    });
  };

  return (
    <>
      {mounted && (
        <SidebarProvider>
          <div className="flex flex-row h-full w-full min-h-screen overflow-hidden bg-background">
            {/* Sidebar: Playlist Navigation (Desktop) */}
            {!isMobile && (
              <Sidebar className="hidden md:flex w-80 flex-shrink-0 glassmorphism">
              <div className="flex flex-col h-full p-4">
                <Input
                  type="text"
                  placeholder="Search tracks..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="mb-4"
                  aria-label="Search tracks"
                />
                <Playlist
                  tracks={filteredPlaylist}
                  currentTrackIndex={currentTrackIndex}
                  onSelectTrack={selectTrack}
                  isPlaying={isPlaying}
                  onReorder={handleReorder}
                  onRemove={handleRemove}
                />
                {/* New Upload Button in Sidebar */}
                <div className="mt-auto pt-4">
                  <label htmlFor="sidebar-audio-upload" className="cursor-pointer w-full">
                    <Button asChild variant="outline" onClick={ensureAudioContext} className="w-full">
                      <span>Upload Audio</span>
                    </Button>
                    <Input
                      id="sidebar-audio-upload"
                      type="file"
                      accept=".mp3, .wav, .ogg, .flac, .m4a"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </Sidebar>
            )}
            {/* Main Content */}
            <main className="flex flex-col flex-1 h-full w-full">
              {/* Hamburger Menu Trigger for Mobile */}
              {isMobile && (
                <div className="p-2 md:hidden"> {/* Ensure it's hidden on md and up */}
                  <SidebarTrigger />
                </div>
              )}
              {/* Top Section: Visualizer */}
              <div className="flex-grow h-1/2 relative w-full">
                <div className="absolute inset-0 backdrop-blur-xl bg-black/10"></div>
                {showStartOverlay && audioContextState !== 'running' ? (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 text-white text-xl font-bold cursor-pointer select-none" onClick={handleStartVisualizer}>
                    Click to Start Visualizer
                  </div>
                ) : (
                  <React.Suspense fallback={<Skeleton className="w-full h-full bg-muted/30" />}>
                    <ClientOnly fallback={<Skeleton className="w-full h-full bg-muted/30" />}>
                      {analyser && <SphereVisualizer analyserNode={analyser} isPlaying={isPlaying} />}
                      {!analyser && <Skeleton className="w-full h-full bg-muted/30" />}
                    </ClientOnly>
                  </React.Suspense>
                )}
              </div>
              {/* Bottom Section: Controls */}
              <div className="flex-shrink-0 bg-transparent text-card-foreground p-4 overflow-hidden relative w-full">
                <Card className="h-full flex flex-col shadow-lg rounded-xl glassmorphism w-full">
                  <CardContent className="flex flex-col flex-grow p-4 overflow-hidden justify-end">
                    <ClientOnly>
                      <PlaybackControls
                        isPlaying={isPlaying}
                        onPlayPause={playPauseToggle}
                        onNext={handleNextTrack}
                        onPrevious={handlePreviousTrack}
                        volume={volume}
                        onVolumeChange={handleVolumeChange}
                        progress={progress}
                        duration={duration}
                        onSeek={handleSeek}
                        currentTrackName={currentTrack ? ((currentTrack.artist ? currentTrack.artist + ' - ' : '') + (currentTrack.title || currentTrack.name)) : undefined}
                      />
                    </ClientOnly>
                  </CardContent>
                </Card>
              </div>
            </main>
            {/* Mobile Sidebar (New) */}
            {isMobile && (
              <Sidebar> {/* Sidebar component handles Sheet internally based on context */}
                <SidebarContent className="glassmorphism w-80 z-[60] h-full"> {/* Apply glassmorphism and consistent width */}
                  <div className="flex flex-col h-full p-4">
                    <Input
                      type="text"
                      placeholder="Search tracks..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="mb-4"
                      aria-label="Search tracks"
                    />
                    <Playlist
                      tracks={filteredPlaylist}
                      currentTrackIndex={currentTrackIndex}
                      onSelectTrack={selectTrack}
                      isPlaying={isPlaying}
                      onReorder={handleReorder}
                      onRemove={handleRemove}
                    />
                    <div className="mt-auto pt-4">
                      <label htmlFor="mobile-sidebar-audio-upload" className="cursor-pointer w-full">
                        <Button asChild variant="outline" onClick={ensureAudioContext} className="w-full">
                          <span>Upload Audio</span>
                        </Button>
                        <Input
                          id="mobile-sidebar-audio-upload" // Ensure unique ID for label
                          type="file"
                          accept=".mp3, .wav, .ogg, .flac, .m4a"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </SidebarContent>
              </Sidebar>
            )}
          </div>
        </SidebarProvider>
      )}
    </>
  );
}