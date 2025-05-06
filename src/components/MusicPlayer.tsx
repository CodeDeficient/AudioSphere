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
import { Sidebar, SidebarProvider } from '@/components/ui/sidebar';
import { useDropzone } from 'react-dropzone';

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
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false); // Represents user's intent / transport state
  const [volume, setVolume] = useState(0.5);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isAudioContextStarted, setIsAudioContextStarted] = useState(false);
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);
  const [analyser, setAnalyser] = useState<Tone.Analyser | null>(null);
  const analyserRef = useRef<Tone.Analyser | null>(null);
  const [audioContextState, setAudioContextState] = useState<string>(Tone.context.state);
  const [showStartOverlay, setShowStartOverlay] = useState(false);


  const playerRef = useRef<Tone.Player | null>(null);
  const animationFrameRef = useRef<number>();
  // const trackEndTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Might not need with transport

  // Refs for latest state values in async/RAF contexts
  const isPlayingRef = useRef(isPlaying);
  const durationRef = useRef(duration);

  // Update refs when their corresponding state changes
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);


  const volumeRef = useRef(volume);

  const ensureAudioContext = useCallback(async () => {
    if (!isAudioContextStarted && Tone.context.state !== 'running') {
      console.log('Starting Tone.js AudioContext...');
      await Tone.start();
      console.log('AudioContext started.');
      setIsAudioContextStarted(true);
      if (!analyserRef.current) {
        analyserRef.current = new Tone.Analyser('fft', 1024);
        setAnalyser(analyserRef.current);
        Tone.Destination.volume.value = Tone.gainToDb(volumeRef.current);
        console.log('Tone.js Analyser created and volume set.');
        console.log("analyser created", analyserRef.current)
      }
    } else if (!analyserRef.current && Tone.context.state === 'running') { 
       analyserRef.current = new Tone.Analyser('fft', 1024);
       setAnalyser(analyserRef.current);
       Tone.Destination.volume.value = Tone.gainToDb(volumeRef.current);
       console.log('Tone.js Analyser created post-context start.');
    }
  }, [isAudioContextStarted, setIsAudioContextStarted, setAnalyser]);


  const stopAndClearTransport = useCallback(() => {
    console.log("Stopping and clearing Transport.");
    if (Tone.Transport.state !== 'stopped') {
        Tone.Transport.stop();
    }
    Tone.Transport.cancel(0); // Clear scheduled events
    Tone.Transport.seconds = 0; // Reset transport time
    setProgress(0); // Reset visual progress
    setDuration(0); // Ensure duration is reset
  }, [setProgress, setDuration]);

  // Stops player, disposes it, and clears transport
  const stopAndDisposePlayer = useCallback(() => {
    console.log("Stopping current player and clearing transport.");
    stopAndClearTransport();

    if (playerRef.current) {
       // Player should be stopped by Transport.stop(), but double-check state just in case
       if (playerRef.current.state === 'started') {
          try { playerRef.current.stop(); } catch (e) { console.warn("Error stopping player during dispose:", e)}
       }
       // Check if playerRef.current is not null before disposing
       if (playerRef.current) {
          playerRef.current.dispose();
       }
       playerRef.current = null;
       console.log("Previous player disposed.");
    }
    // Don't reset isPlaying here, let the calling logic manage it
    // setDuration(0); // Reset duration for the new track
  }, [stopAndClearTransport]);


  const handleNextTrack = useCallback(() => {
    console.log("Handling next track...");
    // const wasPlaying = isPlaying; // Avoid stale closure
    // setIsPlaying(false); // Let the main loading effect handle isPlaying state based on isPlayingRef
    stopAndDisposePlayer(); 

    setCurrentTrackIndex(prevIndex => {
      if (prevIndex === null) return playlist.length > 0 ? 0 : null;
      const next = prevIndex + 1;
      const nextIndex = next >= playlist.length ? 0 : next;
      console.log(`Next track index: ${nextIndex}. Current intent to play: ${isPlayingRef.current}`);
      // The main useEffect for currentTrackIndex will now load this track.
      // It will then check isPlayingRef.current to decide if Tone.Transport.start() should be called.
      return nextIndex;
    });
  }, [playlist.length, stopAndDisposePlayer, setCurrentTrackIndex]);


   const loadPlayer = useCallback(async (track: Track): Promise<Tone.Player> => {
     console.log('loadPlayer called for:', track.name);
     await ensureAudioContext();
     return new Promise((resolve, reject) => {
       const player = new Tone.Player({
         url: track.url,
         onload: () => {
           console.log('Player loaded successfully:', track.name, 'Duration:', player.buffer.duration);
           if (analyserRef.current) {
               player.connect(analyserRef.current);
               player.toDestination();
               console.log('Player connected to analyser and destination.');
           } else {
               console.warn("Analyser node not ready when player loaded. Connecting directly to destination.");
               player.toDestination();
           }
           setDuration(player.buffer.duration);
           // Sync player to transport and schedule it to start at time 0
           player.sync().start(0);
           console.log("Player synced to transport and scheduled to start at 0.");

            // Simplified onstop: Primarily for debugging or detecting unexpected stops
            // player.onstop = () => {
            //      const currentSeconds = playerRef.current?.seconds ?? 0;
            //      const bufferDuration = playerRef.current?.buffer?.duration ?? 0;
            //      const trackName = track?.name ?? 'Unknown Track';
            //      console.log(`Player stopped (onstop event) for ${trackName}. Player time: ${currentSeconds.toFixed(2)}, Transport time: ${Tone.Transport.seconds.toFixed(2)}, Duration: ${bufferDuration.toFixed(2)}, Transport state: ${Tone.Transport.state}`);
            //      // We rely on the progress loop checking Transport.seconds >= duration now
            // };

           resolve(player);
         },
         onerror: (error) => {
           console.error('Error loading player:', track.name, error);
           reject(new Error(`Failed to load track: ${track.name}`));
         },
       });

       // Removed incorrect manual onload trigger
       // if (player.loaded) {
       //     console.warn("Player was already loaded (cached?), manually triggering onload.");
       //     if (typeof player.onload === 'function') {
       //         player.onload();
       //     }
       // }
     });
   }, [ensureAudioContext]);

   // Effect to load and potentially play when currentTrackIndex or playlist changes
   useEffect(() => {
     if (currentTrackIndex === null || currentTrackIndex >= playlist.length) {
         console.log("useEffect[currentTrackIndex]: Index invalid or out of bounds. Resetting player state.");
         stopAndDisposePlayer(); // This now also calls setDuration(0) and setProgress(0)
         setIsPlaying(false);    // Ensure isPlaying is false if no track is valid
         // setDuration(0); // Done by stopAndDisposePlayer via stopAndClearTransport
         // setProgress(0); // Done by stopAndDisposePlayer via stopAndClearTransport
         return;
     }

     const trackToLoad = playlist[currentTrackIndex];
     console.log(`useEffect[currentTrackIndex]: Preparing to load track ${trackToLoad.name} at index ${currentTrackIndex}`);
     let isCancelled = false;

     const loadAndAttemptToPlay = async () => {
         console.log("loadAndAttemptToPlay: Stopping and disposing previous player/transport first.");
         stopAndDisposePlayer(); // Stop existing player, clear transport, reset progress & duration

         if (isCancelled) {
            console.log("loadAndAttemptToPlay: Cancelled before loading.");
            return;
         }

         try {
             console.log(`loadAndAttemptToPlay: Loading track: ${trackToLoad.name}`);
             const newPlayer = await loadPlayer(trackToLoad); // loadPlayer calls setDuration internally
            
             if (isCancelled) {
                 if (newPlayer) newPlayer.dispose();
                 console.log("loadAndAttemptToPlay: Cancelled after loadPlayer resolved.");
                 return;
             }

             playerRef.current = newPlayer;
             // setProgress(0); // Already done by stopAndDisposePlayer

             // After player is loaded and duration state is set by loadPlayer,
             // check the *current* intent to play (isPlayingRef.current).
             if (isPlayingRef.current && playerRef.current && playerRef.current.loaded && playerRef.current.buffer.duration > 0) {
                 console.log(`loadAndAttemptToPlay: Track ${trackToLoad.name} loaded. isPlayingRef is true. Starting transport.`);
                 Tone.Transport.start(Tone.now());
             } else if (playerRef.current && playerRef.current.loaded) {
                 console.log(`loadAndAttemptToPlay: Track ${trackToLoad.name} loaded. isPlayingRef is false or duration is 0. Transport not started.`);
                 // If transport was somehow started but we are not in isPlaying state, ensure it's paused.
                 if (Tone.Transport.state === 'started' && !isPlayingRef.current) {
                     console.log("loadAndAttemptToPlay: Transport was started but isPlayingRef is false. Pausing transport.");
                     Tone.Transport.pause();
                 }
             } else {
                console.warn("loadAndAttemptToPlay: Player not loaded or no buffer duration after loadPlayer.");
                setIsPlaying(false); // Cannot play if player is not properly loaded
             }

         } catch (error) {
             console.error(`Error in loadAndAttemptToPlay for ${trackToLoad.name}:`, error);
             setIsPlaying(false); // Ensure isPlaying is false on error
             // stopAndDisposePlayer will have already reset duration/progress
             if (playerRef.current) { // Clean up potentially partially loaded player
                 playerRef.current.dispose();
                 playerRef.current = null;
             }
         }
     };

     loadAndAttemptToPlay();

     return () => {
         console.log(`useEffect[currentTrackIndex]: Cleanup for index ${currentTrackIndex}, track ${trackToLoad?.name}. Setting isCancelled to true.`);
         isCancelled = true;
         // stopAndDisposePlayer() is called at the beginning of the next run of this effect or on unmount of component.
     };
   // This effect should ONLY re-run if the track itself changes (index or playlist content affecting the current index).
   // It should NOT re-run for isPlaying or duration changes, as those are handled by playPauseToggle and the updateLoop effect respectively.
   // loadPlayer & stopAndDisposePlayer are stable useCallback hooks.
   // setIsPlaying, setDuration, setProgress are stable state setters from useState.
   }, [currentTrackIndex, playlist, loadPlayer, stopAndDisposePlayer, setIsPlaying, setProgress, setDuration]);

   // Separate effect for unmounting the component
    useEffect(() => {
        return () => {
            console.log("MusicPlayer unmounting: Stopping and disposing player/transport.");
            stopAndDisposePlayer();
        };
    }, [stopAndDisposePlayer]); // Include stopAndDisposePlayer in dependency array


   const playPauseToggle = useCallback(async () => {
      await ensureAudioContext();
      if (currentTrackIndex === null && playlist.length > 0) {
          setCurrentTrackIndex(0);
          setIsPlaying(true);
      } else if (playerRef.current && playerRef.current.loaded && duration > 0) {
          if (Tone.Transport.state === 'started') {
              Tone.Transport.pause();
              setIsPlaying(false);
          } else {
              Tone.Transport.start(); // Resume from current position
              setIsPlaying(true);
          }
      } else if (currentTrackIndex !== null) {
          setIsPlaying(true);
      } else {
          console.warn('Play/Pause toggle: Playlist is empty or no track selected.');
      }
   }, [ensureAudioContext, currentTrackIndex, playlist, duration]);


   const selectTrack = useCallback(async (index: number) => {
     console.log(`Selecting track index: ${index}`);
     if (index === currentTrackIndex) {
       console.log("Same track selected, toggling play/pause.");
       playPauseToggle(); // Toggle play/pause if same track
     } else {
       // Different track selected
       await ensureAudioContext();
       setIsPlaying(true); // Set intent to play the new track *before* changing index
       stopAndDisposePlayer(); // Stop current player & transport *before* setting new index
       setCurrentTrackIndex(index); // Change index, useEffect handles loading & starting transport
     }
   }, [currentTrackIndex, ensureAudioContext, playPauseToggle, stopAndDisposePlayer]);


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
    [ensureAudioContext, currentTrackIndex, playlist.length]
  );


   const handlePreviousTrack = useCallback(() => {
        console.log("Handling previous track...");
        // const wasPlaying = isPlaying; // Avoid stale closure
        // setIsPlaying(false); // Let the main loading effect handle isPlaying state
        stopAndDisposePlayer();

        setCurrentTrackIndex(prevIndex => {
            if (prevIndex === null) return playlist.length > 0 ? playlist.length - 1 : null;
            const prev = prevIndex - 1;
            const prevIndexWrapped = prev < 0 ? playlist.length - 1 : prev;
            console.log(`Previous track index: ${prevIndexWrapped}. Current intent to play: ${isPlayingRef.current}`);
            // The main useEffect for currentTrackIndex will load this track
            // and check isPlayingRef.current to decide on starting transport.
            return prevIndexWrapped;
        });
   }, [playlist.length, stopAndDisposePlayer, setCurrentTrackIndex]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    if (isAudioContextStarted && Tone.Destination.volume) {
        const dbVolume = Tone.gainToDb(newVolume);
        Tone.Destination.volume.value = dbVolume;
        console.log(`Volume changed to: ${newVolume} (linear), ${dbVolume.toFixed(2)} dB`);
    } else {
       console.warn("Volume changed but AudioContext/Destination not ready yet.");
    }
  }, [isAudioContextStarted]);

   const handleSeek = useCallback((newProgress: number) => {
       if (playerRef.current && duration > 0 && playerRef.current.loaded) {
            const seekTime = newProgress * duration;
            if (!isNaN(seekTime) && isFinite(seekTime)) {
                setProgress(newProgress);
                Tone.Transport.seconds = seekTime; // Seek the Transport directly
                console.log(`Transport seeked to ${seekTime.toFixed(2)}s (${(newProgress * 100).toFixed(1)}%)`);
            } else {
               console.warn(`Invalid seek time calculation: ${seekTime}`);
            }
       } else {
           console.warn("Seek attempted with no player, invalid duration, or player not loaded.");
           setProgress(newProgress); // Update slider visually anyway
       }
   }, [duration]);


  // Effect for updating progress bar based on Transport time
  useEffect(() => {
    let isActive = true;
    const updateLoop = () => {
      if (!isActive) { // Check if effect is still active
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
        return;
      }

      const currentTrackDuration = durationRef.current; // Use ref for freshest duration

      if (currentTrackDuration <= 0 || isNaN(currentTrackDuration)) {
        // If duration is invalid, ensure progress is 0 unless transport is also at 0 (e.g. initial load)
        if (Tone.Transport.seconds > 0) {
            setProgress(0);
        }
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
        return;
      }

      const currentSeconds = Tone.Transport.seconds;
      let currentProgress = Math.min(Math.max(currentSeconds / currentTrackDuration, 0), 1);

      if (isNaN(currentProgress)) {
        currentProgress = 0; // Sanitize NaN progress, should be rare with duration check above
      }
      
      setProgress(currentProgress);

      // Check for track end (with a small buffer for precision)
      if (Tone.Transport.state === 'started' && currentSeconds >= currentTrackDuration - 0.05) {
        console.log(`UpdateLoop: Track ended. Transport seconds: ${currentSeconds.toFixed(2)}, Duration: ${currentTrackDuration.toFixed(2)}. Auto-playing next.`);
        
        // Call handleNextTrack. This will:
        // 1. Call stopAndDisposePlayer() -> stops transport, disposes player, resets progress/duration via stopAndClearTransport().
        // 2. Call setCurrentTrackIndex() with the next index.
        // This state change will trigger the main track loading useEffect.
        // The main useEffect will see isPlayingRef.current (which should still be true from the finished track)
        // and load and start the new track.
        handleNextTrack(); 

        // Stop this current animation frame loop.
        // A new loop will be started by the updateLoop's useEffect if the new track starts playing.
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = undefined;
        }
        return; // Important to exit the current loop iteration.
      }

      // Continue loop if transport is still started
      if (Tone.Transport.state === 'started') {
        animationFrameRef.current = requestAnimationFrame(updateLoop);
      } else {
        // If transport is not 'started' (e.g., paused, stopped), clear any pending animation frame
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = undefined;
        }
        // Update progress one last time when paused/stopped to reflect exact position
        const finalSeconds = Tone.Transport.seconds;
        const finalProgress = Math.min(Math.max(finalSeconds / currentTrackDuration, 0), 1);
        if (!isNaN(finalProgress)) {
          setProgress(finalProgress);
        }
      }
    };

    if (isPlaying && Tone.Transport.state === 'started') {
      // Only start the loop if user intends to play AND transport is actually running
      console.log(`UpdateLoop useEffect: Starting animation frame loop. isPlaying: ${isPlaying}, Duration: ${durationRef.current.toFixed(2)}`);
      animationFrameRef.current = requestAnimationFrame(updateLoop);
    } else {
      // If not playing or transport not started, ensure loop is stopped.
      // Also, update progress once to reflect current state (e.g., after seek, manual pause, or initial load before play)
      // console.log(`UpdateLoop useEffect: Not starting/stopping loop. isPlaying: ${isPlaying}, Transport.state: ${Tone.Transport.state}`);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
      
      const currentTrackDuration = durationRef.current;
      if (currentTrackDuration > 0 && !isNaN(currentTrackDuration)) {
          const currentSeconds = Tone.Transport.seconds;
          const calculatedProgress = Math.min(Math.max(currentSeconds / currentTrackDuration, 0), 1);
          if (!isNaN(calculatedProgress)) {
              setProgress(calculatedProgress);
          }
      } else if (Tone.Transport.seconds === 0) { // Handles initial state before duration is known
          setProgress(0);
      }
    }

    return () => {
      isActive = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
        // console.log("UpdateLoop useEffect: Cleanup, cancelled animation frame.");
      }
    };
  // isPlaying: to start/stop the loop.
  // duration: to re-evaluate if loop conditions change or for initial one-off progress set.
  // setProgress, setIsPlaying are stable setters from useState.
  // handleNextTrack is a dependency because it's called by the loop.
  }, [isPlaying, duration, setProgress, setIsPlaying, handleNextTrack]);


  const currentTrack = currentTrackIndex !== null && currentTrackIndex < playlist.length
     ? playlist[currentTrackIndex]
     : null;

  useEffect(() => {
    console.log("MusicPlayer: isPlaying state changed to:", isPlaying);
  }, [isPlaying]);

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

  useEffect(() => {
    // Eagerly initialize analyser and AudioContext on mount
    const init = async () => {
      try {
        await Tone.start(); // Attempt to start AudioContext automatically
      } catch (e) {
        // Ignore errors, fallback to overlay if needed
      }
      if (Tone.context.state !== 'running') {
        setShowStartOverlay(true);
      } else {
        setShowStartOverlay(false);
      }
      if (!analyserRef.current) {
        analyserRef.current = new Tone.Analyser('fft', 1024);
        setAnalyser(analyserRef.current);
        Tone.Destination.volume.value = Tone.gainToDb(volumeRef.current);
        console.log('Tone.js Analyser created and volume set.');
      }
      setAudioContextState(Tone.context.state);
    };
    init();
    // Listen for AudioContext state changes
    const handler = () => setAudioContextState(Tone.context.state);
    Tone.context.on('statechange', handler);
    return () => {
      Tone.context.off('statechange', handler);
    };
  // Only run on mount and unmount (or if Tone.context itself could be replaced, which is not the case here)
  // Volume is handled by handleVolumeChange for dynamic updates, and set once on analyser creation if needed.
  }, []);

  const handleStartVisualizer = async () => {
    await Tone.start();
    setShowStartOverlay(false);
    setAudioContextState(Tone.context.state);
  };

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
        setIsPlaying(false);
        setCurrentTrackIndex(newList.length > 0 ? 0 : null);
      } else if (idx < currentTrackIndex!) {
        setCurrentTrackIndex(i => (i !== null ? i - 1 : null));
      }
      return newList;
    });
  };

  return (
    <>
      {mounted && (
        <SidebarProvider>
          <div className="flex flex-row h-full w-full min-h-screen overflow-hidden bg-background">
            {/* Sidebar: Playlist Navigation */}
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
            {/* Main Content */}
            <div className="flex flex-col flex-1 h-full w-full">
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
            </div>
          </div>
        </SidebarProvider>
      )}
    </>
  );
}