import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { motion, AnimatePresence } from "framer-motion";
import { 
  getPublishedCourses, 
  getCourseDetail, 
  getAcademyStats,
  enrollInCourse,
  toggleLessonCompletion
} from "@/lib/api/academy-public.server";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { jsPDF } from "jspdf";

// Custom SVG Icons matching Tabler Icons
function IconPlant({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9a10 10 0 1 0 20 0" />
      <path d="M12 19a10 10 0 0 1 10 -10" />
      <path d="M2 9a10 10 0 0 1 10 10" />
      <path d="M12 4a9.7 9.7 0 0 1 2.99 7.5" />
      <path d="M9.01 11.5a9.7 9.7 0 0 1 2.99 -7.5" />
    </svg>
  );
}

function IconPlay({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  );
}

function IconSearch({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconChartBar({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10" />
      <path d="M12 20V4" />
      <path d="M6 20v-6" />
    </svg>
  );
}

function IconClock({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconBook({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5v-15z" />
    </svg>
  );
}

function IconUsers({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconChevronLeft({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function IconMenu({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function IconChevronRight({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function IconFileText({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function IconPdf({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function IconX({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconCertificate({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15l-2 5l2 -3l2 3z" />
      <path d="M13 10a3 3 0 1 0 -6 0a3 3 0 0 0 6 0z" />
      <path d="M10 13l-1.5 5.5l1.5 -3.5l1.5 3.5z" />
      <path d="M17 17m-3 0a3 3 0 1 0 6 0a3 3 0 0 0 -6 0z" />
    </svg>
  );
}

function IconTrendingUp({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function IconLock({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconCheck({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function renderCourseCover(course: any) {
  if (course.cover_image_url) {
    return (
      <img
        src={course.cover_image_url}
        alt={course.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
    );
  }

  // Fallback beautiful gradients and custom styled titles matching GeeksForGeeks style
  let gradientClass = "from-[#0d1b2a] via-[#1b263b] to-[#415a77]"; // default dark tech
  let tagText = "AGRICULTURE";
  let mainTitle = course.title || "Academy Course";
  let graphicElement = (
    <div className="absolute right-4 bottom-4 opacity-15">
      <IconPlant className="w-24 h-24 stroke-[1]" />
    </div>
  );

  const slug = course.slug || "";
  if (slug === "sukuma-wiki-production" || slug.includes("sukuma")) {
    gradientClass = "from-[#1b4332] via-[#2d6a4f] to-[#52b788]"; // premium green gradient
    tagText = "CROP CULTIVATION";
    mainTitle = "Sukuma Wiki";
    graphicElement = (
      <div className="absolute right-4 bottom-2 opacity-15">
        <IconPlant className="w-24 h-24 stroke-[1] text-white" />
      </div>
    );
  } else if (slug === "avocado-masterclass" || slug.includes("avocado")) {
    gradientClass = "from-[#1e4620] via-[#4d7c0f] to-[#a3e635]"; // lime/avocado green gradient
    tagText = "ORCHARD MANAGEMENT";
    mainTitle = "Avocado Farming";
    graphicElement = (
      <div className="absolute right-6 bottom-4 opacity-15 w-20 h-20 border-4 border-white/60 rounded-full flex items-center justify-center">
        <div className="w-8 h-8 bg-white/60 rounded-full" />
      </div>
    );
  } else if (slug === "dairy-farming-essentials" || slug.includes("dairy")) {
    gradientClass = "from-[#0f172a] via-[#1e293b] to-[#3b82f6]"; // slate to milk blue gradient
    tagText = "LIVESTOCK PRODUCTION";
    mainTitle = "Dairy Farming";
    graphicElement = (
      <div className="absolute right-4 bottom-4 opacity-15 font-serif font-black text-6xl text-white">
        COW
      </div>
    );
  } else if (slug === "poultry-farming-essentials" || slug.includes("poultry")) {
    gradientClass = "from-[#7f1d1d] via-[#b91c1c] to-[#f59e0b]"; // crimson to egg gold gradient
    tagText = "POULTRY MANAGEMENT";
    mainTitle = "Poultry Farming";
    graphicElement = (
      <div className="absolute right-4 bottom-4 opacity-15 font-mono font-bold text-5xl text-white">
        EGG
      </div>
    );
  } else if (slug === "ai-in-agriculture" || slug.includes("ai")) {
    gradientClass = "from-[#1e1b4b] via-[#312e81] to-[#06b6d4]"; // tech deep indigo/cyan gradient
    tagText = "AGRI-TECHNOLOGY";
    mainTitle = "AI in Agriculture";
    graphicElement = (
      <div className="absolute right-6 bottom-6 opacity-20">
        <svg className="w-20 h-20 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 3v18" />
          <path d="M15 3v18" />
          <path d="M3 9h18" />
          <path d="M3 15h18" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`w-full h-full bg-gradient-to-br ${gradientClass} relative p-6 flex flex-col justify-between overflow-hidden select-none`}>
      <div className="absolute inset-0 opacity-[0.07]" 
        style={{
          backgroundImage: "radial-gradient(white 1px, transparent 1px)",
          backgroundSize: "16px 16px"
        }}
      />
      {graphicElement}
      <div className="flex justify-between items-start z-10">
        <span className="text-[9px] font-extrabold uppercase tracking-widest bg-white/10 text-white/95 px-2 py-0.5 rounded-[3px] backdrop-blur-[2px]">
          {tagText}
        </span>
      </div>
      <div className="z-10 mt-auto">
        <h4 className="text-white font-serif font-black text-xl leading-tight tracking-wide drop-shadow-sm">
          {mainTitle === "AI in Agriculture" ? (
            <span className="italic font-extrabold text-cyan-200">AI in Agriculture</span>
          ) : (
            mainTitle
          )}
        </h4>
        <p className="text-white/60 text-[10px] uppercase font-semibold tracking-wider mt-1">
          Masterclass
        </p>
      </div>
    </div>
  );
}

function extractYoutubeId(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function extractVimeoId(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:vimeo\.com\/|video\/)(\d+)/);
  return m ? m[1] : null;
}

function renderCourseTitle(title: string, colorConfig: { text: string; hoverText: string }) {
  if (title.includes(": ")) {
    const [part1, part2] = title.split(": ");
    const isAi = title.includes("AI in Agriculture");
    const part1Color = isAi ? "text-[#2563EB]" : "text-slate-800";
    const part2Color = isAi ? "text-[#D97706]" : colorConfig.text;
    return (
      <>
        <span className={`${part1Color} font-bold`}>{part1}: </span>
        <span className={`font-serif italic font-medium ${part2Color}`}>{part2}</span>
      </>
    );
  }

  if (title.includes("Masterclass")) {
    const part1 = title.replace("Masterclass", "").trim();
    return (
      <>
        <span className="text-slate-800 font-semibold">{part1} </span>
        <span className={`font-serif italic font-medium ${colorConfig.text}`}>Masterclass</span>
      </>
    );
  }

  if (title.includes("Essentials")) {
    const part1 = title.replace("Essentials", "").trim();
    return (
      <>
        <span className="text-slate-800 font-semibold">{part1} </span>
        <span className={`font-serif italic font-medium ${colorConfig.text}`}>Essentials</span>
      </>
    );
  }

  return <span className="text-slate-800 font-semibold">{title}</span>;
}

function renderModalCourseTitle(title: string, isDarkBg = false) {
  if (title.includes(": ")) {
    const [part1, part2] = title.split(": ");
    const part1Color = isDarkBg ? "text-cyan-400" : "text-[#2D6A4F]";
    const part2Color = isDarkBg ? "text-amber-300" : "text-[#B45309]";
    return (
      <>
        <span className={`${part1Color} font-bold`}>{part1}: </span>
        <span className={`font-sans italic font-light ${part2Color} block mt-1`}>{part2}</span>
      </>
    );
  }

  if (title.includes("Masterclass")) {
    const part1 = title.replace("Masterclass", "").trim();
    return (
      <>
        <span className={`${isDarkBg ? "text-white" : "text-[#112E22]"} font-semibold`}>{part1} </span>
        <span className={`font-serif italic font-light ${isDarkBg ? "text-cyan-300" : "text-[#2D6A4F]"}`}>Masterclass</span>
      </>
    );
  }

  if (title.includes("Essentials")) {
    const part1 = title.replace("Essentials", "").trim();
    return (
      <>
        <span className={`${isDarkBg ? "text-white" : "text-[#112E22]"} font-semibold`}>{part1} </span>
        <span className={`font-serif italic font-light ${isDarkBg ? "text-cyan-300" : "text-[#2D6A4F]"}`}>Essentials</span>
      </>
    );
  }

  return <span className={`${isDarkBg ? "text-white" : "text-[#112E22]"} font-semibold`}>{title}</span>;
}

function renderMajorPoints(slug: string) {
  const pointsMap: Record<string, { bold: string; normal: string; underline: string }[]> = {
    "sukuma-wiki-production": [
      { bold: "Nursery Beds:", normal: " Master nursery bed preparation to ", underline: "ensure a 95%+ seed germination rate." },
      { bold: "Drip Irrigation:", normal: " Implement precise ", underline: "drip irrigation scheduling" },
      { bold: "Companion Planting:", normal: " Utilize organic companion planting to ", underline: "control pests naturally without chemical sprays." }
    ],
    "avocado-masterclass": [
      { bold: "Soil Preparation:", normal: " Identify the optimal soil pH and drainage ", underline: "before transplanting young seedlings." },
      { bold: "Grafting Techniques:", normal: " Perform correct grafting and pruning to ", underline: "double crop density and yields." },
      { bold: "Export Compliance:", normal: " Adhere strictly to global phytosanitary standards to ", underline: "access international premium markets." }
    ],
    "dairy-farming-essentials": [
      { bold: "Nutrition Rationing:", normal: " Formulate balanced feed rations to ", underline: "maximize daily milk production per cow." },
      { bold: "Hygiene Protocol:", normal: " Enforce strict milking parlor hygiene to ", underline: "maintain zero mastitis infections." },
      { bold: "Farming Records:", normal: " Structure record-keeping to ", underline: "track breeding cycles and feed-to-milk conversion." }
    ],
    "poultry-farming-essentials": [
      { bold: "Coop Ventilation:", normal: " Design cross-ventilated housing to ", underline: "prevent respiratory diseases in chickens." },
      { bold: "Vaccine Schedule:", normal: " Administer critical vaccines timely to ", underline: "ensure a 98%+ flock survival rate." },
      { bold: "Feed Management:", normal: " Optimize feed-to-egg ratio to ", underline: "lower production expenses by 15%." }
    ],
    "ai-in-agriculture": [
      { bold: "Computer Vision:", normal: " Deploy offline mobile models to ", underline: "detect crop diseases in under 5 seconds." },
      { bold: "Precision Data:", normal: " Leverage IoT sensor telemetry to ", underline: "predict soil moisture and automate watering." },
      { bold: "Satellite Telemetry:", normal: " Utilize multispectral satellite imagery to ", underline: "monitor crop health index across large fields." }
    ]
  };

  const points = pointsMap[slug] || [
    { bold: "Practical Skills:", normal: " Focus on actionable agricultural steps to ", underline: "enhance seasonal farm yields." },
    { bold: "Business Strategy:", normal: " Implement crop scheduling and market research to ", underline: "maximize wholesale market prices." }
  ];

  return (
    <ul className="space-y-3.5 mt-4">
      {points.map((pt, i) => (
        <li key={i} className="flex items-start gap-2.5 text-slate-700 text-sm leading-relaxed">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F] mt-2 shrink-0" />
          <span>
            <strong className="font-serif italic text-[#112E22]">{pt.bold}</strong>
            {pt.normal}
            <span className="underline decoration-[#F5A623] decoration-2 underline-offset-4 font-semibold text-[#112E22]">{pt.underline}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export const Route = createFileRoute("/academy")({
  head: () => ({
    meta: [
      { title: "Mqulima Hub — Academy" },
      {
        name: "description",
        content: "Master climate-smart agronomy, optimize crop yields, and build a sustainable agricultural enterprise with practical, expert-led courses designed for modern farmers' success.",
      },
    ],
  }),
  component: AcademyPage,
});

function AcademyPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [stats, setStats] = useState({ course_count: 0, chapter_count: 0, enrollment_count: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All Courses");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  
  // Modal state
  const [modalCourse, setModalCourse] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"intro" | "video" | "text" | "locked">("intro");
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [isStudySessionActive, setIsStudySessionActive] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedLessons, setExpandedLessons] = useState<Record<string, boolean>>({});

  const { user } = useAuth();
  const navigate = useNavigate();

  const refreshCourseDetails = async (courseId: string) => {
    try {
      const data = await getCourseDetail({ data: courseId }) as any;
      setModalCourse(data);
      return data;
    } catch (err) {
      console.error("Error refreshing course details:", err);
    }
  };

  // Load basic courses & stats
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const coursesData = await getPublishedCourses();
        const statsData = await getAcademyStats();
        setCourses(coursesData);
        setStats(statsData as any);
      } catch (err) {
        console.error("Error loading academy data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load modal details when a course is selected
  useEffect(() => {
    if (!selectedCourseId) {
      setModalCourse(null);
      return;
    }
    async function loadDetails() {
      try {
        setModalLoading(true);
        const data = await refreshCourseDetails(selectedCourseId as string);
        if (data) {
          // Default to showing course intro video if available, else first lesson
          const firstChapter = data.chapters?.[0];
          const firstLesson = firstChapter?.lessons?.[0];
          if (firstLesson) {
            setCurrentLesson(firstLesson);
          } else {
            setCurrentLesson(null);
          }

          if (data.intro_video_url || data.youtube_id) {
            setViewMode("intro");
          } else if (firstLesson) {
            const isLocked = !data.is_enrolled && !firstLesson.is_free_preview;
            setViewMode(isLocked ? "locked" : (firstLesson.content_type === "video" ? "video" : "text"));
          } else {
            setViewMode("intro");
          }
          // Expand first chapter by default
          if (data.chapters && data.chapters.length > 0) {
            setExpandedChapters({ [(data.chapters[0] as any).id]: true });
          } else {
            setExpandedChapters({});
          }
          setDescriptionExpanded(false);
        }
      } catch (err) {
        console.error("Error loading course details:", err);
      } finally {
        setModalLoading(false);
      }
    }
    loadDetails();
  }, [selectedCourseId]);

  const handleEnroll = async () => {
    if (!user) {
      toast.error("Please sign in to enroll and track your progress!");
      navigate({ to: "/login" });
      return;
    }
    if (!modalCourse) return;

    try {
      const res = await enrollInCourse({ data: { courseId: modalCourse.id } });
      if (res && res.success) {
        toast.success(`Successfully enrolled in ${modalCourse.title}!`);
        await refreshCourseDetails(modalCourse.id);
        
        // Refresh global stats so enrollment count increments
        const statsData = await getAcademyStats();
        setStats(statsData as any);
        setIsStudySessionActive(true);
      }
    } catch (err) {
      console.error("Error enrolling in course:", err);
      toast.error("Failed to enroll in course. Please try again.");
    }
  };

  const handleDownloadFieldGuide = () => {
    if (!modalCourse) return;
    toast.success("Generating colorful field guide & syllabus...");

    // Create a new PDF document, Portrait orientation
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: "a4", // standard A4 is 595 x 842
    });

    let y = 165;
    let pageNum = 1;

    const drawCoverBanner = (doc: any, title: string, category: string, level: string, duration: number) => {
      // Forest Green Background Block
      doc.setFillColor(9, 31, 20); // Dark Green
      doc.rect(0, 0, 595, 140, "F");

      // Gold accent bar at Y=140
      doc.setFillColor(245, 166, 35);
      doc.rect(0, 140, 595, 5, "F");

      // Category label
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(245, 166, 35); // Gold
      doc.text(category.toUpperCase() || "ACADEMY CLASSROOM", 50, 35);

      // Course Title
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255); // White
      const wrappedTitle = doc.splitTextToSize(title.toUpperCase(), 495);
      doc.text(wrappedTitle, 50, 55);

      // Course Stats (Level, Duration)
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(200, 200, 200); // Light gray
      doc.text(`LEVEL: ${level.toUpperCase()}  |  TOTAL DURATION: ${duration} MINS  |  OFFICIAL FIELD GUIDE`, 50, 115);
    };

    // Draw page decorations & cover banner for first page
    drawCoverBanner(doc, modalCourse.title, modalCourse.category || "General Agriculture", modalCourse.level || "Beginner", modalCourse.duration_minutes || 0);
    
    // Bottom border band/footer on page 1
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.5);
    doc.line(50, 805, 545, 805);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text("© Mkulima Hub Platform. All rights reserved.", 50, 818);
    doc.text(`Page 1`, 545, 818, { align: "right" });

    // Helper to check space and add page if needed
    const checkSpace = (needed: number) => {
      if (y + needed > 780) {
        doc.addPage();
        pageNum++;
        y = 50; // top margin for new pages
        drawPageDecorations(doc, pageNum);
      }
    };

    const drawPageDecorations = (doc: any, pNum: number) => {
      // Top border bands
      doc.setFillColor(45, 106, 79); // Forest Green
      doc.rect(0, 0, 595, 8, "F");
      doc.setFillColor(245, 166, 35); // Gold
      doc.rect(0, 8, 595, 4, "F");

      // Top header text
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text("MQULIMA ACADEMY  |  OFFICIAL COURSE SYLLABUS & FIELD GUIDE", 50, 24);

      // Divider line at top
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.5);
      doc.line(50, 28, 545, 28);

      // Footer line
      doc.line(50, 805, 545, 805);

      // Footer text
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.text("© Mkulima Hub Platform. All rights reserved.", 50, 818);
      doc.text(`Page ${pNum}`, 545, 818, { align: "right" });
    };

    // Course Overview Section
    checkSpace(80);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(45, 106, 79); // Forest Green
    doc.text("COURSE OVERVIEW", 50, y);
    y += 6;
    doc.setDrawColor(45, 106, 79);
    doc.setLineWidth(1.5);
    doc.line(50, y, 120, y); // Small green underline
    y += 18;

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85); // Slate
    const wrappedDesc = doc.splitTextToSize(modalCourse.description || "No overview provided for this course.", 495);
    doc.text(wrappedDesc, 50, y);
    y += wrappedDesc.length * 13 + 15;

    // Instructor Section
    checkSpace(65);
    doc.setFillColor(244, 248, 245); // Very light green background
    doc.rect(50, y, 495, 45, "F");
    doc.setDrawColor(45, 106, 79);
    doc.setLineWidth(1);
    doc.rect(50, y, 495, 45, "S");
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(45, 106, 79);
    doc.text("COURSE INSTRUCTOR", 65, y + 15);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(17, 24, 39);
    doc.text(`${modalCourse.instructor_name || "Samuel Kiprono"} — ${modalCourse.instructor_title || "Lead Horticulturist & Agronomy Extension Officer"}`, 65, y + 28);
    y += 65;

    // Detailed Syllabus Header
    checkSpace(30);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(45, 106, 79);
    doc.text("DETAILED COURSE SYLLABUS & LESSON NOTES", 50, y);
    y += 6;
    doc.line(50, y, 220, y);
    y += 20;

    // Iterate Chapters
    const chapters = modalCourse.chapters || [];
    if (chapters.length === 0) {
      doc.setFont("Helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("No chapters or lessons listed in this syllabus.", 50, y);
    } else {
      chapters.forEach((ch: any, chIdx: number) => {
        // Draw Chapter Card/Section Header
        checkSpace(60);
        doc.setFillColor(232, 245, 233); // Light green background
        doc.rect(50, y, 495, 30, "F");
        doc.setDrawColor(45, 106, 79);
        doc.setLineWidth(1.5);
        doc.line(50, y, 50, y + 30); // Draw left green accent line
        
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(9, 31, 20);
        doc.text(`CHAPTER ${chIdx + 1}: ${ch.title.toUpperCase()}`, 60, y + 18);
        y += 38;

        // Draw Chapter Description if exists
        if (ch.description) {
          checkSpace(30);
          doc.setFont("Helvetica", "italic");
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          const wrappedChDesc = doc.splitTextToSize(ch.description, 480);
          doc.text(wrappedChDesc, 60, y);
          y += wrappedChDesc.length * 12 + 10;
        }

        // Draw Lessons
        const lessons = ch.lessons || [];
        if (lessons.length === 0) {
          checkSpace(20);
          doc.setFont("Helvetica", "italic");
          doc.setFontSize(9);
          doc.setTextColor(150, 150, 150);
          doc.text("No lessons listed under this chapter.", 60, y);
          y += 15;
        } else {
          lessons.forEach((les: any, lesIdx: number) => {
            checkSpace(35);
            // Lesson prefix bullet / type
            const isText = les.content_type === "text";
            const prefix = isText ? "[READING]" : "[VIDEO]";
            
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(9.5);
            doc.setTextColor(45, 106, 79);
            doc.text(`${prefix}`, 60, y);

            doc.setFont("Helvetica", "bold");
            doc.setTextColor(17, 24, 39);
            const lesTitleText = `${chIdx + 1}.${lesIdx + 1} — ${les.title}`;
            doc.text(lesTitleText, 120, y);

            if (les.video_duration_seconds) {
              const durMins = Math.floor(les.video_duration_seconds / 60);
              doc.setFont("Helvetica", "normal");
              doc.setFontSize(8.5);
              doc.setTextColor(120, 120, 120);
              doc.text(`(${durMins} mins video)`, 545, y, { align: "right" });
            }
            y += 14;

            // Draw Lesson Notes/Content if present
            const content = les.text_content;
            if (content) {
              checkSpace(40);
              doc.setFont("Helvetica", "normal");
              doc.setFontSize(8.5);
              doc.setTextColor(75, 85, 99); // Medium slate
              
              const wrappedNotes = doc.splitTextToSize(content, 465);
              wrappedNotes.forEach((line: string) => {
                checkSpace(12);
                doc.text(line, 80, y);
                y += 11;
              });
              y += 8;
            }
            
            y += 6; // Spacing after lesson
          });
        }
        y += 12; // Spacing after chapter
      });
    }

    const filename = `${modalCourse.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}_syllabus.pdf`;
    doc.save(filename);
  };

  const handleToggleCompletion = async (e: React.MouseEvent, lessonId: string) => {
    e.stopPropagation();
    if (!modalCourse) return;

    const isCompleted = modalCourse.completed_lessons?.includes(lessonId);
    try {
      const res = await toggleLessonCompletion({
        data: {
          courseId: modalCourse.id,
          lessonId,
          completed: !isCompleted,
        }
      });
      if (res && res.success) {
        await refreshCourseDetails(modalCourse.id);
        toast.success(
          !isCompleted 
            ? "Lesson marked as completed!" 
            : "Lesson marked as incomplete."
        );
      }
    } catch (err) {
      console.error("Error toggling lesson completion:", err);
      toast.error("Failed to update lesson completion status.");
    }
  };

  const generateCertificate = () => {
    if (!modalCourse || !user) return;
    
    // Create new PDF document, landscape orientation
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [842, 595],
    });

    // Outer border (Forest Green)
    doc.setDrawColor(45, 106, 79);
    doc.setLineWidth(16);
    doc.rect(8, 8, 842 - 16, 595 - 16);

    // Inner thin border (Gold)
    doc.setDrawColor(245, 166, 35);
    doc.setLineWidth(2);
    doc.rect(20, 20, 842 - 40, 595 - 40);

    // Corner decorative lines
    doc.setDrawColor(45, 106, 79);
    doc.rect(24, 24, 40, 40);
    doc.rect(842 - 64, 24, 40, 40);
    doc.rect(24, 595 - 64, 40, 40);
    doc.rect(842 - 64, 595 - 64, 40, 40);

    // Title & Header
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(45, 106, 79);
    doc.setFontSize(28);
    doc.text("MQULIMA ACADEMY", 842 / 2, 80, { align: "center" });

    // Subtitle
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(245, 166, 35);
    doc.setFontSize(14);
    doc.text("CERTIFICATE OF COMPLETION", 842 / 2, 110, { align: "center" });

    // Decorative horizontal separator line
    doc.setDrawColor(245, 166, 35);
    doc.setLineWidth(1);
    doc.line(842 / 2 - 120, 125, 842 / 2 + 120, 125);

    // Presentation text
    doc.setFont("Helvetica", "italic");
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(14);
    doc.text("This is proudly presented to", 842 / 2, 170, { align: "center" });

    // User Full Name
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(36);
    doc.text(user.name.toUpperCase(), 842 / 2, 230, { align: "center" });

    // Completion sentence
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(75, 85, 99);
    doc.setFontSize(13);
    doc.text(
      `for successfully completing the course of study and practical modules in`,
      842 / 2,
      280,
      { align: "center" }
    );

    // Course Title
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(45, 106, 79);
    doc.setFontSize(22);
    const titleLines = doc.splitTextToSize(modalCourse.title, 600);
    doc.text(titleLines, 842 / 2, 320, { align: "center" });

    // Additional info
    doc.setFont("Helvetica", "italic");
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(11);
    doc.text(
      "A comprehensive syllabus covering sustainable farming practices, regional land management, and yield optimization.",
      842 / 2,
      380,
      { align: "center" }
    );

    // Footer signature / verification sections
    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(1);
    doc.line(160, 480, 320, 480);
    doc.line(842 - 320, 480, 842 - 160, 480);

    doc.setFont("Helvetica", "bold");
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(11);
    doc.text("Samuel Kiprono", 240, 498, { align: "center" });
    doc.text("Director of Academy", 240, 513, { align: "center" });

    doc.text("Mqulima Hub Registrar", 842 - 240, 498, { align: "center" });
    doc.text("Authorized Verification", 842 - 240, 513, { align: "center" });

    // Decorative seal graphic
    doc.setFillColor(245, 166, 35);
    doc.setDrawColor(245, 166, 35);
    doc.circle(842 / 2, 490, 24, "F");

    doc.setFont("Helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("VERIFIED", 842 / 2, 493, { align: "center" });

    // Save/Download PDF
    const filename = `${modalCourse.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}_certificate.pdf`;
    doc.save(filename);
    toast.success("Certificate downloaded successfully!");
  };

  // Derived categories from database courses
  const categories = useMemo(() => {
    const cats = new Set(courses.map(c => c.category).filter(Boolean));
    return ["All Courses", ...Array.from(cats)];
  }, [courses]);

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const matchesCategory = selectedCategory === "All Courses" || c.category === selectedCategory;
      const matchesSearch = !debouncedSearch || 
        c.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(debouncedSearch.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [courses, selectedCategory, debouncedSearch]);

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => ({
      ...prev,
      [chapterId]: !prev[chapterId]
    }));
  };

  const handleLessonSelect = (lesson: any) => {
    if (!modalCourse) return;
    const isLocked = !modalCourse.is_enrolled && !lesson.is_free_preview;

    if (isLocked) {
      setViewMode("locked");
      setCurrentLesson(lesson);
      return;
    }

    if (lesson.content_type === "pdf") {
      if (lesson.pdf_url) {
        window.open(lesson.pdf_url, "_blank");
      }
      return;
    }
    setCurrentLesson(lesson);
    if (lesson.content_type === "text") {
      setViewMode("text");
    } else {
      setViewMode("video");
    }
  };

  return (
    <AppLayout>
      <div className="bg-[#112E22] text-white font-sans selection:bg-[#2D6A4F] selection:text-[#F5A623] overflow-x-hidden">
        {/* Style block for local animations/scrollbar */}
        <style dangerouslySetInnerHTML={{ __html: `
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #112E22;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #2D6A4F;
            border-radius: 2px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #F5A623;
          }
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .animate-shimmer {
            background: linear-gradient(90deg, #15392a 25%, #204c3a 50%, #15392a 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
          }
        `}} />

        <section className="relative pt-10 sm:pt-12 pb-4 sm:pb-4 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between overflow-hidden">
          <div className="absolute inset-0 pointer-events-none -z-10" style={{
            backgroundImage: "radial-gradient(ellipse 70% 80% at 65% 50%, rgba(45,106,79,0.15) 0%, transparent 70%)"
          }} />

          {/* LEFT SIDE */}
          <div className="w-full md:w-[60%] text-left flex flex-col items-start z-10">
            <div className="flex items-center gap-3 mb-2.5">
              <span className="w-6 h-[2px] bg-[#2D6A4F]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#F5A623] font-mono">
                MQULIMA ACADEMY
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl md:text-[34px] font-serif leading-[1.1] text-left select-none tracking-tight font-normal mb-2.5 sm:mb-3">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="inline sm:block text-white"
              >
                Grow Smarter.{" "}
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
                className="inline sm:block text-[#F5A623]"
              >
                Farm Better.{" "}
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="inline sm:block text-white"
              >
                Lead the Land.
              </motion.span>
            </h1>

            {/* Sub-headline */}
            <p className="text-[#9CA3AF] text-xs md:text-[14px] leading-relaxed max-w-[480px] mb-3.5 sm:mb-4">
              Master climate-smart agronomy, optimize crop yields, and build a sustainable agricultural enterprise with practical, expert-led courses designed for modern farmers' success.
            </p>

            {/* CTAs */}
            <div className="flex flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={() => {
                  const target = document.getElementById("courses");
                  target?.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex-1 sm:flex-initial text-center bg-[#2D6A4F] text-[#F5A623] border border-transparent font-semibold text-xs px-4 sm:px-4.5 py-2 sm:py-2 rounded-[2px] transition hover:bg-[#1a5c3a] cursor-pointer shadow-md"
              >
                Browse Courses ↓
              </button>
              <button
                onClick={() => {
                  const target = document.getElementById("how-it-works");
                  target?.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex-1 sm:flex-initial text-center bg-transparent border border-white/20 text-white font-semibold text-xs px-4 sm:px-4.5 py-2 sm:py-2 rounded-[2px] transition hover:bg-white/5 cursor-pointer"
              >
                How It Works
              </button>
            </div>

            {/* Stats Row */}
            <div className="mt-4 sm:mt-5 flex items-center gap-6 md:gap-8 border-t border-white/10 pt-3 sm:pt-4 w-full">
              <div className="flex flex-col">
                <span className="text-lg md:text-xl font-semibold text-[#F5A623]">{stats.course_count || 0}</span>
                <span className="text-[10px] text-[#9CA3AF] font-mono mt-0.5">Courses</span>
              </div>
              <div className="w-[1px] h-6 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-lg md:text-xl font-semibold text-[#F5A623]">{stats.chapter_count || 0}</span>
                <span className="text-[10px] text-[#9CA3AF] font-mono mt-0.5">Chapters</span>
              </div>
              <div className="w-[1px] h-6 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-lg md:text-xl font-semibold text-[#F5A623]">{stats.enrollment_count || 0}</span>
                <span className="text-[10px] text-[#9CA3AF] font-mono mt-0.5">Farmers Enrolled</span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE (40% desktop, hidden mobile) */}
          <div className="hidden md:flex w-[40%] justify-center items-center z-10">
            <div className="relative w-[220px] h-[220px] flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 40, ease: "linear", repeat: Infinity }}
                className="absolute w-[180px] h-[180px] rounded-full border border-[#2D6A4F]/30"
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#F5A623] opacity-80 rounded-none" />
                <div className="absolute bottom-[28px] right-[28px] w-1.5 h-1.5 bg-[#F5A623] opacity-80 rounded-none" />
                <div className="absolute bottom-[28px] left-[28px] w-1.5 h-1.5 bg-[#F5A623] opacity-80 rounded-none" />
              </motion.div>
              <div className="absolute w-[110px] h-[110px] rounded-full border border-[#2D6A4F]/10 transform rotate-[45deg]" />
              <div className="flex flex-col items-center">
                <IconPlant className="h-6 w-6 text-[#2D6A4F]" />
                <span className="text-[10px] font-mono text-[#6B7280] mt-2">Est. 2024</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Course Catalog & Details & How It Works: Premium Light Theme */}
      <div className="bg-[#FAFAF8] text-slate-800 font-sans selection:bg-[#2D6A4F] selection:text-white min-h-screen overflow-x-hidden pb-20">
        {/* SECTION 2 — CATEGORY FILTER BAR */}
        <div className="relative md:sticky md:top-16 z-20 bg-[#FAFAF8]/95 backdrop-blur-md border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
            {/* Pills Container */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1 py-1 pr-4">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`relative shrink-0 text-xs px-4 py-2 font-semibold rounded-full transition cursor-pointer border ${
                    selectedCategory === cat 
                      ? "bg-[#2D6A4F] text-white border-transparent"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-[#2D6A4F]"
                  }`}
                >
                  <span className="relative z-10">
                    {cat === "AI in Agriculture" ? (
                      <span className={`font-serif italic ${selectedCategory === cat ? "text-cyan-200" : "text-cyan-600 hover:text-cyan-800"}`}>
                        AI in Agriculture
                      </span>
                    ) : (
                      cat
                    )}
                  </span>
                </button>
              ))}
            </div>

            {/* Desktop Search */}
            <div className="hidden md:flex items-center relative w-[220px]">
              <IconSearch className="absolute left-3.5 text-slate-400 shrink-0 h-4 w-4" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-900 text-xs pl-10 pr-4 py-2 rounded-full focus:outline-none focus:border-[#2D6A4F] placeholder-slate-400 focus:ring-1 focus:ring-[#2D6A4F]/20"
              />
            </div>

            {/* Mobile Search Trigger */}
            <div className="flex md:hidden items-center">
              <button
                onClick={() => setMobileSearchOpen(prev => !prev)}
                className="p-2 border border-slate-200 rounded-full bg-white text-slate-600 hover:text-[#2D6A4F] cursor-pointer"
              >
                <IconSearch className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* Collapsible Mobile Search Input */}
          <AnimatePresence>
            {mobileSearchOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="md:hidden border-t border-slate-200 px-6 py-3 bg-[#FAFAF8]"
              >
                <div className="relative">
                  <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-900 text-sm pl-10 pr-4 py-2.5 rounded-full focus:outline-none focus:border-[#2D6A4F] placeholder-slate-400 focus:ring-1 focus:ring-[#2D6A4F]/20"
                    autoFocus
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SECTION 3 — COURSE GRID */}
        <section id="courses" className="max-w-7xl mx-auto px-6 py-12 md:py-20">
          {/* GeeksForGeeks style Header Row */}
          <div className="flex items-center justify-between mb-8 pb-2">
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-800 tracking-tight">Courses</h2>
            <button 
              onClick={() => {
                setSelectedCategory("All Courses");
                setSearchQuery("");
              }}
              className="border border-slate-700 rounded-full px-5 py-1.5 text-xs text-slate-700 font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              View All
            </button>
          </div>

          {loading ? (
            /* Shimmer Loaders (Light themed) */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white border border-slate-100 rounded-2xl overflow-hidden flex flex-col h-[380px] shadow-xs">
                  <div className="aspect-video w-full bg-slate-100 animate-pulse" />
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="h-3 w-1/4 bg-slate-100 rounded-sm animate-pulse mb-4" />
                      <div className="h-5 w-3/4 bg-slate-100 rounded-sm animate-pulse mb-3" />
                      <div className="h-5 w-1/2 bg-slate-100 rounded-sm animate-pulse" />
                    </div>
                    <div className="h-10 w-full bg-slate-100 rounded-sm animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
              <IconSearch className="h-12 w-12 text-[#2D6A4F] mb-4 opacity-40" />
              <h3 className="text-lg md:text-xl font-semibold text-slate-800 mb-2">No courses match your search</h3>
              <p className="text-sm text-slate-500 mb-6">
                Try a different keyword or browse all categories.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory("All Courses");
                  setSearchQuery("");
                }}
                className="bg-transparent border border-[#2D6A4F] text-[#2D6A4F] text-xs md:text-sm px-5 py-2.5 rounded-full transition hover:bg-[#2D6A4F]/5 font-semibold cursor-pointer"
              >
                Clear filters
              </button>
            </div>
          ) : (
            /* Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {filteredCourses.map((c, idx) => {
                const totalHours = c.duration_minutes ? Math.ceil(c.duration_minutes / 60) : 0;
                
                // Map course slug to realistic high-interest count
                let interestCount = "88k+";
                if (c.slug === "sukuma-wiki-production" || c.slug?.includes("sukuma")) interestCount = "88k+";
                else if (c.slug === "avocado-masterclass" || c.slug?.includes("avocado")) interestCount = "180k+";
                else if (c.slug === "dairy-farming-essentials" || c.slug?.includes("dairy")) interestCount = "427k+";
                else if (c.slug === "poultry-farming-essentials" || c.slug?.includes("poultry")) interestCount = "450k+";
                else if (c.slug === "ai-in-agriculture" || c.slug?.includes("ai")) interestCount = "328k+";

                // Live indicator logic
                const isLive = c.slug?.includes("sukuma") || c.slug?.includes("avocado") || c.slug?.includes("dairy") || c.slug?.includes("poultry");

                // Map standard levels
                let levelLabel = "Beginner to Advanced";
                if (c.level === "intermediate") levelLabel = "Intermediate and Advanced";
                else if (c.level === "advanced") levelLabel = "Advanced";

                // Strictly alternate between Yellow/Amber and Forest Green
                const btnColors = [
                  { 
                    text: "text-[#CA8A04]", 
                    bg: "group-hover:bg-[#CA8A04]", 
                    hoverText: "group-hover:text-[#CA8A04]",
                    shadow: "group-hover:shadow-[3px_3px_0px_0px_#112E22]" 
                  }, // Yellow/Amber
                  { 
                    text: "text-[#2D6A4F]", 
                    bg: "group-hover:bg-[#2D6A4F]", 
                    hoverText: "group-hover:text-[#2D6A4F]",
                    shadow: "group-hover:shadow-[3px_3px_0px_0px_#112E22]" 
                  }, // Green
                ];
                const colorConfig = btnColors[idx % btnColors.length];

                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-white border border-slate-100 rounded-none overflow-hidden flex flex-col group justify-between shadow-xs hover:shadow-lg transition-all duration-300"
                  >
                    <div>
                      {/* Thumbnail aspect-video */}
                      <div className="aspect-[4/3] relative overflow-hidden bg-slate-50 border-b border-slate-100">
                        {renderCourseCover(c)}

                        {/* Top Left Live/Self-Paced Badge */}
                        {isLive ? (
                          <div className="absolute bottom-3 left-3 bg-[#DC2626] text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-[4px] flex items-center gap-1 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            <span>LIVE COURSE</span>
                          </div>
                        ) : (
                          <div className="absolute bottom-3 left-3 bg-slate-900/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-[4px] backdrop-blur-[2px]">
                            SELF PACED
                          </div>
                        )}

                        {/* Top Right Rating Badge */}
                        <div className="absolute top-3 right-3 bg-[#0A0D0E]/60 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-0.5 backdrop-blur-[2px]">
                          <span className="text-[#F5A623]">★</span>
                          <span>{((c.rating && c.rating > 0) ? c.rating : 4.5).toFixed(1)}</span>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-5 text-left">
                        <span className={`text-[10px] font-bold tracking-[0.12em] uppercase block mb-1.5 font-sans`}>
                          {c.category === "AI in Agriculture" ? (
                            <span className="font-serif italic text-cyan-600 tracking-normal lowercase first-letter:uppercase">AI in Agriculture</span>
                          ) : (
                            <span className={colorConfig.text}>{c.category || "CROP PRODUCTION"}</span>
                          )}
                        </span>
                        <h3 className={`text-slate-800 ${colorConfig.hoverText} font-semibold text-[17px] leading-snug line-clamp-2 h-[44px] transition-colors duration-200`}>
                          {renderCourseTitle(c.title, colorConfig)}
                        </h3>

                        {/* Level Display */}
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-4">
                          <IconChartBar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{levelLabel}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="px-5 pb-5 text-left flex flex-col">
                      {/* Subtle Separator */}
                      <div className="border-t border-slate-100/90 w-full my-4" />
                      
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => setSelectedCourseId(c.id)}
                          className="text-xs bg-[#F5A623] text-[#112E22] font-bold px-4 py-2 rounded-none flex items-center gap-1.5 cursor-pointer border border-[#112E22] shadow-[2px_2px_0px_0px_#112E22] hover:bg-[#E59518] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_#112E22] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#112E22] transition-all duration-150"
                        >
                          <span>Explore now</span>
                          <span>→</span>
                        </button>
                      </div>
                    </div>
</motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* SECTION 4 — COURSE DETAIL FULLSCREEN WORKSPACE & DETAILED PREVIEW MODAL */}
        <AnimatePresence>
          {selectedCourseId && modalCourse && (
            isStudySessionActive ? (
              /* IMMERSIVE FULL-VIEW CLASSROOM WORKSPACE */
              <div className="fixed top-16 left-0 right-0 bottom-0 z-30 bg-black flex flex-col select-none h-[calc(100vh-64px)] overflow-hidden">
                {/* Header Bar */}
                <div className="bg-[#091F14] text-white px-6 py-3.5 flex items-center justify-between border-b border-[#FAF9F5]/10 shrink-0 z-20 shadow-md">
                  {/* Left: Back Button */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setIsStudySessionActive(false)}
                      className="flex items-center gap-2 text-xs font-black text-[#F5A623] hover:text-[#E59518] transition-colors cursor-pointer bg-transparent border-0 uppercase tracking-widest font-mono"
                    >
                      <IconChevronLeft className="h-4 w-4 stroke-[3]" />
                      <span>BACK TO DETAILS</span>
                    </button>
                    <div className="h-4 w-[1px] bg-[#FAF9F5]/15 hidden md:block"></div>
                    <div className="hidden md:block text-left">
                      <span className="text-[9px] text-[#52B788] font-mono tracking-widest uppercase block font-bold">
                        {modalCourse.title}
                      </span>
                    </div>
                  </div>

                  {/* Center: Current Lesson Title */}
                  <div className="text-center flex-1 mx-4 min-w-0">
                    <h4 className="text-xs md:text-sm font-bold text-white truncate uppercase tracking-wide">
                      {currentLesson?.title || "Classroom Preview"}
                    </h4>
                  </div>

                  {/* Right: Toggle Syllabus Drawer Button */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                      className="flex items-center gap-2 text-xs font-black text-white hover:text-[#F5A623] transition-colors cursor-pointer bg-transparent border-0 uppercase tracking-widest font-mono"
                    >
                      <IconMenu className="h-4 w-4" />
                      <span className="hidden sm:inline">{isSidebarOpen ? "Hide Syllabus" : "Show Syllabus"}</span>
                    </button>
                  </div>
                </div>

                {/* Main Body: Video and Collapsible Syllabus */}
                <div className="flex-1 flex overflow-hidden w-full relative bg-black">
                  {/* Left Pane: Immersive Video / Content Viewer */}
                  <div className="flex-1 h-full bg-black relative flex items-center justify-center overflow-hidden">
                    {viewMode === "locked" ? (
                      <div className="w-full h-full bg-[#06150D] flex flex-col items-center justify-center p-6 text-center select-none">
                        <div className="w-12 h-12 rounded-full bg-white/5 text-[#F5A623] flex items-center justify-center mb-3 border border-[#F5A623]/20">
                          <IconLock className="h-5 w-5" />
                        </div>
                        <h4 className="text-sm font-semibold text-white mb-1.5 uppercase font-sans tracking-wide">
                          {currentLesson?.title || "Lesson Locked"}
                        </h4>
                        <p className="text-xs text-slate-400 max-w-xs mb-4 leading-relaxed font-sans">
                          This lesson is part of the full course curriculum. Enroll to unlock all course materials and track your learning progress.
                        </p>
                        <button
                          onClick={handleEnroll}
                          className="bg-[#2D6A4F] text-[#F5A623] hover:bg-[#1a5c3a] font-bold text-xs px-5 py-2.5 rounded-none border border-[#FAF9F5]/25 cursor-pointer uppercase tracking-wider transition-colors"
                        >
                          Enroll in Course for Free
                        </button>
                      </div>
                    ) : viewMode === "video" && currentLesson?.video_url ? (
                      extractYoutubeId(currentLesson.video_url) ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${extractYoutubeId(currentLesson.video_url)}?autoplay=1`}
                          title={currentLesson.title}
                          className="w-full h-full border-0 absolute inset-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : extractVimeoId(currentLesson.video_url) ? (
                        <iframe
                          src={`https://player.vimeo.com/video/${extractVimeoId(currentLesson.video_url)}?autoplay=1`}
                          title={currentLesson.title}
                          className="w-full h-full border-0 absolute inset-0"
                          allow="autoplay; fullscreen; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <video
                          src={currentLesson.video_url}
                          controls
                          autoPlay
                          className="w-full h-full object-contain absolute inset-0"
                        />
                      )
                    ) : viewMode === "text" && currentLesson?.text_content ? (
                      /* Clean Dark-Themed Reading Workspace */
                      <div className="w-full h-full bg-[#06150D] p-8 md:p-12 overflow-y-auto text-left custom-scrollbar flex flex-col justify-between">
                        <div className="max-w-3xl mx-auto w-full space-y-6">
                          <div className="flex items-center gap-2">
                            <span className="bg-[#F5A623]/10 text-[#F5A623] text-[9px] font-mono px-2 py-0.5 rounded-none border border-[#F5A623]/30 uppercase font-bold">
                              READING NOTES
                            </span>
                          </div>
                          <h2 className="text-xl md:text-2xl font-black text-white leading-tight uppercase font-sans">
                            {currentLesson.title}
                          </h2>
                          <div className="text-sm text-slate-300 leading-relaxed space-y-4 whitespace-pre-wrap font-sans font-light">
                            {currentLesson.text_content}
                          </div>
                        </div>
                        {currentLesson.pdf_url && (
                          <div className="max-w-3xl mx-auto w-full mt-10 pt-6 border-t border-[#FAF9F5]/10">
                            <a
                              href={currentLesson.pdf_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 bg-[#FAF9F5]/5 hover:bg-[#FAF9F5]/10 text-white text-xs font-semibold px-5 py-2.5 rounded-none border border-[#FAF9F5]/25 transition-colors"
                            >
                              <IconPdf className="h-4 w-4 text-[#F5A623]" />
                              <span>Open PDF Study Guide</span>
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Intro View: Play Course Intro Video or show Cover Image */
                      (modalCourse.intro_video_url || modalCourse.youtube_id) ? (
                        (() => {
                          const videoUrl = modalCourse.intro_video_url || (modalCourse.youtube_id ? `https://youtube.com/watch?v=${modalCourse.youtube_id}` : "");
                          if (extractYoutubeId(videoUrl)) {
                            return (
                              <iframe
                                src={`https://www.youtube.com/embed/${extractYoutubeId(videoUrl)}?autoplay=1`}
                                title="Course Trailer"
                                className="w-full h-full border-0 absolute inset-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            );
                          } else if (extractVimeoId(videoUrl)) {
                            return (
                              <iframe
                                src={`https://player.vimeo.com/video/${extractVimeoId(videoUrl)}?autoplay=1`}
                                title="Course Trailer"
                                className="w-full h-full border-0 absolute inset-0"
                                allow="autoplay; fullscreen; picture-in-picture"
                                allowFullScreen
                              />
                            );
                          } else {
                            return (
                              <video
                                src={videoUrl}
                                controls
                                autoPlay
                                className="w-full h-full object-contain absolute inset-0"
                              />
                            );
                          }
                        })()
                      ) : (
                        /* Cover Preview Cover Image */
                        <div className="w-full h-full relative bg-[#06150D]">
                          {modalCourse.cover_image_url ? (
                            <img
                              src={modalCourse.cover_image_url}
                              alt={modalCourse.title}
                              className="w-full h-full object-cover opacity-30"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <IconPlant className="h-16 w-16 text-[#2D6A4F]/30" />
                            </div>
                          )}
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-t from-black via-black/40 to-transparent">
                            <button
                              onClick={() => {
                                const firstChapter = modalCourse.chapters?.[0];
                                const firstVideo = firstChapter?.lessons?.find((l: any) => l.content_type === "video");
                                const fallbackLesson = firstChapter?.lessons?.[0];
                                
                                if (firstVideo) {
                                  setCurrentLesson(firstVideo);
                                  setViewMode("video");
                                } else if (fallbackLesson) {
                                  setCurrentLesson(fallbackLesson);
                                  setViewMode(fallbackLesson.content_type === "text" ? "text" : "intro");
                                }
                              }}
                              className="w-14 h-14 rounded-none bg-[#2D6A4F] text-[#F5A623] hover:scale-105 transition-transform flex items-center justify-center shadow-lg border border-[#F5A623]/25 cursor-pointer"
                            >
                              <IconPlay className="h-5 w-5 fill-current ml-0.5" />
                            </button>
                            <span className="text-[10px] text-slate-400 mt-3 font-mono tracking-widest select-none">
                              PREVIEW COURSE LESSONS
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  {/* Right Pane: Collapsible Syllabus Sidebar */}
                  {isSidebarOpen && (
                    <div className="w-80 h-full bg-[#06150D] border-l border-[#FAF9F5]/10 flex flex-col shrink-0 z-10">
                      {/* Sidebar Student Progress */}
                      {modalCourse.is_enrolled && (
                        <div className="p-4 border-b border-[#FAF9F5]/10 bg-[#091F14] text-left">
                          <div className="flex justify-between items-center text-[9px] text-slate-400 mb-1.5 font-mono">
                            <span>YOUR PROGRESS</span>
                            <span className="text-[#F5A623] font-bold">{modalCourse.progress_pct}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-black border border-[#FAF9F5]/10 rounded-none overflow-hidden">
                            <div 
                              className="h-full bg-[#F5A623] transition-all duration-300"
                              style={{ width: `${modalCourse.progress_pct}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Syllabus Flat List */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 text-left custom-scrollbar">
                        {/* Course Intro Video Item if available */}
                        {(modalCourse.intro_video_url || modalCourse.youtube_id) && (
                          <div
                            onClick={() => {
                              setViewMode("intro");
                              setCurrentLesson(null);
                            }}
                            className={`w-full p-3 flex items-start gap-3 transition cursor-pointer border ${
                              viewMode === "intro"
                                ? "bg-[#2D6A4F]/10 border-[#F5A623] text-white"
                                : "bg-[#091F14] border-[#FAF9F5]/5 text-slate-300 hover:bg-[#2D6A4F]/5 hover:border-[#FAF9F5]/10"
                            }`}
                          >
                            <div className="border border-[#F5A623]/30 px-1.5 py-0.5 text-[10px] sm:text-xs text-[#F5A623] font-mono font-bold shrink-0">
                              INTRO
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <span className={`text-xs sm:text-sm font-medium block leading-tight ${viewMode === "intro" ? "text-[#F5A623]" : "text-white"}`}>
                                Course Introduction & Overview
                              </span>
                              <span className="text-[10px] sm:text-xs text-slate-400 font-mono mt-1 block">
                                VIDEO TRAILER
                              </span>
                            </div>
                          </div>
                        )}

                        {(() => {
                          const allLessons = modalCourse.chapters?.flatMap((ch: any) => ch.lessons || []) || [];
                          if (allLessons.length === 0) {
                            if (!modalCourse.intro_video_url && !modalCourse.youtube_id) {
                              return (
                                <div className="text-xs text-slate-500 font-mono py-2">
                                  Syllabus structure is currently empty.
                                </div>
                              );
                            }
                            return null;
                          }
                          return allLessons.map((les: any, idx: number) => {
                            const isText = les.content_type === "text";
                            const isExpanded = !!expandedLessons[les.id];
                            const isActive = !isText && viewMode !== "intro" && currentLesson?.id === les.id;
                            const isLocked = !modalCourse.is_enrolled && !les.is_free_preview;
                            const isCompleted = modalCourse.completed_lessons?.includes(les.id);
                            return (
                              <div key={les.id} className="w-full flex flex-col">
                                <div
                                  onClick={() => {
                                    if (isText) {
                                      setExpandedLessons(prev => ({
                                        ...prev,
                                        [les.id]: !prev[les.id]
                                      }));
                                    } else {
                                      handleLessonSelect(les);
                                    }
                                  }}
                                  className={`w-full p-3 flex items-start gap-3 transition cursor-pointer border ${
                                    isActive
                                      ? "bg-[#2D6A4F]/10 border-[#F5A623] text-white"
                                      : "bg-[#091F14] border-[#FAF9F5]/5 text-slate-300 hover:bg-[#2D6A4F]/5 hover:border-[#FAF9F5]/10"
                                  }`}
                                >
                                  {/* Checkbox / Number */}
                                  {modalCourse.is_enrolled ? (
                                    <button
                                      onClick={(e) => handleToggleCompletion(e, les.id)}
                                      className={`w-4 h-4 border flex items-center justify-center shrink-0 transition-colors cursor-pointer rounded-none bg-transparent ${
                                        isCompleted
                                          ? "bg-[#2D6A4F] border-[#2D6A4F] text-[#F5A623]"
                                          : "border-slate-500 text-transparent hover:border-slate-400"
                                      }`}
                                      title={isCompleted ? "Mark incomplete" : "Mark complete"}
                                    >
                                      <IconCheck className="h-2.5 w-2.5" />
                                    </button>
                                  ) : (
                                    <div className="border border-[#F5A623]/30 px-1.5 py-0.5 text-[10px] sm:text-xs text-[#F5A623] font-mono font-bold shrink-0">
                                      #{String(idx + 1).padStart(2, '0')}
                                    </div>
                                  )}

                                  {/* Content */}
                                  <div className="flex-1 min-w-0 text-left">
                                    <div className="flex items-center gap-1.5 justify-between">
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        {isLocked && <IconLock className="h-2.5 w-2.5 text-slate-500 shrink-0" />}
                                        <span className={`text-xs sm:text-sm font-medium block leading-tight truncate ${isActive ? "text-[#F5A623]" : "text-white"}`}>
                                          {les.title}
                                        </span>
                                      </div>
                                      {isText && (
                                        <span className="text-[11px] sm:text-xs text-[#F5A623] font-mono shrink-0">
                                          {isExpanded ? "▲ COLLAPSE" : "▼ EXPAND"}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] sm:text-xs text-slate-400 font-mono mt-1 block">
                                      {les.video_duration_seconds ? `${Math.floor(les.video_duration_seconds / 60)} MINS` : "TEXT READING"}
                                    </span>
                                  </div>
                                </div>
                                {isText && isExpanded && (
                                  <div className="w-full bg-[#06150D] border-x border-b border-[#FAF9F5]/10 p-4 text-left space-y-3">
                                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                                      {les.text_content || "No summary notes provided for this chapter."}
                                    </p>
                                    {les.pdf_url && (
                                      <div className="pt-2 border-t border-[#FAF9F5]/5">
                                        <a
                                          href={les.pdf_url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1.5 bg-[#FAF9F5]/5 hover:bg-[#FAF9F5]/10 text-white text-xs font-semibold px-3 py-1.5 rounded-none border border-[#FAF9F5]/20 transition-colors"
                                        >
                                          <IconPdf className="h-3 w-3 text-[#F5A623]" />
                                          <span>Open PDF Study Guide</span>
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* DETAILED PREVIEW MODAL MATCHING USER SCREENSHOT EXACTLY */
              <div className="fixed top-16 left-0 right-0 bottom-0 z-50 bg-[#091F14] overflow-hidden">
                {/* Close Button (X) */}
                <button
                  onClick={() => setSelectedCourseId(null)}
                  className="fixed top-[80px] right-6 z-60 border-2 border-[#F5A623] hover:bg-[#F5A623] hover:text-[#091F14] text-[#F5A623] p-1.5 transition-colors cursor-pointer rounded-none bg-[#091F14] flex items-center justify-center shrink-0 w-8 h-8 shadow-md"
                  title="Close Preview"
                >
                  <IconX className="h-5 w-5 stroke-[2.5]" />
                </button>

                {/* Modal Content */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-full h-full overflow-y-auto bg-[#091F14] flex flex-col md:flex-row text-white"
                >
                  {/* LEFT COLUMN: Video Player & Curriculum (55%) */}
                  <div className="w-full md:w-[55%] flex flex-col p-6 md:p-8 justify-between space-y-6 bg-[#091F14] border-b md:border-b-0 md:border-r border-[#FAF9F5]/10">
                    {/* Header Tags & Title */}
                    <div className="space-y-4 text-left">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 bg-[#F5A623]/10 border border-[#F5A623]/30 px-2 py-0.5 text-[9px] font-black uppercase text-[#F5A623] tracking-wide rounded-none font-mono">
                          ★ PREMIUM CLASSROOM
                        </span>
                        <span className="inline-flex items-center bg-[#2D6A4F]/20 border border-[#2D6A4F]/40 px-2 py-0.5 text-[9px] font-black uppercase text-[#52B788] tracking-wide rounded-none font-mono">
                          {modalCourse.category || "CROP PRODUCTION"}
                        </span>
                      </div>

                      <h2 className="text-xl md:text-2xl font-black text-white leading-tight uppercase font-sans">
                        {modalCourse.title}
                      </h2>

                      <p className="text-xs text-slate-300 leading-relaxed font-light font-sans">
                        {modalCourse.description || "Learn how to establish, grow, and scale a highly profitable agricultural enterprise with regional agronomists."}
                      </p>
                    </div>

                    {/* Video Area */}
                    <div className="w-full aspect-video bg-[#06150D] relative border border-[#FAF9F5]/10 overflow-hidden rounded-none shadow-md">
                      {viewMode === "locked" ? (
                        <div className="w-full h-full bg-[#06150D] flex flex-col items-center justify-center p-6 text-center select-none">
                          <div className="w-12 h-12 rounded-full bg-[#1F2937]/50 text-[#F5A623] flex items-center justify-center mb-3 border border-[#F5A623]/20">
                            <IconLock className="h-5 w-5" />
                          </div>
                          <h4 className="text-sm font-semibold text-white mb-1.5">
                            {currentLesson?.title || "Lesson Locked"}
                          </h4>
                          <p className="text-xs text-[#9CA3AF] max-w-xs mb-4 leading-relaxed font-sans">
                            This lesson is part of the full course curriculum. Enroll to unlock all course materials and track your learning progress.
                          </p>
                          <button
                            onClick={handleEnroll}
                            className="bg-[#2D6A4F] text-[#F5A623] hover:bg-[#1a5c3a] font-bold text-xs px-5 py-2.5 rounded-none border border-[#FAF9F5]/25 cursor-pointer uppercase tracking-wider transition-colors"
                          >
                            Enroll in Course for Free
                          </button>
                        </div>
                      ) : viewMode === "video" && currentLesson?.video_url ? (
                        extractYoutubeId(currentLesson.video_url) ? (
                          <iframe
                            src={`https://www.youtube.com/embed/${extractYoutubeId(currentLesson.video_url)}?autoplay=0`}
                            title={currentLesson.title}
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : extractVimeoId(currentLesson.video_url) ? (
                          <iframe
                            src={`https://player.vimeo.com/video/${extractVimeoId(currentLesson.video_url)}?autoplay=0`}
                            title={currentLesson.title}
                            className="w-full h-full border-0"
                            allow="autoplay; fullscreen; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <video
                            src={currentLesson.video_url}
                            controls
                            className="w-full h-full object-contain"
                          />
                        )
                      ) : viewMode === "text" && currentLesson?.text_content ? (
                        /* Text Content view inside video frame */
                        <div className="w-full h-full bg-[#06150D] p-6 overflow-y-auto text-left custom-scrollbar">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="bg-[#F5A623]/10 text-[#F5A623] text-[9px] font-mono px-2 py-0.5 rounded-none border border-[#F5A623]/30 uppercase font-bold">
                              READING NOTES
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-white mb-4">
                            {currentLesson.title}
                          </h4>
                          <div className="text-xs text-slate-300 leading-relaxed space-y-3 whitespace-pre-wrap font-sans">
                            {currentLesson.text_content}
                          </div>
                          {currentLesson.pdf_url && (
                            <div className="mt-6 pt-4 border-t border-[#FAF9F5]/10">
                              <a
                                href={currentLesson.pdf_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 bg-[#FAF9F5]/5 hover:bg-[#FAF9F5]/10 text-white text-xs font-semibold px-4 py-2 rounded-none border border-[#FAF9F5]/25 transition-colors"
                              >
                                <IconPdf className="h-4 w-4 text-[#F5A623]" />
                                <span>Open PDF Study Guide</span>
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Intro View: Play Course Intro Video or show Cover Image */
                        (modalCourse.intro_video_url || modalCourse.youtube_id) ? (
                          (() => {
                            const videoUrl = modalCourse.intro_video_url || (modalCourse.youtube_id ? `https://youtube.com/watch?v=${modalCourse.youtube_id}` : "");
                            if (extractYoutubeId(videoUrl)) {
                              return (
                                <iframe
                                  src={`https://www.youtube.com/embed/${extractYoutubeId(videoUrl)}?autoplay=0`}
                                  title="Course Trailer"
                                  className="w-full h-full border-0 absolute inset-0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              );
                            } else if (extractVimeoId(videoUrl)) {
                              return (
                                <iframe
                                  src={`https://player.vimeo.com/video/${extractVimeoId(videoUrl)}?autoplay=0`}
                                  title="Course Trailer"
                                  className="w-full h-full border-0 absolute inset-0"
                                  allow="autoplay; fullscreen; picture-in-picture"
                                  allowFullScreen
                                />
                              );
                            } else {
                              return (
                                <video
                                  src={videoUrl}
                                  controls
                                  className="w-full h-full object-contain absolute inset-0"
                                />
                              );
                            }
                          })()
                        ) : (
                          /* Intro Cover Image with Play Button if no intro video url */
                          <div className="w-full h-full relative bg-[#06150D]">
                            {modalCourse.cover_image_url ? (
                              <img
                                src={modalCourse.cover_image_url}
                                alt={modalCourse.title}
                                className="w-full h-full object-cover opacity-35"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <IconPlant className="h-16 w-16 text-[#2D6A4F]/30" />
                              </div>
                            )}
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-t from-black via-black/40 to-transparent">
                              <button
                                onClick={() => {
                                  const firstChapter = modalCourse.chapters?.[0];
                                  const firstVideo = firstChapter?.lessons?.find((l: any) => l.content_type === "video");
                                  const fallbackLesson = firstChapter?.lessons?.[0];
                                  
                                  if (firstVideo) {
                                    setCurrentLesson(firstVideo);
                                    setViewMode("video");
                                  } else if (fallbackLesson) {
                                    setCurrentLesson(fallbackLesson);
                                    setViewMode(fallbackLesson.content_type === "text" ? "text" : "intro");
                                  }
                                }}
                                className="w-14 h-14 rounded-none bg-[#2D6A4F] text-[#F5A623] hover:scale-105 transition-transform flex items-center justify-center shadow-lg border border-[#F5A623]/25 cursor-pointer"
                              >
                                <IconPlay className="h-5 w-5 fill-current ml-0.5" />
                              </button>
                              <span className="text-[10px] text-slate-400 mt-3 font-mono tracking-widest select-none">
                                PREVIEW COURSE LESSONS
                              </span>
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    {/* Instructor section */}
                    <div className="flex items-center gap-3 border-t border-[#FAF9F5]/10 pt-4 text-left">
                      <div className="w-9 h-9 rounded-none bg-[#2D6A4F] border border-[#2D6A4F]/40 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {modalCourse.instructor_name ? modalCourse.instructor_name.split(" ").map((n: string) => n[0]).join("") : "SK"}
                      </div>
                      <div>
                        <span className="text-[9px] text-[#F5A623] block font-mono font-bold tracking-wider">COURSE INSTRUCTOR</span>
                        <span className="text-xs font-semibold text-white block leading-tight">
                          {modalCourse.instructor_name || "Samuel Kiprono"}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate max-w-[320px] mt-0.5">
                          {modalCourse.instructor_title || "Lead Horticulturist & Agronomy Extension Officer"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Course Syllabus & Actions (45%) */}
                  <div className="w-full md:w-[45%] flex flex-col justify-between p-6 md:p-8 bg-[#091F14] space-y-6">
                    <div className="flex flex-col flex-1 min-h-0 bg-[#091F14]">
                      {/* Syllabus Header */}
                      <div className="flex items-center justify-between pb-4 border-b border-[#FAF9F5]/10">
                        <h3 className="text-[#F5A623] text-xs font-black uppercase tracking-widest text-left">
                          COURSE SYLLABUS
                        </h3>
                      </div>

                      {/* Syllabus Lessons List */}
                      <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1 max-h-[400px] md:max-h-[calc(100vh-280px)] custom-scrollbar text-left bg-[#091F14]">
                        {/* Course Intro Video Item if available */}
                        {(modalCourse.intro_video_url || modalCourse.youtube_id) && (
                          <div
                            onClick={() => {
                              setViewMode("intro");
                              setCurrentLesson(null);
                            }}
                            className={`w-full p-3 flex items-start gap-3 transition cursor-pointer border ${
                              viewMode === "intro"
                                ? "bg-[#2D6A4F]/10 border-[#F5A623] text-white"
                                : "bg-[#091F14] border-[#FAF9F5]/5 text-slate-300 hover:bg-[#2D6A4F]/5 hover:border-[#FAF9F5]/10"
                            }`}
                          >
                            <div className="border border-[#F5A623]/30 px-1.5 py-0.5 text-[10px] sm:text-xs text-[#F5A623] font-mono font-bold shrink-0">
                              INTRO
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <span className={`text-xs sm:text-sm font-medium block leading-tight ${viewMode === "intro" ? "text-[#F5A623]" : "text-white"}`}>
                                Course Introduction & Overview
                              </span>
                              <span className="text-[10px] sm:text-xs text-slate-400 font-mono mt-1 block">
                                VIDEO TRAILER
                              </span>
                            </div>
                          </div>
                        )}

                        {(() => {
                          const allLessons = modalCourse.chapters?.flatMap((ch: any) => ch.lessons || []) || [];
                          if (allLessons.length === 0) {
                            if (!modalCourse.intro_video_url && !modalCourse.youtube_id) {
                              return (
                                <div className="text-xs text-slate-500 font-mono py-2">
                                  Syllabus structure is currently empty.
                                </div>
                              );
                            }
                            return null;
                          }
                          return allLessons.map((les: any, idx: number) => {
                            const isText = les.content_type === "text";
                            const isExpanded = !!expandedLessons[les.id];
                            const isActive = !isText && viewMode !== "intro" && currentLesson?.id === les.id;
                            const isLocked = !modalCourse.is_enrolled && !les.is_free_preview;
                            return (
                              <div key={les.id} className="w-full flex flex-col">
                                <div
                                  onClick={() => {
                                    if (isText) {
                                      setExpandedLessons(prev => ({
                                        ...prev,
                                        [les.id]: !prev[les.id]
                                      }));
                                    } else {
                                      handleLessonSelect(les);
                                    }
                                  }}
                                  className={`w-full p-3 flex items-start gap-3 transition cursor-pointer border ${
                                    isActive
                                      ? "bg-[#2D6A4F]/10 border-[#F5A623] text-white"
                                      : "bg-[#091F14] border-[#FAF9F5]/5 text-slate-300 hover:bg-[#2D6A4F]/5 hover:border-[#FAF9F5]/10"
                                  }`}
                                >
                                  {/* Number block */}
                                  <div className="border border-[#F5A623]/30 px-1.5 py-0.5 text-[10px] sm:text-xs text-[#F5A623] font-mono font-bold shrink-0">
                                    #{String(idx + 1).padStart(2, '0')}
                                  </div>
                                  {/* Content */}
                                  <div className="flex-1 min-w-0 text-left">
                                    <div className="flex items-center gap-1.5 justify-between">
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        {isLocked && <IconLock className="h-2.5 w-2.5 text-slate-500 shrink-0" />}
                                        <span className={`text-xs sm:text-sm font-medium block leading-tight truncate ${isActive ? "text-[#F5A623]" : "text-white"}`}>
                                          {les.title}
                                        </span>
                                      </div>
                                      {isText && (
                                        <span className="text-[11px] sm:text-xs text-[#F5A623] font-mono shrink-0">
                                          {isExpanded ? "▲ COLLAPSE" : "▼ EXPAND"}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] sm:text-xs text-slate-400 font-mono mt-1 block">
                                      {les.video_duration_seconds ? `${Math.floor(les.video_duration_seconds / 60)} MINS` : "TEXT READING"}
                                    </span>
                                  </div>
                                </div>
                                {isText && isExpanded && (
                                  <div className="w-full bg-[#06150D] border-x border-b border-[#FAF9F5]/10 p-4 text-left space-y-3">
                                    <p className="text-sm sm:text-base text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                                      {les.text_content || "No summary notes provided for this chapter."}
                                    </p>
                                    {les.pdf_url && (
                                      <div className="pt-2 border-t border-[#FAF9F5]/5">
                                        <a
                                          href={les.pdf_url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1.5 bg-[#FAF9F5]/5 hover:bg-[#FAF9F5]/10 text-white text-xs font-semibold px-3 py-1.5 rounded-none border border-[#FAF9F5]/20 transition-colors"
                                        >
                                          <IconPdf className="h-3 w-3 text-[#F5A623]" />
                                          <span>Open PDF Study Guide</span>
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* CTA / Buttons area */}
                    <div className="border-t border-[#FAF9F5]/10 pt-5 space-y-3">
                      {modalCourse.is_enrolled ? (
                        <div className="space-y-3 text-left bg-[#091F14]">
                          <div>
                            <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1.5 font-mono">
                              <span>YOUR PROGRESS</span>
                              <span>{modalCourse.progress_pct}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-[#091F14] border border-[#FAF9F5]/10 rounded-none overflow-hidden">
                              <div 
                                className="h-full bg-[#F5A623] transition-all duration-300"
                                style={{ width: `${modalCourse.progress_pct}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex flex-col gap-2.5">
                            <button
                              onClick={() => setIsStudySessionActive(true)}
                              className="w-full bg-[#F5A623] text-black font-bold text-xs py-3.5 rounded-none border border-[#F5A623] hover:bg-[#E59518] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider shadow-lg"
                            >
                              <span>Enter Study Workspace</span>
                              <span>→</span>
                            </button>

                            {modalCourse.progress_pct === 100 && (
                              <button
                                onClick={generateCertificate}
                                className="w-full bg-gradient-to-r from-[#F5A623] to-[#d97706] text-black font-bold text-xs py-3.5 rounded-none hover:from-[#f6b445] hover:to-[#ea580c] transition duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg animate-pulse uppercase tracking-wider"
                              >
                                <IconCertificate className="h-4.5 w-4.5" />
                                <span>Claim Completion Certificate</span>
                              </button>
                            )}

                            <button
                              onClick={handleDownloadFieldGuide}
                              className="w-full bg-transparent text-white font-bold text-xs py-3.5 rounded-none border border-[#FAF9F5]/20 hover:bg-white/5 transition-colors cursor-pointer text-center uppercase tracking-wider"
                            >
                              Download Field Guide
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2.5">
                          <button
                            onClick={handleEnroll}
                            className="w-full bg-[#F5A623] text-black font-bold text-xs py-3.5 rounded-none border border-[#F5A623] hover:bg-[#E59518] transition-colors cursor-pointer text-center uppercase tracking-wider"
                          >
                            Start Classroom Study
                          </button>
                          <button
                            onClick={handleDownloadFieldGuide}
                            className="w-full bg-transparent text-white font-bold text-xs py-3.5 rounded-none border border-[#FAF9F5]/20 hover:bg-white/5 transition-colors cursor-pointer text-center uppercase tracking-wider"
                          >
                            Download Field Guide
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            )
          )}
        </AnimatePresence>

        {/* SECTION 5 — HOW IT WORKS */}
        <section id="how-it-works" className="bg-[#F4F8F5] py-8 md:py-12 px-4 sm:px-6 border-t border-slate-200/50">
          <div className="max-w-[1000px] mx-auto text-center">
            <h2 className="text-xl md:text-2xl font-serif text-slate-800 font-normal mb-1.5">How Mqulima Academy Works</h2>
            <p className="text-xs sm:text-sm text-slate-500 mb-6 md:mb-8">
              Three steps to transform how you farm
            </p>

            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 z-10">
              {/* Connector line for desktop */}
              <div className="hidden md:block absolute top-[40%] left-0 right-0 h-[1px] border-t border-dashed border-[#2D6A4F]/20 -z-10" />

              {/* Step 1 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0, duration: 0.5 }}
                className="bg-gradient-to-br from-[#E6F3ED] to-[#F1F8F5] border border-[#2D6A4F]/20 p-4 sm:p-5 text-left rounded-none shadow-xs relative"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[38px] sm:text-[42px] font-serif font-semibold text-[#2D6A4F]/30 leading-none">01</span>
                  <div className="w-8 h-8 rounded-none bg-white border border-[#2D6A4F]/20 flex items-center justify-center text-[#2D6A4F]">
                    <IconBook className="h-4.5 w-4.5" />
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-[#1B4332] mb-1.5">Choose a Course</h3>
                <p className="text-[12px] sm:text-[13px] text-[#2D6A4F]/80 leading-relaxed font-medium">
                  Browse specialized crop, livestock, and technology curriculums verified by regional agronomists.
                </p>
              </motion.div>

              {/* Step 2 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="bg-gradient-to-br from-[#FEF5E7] to-[#FFFBF5] border border-[#F5A623]/25 p-4 sm:p-5 text-left rounded-none shadow-xs relative"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[38px] sm:text-[42px] font-serif font-semibold text-[#F5A623]/40 leading-none">02</span>
                  <div className="w-8 h-8 rounded-none bg-white border border-[#F5A623]/20 flex items-center justify-center text-[#CA8A04]">
                    <IconPlay className="h-4 w-4 fill-current ml-0.5" />
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-[#854D0E] mb-1.5">Watch & Learn</h3>
                <p className="text-[12px] sm:text-[13px] text-[#854D0E]/80 leading-relaxed font-medium">
                  Consume step-by-step videos and reading notes. Preview lessons for free anytime.
                </p>
              </motion.div>

              {/* Step 3 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="bg-gradient-to-br from-[#E3F2FD] to-[#F1F8FE] border border-[#0284C7]/20 p-4 sm:p-5 text-left rounded-none shadow-xs relative"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[38px] sm:text-[42px] font-serif font-semibold text-[#0284C7]/30 leading-none">03</span>
                  <div className="w-8 h-8 rounded-none bg-white border border-[#0284C7]/20 flex items-center justify-center text-[#0284C7]">
                    <IconCertificate className="h-4.5 w-4.5" />
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-[#075985] mb-1.5">Apply on Your Farm</h3>
                <p className="text-[12px] sm:text-[13px] text-[#0369A1]/85 leading-relaxed font-medium">
                  Put practical agricultural advice into action to improve yields, optimize animal health, and boost margins.
                </p>
              </motion.div>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
