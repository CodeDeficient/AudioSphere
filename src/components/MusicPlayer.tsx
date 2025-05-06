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
  file: File;
  url: string;
}

export default function MusicPlayer() {
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false); // Represents user's intent / transport state
  const [volume, setVolume] = useState(0.5);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isAudioContextStarted, setIsAudioContextStarted] = useState(false);


  const analyserRef = useRef<Tone.Analyser | null>(null);
  const playerRef = useRef<Tone.Player | null>(null);
  const animationFrameRef = useRef<number>();
  // const trackEndTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Might not need with transport


  const ensureAudioContext = useCallback(async () => {
    if (!isAudioContextStarted && Tone.context.state !== 'running') {
      console.log('Starting Tone.js AudioContext...');
      await Tone.start();
      console.log('AudioContext started.');
      setIsAudioContextStarted(true);
      if (!analyserRef.current) {
        analyserRef.current = new Tone.Analyser('fft', 1024);
        Tone.Destination.volume.value = Tone.gainToDb(volume);
        console.log('Tone.js Analyser created and volume set.');
        console.log("analyser created", analyserRef.current)
      }
    } else if (!analyserRef.current && Tone.context.state === 'running') { 

       analyserRef.current = new Tone.Analyser('fft', 1024);
       Tone.Destination.volume.value = Tone.gainToDb(volume);
       console.log('Tone.js Analyser created post-context start.');
    }
  }, [isAudioContextStarted, volume]);


  const stopAndClearTransport = useCallback(() => {
    console.log("Stopping and clearing Transport.");
    if (Tone.Transport.state !== 'stopped') {
        Tone.Transport.stop();
    }
    Tone.Transport.cancel(0); // Clear scheduled events
    Tone.Transport.seconds = 0; // Reset transport time
    setProgress(0); // Reset visual progress
  }, []);

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
    const wasPlaying = isPlaying; // Remember if it was playing
    setIsPlaying(false); // Intend to stop while loading
    stopAndDisposePlayer(); // Stop player and transport before changing index

    setCurrentTrackIndex(prevIndex => {
      if (prevIndex === null) return playlist.length > 0 ? 0 : null;
      const next = prevIndex + 1;
      const nextIndex = next >= playlist.length ? 0 : next;
       console.log(`Next track index: ${nextIndex}`);
      // The useEffect will handle starting playback if wasPlaying is true
      setIsPlaying(wasPlaying); // Set intent to play the next track if the previous one was playing
       return nextIndex;
    });
  }, [playlist.length, stopAndDisposePlayer, isPlaying]); // Added isPlaying back


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

   // Effect to load and potentially play when currentTrackIndex changes
   useEffect(() => {
     if (currentTrackIndex === null || currentTrackIndex >= playlist.length) {
         console.log("useEffect[currentTrackIndex]: Index invalid or out of bounds, stopping player.");
         stopAndDisposePlayer(); // Stop everything if index becomes invalid
         setIsPlaying(false);
         setDuration(0);
         setProgress(0);
         return;
     }

     const trackToLoad = playlist[currentTrackIndex];
     console.log(`useEffect[currentTrackIndex]: Preparing to load track ${trackToLoad.name} at index ${currentTrackIndex}`);
     let newPlayer: Tone.Player | null = null;
     let isCancelled = false;
     const wasPlayingIntended = isPlaying; // Capture the intended state *before* loading

     const loadAndSetPlayer = async () => {
         console.log("loadAndSetPlayer: Stopping and disposing previous player/transport.");
         stopAndDisposePlayer(); // Ensure clean state before loading
         if (isCancelled) return;

         try {
             newPlayer = await loadPlayer(trackToLoad);
             if (isCancelled) {
                 console.log("loadAndSetPlayer: Load completed but effect was cancelled. Disposing new player.");
                  // Check if newPlayer is not null before disposing
                  if (newPlayer) newPlayer.dispose();
                 return;
             }

             playerRef.current = newPlayer; // Assign the newly loaded player
             console.log(`loadAndSetPlayer: Player for ${trackToLoad.name} loaded and set as current.`);
             setProgress(0); // Reset visual progress

             // Start transport if it was intended to be playing
             if (isPlaying) {
                 console.log(`loadAndSetPlayer: Starting transport for ${trackToLoad.name} because current isPlaying is true.`);
                  if (playerRef.current?.loaded && playerRef.current?.buffer && duration > 0) {
                     Tone.Transport.start(Tone.now()); // Start transport immediately
                     console.log(`loadAndSetPlayer: Transport started for ${trackToLoad.name}`);
                  } else {
                      console.warn("loadAndSetPlayer: Tried to start transport, but player wasn't ready or duration invalid. Setting isPlaying to false.");
                      setIsPlaying(false); // Revert state if can't start
                  }
             } else {
                  console.log("loadAndSetPlayer: Current isPlaying is false, transport not started.");
                  // Ensure transport is not in a 'started' state if isPlaying is false
                  if (Tone.Transport.state === 'started') {
                      Tone.Transport.pause(); 
                  }
             }

         } catch (error) {
              if (isCancelled) {
                 console.log("loadAndSetPlayer: Error occurred after cancellation:", error);
                 return;
              }
             console.error("loadAndSetPlayer: Error loading track:", error);
             setCurrentTrackIndex(null); // Reset index on error
             setIsPlaying(false);
             setDuration(0);
             setProgress(0);
         }
     };

     loadAndSetPlayer();

     return () => {
         console.log(`useEffect[currentTrackIndex]: Cleanup triggered for index ${currentTrackIndex}`);
         isCancelled = true;
         // Don't stop/dispose player here, as a new effect might be about to load the *next* track.
         // The stopAndDisposePlayer call at the beginning of loadAndSetPlayer handles cleanup.
         // However, if the component itself unmounts, we *should* stop everything.
         // This cleanup only runs when currentTrackIndex changes, not on unmount.
     };
   }, [currentTrackIndex, playlist, loadPlayer, stopAndDisposePlayer]); // REMOVED isPlaying and duration

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
          // No track selected, select first and start transport
          console.log("Play toggled: No track selected, selecting first and playing.");
          setCurrentTrackIndex(0); // Trigger useEffect to load and schedule
          setIsPlaying(true); // Set intent, useEffect will start transport if load succeeds
      } else if (playerRef.current && playerRef.current.loaded && duration > 0) {
          // Player is loaded and ready
          if (Tone.Transport.state === 'started') {
              // Currently playing, so pause transport
              Tone.Transport.pause();
              setIsPlaying(false);
              console.log('Transport paused');
          } else {
              // Currently paused or stopped, so start transport
              Tone.Transport.start(Tone.now()); // Start from current transport time
              setIsPlaying(true);
              console.log(`Transport ${Tone.Transport.state === 'stopped' ? 'restarted' : 'resumed'} from ${Tone.Transport.seconds.toFixed(2)}s`);
          }
      } else if (currentTrackIndex !== null) {
         // Track selected but player not ready? Set intent to play and let useEffect handle it.
         console.log('Play toggled: Player not loaded/ready, setting intent to play.');
         setIsPlaying(true);
         // Trigger a reload if necessary? (Maybe handled by useEffect already)
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
            const newTracks: Track[] = Array.from(files).map((file) => {
                const url = URL.createObjectURL(file);
                const id = `${file.name}-${Date.now()}-${Math.random()}`;
                return { id, name: file.name, file, url };
            });

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
        const wasPlaying = isPlaying;
        setIsPlaying(false); // Intent to stop while loading
        stopAndDisposePlayer();

        setCurrentTrackIndex(prevIndex => {
            if (prevIndex === null) return playlist.length > 0 ? playlist.length - 1 : null;
            const prev = prevIndex - 1;
            const prevIndexWrapped = prev < 0 ? playlist.length - 1 : prev;
            console.log(`Previous track index: ${prevIndexWrapped}`);
            setIsPlaying(wasPlaying); // Set intent based on previous state
            return prevIndexWrapped;
        });
   }, [playlist.length, stopAndDisposePlayer, isPlaying]); // Added isPlaying back

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
        if (!isActive || Tone.Transport.state !== 'started' || duration <= 0 || isNaN(duration)) {
            // Stop loop if transport isn't started or duration is invalid
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = undefined;
            // Check if stopped *because* it reached the end
            if (Tone.Transport.state !== 'started' && Tone.Transport.seconds >= duration - 0.1 && duration > 0) {
                 console.log("Progress loop: Detected track end based on Transport time.");
                 handleNextTrack(); // Trigger next track
            }
            return;
        }

        const currentSeconds = Tone.Transport.seconds;
        const currentProgress = Math.min(Math.max(currentSeconds / duration, 0), 1);

        if (!isNaN(currentProgress)) {
            setProgress(currentProgress);
        } else {
            console.warn("Calculated progress is NaN");
        }

        animationFrameRef.current = requestAnimationFrame(updateLoop);
    };

    if (Tone.Transport.state === 'started') {
        // Only start loop if transport is already started (controlled by playPauseToggle)
        animationFrameRef.current = requestAnimationFrame(updateLoop);
    } else {
        // Ensure loop is stopped if transport isn't running
         if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = undefined;
         }
    }

    return () => {
        isActive = false;
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = undefined;
        }
    };
  }, [isPlaying, duration, handleNextTrack]); // isPlaying reflects Transport state intent


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
        .then(data => {
          if (Array.isArray(data.files) && data.files.length > 0) {
            const tracks = data.files.map((filePath: string, idx: number) => {
              const name = filePath.split('/').pop() || `Track ${idx + 1}`;
              return {
                id: `default-${idx}-${name}`,
                name,
                file: undefined,
                url: `/${filePath}`,
              };
            });
            setPlaylist(tracks);
            setCurrentTrackIndex(0); // Optionally auto-select first track
          }
        })
        .catch(e => console.error('Failed to fetch default audio list:', e));
    }
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Top Section: Visualizer */}
      <div className="flex-grow h-2/3 relative">
        {/* Blurred background for sphere */}
        <div className="absolute inset-0 backdrop-blur-xl bg-black/10"></div> {/* Added for sphere background blur */}
        <React.Suspense fallback={<Skeleton className="w-full h-full bg-muted/30" />}>
            <ClientOnly fallback={<Skeleton className="w-full h-full bg-muted/30" />}>
                 {/* Ensure SphereVisualizer has a transparent background itself if needed */}
                 {analyserRef.current && <SphereVisualizer analyserNode={analyserRef.current} isPlaying={isPlaying} />}
                 {!analyserRef.current && <Skeleton className="w-full h-full bg-muted/30" />}
            </ClientOnly>
        </React.Suspense>
      </div>

      {/* Bottom Section: Controls and Playlist */}
      <div className="flex-shrink-0 h-1/3 bg-transparent text-card-foreground p-4 overflow-hidden relative"> {/* Changed bg-card to bg-transparent */}
         {/* Glassmorphic card for controls */}
         <Card className="h-full flex flex-col bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg rounded-xl"> {/* Applied glassmorphism styles */}
            <CardContent className="flex flex-col flex-grow p-4 overflow-hidden">

             {/* File Upload */}
              <div className="mb-4 flex items-center justify-center">
                  <label htmlFor="audio-upload" className="cursor-pointer">
                      <Button asChild variant="outline" onClick={ensureAudioContext}>
                          <span>Upload Audio</span>
                      </Button>
                      <Input
                         id="audio-upload"
                         type="file"
                         accept=".mp3, .wav, .ogg, .flac, .m4a"
                         multiple
                         onChange={handleFileUpload}
                         className="hidden"
                      />
                   </label>
               </div>

               <ClientOnly>
                 {/* Controls */}
                 <PlaybackControls
                     isPlaying={isPlaying} // Reflects transport state
                     onPlayPause={playPauseToggle}
                     onNext={handleNextTrack}
                     onPrevious={handlePreviousTrack}
                     volume={volume}
                     onVolumeChange={handleVolumeChange}
                     progress={progress} // Based on transport time
                     duration={duration}
                     onSeek={handleSeek} // Seeks transport time
                     currentTrackName={currentTrack?.name}
                 />

                 {/* Playlist */}
                 <div className="flex-grow overflow-y-auto mt-4">
                     <Playlist
                         tracks={playlist}
                         currentTrackIndex={currentTrackIndex}
                         onSelectTrack={selectTrack}
                         isPlaying={isPlaying} // Reflects transport state
                     />
                 </div>
               </ClientOnly>

            </CardContent>
         </Card>
      </div>
    </div>
  );
}