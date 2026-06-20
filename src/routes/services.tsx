import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Check, ArrowRight, Calendar, Phone, ShieldCheck, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { services, counties } from "@/lib/mqulima-data";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "On-Farm Services · Mqulima" },
      {
        name: "description",
        content:
          "Book vets, soil testing, silage shredding, AI, machinery rental and advisory — verified experts at your farm gate.",
      },
    ],
  }),
  component: ServicesPage,
});

function generateReference() {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `MQ-${suffix}`;
}

function ServicesPage() {
  const [selected, setSelected] = useState(services[0].id);
  const [step, setStep] = useState(1);
  const [doneRef, setDoneRef] = useState<string | null>(null);
  
  // Form states
  const [farmDetails, setFarmDetails] = useState<Record<string, string>>({});
  const [selectedCounty, setSelectedCounty] = useState("Nairobi");
  
  // Schedule states
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [urgency, setUrgency] = useState("Normal");

  // M-Pesa Simulator states
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [simStep, setSimStep] = useState<"idle" | "pin" | "loading" | "success">("idle");
  const [pinCode, setPinCode] = useState("");

  const svc = useMemo(() => services.find((s) => s.id === selected) ?? services[0], [selected]);

  // Clean values when service changes
  const resetBooking = () => {
    setDoneRef(null);
    setStep(1);
    setFarmDetails({});
    setSelectedCounty("Nairobi");
    setBookingDate("");
    setBookingTime("");
    setUrgency("Normal");
    setMpesaPhone("");
    setSimStep("idle");
    setPinCode("");
  };

  const changeService = (id: string) => {
    setSelected(id);
    resetBooking();
  };

  // Filter service fields to get only custom descriptors
  const filteredFields = useMemo(() => {
    return svc.fields.filter(
      (f) =>
        !f.toLowerCase().includes("date") &&
        !f.toLowerCase().includes("time") &&
        !f.toLowerCase().includes("location") &&
        !f.toLowerCase().includes("county") &&
        !f.toLowerCase().includes("gps")
    );
  }, [svc]);

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
    
    // Simulate payment validation (3 seconds)
    setTimeout(() => {
      setSimStep("success");
      const ref = generateReference();
      setDoneRef(ref);

      // Trigger mock SMS notification toast
      setTimeout(() => {
        toast.success("SMS Confirmation Sent", {
          description: `Message: Ref ${ref} booked for ${svc.name} on ${bookingDate} at ${bookingTime} is confirmed. Pay KSh ${svc.price.replace(/\D/g, "") || "1,500"} after service.`,
          duration: 8000,
        });
      }, 500);
    }, 2500);
  };

  return (
    <AppLayout>
      <section className="bg-gradient-to-br from-[#1A3D2F] to-[#2D6A4F] py-16 text-white text-left">
        <div className="container-px mx-auto max-w-7xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#F5A623]">
            Book a Service
          </span>
          <h1 className="mt-3 text-4xl font-extrabold md:text-5xl">Experts at your farm gate.</h1>
          <p className="mt-2 max-w-xl text-white/80 text-sm">
            Select a specialized on-farm service, specify schedule availability, and confirm your request securely.
          </p>
        </div>
      </section>

      <section className="container-px mx-auto max-w-7xl py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
          {/* Service Sidebar Selector */}
          <aside className="space-y-2.5">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => changeService(s.id)}
                className={`flex w-full items-center gap-4 rounded-[12px] border p-4 text-left transition duration-300 ${
                  selected === s.id
                    ? "border-[#2D6A4F] bg-[#2D6A4F]/5 shadow-md"
                    : "border-[#E8ECE9] bg-white hover:border-[#2D6A4F]/40"
                }`}
              >
                <div className="grid h-12 w-12 place-items-center rounded-[8px] bg-[#FAFAF8] text-2xl">
                  {s.icon}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-[#1A1A1A]">{s.name}</div>
                  <div className="text-xs text-[#2D6A4F] font-semibold">{s.price}</div>
                </div>
                {selected === s.id && <Check className="h-4.5 w-4.5 text-[#2D6A4F]" />}
              </button>
            ))}
          </aside>

          {/* Service Booking Card */}
          <div className="rounded-[16px] border border-[#E8ECE9] bg-white p-6 shadow-md md:p-10">
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
                
                <button
                  onClick={resetBooking}
                  className="mt-8 rounded-[8px] bg-[#2D6A4F] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#1A5438] transition-colors"
                >
                  Book Another Service
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <h2 className="text-2xl font-extrabold text-[#1A1A1A] md:text-3xl">{svc.name}</h2>
                    <p className="mt-1 text-xs text-[#6B7280]">{svc.description}</p>
                  </div>
                  <div className="hidden text-right text-xs font-bold text-[#6B7280] md:block uppercase tracking-wider">
                    Step {step} of 3
                  </div>
                </div>

                {/* Progress Indicators */}
                <div className="relative flex items-center justify-between w-full max-w-md mx-auto mt-8 mb-10">
                  <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-[#E8ECE9] -translate-y-1/2 z-0" />
                  <div
                    className="absolute left-0 top-1/2 h-0.5 bg-[#2D6A4F] -translate-y-1/2 transition-all duration-300 z-0"
                    style={{ width: `${((step - 1) / 2) * 100}%` }}
                  />

                  {[
                    { stepNum: 1, label: "Farm Details" },
                    { stepNum: 2, label: "Schedule" },
                    { stepNum: 3, label: "Payment" },
                  ].map((s) => (
                    <div key={s.stepNum} className="relative z-10 flex flex-col items-center">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-xs border-2 transition-all duration-300 ${
                          step > s.stepNum
                            ? "bg-[#2D6A4F] border-[#2D6A4F] text-white"
                            : step === s.stepNum
                              ? "bg-white border-[#2D6A4F] text-[#2D6A4F] ring-4 ring-[#2D6A4F]/10"
                              : "bg-white border-[#E8ECE9] text-[#6B7280]"
                        }`}
                      >
                        {step > s.stepNum ? <Check className="w-4 h-4" /> : s.stepNum}
                      </div>
                      <span className={`mt-2 text-[10px] font-bold uppercase tracking-wider ${step === s.stepNum ? "text-[#1A1A1A]" : "text-[#6B7280]"}`}>
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Step Content */}
                <div className="mt-8">
                  {step === 1 && (
                    <div className="space-y-4 text-left">
                      {filteredFields.map((f) => (
                        <div key={f} className="block">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">{f}</span>
                          {f.toLowerCase().includes("description") || f.toLowerCase().includes("issue") ? (
                            <textarea
                              rows={3}
                              value={farmDetails[f] ?? ""}
                              onChange={(e) => setFarmDetails({ ...farmDetails, [f]: e.target.value })}
                              placeholder={`Describe details about the ${f.toLowerCase()}...`}
                              className="mt-1.5 w-full rounded-[8px] border border-[#E8ECE9] bg-white px-4 py-3 text-xs text-[#1A1A1A] outline-none transition focus:border-[#2D6A4F] focus:bg-white"
                            />
                          ) : (
                            <input
                              type="text"
                              value={farmDetails[f] ?? ""}
                              onChange={(e) => setFarmDetails({ ...farmDetails, [f]: e.target.value })}
                              placeholder={`Enter ${f.toLowerCase()}`}
                              className="mt-1.5 w-full rounded-[8px] border border-[#E8ECE9] bg-white px-4 py-3 text-xs text-[#1A1A1A] outline-none transition focus:border-[#2D6A4F] focus:bg-white"
                            />
                          )}
                        </div>
                      ))}

                      {/* 47 County Selector */}
                      <div className="block">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Farm County Location</span>
                        <select
                          value={selectedCounty}
                          onChange={(e) => setSelectedCounty(e.target.value)}
                          className="mt-1.5 w-full rounded-[8px] border border-[#E8ECE9] bg-white px-4 py-3 text-xs text-[#1A1A1A] outline-none transition focus:border-[#2D6A4F] focus:bg-white"
                        >
                          {counties.map((c) => (
                            <option key={c} value={c}>
                              {c} County
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-4 text-left">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="block">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Appointment Date</span>
                          <input
                            type="date"
                            required
                            value={bookingDate}
                            onChange={(e) => setBookingDate(e.target.value)}
                            className="mt-1.5 w-full rounded-[8px] border border-[#E8ECE9] bg-white px-4 py-3 text-xs text-[#1A1A1A] outline-none transition focus:border-[#2D6A4F] focus:bg-white"
                          />
                        </div>

                        <div className="block">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Preferred Time</span>
                          <input
                            type="time"
                            required
                            value={bookingTime}
                            onChange={(e) => setBookingTime(e.target.value)}
                            className="mt-1.5 w-full rounded-[8px] border border-[#E8ECE9] bg-white px-4 py-3 text-xs text-[#1A1A1A] outline-none transition focus:border-[#2D6A4F] focus:bg-white"
                          />
                        </div>
                      </div>

                      <div className="block">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Urgency Level</span>
                        <select
                          value={urgency}
                          onChange={(e) => setUrgency(e.target.value)}
                          className="mt-1.5 w-full rounded-[8px] border border-[#E8ECE9] bg-white px-4 py-3 text-xs text-[#1A1A1A] outline-none transition focus:border-[#2D6A4F] focus:bg-white"
                        >
                          <option value="Normal">Normal (Routine schedule booking)</option>
                          <option value="Medium">Medium (Needed in 2-3 days)</option>
                          <option value="Urgent">Urgent (Technician needed within 24 hours)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-6 text-left">
                      {/* Booking Summary */}
                      <div className="rounded-[12px] bg-[#FAFAF8] p-5 border border-[#E8ECE9]">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] mb-3">Booking summary</h4>
                        <div className="grid gap-2 text-xs text-[#6B7280]">
                          <div className="flex justify-between">
                            <span>Service:</span>
                            <span className="font-semibold text-[#1A1A1A]">{svc.name}</span>
                          </div>
                          {filteredFields.map((f) => (
                            <div key={f} className="flex justify-between">
                              <span>{f}:</span>
                              <span className="font-semibold text-[#1A1A1A] truncate max-w-[200px]">{farmDetails[f] || "—"}</span>
                            </div>
                          ))}
                          <div className="flex justify-between">
                            <span>County:</span>
                            <span className="font-semibold text-[#1A1A1A]">{selectedCounty} County</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Date & Time:</span>
                            <span className="font-semibold text-[#1A1A1A]">{bookingDate} at {bookingTime}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Urgency:</span>
                            <span className="font-semibold text-[#1A1A1A]">{urgency}</span>
                          </div>
                          <div className="h-px bg-[#E8ECE9] my-2" />
                          <div className="flex justify-between text-sm font-bold text-[#1A1A1A]">
                            <span>Estimated Cost:</span>
                            <span className="text-[#2D6A4F] font-extrabold">{svc.price}</span>
                          </div>
                        </div>
                      </div>

                      {/* Payment simulation phone input */}
                      {simStep === "idle" && (
                        <form onSubmit={handleMpesaSubmit} className="space-y-3">
                          <label className="block">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">M-Pesa Mobile Number</span>
                            <input
                              type="tel"
                              required
                              value={mpesaPhone}
                              onChange={(e) => setMpesaPhone(e.target.value)}
                              placeholder="e.g. 0712345678"
                              className="mt-1.5 w-full rounded-[8px] border border-[#E8ECE9] bg-white px-4 py-3 text-xs text-[#1A1A1A] outline-none transition focus:border-[#2D6A4F] focus:bg-white"
                            />
                          </label>
                          <button
                            type="submit"
                            className="w-full flex items-center justify-center gap-2 rounded-[8px] bg-[#2D6A4F] py-3 text-xs font-bold text-white shadow-md hover:bg-[#1A5438] transition-colors"
                          >
                            <span>Proceed to M-Pesa Checkout</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </form>
                      )}

                      {/* PIN screen simulator */}
                      {simStep === "pin" && (
                        <div className="mx-auto max-w-xs border border-[#E8ECE9] rounded-[24px] bg-[#1A1A1A] p-4 shadow-xl text-white">
                          <div className="text-center text-[10px] font-semibold text-gray-400 mb-2">M-PESA SIMULATION SCREEN</div>
                          <div className="rounded-[16px] bg-white p-4 text-center text-[#1A1A1A]">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">M-Pesa Paybill</div>
                            <div className="text-xs font-extrabold text-[#1A1A1A] mt-1">Pay MQULIMA SERVICES</div>
                            <div className="text-sm font-black text-[#2D6A4F] mt-1">{svc.price}</div>
                            
                            <div className="mt-4">
                              <div className="text-[10px] text-gray-500 font-bold mb-1">ENTER FOUR-DIGIT PIN:</div>
                              <div className="flex justify-center gap-2.5">
                                {Array.from({ length: 4 }).map((_, idx) => (
                                  <div
                                    key={idx}
                                    className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-xs font-bold text-[#1A1A1A]"
                                  >
                                    {pinCode[idx] ? "●" : ""}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Numeric Pinpad */}
                          <div className="mt-4 grid grid-cols-3 gap-2">
                            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
                              <button
                                key={n}
                                type="button"
                                onClick={() => handleKeyPress(n)}
                                className="h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-xs font-bold"
                              >
                                {n}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={handlePinBackspace}
                              className="h-10 rounded-full bg-red-600/20 text-red-400 hover:bg-red-600/30 text-[10px] font-bold"
                            >
                              Clear
                            </button>
                            <button
                              type="button"
                              onClick={() => handleKeyPress("0")}
                              className="h-10 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold"
                            >
                              0
                            </button>
                            <button
                              type="button"
                              onClick={handleConfirmPin}
                              className="h-10 rounded-full bg-[#2D6A4F] text-white hover:bg-[#1A5438] text-[10px] font-bold"
                            >
                              OK
                            </button>
                          </div>
                        </div>
                      )}

                      {/* STK loading spinner */}
                      {simStep === "loading" && (
                        <div className="text-center py-10 flex flex-col items-center justify-center">
                          <div className="w-12 h-12 rounded-full border-4 border-[#2D6A4F]/20 border-t-[#2D6A4F] animate-spin mb-4" />
                          <h4 className="text-sm font-bold text-[#1A1A1A]">Processing payment push...</h4>
                          <p className="text-xs text-[#6B7280] mt-1">Please wait while we verify your PIN.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Navigation Buttons */}
                {simStep !== "pin" && simStep !== "loading" && (
                  <div className="mt-8 flex items-center justify-between border-t border-[#E8ECE9] pt-6">
                    <button
                      disabled={step === 1}
                      onClick={() => setStep(step - 1)}
                      className="text-xs font-bold text-[#6B7280] hover:text-[#1A1A1A] disabled:opacity-30 uppercase tracking-wider"
                    >
                      ← Back
                    </button>
                    
                    {step < 3 && (
                      <button
                        disabled={!canProceed()}
                        onClick={() => setStep(step + 1)}
                        className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#2D6A4F] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#1A5438] transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                      >
                        <span>Continue</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
