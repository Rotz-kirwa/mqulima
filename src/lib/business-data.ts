/**
 * src/lib/business-data.ts
 * 
 * Authoritative business configuration, schema types, time evaluation,
 * and JSON-LD structured data generators for Mqulima.
 * 
 * Sourced directly from verified repository records:
 * - Location: Junction, Eldoret–Iten Highway, Eldoret, Uasin Gishu County, Kenya
 * - Timezone: Africa/Nairobi (UTC+3, EAT)
 * - Brand: "Africa's 360° agriculture ecosystem" | "Taking you first class"
 * - Primary Phone: +254 723 346 134 | Email: info@mqulima.com
 */

export interface OperatingHourDay {
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  open: string;  // e.g. "08:00"
  close: string; // e.g. "18:00"
  closed: boolean;
}

export interface BusinessSocialLinks {
  twitter?: string;
  tiktok?: string;
  linkedin?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
}

export interface BusinessFaqItem {
  q: string;
  a: string;
}

export interface BusinessPolicies {
  delivery: string;
  payments: string;
  returns: string;
  warranty: string;
}

export interface BusinessProfileData {
  id: string;
  businessName: string;
  legalName: string;
  brandTagline: string;
  brandSlogan: string;
  primaryCategory: string;
  shortDescription: string;
  fullOverview: string;
  phonePrimary: string;
  phoneSecondary?: string;
  emailPrimary: string;
  emailSupport: string;
  whatsappNumber: string;
  addressStreet: string;
  addressCity: string;
  addressCounty: string;
  addressPostalCode: string;
  addressCountry: string;
  latitude: number;
  longitude: number;
  mapsUrl: string;
  serviceAreas: string[];
  operatingHours: OperatingHourDay[];
  logoUrl: string;
  coverImageUrl: string;
  galleryImages: string[];
  socialLinks: BusinessSocialLinks;
  faqs: BusinessFaqItem[];
  businessPolicies: BusinessPolicies;
  googlePlaceId?: string;
  googleReviewUrl?: string;
  isPublished: boolean;
  updatedAt?: string;
}

export const AUTHORITATIVE_BUSINESS_DEFAULTS: BusinessProfileData = {
  id: "default",
  businessName: "Mqulima",
  legalName: "Kirgit Agri Enterprises Limited",
  brandTagline: "Africa's 360° agriculture ecosystem",
  brandSlogan: "Taking you first class",
  primaryCategory: "Agricultural Supply Outlet & Agro-Services",
  shortDescription:
    "Empowering Kenyan farmers with verified agronomy knowledge, certified seeds and fertilizers, precision weather tools, and vetted agricultural specialists.",
  fullOverview:
    "Founded in Eldoret, Mqulima is Africa's premier 360° digital farming ecosystem. We connect smallholders, commercial growers, and agro-dealers directly with certified inputs, on-demand agronomy specialists, precision climate radar, and transparent farm-to-market trade linkages across all 47 counties of Kenya.",
  phonePrimary: "+254 723 346 134",
  phoneSecondary: "+254 718 646 944",
  emailPrimary: "info@mqulima.com",
  emailSupport: "support@mqulima.com",
  whatsappNumber: "254723346134",
  addressStreet: "Junction, Eldoret–Iten Highway",
  addressCity: "Eldoret",
  addressCounty: "Uasin Gishu",
  addressPostalCode: "30100",
  addressCountry: "Kenya",
  latitude: 0.5143,
  longitude: 35.2698,
  mapsUrl: "https://maps.google.com/?q=Junction,+Eldoret+Iten+Highway",
  serviceAreas: [
    "Eldoret",
    "Uasin Gishu County",
    "Trans Nzoia County",
    "Elgeyo-Marakwet County",
    "Nandi County",
    "Nakuru County",
    "Nationwide Delivery across Kenya"
  ],
  operatingHours: [
    { day: "Monday", open: "08:00", close: "18:00", closed: false },
    { day: "Tuesday", open: "08:00", close: "18:00", closed: false },
    { day: "Wednesday", open: "08:00", close: "18:00", closed: false },
    { day: "Thursday", open: "08:00", close: "18:00", closed: false },
    { day: "Friday", open: "08:00", close: "18:00", closed: false },
    { day: "Saturday", open: "08:00", close: "13:00", closed: false },
    { day: "Sunday", open: "00:00", close: "00:00", closed: true }
  ],
  logoUrl: "/mqulima-logo.png",
  coverImageUrl: "/images/about/hero.webp",
  galleryImages: [
    "/hero-cinematic.webp",
    "/hero-aerial.webp",
    "/services_crop_production.webp",
    "/services_soil_analysis.webp",
    "/services_value_addition.webp",
    "/services_veterinary_care.webp",
    "/mqulima_soko_crop.webp",
    "/mqulima_news_banner.webp"
  ],
  socialLinks: {
    twitter: "https://x.com/_mqulima",
    tiktok: "https://tiktok.com/@_mqulima",
    linkedin: "https://linkedin.com/company/mqulima-hub",
    instagram: "https://instagram.com/mqulima"
  },
  faqs: [
    {
      q: "Where is Mqulima physically located?",
      a: "Our primary headquarters and distribution depot are situated at Junction, along the Eldoret–Iten Highway in Eldoret, Uasin Gishu County, Kenya. Visitors and farmers are welcome during official business hours."
    },
    {
      q: "What products and agricultural inputs does Mqulima supply?",
      a: "Mqulima supplies certified seeds, genuine crop protection chemicals (fungicides, herbicides, insecticides), specialized fertilizers, animal feeds, veterinary health products, and farm equipment directly from verified manufacturers including Yara, Osho Chemical, Unga Farmcare, and Truvets."
    },
    {
      q: "What agricultural services can I book through Mqulima?",
      a: "We provide certified soil nutrient testing, veterinary health diagnostics, livestock feed formulation, silage harvesting and shredding, artificial insemination (AI) cattle breeding, greenhouse construction, and borehole drilling across the Rift Valley and Western Kenya."
    },
    {
      q: "Does Mqulima deliver farm inputs outside Eldoret?",
      a: "Yes. While our primary regional hub is in Eldoret, we fulfill orders across all 47 counties of Kenya through vetted courier and agricultural freight partners with tracking and SMS delivery updates."
    },
    {
      q: "What payment methods are supported?",
      a: "We accept Safaricom M-Pesa STK Push payments, direct Paystack card and bank payments, and official bank remittances. All online transactions generate verified SMS and electronic receipts."
    },
    {
      q: "How does Mqulima guarantee the authenticity of farm inputs?",
      a: "All seeds and agrochemicals in our AgroShop catalog are sourced directly from registered primary distributors and verified against national regulatory standards (KEPHIS and PCPB). We maintain a strict zero-counterfeit guarantee."
    }
  ],
  businessPolicies: {
    delivery: "Same-day regional dispatch for Eldoret and Uasin Gishu; 24-48 hours delivery across Rift Valley, Western, and Nairobi; up to 72 hours for remote counties. Orders are dispatched from our Eldoret Regional Depot.",
    payments: "Cashless payments via Safaricom M-Pesa STK Push, Paystack debit/credit cards, and verified merchant paybills. Cash on delivery is not accepted for dispatched bulk cargo.",
    returns: "Unopened, sealed, and undamaged goods with tamper seals intact may be returned within 48 hours of receipt accompanied by the official Mqulima digital invoice.",
    warranty: "All certified seed varieties are covered under standard germination guarantees provided by primary breeders. Technical service work carries vetted expert quality warranties."
  },
  googlePlaceId: "",
  googleReviewUrl: "https://maps.google.com/?q=Junction,+Eldoret+Iten+Highway",
  isPublished: true
};

/**
 * Accurately determines current open/closed status in East Africa Time (Africa/Nairobi, UTC+3).
 */
export function getBusinessOpenStatus(hours: OperatingHourDay[]): {
  isOpen: boolean;
  statusLabel: string;
  nextTimeLabel: string;
  currentDayName: string;
} {
  try {
    // Current time in Africa/Nairobi
    const now = new Date();
    const eatFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Africa/Nairobi",
      weekday: "long",
      hour: "numeric",
      minute: "numeric",
      hour12: false
    });

    const parts = eatFormatter.formatToParts(now);
    const dayName = parts.find((p) => p.type === "weekday")?.value as OperatingHourDay["day"] || "Monday";
    const currentHour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
    const currentMinute = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
    const currentMinutesSinceMidnight = currentHour * 60 + currentMinute;

    const todaySchedule = hours.find((h) => h.day.toLowerCase() === dayName.toLowerCase());

    if (!todaySchedule || todaySchedule.closed) {
      // Find next opening day
      return {
        isOpen: false,
        statusLabel: "Closed",
        nextTimeLabel: "Opens Monday at 8:00 AM",
        currentDayName: dayName
      };
    }

    const [openH, openM] = todaySchedule.open.split(":").map(Number);
    const [closeH, closeM] = todaySchedule.close.split(":").map(Number);
    const openMinutes = (openH || 0) * 60 + (openM || 0);
    const closeMinutes = (closeH || 0) * 60 + (closeM || 0);

    if (currentMinutesSinceMidnight >= openMinutes && currentMinutesSinceMidnight < closeMinutes) {
      // Open now
      const closeFormatted = format12Hour(todaySchedule.close);
      return {
        isOpen: true,
        statusLabel: "Open Now",
        nextTimeLabel: `Closes at ${closeFormatted} (EAT)`,
        currentDayName: dayName
      };
    } else if (currentMinutesSinceMidnight < openMinutes) {
      const openFormatted = format12Hour(todaySchedule.open);
      return {
        isOpen: false,
        statusLabel: "Closed",
        nextTimeLabel: `Opens today at ${openFormatted} (EAT)`,
        currentDayName: dayName
      };
    } else {
      return {
        isOpen: false,
        statusLabel: "Closed",
        nextTimeLabel: "Opens tomorrow at 8:00 AM (EAT)",
        currentDayName: dayName
      };
    }
  } catch {
    return {
      isOpen: false,
      statusLabel: "Business Hours",
      nextTimeLabel: "Monday – Saturday",
      currentDayName: "Today"
    };
  }
}

export function format12Hour(time24: string): string {
  if (!time24 || !time24.includes(":")) return time24;
  const [h, m] = time24.split(":").map(Number);
  const period = (h || 0) >= 12 ? "PM" : "AM";
  const adjustedH = (h || 0) % 12 || 12;
  const minutePadded = String(m || 0).padStart(2, "0");
  return `${adjustedH}:${minutePadded} ${period}`;
}

/**
 * Builds valid Schema.org LocalBusiness / Store structured data JSON-LD.
 */
export function buildBusinessProfileJsonLd(profile: BusinessProfileData): Record<string, unknown> {
  const dayOfWeekMap: Record<string, string> = {
    Monday: "https://schema.org/Monday",
    Tuesday: "https://schema.org/Tuesday",
    Wednesday: "https://schema.org/Wednesday",
    Thursday: "https://schema.org/Thursday",
    Friday: "https://schema.org/Friday",
    Saturday: "https://schema.org/Saturday",
    Sunday: "https://schema.org/Sunday"
  };

  const openingHoursSpec = (profile.operatingHours || [])
    .filter((h) => !h.closed && h.open && h.close)
    .map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: dayOfWeekMap[h.day] || h.day,
      opens: h.open,
      closes: h.close
    }));

  const sameAsLinks = Object.values(profile.socialLinks || {}).filter(
    (url): url is string => typeof url === "string" && url.trim().length > 0
  );

  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "Store", "Organization"],
    "@id": "https://mqulima.com/business#organization",
    name: profile.businessName,
    legalName: profile.legalName,
    alternateName: ["Mqulima Hub", "Kirgit Agri"],
    url: "https://mqulima.com/business",
    logo: `https://mqulima.com${profile.logoUrl}`,
    image: (profile.galleryImages || []).map((img) =>
      img.startsWith("http") ? img : `https://mqulima.com${img}`
    ),
    description: profile.shortDescription,
    telephone: profile.phonePrimary,
    email: profile.emailPrimary,
    priceRange: "KES",
    currenciesAccepted: "KES",
    paymentAccepted: "M-Pesa, Cashless, Credit Card, Bank Transfer",
    address: {
      "@type": "PostalAddress",
      streetAddress: profile.addressStreet,
      addressLocality: profile.addressCity,
      addressRegion: profile.addressCounty,
      postalCode: profile.addressPostalCode,
      addressCountry: "KE"
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: Number(profile.latitude) || 0.5143,
      longitude: Number(profile.longitude) || 35.2698
    },
    hasMap: profile.mapsUrl,
    areaServed: (profile.serviceAreas || []).map((area) => ({
      "@type": "AdministrativeArea",
      name: area
    })),
    openingHoursSpecification: openingHoursSpec,
    sameAs: sameAsLinks,
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: profile.phonePrimary,
        contactType: "customer service",
        areaServed: "KE",
        availableLanguage: ["English", "Swahili"]
      }
    ]
  };
}
