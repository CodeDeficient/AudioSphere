'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import * as THREE from 'three';
import * as Tone from 'tone';
import butterchurn from 'butterchurn';
import butterchurnPresets from 'butterchurn-presets';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface SphereVisualizerProps {
  analyserNode: Tone.Analyser | null;
  isPlaying: boolean;
}

type Tier = 'off' | 'extremely-low' | 'low' | 'medium' | 'high' | 'auto';

const getStoredTier = (): Tier | null => {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem('visualizerTier');
    if (!data) return null;
    const parsed = JSON.parse(data);
    if (parsed && typeof parsed.tier === 'string' && ['off','extremely-low','low','medium','high','auto'].includes(parsed.tier)) {
      return parsed.tier as Tier;
    }
    return null;
  } catch {
    return null;
  }
};

const SphereVisualizer: React.FC<SphereVisualizerProps> = ({ analyserNode, isPlaying }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const visualizerRef = useRef<butterchurn.Visualizer | null>(null); // Butterchurn instance
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number>();
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sphereRef = useRef<THREE.Mesh | null>(null);
  const presetsRef = useRef<Record<string, object> | null>(null); // Store presets
  const [presetKeys, setPresetKeys] = useState<string[]>([]);
  const [currentPresetKey, setCurrentPresetKey] = useState<string | null>(null);
  const isPlayingRef = useRef(isPlaying); // Ref to hold the latest isPlaying
  const [tier, setTier] = useState<Tier>(() => getStoredTier() as Tier || 'auto');
  const [benchmarking, setBenchmarking] = useState(false);
  const [fpsResult, setFpsResult] = useState<number | null>(null);

  // Effect to update the ref when the prop changes
  useEffect(() => {
    isPlayingRef.current = isPlaying;
    // console.log(`SphereVisualizer: isPlayingRef updated to: ${isPlayingRef.current}`); // Optional log
  }, [isPlaying]);

  const handlePresetChange = useCallback((newPresetKey: string) => {
    if (visualizerRef.current && presetsRef.current && presetsRef.current[newPresetKey]) {
      setCurrentPresetKey(newPresetKey);
      visualizerRef.current.loadPreset(presetsRef.current[newPresetKey], 0.5); // Blend time 0.5 seconds
      console.log(`Changed to preset: ${newPresetKey}`);
    } else {
        console.warn(`Preset key "${newPresetKey}" not found or visualizer not ready.`);
    }
  }, []);

  const setStoredTier = (tier: string, fps: number) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('visualizerTier', JSON.stringify({ tier, fps, date: Date.now() }));
  };

  const runBenchmark = async (onResult: (tier: string, fps: number) => void) => {
    let frames = 0;
    const start = performance.now();
    const duration = 2000; // 2 seconds
    function loop() {
      frames++;
      if (performance.now() - start < duration) {
        requestAnimationFrame(loop);
      } else {
        const fps = frames / (duration / 1000);
        let tier: Tier = 'high';
        if (fps < 18) tier = 'extremely-low';
        else if (fps < 30) tier = 'low';
        else if (fps < 50) tier = 'medium';
        onResult(tier, fps);
      }
    }
    loop();
  };

  const TIER_SETTINGS: Record<Exclude<Tier, 'auto'>, { pixelRatio: number; segments: number; canvasSize: number }> = {
    off: { pixelRatio: 1, segments: 16, canvasSize: 256 }, // segments/canvasSize unused
    'extremely-low': { pixelRatio: 1, segments: 16, canvasSize: 256 },
    low:   { pixelRatio: 1, segments: 16, canvasSize: 512 },
    medium:{ pixelRatio: 1.5, segments: 32, canvasSize: 512 },
    high:  { pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 2, segments: 64, canvasSize: 512 },
  };

  // Run benchmark on first load if no tier is stored
  useEffect(() => {
    if (tier === 'auto') {
      setBenchmarking(true);
      runBenchmark((detectedTier, fps) => {
        setTier(detectedTier as Tier);
        setStoredTier(detectedTier, fps);
        setFpsResult(fps);
        setBenchmarking(false);
      });
    }
  }, [tier]);

  // Allow user to override tier
  const handleTierChange = (newTier: string) => {
    if (['off','extremely-low','low','medium','high','auto'].includes(newTier)) {
      setTier(newTier as Tier);
      setStoredTier(newTier, fpsResult || 0);
    }
  };

  useEffect(() => {
    console.log("SphereVisualizer isPlaying:", isPlaying);
    if (!mountRef.current || !analyserNode) return;

    const mount = mountRef.current;

    // --- Three.js Setup ---
    sceneRef.current = new THREE.Scene();
    cameraRef.current = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    rendererRef.current = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // alpha true for transparent background
    rendererRef.current.setSize(mount.clientWidth, mount.clientHeight);
    const settings = TIER_SETTINGS[tier === 'auto' ? 'high' : tier as Exclude<Tier, 'auto'>];
    rendererRef.current.setPixelRatio(settings.pixelRatio);
    rendererRef.current.setClearColor(0x000000, 0); // Set clear color to black with 0 alpha
    mount.appendChild(rendererRef.current.domElement);

    // --- Butterchurn Setup ---
    canvasRef.current = document.createElement('canvas');
    canvasRef.current.width = settings.canvasSize;
    canvasRef.current.height = settings.canvasSize;
    const audioContext = Tone.context.rawContext as AudioContext; // Get underlying AudioContext

     if (!audioContext) {
       console.error("AudioContext not available from Tone.context");
       return;
     }


    try {
        visualizerRef.current = butterchurn.createVisualizer(audioContext, canvasRef.current, {
          width: settings.canvasSize,
          height: settings.canvasSize,
          pixelRatio: 1,
          textureRatio: 1,
        });
        console.log("Butterchurn visualizer created");

         // Connect analyser node to Butterchurn
        visualizerRef.current.connectAudio(analyserNode.input); // Connect Tone.Analyser's input node
        console.log("Butterchurn connected to analyser:", analyserNode);

        // Load Presets
        const loadedPresets = butterchurnPresets.getPresets();
        presetsRef.current = loadedPresets;

        // Add null check before accessing loadedPresets
        if (loadedPresets) {
          const keys = Object.keys(loadedPresets);
          setPresetKeys(keys);
          console.log("Available preset keys:", JSON.stringify(keys)); // MODIFIED: Uncommented to see all preset names

          let forcedSimplePreset = null;
          if (tier === 'low' || tier === 'extremely-low') {
            // Try to find a simple preset
            const simpleKey = keys.find(k => /simple|minimal|basic|test|debug/i.test(k));
            if (simpleKey) forcedSimplePreset = simpleKey;
          }
          const initialPresetKey = forcedSimplePreset || keys[0];
          setCurrentPresetKey(initialPresetKey);
          if (visualizerRef.current) {
            visualizerRef.current.loadPreset(loadedPresets[initialPresetKey], 0);
            console.log("SphereVisualizer: Butterchurn presets loaded, initial preset selected:", initialPresetKey);
          }
        } else {
           console.warn("butterchurnPresets.getPresets() returned null or undefined.");
        }


    } catch (error) {
         console.error("Error creating Butterchurn visualizer:", error);
         return; // Stop execution if visualizer fails
    }


    // --- Three.js Sphere ---
    textureRef.current = new THREE.CanvasTexture(canvasRef.current);
    textureRef.current.minFilter = THREE.LinearFilter;
    textureRef.current.magFilter = THREE.LinearFilter;
    const geometry = new THREE.SphereGeometry(5, settings.segments, settings.segments);
    const material = new THREE.MeshBasicMaterial({
        map: textureRef.current,
        side: THREE.DoubleSide, // Render both sides to see inside if needed
        transparent: true, // Allow transparency if the texture has it,
    });
    sphereRef.current = new THREE.Mesh(geometry, material);
    sceneRef.current.add(sphereRef.current);

    cameraRef.current.position.z = 10;

    console.log("SphereVisualizer: Main useEffect setup complete."); // ADDED LOG
    const firstRenderDoneRef = { current: false }; // ADDED: Ref to track first render

    // --- Animation Loop ---
    const BUTTERCHURN_FRAME_SKIP: Record<Exclude<Tier, 'auto'>, number> = {
      off: 99999, // never render
      'extremely-low': 7, // render every 8th frame
      low: 3,             // every 4th
      medium: 1,          // every 2nd
      high: 0,            // every frame
    };
    let butterchurnFrame = 0;
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      // Throttle Butterchurn render based on tier
      const skip = BUTTERCHURN_FRAME_SKIP[tier === 'auto' ? 'high' : tier as Exclude<Tier, 'auto'>];
      butterchurnFrame++;
      const shouldRenderButterchurn = butterchurnFrame % (skip + 1) === 0;
      // Only render Butterchurn at the right interval
      if (visualizerRef.current && isPlayingRef.current && shouldRenderButterchurn) {
        try {
          visualizerRef.current.render();
          if (textureRef.current) {
            textureRef.current.needsUpdate = true;
          }
        } catch (error) {
          console.error("Error during visualizer render:", error);
        }
      }
      // Sphere and scene always update
      if (sphereRef.current) {
        sphereRef.current.rotation.x += 0.001;
        sphereRef.current.rotation.y += 0.002;
      }
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // --- Resize Handling ---
    const handleResize = () => {
      if (mountRef.current && rendererRef.current && cameraRef.current) {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        rendererRef.current.setSize(width, height);
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
      }
    };
    window.addEventListener('resize', handleResize);

    // --- Cleanup ---
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = undefined;
      }
       if (visualizerRef.current) {
           try {
            // visualizerRef.current.disconnectAudio(); // Check actual method if exists
           } catch (e) { console.error("Error disconnecting audio:", e); }
           visualizerRef.current = null;
       }
      if (rendererRef.current) {
          mount.removeChild(rendererRef.current.domElement);
          rendererRef.current.dispose();
      }
       if (textureRef.current) textureRef.current.dispose();
       if (sphereRef.current) {
            if(sphereRef.current.geometry) sphereRef.current.geometry.dispose();
            if(sphereRef.current.material instanceof THREE.Material) {
                 sphereRef.current.material.dispose();
            } else if (Array.isArray(sphereRef.current.material)) {
                 sphereRef.current.material.forEach(mat => mat.dispose());
            }
       }
       sceneRef.current = null;
       cameraRef.current = null;
       rendererRef.current = null;
       sphereRef.current = null;
       textureRef.current = null;
       canvasRef.current = null;
    };
  }, [analyserNode]); // MODIFIED: Removed isPlaying dependency

   useEffect(() => {
      // Log playing state change
     // console.log("isPlaying state changed:", isPlaying);
   }, [isPlaying]);

  if (tier === 'off') {
    return (
      <div className="absolute top-2 left-2 z-10 w-48">
        <Label htmlFor="tier-select" className="text-xs text-foreground/80">Performance Tier</Label>
        <Select
          value={tier}
          onValueChange={handleTierChange}
          disabled={benchmarking}
        >
          <SelectTrigger id="tier-select" className="h-8 text-xs bg-background/70 backdrop-blur-sm">
            <SelectValue placeholder="Select Tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="off" className="text-xs">Visualizer Off</SelectItem>
            <SelectItem value="extremely-low" className="text-xs">Extremely Low</SelectItem>
            <SelectItem value="low" className="text-xs">Low</SelectItem>
            <SelectItem value="medium" className="text-xs">Medium</SelectItem>
            <SelectItem value="high" className="text-xs">High</SelectItem>
            <SelectItem value="auto" className="text-xs">Auto (Benchmark)</SelectItem>
          </SelectContent>
        </Select>
        {benchmarking && <div className="text-xs mt-1">Benchmarking...</div>}
        {fpsResult && <div className="text-xs mt-1">Detected: {tier} ({fpsResult.toFixed(1)} FPS)</div>}
      </div>
    );
  }

  return (
    <div ref={mountRef} className="w-full h-full relative">
       {/* Preset Dropdown */}
        <div className="absolute top-2 right-2 z-10 w-64">
          <Label htmlFor="preset-select" className="text-xs text-foreground/80 sr-only">Preset</Label>
          <Select
            value={currentPresetKey ?? ''}
            onValueChange={handlePresetChange}
            disabled={presetKeys.length === 0}
          >
            <SelectTrigger id="preset-select" className="h-8 text-xs bg-background/70 backdrop-blur-sm">
              <SelectValue placeholder="Select Preset" />
            </SelectTrigger>
            <SelectContent>
              {presetKeys.map((key) => (
                <SelectItem key={key} value={key} className="text-xs">
                  {key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Tier Dropdown */}
        <div className="absolute top-2 left-2 z-10 w-48">
          <Label htmlFor="tier-select" className="text-xs text-foreground/80">Performance Tier</Label>
          <Select
            value={tier}
            onValueChange={handleTierChange}
            disabled={benchmarking}
          >
            <SelectTrigger id="tier-select" className="h-8 text-xs bg-background/70 backdrop-blur-sm">
              <SelectValue placeholder="Select Tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="off" className="text-xs">Visualizer Off</SelectItem>
              <SelectItem value="extremely-low" className="text-xs">Extremely Low</SelectItem>
              <SelectItem value="low" className="text-xs">Low</SelectItem>
              <SelectItem value="medium" className="text-xs">Medium</SelectItem>
              <SelectItem value="high" className="text-xs">High</SelectItem>
              <SelectItem value="auto" className="text-xs">Auto (Benchmark)</SelectItem>
            </SelectContent>
          </Select>
          {benchmarking && <div className="text-xs mt-1">Benchmarking...</div>}
          {fpsResult && <div className="text-xs mt-1">Detected: {tier} ({fpsResult.toFixed(1)} FPS)</div>}
        </div>
    </div>
    );
};

export default SphereVisualizer;
