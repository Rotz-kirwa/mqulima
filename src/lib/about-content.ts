export interface TeamMember {
  photoUrl: string;
  name: string;
  role: string;
  bio: string;
  linkedin: string;
}

export interface OpenRole {
  title: string;
  department: string;
  location: string;
  type: string;
  applyUrl: string;
}

export interface StatItem {
  value: number;
  label: string;
  subtext: string;
  prefix: string;
  suffix: string;
}

export interface RoadmapPhase {
  phase: string;
  label: string;
  title: string;
  body: string;
  isActive: boolean;
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    photoUrl: "/public/about/team-founder.jpg",
    name: "Brian Kiprono",
    role: "Founder & CEO",
    bio: "Spent 3 years working with smallholder farmers in Murang'a before building Mqulima.",
    linkedin: "https://linkedin.com",
  },
  {
    photoUrl: "/public/about/team-cto.jpg",
    name: "Faith Achieng",
    role: "Co-founder & CTO",
    bio: "Former software engineer at Safaricom. Writes code that runs on Tecno phones without crying.",
    linkedin: "https://linkedin.com",
  },
  {
    photoUrl: "/public/about/team-agronomy.jpg",
    name: "Dr. Samuel Mwangi",
    role: "Head of Agronomy",
    bio: "KARI-trained agronomist. Has forgotten more about soil than most people will ever know.",
    linkedin: "https://linkedin.com",
  },
  {
    photoUrl: "/public/about/team-community.jpg",
    name: "Lydia Wambui",
    role: "Community & Partnerships",
    bio: "Speaks to 40+ farmers every month. Builds relationships, not just user metrics.",
    linkedin: "https://linkedin.com",
  },
  {
    photoUrl: "/public/about/team-design.jpg",
    name: "Victor Kiprop",
    role: "Product & Design",
    bio: "Designs for the farmer who has never taken a UX course — and shouldn't need to.",
    linkedin: "https://linkedin.com",
  },
  {
    photoUrl: "/public/about/team-ops.jpg",
    name: "Mercy Kosgei",
    role: "Operations & Logistics",
    bio: "Makes sure products that are ordered actually arrive. Harder than it sounds in remote areas.",
    linkedin: "https://linkedin.com",
  },
];

export const OPEN_ROLES: OpenRole[] = [
  {
    title: "Full-Stack Engineer (Next.js + Supabase)",
    department: "Engineering",
    location: "Nairobi / Remote",
    type: "Full-time",
    applyUrl: "mailto:careers@mqulima.com?subject=Application%20for%20Full-Stack%20Engineer",
  },
  {
    title: "Field Agronomist (Rift Valley)",
    department: "Agronomy",
    location: "On-site, Nakuru",
    type: "Full-time",
    applyUrl: "mailto:careers@mqulima.com?subject=Application%20for%20Field%20Agronomist",
  },
  {
    title: "UX Designer (Mobile-first)",
    department: "Design",
    location: "Remote",
    type: "Full-time",
    applyUrl: "mailto:careers@mqulima.com?subject=Application%20for%20UX%20Designer",
  },
  {
    title: "Partnerships Associate (Kenyan Markets)",
    department: "Business",
    location: "Nairobi",
    type: "Full-time",
    applyUrl: "mailto:careers@mqulima.com?subject=Application%20for%20Partnerships%20Associate",
  },
];

export const STATS: StatItem[] = [
  {
    value: 2412,
    label: "Farmers on platform",
    subtext: "Across different regions of Kenya",
    prefix: "",
    suffix: "+",
  },
  {
    value: 4200000,
    label: "Farmer earnings facilitated",
    subtext: "Through the Mqulima marketplace",
    prefix: "KSh ",
    suffix: "",
  },
  {
    value: 38,
    label: "Courses published",
    subtext: "By 12 verified agricultural experts",
    prefix: "",
    suffix: "",
  },
  {
    value: 6,
    label: "Counties reached",
    subtext: "Murang'a, Kiambu, Nakuru, Meru, Kisumu, Mombasa",
    prefix: "",
    suffix: "",
  },
];

export const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    phase: "Phase 1",
    label: "2024 — Live",
    title: "E-commerce + Academy",
    body: "Shop for agri-inputs. Learn from experts. Pay with M-Pesa. Available in Kenya.",
    isActive: true,
  },
  {
    phase: "Phase 2",
    label: "2025 — Building",
    title: "Community + Services",
    body: "Farmer forum. Vet services booking. Agronomist consultations on-demand.",
    isActive: false,
  },
  {
    phase: "Phase 3",
    label: "2026 — Planned",
    title: "Direct Market Access",
    body: "Connect farmers directly to supermarkets, restaurants, and export buyers. No middlemen.",
    isActive: false,
  },
  {
    phase: "Phase 4",
    label: "2027+ — Vision",
    title: "National Expansion",
    body: "Scaling to cover all 47 counties. One platform for Kenyan agriculture.",
    isActive: false,
  },
];
