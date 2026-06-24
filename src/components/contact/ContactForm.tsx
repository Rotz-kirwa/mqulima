import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabaseSim } from "@/lib/api/supabase-sim";
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

    const res = await supabaseSim.insertSubmission({
      full_name: fullName,
      email: email,
      phone: formattedPhone,
      user_type: userType,
      subject: subject || "No Subject Provided",
      message: message,
      consent: consent,
    });

    setSubmitting(false);
    if (res.success) {
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
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-[20px] p-6 md:p-10 shadow-md relative overflow-hidden">
      <AnimatePresence mode="wait">
        {!success ? (
          <motion.form
            key="contact-form"
            onSubmit={handleSubmit}
            className="space-y-6 text-left"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            noValidate
          >
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                onBlur={(e) => handleBlur("fullName", e.target.value)}
                placeholder="Enter your name"
                className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-[#1A1A1A] placeholder-gray-400 outline-none transition duration-200 ${
                  touched.fullName && errors.fullName
                    ? "border-red-500 ring-1 ring-red-500/25"
                    : "border-gray-200 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F]/25"
                }`}
              />
              {touched.fullName && errors.fullName && (
                <span className="text-[10px] text-red-500 font-semibold mt-1 block">
                  ⚠️ {errors.fullName}
                </span>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => handleChange("email", e.target.value)}
                onBlur={(e) => handleBlur("email", e.target.value)}
                placeholder="you@example.com"
                className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-[#1A1A1A] placeholder-gray-400 outline-none transition duration-200 ${
                  touched.email && errors.email
                    ? "border-red-500 ring-1 ring-red-500/25"
                    : "border-gray-200 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F]/25"
                }`}
              />
              {touched.email && errors.email && (
                <span className="text-[10px] text-red-500 font-semibold mt-1 block">
                  ⚠️ {errors.email}
                </span>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phone" className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Phone Number
              </label>
              <div className="flex gap-2">
                <select
                  aria-label="Country Code Prefix"
                  value={phonePrefix}
                  onChange={(e) => setPhonePrefix(e.target.value)}
                  className="rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm text-[#1A1A1A] outline-none focus:border-[#2D6A4F] cursor-pointer"
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
                  className={`flex-1 rounded-xl border bg-white px-4 py-3 text-sm text-[#1A1A1A] placeholder-gray-400 outline-none transition duration-200 ${
                    touched.phone && errors.phone
                      ? "border-red-500 ring-1 ring-red-500/25"
                      : "border-gray-200 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F]/25"
                  }`}
                />
              </div>
              {touched.phone && errors.phone && (
                <span className="text-[10px] text-red-500 font-semibold mt-1 block">
                  ⚠️ {errors.phone}
                </span>
              )}
            </div>

            {/* I am a... & Subject */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="userType" className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  I am a...
                </label>
                <select
                  id="userType"
                  value={userType}
                  onChange={(e) => handleChange("userType", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1A1A1A] outline-none focus:border-[#2D6A4F] cursor-pointer"
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
                <label htmlFor="subject" className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Subject
                </label>
                <input
                  id="subject"
                  type="text"
                  value={subject}
                  onChange={(e) => handleChange("subject", e.target.value)}
                  placeholder="Inquiry Topic"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1A1A1A] placeholder-gray-400 outline-none focus:border-[#2D6A4F] transition duration-200"
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
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
                className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-[#1A1A1A] placeholder-gray-400 outline-none transition duration-200 resize-none ${
                  touched.message && errors.message
                    ? "border-red-500 ring-1 ring-red-500/25"
                    : "border-gray-200 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F]/25"
                }`}
              />
              {touched.message && errors.message && (
                <span className="text-[10px] text-red-500 font-semibold mt-1 block">
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
                <div className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border transition duration-200 ${
                  consent 
                    ? "border-[#2D6A4F] bg-[#2D6A4F] text-white" 
                    : "border-gray-200 bg-white group-hover:border-[#2D6A4F]"
                }`}>
                  {consent && <Check className="h-3 w-3 stroke-[3px]" />}
                </div>
                <span className="text-xs text-gray-600 leading-tight select-none">
                  I consent to Mqulima storing my data for contact purposes.
                </span>
              </label>
              {touched.consent && errors.consent && (
                <span className="text-[10px] text-red-500 font-semibold mt-1 block">
                  ⚠️ {errors.consent}
                </span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#F5A623] hover:bg-[#2D6A4F] hover:text-white text-[#0A0F0D] font-bold text-base py-3 px-6 rounded-xl shadow-lg transition-all duration-300 ease-in-out cursor-pointer flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {submitting ? (
                <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
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
            className="py-12 px-4 text-center border border-[#2D6A4F]/20 bg-[#E8F5E9] rounded-xl flex flex-col items-center justify-center text-[#1A6B3C]"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 18 }}
          >
            <div className="grid h-16 w-16 place-items-center rounded-full bg-[#1A6B3C]/10 text-[#1A6B3C] text-3xl animate-bounce">
              ✅
            </div>
            <h3 className="mt-6 text-xl font-extrabold text-[#1A6B3C]">
              Message sent successfully!
            </h3>
            <p className="mt-2 text-sm text-[#1A6B3C]/80 max-w-sm leading-relaxed">
              Thank you for reaching out. A representative from the Mqulima team will contact you shortly.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="mt-8 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-5 py-2.5 text-xs font-bold text-[#1A1A1A] transition-colors"
            >
              Send Another Inquiry
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
