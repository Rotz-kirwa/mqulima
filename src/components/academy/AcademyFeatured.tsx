import React from "react";
import { Clock, Users, Award } from "lucide-react";
import { AcademyImagePlaceholder } from "./AcademyImagePlaceholder";

interface AcademyFeaturedProps {
  onEnrollClick?: () => void;
}

export function AcademyFeatured({ onEnrollClick }: AcademyFeaturedProps) {
  return (
    <section className="py-12 md:py-16 bg-[#FAF9F6] text-left">
      <div className="container-px mx-auto max-w-7xl">
        <span className="text-xs font-bold uppercase tracking-widest text-[#1a5c2f]">
          Featured this week
        </span>
        
        <div className="mt-4 rounded-3xl border border-black/[0.08] bg-white overflow-hidden shadow-md hover:shadow-lg transition duration-300 grid md:grid-cols-12">
          
          {/* Left Column: Image */}
          <div className="md:col-span-6 relative h-[260px] md:h-auto min-h-[280px]">
            <AcademyImagePlaceholder
              brief="Close-up of a Kenyan farmer's weathered hands cupping dark, rich soil. Shallow depth of field. Natural light from the side. No gloves."
              aspect="w-full h-full"
              className="absolute inset-0 w-full h-full"
            />
            {/* Featured Badge */}
            <span className="absolute top-4 left-4 z-20 bg-[#7ed321] text-[#0c2e17] text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
              Featured
            </span>
          </div>

          {/* Right Column: Details */}
          <div className="md:col-span-6 p-6 md:p-8 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1a5c2f] bg-[#1a5c2f]/10 px-2.5 py-1 rounded-md">
                Soil & Agronomy
              </span>
              <h3 className="mt-4 text-xl sm:text-2xl font-black text-[#0c2e17] tracking-tight">
                Modern Soil Health for Kenyan Smallholders
              </h3>
              <p className="mt-3 text-xs md:text-sm text-gray-600 leading-relaxed">
                Master soil testing, composting, and fertiliser timing for higher yields without expensive inputs. Learn how to diagnose deficiencies directly in your farm.
              </p>

              {/* Meta Row */}
              <div className="mt-6 flex flex-wrap gap-4 text-xs text-gray-500 font-semibold border-b border-gray-100 pb-5">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-[#1a5c2f]" /> 6 hours
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-[#1a5c2f]" /> 840 enrolled
                </span>
                <span className="flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-[#1a5c2f]" /> Certificate Included
                </span>
              </div>
            </div>

            {/* Instructor Row */}
            <div className="mt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {/* Instructor Avatar Fallback */}
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#1a5c2f]/30 shrink-0">
                    <AcademyImagePlaceholder
                      brief="Professional headshot of Dr. Miriam Wanjiku agronomist, outdoor setting."
                      aspect="w-full h-full"
                      className="scale-120"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#0c2e17]">Dr. Miriam Wanjiku</div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase">Agronomist, KARI</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-gray-400 font-bold uppercase">Course Price</div>
                  <div className="text-base font-extrabold text-[#1a5c2f]">KSh 1,200</div>
                </div>
              </div>

              {/* Enroll Button */}
              <button
                onClick={onEnrollClick}
                className="mt-6 w-full rounded-xl bg-[#1a5c2f] hover:bg-[#0c2e17] text-white font-bold text-xs uppercase tracking-wider py-3.5 transition duration-200 shadow-sm cursor-pointer text-center"
              >
                Enroll Now — KSh 1,200
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
