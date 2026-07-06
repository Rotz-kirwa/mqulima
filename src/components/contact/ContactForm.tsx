import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { submitContactForm } from "@/lib/api/contact-partnership.server";
import { Check } from "lucide-react";

export function ContactForm() {
  // Field values
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phonePrefix, setPhonePrefix] = useState("+254");
  const [phone, setPhone] = useState("");
  const [userType, setUserType] = useState("Farmer");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);

  // Field validation / touched states
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Loading / success states
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Real-time validation handler
  const validateField = (field: string, value: any) => {
    let errorMsg = "";

    if (field === "fullName") {
      if (!value.trim()) errorMsg = "Full Name is required";
    } else if (field === "email") {
      if (!value.trim()) {
        errorMsg = "Email Address is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errorMsg = "Please enter a valid email address";
      }
    } else if (field === "phone") {
      if (!value.trim()) {
        errorMsg = "Phone Number is required";
      } else if (!/^\d{9,10}$/.test(value.trim())) {
        errorMsg = "Please enter a valid 9 or 10 digit number";
      }
    } else if (field === "message") {
      if (!value.trim()) {
        errorMsg = "Message cannot be empty";
      } else if (value.trim().length < 10) {
        errorMsg = "Message must be at least 10 characters long";
      }
    } else if (field === "consent") {
      if (!value) errorMsg = "You must consent to store your data";
    }

    setErrors((prev) => ({
      ...prev,
      [field]: errorMsg,
    }));
  };

  const handleBlur = (field: string, value: any) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, value);
  };

  const handleChange = (field: string, value: any) => {
    if (field === "fullName") setFullName(value);
    if (field === "email") setEmail(value);
    if (field === "phone") setPhone(value);
    if (field === "userType") setUserType(value);
    if (field === "subject") setSubject(value);
    if (field === "message") setMessage(value);
    if (field === "consent") setConsent(value);

    if (touched[field]) {
      validateField(field, value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all as touched
    const allFields = { fullName, email, phone, message, consent };
    const newTouched: Record<string, boolean> = {};
    Object.keys(allFields).forEach((k) => {
      newTouched[k] = true;
      validateField(k, (allFields as any)[k]);
    });
    setTouched(newTouched);

    // Validate
    let hasErrors = false;
    const currentErrors: Record<string, string> = {};
    
    if (!fullName.trim()) {
      currentErrors.fullName = "Full Name is required";
      hasErrors = true;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      currentErrors.email = "Please enter a valid email address";
      hasErrors = true;
    }
    if (!phone.trim() || !/^\d{9,10}$/.test(phone.trim())) {
      currentErrors.phone = "Please enter a valid 9 or 10 digit number";
      hasErrors = true;
    }
    if (!message.trim() || message.trim().length < 10) {
      currentErrors.message = "Message must be at least 10 characters long";
      hasErrors = true;
    }
    if (!consent) {
      currentErrors.consent = "You must consent to store your data";
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(currentErrors);
      return;
    }

    setSubmitting(true);
    
    const formattedPhone = `${phonePrefix}${phone.startsWith("0") ? phone.slice(1) : phone}`;

    try {
      const { getCsrfTokenFromCookie } = await import("@/lib/csrf-client");
      const res = await submitContactForm({
        data: {
          fullName,
          email,
          phone: formattedPhone,
          userType,
          subject: subject || "No Subject Provided",
          message,
          csrfToken: getCsrfTokenFromCookie(),
        }
      });

      if (res && res.success) {
        setSuccess(true);
        // Reset form fields
        setFullName("");
        setEmail("");
        setPhone("");
        setSubject("");
        setMessage("");
        setConsent(false);
        setTouched({});
        setErrors({});
      } else {
        setErrors({ submit: "Failed to submit contact request. Please try again." });
      }
    } catch (err: any) {
      setErrors({ submit: err?.message || "An unexpected error occurred." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border-2 border-[#0A1E0C] rounded-none p-8 md:p-12 relative overflow-hidden shadow-[8px_8px_0px_#0A1E0C]">
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: "radial-gradient(#0A1E0C 1.5px, transparent 1.5px)", backgroundSize: "16px 16px" }} />
      
      <AnimatePresence mode="wait">
        {!success ? (
          <motion.form
            key="contact-form"
            onSubmit={handleSubmit}
            className="space-y-6 text-left relative z-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            noValidate
          >
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#2D6A4F] mb-2.5">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                onBlur={(e) => handleBlur("fullName", e.target.value)}
                placeholder="Enter your full name"
                className={`w-full rounded-none border-2 bg-white px-4.5 py-3 text-sm text-[#0A1E0C] placeholder-gray-400 outline-none transition duration-200 ${
                  touched.fullName && errors.fullName
                    ? "border-red-550 focus:border-red-500"
                    : "border-[#0A1E0C] focus:border-[#2D6A4F]"
                }`}
              />
              {touched.fullName && errors.fullName && (
                <span className="text-[10px] text-red-500 font-bold mt-1.5 block">
                  ⚠️ {errors.fullName}
                </span>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#2D6A4F] mb-2.5">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => handleChange("email", e.target.value)}
                onBlur={(e) => handleBlur("email", e.target.value)}
                placeholder="you@domain.com"
                className={`w-full rounded-none border-2 bg-white px-4.5 py-3 text-sm text-[#0A1E0C] placeholder-gray-400 outline-none transition duration-200 ${
                  touched.email && errors.email
                    ? "border-red-550 focus:border-red-500"
                    : "border-[#0A1E0C] focus:border-[#2D6A4F]"
                }`}
              />
              {touched.email && errors.email && (
                <span className="text-[10px] text-red-500 font-bold mt-1.5 block">
                  ⚠️ {errors.email}
                </span>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phone" className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#2D6A4F] mb-2.5">
                Phone Number
              </label>
              <div className="flex gap-2">
                <select
                  aria-label="Country Code Prefix"
                  value={phonePrefix}
                  onChange={(e) => setPhonePrefix(e.target.value)}
                  className="rounded-none border-2 border-[#0A1E0C] bg-white px-3.5 py-3 text-sm text-[#0A1E0C] outline-none focus:border-[#2D6A4F] cursor-pointer font-bold"
                >
                  <option value="+254">+254 (KE)</option>
                  <option value="+255">+255 (TZ)</option>
                  <option value="+256">+256 (UG)</option>
                </select>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  onBlur={(e) => handleBlur("phone", e.target.value)}
                  placeholder="712345678"
                  className={`flex-1 rounded-none border-2 bg-white px-4 py-3 text-sm text-[#0A1E0C] placeholder-gray-400 outline-none transition duration-200 ${
                    touched.phone && errors.phone
                      ? "border-red-550 focus:border-red-500"
                      : "border-[#0A1E0C] focus:border-[#2D6A4F]"
                  }`}
                />
              </div>
              {touched.phone && errors.phone && (
                <span className="text-[10px] text-red-500 font-bold mt-1.5 block">
                  ⚠️ {errors.phone}
                </span>
              )}
            </div>

            {/* I am a... & Subject */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="userType" className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#2D6A4F] mb-2.5">
                  I am a...
                </label>
                <select
                  id="userType"
                  value={userType}
                  onChange={(e) => handleChange("userType", e.target.value)}
                  className="w-full rounded-none border-2 border-[#0A1E0C] bg-white px-4 py-3 text-sm text-[#0A1E0C] outline-none focus:border-[#2D6A4F] cursor-pointer font-medium"
                >
                  <option value="Farmer">Farmer</option>
                  <option value="Cooperative">Cooperative</option>
                  <option value="Agri-Investor">Agri-Investor</option>
                  <option value="Supplier">Supplier</option>
                  <option value="Media">Media</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="subject" className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#2D6A4F] mb-2.5">
                  Subject
                </label>
                <input
                  id="subject"
                  type="text"
                  value={subject}
                  onChange={(e) => handleChange("subject", e.target.value)}
                  placeholder="Inquiry Topic"
                  className="w-full rounded-none border-2 border-[#0A1E0C] bg-white px-4 py-3 text-sm text-[#0A1E0C] placeholder-gray-400 outline-none focus:border-[#2D6A4F] transition duration-200"
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#2D6A4F] mb-2.5">
                Message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => handleChange("message", e.target.value)}
                onBlur={(e) => handleBlur("message", e.target.value)}
                rows={4}
                placeholder="How can we help grow your business?"
                style={{ minHeight: "120px" }}
                className={`w-full rounded-none border-2 bg-white px-4 py-3 text-sm text-[#0A1E0C] placeholder-gray-400 outline-none transition duration-200 resize-none ${
                  touched.message && errors.message
                    ? "border-red-550 focus:border-red-500"
                    : "border-[#0A1E0C] focus:border-[#2D6A4F]"
                }`}
              />
              {touched.message && errors.message && (
                <span className="text-[10px] text-red-500 font-bold mt-1.5 block">
                  ⚠️ {errors.message}
                </span>
              )}
            </div>

            {/* Consent checkbox */}
            <div>
              <label htmlFor="consent" className="flex items-start gap-3 cursor-pointer group">
                <input
                  id="consent"
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => handleChange("consent", e.target.checked)}
                  onBlur={() => handleBlur("consent", consent)}
                  className="sr-only"
                />
                <div className={`mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center border-2 rounded-none transition duration-200 ${
                  consent 
                    ? "border-[#2D6A4F] bg-[#2D6A4F] text-white" 
                    : "border-[#0A1E0C] bg-white group-hover:border-[#2D6A4F]"
                }`}>
                  {consent && <Check className="h-3 w-3 stroke-[3px]" />}
                </div>
                <span className="text-xs text-gray-600 leading-tight select-none font-medium">
                  I consent to Mqulima storing my submitted data for response purposes.
                </span>
              </label>
              {touched.consent && errors.consent && (
                <span className="text-[10px] text-red-500 font-bold mt-1.5 block">
                  ⚠️ {errors.consent}
                </span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#F5A623] hover:bg-[#E0951F] text-[#0A1E0C] border-2 border-[#0A1E0C] font-black text-xs uppercase tracking-widest py-4 px-8 rounded-none transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-[4px_4px_0px_#0A1E0C] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#0A1E0C] disabled:opacity-50"
            >
              {submitting ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#0A1E0C] border-t-transparent" />
              ) : (
                <>
                  Send Message
                  <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                </>
              )}
            </button>
          </motion.form>
        ) : (
          <motion.div
            key="success-message"
            className="py-16 px-8 text-center border-2 border-[#0A1E0C] bg-[#E8F5E9] rounded-none flex flex-col items-center justify-center text-[#1A6B3C] relative z-10"
            initial={{ opacity: 0, scale: 0.98, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 20 }}
          >
            <div className="grid h-16 w-16 place-items-center rounded-none border-2 border-[#0A1E0C] bg-white text-[#1A6B3C] text-2xl font-black shadow-[4px_4px_0px_#0A1E0C]">
              ✓
            </div>
            <h3 className="mt-6 text-2xl font-black font-serif text-[#0A1E0C]">
              Message Dispatch Successful
            </h3>
            <p className="mt-2 text-sm text-gray-600 max-w-sm leading-relaxed font-medium">
              Your inquiry has been stored. A Mqulima technical officer or coordinator will respond to your channel shortly.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="mt-8 rounded-none border-2 border-[#0A1E0C] bg-[#FAF9F5] hover:bg-white px-6 py-3.5 text-xs font-black uppercase tracking-wider text-[#0A1E0C] transition-all cursor-pointer shadow-[4px_4px_0px_#0A1E0C] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#0A1E0C]"
            >
              Send Another Inquiry
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
