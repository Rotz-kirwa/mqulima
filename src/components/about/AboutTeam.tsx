import React from "react";
import { Linkedin } from "lucide-react";
import { TEAM_MEMBERS } from "@/lib/about-content";
import { Image } from "./Image";

export function AboutTeam() {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <section className="py-16 md:py-24 bg-white text-left">
      <div className="mx-auto max-w-6xl px-6">
        
        <div className="max-w-xl mb-12">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#1a5c2f]">
            The people behind it
          </span>
          <h2 className="mt-2 text-xl sm:text-2xl md:text-3xl font-medium text-[#0c2e17] tracking-tight">
            A team that has been in the field.
          </h2>
          <p className="mt-1 text-xs md:text-sm text-gray-500 font-semibold italic">
            Not just metaphorically.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
          {TEAM_MEMBERS.map((member, idx) => (
            <div
              key={idx}
              className="group relative rounded-2xl border border-black/[0.08] bg-[#f5f2ed]/40 p-6 shadow-sm hover:shadow-md transition duration-300 flex flex-col items-center text-center justify-between"
            >
              <div className="flex flex-col items-center">
                {/* Photo or Initials Fallback */}
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#1a5c2f]/15 shadow-sm shrink-0 mb-4 flex items-center justify-center bg-[#0c2e17] relative">
                  {member.photoUrl ? (
                    <Image
                      src={member.photoUrl}
                      alt={`Professional portrait headshot of ${member.name}, ${member.role}`}
                      fill
                      className="absolute inset-0 w-full h-full object-cover"
                      sizes="96px"
                      priority={false}
                    />
                  ) : (
                    <span className="text-xl font-bold text-[#7ed321]">
                      {getInitials(member.name)}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-extrabold text-[#0c2e17]">
                  {member.name}
                </h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                  {member.role}
                </p>
                
                <p className="mt-3 text-xs text-gray-500 leading-relaxed font-normal min-h-[48px] max-w-[220px]">
                  {member.bio}
                </p>
              </div>

              {/* LinkedIn icon link that slides up from opacity 0 on hover */}
              <div className="mt-4 h-8 overflow-hidden relative w-full flex justify-center">
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#1a5c2f]/5 text-[#1a5c2f] hover:bg-[#1a5c2f] hover:text-white transition-all duration-150 transform translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 cursor-pointer"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
