# AudioSphere Development Plan

## 1. Overall Project Goals

*   **UI Refinement:**
    *   Implement a frosted glassmorphism effect for UI elements (player controls, modals, etc.).
    *   Restructure layout: Sphere visualizer occupying top 2/3, music controls bottom 1/3.
    *   Implement a blurred background effect behind the sphere animation.
*   **Audio-Reactive Sphere Enhancement:**
    *   Achieve more cutting-edge, psychedelic visuals.
    *   Optimize performance for a smooth experience.
    *   Eventually migrate from Butterchurn to Milkdrop 3.
*   **Playback Controls:**
    *   Ensure robust and intuitive play/pause, resume, next/previous, seek, and volume controls.
*   **Deployment:**
    *   Transition from Firebase to local development and then deploy to Vercel.

## 2. Development Phases & Progress

### Phase 1: UI Layout & Visual Foundation (Partially Complete)

*   [x] **Layout Restructuring:** Sphere 2/3, Controls 1/3.
*   [x] **Sphere Background Blur:** Initial implementation complete.
*   [x] **Glassmorphism for UI Elements:** Initial implementation for controls card complete.
*   [ ] **Refinement:** Fine-tune blur, glassmorphism opacity, borders, and shadows based on visual feedback.

### Phase 2: Performance Optimization & Preset Selection (Current Focus)

*   [x] **State Propagation Fix:** Ensured `SphereVisualizer` correctly receives `isPlaying` state (using `isPlayingRef`). Visuals are now appearing.
*   [ ] **Isolate Butterchurn Preset Impact:**
    *   **Current Action:** User to provide the list of all available Butterchurn preset names (by uncommenting the `console.log` in `SphereVisualizer.tsx`).
    *   Identify and temporarily hardcode a known, very simple preset.
    *   Evaluate performance with the simple preset.
*   [ ] **Further Butterchurn Optimization:**
    *   Review `pixelRatio` (currently set to 1) and internal resolution (currently 512x512) for Butterchurn.
    *   Investigate if frequent "Fast Refresh rebuilding" messages indicate underlying instability affecting performance.
*   [ ] **Research SOTA Best Practices:**
    *   Bleeding-edge techniques for web audio visualizers on low-end devices/GPUs.
    *   Specific Butterchurn optimization strategies.

### Phase 3: Sphere Animation Enhancement (Pending)

*   [ ] Research "cutting-edge psychedelic" visual styles and implementation techniques (WebGL shaders, post-processing).
*   [ ] Explore Butterchurn customization options vs. supplementing with Three.js effects.
*   [ ] Plan technical steps for future Milkdrop 3 migration.

### Phase 4: Music Player Logic Refinement (Partially Complete)

*   [x] **Play/Pause/Resume:** Logic improved; pause/resume now works correctly.
*   [ ] **Review and Test:** Thoroughly test next, previous, track selection, and seek functionalities.
*   [ ] **State Management:** Ensure robust state management for all player aspects.

### Phase 5: Cross-Device Compatibility, Final Optimizations & Deployment Prep (Pending)

*   [ ] Implement responsive design adjustments for all UI changes.
*   [ ] Conduct performance testing and optimization across various devices and browsers.
*   [ ] Ensure accessibility best practices are followed.
*   [ ] Prepare for Vercel deployment (environment variables, build process).

## 3. Immediate Next Steps (Performance Debugging)

1.  **User Action:** Run the app with the `console.log("Available preset keys:", JSON.stringify(keys));` line uncommented in `SphereVisualizer.tsx`.
2.  **User Action:** Provide the full list of preset names logged to the console.
3.  **AI Action:** Based on the list, identify 1-2 known simple/fast presets.
4.  **AI Action:** Propose an edit to `SphereVisualizer.tsx` to temporarily hardcode one of these simple presets for `initialPresetKey`.
5.  **User Action:** Test performance (visuals and system responsiveness when music plays) with the simple preset.
6.  **Evaluate:**
    *   If performance is good: The primary bottleneck was indeed complex presets. We can then strategize on default preset selection, allowing user selection, or warning about complex presets.
    *   If performance is still significantly poor: Investigate other factors (e.g., analyser data processing, React re-renders, Butterchurn library interactions).

## 4. Future Considerations & Potential Optimizations

*   **WASM for Butterchurn:** Investigate if a WebAssembly version of the Butterchurn core/EEL interpreter is available and feasible to integrate for significant performance improvements.
*   **Visualizer Quality Tiers:** Offer different visualizer quality settings (e.g., simpler presets, lower internal resolution) for low-end devices.
*   **Option to Disable Visualizer:** Provide a toggle to turn off the Butterchurn visualization completely for maximum performance on very constrained devices.
*   **Advanced Three.js Effects:** Explore custom shaders and post-processing in Three.js for unique psychedelic effects, potentially independent of or layered with Butterchurn.

---
This plan will be updated as we progress. 