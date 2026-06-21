import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, ArrowRight, Calendar, Phone, ShieldCheck, Clock, CheckCircle, Star, Search, MessageSquare, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { services as rawServices, counties } from "@/lib/mqulima-data";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "On-Farm Services · Mqulima" },
      {
        name: "description",
        content: "Book vets, soil testing, silage shredding, AI, machinery rental and advisory — verified experts at your farm gate.",
      },
    ],
  }),
  component: ServicesPage,
});

function generateReference() {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `MQ-${suffix}`;
}

// Mock service providers data
const serviceProviders: Record<string, { name: string; role: string; avatar: string; county: string; rating: number; experience: string; license: string }[]> = {
  vet: [
    { name: "Dr. Faith Achieng", role: "Veterinarian (DVM)", avatar: "👩🏽‍⚕️", county: "Uasin Gishu", rating: 4.9, experience: "8 years", license: "KVB-2018-092" },
    { name: "Dr. Dennis Kiprop", role: "Livestock Practitioner", avatar: "👨🏾‍⚕️", county: "Trans Nzoia", rating: 4.8, experience: "6 years", license: "KVB-2020-412" }
  ],
  soil: [
    { name: "Dr. Samuel Mwangi", role: "Chief Soil Chemist", avatar: "👨🏼‍🌾", county: "Nakuru", rating: 5.0, experience: "12 years", license: "AGRO-2014-082" },
    { name: "Grace Mutiso", role: "Agronomic Field Officer", avatar: "👩🏾‍🌾", county: "Machakos", rating: 4.7, experience: "4 years", license: "AGRO-2022-115" }
  ],
  silage: [
    { name: "Daniel Kiprop", role: "Machinery Operator", avatar: "👨🏾‍🌾", county: "Uasin Gishu", rating: 4.9, experience: "7 years", license: "MECH-2019-311" }
  ],
  ai: [
    { name: "John Kamau", role: "Certified AI Technician", avatar: "👨🏻‍⚕️", county: "Kiambu", rating: 4.8, experience: "5 years", license: "AI-2021-004" }
  ],
  machinery: [
    { name: "Daniel Kiprop", role: "Heavy Machinery Operator", avatar: "👨🏾‍🌾", county: "Uasin Gishu", rating: 4.9, experience: "7 years", license: "MECH-2019-311" }
  ],
  advisory: [
    { name: "Dr. Samuel Mwangi", role: "Farm Advisory Specialist", avatar: "👨🏼‍🌾", county: "Nakuru", rating: 5.0, experience: "12 years", license: "AGRO-2014-082" }
  ]
};

// Mock service feedback/reviews
const serviceReviews: Record<string, { reviewer: string; rating: number; date: string; comment: string }[]> = {
  vet: [
    { reviewer: "Mary Wanjiku", rating: 5, date: "June 18, 2026", comment: "The vet arrived on Sunday morning within 2 hours of my booking. My cow recovered fully from milk fever." },
    { reviewer: "David Langat", rating: 4, date: "June 10, 2026", comment: "Very professional vet. Detailed report shared afterwards." }
  ],
  soil: [
    { reviewer: "Peter Ndwiga", rating: 5, date: "June 14, 2026", comment: "The soil test report was very clear. Sourced the exact fertilizers suggested and my tomato yield is up." }
  ]
};

function ServicesPage() {
  const [activeView, setActiveView] = useState<"explore" | "tracker">("explore");
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  // Active selected service inside detail view
  const [selectedServiceId, setSelectedServiceId] = useState(rawServices[0].id);
  const [showBookingWizard, setShowBookingWizard] = useState(false);
  
  // Booking Wizard states
  const [step, setStep] = useState(1);
  const [doneRef, setDoneRef] = useState<string | null>(null);
  const [farmDetails, setFarmDetails] = useState<Record<string, string>>({});
  const [selectedCounty, setSelectedCounty] = useState("Uasin Gishu");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [urgency, setUrgency] = useState("Normal");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [simStep, setSimStep] = useState<"idle" | "pin" | "loading" | "success">("idle");
  const [pinCode, setPinCode] = useState("");

  // Review Feedback states
  const [reviews, setReviews] = useState<Record<string, { reviewer: string; rating: number; date: string; comment: string }[]>>(serviceReviews);
  const [newReviewName, setNewReviewName] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState("");

  // Tracker states
  const [trackerCode, setTrackerCode] = useState("");
  const [trackedJob, setTrackedJob] = useState<{ id: string; serviceName: string; county: string; date: string; time: string; status: "pending" | "assigned" | "dispatched" | "completed" } | null>(null);

  const activeService = useMemo(() => {
    return rawServices.find((s) => s.id === selectedServiceId) ?? rawServices[0];
  }, [selectedServiceId]);

  const categories = ["All", "Veterinary", "Soil & Agronomy", "Machinery & Forage"];

  // Filter services into categories
  const filteredServices = useMemo(() => {
    return rawServices.filter((s) => {
      if (selectedCategory === "All") return true;
      if (selectedCategory === "Veterinary") return s.id === "vet" || s.id === "ai";
      if (selectedCategory === "Soil & Agronomy") return s.id === "soil" || s.id === "advisory";
      if (selectedCategory === "Machinery & Forage") return s.id === "silage" || s.id === "machinery";
      return true;
    });
  }, [selectedCategory]);

  const changeService = (id: string) => {
    setSelectedServiceId(id);
    setShowBookingWizard(false);
    resetBooking();
  };

  const resetBooking = () => {
    setDoneRef(null);
    setStep(1);
    setFarmDetails({});
    setSelectedCounty("Uasin Gishu");
    setBookingDate("");
    setBookingTime("");
    setUrgency("Normal");
    setMpesaPhone("");
    setSimStep("idle");
    setPinCode("");
  };

  const filteredFields = useMemo(() => {
    return activeService.fields.filter(
      (f) =>
        !f.toLowerCase().includes("date") &&
        !f.toLowerCase().includes("time") &&
        !f.toLowerCase().includes("location") &&
        !f.toLowerCase().includes("county") &&
        !f.toLowerCase().includes("gps")
    );
  }, [activeService]);

  const canProceed = () => {
    if (step === 1) {
      const allFieldsFilled = filteredFields.every((f) => farmDetails[f]?.trim());
      return allFieldsFilled && selectedCounty;
    }
    if (step === 2) {
      return bookingDate && bookingTime && urgency;
    }
    return true;
  };

  const handleKeyPress = (num: string) => {
    if (pinCode.length < 4) {
      setPinCode((prev) => prev + num);
    }
  };

  const handlePinBackspace = () => {
    setPinCode((prev) => prev.slice(0, -1));
  };

  const handleMpesaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^(07|01|254)\d{8}$/.test(mpesaPhone.trim())) {
      toast.error("Please enter a valid Kenyan phone number (e.g. 0712345678)");
      return;
    }
    setPinCode("");
    setSimStep("pin");
  };

  const handleConfirmPin = () => {
    if (pinCode.length < 4) {
      toast.error("Please enter your 4-digit M-Pesa PIN");
      return;
    }
    setSimStep("loading");
    
    setTimeout(() => {
      setSimStep("success");
      const ref = generateReference();
      setDoneRef(ref);

      // Create tracked job mock
      setTrackedJob({
        id: ref,
        serviceName: activeService.name,
        county: selectedCounty,
        date: bookingDate,
        time: bookingTime,
        status: "pending"
      });

      setTimeout(() => {
        toast.success("SMS Confirmation Sent", {
          description: `Message: Ref ${ref} booked for ${activeService.name} on ${bookingDate} at ${bookingTime} is confirmed. Pay KSh ${activeService.price.replace(/\D/g, "") || "1,500"} after service.`,
          duration: 8000,
        });
      }, 500);
    }, 2500);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewName.trim() || !newReviewComment.trim()) {
      toast.error("Please fill in your name and comment.");
      return;
    }
    const list = reviews[selectedServiceId] || [];
    const updated = [
      {
        reviewer: newReviewName,
        rating: newReviewRating,
        date: "Today",
        comment: newReviewComment
      },
      ...list
    ];
    setReviews({ ...reviews, [selectedServiceId]: updated });
    toast.success("Thank you for your feedback!");
    setNewReviewName("");
    setNewReviewComment("");
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackerCode.trim()) {
      toast.error("Please enter a reference code.");
      return;
    }
    const code = trackerCode.trim().toUpperCase();
    if (code === "MQ-DEMO55") {
      setTrackedJob({
        id: "MQ-DEMO55",
        serviceName: "Soil Testing Service",
        county: "Trans Nzoia",
        date: "2026-06-25",
        time: "10:00",
        status: "dispatched"
      });
      toast.success("Active booking located!");
    } else if (trackedJob && code === trackedJob.id) {
      toast.success("Active booking located!");
    } else {
      toast.error("No active booking found with that reference. Try 'MQ-DEMO55' for simulation.");
      setTrackedJob(null);
    }
  };

  const providers = serviceProviders[selectedServiceId] || [];
  const activeReviews = reviews[selectedServiceId] || [];

  return (
    <AppLayout>
      <div className="bg-[#FAF9F6] text-[#1A1A1A] min-h-screen font-sans">
        {/* Banner Section */}
        <section className="bg-gradient-to-br from-[#1A3D2F] to-[#2D6A4F] py-16 text-white text-left">
          <div className="container-px mx-auto max-w-7xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#F5A623]">
              🩺 Professional On-Farm Services
            </span>
            <h1 className="mt-3 text-4xl font-extrabold md:text-5xl">Experts at your farm gate.</h1>
            <p className="mt-2 max-w-xl text-white/80 text-sm leading-relaxed">
              Book vetted livestock doctors, agricultural scientists, mechanization operations, and track service dispatch live.
            </p>
          </div>
        </section>

        {/* Tab Controls */}
        <section className="border-b border-gray-200 bg-white sticky top-16 z-30 shadow-sm">
          <div className="container-px mx-auto max-w-7xl">
            <div className="flex gap-6 py-4 text-xs font-semibold uppercase tracking-wider">
              <button
                onClick={() => setActiveView("explore")}
                className={`pb-1 border-b-2 transition-all cursor-pointer ${
                  activeView === "explore" ? "border-[#2D6A4F] text-[#2D6A4F] font-extrabold" : "border-transparent text-gray-500 hover:text-[#1A1A1A]"
                }`}
              >
                Explore Services
              </button>
              <button
                onClick={() => setActiveView("tracker")}
                className={`pb-1 border-b-2 transition-all cursor-pointer ${
                  activeView === "tracker" ? "border-[#2D6A4F] text-[#2D6A4F] font-extrabold" : "border-transparent text-gray-500 hover:text-[#1A1A1A]"
                }`}
              >
                Service Request Tracker
              </button>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12">
          <div className="container-px mx-auto max-w-7xl text-left">
            
            {/* VIEW A: Explore Services */}
            {activeView === "explore" && (
              <div className="grid gap-8 lg:grid-cols-[1.2fr_2.5fr]">
                
                {/* Left Sidebar Category & Listings */}
                <aside className="space-y-6">
                  {/* Category Filter */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">Service Category</div>
                    <div className="flex flex-col gap-1.5">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`w-full text-left rounded-lg px-3 py-2 text-xs font-semibold transition ${
                            selectedCategory === cat
                              ? "bg-[#2D6A4F] text-white"
                              : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Listings */}
                  <div className="space-y-2">
                    {filteredServices.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => changeService(s.id)}
                        className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition duration-300 ${
                          selectedServiceId === s.id
                            ? "border-[#2D6A4F] bg-[#2D6A4F]/5 shadow-sm"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className="grid h-10 w-10 place-items-center rounded-lg bg-gray-50 text-xl shrink-0">
                          {s.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-[#1A1A1A] truncate">{s.name}</div>
                          <div className="text-[10px] text-[#2D6A4F] font-semibold">{s.price}</div>
                        </div>
                        {selectedServiceId === s.id && <Check className="h-4 w-4 text-[#2D6A4F] shrink-0" />}
                      </button>
                    ))}
                  </div>
                </aside>

                {/* Right Service Detail Panel OR Booking Wizard */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md md:p-8">
                  {showBookingWizard ? (
                    // WIZARD LAYOUT
                    <div>
                      {doneRef ? (
                        <div className="grid place-items-center py-10 text-center">
                          <div className="grid h-16 w-16 place-items-center rounded-full bg-[#E8F5E9] text-[#2D6A4F] text-3xl animate-bounce">
                            ✅
                          </div>
                          <h2 className="mt-6 text-2xl font-extrabold text-[#1A1A1A]">
                            Booking Confirmed!
                          </h2>
                          <p className="mt-2 text-sm text-[#6B7280]">
                            Reference code: <span className="font-mono font-bold text-[#2D6A4F]">{doneRef}</span>
                          </p>
                          <p className="max-w-xs text-xs text-[#6B7280] mt-3 leading-relaxed">
                            Thank you for booking with Mqulima. An SMS confirmation was sent to {mpesaPhone}. Our agro-technician will contact you shortly.
                          </p>
                          
                          <div className="flex gap-4 mt-8">
                            <button
                              onClick={resetBooking}
                              className="rounded-xl bg-[#2D6A4F] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#1A5438] transition"
                            >
                              Book Another Service
                            </button>
                            <button
                              onClick={() => {
                                setTrackerCode(doneRef);
                                setActiveView("tracker");
                                setShowBookingWizard(false);
                              }}
                              className="rounded-xl border border-gray-300 px-6 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                            >
                              Track Status
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                            <div>
                              <h2 className="text-xl font-extrabold text-[#1A3D2F]">{activeService.name} Booking</h2>
                              <p className="text-[10px] text-gray-500">Provide schedule and location details.</p>
                            </div>
                            <button 
                              onClick={() => setShowBookingWizard(false)}
                              className="text-xs font-bold text-gray-400 hover:text-gray-600"
                            >
                              Cancel
                            </button>
                          </div>

                          {/* Steps stepper */}
                          <div className="relative flex items-center justify-between w-full max-w-xs mx-auto mb-8">
                            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-100 -translate-y-1/2 z-0" />
                            <div
                              className="absolute left-0 top-1/2 h-0.5 bg-[#2D6A4F] -translate-y-1/2 transition-all duration-300 z-0"
                              style={{ width: `${((step - 1) / 2) * 100}%` }}
                            />
                            {[1, 2, 3].map((s) => (
                              <div key={s} className="relative z-10 flex flex-col items-center">
                                <div
                                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] border-2 transition-all duration-300 ${
                                    step > s
                                      ? "bg-[#2D6A4F] border-[#2D6A4F] text-white"
                                      : step === s
                                        ? "bg-white border-[#2D6A4F] text-[#2D6A4F]"
                                        : "bg-white border-gray-100 text-gray-400"
                                  }`}
                                >
                                  {step > s ? <Check className="w-3 h-3" /> : s}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Step forms */}
                          {step === 1 && (
                            <div className="space-y-4">
                              {filteredFields.map((f) => (
                                <div key={f} className="block">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{f}</span>
                                  {f.toLowerCase().includes("description") || f.toLowerCase().includes("issue") ? (
                                    <textarea
                                      rows={3}
                                      value={farmDetails[f] ?? ""}
                                      onChange={(e) => setFarmDetails({ ...farmDetails, [f]: e.target.value })}
                                      placeholder={`Describe details about the ${f.toLowerCase()}...`}
                                      className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs text-[#1A1A1A] outline-none focus:border-[#2D6A4F]"
                                    />
                                  ) : (
                                    <input
                                      type="text"
                                      value={farmDetails[f] ?? ""}
                                      onChange={(e) => setFarmDetails({ ...farmDetails, [f]: e.target.value })}
                                      placeholder={`Enter ${f.toLowerCase()}`}
                                      className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs text-[#1A1A1A] outline-none focus:border-[#2D6A4F]"
                                    />
                                  )}
                                </div>
                              ))}

                              <div className="block">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Operating County</span>
                                <select
                                  value={selectedCounty}
                                  onChange={(e) => setSelectedCounty(e.target.value)}
                                  className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs text-[#1A1A1A] outline-none focus:border-[#2D6A4F]"
                                >
                                  {counties.map((c) => (
                                    <option key={c} value={c}>{c} County</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}

                          {step === 2 && (
                            <div className="space-y-4">
                              <div className="grid gap-4 sm:grid-cols-2">
                                <label className="block">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Appointment Date</span>
                                  <input
                                    type="date"
                                    required
                                    value={bookingDate}
                                    onChange={(e) => setBookingDate(e.target.value)}
                                    className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs text-[#1A1A1A] outline-none focus:border-[#2D6A4F]"
                                  />
                                </label>

                                <label className="block">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Preferred Time</span>
                                  <input
                                    type="time"
                                    required
                                    value={bookingTime}
                                    onChange={(e) => setBookingTime(e.target.value)}
                                    className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs text-[#1A1A1A] outline-none focus:border-[#2D6A4F]"
                                  />
                                </label>
                              </div>

                              <label className="block">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Urgency Level</span>
                                <select
                                  value={urgency}
                                  onChange={(e) => setUrgency(e.target.value)}
                                  className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs text-[#1A1A1A] outline-none focus:border-[#2D6A4F]"
                                >
                                  <option value="Normal">Normal (Routine schedule booking)</option>
                                  <option value="Medium">Medium (Needed in 2-3 days)</option>
                                  <option value="Urgent">Urgent (Technician needed within 24 hours)</option>
                                </select>
                              </label>
                            </div>
                          )}

                          {step === 3 && (
                            <div className="space-y-4">
                              <div className="rounded-xl bg-gray-50 p-4 border border-gray-200">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Booking Summary</div>
                                <div className="grid gap-1.5 text-xs">
                                  <div className="flex justify-between">
                                    <span>Service:</span>
                                    <span className="font-semibold">{activeService.name}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>County:</span>
                                    <span className="font-semibold">{selectedCounty} County</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Schedule:</span>
                                    <span className="font-semibold">{bookingDate} at {bookingTime}</span>
                                  </div>
                                  <div className="h-px bg-gray-200 my-1" />
                                  <div className="flex justify-between font-bold text-sm">
                                    <span>Service Cost:</span>
                                    <span className="text-[#2D6A4F]">{activeService.price}</span>
                                  </div>
                                </div>
                              </div>

                              {simStep === "idle" && (
                                <form onSubmit={handleMpesaSubmit} className="space-y-3">
                                  <label className="block">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">M-Pesa Number</span>
                                    <input
                                      type="tel"
                                      required
                                      value={mpesaPhone}
                                      onChange={(e) => setMpesaPhone(e.target.value)}
                                      placeholder="e.g. 0712345678"
                                      className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs text-[#1A1A1A] outline-none focus:border-[#2D6A4F]"
                                    />
                                  </label>
                                  <button
                                    type="submit"
                                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#2D6A4F] py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#1A5438] transition cursor-pointer"
                                  >
                                    <span>Proceed to Payment</span>
                                    <ArrowRight className="w-4 h-4" />
                                  </button>
                                </form>
                              )}

                              {simStep === "pin" && (
                                <div className="mx-auto max-w-xs border border-gray-800 rounded-2xl bg-[#1A1A1A] p-4 shadow-xl text-white">
                                  <div className="text-center text-[9px] font-semibold text-gray-400 mb-2">M-PESA SIMULATOR</div>
                                  <div className="rounded-xl bg-white p-3 text-center text-[#1A1A1A]">
                                    <div className="text-[9px] font-bold text-gray-400">PAY MQULIMA</div>
                                    <div className="text-sm font-black text-[#2D6A4F] mt-0.5">{activeService.price}</div>
                                    
                                    <div className="mt-3">
                                      <div className="text-[9px] text-gray-400 font-bold mb-1">ENTER PIN:</div>
                                      <div className="flex justify-center gap-1.5">
                                        {Array.from({ length: 4 }).map((_, idx) => (
                                          <div key={idx} className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-xs font-bold text-[#1A1A1A]">
                                            {pinCode[idx] ? "●" : ""}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="mt-3 grid grid-cols-3 gap-1.5">
                                    {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
                                      <button key={n} type="button" onClick={() => handleKeyPress(n)} className="h-8 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold">{n}</button>
                                    ))}
                                    <button type="button" onClick={handlePinBackspace} className="h-8 rounded-full bg-red-600/20 text-red-400 text-[9px] font-bold">Clear</button>
                                    <button type="button" onClick={() => handleKeyPress("0")} className="h-8 rounded-full bg-white/10 text-xs font-bold">0</button>
                                    <button type="button" onClick={handleConfirmPin} className="h-8 rounded-full bg-[#2D6A4F] text-white text-[9px] font-bold">OK</button>
                                  </div>
                                </div>
                              )}

                              {simStep === "loading" && (
                                <div className="text-center py-6">
                                  <div className="w-10 h-10 rounded-full border-4 border-[#2D6A4F]/20 border-t-[#2D6A4F] animate-spin mx-auto mb-3" />
                                  <h4 className="text-xs font-bold">Processing payment push...</h4>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Back/Continue Buttons */}
                          {simStep !== "pin" && simStep !== "loading" && (
                            <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                              <button
                                disabled={step === 1}
                                onClick={() => setStep(step - 1)}
                                className="text-xs font-bold text-gray-400 hover:text-[#1A1A1A] disabled:opacity-30"
                              >
                                ← Back
                              </button>
                              {step < 3 && (
                                <button
                                  disabled={!canProceed()}
                                  onClick={() => setStep(step + 1)}
                                  className="inline-flex items-center gap-1 bg-[#2D6A4F] px-5 py-2 text-xs font-bold text-white rounded-lg disabled:opacity-50 hover:bg-[#1A5438]"
                                >
                                  <span>Continue</span>
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    // DETAIL PAGE LAYOUT
                    <div>
                      {/* Title Header */}
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-3xl">{activeService.icon}</span>
                            <div>
                              <h2 className="text-2xl font-extrabold text-[#1A3D2F]">{activeService.name}</h2>
                              <div className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full inline-block mt-0.5">VERIFIED EXPERTS</div>
                            </div>
                          </div>
                        </div>
                        <div className="text-left md:text-right">
                          <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Estimated Cost</div>
                          <div className="text-xl font-extrabold text-[#2D6A4F]">{activeService.price}</div>
                        </div>
                      </div>

                      {/* Description & booking button */}
                      <div className="py-6">
                        <p className="text-xs text-gray-600 leading-relaxed">{activeService.description}</p>
                        <button
                          onClick={() => setShowBookingWizard(true)}
                          className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-[#2D6A4F] px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-[#1A5438] transition cursor-pointer"
                        >
                          <span>Book On-Farm Appointment</span>
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Verified Providers list */}
                      <div className="border-t border-gray-100 pt-6">
                        <h3 className="text-sm font-bold text-[#1A3D2F] flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-[#2D6A4F]" /> Assigned Service Providers ({providers.length})
                        </h3>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          {providers.map((p) => (
                            <div key={p.name} className="flex items-center gap-3 rounded-xl border border-gray-150 p-4 bg-gray-50/50">
                              <div className="grid h-10 w-10 place-items-center rounded-full bg-white text-2xl border border-gray-200">
                                {p.avatar}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1">
                                  {p.name}
                                </div>
                                <div className="text-[9px] text-gray-400 font-semibold">{p.role} · {p.experience}</div>
                                <div className="text-[8px] font-mono text-gray-400 mt-0.5">License: {p.license}</div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-0.5 text-xs font-bold text-amber-500">
                                  <Star className="h-3 w-3 fill-current" /> {p.rating}
                                </div>
                                <div className="text-[8px] text-gray-400 font-semibold uppercase">{p.county}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Customer Feedback System */}
                      <div className="border-t border-gray-100 mt-8 pt-6">
                        <h3 className="text-sm font-bold text-[#1A3D2F] flex items-center gap-2 mb-4">
                          <MessageSquare className="h-4 w-4 text-[#2D6A4F]" /> Farmer Reviews & Feedback
                        </h3>
                        
                        <div className="grid gap-6 md:grid-cols-[1.2fr_2fr]">
                          {/* Aggregate ratings & Review submit form */}
                          <div className="space-y-4">
                            <div className="rounded-xl bg-gray-50 p-4 text-center border border-gray-150">
                              <div className="text-3xl font-black text-[#2D6A4F]">4.9</div>
                              <div className="flex justify-center gap-0.5 my-1 text-amber-500">
                                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
                              </div>
                              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Based on verified visits</div>
                            </div>

                            {/* Submit Review */}
                            <form onSubmit={handleReviewSubmit} className="space-y-3">
                              <div className="text-xs font-bold text-[#1A3D2F]">Leave a Review</div>
                              <input
                                type="text"
                                required
                                value={newReviewName}
                                onChange={(e) => setNewReviewName(e.target.value)}
                                placeholder="Your Name"
                                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-[#2D6A4F]"
                              />
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-semibold text-gray-400">Rating:</span>
                                <select
                                  value={newReviewRating}
                                  onChange={(e) => setNewReviewRating(Number(e.target.value))}
                                  className="rounded border border-gray-200 text-xs px-1.5 py-0.5 outline-none"
                                >
                                  <option value={5}>5 Stars</option>
                                  <option value={4}>4 Stars</option>
                                  <option value={3}>3 Stars</option>
                                </select>
                              </div>
                              <textarea
                                required
                                rows={2}
                                value={newReviewComment}
                                onChange={(e) => setNewReviewComment(e.target.value)}
                                placeholder="Write your experience..."
                                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-[#2D6A4F]"
                              />
                              <button
                                type="submit"
                                className="w-full rounded-lg bg-gray-800 text-white font-bold py-1.5 text-xs hover:bg-[#1A1A1A] transition cursor-pointer"
                              >
                                Submit Review
                              </button>
                            </form>
                          </div>

                          {/* Reviews List */}
                          <div className="space-y-3">
                            {activeReviews.length > 0 ? (
                              activeReviews.map((r, i) => (
                                <div key={i} className="border-b border-gray-100 pb-3">
                                  <div className="flex items-center justify-between text-xs font-bold">
                                    <span className="text-[#1A1A1A]">{r.reviewer}</span>
                                    <span className="text-gray-400 font-mono text-[9px]">{r.date}</span>
                                  </div>
                                  <div className="flex gap-0.5 text-amber-500 my-0.5">
                                    {Array.from({ length: r.rating }).map((_, starIdx) => (
                                      <Star key={starIdx} className="h-2.5 w-2.5 fill-current" />
                                    ))}
                                  </div>
                                  <p className="text-[11px] text-gray-500 leading-relaxed mt-1">"{r.comment}"</p>
                                </div>
                              ))
                            ) : (
                              <div className="text-xs text-gray-400 font-medium py-8 text-center">
                                No reviews listed for this service yet. Be the first to add one!
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              </div>
            )}

            {/* VIEW B: Service Request Tracker */}
            {activeView === "tracker" && (
              <div className="max-w-2xl mx-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-md md:p-8">
                <h2 className="text-xl font-extrabold text-[#1A3D2F] mb-2">Track Service Request</h2>
                <p className="text-xs text-gray-500 mb-6">
                  Enter your appointment reference number (e.g. `MQ-XXXXXX`) to view dispatch status. You can use the mock code <span className="font-mono font-bold text-[#2D6A4F]">MQ-DEMO55</span> to test the tracker stages.
                </p>

                <form onSubmit={handleTrackSubmit} className="flex gap-3 mb-8">
                  <input
                    type="text"
                    required
                    placeholder="Enter Reference (e.g. MQ-DEMO55)"
                    value={trackerCode}
                    onChange={(e) => setTrackerCode(e.target.value)}
                    className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs outline-none focus:border-[#2D6A4F] uppercase"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-[#2D6A4F] text-white px-6 py-2 text-xs font-bold hover:bg-[#1A5438] transition cursor-pointer"
                  >
                    Locate Request
                  </button>
                </form>

                {trackedJob ? (
                  <div className="border-t border-gray-100 pt-6">
                    <div className="flex flex-wrap justify-between items-center bg-[#FAF9F6] p-4 rounded-xl mb-6 text-xs border border-gray-150">
                      <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase">Service Booked</div>
                        <div className="font-extrabold text-[#1A3D2F]">{trackedJob.serviceName}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase">Reference Code</div>
                        <div className="font-mono font-bold text-[#2D6A4F]">{trackedJob.id}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase">Target Schedule</div>
                        <div className="font-semibold text-gray-700">{trackedJob.date} at {trackedJob.time}</div>
                      </div>
                    </div>

                    {/* Timeline stepper */}
                    <div className="space-y-6 relative pl-8 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                      {[
                        { key: "pending", label: "Booking Request Received", desc: "Our coordination team has received your order and is vetting technicians in your county." },
                        { key: "assigned", label: "Professional Expert Assigned", desc: "A verified agronomist/vet has been allocated to your schedule. Details sent to your phone." },
                        { key: "dispatched", label: "Technician Dispatched", desc: "The expert is currently traveling to your GPS/farm location." },
                        { key: "completed", label: "Job Completed & Certified", desc: "Service delivery was completed successfully. Receipt and recommendations generated." },
                      ].map((step, idx) => {
                        const statusOrder = ["pending", "assigned", "dispatched", "completed"];
                        const currentIdx = statusOrder.indexOf(trackedJob.status);
                        const stepIdx = statusOrder.indexOf(step.key);
                        const isDone = stepIdx <= currentIdx;
                        const isActive = stepIdx === currentIdx;

                        return (
                          <div key={step.key} className="relative text-left">
                            <div className={`absolute -left-8 top-0.5 w-7.5 h-7.5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                              isDone ? "bg-[#2D6A4F] border-[#2D6A4F] text-white" : "bg-white border-gray-200 text-gray-300"
                            }`}>
                              {isDone ? <Check className="w-3.5 h-3.5" /> : (idx + 1)}
                            </div>
                            <div className="pl-2">
                              <h4 className={`text-xs font-extrabold ${isActive ? "text-[#2D6A4F]" : isDone ? "text-[#1A1A1A]" : "text-gray-400"}`}>
                                {step.label}
                              </h4>
                              <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">{step.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-xs font-semibold">Enter a reference code above to load booking status</p>
                  </div>
                )}
              </div>
            )}

          </div>
        </section>
      </div>
    </AppLayout>
  );
}
