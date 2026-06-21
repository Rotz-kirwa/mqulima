import React, { useState } from "react";
import { Play } from "lucide-react";
import { AcademyVideoPlayer } from "./AcademyVideoPlayer";

export function AcademyVideoPreview() {
  const previews = [
    {
      id: "drip-basics",
      title: "Drip Irrigation Basics",
      duration: "12 min",
      youtubeId: "dQw4w9WgXcQ", // Simulated YouTube ID
      brief: "Screenshot of agronomist instructor explaining drip emitters in vegetable field under drip tapes.",
    },
    {
      id: "soil-basics",
      title: "Soil Testing Basics",
      duration: "8 min",
      youtubeId: "dQw4w9WgXcQ",
      brief: "Video frame showing hand scoop soil sampling method in red soils.",
    },
    {
      id: "poultry-setup",
      title: "Setting up a Layer House",
      duration: "15 min",
      youtubeId: "dQw4w9WgXcQ",
      brief: "Inside poultry farm showing layout design tips.",
    },
    {
      id: "buyer-negotiation",
      title: "Negotiating with Buyers",
      duration: "11 min",
      youtubeId: "dQw4w9WgXcQ",
      brief: "Expert consultant detailing price benchmarks for wholesale offtakers.",
    },
  ];

  const [activeVideo, setActiveVideo] = useState(previews[0]);

  return (
    <section className="py-12 md:py-16 bg-[#0c2e17] text-white text-left">
      <div className="container-px mx-auto max-w-7xl">
        <div className="max-w-xl mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-[#7ed321]">
            Watch before you buy
          </span>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
            A taste of what you'll learn
          </h2>
          <p className="mt-2 text-xs md:text-sm text-white/70 leading-relaxed">
            Every course on Mqulima Academy includes a free preview lesson. Watch before committing a single shilling.
          </p>
        </div>

        {/* Video Player */}
        <div className="mt-8 flex flex-col items-center">
          <AcademyVideoPlayer
            key={activeVideo.id} // Forces re-render on active video change
            youtubeId={activeVideo.youtubeId}
            posterBrief={activeVideo.brief}
            title={activeVideo.title}
            duration={activeVideo.duration}
          />
          
          <div className="mt-4 text-xs font-bold text-[#7ed321] flex items-center gap-1.5 justify-center">
            <Play className="h-3 w-3 fill-current" />
            <span>Watch free preview — {activeVideo.title} ({activeVideo.duration})</span>
          </div>
        </div>

        {/* Video Thumbnails Row */}
        <div className="mt-10 border-t border-white/10 pt-8">
          <div className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-4">
            More Preview Lessons
          </div>
          
          <div className="grid gap-4 sm:grid-cols-3">
            {previews.slice(1).map((video) => (
              <button
                key={video.id}
                onClick={() => setActiveVideo(video)}
                className={`group flex items-center gap-3 rounded-xl bg-white/5 p-3 border text-left transition duration-200 cursor-pointer ${
                  activeVideo.id === video.id
                    ? "border-[#7ed321] bg-white/10"
                    : "border-white/5 hover:border-white/20 hover:bg-white/10"
                }`}
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#1a5c2f] text-[#7ed321]">
                  <Play className="h-3.5 w-3.5 fill-current" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-bold text-white group-hover:text-[#7ed321] transition">
                    {video.title}
                  </div>
                  <div className="text-[9px] text-white/40 font-mono mt-0.5">
                    Preview · {video.duration}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
