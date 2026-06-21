import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, TrendingUp, TrendingDown, Play, BookOpen, GraduationCap, Award, CheckCircle, FileText, Download, Star } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { articles, marketPrices } from "@/lib/mqulima-data";

export const Route = createFileRoute("/knowledge")({
  head: () => ({
    meta: [
      { title: "Academy & Knowledge Hub · Mqulima" },
      {
        name: "description",
        content: "Explore structured learning pathways, access guides, track course progress, and view live market prices.",
      },
    ],
  }),
  component: Knowledge,
});

const videos = [
  { title: "How to plant maize for 40 bags/acre", channel: "Mqulima TV", duration: "12:04" },
  { title: "Mastitis: prevention playbook", channel: "Vet Series", duration: "8:32" },
  { title: "Reading soil reports like a pro", channel: "Agronomy 101", duration: "15:18" },
];

// Mock Academy Courses
const academyCourses = [
  {
    id: "c1",
    level: "Farm Gateway",
    field: "Horticulture",
    aspect: "Soil Health",
    title: "Maize Production Mastery",
    duration: "4.5 hours",
    lessons: 12,
    rating: 4.9,
    progress: 65,
    instructor: "Dr. Samuel Mwangi",
    desc: "From land prep to post-harvest storage. Focuses on doubling yield in Trans Nzoia and Uasin Gishu."
  },
  {
    id: "c2",
    level: "Takeoff",
    field: "Animal Husbandry",
    aspect: "Crop Protection",
    title: "Introduction to Dairy Management",
    duration: "6 hours",
    lessons: 18,
    rating: 4.8,
    progress: 15,
    instructor: "Dr. Faith Achieng",
    desc: "Breeding programs, feeds formulations, mastitis control, and milk quality guidelines."
  },
  {
    id: "c3",
    level: "Freeway",
    field: "Farm Business",
    aspect: "Irrigation",
    title: "Farm Bookkeeping and Finances",
    duration: "3 hours",
    lessons: 8,
    rating: 4.7,
    progress: 0,
    instructor: "Brian Kiprono",
    desc: "How to track input costs, evaluate profit margins, and secure bank agricultural loans."
  },
  {
    id: "c4",
    level: "Farm Gateway",
    field: "Horticulture",
    aspect: "Irrigation",
    title: "Tomato Greenhouse Management",
    duration: "5 hours",
    lessons: 15,
    rating: 4.9,
    progress: 0,
    instructor: "Grace Mutiso",
    desc: "Drip irrigation, bacterial wilt prevention, pruning, staking, and greenhouse climate controls."
  }
];

const downloadableResources = [
  { title: "Maize Spraying Calendar", type: "PDF Guide", size: "2.4 MB" },
  { title: "Dairy Daily Feed & Milk Log", type: "Excel Template", size: "1.1 MB" },
  { title: "Soil Sample Collection Guide", type: "PDF Guide", size: "3.8 MB" },
];

function Knowledge() {
  const [activeView, setActiveView] = useState<"academy" | "market">("academy");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Academy filters
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [selectedField, setSelectedField] = useState("All");

  // Selected course detail modal simulation
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const filteredArticles = useMemo(() => {
    if (selectedCategory === "All") return articles;
    return articles.filter((a) => a.category === selectedCategory);
  }, [selectedCategory]);

  const filteredCourses = useMemo(() => {
    return academyCourses.filter((c) => {
      const matchesLevel = selectedLevel === "All" || c.level === selectedLevel;
      const matchesField = selectedField === "All" || c.field === selectedField;
      return matchesLevel && matchesField;
    });
  }, [selectedLevel, selectedField]);

  const selectedCourse = useMemo(() => {
    return academyCourses.find((c) => c.id === selectedCourseId);
  }, [selectedCourseId]);

  const handleDownload = (resName: string) => {
    toast.success(`Download Started!`, {
      description: `Resource: "${resName}" is downloading. Check your browser downloads directory.`,
    });
  };

  const handleResumeCourse = (courseTitle: string) => {
    toast.success(`Resumed Course: ${courseTitle}`, {
      description: "Loading lessons tree and media player. Syncing progress..."
    });
    setSelectedCourseId(null);
  };

  return (
    <AppLayout>
      <div className="bg-[#FAF9F6] text-[#1A1A1A] min-h-screen font-sans">
        
        {/* Banner Section */}
        <section className="bg-gradient-to-br from-[#1A3D2F] to-[#2D6A4F] py-16 text-white text-left">
          <div className="container-px mx-auto max-w-7xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#F5A623]">
              <GraduationCap className="h-4 w-4" /> Mqulima Hub Academy
            </span>
            <h1 className="mt-3 text-4xl font-extrabold md:text-5xl tracking-tight">
              Smart farming, simply explained.
            </h1>
            <p className="mt-2 max-w-xl text-white/80 text-sm leading-relaxed">
              Access structured learning levels, download field guide resources, and check live regional market commodity prices.
            </p>
          </div>
        </section>

        {/* Tab Controls */}
        <section className="border-b border-gray-200 bg-white sticky top-16 z-30 shadow-sm">
          <div className="container-px mx-auto max-w-7xl">
            <div className="flex gap-6 py-4 text-xs font-semibold uppercase tracking-wider">
              <button
                onClick={() => setActiveView("academy")}
                className={`pb-1 border-b-2 transition-all cursor-pointer ${
                  activeView === "academy" ? "border-[#2D6A4F] text-[#2D6A4F] font-extrabold" : "border-transparent text-gray-500 hover:text-[#1A1A1A]"
                }`}
              >
                Learning Academy
              </button>
              <button
                onClick={() => setActiveView("market")}
                className={`pb-1 border-b-2 transition-all cursor-pointer ${
                  activeView === "market" ? "border-[#2D6A4F] text-[#2D6A4F] font-extrabold" : "border-transparent text-gray-500 hover:text-[#1A1A1A]"
                }`}
              >
                Market Intelligence & Guides
              </button>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12">
          <div className="container-px mx-auto max-w-7xl text-left">
            
            {/* VIEW A: Learning Academy */}
            {activeView === "academy" && (
              <div className="grid gap-8 lg:grid-cols-[2.5fr_1.2fr]">
                
                {/* Main Academy Dashboard */}
                <div className="space-y-8">
                  {/* Dashboard Metrics */}
                  <div className="grid gap-4 grid-cols-3 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div>
                      <div className="text-xl font-black text-[#2D6A4F]">3</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Active Courses</div>
                    </div>
                    <div>
                      <div className="text-xl font-black text-[#2D6A4F]">12.5 hrs</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Time Studied</div>
                    </div>
                    <div>
                      <div className="text-xl font-black text-[#2D6A4F]">1</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Certificates</div>
                    </div>
                  </div>

                  {/* Course Filters */}
                  <div className="flex flex-wrap gap-4 items-center justify-between border-b border-gray-200 pb-4">
                    <div className="flex flex-wrap gap-3 items-center">
                      <select
                        value={selectedLevel}
                        onChange={(e) => setSelectedLevel(e.target.value)}
                        className="rounded-xl border border-gray-200 bg-white text-xs px-3 py-1.5 outline-none"
                      >
                        <option value="All">All Learning Levels</option>
                        <option value="Farm Gateway">Farm Gateway (Beginner)</option>
                        <option value="Takeoff">Takeoff (Intermediate)</option>
                        <option value="Freeway">Freeway (Commercial)</option>
                      </select>

                      <select
                        value={selectedField}
                        onChange={(e) => setSelectedField(e.target.value)}
                        className="rounded-xl border border-gray-200 bg-white text-xs px-3 py-1.5 outline-none"
                      >
                        <option value="All">All Learning Fields</option>
                        <option value="Horticulture">Horticulture</option>
                        <option value="Animal Husbandry">Animal Husbandry</option>
                        <option value="Farm Business">Farm Business</option>
                      </select>
                    </div>
                    <div className="text-[10px] text-gray-400 font-semibold uppercase">{filteredCourses.length} courses loaded</div>
                  </div>

                  {/* Course Grid */}
                  <div className="grid gap-6 sm:grid-cols-2">
                    {filteredCourses.map((c) => (
                      <div
                        key={c.id}
                        className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider">
                            <span className="rounded bg-emerald-50 px-2 py-0.5 text-emerald-800">{c.level}</span>
                            <span className="text-gray-400">{c.duration}</span>
                          </div>
                          <h3 className="mt-3 text-base font-extrabold text-[#1A3D2F]">{c.title}</h3>
                          <p className="text-[11px] text-gray-500 mt-1 leading-relaxed line-clamp-2">{c.desc}</p>
                          
                          {/* Progress meter */}
                          {c.progress > 0 ? (
                            <div className="mt-4">
                              <div className="flex justify-between text-[10px] font-bold mb-1">
                                <span className="text-gray-400">Course Progress</span>
                                <span className="text-[#2D6A4F]">{c.progress}%</span>
                              </div>
                              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-[#2D6A4F] h-full" style={{ width: `${c.progress}%` }} />
                              </div>
                            </div>
                          ) : (
                            <div className="text-[10px] text-gray-400 font-semibold mt-4">Not yet started · {c.lessons} lessons</div>
                          )}
                        </div>

                        <button
                          onClick={() => setSelectedCourseId(c.id)}
                          className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gray-800 py-2.5 text-xs font-bold text-white hover:bg-black transition cursor-pointer"
                        >
                          <span>{c.progress > 0 ? "Resume Course" : "Enroll & Start"}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Course Details Modal Simulation */}
                  {selectedCourse && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/20 p-6 relative">
                      <button
                        onClick={() => setSelectedCourseId(null)}
                        className="absolute right-4 top-4 text-xs font-bold text-gray-400 hover:text-gray-600"
                      >
                        Close
                      </button>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded uppercase tracking-wider">{selectedCourse.level}</span>
                      <h3 className="text-lg font-extrabold text-[#1A3D2F] mt-2">{selectedCourse.title}</h3>
                      <p className="text-xs text-gray-600 mt-2 leading-relaxed">{selectedCourse.desc}</p>
                      
                      <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <div className="font-bold text-gray-400">Instructor:</div>
                          <div className="font-semibold text-gray-700">{selectedCourse.instructor}</div>
                        </div>
                        <div>
                          <div className="font-bold text-gray-400">Lessons count:</div>
                          <div className="font-semibold text-gray-700">{selectedCourse.lessons} modules</div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleResumeCourse(selectedCourse.title)}
                        className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-[#2D6A4F] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#1A5438]"
                      >
                        Confirm Enrollment <CheckCircle className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                </div>

                {/* Right Sidebar Resources */}
                <aside className="space-y-6">
                  {/* Download Resources */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#1A3D2F] border-b border-gray-100 pb-2 mb-4 flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-[#2D6A4F]" /> Learning Resources
                    </h3>
                    <div className="space-y-3">
                      {downloadableResources.map((res) => (
                        <div key={res.title} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-150 text-xs">
                          <div>
                            <div className="font-bold text-gray-800">{res.title}</div>
                            <div className="text-[9px] text-gray-400 font-semibold">{res.type} · {res.size}</div>
                          </div>
                          <button
                            onClick={() => handleDownload(res.title)}
                            className="grid h-8 w-8 place-items-center rounded-full bg-white hover:bg-gray-100 border border-gray-200 text-[#2D6A4F] transition cursor-pointer"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Certification promo */}
                  <div className="rounded-2xl bg-gradient-to-br from-[#1A3D2F] to-[#2D6A4F] p-5 text-white shadow-sm flex flex-col justify-between">
                    <div>
                      <Award className="h-8 w-8 text-gold mb-3" />
                      <h4 className="text-xs font-extrabold uppercase tracking-wider">Earn Certificates</h4>
                      <p className="text-[11px] text-white/80 mt-1.5 leading-relaxed">
                        Complete lessons and upload spraying logs/yield logs to get certified by the county cooperative.
                      </p>
                    </div>
                  </div>
                </aside>
              </div>
            )}

            {/* VIEW B: Field Guides & Market Intel */}
            {activeView === "market" && (
              <div>
                {/* Category Pills */}
                <div className="mb-6 flex flex-wrap gap-2">
                  {articles.map((c) => c.category).filter((val, idx, self) => self.indexOf(val) === idx).concat("All").map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedCategory(c)}
                      className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition cursor-pointer ${
                        c === selectedCategory
                          ? "border-[#2D6A4F] bg-[#2D6A4F] text-white shadow-sm"
                          : "border-gray-200 bg-white text-gray-600 hover:border-[#2D6A4F]/40 hover:bg-[#2D6A4F]/5"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                <div className="grid gap-8 lg:grid-cols-[2fr_1.2fr]">
                  {/* Left Articles */}
                  <div className="grid gap-6 sm:grid-cols-2">
                    {filteredArticles.map((a) => (
                      <article
                        key={a.id}
                        className="group overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                      >
                        <div className="h-44 overflow-hidden">
                          <img
                            src={a.image}
                            alt={a.title}
                            loading="lazy"
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        </div>
                        <div className="p-5">
                          <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider">
                            <span className="rounded bg-[#2D6A4F]/10 px-2 py-0.5 text-[#2D6A4F]">
                              {a.category}
                            </span>
                            <span className="text-gray-400">{a.readTime} read</span>
                          </div>
                          <h3 className="mt-2 text-base font-extrabold text-[#1A3D2F] group-hover:text-[#2D6A4F] transition">
                            {a.title}
                          </h3>
                          <p className="mt-1 line-clamp-2 text-xs text-gray-500 leading-relaxed">{a.excerpt}</p>
                        </div>
                      </article>
                    ))}
                  </div>

                  {/* Right Sidebar Prices & Videos */}
                  <aside className="space-y-6">
                    {/* Live Market Prices */}
                    <div className="rounded-3xl bg-[#1A3D2F] p-6 text-white shadow-md">
                      <h3 className="text-sm font-extrabold">Live Market Prices</h3>
                      <ul className="mt-4 divide-y divide-white/10">
                        {marketPrices.map((p) => (
                          <li key={p.item} className="flex items-center justify-between py-3 text-xs">
                            <div>
                              <div className="font-semibold">{p.item}</div>
                              <div className="text-[9px] text-white/50">{p.market}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-extrabold text-[#F5A623] font-mono">
                                KES {p.price.toLocaleString()}
                              </div>
                              <div
                                className={`flex items-center justify-end gap-1 text-[9px] ${p.change >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                              >
                                {p.change >= 0 ? (
                                  <TrendingUp className="h-3 w-3" />
                                ) : (
                                  <TrendingDown className="h-3 w-3" />
                                )}
                                {Math.abs(p.change)}%
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Watch & Learn */}
                    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                      <h3 className="text-sm font-extrabold text-[#1A3D2F]">Watch & Learn</h3>
                      <div className="mt-4 space-y-3">
                        {videos.map((v) => (
                          <div
                            key={v.title}
                            className="group flex cursor-pointer items-center gap-3 rounded-xl bg-gray-50 p-3 transition hover:bg-gray-100"
                          >
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#2D6A4F] text-white">
                              <Play className="h-3.5 w-3.5 fill-current" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-xs font-bold text-gray-800">{v.title}</div>
                              <div className="text-[10px] text-gray-400">
                                {v.channel} · {v.duration}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </aside>
                </div>
              </div>
            )}

          </div>
        </section>
      </div>
    </AppLayout>
  );
}
