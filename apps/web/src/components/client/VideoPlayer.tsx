'use client';

import { useState, useRef } from 'react';

interface VideoPlayerProps {
  src: string;
  title?: string;
  className?: string;
}

export default function VideoPlayer({ src, title, className = '' }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        src={src}
        className="w-full"
        controls
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      >
        Your browser does not support the video tag.
      </video>
      {title && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-4">
          <p className="text-white text-sm font-medium">{title}</p>
        </div>
      )}
    </div>
  );
}
