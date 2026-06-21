import React from "react";
import { AcademyImagePlaceholder } from "./AcademyImagePlaceholder";

export function AcademyInstructors() {
  const instructors = [
    {
      name: "Dr. Miriam Wanjiku",
      title: "Agronomist, 14 yrs field exp., KARI",
      tag: "Soil & Crops",
      courses: "5 courses",
      brief: "Professional headshot of Dr. Miriam Wanjiku agronomist, outdoor setting.",
    },
    {
      name: "Samuel Otieno",
      title: "Livestock specialist, ILRI",
      tag: "Poultry & Dairy",
      courses: "4 courses",
      brief: "Kenyan man in his 40s in livestock context — dairy farm or poultry setting. Professional but authentic.",
    },
    {
      name: "Amina Hassan",
      title: "Export market consultant",
      tag: "Agri-Business",
      courses: "3 courses",
      brief: "Kenyan woman, professional setting, market or export context. Confident. Business attire.",
    },
  ];

  return (
    <section className="py-12 md:py-16 bg-[#FAF9F6] text-left">
      <div className="container-px mx-auto max-w-7xl">
        <div className="max-w-xl mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-[#1a5c2f]">
            The people teaching you
          </span>
          <h2 className="mt-2 text-2xl font-black text-[#0c2e17] tracking-tight">
            Experts with soil under their nails
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {instructors.map((ins, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-black/[0.08] bg-white p-6 shadow-sm hover:shadow-md transition duration-300 flex flex-col items-center text-center"
            >
              {/* Profile Image (80x80px circular, 2px border rgba(26,92,47,.3)) */}
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#1a5c2f]/30 shadow-sm shrink-0 mb-4">
                <AcademyImagePlaceholder
                  brief={ins.brief}
                  aspect="w-full h-full"
                />
              </div>

              <h3 className="text-sm font-extrabold text-[#0c2e17]">{ins.name}</h3>
              <p className="text-[11px] text-gray-500 font-semibold mt-1 max-w-[200px] leading-snug min-h-[32px]">
                {ins.title}
              </p>
              
              <span className="mt-3 inline-block text-[9px] font-black uppercase tracking-wider text-[#1a5c2f] bg-[#1a5c2f]/10 px-2.5 py-0.5 rounded-full">
                {ins.tag}
              </span>

              <div className="mt-4 border-t border-gray-50 pt-3 w-full text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                {ins.courses}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
