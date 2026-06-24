import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { AcademyHero } from "@/components/academy/AcademyHero";
import { AcademyPhotoStrip } from "@/components/academy/AcademyPhotoStrip";
import { AcademyFeatured } from "@/components/academy/AcademyFeatured";
import { AcademyCategories } from "@/components/academy/AcademyCategories";
import { AcademyCourseGrid, initialCourses } from "@/components/academy/AcademyCourseGrid";
import { AcademyVideoPreview } from "@/components/academy/AcademyVideoPreview";
import { AcademyPhotoImmersion } from "@/components/academy/AcademyPhotoImmersion";
import { AcademyLearningPath } from "@/components/academy/AcademyLearningPath";
import { AcademyTestimonials } from "@/components/academy/AcademyTestimonials";
import { AcademyInstructors } from "@/components/academy/AcademyInstructors";
import { AcademyCTABanner } from "@/components/academy/AcademyCTABanner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Phone, CheckCircle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/academy")({
  head: () => ({
    meta: [
      { title: "Academy · Mqulima" },
      {
        name: "description",
        content: "Explore structured learning pathways, access guides, track course progress, and view live market prices.",
      },
    ],
  }),
  component: AcademyPage,
});

function AcademyPage() {
  const [activeCategoryFilter, setActiveCategoryFilter] = useState("All");
  
  // Checkout/M-Pesa Modal state
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<{ id: string; title: string; price: number } | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [checkoutState, setCheckoutState] = useState<"idle" | "sending" | "pin_entry" | "success">("idle");
  const [mpesaReceipt, setMpesaReceipt] = useState("");

  const handleEnrollInit = (courseId: string, price: number) => {
    const courseObj = initialCourses.find(c => c.id === courseId);
    setSelectedCourse({
      id: courseId,
      title: courseObj ? courseObj.title : "Modern Soil Health for Kenyan Smallholders",
      price: price
    });
    setPhoneNumber("");
    setCheckoutState("idle");
    setCheckoutModalOpen(true);
  };

  const handleMpesaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) {
      toast.error("Please enter a valid M-Pesa phone number");
      return;
    }

    setCheckoutState("sending");
    
    // Simulate STK Push prompt after 1.5s
    setTimeout(() => {
      setCheckoutState("pin_entry");
      
      // Simulate Pin entry & response verification after 3s
      setTimeout(() => {
        const randomReceipt = "NL" + Math.floor(Math.random() * 100000000);
        setMpesaReceipt(randomReceipt);
        setCheckoutState("success");
        toast.success("Payment Received! Course enrolled successfully.");
      }, 3000);
    }, 1500);
  };

  const handleBrowseScroll = () => {
    const element = document.getElementById("courses-grid-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handlePathsScroll = () => {
    const element = document.getElementById("learning-paths-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <AppLayout>
      <div className="bg-[#FAF9F6] text-[#1A1A1A] min-h-screen font-sans">
        
        {/* SECTION 1 — HERO */}
        <AcademyHero
          onBrowseClick={handleBrowseScroll}
          onPathsClick={handlePathsScroll}
        />

        {/* SECTION 2 — PHOTO STRIP */}
        <AcademyPhotoStrip />

        {/* SECTION 3 — FEATURED COURSE */}
        <AcademyFeatured
          onEnrollClick={() => handleEnrollInit("featured-soil", 1200)}
        />

        {/* SECTION 4 — CATEGORIES */}
        <AcademyCategories
          activeCategory={activeCategoryFilter}
          onCategorySelect={(slug) => {
            setActiveCategoryFilter(slug);
            handleBrowseScroll();
          }}
        />

        {/* SECTION 5 — COURSE GRID */}
        <div id="courses-grid-section">
          <AcademyCourseGrid
            activeFilter={activeCategoryFilter}
            onFilterChange={setActiveCategoryFilter}
            onEnrollClick={(id, price) => handleEnrollInit(id, price)}
          />
        </div>

        {/* SECTION 6 — VIDEO PREVIEW */}
        <AcademyVideoPreview />

        {/* SECTION 7 — REAL PHOTO IMMERSION */}
        <AcademyPhotoImmersion />

        {/* SECTION 8 — LEARNING PATH */}
        <div id="learning-paths-section">
          <AcademyLearningPath />
        </div>

        {/* SECTION 9 — TESTIMONIALS */}
        <AcademyTestimonials />

        {/* SECTION 10 — INSTRUCTORS */}
        <AcademyInstructors />

        {/* SECTION 11 — CTA BANNER */}
        <AcademyCTABanner
          onStartClick={handleBrowseScroll}
        />

        {/* M-PESA CHECKOUT WIZARD MODAL */}
        <Dialog open={checkoutModalOpen} onOpenChange={setCheckoutModalOpen}>
          <DialogContent className="sm:max-w-[420px] bg-white border border-gray-100 rounded-3xl p-6 shadow-2xl text-left">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-[#0c2e17]">
                M-Pesa Safe Checkout
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-1">
                You are purchasing access to: <strong className="text-gray-700">{selectedCourse?.title}</strong>
              </DialogDescription>
            </DialogHeader>

            {checkoutState === "idle" && (
              <form onSubmit={handleMpesaSubmit} className="mt-4 space-y-4">
                <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100">
                  <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase">
                    <span>Course Amount</span>
                    <span className="text-sm font-extrabold text-[#1a5c2f]">
                      KSh {selectedCourse?.price}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                    M-Pesa Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. 0712345678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1a5c2f] transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#1a5c2f] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#0c2e17] transition duration-200 cursor-pointer text-center"
                >
                  Pay KSh {selectedCourse?.price} via M-Pesa
                </button>
              </form>
            )}

            {checkoutState === "sending" && (
              <div className="mt-6 py-8 flex flex-col items-center justify-center text-center">
                <Loader2 className="h-10 w-10 text-[#1a5c2f] animate-spin" />
                <h4 className="mt-4 text-sm font-bold text-[#0c2e17]">Initiating Payment Push...</h4>
                <p className="text-[11px] text-gray-500 mt-1 max-w-[280px] leading-relaxed">
                  We are sending an M-Pesa STK push request to your phone <strong className="text-gray-700">{phoneNumber}</strong>.
                </p>
              </div>
            )}

            {checkoutState === "pin_entry" && (
              <div className="mt-6 py-8 flex flex-col items-center justify-center text-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full border-4 border-[#7ed321] animate-ping opacity-75"></div>
                  <Loader2 className="h-10 w-10 text-[#1a5c2f] animate-spin relative" />
                </div>
                <h4 className="mt-4 text-sm font-bold text-[#0c2e17]">Enter M-Pesa PIN</h4>
                <p className="text-[11px] text-gray-500 mt-1 max-w-[280px] leading-relaxed">
                  Please enter your M-Pesa PIN on the prompt displayed on your handset screen to authorize payment.
                </p>
              </div>
            )}

            {checkoutState === "success" && (
              <div className="mt-6 py-6 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-emerald-800">Enrollment Successful!</h4>
                <p className="text-[11px] text-gray-500 mt-1 max-w-[280px] leading-relaxed">
                  Your payment receipt reference is <strong className="text-gray-700">{mpesaReceipt}</strong>.
                </p>

                <div className="mt-6 w-full flex gap-3">
                  <button
                    onClick={() => setCheckoutModalOpen(false)}
                    className="flex-1 py-3 rounded-xl bg-[#0c2e17] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#1a5c2f] transition cursor-pointer text-center"
                  >
                    Go to Class
                  </button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </AppLayout>
  );
}
