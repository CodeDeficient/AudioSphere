# **App Name**: AudioSphere

## Core Features:

- Audio Upload: Enable users to upload local audio files (MP3, WAV, OGG) via a file input button.
- Playback Controls: Provide standard play/pause, volume, seek/progress bar, next/previous track, and track selection controls.
- 3D Sphere Visualizer: Render a 3D sphere using Three.js and map the Butterchurn visualizer output onto its surface.
- Audio-Reactive Visualization: Dynamically change the Butterchurn visualization based on the frequency and amplitude data of the playing audio. Also provide a button to cycle through Butterchurn presets.
- Basic Playlist Management: Display a playlist of uploaded tracks and allow users to select tracks from the playlist. The next track in the playlist should automatically start playing.

## Style Guidelines:

- Divide the UI into two sections: a top section (~1/3rd) for the 3D sphere visualizer and a bottom section (~2/3rds) for playback controls and the playlist.
- Implement a psychedelic color palette with vibrant, shifting colors, primarily within the visualizer and as accents in the UI.
- Add a subtle, blurred animation in the background of the player controls/playlist area.
- Accent color: Teal (#008080) to complement the psychedelic theme.
- Ensure the layout functions correctly on desktop browser window sizes. 