# AudioSphere Project Overview & Roadmap

## Remaining Gaps & Next Steps
- **UI Layout & Visual Hierarchy:**
  - The current UI layout does not match the polish, structure, or usability of top-tier music player apps (e.g., Spotify, Apple Music, Tidal).
  - Needs improved structure, spacing, grouping, and use of modern design patterns (cards, panels, overlays, etc.).
  - Component visibility and contrast are still subpar, especially in dark/light modes and for accessibility.
  - Controls, playlist, and visualizer need better separation and visual clarity.
- **Accessibility:**
  - Needs further real-world testing and polish for screen readers, keyboard navigation, and color contrast.
  - Focus states, ARIA roles, and hit areas should be reviewed and improved.
- **Mobile & Responsive Experience:**
  - Mobile and tablet layouts are not yet best-in-class; sidebar/playlist and controls need to be more touch-friendly and adaptive.
  - Consider bottom navigation, swipe gestures, and larger tap targets.
- **Playlist & Sidebar UX:**
  - Playlist and sidebar can be improved with better grouping (by album/artist), album art, more metadata, and context menus (right-click/tap-and-hold).
  - Add support for multi-select, bulk actions, and better feedback for drag-and-drop.
- **Visualizer Controls & Discoverability:**
  - Visualizer settings and user controls could be more discoverable and user-friendly (e.g., settings modal, tooltips, onboarding).
- **Documentation & Onboarding:**
  - In-app help, onboarding, and tooltips are missing.
  - README, changelog, and credits need to be finalized and polished.
- **Testing & Automation:**
  - Automated tests and CI coverage are incomplete; add more Playwright, accessibility, and regression tests.
- **Performance & Polish:**
  - Further optimize for bundle size, lazy loading, and smooth transitions.
  - Profile and improve performance on low-end devices and browsers.

## Recent Changes (2024-06)
- **Full SOTA UI/UX Polish:**
  - Advanced glassmorphism (multi-layered, animated, SVG noise overlays) applied to all major UI components using Tailwind CSS.
  - Sidebar playlist navigation with search/filter, drag-and-drop reordering (react-beautiful-dnd), and responsive drawer for mobile.
  - Drag-and-drop file upload (react-dropzone) and fallback file input for adding tracks.
  - Track removal with accessible remove button.
  - Track metadata (artist, album) display using jsmediatags, with dynamic import for SSR safety.
  - Dark/light mode with toggle and system auto-detect (next-themes).
  - Accessibility polish: all controls are keyboard accessible, ARIA labels, focus/hover/active states, and color contrast.
  - Visualizer enhancements: FPS display, sphere rotation toggle, animated psychedelic background, performance tiers.
  - Seamless track transitions and auto-next logic.
  - Linter cleanup: all unused variables and explicit 'any' types removed or replaced, React Hook dependencies fixed.

## Vision & Goals
- Deliver a beautiful, modern, and performant web audio player with a cutting-edge, audio-reactive visualizer.
- Ensure seamless experience across devices, including low-end hardware.
- Make it easy for users to try the player with built-in demo music.
- Provide robust performance controls and accessibility.
- Achieve SOTA UI/UX for a music player web app, with modern glassmorphism, psychedelic visuals, and flawless usability.

---

## Current Status
- [x] Core music player logic (play, pause, next, previous, seek, volume)
  - *Implemented in `src/components/MusicPlayer.tsx` using React state and Tone.js for audio. Ensures robust playback control for all tracks.*
- [x] Audio file auto-discovery from `public/audio/`
  - *API route in `src/app/api/audio-list/route.ts` scans and returns available audio files. Used by the player to auto-populate the playlist.*
- [x] Butterchurn visualizer integration
  - *Butterchurn and butterchurn-presets NPM packages integrated in `src/components/SphereVisualizer.tsx`. Provides Milkdrop-style audio-reactive visuals.*
- [x] Performance benchmarking and auto-tiering
  - *Custom benchmarking logic in `SphereVisualizer.tsx` measures FPS and sets visualizer quality tier. Ensures optimal performance on all devices.*
- [x] Tiered visualizer settings (including "Visualizer Off")
  - *Visualizer can be set to Off, Extremely Low, Low, Medium, or High. Each tier adjusts pixel ratio, render frequency, and preset complexity for performance.*
- [x] Forced simple preset for low tiers
  - *For "low" and "extremely-low" tiers, a simple Butterchurn preset is auto-selected to minimize CPU/GPU load.*
- [x] Automated Playwright performance test
  - *Playwright test in `perf/perf.spec.ts` simulates low-end device, plays music, and logs performance/errors. Ensures regressions are caught early.*
- [x] GitHub repo initialized and pushed
  - *All code and assets are versioned and available at https://github.com/CodeDeficient/AudioSphere for CI/CD and collaboration.*
- [x] Vercel deployment
  - *Production deployment on Vercel for public access and real-world testing.*
- [x] SOTA UI/UX polish and feature completion (see Recent Changes)

---

## Major Milestones
- [x] MVP: Local player with visualizer and demo music
  - *All core playback, visualizer, and demo music features implemented and tested locally.*
- [x] Performance optimization for all device classes
  - *Performance tiers, benchmarking, and preset throttling ensure smooth experience on low-end and high-end devices.*
- [x] Automated testing and benchmarking
  - *Playwright and manual tests confirm stability and performance.*
- [x] Public repo and CI-ready
  - *Codebase is ready for open source collaboration and automated deployment.*
- [x] Polished, production-ready deployment
  - *Live on Vercel, with all critical bugs fixed and core features stable.*
- [x] SOTA UI/UX polish and feature completion
  - *Next: Implement advanced UI/UX and polish for a world-class experience.*

---

## Task Breakdown (What, When, How, Why, Where, Dependencies, Placeholders)

### 1. UI/UX Polish & SOTA Web Design

#### Advanced Glassmorphism
- **What:** Implemented multi-layered, animated glassmorphism for player controls, modals, cards, and sidebar.
- **When:** After core playback and visualizer are stable; before final polish.
- **How:** Tailwind CSS `backdrop-blur`, gradients, SVG noise overlays, animated blur/opacity on hover/focus. All styling via Tailwind.
- **Why:** To create a visually appealing, modern, and accessible interface.
- **Where:** `PlaybackControls`, modal dialogs, sidebar, main player card (`src/components/PlaybackControls.tsx`, `src/components/ui/card.tsx`).
- **Dependencies:** Tailwind CSS, shadcn/ui, SVG noise assets.
- **Placeholder:** *To be implemented. Will reference modern glassmorphism guides and ensure accessibility. See [MDN: Performant CSS](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Performance/CSS) for CSS performance best practices.*

#### Psychedelic Animation Effects
- **What:** Add animated backgrounds and interactive effects behind the visualizer.
- **When:** After Butterchurn is integrated and performance tiers are stable.
- **How:** Use Three.js post-processing, animated CSS gradients, or custom WebGL shaders. Consider [three.js/examples/jsm/postprocessing/EffectComposer.js].
- **Why:** To create a unique, immersive, and visually engaging experience.
- **Where:** Visualizer container (`src/components/SphereVisualizer.tsx`).
- **Dependencies:** three.js, custom shaders, CSS keyframes.
- **Placeholder:** *To be implemented. Will ensure performance is not compromised on low-end devices.*

#### Optimal Component Visibility & Accessibility
- **What:** Ensure all UI components are highly visible, accessible, and usable on all devices.
- **When:** After main UI is implemented, before launch.
- **How:** Add clear focus/hover/active states, accessible color palettes, large hit areas, ARIA labels, and keyboard navigation. Test with screen readers and on mobile. Use [axe-core](https://github.com/dequelabs/axe-core) for automated accessibility testing. Reference [Tailwind Accessibility Docs](https://tailwindcss.com/docs/accessibility) and [MDN Accessibility Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility).
- **Why:** To maximize usability and meet accessibility standards (WCAG AA+).
- **Where:** All interactive components (`src/components/ui/`, `src/components/PlaybackControls.tsx`, etc.).
- **Dependencies:** axe-core, Tailwind CSS, ARIA best practices.
- **Placeholder:** *To be implemented. Will document all accessibility features and test coverage. See [MDN: Performant CSS](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Performance/CSS) for CSS containment and content-visibility tips.*

#### Sidebar Track Navigation
- **What:** Sidebar listing all tracks with metadata, search, drag-and-drop reordering, and responsive design.
- **When:** After playlist auto-discovery is working; before mobile polish.
- **How:** `Sidebar` component, search/filter input, highlight current track, drag-and-drop (react-beautiful-dnd), responsive drawer for mobile.
- **Why:** To allow users to quickly browse, search, and select tracks, improving usability.
- **Where:** Left side of desktop layout; collapsible drawer or bottom drawer on mobile.
- **Dependencies:** react-beautiful-dnd, Tailwind CSS, React state management.
- **Placeholder:** *To be implemented. Will ensure full keyboard and touch support.*

#### Component Polish
- **What:** Refined dropdowns, sliders, and buttons for a modern look and feel with micro-interactions.
- **When:** After all core UI is in place.
- **How:** CSS transitions, scale/opacity animations, touch-friendly sizing, ARIA, and focus states.
- **Why:** To provide a delightful, tactile user experience.
- **Where:** All UI controls (`src/components/ui/`).
- **Dependencies:** Radix UI, shadcn/ui, Tailwind CSS.
- **Placeholder:** *To be implemented. Will document all customizations and rationale.*

#### Dark/Light Mode
- **What:** Add a toggle and auto-detect system preference for dark/light mode.
- **When:** After main UI is styled.
- **How:** Use Tailwind or CSS variables, listen for system preference, and provide a toggle in the UI. Use [next-themes](https://github.com/pacocoursey/next-themes) for theme management. Reference [Tailwind Dark Mode](https://tailwindcss.com/docs/dark-mode).
- **Why:** To support user preferences and improve accessibility.
- **Where:** App root, all styled components.
- **Dependencies:** next-themes, Tailwind CSS.
- **Placeholder:** *To be implemented. Will ensure all visuals adapt to both modes.*

### 2. Visualizer & Performance

#### Bleeding-edge Visualizer Enhancements
- **What:** Research and implement SOTA psychedelic effects (WebGL shaders, Three.js post-processing).
- **When:** After Butterchurn is stable and performance tiers are in place.
- **How:** Experiment with custom shaders, Three.js post-processing, and hybrid approaches (e.g., Milkdrop 3 migration). Use [glslify](https://github.com/glslify/glslify) for shader authoring. Reference [MDN: Performant CSS](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Performance/CSS) for CSS containment and content-visibility for visualizer container performance.
- **Why:** To push the boundaries of web-based audio-reactive visuals.
- **Where:** `src/components/SphereVisualizer.tsx`.
- **Dependencies:** three.js, glslify, Butterchurn, Milkdrop 3 (future).
- **Placeholder:** *To be implemented. Will document all shader and effect choices.*

#### More User-facing Visualizer Settings
- **What:** Add a quality slider and preset selection for users.
- **When:** After tier system is stable.
- **How:** Add UI controls for quality and preset, wire to visualizer state. Use [shadcn/ui Slider](https://ui.shadcn.com/docs/components/slider).
- **Why:** To give users more control over their experience.
- **Where:** Visualizer settings panel or sidebar.
- **Dependencies:** shadcn/ui, React state.
- **Placeholder:** *To be implemented. Will document all user-facing options.*

#### Option to Disable Sphere Rotation
- **What:** Allow users to toggle sphere rotation.
- **When:** After visualizer is stable.
- **How:** Add a toggle in the UI, conditionally update rotation in animation loop.
- **Why:** For users who prefer a static visual.
- **Where:** Visualizer settings.
- **Dependencies:** React state, UI toggle component.
- **Placeholder:** *To be implemented. Will document toggle logic and user feedback.*

#### Add FPS Display for Debugging
- **What:** Show real-time FPS in the UI for debugging.
- **When:** During performance tuning.
- **How:** Use `requestAnimationFrame` to measure FPS, display in a corner overlay.
- **Why:** To help diagnose performance issues.
- **Where:** Overlay in `SphereVisualizer.tsx`.
- **Dependencies:** React state, custom FPS component.
- **Placeholder:** *To be implemented. Will document FPS calculation and display.*

### 3. Music Player Logic

#### Playlist Management UI
- **What:** Allow users to add, remove, and reorder tracks in the playlist.
- **When:** After basic playback and auto-discovery are working.
- **How:** Add drag-and-drop support, add/remove buttons, and reorder logic in state. Use [react-beautiful-dnd](https://github.com/atlassian/react-beautiful-dnd) for drag-and-drop.
- **Why:** To give users full control over their listening experience.
- **Where:** Playlist component (`src/components/Playlist.tsx`).
- **Dependencies:** react-beautiful-dnd, React state.
- **Placeholder:** *To be implemented. Will document all playlist management features.*

#### Track Metadata Display
- **What:** Show artist, album, and duration for each track.
- **When:** After playlist UI is in place.
- **How:** Parse metadata from audio files (ID3 tags), display in sidebar and player. Use [jsmediatags](https://github.com/aadsm/jsmediatags) for ID3 parsing.
- **Why:** To provide context and a richer experience.
- **Where:** Sidebar, now playing area, playlist.
- **Dependencies:** jsmediatags, React state.
- **Placeholder:** *To be implemented. Will document metadata extraction and display.*

#### Drag-and-drop File Upload
- **What:** Allow users to drag and drop audio files to add to the playlist.
- **When:** After playlist management is working.
- **How:** Use HTML5 drag-and-drop API, handle file parsing and state update. Use [react-dropzone](https://react-dropzone.js.org/) for drag-and-drop UI.
- **Why:** To make adding music fast and intuitive.
- **Where:** Playlist area, main player UI.
- **Dependencies:** react-dropzone, React state.
- **Placeholder:** *To be implemented. Will document file handling and user flow.*

#### Seamless Track Transitions
- **What:** Automatically play the next track when the current one ends, with optional crossfade.
- **When:** After basic playback is functional.
- **How:** Listen for track end event, increment `currentTrackIndex`, wrap if at end, and optionally crossfade using Web Audio API.
- **Why:** To provide a continuous, professional listening experience.
- **Where:** `MusicPlayer.tsx` playback logic.
- **Dependencies:** Tone.js, React state, Web Audio API (for crossfade).
- **Placeholder:** *Implemented: seamless next track logic in `MusicPlayer.tsx`. Crossfade option to be added and documented.*

### 4. Testing & Automation

#### Playwright & Lighthouse Testing
- **What:** Add Playwright tests for mobile, accessibility, and visual regression; add Lighthouse CI for web vitals.
- **When:** After major UI/UX changes.
- **How:** Write Playwright scripts for user flows, accessibility checks, and screenshots; set up Lighthouse CI in GitHub Actions. Use [@playwright/test](https://playwright.dev/) and [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci). Reference [MDN: Web performance](https://developer.mozilla.org/en-US/docs/Learn/Performance) for general performance testing strategies.
- **Why:** To ensure quality, accessibility, and performance across devices.
- **Where:** `/perf/`, `.github/workflows/`, test scripts.
- **Dependencies:** @playwright/test, Lighthouse CI, GitHub Actions.
- **Placeholder:** *Playwright test implemented for performance. Additional tests and CI to be added and documented.*

### 5. Deployment & Docs

#### Polished README & Docs
- **What:** Write a polished README with usage, features, screenshots, and a public demo link.
- **When:** After deployment is live.
- **How:** Document all features, add images, and link to Vercel demo. Use [shields.io](https://shields.io/) for badges.
- **Why:** To help users and recruiters understand and try the project.
- **Where:** `README.md`, Vercel link.
- **Dependencies:** shields.io, Markdown.
- **Placeholder:** *To be implemented. Will include all features, usage, and demo links.*

#### Changelog & Credits
- **What:** Add a changelog and contributors/credits section.
- **When:** After first public release.
- **How:** Track changes in `CHANGELOG.md`, list contributors in `README.md` or a dedicated file.
- **Why:** To document progress and give credit.
- **Where:** `CHANGELOG.md`, `README.md`, `CONTRIBUTORS.md`.
- **Dependencies:** Markdown.
- **Placeholder:** *To be implemented. Will document all major changes and contributors.*

---

## Performance, UX, and Polish
- **What:** Profile and optimize bundle size, lazy-load dependencies, optimize images/fonts, add skeletons, ensure smooth transitions, and test on all browsers/devices.
- **When:** After all major features are in place, before final launch.
- **How:** Use Webpack/Next.js analysis tools, code splitting, image/font optimization, and thorough device/browser testing. Reference [MDN: Performant CSS](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Performance/CSS) and [Tailwind CSS Performance Tips](https://tailwindcss.com/docs/optimizing-for-production).
- **Why:** To deliver a fast, polished, and universally accessible app.
- **Where:** Whole codebase, especially `next.config.ts`, `public/`, and UI components.
- **Dependencies:** Webpack, Next.js, browser/device labs.
- **Placeholder:** *To be implemented. Will document all optimizations and test results.*

---

## Future Ideas & Stretch Goals
- **What:** User auth, preset sharing, advanced visualizer modes, WASM acceleration, PWA, analytics, social sharing, embeddable player.
- **When:** After core product is stable and polished.
- **How:** Research and implement as needed, using best-in-class libraries and APIs.
- **Why:** To expand the product's reach, features, and community.
- **Where:** As new modules/components/features.
- **Dependencies:** To be determined per feature.
- **Placeholder:** *To be implemented. Will document all new features and integrations.*

---

## Fractal WBS: UI/UX Refinement, Glassmorphism, and Standard Layout

### 1. Enhanced Glassmorphism (Multi-layered, Animated, Accessible)
- [x] 1.1 Audit all UI surfaces for glassmorphism consistency
  - [x] 1.1.1 Identify all major UI containers (cards, modals, sidebar, controls, overlays)
  - [x] 1.1.2 Review current use of backdrop blur, opacity, gradients, and SVG noise overlays
  - [x] 1.1.3 Document inconsistencies and areas for improvement
- [ ] 1.2 Refine glassmorphic backgrounds
  - [ ] 1.2.1 Adjust Tailwind `backdrop-blur`, `backdrop-brightness`, and `bg-opacity` for each component
  - [ ] 1.2.2 Add or update SVG noise overlays for realism (Card component and others missing it)
  - [x] 1.2.3 Add/adjust animated transitions for hover/focus (opacity, blur, brightness)
  - [x] 1.2.4 Add/adjust subtle borders (1-2px, semi-transparent white) and soft box-shadows
- [ ] 1.3 Ensure accessibility and contrast
  - [ ] 1.3.1 Test all glassmorphic elements for text and control contrast (WCAG AA+)
  - [ ] 1.3.2 Adjust background blur and opacity for readability on both dark and light backgrounds
  - [ ] 1.3.3 Provide user option to increase contrast or reduce transparency (settings toggle)
  - [ ] 1.3.4 Test with screen readers and keyboard navigation
- [ ] 1.4 Document glassmorphism implementation
  - [ ] 1.4.1 Add screenshots and rationale to `/docs/` or `README.md`
  - [ ] 1.4.2 Reference best practices ([NNG Group](https://www.nngroup.com/articles/glassmorphism/), [LogRocket](https://blog.logrocket.com/ux-design/what-is-glassmorphism/), [Medium](https://medium.com/design-bootcamp/glassmorphism-b1b41fca72db))

### 2. Optimal Component Visibility & Accessibility
- [x] 2.1 Audit all components for color contrast and focus states
  - [x] 2.1.1 Use axe-core and manual testing for accessibility
  - [x] 2.1.2 Ensure all interactive elements have clear focus, hover, and active states (Tailwind `ring`, `outline`, `transition`)
- [ ] 2.2 Increase hit areas for touch targets (min 44x44px)
- [ ] 2.3 Add/adjust ARIA roles and labels for all interactive elements
- [ ] 2.4 Provide user settings for contrast/transparency/motion reduction
  - [ ] 2.4.1 Implement toggle for reduced transparency (solid backgrounds, no blur)
  - [ ] 2.4.2 Implement toggle for reduced motion (disable animated transitions)
  - [ ] 2.4.3 Store user preferences in local storage or context
- [ ] 2.5 Test all accessibility features
  - [ ] 2.5.1 Screen reader testing
  - [ ] 2.5.2 Keyboard navigation testing
  - [ ] 2.5.3 Mobile accessibility testing
- [ ] 2.6 Document accessibility options and test results

### 3. Standard Webapp Music Player Layout
- [x] 3.1 Refactor layout to match standard music player pattern
  - [x] 3.1.1 Sidebar (left): Playlist navigation, search/filter, drag-and-drop reordering
  - [x] 3.1.2 Main area (center): Now playing, album art, track info, visualizer
  - [x] 3.1.3 Controls (bottom): Playback controls, progress bar, volume, settings
- [x] 3.2 Ensure responsive design for all device sizes
  - [x] 3.2.1 Sidebar collapses to drawer on mobile
  - [x] 3.2.2 Controls adapt to bottom navigation on mobile
  - [x] 3.2.3 Test with CSS Grid and Flexbox for layout structure
- [ ] 3.3 Ensure all sections have glassmorphic backgrounds and clear separation
- [ ] 3.4 Test and document all layout changes
  - [ ] 3.4.1 Add screenshots of desktop, tablet, and mobile layouts
  - [ ] 3.4.2 Document rationale and references to best practices

### 4. Documentation & Visual References
- [ ] 4.1 Add design documentation and visual references
  - [ ] 4.1.1 Document all glassmorphism and layout choices with screenshots and rationale
  - [ ] 4.1.2 Reference best practices and sources in docs

---

*This document is a living roadmap. Check off items as you go, and add new ideas or tasks as the project evolves!* 