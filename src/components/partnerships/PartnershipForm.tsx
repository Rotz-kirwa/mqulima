import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, Download } from "lucide-react";
import { supabaseSim } from "@/lib/api/supabase-sim";

interface PartnershipFormProps {
  selectedTier: string;
}

export function PartnershipForm({ selectedTier }: PartnershipFormProps) {
  const [orgName, setOrgName] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [phonePrefix, setPhonePrefix] = useState("+254");
  const [phone, setPhone] = useState("");
  const [orgType, setOrgType] = useState("Fintech Startup / Bank");
  const [tierInterest, setTierInterest] = useState("FINTECH & TRANSACTIONAL MODEL");
  const [county, setCounty] = useState("Uasin Gishu");
  const [goal, setGoal] = useState("");
  const [referralSource, setReferralSource] = useState("Search Engine");
  const [consent, setConsent] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formRef = useRef<HTMLDivElement>(null);

  // Sync selected tier from TierCards click
  useEffect(() => {
    if (selectedTier) {
      setTierInterest(selectedTier);
      // Smooth scroll to the form container
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedTier]);

  const validate = () => {
    const tempErrors: Record<string, string> = {};
    if (!orgName.trim()) tempErrors.orgName = "Organization name is required";
    if (!fullName.trim()) tempErrors.fullName = "Full name is required";
    if (!role.trim()) tempErrors.role = "Role/Title is required";
    if (!email.trim()) {
      tempErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = "Invalid email format";
    }
    if (!phone.trim()) {
      tempErrors.phone = "Phone number is required";
    } else if (!/^\d{7,10}$/.test(phone.replace(/[\s-]/g, ""))) {
      tempErrors.phone = "Enter a valid 7 to 10-digit phone number";
    }
    if (!goal.trim()) {
      tempErrors.goal = "Goal description is required";
    } else if (goal.trim().length < 20) {
      tempErrors.goal = "Please write a bit more detail (minimum 20 characters)";
    }
    if (!consent) {
      tempErrors.consent = "You must agree to the terms to proceed";
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fill in all required fields correctly.");
      return;
    }

    setSubmitting(true);
    const formattedPhone = `${phonePrefix}${phone.startsWith("0") ? phone.slice(1) : phone}`;

    const res = await supabaseSim.insertPartnershipApplication({
      org_name: orgName,
      contact_name: fullName,
      role: role,
      email: email,
      phone: formattedPhone,
      org_type: orgType,
      tier_interest: tierInterest,
      countries: [county],
      goal: goal,
      referral_source: referralSource,
      consent: consent,
    });

    setSubmitting(false);

    if (res.success) {
      setSuccess(true);
      toast.success("Onboarding Application Submitted!");
      // Reset form
      setOrgName("");
      setFullName("");
      setRole("");
      setEmail("");
      setPhone("");
      setGoal("");
      setConsent(false);
    } else {
      toast.error(res.error || "Submission failed. Please try again.");
    }
  };

  return (
    <section ref={formRef} className="bg-[#FAF9F6] py-28 px-6 text-center border-t border-gray-200/80 scroll-mt-24">
      <div className="max-w-4xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#2D6A4F]">
          SERVICE PROVIDER ONBOARDING
        </span>
        <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#1A3D2F] tracking-tight leading-tight">
          Start Onboarding.
        </h2>
        <p className="mt-4 max-w-xl mx-auto text-sm text-gray-600 leading-relaxed font-light">
          Fill out the onboarding application. Our operations and developer relations teams review every request to establish active system access.
        </p>

        <div className="mt-16 bg-white border border-gray-200 rounded-2xl p-6 sm:p-10 text-left transition-all duration-300 shadow-sm">
          {success ? (
            <div className="py-12 flex flex-col items-center text-center animate-fade-in">
              <CheckCircle2 className="h-16 w-16 text-[#2D6A4F] animate-bounce" />
              <h3 className="mt-6 text-2xl font-serif font-bold text-[#1A1A1A]">
                Application Received.
              </h3>
              <p className="mt-3 max-w-md text-sm text-gray-600 leading-relaxed font-light">
                Our team will reach out within 48 business hours. In the meantime, download our Integration & API documentation pack.
              </p>
              
              <a
                href="#download"
                onClick={(e) => {
                  e.preventDefault();
                  toast.success("Downloading Onboarding & API Pack (PDF)...");
                }}
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#2D6A4F] hover:bg-[#F5A623] hover:text-[#1A1A1A] text-white px-8 py-4 font-bold text-xs uppercase tracking-wider transition duration-300"
              >
                <Download className="h-4 w-4" /> Download Onboarding Pack
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6" suppressHydrationWarning>
              <div className="grid gap-6 sm:grid-cols-2" suppressHydrationWarning>
                {/* Org Name */}
                <div suppressHydrationWarning>
                  <label htmlFor="orgName" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Organization / Provider Name *
                  </label>
                  <input
                    id="orgName"
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className={`w-full rounded-xl border bg-gray-50/50 px-4 py-3 text-sm text-[#1A1A1A] outline-none transition-all ${
                      errors.orgName ? "border-red-500/80 focus:border-red-500" : "border-gray-200 focus:border-[#2D6A4F] focus:bg-white"
                    }`}
                    placeholder="e.g. Kiprop Logistics Ltd"
                    suppressHydrationWarning
                  />
                  {errors.orgName && <span className="text-[11px] text-red-400 mt-1 block">{errors.orgName}</span>}
                </div>

                {/* Full Name */}
                <div suppressHydrationWarning>
                  <label htmlFor="fullName" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Contact Person's Full Name *
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`w-full rounded-xl border bg-gray-50/50 px-4 py-3 text-sm text-[#1A1A1A] outline-none transition-all ${
                      errors.fullName ? "border-red-500/80 focus:border-red-500" : "border-gray-200 focus:border-[#2D6A4F] focus:bg-white"
                    }`}
                    placeholder="e.g. Kiprop Cheruiyot"
                    suppressHydrationWarning
                  />
                  {errors.fullName && <span className="text-[11px] text-red-400 mt-1 block">{errors.fullName}</span>}
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2" suppressHydrationWarning>
                {/* Role */}
                <div suppressHydrationWarning>
                  <label htmlFor="role" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Role / Title *
                  </label>
                  <input
                    id="role"
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className={`w-full rounded-xl border bg-gray-50/50 px-4 py-3 text-sm text-[#1A1A1A] outline-none transition-all ${
                      errors.role ? "border-red-500/80 focus:border-red-500" : "border-gray-200 focus:border-[#2D6A4F] focus:bg-white"
                    }`}
                    placeholder="e.g. Technical Director"
                    suppressHydrationWarning
                  />
                  {errors.role && <span className="text-[11px] text-red-400 mt-1 block">{errors.role}</span>}
                </div>

                {/* Email */}
                <div suppressHydrationWarning>
                  <label htmlFor="email" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Work Email *
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full rounded-xl border bg-gray-50/50 px-4 py-3 text-sm text-[#1A1A1A] outline-none transition-all ${
                      errors.email ? "border-red-500/80 focus:border-red-500" : "border-gray-200 focus:border-[#2D6A4F] focus:bg-white"
                    }`}
                    placeholder="name@organization.com"
                    suppressHydrationWarning
                  />
                  {errors.email && <span className="text-[11px] text-red-400 mt-1 block">{errors.email}</span>}
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2" suppressHydrationWarning>
                {/* Phone */}
                <div suppressHydrationWarning>
                  <label htmlFor="phone" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Phone Number *
                  </label>
                  <div className="flex gap-2" suppressHydrationWarning>
                    <select
                      value={phonePrefix}
                      onChange={(e) => setPhonePrefix(e.target.value)}
                      className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-[#1A1A1A] outline-none focus:border-[#2D6A4F]"
                      suppressHydrationWarning
                    >
                      <option value="+254">+254 (KE)</option>
                      <option value="+255">+255 (TZ)</option>
                      <option value="+256">+256 (UG)</option>
                      <option value="+250">+250 (RW)</option>
                      <option value="+251">+251 (ET)</option>
                    </select>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`flex-1 rounded-xl border bg-gray-50/50 px-4 py-3 text-sm text-[#1A1A1A] outline-none transition-all ${
                        errors.phone ? "border-red-500/80 focus:border-red-500" : "border-gray-200 focus:border-[#2D6A4F] focus:bg-white"
                      }`}
                      placeholder="e.g. 723346134"
                      suppressHydrationWarning
                    />
                  </div>
                  {errors.phone && <span className="text-[11px] text-red-400 mt-1 block">{errors.phone}</span>}
                </div>

                {/* Organization Type */}
                <div suppressHydrationWarning>
                  <label htmlFor="orgType" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Provider Type
                  </label>
                  <select
                    id="orgType"
                    value={orgType}
                    onChange={(e) => setOrgType(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-[#1A1A1A] outline-none focus:border-[#2D6A4F] transition-all"
                    suppressHydrationWarning
                  >
                    <option value="Fintech Startup / Bank">Fintech Startup / Bank</option>
                    <option value="NGO / Non-Profit">NGO / Non-Profit</option>
                    <option value="Input Supply Manufacturer">Input Supply Manufacturer</option>
                    <option value="Logistics & Transport Provider">Logistics & Transport Provider</option>
                    <option value="Independent Agronomist">Independent Agronomist</option>
                    <option value="Agro-retail dealer">Agro-retail dealer</option>
                    <option value="Cooperative / Buyer">Cooperative / Buyer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Collaboration Model Interest */}
              <div suppressHydrationWarning>
                <span className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                  Collaboration Model Interest *
                </span>
                <div className="grid gap-3 sm:grid-cols-3" suppressHydrationWarning>
                  {[
                    "SUPPLY CHAIN & INPUT MODEL",
                    "FINTECH & TRANSACTIONAL MODEL",
                    "DEVELOPMENT & GRANT MODEL",
                  ].map((t) => (
                    <label
                      key={t}
                      className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                        tierInterest === t
                          ? "border-[#F5A623] bg-[#F5A623]/5"
                          : "border-gray-200 bg-gray-50/50 hover:border-gray-300"
                      }`}
                      suppressHydrationWarning
                    >
                      <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                        {t.replace(" MODEL", "")}
                      </span>
                      <input
                        type="radio"
                        name="tierInterest"
                        value={t}
                        checked={tierInterest === t}
                        onChange={() => setTierInterest(t)}
                        className="accent-[#F5A623]"
                        suppressHydrationWarning
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Counties of Operation */}
              <div suppressHydrationWarning>
                <label htmlFor="county" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  County of Operation *
                </label>
                <select
                  id="county"
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-[#1A1A1A] outline-none focus:border-[#2D6A4F] transition-all"
                  suppressHydrationWarning
                >
                  {[
                    "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo-Marakwet", "Embu", "Garissa",
                    "Homa Bay", "Isiolo", "Kajiado", "Kakamega", "Kericho", "Kiambu", "Kilifi",
                    "Kirinyaga", "Kisii", "Kisumu", "Kitui", "Kwale", "Laikipia", "Lamu",
                    "Machakos", "Makueni", "Mandera", "Marsabit", "Meru", "Migori", "Mombasa",
                    "Murang'a", "Nairobi", "Nakuru", "Nandi", "Nyamira", "Nyeri", "Samburu",
                    "Siaya", "Taita-Taveta", "Tana River", "Tharaka-Nithi", "Trans Nzoia",
                    "Turkana", "Uasin Gishu", "Vihiga", "Wajir", "West Pokot"
                  ].map((c) => (
                    <option key={c} value={c}>
                      {c} County
                    </option>
                  ))}
                </select>
              </div>

              {/* Onboarding Goal */}
              <div suppressHydrationWarning>
                <label htmlFor="goal" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Onboarding & Integration Goals *
                </label>
                <textarea
                  id="goal"
                  rows={5}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className={`w-full rounded-xl border bg-gray-50/50 px-4 py-3 text-sm text-[#1A1A1A] outline-none transition-all resize-none min-h-[150px] ${
                    errors.goal ? "border-red-500/80 focus:border-red-500" : "border-gray-200 focus:border-[#2D6A4F] focus:bg-white"
                  }`}
                  placeholder="Outline your technical integration goals or supply-chain details to help us establish appropriate API/system access..."
                  suppressHydrationWarning
                />
                {errors.goal && <span className="text-[11px] text-red-400 mt-1 block">{errors.goal}</span>}
              </div>

              <div className="grid gap-6 sm:grid-cols-2" suppressHydrationWarning>
                {/* Referral Source */}
                <div suppressHydrationWarning>
                  <label htmlFor="referral" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    How did you hear about Mqulima?
                  </label>
                  <select
                    id="referral"
                    value={referralSource}
                    onChange={(e) => setReferralSource(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-[#1A1A1A] outline-none focus:border-[#2D6A4F] transition-all"
                    suppressHydrationWarning
                  >
                    <option value="Search Engine">Search Engine</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Industry Event">Industry Event</option>
                    <option value="Cooperative Referral">Cooperative Referral</option>
                    <option value="News Article">News Article</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Consent checkbox */}
              <div className="pt-2" suppressHydrationWarning>
                <label className="flex items-start gap-3 cursor-pointer" suppressHydrationWarning>
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-1 accent-[#2D6A4F]"
                    suppressHydrationWarning
                  />
                  <span className="text-xs text-gray-600 leading-relaxed font-light">
                    I agree to Mqulima's onboarding terms and consent to having our operational details securely processed.
                  </span>
                </label>
                {errors.consent && <span className="text-[11px] text-red-400 mt-1 block">{errors.consent}</span>}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#2D6A4F] hover:bg-[#F5A623] hover:text-[#1A1A1A] text-white py-4 font-bold text-xs uppercase tracking-wider transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                suppressHydrationWarning
              >
                {submitting ? "Submitting Request..." : "Submit Onboarding Request"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
