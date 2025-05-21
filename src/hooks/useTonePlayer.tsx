// src/hooks/useTonePlayer.tsx
'use client';

import { useState, useRef, useCallback, useEffect, Dispatch, SetStateAction } from 'react';
import * as Tone from 'tone';
import { useToast } from '@/hooks/use-toast';

// Define Track interface
export interface Track {
  id: string;
  name: string;
  file: File | undefined;
  url: string;
  title?: string;
  artist?: string;
  album?: string;
}

export interface UseTonePlayerProps {
  playlist: Track[];
  currentTrackIndex: number | null;
  setCurrentTrackIndex: Dispatch<SetStateAction<number | null>>;
  setPlaylist: Dispatch<SetStateAction<Track[]>>; // Keep for playlist modification if needed by hook, e.g. error scenarios
  initialVolume?: number;
}

export interface UseTonePlayerReturn {
  isPlaying: boolean;
  progress: number;
  duration: number;
  analyser: Tone.Analyser | null;
  audioContextState: string;
  showStartOverlay: boolean;
  currentTrack: Track | null;
  volume: number;
  playPauseToggle: () => Promise<void>;
  handleNextTrack: () => void;
  handlePreviousTrack: () => void;
  handleVolumeChange: (newVolume: number) => void;
  handleSeek: (newProgress: number) => void;
  handleStartVisualizer: () => Promise<void>;
  ensureAudioContext: () => Promise<void>;
  selectTrack: (index: number) => Promise<void>;
}

export function useTonePlayer({
  playlist,
  currentTrackIndex,
  setCurrentTrackIndex,
  setPlaylist, // Consumed but not directly used in this snippet, good for future
  initialVolume = 0.5,
}: UseTonePlayerProps): UseTonePlayerReturn {
  const { toast } = useToast();

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(initialVolume);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isAudioContextStarted, setIsAudioContextStarted] = useState(false); // Internal state
  const [analyser, setAnalyser] = useState<Tone.Analyser | null>(null);
  const analyserRef = useRef<Tone.Analyser | null>(null);
  const [audioContextState, setAudioContextState] = useState<string>(Tone.context.state);
  const [showStartOverlay, setShowStartOverlay] = useState(true);

  const playerRef = useRef<Tone.Player | null>(null);
  const animationFrameRef = useRef<number>();
  
  const isPlayingRef = useRef(isPlaying);
  const durationRef = useRef(duration);
  const volumeRef = useRef(volume);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { durationRef.current = duration; }, [duration]);
  useEffect(() => {
    volumeRef.current = volume;
    if (isAudioContextStarted && Tone.Destination.volume) {
      Tone.Destination.volume.value = Tone.gainToDb(volume);
    }
  }, [volume, isAudioContextStarted]);

  const ensureAudioContext = useCallback(async () => {
    if (!isAudioContextStarted && Tone.context.state !== 'running') {
      try {
        await Tone.start();
        setIsAudioContextStarted(true);
        setAudioContextState(Tone.context.state);
        setShowStartOverlay(false);
        if (!analyserRef.current) {
          analyserRef.current = new Tone.Analyser('fft', 1024);
          setAnalyser(analyserRef.current);
          Tone.Destination.volume.value = Tone.gainToDb(volumeRef.current);
        }
      } catch (error) {
        toast({
          title: "Audio Initialization Error",
          description: "Could not start audio. Please interact with the page and try again.",
          variant: "destructive",
        });
      }
    } else if (Tone.context.state === 'running') {
      setIsAudioContextStarted(true);
      setShowStartOverlay(false);
      if (!analyserRef.current) {
        analyserRef.current = new Tone.Analyser('fft', 1024);
        setAnalyser(analyserRef.current);
        Tone.Destination.volume.value = Tone.gainToDb(volumeRef.current);
      }
    }
  }, [isAudioContextStarted, toast]);

  const stopAndClearTransport = useCallback(() => {
    if (Tone.Transport.state !== 'stopped') {
      Tone.Transport.stop();
    }
    Tone.Transport.cancel(0);
    Tone.Transport.seconds = 0;
    setProgress(0);
    setDuration(0);
  }, [setProgress, setDuration]);

  const stopAndDisposePlayer = useCallback(() => {
    stopAndClearTransport();
    if (playerRef.current) {
      if (playerRef.current.state === 'started') {
        try { playerRef.current.stop(); } catch (e) { /* ignored */ }
      }
      playerRef.current.dispose();
      playerRef.current = null;
    }
  }, [stopAndClearTransport]);

  const loadPlayer = useCallback(async (track: Track): Promise<Tone.Player> => {
    await ensureAudioContext();
    return new Promise((resolve, reject) => {
      const player = new Tone.Player({
        url: track.url,
        onload: () => {
          if (analyserRef.current) {
            player.connect(analyserRef.current);
            player.toDestination();
          } else {
            player.toDestination();
          }
          setDuration(player.buffer.duration);
          player.sync().start(0);
          resolve(player);
        },
        onerror: (error) => {
          toast({
            title: "Playback Error",
            description: `Could not load track: ${track.name}. The file might be corrupted or unsupported.`,
            variant: "destructive",
          });
          reject(new Error(`Failed to load track: ${track.name}`));
        },
      });
    });
  }, [ensureAudioContext, toast, setDuration]);

  useEffect(() => {
    if (currentTrackIndex === null || currentTrackIndex >= playlist.length) {
      stopAndDisposePlayer();
      setIsPlaying(false);
      return;
    }

    const trackToLoad = playlist[currentTrackIndex];
    let isCancelled = false;

    const loadAndAttemptToPlay = async () => {
      stopAndDisposePlayer();
      if (isCancelled) return;

      try {
        const newPlayer = await loadPlayer(trackToLoad);
        if (isCancelled) {
          if (newPlayer) newPlayer.dispose();
          return;
        }
        playerRef.current = newPlayer;

        if (isPlayingRef.current && playerRef.current && playerRef.current.loaded && playerRef.current.buffer.duration > 0) {
          Tone.Transport.start(Tone.now());
        } else if (playerRef.current && playerRef.current.loaded) {
          if (Tone.Transport.state === 'started' && !isPlayingRef.current) {
            Tone.Transport.pause();
          }
        } else {
          setIsPlaying(false); 
        }
      } catch (error) {
        setIsPlaying(false);
        // Error toast is handled by loadPlayer
        if (playerRef.current) {
          playerRef.current.dispose();
          playerRef.current = null;
        }
      }
    };

    loadAndAttemptToPlay();

    return () => {
      isCancelled = true;
    };
  }, [currentTrackIndex, playlist, loadPlayer, stopAndDisposePlayer, setIsPlaying]);

  useEffect(() => {
    return () => {
      stopAndDisposePlayer(); // Cleanup on unmount
    };
  }, [stopAndDisposePlayer]);

  const playPauseToggle = useCallback(async () => {
    await ensureAudioContext();
    if (currentTrackIndex === null && playlist.length > 0) {
      setCurrentTrackIndex(0); // This will trigger the load useEffect
      setIsPlaying(true); // Set intent to play
    } else if (playerRef.current && playerRef.current.loaded && durationRef.current > 0) {
      if (Tone.Transport.state === 'started') {
        Tone.Transport.pause();
        setIsPlaying(false);
      } else {
        Tone.Transport.start();
        setIsPlaying(true);
      }
    } else if (currentTrackIndex !== null) { // Track selected but not loaded/ready, set intent
      setIsPlaying(true); // The useEffect for loading will pick this up
    } else {
       toast({ title: "Playlist Empty", description: "Upload some tracks to start playing.", variant: "default" });
    }
  }, [ensureAudioContext, currentTrackIndex, playlist, setCurrentTrackIndex, setIsPlaying, toast]);
  
  const handleNextTrack = useCallback(() => {
    stopAndDisposePlayer();
    setCurrentTrackIndex(prevIndex => {
      if (prevIndex === null) return playlist.length > 0 ? 0 : null;
      const next = prevIndex + 1;
      return next >= playlist.length ? 0 : next;
    });
  }, [playlist.length, stopAndDisposePlayer, setCurrentTrackIndex]);

  const handlePreviousTrack = useCallback(() => {
    stopAndDisposePlayer();
    setCurrentTrackIndex(prevIndex => {
      if (prevIndex === null) return playlist.length > 0 ? playlist.length - 1 : null;
      const prev = prevIndex - 1;
      return prev < 0 ? playlist.length - 1 : prev;
    });
  }, [playlist.length, stopAndDisposePlayer, setCurrentTrackIndex]);
  
  const selectTrack = useCallback(async (index: number) => {
    await ensureAudioContext();
    if (index === currentTrackIndex) {
      playPauseToggle();
    } else {
      setIsPlaying(true); // Set intent to play new track
      // stopAndDisposePlayer(); // This will be called by the main track loading useEffect
      setCurrentTrackIndex(index);
    }
  }, [currentTrackIndex, ensureAudioContext, playPauseToggle, setCurrentTrackIndex, setIsPlaying]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume); // This triggers the volumeRef.current update via useEffect
  }, [setVolume]);

  const handleSeek = useCallback((newProgress: number) => {
    if (playerRef.current && durationRef.current > 0 && playerRef.current.loaded) {
      const seekTime = newProgress * durationRef.current;
      if (!isNaN(seekTime) && isFinite(seekTime)) {
        setProgress(newProgress); // Visual update
        Tone.Transport.seconds = seekTime;
      }
    } else {
      setProgress(newProgress); // Update slider visually anyway
    }
  }, [setProgress]);

  useEffect(() => {
    let isActive = true;
    const updateLoop = () => {
      if (!isActive) {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
        return;
      }

      const currentTrackDuration = durationRef.current;
      if (currentTrackDuration <= 0 || isNaN(currentTrackDuration)) {
        if (Tone.Transport.seconds > 0) setProgress(0);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
        return;
      }

      const currentSeconds = Tone.Transport.seconds;
      let currentProgress = Math.min(Math.max(currentSeconds / currentTrackDuration, 0), 1);
      if (isNaN(currentProgress)) currentProgress = 0;
      
      setProgress(currentProgress);

      if (Tone.Transport.state === 'started' && currentSeconds >= currentTrackDuration - 0.05) {
        handleNextTrack(); 
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
        return;
      }

      if (Tone.Transport.state === 'started') {
        animationFrameRef.current = requestAnimationFrame(updateLoop);
      } else {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
        const finalSeconds = Tone.Transport.seconds;
        const finalProgress = Math.min(Math.max(finalSeconds / currentTrackDuration, 0), 1);
        if (!isNaN(finalProgress)) setProgress(finalProgress);
      }
    };

    if (isPlaying && Tone.Transport.state === 'started') {
      animationFrameRef.current = requestAnimationFrame(updateLoop);
    } else {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
      const currentTrackDuration = durationRef.current;
      if (currentTrackDuration > 0 && !isNaN(currentTrackDuration)) {
        const currentSeconds = Tone.Transport.seconds;
        const calculatedProgress = Math.min(Math.max(currentSeconds / currentTrackDuration, 0), 1);
        if (!isNaN(calculatedProgress)) setProgress(calculatedProgress);
      } else if (Tone.Transport.seconds === 0) {
        setProgress(0);
      }
    }
    return () => {
      isActive = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    };
  }, [isPlaying, setProgress, handleNextTrack]);

  const currentTrack = currentTrackIndex !== null && currentTrackIndex < playlist.length
     ? playlist[currentTrackIndex]
     : null;

  useEffect(() => {
    const initAudio = async () => {
      // Try to start context early, but ensure UI can trigger it if blocked
      try {
        await Tone.start();
        setIsAudioContextStarted(true);
        setAudioContextState(Tone.context.state);
        setShowStartOverlay(false);
      } catch {
        // Will remain true, user interaction needed via handleStartVisualizer
        setShowStartOverlay(true); 
      } finally {
        // Ensure analyser is ready if context is running (either started now or before)
        if (Tone.context.state === 'running' && !analyserRef.current) {
            analyserRef.current = new Tone.Analyser('fft', 1024);
            setAnalyser(analyserRef.current);
            Tone.Destination.volume.value = Tone.gainToDb(volumeRef.current);
        }
      }
    };
    initAudio();
    
    const handleContextChange = () => {
      setAudioContextState(Tone.context.state);
      if (Tone.context.state === 'running') {
        setShowStartOverlay(false);
        setIsAudioContextStarted(true);
         if (!analyserRef.current) { // Ensure analyser is created if context starts later
            analyserRef.current = new Tone.Analyser('fft', 1024);
            setAnalyser(analyserRef.current);
            Tone.Destination.volume.value = Tone.gainToDb(volumeRef.current);
        }
      }
    };
    Tone.context.on('statechange', handleContextChange);
    return () => {
      Tone.context.off('statechange', handleContextChange);
    };
  }, []); // Run once on mount

  const handleStartVisualizer = useCallback(async () => {
    await ensureAudioContext(); // This will attempt to start Tone, set states, and create analyser
  }, [ensureAudioContext]);

  return {
    isPlaying,
    progress,
    duration,
    analyser,
    audioContextState,
    showStartOverlay,
    currentTrack,
    volume,
    playPauseToggle,
    handleNextTrack,
    handlePreviousTrack,
    handleVolumeChange,
    handleSeek,
    handleStartVisualizer,
    ensureAudioContext,
    selectTrack,
  };
}
