import React, { useState, useEffect, useRef } from "react";
import { Play } from "lucide-react";
import { AcademyImagePlaceholder } from "./AcademyImagePlaceholder";

interface AcademyVideoPlayerProps {
  youtubeId?: string;
  supabaseUrl?: string;
  posterImage?: string;
  posterBrief?: string;
  title: string;
  duration: string;
}

export function AcademyVideoPlayer({
  youtubeId,
  supabaseUrl,
  posterImage,
  posterBrief = "Video poster thumbnail showing crop farming expert",
  title,
  duration,
}: AcademyVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInViewport, setIsInViewport] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInViewport(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handlePlayClick = () => {
    setIsPlaying(true);
  };

  // Schema.org VideoObject Markup
  const schemaJson = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": title,
    "description": `Free preview lesson from Mqulima Academy: ${title}`,
    "thumbnailUrl": posterImage || "https://mqulima.vercel.app/academy/video-poster.jpg",
    "uploadDate": "2026-06-21T12:00:00Z",
    "duration": duration.includes("min") ? `PT${parseInt(duration)}M` : "PT10M",
    "embedUrl": youtubeId
      ? `https://www.youtube-nocookie.com/embed/${youtubeId}`
      : supabaseUrl,
  };

  return (
    <div ref={containerRef} className="w-full max-w-[720px] mx-auto">
      {/* Inject Video Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }}
      />

      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-[#0c2e17] border border-white/10 shadow-lg">
        {!isPlaying ? (
          <div className="absolute inset-0 z-10 flex flex-col justify-between p-4 cursor-pointer group" onClick={handlePlayClick}>
            {/* Poster image fallback or actual image */}
            <div className="absolute inset-0 bg-[#0c2e17]">
              {posterImage ? (
                <img
                  src={posterImage}
                  alt={posterBrief}
                  className="w-full h-full object-cover opacity-80 group-hover:scale-102 transition duration-500"
                />
              ) : (
                <AcademyImagePlaceholder brief={posterBrief} aspect="aspect-video" />
              )}
              {/* Overlay shadow */}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition duration-300" />
            </div>

            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <button
                type="button"
                className="w-16 h-16 rounded-full bg-[#7ed321] text-[#0c2e17] flex items-center justify-center shadow-lg group-hover:scale-110 transition duration-300"
                aria-label={`Play video: ${title}`}
              >
                <Play className="h-8 w-8 fill-current translate-x-0.5" />
              </button>
            </div>

            {/* Top Bar info */}
            <div className="relative z-20 flex justify-between items-start text-white w-full">
              <span className="bg-[#0c2e17]/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#7ed321]">
                Free Preview
              </span>
              <span className="bg-[#0c2e17]/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-mono">
                {duration}
              </span>
            </div>

            {/* Bottom Bar Info */}
            <div className="relative z-20 text-white w-full bg-gradient-to-t from-black/80 to-transparent p-4 -mx-4 -mb-4">
              <h4 className="text-sm font-extrabold tracking-tight">{title}</h4>
            </div>
          </div>
        ) : (
          /* Actual Video Embed when Playing */
          isInViewport && (
            <div className="w-full h-full">
              {youtubeId ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`}
                  title={title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                />
              ) : supabaseUrl ? (
                <video src={supabaseUrl} controls autoPlay className="w-full h-full object-cover" />
              ) : (
                /* Placeholder State when no source provided */
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-white text-center border border-dashed border-white/20">
                  <Play className="w-16 h-16 text-white/40 mb-4" />
                  <h4 className="text-sm font-extrabold">Video coming soon</h4>
                  <p className="text-[10px] text-white/60 mt-1 max-w-[320px] leading-relaxed">
                    Paste your YouTube ID or Supabase video URL here:
                  </p>
                  <code className="mt-3 block text-[9px] bg-white/10 px-2 py-1 rounded font-mono text-[#7ed321]">
                    [VIDEO_PLACEHOLDER: youtubeId="PASTE_ID_HERE"]
                  </code>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}
