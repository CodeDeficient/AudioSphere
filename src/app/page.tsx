'use client';

import React from 'react';
import MusicPlayer from '@/components/MusicPlayer';

export default function Home() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <MusicPlayer />
    </div>
  );
}
