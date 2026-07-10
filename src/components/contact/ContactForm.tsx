import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { submitContactForm } from "@/lib/api/contact-partnership.server";
import { 
  Check, 
  User, 
  Mail, 
  Phone, 
  FileText, 
  MessageSquare, 
  Sprout, 
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from "lucide-react";

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
      if (!value.trim()) errorMsg = "Full name is required";
    } else if (field === "email") {
      if (!value.trim()) {
        errorMsg = "Email address is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errorMsg = "Please enter a valid email address";
      }
    } else if (field === "phone") {
      if (!value.trim()) {
        errorMsg = "Phone number is required";
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
      currentErrors.fullName = "Full name is required";
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
    <div className="bg-white rounded-3xl border border-emerald-100 p-8 sm:p-10 shadow-[0_10px_40px_-6px_rgba(45,106,79,0.06)] relative overflow-hidden select-text text-left">
      {/* Dynamic gradient aura */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-50 rounded-full blur-3xl pointer-events-none opacity-60" />
      
      <AnimatePresence mode="wait">
        {!success ? (
          <motion.form
            key="contact-form"
            onSubmit={handleSubmit}
            className="space-y-6 relative z-10"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            noValidate
          >
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-750 text-sm p-4 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <span className="font-semibold">{errors.submit}</span>
              </div>
            )}

            {/* Grid for Name & Email */}
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-xs font-bold text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                    <User className="h-4.5 w-4.5" />
                  </span>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                    onBlur={(e) => handleBlur("fullName", e.target.value)}
                    placeholder="Enter your full name"
                    className={`w-full rounded-xl border bg-gray-50/50 pl-11 pr-4.5 py-3.5 text-sm text-[#0A1E0C] placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all duration-200 ${
                      touched.fullName && errors.fullName
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-200 focus:border-emerald-500"
                    }`}
                  />
                </div>
                {touched.fullName && errors.fullName && (
                  <span className="text-[11px] text-red-500 font-bold mt-1.5 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.fullName}
                  </span>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                    <Mail className="h-4.5 w-4.5" />
                  </span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    onBlur={(e) => handleBlur("email", e.target.value)}
                    placeholder="you@domain.com"
                    className={`w-full rounded-xl border bg-gray-50/50 pl-11 pr-4.5 py-3.5 text-sm text-[#0A1E0C] placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all duration-200 ${
                      touched.email && errors.email
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-200 focus:border-emerald-500"
                    }`}
                  />
                </div>
                {touched.email && errors.email && (
                  <span className="text-[11px] text-red-500 font-bold mt-1.5 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.email}
                  </span>
                )}
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phone" className="block text-xs font-bold text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="flex gap-2">
                <div className="relative flex items-center">
                  <span className="absolute left-3 pointer-events-none text-gray-400">
                    <Phone className="h-4.5 w-4.5" />
                  </span>
                  <select
                    id="phonePrefix"
                    name="phonePrefix"
                    aria-label="Country Code Prefix"
                    value={phonePrefix}
                    onChange={(e) => setPhonePrefix(e.target.value)}
                    className="rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-3 py-3.5 text-sm text-[#0A1E0C] outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer font-bold transition-all"
                  >
                    <option value="+254">+254</option>
                    <option value="+255">+255</option>
                    <option value="+256">+256</option>
                  </select>
                </div>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  onBlur={(e) => handleBlur("phone", e.target.value)}
                  placeholder="712345678"
                  className={`flex-1 rounded-xl border bg-gray-50/50 px-4.5 py-3.5 text-sm text-[#0A1E0C] placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all duration-200 ${
                    touched.phone && errors.phone
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-200 focus:border-emerald-500"
                  }`}
                />
              </div>
              {touched.phone && errors.phone && (
                <span className="text-[11px] text-red-500 font-bold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.phone}
                </span>
              )}
            </div>

            {/* Dropdown Select for I am a... & Subject */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="userType" className="block text-xs font-bold text-gray-700 mb-2">
                  I am a...
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                    <Sprout className="h-4.5 w-4.5" />
                  </span>
                  <select
                    id="userType"
                    value={userType}
                    onChange={(e) => handleChange("userType", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-11 pr-4 py-3.5 text-sm text-[#0A1E0C] outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer font-medium transition-all"
                  >
                    <option value="Farmer">Farmer</option>
                    <option value="Buyer">Buyer</option>
                    <option value="Agribusiness">Agribusiness</option>
                    <option value="Supplier">Supplier</option>
                    <option value="Investor">Investor</option>
                    <option value="Partner">Partner</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-xs font-bold text-gray-700 mb-2">
                  Subject
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                    <FileText className="h-4.5 w-4.5" />
                  </span>
                  <input
                    id="subject"
                    type="text"
                    value={subject}
                    onChange={(e) => handleChange("subject", e.target.value)}
                    placeholder="Inquiry Topic"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-11 pr-4.5 py-3.5 text-sm text-[#0A1E0C] placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Message Area */}
            <div>
              <label htmlFor="message" className="block text-xs font-bold text-gray-700 mb-2">
                Message
              </label>
              <div className="relative">
                <span className="absolute top-3.5 left-4 pointer-events-none text-gray-400">
                  <MessageSquare className="h-4.5 w-4.5" />
                </span>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  onBlur={(e) => handleBlur("message", e.target.value)}
                  rows={4}
                  placeholder="How can we help grow your business?"
                  style={{ minHeight: "120px" }}
                  className={`w-full rounded-xl border bg-gray-50/50 pl-11 pr-4.5 py-3.5 text-sm text-[#0A1E0C] placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all duration-200 resize-none ${
                    touched.message && errors.message
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-200 focus:border-emerald-500"
                  }`}
                />
              </div>
              {touched.message && errors.message && (
                <span className="text-[11px] text-red-500 font-bold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.message}
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
                <div className={`mt-0.5 grid h-[20px] w-[20px] shrink-0 place-items-center border rounded-lg transition duration-200 ${
                  consent 
                    ? "border-emerald-600 bg-emerald-600 text-white" 
                    : "border-gray-300 bg-white group-hover:border-emerald-600"
                }`}>
                  {consent && <Check className="h-3.5 w-3.5 stroke-[3px]" />}
                </div>
                <span className="text-xs sm:text-sm text-gray-500 leading-tight select-none font-medium">
                  I consent to Mqulima storing my submitted data for response purposes.
                </span>
              </label>
              {touched.consent && errors.consent && (
                <span className="text-[11px] text-red-500 font-bold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.consent}
                </span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="group w-full relative overflow-hidden bg-gradient-to-r from-emerald-600 to-[#2D6A4F] hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-sm tracking-wider py-4 px-8 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-700/10 hover:shadow-xl hover:shadow-emerald-700/25 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
            >
              {submitting ? (
                <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span className="flex items-center gap-2 relative z-10">
                    🌱 Send Message
                  </span>
                  <ArrowRight className="w-4.5 h-4.5 relative z-10 transition-transform duration-250 group-hover:translate-x-1.5" />
                </>
              )}
            </button>
          </motion.form>
        ) : (
          <motion.div
            key="success-message"
            className="py-12 px-6 text-center bg-emerald-50/50 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center text-emerald-850 relative z-10"
            initial={{ opacity: 0, scale: 0.98, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 22 }}
          >
            <div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-600 text-white text-xl font-bold shadow-md shadow-emerald-650/20">
              <Check className="w-6 h-6 stroke-[3px]" />
            </div>
            <h3 className="mt-5 text-xl font-bold text-[#0A1E0C]">
              Message Sent Successfully
            </h3>
            <p className="mt-2 text-sm text-gray-500 max-w-sm leading-relaxed font-medium">
              Thank you for reaching out! Your inquiry has been stored. A Mqulima coordinator will contact you back within 2 hours.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="mt-6 rounded-xl border border-gray-250 bg-white hover:bg-gray-50 px-5 py-3 text-xs font-bold text-[#0A1E0C] shadow-sm hover:shadow transition-all cursor-pointer"
            >
              Send Another Inquiry
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
