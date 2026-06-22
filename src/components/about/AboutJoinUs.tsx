import React from "react";
import { ArrowRight, MapPin, Briefcase } from "lucide-react";
import { OPEN_ROLES } from "@/lib/about-content";

export function AboutJoinUs() {
  const hasOpenRoles = OPEN_ROLES.length > 0;

  return (
    <section className="py-16 md:py-24 bg-white text-left">
      <div className="mx-auto max-w-4xl px-6">
        
        <div className="max-w-xl mb-12">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#1a5c2f]">
            Join the mission
          </span>
          <h2 className="mt-2 text-xl sm:text-2xl md:text-3xl font-medium text-[#0c2e17] tracking-tight">
            We're hiring people who care about farmers.
          </h2>
          <p className="mt-2 text-xs md:text-sm text-gray-500 leading-relaxed font-normal">
            We don't care where you went to school. We care what you've built and whether you show up.
          </p>
        </div>

        {/* Job Listings List */}
        {hasOpenRoles ? (
          <div className="space-y-4">
            {OPEN_ROLES.map((role, idx) => (
              <div
                key={idx}
                className="group rounded-2xl border border-black/[0.08] bg-[#f5f2ed]/25 p-5 hover:border-[#1a5c2f]/30 hover:bg-[#f5f2ed]/50 transition duration-250 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div>
                  <div className="flex flex-wrap gap-2 items-center mb-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-[#1a5c2f]/10 text-[#1a5c2f] px-2 py-0.5 rounded">
                      {role.department}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-0.5 rounded flex items-center gap-1">
                      <Briefcase className="h-2.5 w-2.5" /> {role.type}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-[#0c2e17]">
                    {role.title}
                  </h3>
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    <MapPin className="h-3 w-3" />
                    <span>{role.location}</span>
                  </div>
                </div>

                <a
                  href={role.applyUrl}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#1a5c2f] group-hover:text-[#0c2e17] transition cursor-pointer self-start sm:self-auto"
                >
                  <span>Apply Now</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-[#0c2e17]/10 p-8 text-center text-xs text-gray-500">
            No open roles right now — but we're always looking for exceptional people. Send your CV to{" "}
            <a href="mailto:careers@mqulima.com" className="font-bold text-[#1a5c2f] underline">
              careers@mqulima.com
            </a>
          </div>
        )}

        {/* Human footer note */}
        <div className="mt-8 text-center sm:text-left">
          <p className="text-[10px] italic text-gray-400">
            * We're a small team. If you send us a message, a real person reads it.
          </p>
        </div>

      </div>
    </section>
  );
}
