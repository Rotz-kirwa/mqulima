// Mkulima Services Platform - Production Hardened (Zero Price Tag UI)
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createServiceBooking, getServiceCategoriesWithServices } from "@/lib/api/services.server";
import { getCsrfTokenFromCookie } from "@/lib/csrf-client";
import { 
  Check, 
  ArrowRight, 
  Calendar, 
  Phone, 
  ShieldCheck, 
  Clock, 
  CheckCircle, 
  Star, 
  MessageSquare, 
  AlertTriangle,  
  Sliders, 
  Droplet, 
  Activity, 
  Truck, 
  FileText, 
  Coins,
  Sprout,
  Database,
  User,
  Wrench,
  MapPin,
  Heart,
  Search,
  Sparkles,
  Filter,
  RotateCcw,
  Compass,
  ArrowUpRight,
  Sun,
  Layers,
  Factory,
  Stethoscope,
  Tractor,
  Wheat,
  X,
  MessageCircle,
  TrendingUp,
  Warehouse,
  Building,
  BookOpen,
  UserCheck,
  ChevronDown,
  Mail
} from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { motion, AnimatePresence } from "framer-motion";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { ServicesSkeleton } from "@/components/mqulima/RouteSkeletons";

type ServicesSearch = {
  serviceId?: string;
  category?: string;
};

export const Route = createFileRoute("/services")({
  pendingComponent: ServicesSkeleton,
  validateSearch: (search: Record<string, unknown>): ServicesSearch => {
    return {
      serviceId: (search.serviceId as string) || undefined,
      category: (search.category as string) || undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Services — Professional Agricultural Support & Specialists | Mqulima" },
      {
        name: "description",
        content: "Book vetted agricultural professionals across Kenya: soil testing, veterinary diagnostics, silage shredding, AI breeding, greenhouses, and borehole drilling.",
      },
      { property: "og:title", content: "Services — Professional Agricultural Support & Specialists | Mqulima" },
      {
        property: "og:description",
        content: "Book vetted agricultural professionals across Kenya: soil testing, veterinary diagnostics, silage shredding, AI breeding, greenhouses, and borehole drilling.",
      },
      { property: "og:url", content: "https://www.mqulima.com/services" },
      { property: "og:image", content: "https://www.mqulima.com/images/mkulima_hero_farm.webp" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Services — Professional Agricultural Support & Specialists | Mqulima" },
      {
        name: "twitter:description",
        content: "Book vetted agricultural professionals across Kenya: soil testing, veterinary diagnostics, silage shredding, AI breeding, greenhouses, and borehole drilling.",
      },
      { name: "twitter:image", content: "https://www.mqulima.com/images/mkulima_hero_farm.webp" },
    ],
    links: [
      { rel: "canonical", href: "https://www.mqulima.com/services" },
      {
        rel: "preload",
        as: "image",
        href: "/images/self-hosted/farm-field-banner-640w.webp",
        type: "image/webp",
        fetchPriority: "high",
      },
    ],
  }),
  component: ServicesPage,
});

const SERVICES_HERO_STATS = [
  { icon: User, value: "2,400+", label: "Farmers served" },
  { icon: Sprout, value: "30+", label: "Specialist services" },
  { icon: MapPin, value: "47", label: "Counties covered" },
  { icon: Phone, value: "< 10 mins", label: "Average response" },
];

// Category & Subservice data definitions matching Mqulima Detailed Services & Tools Specifications
export interface SubserviceConfig {
  id: string;
  name: string;
  description: string;
  estimatedCost: string;
  image: string;
  action1Text: string;
  action2Text?: string;
  icon?: React.ComponentType<any>;
}

export interface ServiceCategoryConfig {
  id: string;
  part: number;
  title: string;
  servicesCountText: string;
  count: number;
  description: string;
  image: string;
  icon: React.ComponentType<any>;
  checklist: string[];
  action1Text: string;
  action2Text?: string;
  bookingButtonText?: string;
  subservices: SubserviceConfig[];
}

export interface ToolConfig {
  id: string;
  number: number;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  action1Text: string;
  action2Text?: string;
}

const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

function toRoman(num: number): string {
  return ROMAN_NUMERALS[num - 1] || String(num);
}

const CATEGORIES_CONFIG: ServiceCategoryConfig[] = [
  {
    id: "finance_insurance",
    part: 1,
    title: "Finance & Insurance",
    servicesCountText: "3 services",
    count: 3,
    description: "We understand that money determines whether you’ll succeed or fail. We know that every planting season costs money in the form of seed, land preparation, labour and inputs. We also understand that money has to come from somewhere long before the harvest. At the same time bad seasons happen. Floods, fire, heavy rainfall, disease outbreak can wipe all the work you have done. Many farmers carry that risk entirely alone, with nowhere to turn when it happens. You need insurance to guard your farm and yourself. Mqulima's Finance & Insurance services connect you to credit built around the farming calendar, not a bank's convenience, and insurance that actually understands what a farmer does and what he stands to lose. Whether you need capital to get a season moving or protection so one disaster doesn't wipe out three good years, it's a request away. Explore Finance & Insurance and put your next season on steadier ground.",
    image: "/images/services/finance_insurance_cat.webp",
    icon: Coins,
    checklist: [
      "Agri loans & Credit",
      "Agri insurance",
      "Financial advisory"
    ],
    action1Text: "get financed",
    bookingButtonText: "Get Financed",
    subservices: [
      {
        id: "agri_loans_credit",
        name: "Agri loans & Credit",
        description: "Preparing land, buying seeds, fertilizer and labor all need MONEY before a single crop or animal is ready to sell. The gap between planting and harvest is where many good farming plans quietly stall, not for lack of skill, but for lack of capital at the right moment. Ordinary loans rarely understand that a farmer's income doesn't arrive monthly; it arrives once, at harvest, and everything before that is an investment on faith. We understand that you don’t harvest every month, it comes once, twice or thrice in a year. Mqulima connects you to agricultural credit structured around your rhythm and around the number of harvests you have. We connect you to funds sized to your farm, timed to your season, and disbursed without the long wait that ordinary lending puts you through. Request Agri Loans & Credit today, and get your season moving before the planting window closes.",
        estimatedCost: "Custom Credit",
        image: "/images/services/agri_loans_credit.webp",
        icon: Coins,
        action1Text: "Get Financed",
        action2Text: "Remind me"
      },
      {
        id: "agri_insurance",
        name: "Agri insurance",
        description: "Sometimes drought, fires, floods, disease, pests and theft happen. A farmer carries deadly risks in a season and yet most farms in Kenya still operate with absolutely nothing to fall back on when disaster strikes. When a disaster happens, it isn't just the season's income that's lost; it's next season's seed money too. Mqulima Agri Insurance protects your crop, your livestock, and the investment you've already put into the ground, so that one bad season doesn't have the power to undo several good ones. Cover is matched to what you actually grow or keep, not a generic policy that misses the point. You can get more information by consulting Mqulima Agro-insurance expert via mqulima@mqulima.com, phone call at 0723346134, whatsapp @mqulima or 0723346134 or on all our Social Channels.",
        estimatedCost: "Tailored Premium",
        image: "/images/services/agri_insurance.webp",
        icon: ShieldCheck,
        action1Text: "Get Quote",
        action2Text: "Consult an expert"
      },
      {
        id: "financial_advisory",
        name: "Financial advisory",
        description: "We understand that financial independence is the ultimate goal. We also know that income doesn't always translate into wealth. Without a proper financial knowledge and planning for what comes in and what goes out, even the strong harvest can quietly slip through a farmer's fingers by the next planting season. Most farmers never get the chance to sit with someone who actually understands both farming and money, because that kind of guidance has historically lived far from the farm. Mqulima's Financial Advisory service puts financial guidance within reach. We give real advice on managing, saving, and growing the money your farm earns. We understand both agriculture and money. Request Financial Advisory, and make every shilling your farm earns work as hard as you did to earn it.",
        estimatedCost: "Advisory Session",
        image: "/images/self-hosted/service-business-planning.webp",
        icon: TrendingUp,
        action1Text: "Consult an Expert",
        action2Text: "Visit Academy"
      }
    ]
  },
  {
    id: "soil_services",
    part: 2,
    title: "Soil services",
    servicesCountText: "3 services",
    count: 3,
    description: "Every strong harvest starts with soil a farmer actually understands, yet most planting decisions in Kenya are still made on guesswork. We use the same fertilizer, the same routine, season after season, regardless of what the land actually needs and expect different results. Soil that's tired, acidic, or missing key nutrients quietly caps your yield long before anything. Every farmer needs to take charge of their affairs by knowing what their farm lacks, what it needs and what will grow best. Mqulima's Soil Services bring soil testing, soil treatment and fertilizer recommendation to your farm, so every input you buy and every season you plant is based on what your land requires, not out of guesswork. Explore Soil Services and start growing from a plan instead of a guess.",
    image: "/images/services/soil.webp",
    icon: Sprout,
    checklist: [
      "Soil testing and analysis",
      "Soil treatment",
      "Fertilizer recommendation"
    ],
    action1Text: "View Services",
    bookingButtonText: "Soil Testing",
    subservices: [
      {
        id: "soil_testing_analysis",
        name: "Soil testing and analysis",
        description: "You can't fix what you can't see. Most soil problems- low nitrogen, wrong pH, missing micronutrients are invisible until the crop is wilting, underperforming or struggling. Farmers who skip testing often spend a whole season fighting a problem soil testing and fertilizer recommendation could have solved from day one. Mqulima connects you to professional soil testing and analysis, with results explained in plain language, not a lab report you need a degree to understand. Request Soil Testing and Analysis, and know exactly what your land needs before you spend a single shilling on inputs.",
        estimatedCost: "On Request",
        image: "/images/services/soil_testing_analysis.webp",
        icon: Sprout,
        action1Text: "Get Your soil tested",
        action2Text: "remind me"
      },
      {
        id: "soil_treatment",
        name: "Soil treatment",
        description: "A soil test only matters if something is actually done with the results and correcting soil imbalances such as acidity, poor structure, or nutrient depletion is a job most farmers have never had proper support for. If left untreated, tired soil keeps yields low no matter how good the seed or how hard the season's rain. Mqulima's Soil Treatment service takes your test results and turns them into an actual action plan, delivered and applied by people who know how to fix what's wrong, not just diagnose it. Request Soil Treatment, and give your land the chance to perform the way it's supposed to.",
        estimatedCost: "On Request",
        image: "/images/services/soil_treatment.webp",
        icon: Sprout,
        action1Text: "Get Soil treatment",
        action2Text: "Get advised"
      },
      {
        id: "fertilizer_recommendation",
        name: "Fertilizer recommendation",
        description: "Buying fertiliser without knowing exactly what your soil and your crop needs is one of the most common and most expensive mistakes in Kenyan farming, with many farmers overspending on nutrients their land already has plenty of, while missing the one it's actually short on. Mqulima's Fertiliser Recommendation service matches the right plant, in the right quantity, and correct timing precisely to your soil and your crop, based on real data rather than what the shop down the road happens to be selling. Request a Fertilizer Recommendation, and stop paying for inputs your land doesn't even need.",
        estimatedCost: "On Request",
        image: "/images/services/fertilizer_recommendation.webp",
        icon: Wheat,
        action1Text: "Get recommendation",
        action2Text: "Fertilizer Academy"
      }
    ]
  },
  {
    id: "crop_services",
    part: 3,
    title: "Crop services",
    servicesCountText: "6 services",
    count: 6,
    description: "From the land you farm on to the market you eventually sell into, growing a crop successfully involves far more than planting seed and waiting. It involves getting the land, the right machinery, proper storage, transport, and expert guidance. They all have to come together at the right moment. Mqulima's Crop Services bring all these services together, in one place. You get access to land, machinery, storage, transport and agronomy support so that your harvest doesn't fail for lack of the right support at the right time. Whatever stage of farming you are at, we make sure that whatever service you need, you get it. Because we understand that your crops won’t wait. Explore Crop Services and get every stage of your crop's journey covered in one place.",
    image: "/images/services/crop_services_cat.webp",
    icon: Tractor,
    checklist: [
      "Lease land",
      "Rent machinery",
      "Warehousing and Cold storage",
      "Transportation",
      "Greenhouse",
      "Consult an Agronomist"
    ],
    action1Text: "View plant services",
    bookingButtonText: "Book Service",
    subservices: [
      {
        id: "lease_land",
        name: "Lease land",
        description: "Not every farmer with the skill and ambition to grow has the land to grow crops or rear animals. In Kenya, finding land to lease has traditionally meant relying on word of mouth, uncertain terms, and a fair amount of luck. But the land exists, what doesn’t exist is the information about where and who has the land. We bridge this gap by bringing landowners and farmers into one marketplace. Mqulima's Lease Land service connects you to verified farmland available for lease where you need to farm, with clear terms from the start, so expanding your production doesn't depend on who you happen to know. Request Lease Land, and grow your operation on your own terms.",
        estimatedCost: "Per Acre / Season",
        image: "/images/services/lease_land.webp",
        icon: MapPin,
        action1Text: "Request available lands",
        action2Text: "Inquire on WhatsApp"
      },
      {
        id: "rent_machinery",
        name: "Rent machinery",
        description: "We understand that owning a tractor, a silage chopper, or a harvester is out of reach for most smallholder farmers in the agriculture industry. We also know that doing everything by hand is impossible. It costs more money, take more time, poor performance and ultimately yield less. Modern farming needs to be done quickly and affrodably. Mqulima's Rent Machinery service puts the right equipment within reach exactly when your farm needs it, without the cost of owning and maintaining it year-round. Request Machinery, and get the job done on time, every season.",
        estimatedCost: "Per Acre / Hour",
        image: "/images/services/rent_machinery.webp",
        icon: Tractor,
        action1Text: "rent machinery",
        action2Text: "place request"
      },
      {
        id: "warehousing_cold_storage",
        name: "Warehousing and Cold storage",
        description: "A harvest that isn't stored properly starts losing value the moment it leaves the field to pests, moisture, and spoilage. This forces farmers to sell quickly and cheaply simply because they have nowhere safe to keep produce while waiting for a better price. Mqulima's Warehousing and Cold Storage service gives your harvest a safe place where your produce can wait for better prices and get protected from loss, so you can sell on your own schedule instead of out of urgency. Request Storage, and hold onto the value of your harvest for as long as you need to.",
        estimatedCost: "Per Crate / Month",
        image: "/images/services/warehousing_cold_storage.webp",
        icon: Warehouse,
        action1Text: "get warehouse space",
        action2Text: "cold storage"
      },
      {
        id: "transportation",
        name: "Transportation",
        description: "Unreliable transport remains one of the most common reasons farm produce is lost or sold at a loss along the way. Farmer’s sell to middlemen at throw away prices because they have no means to getting to the market. Getting to the market doesn’t require a lorry or a pickup only. It requires reliable, scheduled farm logistics. Mqulima's Transportation service moves your produce from farm to market reliably and on time, connecting you to trusted transporters instead of leaving you to negotiate with whoever happens to be passing. Request Transportation, and stop letting distance decide your harvest's fate.",
        estimatedCost: "Per Trip / Ton",
        image: "/images/services/transportation.webp",
        icon: Truck,
        action1Text: "get transport services"
      },
      {
        id: "greenhouse",
        name: "Greenhouse",
        description: "Open-field farming leaves your crop exposed to everything the weather decides to throw at it unpredictable rain, pests, extreme heat often shortening the growing season and capping how much you can actually produce. Mqulima's Greenhouse service connects you to greenhouse solutions that extend your growing season and protect your crop from the unpredictable, letting you plan production with far more confidence. Request Greenhouse Solutions, and grow more, more consistently, regardless of what the season outside is doing.",
        estimatedCost: "Turnkey Package",
        image: "/images/services/greenhouse.webp",
        icon: Sprout,
        action1Text: "get quote",
        action2Text: "know more"
      },
      {
        id: "consult_agronomist",
        name: "Consult an Agronomist",
        description: "Every crop, soil type and season comes with its own set of decisions, and you need to get them right. The wrong planting time, the wrong spacing, a pest problem caught too late or the wrong pesticide can quietly cost a farmer the whole season's potential. Mqulima connects you directly to qualified agronomists who can guide your specific farm, not generic advice pulled from somewhere else. Request an Agronomist Consultation, and make every major planting decision an informed one.",
        estimatedCost: "On Request",
        image: "/images/services/consult_agronomist.webp",
        icon: UserCheck,
        action1Text: "Consult agronomist"
      }
    ]
  },
  {
    id: "animal_health_services",
    part: 4,
    title: "Animal & Health services",
    servicesCountText: "3 services",
    count: 3,
    description: "A healthy herd is the foundation of everything a livestock farmer earns. Veterinary support in many parts of Kenya remains hard to reach exactly when it's needed most, often arriving too late to save an animal or a season's income. Farmers lose animals without establishing the cause of the loss to avert future losses. This needs to change. Mqulima's Animal & Health Services connect you to breeding, diagnosis, treatment and vaccination support and all other animal care services so your herd's health is planned, not gambled. Explore Animal & Health Services and give your livestock the care that protects your income too.",
    image: "/images/services/veterinary.webp",
    icon: Stethoscope,
    checklist: [
      "AI & Breeding",
      "Veterinary Diagnosis & Treatment",
      "Vaccination"
    ],
    action1Text: "animal services",
    bookingButtonText: "Book Vet",
    subservices: [
      {
        id: "ai_breeding",
        name: "AI & Breeding",
        description: "Poor genetics quietly limit a herd's productivity for generations, yet access to quality artificial insemination and breeding expertise has historically been out of reach for many smallholder livestock keepers. To produce better, you need to breed better and to have better breeds, you need someone who know more about livestock breeding. Mqulima's AI & Breeding service connects you to professional breeding support that improves your herd's genetics and productivity, one generation at a time. Request AI & Breeding, and start building a stronger herd today, not just a bigger one.",
        estimatedCost: "Per Insemination",
        image: "/images/services/ai_breeding.webp",
        icon: Activity,
        action1Text: "ai services",
        action2Text: "breeding services"
      },
      {
        id: "veterinary_diagnosis_treatment",
        name: "Veterinary Diagnosis & Treatment",
        description: "Livestock is a huge investment. When an animal falls sick, every hour of delay narrows the chances of a full recovery, yet finding a qualified vet quickly remains one of the biggest frustrations for livestock farmers across the country. A farmer nolonger needs to make a million phone calls looking for a Vet and lose the animal in the long run. Mqulima makes sure your animal is attended to on time and professionally. Mqulima's Veterinary Diagnosis & Treatment service connects you to professional care fast, so a sick animal gets the right diagnosis and treatment before a small problem becomes a costly loss. Request Veterinary Care, and give your animals the timely attention they need.",
        estimatedCost: "Clinical Visit",
        image: "/images/services/veterinary_diagnosis_treatment.webp",
        icon: Stethoscope,
        action1Text: "request veterinary service",
        action2Text: "consult a vet"
      },
      {
        id: "vaccination",
        name: "Vaccination",
        description: "Diseases like Rift Valley Fever, foot-and-mouth, and other preventable outbreaks can wipe out a herd of livestock income in a matter of days, yet vaccination is still treated as optional by many farmers simply because access is inconsistent. Farmers should be at the front row fighting preventable losses through vaccination. Mqulima's Vaccination service brings professional and on-demand vaccination directly to your herd, protecting your animals against any preventable diseases and outbreaks. Request Vaccination, because prevention will always cost less than the loss it prevents.",
        estimatedCost: "Per Herd / Head",
        image: "/images/self-hosted/service-livestock-vet.webp",
        icon: ShieldCheck,
        action1Text: "get vaccination service",
        action2Text: "download flier"
      }
    ]
  },
  {
    id: "animal_nutrition",
    part: 5,
    title: "Animal Nutrition",
    servicesCountText: "4 services",
    count: 4,
    description: "What an animal eats determines what it gives back. Whether it’s milk, weight, egss or the offspring, all depends on what you feed the animal. However, most farmers overlook the quality of their feeds and don’t plan their feeding. This remains major parts that reduce the volume and quality of the produce a farmer gets. A farmer should do proper planning not relying on whatever pasture happens to be available that day. Mqulima's Animal Nutrition services help you formulate, source and manage the right feed for your herd's actual needs, at any scale. Explore Animal Nutrition, and stop leaving your herd's output up to chance.",
    image: "/images/services/animal_feeds.webp",
    icon: Wheat,
    checklist: [
      "Feed formulation",
      "Silage shredding and packing",
      "Buy/Rent machinery",
      "Advisory"
    ],
    action1Text: "animal nutrition",
    action2Text: "visit nutrition academy",
    bookingButtonText: "Nutrition Support",
    subservices: [
      {
        id: "feed_formulation",
        name: "Feed formulation",
        description: "Generic feed rarely matches what a specific herd actually needs at a specific stage of growth or production. This quietly limits your milk yield, beef quality, weight gain, or breeding performance without the farmer ever knowing why. Mqulima's Feed Formulation service designs feed precisely around your animals' needs and your production goals, backed by real nutritional guidance. Our experts carefully examine the stage of production, the nutritional need and give the best feed formula. Don’t rely on guesswork, make sure you are doing the right thing. Request Feed Formulation, and turn better nutrition into better, more predictable output.",
        estimatedCost: "Formulation Plan",
        image: "/images/services/feed_formulation.webp",
        icon: Wheat,
        action1Text: "request service",
        action2Text: "nutrition academy"
      },
      {
        id: "silage_shredding_packing",
        name: "Silage shredding and packing",
        description: "Good fodder is abundant in the rainy season andnowhere to be seen whe the rains stop. Without proper preservation, farmers watch a season of good grass go to waste just months before they need it most. At times, farmers see their feed go to waste because they have no way of preserving them. At Mqulima, we are changing this because we understand that all seasons are not the same. Farmers need to store their feeds for the seasons that are not very good. Mqulima's Silage Shredding and Packing service helps you preserve quality feed for the lean months ahead, so a good harvest of fodder doesn't disappear before it's needed. We cut, chop and pack your fodder, ready for your storage. Request Silage Services, and never let good grass go to waste again.",
        estimatedCost: "Per Ton / Bale",
        image: "/images/services/silage.webp",
        icon: Layers,
        action1Text: "request service",
        action2Text: "enquire"
      },
      {
        id: "buy_rent_machinery_feed",
        name: "Buy/Rent machinery",
        description: "Producing feed at scale requires you to use machinery. Work like chopping fodder, mixing feeds or packing the feeds requires equipment most livestock farmers don’t own and don’t have the financial ability to own them. Depending on a neighbour is an unreliable affair. Mqulima was built to relieve the farmer of the endless hassle looking for farm machinery. All you need at any stage of your production, is a few taps away. Mqulima's Rent Machinery service gives you access to the equipment behind efficient feed production, without the cost of owning or maintaining it. Whenever you need it in your farm, you just tap and get it working on your farm. Request Machinery Access, and scale your feed production without the capital burden of ownership.",
        estimatedCost: "Daily / Weekly",
        image: "/images/services/machinery_rental.webp",
        icon: Wrench,
        action1Text: "rent machinery",
        action2Text: "buy machinery"
      },
      {
        id: "animal_nutrition_advisory",
        name: "Advisory",
        description: "Even good feed can be poorly used without the right plan. Farmers often over- or under-feed, wrong timing, or feed unbalanced ration which can quietly undercut a herd's performance despite good intentions. Mqulima's Animal Nutrition Advisory connects you to expert guidance matched to your herd size, goals and budget, so every feeding decision is a deliberate one. Request Nutrition Advisory, and get a plan built around your actual herd, not a generic formula.",
        estimatedCost: "On Request",
        image: "/images/services/feed_advice.webp",
        icon: MessageSquare,
        action1Text: "consult expert"
      }
    ]
  },
  {
    id: "irrigation_services",
    part: 6,
    title: "Irrigation services",
    servicesCountText: "4 services",
    count: 4,
    description: "Rain-fed farming is slowly becoming a thing of the past. It means a farmer's entire season depends on rain and praying that the rain stops when it’s too much. This is something that’s completely outside their control. When the rains fails, arrives at the wrong time or rains too much, then the harvest will never come regardless of how well everything else was done. Everything depends on the rain. Mqulima's Irrigation Services connect you to borehole drilling, irrigation system design, laying of irrigation systems and water engineering expertise. This ensures your farm's water supply becomes a plan instead of a prayer. Explore Irrigation Services, and stop letting the rains decide your season alone.",
    image: "/images/services/irrigation.webp",
    icon: Droplet,
    checklist: [
      "Borehole sinking",
      "Irrigation & irrigation systems",
      "Water engineering",
      "Consult an irrigation expert"
    ],
    action1Text: "view services",
    action2Text: "irrigation academy",
    bookingButtonText: "Irrigation Support",
    subservices: [
      {
        id: "borehole_sinking",
        name: "Borehole sinking",
        description: "Depending entirely on rainfall means every dry spell puts your entire crop at risk, and by the time the ground visibly cracks, it's usually too late to do anything about it that season. Every farmer needs to take charge of their farming by drilling their borehole. By drilling a borehole, you get to decide when to plant, not planting because the rain is almost falling. Mqulima's Borehole Sinking service connects you to professional drilling that secures a reliable water source for your farm, built to last a lifetime and affordably. Request Borehole Sinking, and stop depending entirely on the rains to decide your outcome.",
        estimatedCost: "Survey & Sinking",
        image: "/images/services/borehole_sinking.webp",
        icon: Droplet,
        action1Text: "Get quote",
        action2Text: "Remind me"
      },
      {
        id: "irrigation_irrigation_systems",
        name: "Irrigation & irrigation systems",
        description: "Even with water available, delivering it efficiently to a crop — without waste, without drowning some plants while others go dry requires a properly designed system, not a hose and a good guess. Mqulima goes beyond guiding you to ensure that water is drawn from the river, lake, borehole or the dam all the way to the farm and properly connected to the plants, without a waste or damage to the crops. Mqulima's Irrigation & Irrigation Systems service designs and installs irrigation matched to your specific land and crop, so water reaches exactly where and when it's needed. Request Irrigation Systems, and turn consistent water into consistent yields.",
        estimatedCost: "Per Acre Setup",
        image: "/images/services/irrigation_systems.webp",
        icon: Droplet,
        action1Text: "Get quote",
        action2Text: "Remind me"
      },
      {
        id: "water_engineering",
        name: "Water engineering",
        description: "Water infrastructure need to be properly planned. The wrong pump, badly routed pipes, an unreliable source tends to fail exactly when a farmer can least afford it, often costing more in repeated fixes than proper engineering would have from the start. Mqulima's Water Engineering service connects you to professional expertise for water systems built to serve your farm reliably, for years, not just one good season. Water engineering services let’s you focus on important issues because the water lines have been done well. Request Water Engineering, and build water infrastructure that's built to last.",
        estimatedCost: "Engineering Assessment",
        image: "/images/services/water_engineering.webp",
        icon: Wrench,
        action1Text: "hire engineer",
        action2Text: "get quote"
      },
      {
        id: "consult_irrigation_expert",
        name: "Consult an irrigation expert",
        description: "Choose the right irrigation approach for your land, your crop, and within your budget. You don’t need to make an expensive mistake to discover after the investment is already in the ground. Mqulima connects you to irrigation experts who can guide that decision before you commit a single shilling, matching the right approach to your specific farm. Request an Irrigation Consultation, and invest in water with confidence, not guesswork.",
        estimatedCost: "On Request",
        image: "/images/services/consult_irrigation_expert.webp",
        icon: UserCheck,
        action1Text: "ask an expert"
      }
    ]
  },
  {
    id: "value_addition",
    part: 7,
    title: "Value Addition",
    servicesCountText: "2 services",
    count: 2,
    description: "Raw produce sold straight off the farm almost always earns the lowest possible price, while the same produce, processed and packaged, can be worth several times more. However, this is a gap most smallholder farmers never get the chance to close. Value addition is essential to get better prices, better value for money and tilt the scales in your favour. Mqulima's Value Addition services teach and support you in turning raw harvest into higher-value products. We guide and help you to keep more of the value on your side of the transaction. Explore Value Addition, and stop selling your harvest at its lowest possible price.",
    image: "/images/services/value_addition.webp",
    icon: Factory,
    checklist: [
      "Get Coaching",
      "Learn Value addition"
    ],
    action1Text: "browse services",
    action2Text: "Value addition academy",
    bookingButtonText: "Value Coaching",
    subservices: [
      {
        id: "get_coaching",
        name: "Get Coaching",
        description: "You might know that value addition is profitable but you don’t know how to do it well. Most farmers have never had access to someone who's done it successfully themselves. To start adding value to anything, you need the knowledge and experience of doing the value addition. Mqulima connects you to experts inn value addition so that you can kick off and become successful in adding value. Mqulima's Get Coaching service connects you directly with professionals who can guide you through turning raw produce into a more profitable product, step by step. Request Coaching, and learn value addition from people who've actually done it.",
        estimatedCost: "Coaching Sessions",
        image: "/images/services/get_coaching.webp",
        icon: UserCheck,
        action1Text: "ask an expert"
      },
      {
        id: "learn_value_addition",
        name: "Learn Value addition",
        description: "Processing, packaging and positioning a product for a better price all require specific knowledge that isn't taught in most farming communities, leaving a lot of potential value sitting untapped on the farm. Mqulima's Learn Value Addition resources give you structured, practical knowledge on processing and packaging your produce for higher returns, at your own pace. Explore Value Addition Learning, and start turning knowledge into extra income.",
        estimatedCost: "Academy Access",
        image: "/images/services/learn_value_addition.webp",
        icon: BookOpen,
        action1Text: "Visit Academy",
        action2Text: "Go back"
      }
    ]
  },
  {
    id: "important_services",
    part: 8,
    title: "Important Services",
    servicesCountText: "4 services",
    count: 4,
    description: "Not every essential need on a farm fit neatly into one category, but from infrastructure to innovation, these are the services that quietly determine whether an operation thrives or simply survives. Mqulima's Important Services bring these essential but often hard-to-find needs within easy reach, whatever they happen to be. Explore Important Services, and cover the gaps other categories don't.",
    image: "/images/services/other_services.webp",
    icon: Wrench,
    checklist: [
      "Shed Construction",
      "Climate Smart Agriculture",
      "Buy machinery",
      "Incubation"
    ],
    action1Text: "see services",
    bookingButtonText: "Book Service",
    subservices: [
      {
        id: "shed_construction",
        name: "Shed Construction",
        description: "Properly built animal structures are a secret ingredient to increased production. Poorly built storage, livestock houses, or processing sheds cost farmers dearly in losses. Losses to weather, pests, and spoilage. This is often because proper construction support was simply never accessible. Mqulima's Shed Construction service connects you to professional builders who understand exactly what a farm structure needs to do its job well. Request Shed Construction, and build infrastructure that protects what you've worked hard to produce.",
        estimatedCost: "Per Structure",
        image: "/images/services/shed_construction.webp",
        icon: Building,
        action1Text: "construct shed"
      },
      {
        id: "climate_smart_agriculture",
        name: "Climate Smart Agriculture",
        description: "Kenya's weather has grown less predictable by the season, and farming methods that worked reliably a decade ago increasingly leave farmers exposed to droughts, floods, and everything in between. Mqulima's Climate Smart Agriculture service connects you to practices and expertise that help your farm stay productive and resilient as the climate around it keeps changing. Request Climate Smart Guidance, and farm for the weather that's actually coming, not the one you're used to.",
        estimatedCost: "Advisory Protocol",
        image: "/images/services/crop_production.webp",
        icon: Sun,
        action1Text: "Learn Climate Smart Agriculture",
        action2Text: "Consult an Expert"
      },
      {
        id: "buy_machinery",
        name: "Buy machinery",
        description: "Manual farming methods cap how much a farm can produce, yet mechanisation has historically felt out of reach for smallholders without the capital to buy equipment outright. You don’t need the biggest tractor, but you need your farm mechanized. Mqulima is your plug to making work easier in your farm. Mqulima's Buy Machinery service gives you access to agricultural machinery that moves your operation from manual effort toward genuine mechanised efficiency. Request Machinery, and scale your production without waiting to save for it alone.",
        estimatedCost: "Market Price",
        image: "/images/services/buy_machinery.webp",
        icon: Tractor,
        action1Text: "browse listings",
        action2Text: "rent instead"
      },
      {
        id: "incubation",
        name: "Incubation",
        description: "A promising agricultural idea often stalls not for lack of potential, but for lack of the structured support needed to turn it into an actual, functioning business. Mqulima's Incubation service gives agricultural entrepreneurs the structured guidance needed to take an idea from concept to a real enterprise. Request Incubation Support, and get the support your idea needs to actually get off the ground.",
        estimatedCost: "Cohort Program",
        image: "/images/services/incubation.webp",
        icon: Sparkles,
        action1Text: "incubation services"
      }
    ]
  }
];

const CATEGORY_FILTERS = [
  { id: "all", label: "All Categories (8)" },
  { id: "finance", label: "01. Finance & Insurance (3)" },
  { id: "soil", label: "02. Soil Services (3)" },
  { id: "crop", label: "03. Crop Services (6)" },
  { id: "health", label: "04. Animal & Health (3)" },
  { id: "nutrition", label: "05. Animal Nutrition (4)" },
  { id: "irrigation", label: "06. Irrigation Services (4)" },
  { id: "value", label: "07. Value Addition (2)" },
  { id: "important", label: "08. Important Services (4)" },
];

const TOOLS_CONFIG: ToolConfig[] = [
  {
    id: "live_markets",
    number: 38,
    name: "Live Markets",
    description: "Selling blindly without knowing what your produce is actually fetching in the market puts farmers at the mercy of whoever happens to be buying that day. They often sell for far less than fair value. Mqulima Live Markets shows you real-time prices across markets before you sell or buy, so every transaction is made with full information. Try Live Markets, and never sell short of what your harvest is actually worth again.",
    icon: TrendingUp,
    action1Text: "Live Markets"
  },
  {
    id: "field_mapping",
    number: 39,
    name: "Field mapping",
    description: "Managing a farm by memory and guesswork gets harder as it grows, making it difficult to track boundaries, plan planting, or spot problems early enough to act on them. Mqulima Field Mapping lets you map your farm precisely and manage it with a level of detail guesswork could never give you. Try Field Mapping, and finally see your farm the way it actually is.",
    icon: Compass,
    action1Text: "Measure farm",
    action2Text: "Go back"
  },
  {
    id: "weather_forecast",
    number: 40,
    name: "Weather Forecast",
    description: "Farming decisions — planting, spraying, harvesting — are made with weather in mind, yet many farmers are still relying on the sky itself, and their own intuition, to make that call. Mqulima Weather Forecast gives you reliable, farmer-focused forecasts, so you know what the sky is planning before it happens. Try Weather Forecast, and plan your season around real data, not guesswork.",
    icon: Sun,
    action1Text: "Weather Forecast",
    action2Text: "Weather Advise"
  },
  {
    id: "weather_advisory",
    number: 41,
    name: "Weather Advisory",
    description: "Knowing tomorrow's forecast is only useful if you know what to actually do about it, and most weather apps stop at the number, leaving the decision entirely up to the farmer. Mqulima Weather Advisory translates today's and this week's forecast into practical guidance for your specific farming decisions. Try Weather Advisory, and turn a forecast into an actual plan.",
    icon: Activity,
    action1Text: "Weather Forecast",
    action2Text: "Weather Advise"
  },
  {
    id: "mqulima_trace",
    number: 42,
    name: "Mqulima Trace",
    description: "Buyers increasingly want to know where their food actually comes from, and farmers who can't answer that question lose out on better markets and better prices, regardless of how good their produce actually is. Mqulima Trace gives your produce a verifiable story — from farm to consumer — building the kind of trust that unlocks better markets. Try Mqulima Trace, and let your produce's journey speak for its quality.",
    icon: ShieldCheck,
    action1Text: "Become Traceable",
    action2Text: "Consult an expert"
  },
  {
    id: "mqulima_ai",
    number: 43,
    name: "Mqulima AI",
    description: "Not every farming question can wait for the next market day or the next agronomist visit, and small, timely answers can be the difference between catching a problem early and losing a crop to it. Mqulima AI gives you instant, intelligent answers to your agricultural questions, built specifically for African farming conditions. Try Mqulima AI, and get expert guidance any time you need it, not just when someone's available.",
    icon: Sparkles,
    action1Text: "Ask Mqulima",
    action2Text: "Go back"
  }
];

const KENYA_COUNTIES = [
  "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo-Marakwet", "Embu", "Garissa", "Homa Bay", "Isiolo",
  "Kajiado", "Kakamega", "Kericho", "Kiambu", "Kilifi", "Kirinyaga", "Kisii", "Kisumu", "Kitui",
  "Kwale", "Laikipia", "Lamu", "Machakos", "Makueni", "Mandera", "Marsabit", "Meru", "Migori",
  "Mombasa", "Murang'a", "Nairobi", "Nakuru", "Nandi", "Narok", "Nyamira", "Nyandarua", "Nyeri",
  "Samburu", "Siaya", "Taita-Taveta", "Tana River", "Tharaka-Nithi", "Trans Nzoia", "Turkana",
  "Uasin Gishu", "Vihiga", "Wajir", "West Pokot"
];

export function normalizeCategoryFilter(categoryParam?: string): string {
  if (!categoryParam) return "all";
  const p = categoryParam.toLowerCase().trim();
  if (p === "finance" || p.includes("finance") || p.includes("insurance") || p.includes("loan")) return "finance";
  if (p === "soil" || p.includes("soil")) return "soil";
  if (p === "crop" || p.includes("crop")) return "crop";
  if (p === "health" || p.includes("vet") || p.includes("animal_health") || p.includes("breeding") || p.includes("vaccin")) return "health";
  if (p === "nutrition" || p.includes("feed") || p.includes("nutrition") || p.includes("silage")) return "nutrition";
  if (p === "irrigation" || p.includes("irrigation") || p.includes("water") || p.includes("borehole")) return "irrigation";
  if (p === "value" || p.includes("value")) return "value";
  if (p === "important" || p === "other" || p.includes("important") || p.includes("machinery") || p.includes("shed") || p.includes("incub")) return "important";
  return "all";
}

function ServicesPage() {
  const { user } = useAuth();
  const search = Route.useSearch();
  const navigate = useNavigate();

  // Active Category View Drawer Modal State
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategoryConfig | null>(null);

  // Active Filter for the Services Catalog — initialize from URL param to avoid double render
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>(
    () => search.category ? normalizeCategoryFilter(search.category) : "all"
  );

  const visibleCategories = useMemo(() => {
    if (activeCategoryFilter === "all") return CATEGORIES_CONFIG;
    return CATEGORIES_CONFIG.filter((cat) => {
      const id = cat.id.toLowerCase();
      const title = cat.title.toLowerCase();
      const filter = activeCategoryFilter.toLowerCase();
      if (filter === "finance") return id.includes("finance") || title.includes("finance");
      if (filter === "soil") return id.includes("soil") || title.includes("soil");
      if (filter === "crop") return id.includes("crop") || title.includes("crop");
      if (filter === "health") return id.includes("health") || id.includes("animal_health") || title.includes("health") || title.includes("vet");
      if (filter === "nutrition") return id.includes("nutrition") || title.includes("nutrition") || id.includes("feed");
      if (filter === "irrigation") return id.includes("irrigation") || title.includes("irrigation") || id.includes("water");
      if (filter === "value") return id.includes("value") || title.includes("value");
      if (filter === "important") return id.includes("important") || title.includes("important") || id.includes("other");
      return true;
    });
  }, [activeCategoryFilter]);

  // Booking Wizard Modal State
  const [selectedSubservice, setSelectedSubservice] = useState<{
    id: string;
    name: string;
    description: string;
    estimatedCost: string;
    categoryTitle: string;
  } | null>(null);

  const [bookingStep, setBookingStep] = useState(1);
  const [farmerName, setFarmerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [county, setCounty] = useState("Uasin Gishu");
  const [locationDetails, setLocationDetails] = useState("");
  const [farmScale, setFarmScale] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingReference, setBookingReference] = useState<string | null>(null);

  const openBookingModal = useCallback((subservice: {
    id: string;
    name: string;
    description: string;
    estimatedCost: string;
    categoryTitle: string;
  }) => {
    setFarmerName(user?.name || "");
    setPhone((user as any)?.phone || "");
    setEmail(user?.email || (user as any)?.contact_email || "");
    setCounty("Nairobi");
    setLocationDetails("");
    setFarmScale("");
    setBookingDate("");
    setSpecialNotes("");
    setBookingStep(1);
    setBookingReference(null);
    setSelectedSubservice(subservice);
  }, [user]);

  const closeBookingModal = useCallback(() => {
    setSelectedSubservice(null);
    setBookingStep(1);
    setBookingReference(null);
    setFarmerName("");
    setPhone("");
    setEmail("");
    setCounty("Nairobi");
    setLocationDetails("");
    setFarmScale("");
    setBookingDate("");
    setSpecialNotes("");
  }, []);

  // Handle WhatsApp quotation link helper with Database Persistence
  const openWhatsAppQuotation = async (serviceName: string, customDetails?: { name?: string; phone?: string; email?: string; county?: string; notes?: string }) => {
    try {
      const { createWhatsAppServiceRequest } = await import("@/lib/api/services.server");
      
      const reqName = customDetails?.name || farmerName || user?.name || "Farmer";
      const reqPhone = customDetails?.phone || phone || (user as any)?.phone || "";
      const reqEmail = customDetails?.email || email || user?.email || "";
      const reqCounty = customDetails?.county || county || "Nairobi";
      const reqNotes = customDetails?.notes || specialNotes || `WhatsApp Quotation Inquiry for ${serviceName}`;

      const res = await createWhatsAppServiceRequest({
        data: {
          service_type: serviceName,
          subservice_name: serviceName,
          contact_name: reqName,
          contact_phone: reqPhone || "0723346134",
          contact_email: reqEmail,
          county: reqCounty,
          location: `${locationDetails || reqCounty}, Kenya`,
          farm_scale: farmScale || "Custom",
          notes: reqNotes,
          csrfToken: getCsrfTokenFromCookie(),
        }
      });

      const ref = (res as any)?.ref || (res as any)?.reference || "MQL-" + Math.floor(100000 + Math.random() * 900000);
      const isLandLeasing = serviceName.toLowerCase().includes("lease land") || serviceName.toLowerCase().includes("land leasing");
      const text = encodeURIComponent(
        isLandLeasing
          ? `Jambo Mqulima Agri-Desk! 🌿\n\nI am requesting available lands for leasing.\n\n📋 *Tracking Ref*: ${ref}\n👤 *Farmer / Client*: ${reqName}\n📞 *Phone*: ${reqPhone || "Provided on call"}\n📍 *County*: ${reqCounty}\n🌾 *Desired Land Size*: ${farmScale || "Open to options"}\n📝 *Specific Needs*: ${reqNotes || "Requesting available lands for leasing"}\n\nPlease share currently available verified farmland parcels and lease terms. Asante!`
          : `Jambo Mqulima Agri-Desk! 🌿\n\nI am requesting an official quotation & specialist dispatch for: *${serviceName}*.\n\n📋 *Tracking Ref*: ${ref}\n👤 *Farmer*: ${reqName}\n📞 *Phone*: ${reqPhone || "Provided on call"}\n📍 *County/Location*: ${reqCounty}\n🌾 *Farm Scale*: ${farmScale || "Custom"}\n\nPlease link me with a verified extension specialist at your earliest convenience. Asante!`
      );

      toast.success(isLandLeasing ? `Connecting to WhatsApp Land Desk! Ref: ${ref}` : `WhatsApp Request Saved to DB! Ref: ${ref}`);
      window.open(`https://wa.me/254723346134?text=${text}`, "_blank");
    } catch {
      const isLandLeasing = serviceName.toLowerCase().includes("lease land") || serviceName.toLowerCase().includes("land leasing");
      const text = encodeURIComponent(
        isLandLeasing
          ? `Jambo Mqulima Agri-Desk! 🌿\n\nI am requesting available lands for leasing.\n\n📍 *Platform Request*: Mqulima Farmland & Land Leasing Desk\n\nPlease share currently available verified farmland parcels and lease terms. Asante!`
          : `Jambo Mqulima Agri-Desk! 🌿\n\nI am requesting an official quotation & specialist dispatch for: *${serviceName}*.\n\n📍 *Platform Request*: Mqulima Services Core\n\nPlease link me with a verified extension specialist at your earliest convenience. Asante!`
      );
      window.open(`https://wa.me/254723346134?text=${text}`, "_blank");
    }
  };

  // Sync route URL search query params: Filter & Smooth Scroll (Without freezing popup)
  useEffect(() => {
    if (search.category) {
      const normalizedFilter = normalizeCategoryFilter(search.category);
      setActiveCategoryFilter(normalizedFilter);

      // Use requestAnimationFrame + setTimeout to ensure the DOM has laid out
      // the filtered content before attempting to scroll. This prevents the
      // "freeze" appearance when navigating from the homepage.
      const timer = setTimeout(() => {
        requestAnimationFrame(() => {
          const el = document.getElementById("our-services-grid");
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        });
      }, 350);
      return () => clearTimeout(timer);
    } else {
      setActiveCategoryFilter("all");
    }
  }, [search.category]);

  // Handle direct subservice modal request if serviceId query param is provided
  useEffect(() => {
    if (search.serviceId) {
      // Defer modal opening to next frame so the page finishes initial render first
      const timer = setTimeout(() => {
        for (const cat of CATEGORIES_CONFIG) {
          const sub = cat.subservices.find(s => s.id === search.serviceId);
          if (sub) {
            openBookingModal({
              id: sub.id,
              name: sub.name,
              description: sub.description,
              estimatedCost: sub.estimatedCost,
              categoryTitle: cat.title,
            });
            break;
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [search.serviceId, openBookingModal]);

  // Keyboard shortcut: close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedSubservice) {
          closeBookingModal();
        } else if (selectedCategory) {
          setSelectedCategory(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCategory, selectedSubservice]);

  // Prevent background scroll when any modal is active
  useEffect(() => {
    if (selectedCategory || selectedSubservice) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedCategory, selectedSubservice]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const contactEmailVal = (email || user?.email || (user as any)?.contact_email || "").trim();
    if (!contactEmailVal || !contactEmailVal.includes("@")) {
      toast.error("Please enter a valid email address to receive your booking confirmation.");
      return;
    }

    if (!phone.trim() || phone.trim().length < 9) {
      toast.error("Please enter a valid phone number for SMS confirmation and agronomist dispatch.");
      return;
    }

    setIsSubmittingBooking(true);
    try {
      const costNumeric = selectedSubservice?.estimatedCost
        ? Number(selectedSubservice.estimatedCost.replace(/[^0-9]/g, "")) || 2500
        : 2500;

      const res = await createServiceBooking({
        data: {
          service_type: selectedSubservice?.id || "soil_testing_analysis",
          subservice_name: selectedSubservice?.name || "Soil Testing & Analysis",
          farmer_id: user?.id,
          contact_name: farmerName || user?.name || "Farmer",
          contact_phone: phone || (user as any)?.phone || "",
          contact_email: contactEmailVal,
          location: `${locationDetails || "Farm location"}, ${county}`,
          farm_size_acres: parseFloat(farmScale) || 1.0,
          farm_scale: farmScale || "Custom",
          scheduled_date: bookingDate || new Date().toISOString(),
          notes: specialNotes || `Requested for ${selectedSubservice?.name}`,
          amount: costNumeric,
          channel: "website",
          csrfToken: getCsrfTokenFromCookie(),
        }
      });

      if (res.success && res.reference) {
        setBookingReference(res.reference);
        setBookingStep(3); // Success step
        toast.success(`Service Booking Submitted! Ref: ${res.reference}`);

        if (selectedSubservice?.id === "lease_land" || selectedSubservice?.name?.toLowerCase().includes("lease land")) {
          const waMessage = encodeURIComponent(
            `Jambo Mqulima Agri-Desk! 🌿\n\nI am requesting available lands for leasing.\n\n📋 *Tracking Ref*: ${res.reference}\n👤 *Farmer / Client*: ${farmerName || user?.name || "Farmer"}\n📞 *Phone*: ${phone || (user as any)?.phone || ""}\n✉️ *Email*: ${contactEmailVal}\n📍 *County*: ${county}\n📌 *Target Location*: ${locationDetails || "Within " + county}\n🌾 *Desired Land Size*: ${farmScale || "Open to options"}\n🗓️ *Preferred Start Date*: ${bookingDate || "Immediate"}\n📝 *Specific Needs*: ${specialNotes || "Looking for fertile farmland for lease"}\n\nPlease share currently available verified land listings and lease terms for this location. Asante!`
          );
          window.open(`https://wa.me/254723346134?text=${waMessage}`, "_blank");
        }
      } else {
        throw new Error("Failed to submit service booking");
      }
    } catch (err: any) {
      console.error("Booking error:", err);
      toast.error(err.message || "Could not complete booking request.");
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleActionButton = (
    actionText: string,
    context?: {
      serviceName?: string;
      subservice?: SubserviceConfig;
      category?: ServiceCategoryConfig;
      categoryTitle?: string;
    }
  ) => {
    const act = (actionText || "").trim().toLowerCase();

    // 1. Navigation / scrolling to services
    if (
      act === "view services" ||
      act === "see services" ||
      act === "browse services" ||
      act === "view plant services" ||
      act === "get financed" ||
      act === "animal services" ||
      act === "animal nutrition"
    ) {
      if (context?.category) {
        const subservicesEl = document.getElementById(`subservices-${context.category.id}`);
        if (subservicesEl) {
          subservicesEl.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
        const firstSubId = context.category.subservices?.[0]?.id;
        if (firstSubId) {
          const firstSubEl = document.getElementById(`subservice-${firstSubId}`);
          if (firstSubEl) {
            firstSubEl.scrollIntoView({ behavior: "smooth", block: "start" });
            return;
          }
        }
      }
      const el = document.getElementById("our-services-grid");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      } else {
        navigate({ to: "/services" });
      }
      return;
    }


    // 2. Terms & conditions
    if (act === "terms & conditions" || act === "terms and conditions") {
      navigate({ to: "/terms" });
      return;
    }

    // 3. Go home
    if (act === "go home") {
      setSelectedCategory(null);
      navigate({ to: "/" });
      return;
    }

    // 4. Go back
    if (act === "go back") {
      if (selectedCategory) {
        setSelectedCategory(null);
      } else {
        window.history.back();
      }
      return;
    }

    // 5. Toolbox / Digital Tools navigation
    if (act === "view toolbox") {
      navigate({ to: "/tools" });
      return;
    }
    if (act === "live markets") {
      navigate({ to: "/tools", search: { tab: "markets" } as any });
      return;
    }
    if (act === "measure farm") {
      navigate({ to: "/tools", search: { tab: "mapping" } as any });
      return;
    }
    if (act === "weather forecast" || act === "weather advise") {
      navigate({ to: "/tools", search: { tab: "weather" } as any });
      return;
    }
    if (act === "ask mqulima") {
      navigate({ to: "/ai" });
      return;
    }
    if (act === "become traceable") {
      openWhatsAppQuotation("Mqulima Trace Certification & Produce Passport");
      return;
    }

    // 6. Academy routes
    if (act.includes("academy") || act === "visit academy") {
      navigate({ to: "/academy" });
      return;
    }

    // Special handling for Land Leasing subservice
    if (
      context?.subservice?.id === "lease_land" ||
      context?.serviceName?.toLowerCase().includes("lease land") ||
      act.includes("lease land")
    ) {
      if (act.includes("whatsapp") || act === "inquire on whatsapp") {
        openWhatsAppQuotation("Lease land", {
          notes: "I am requesting available lands for leasing. Please share currently available verified farmland parcels and lease terms."
        });
        return;
      }
      if (
        act === "browse listings" ||
        act === "request available lands" ||
        act === "request available land" ||
        act === "place request"
      ) {
        openBookingModal({
          id: "lease_land",
          name: "Lease land",
          description: context?.subservice?.description || "Connects you to verified farmland available for lease.",
          estimatedCost: "Per Acre / Season",
          categoryTitle: "Crop services",
        });
        return;
      }
    }

    // 7. Shop / listings
    if (act === "browse listings") {
      navigate({ to: "/shop" });
      return;
    }

    // 8. Flier download
    if (act === "download flier") {
      toast.success("Downloading Mqulima Livestock Vaccination Schedule (PDF)...");
      window.open("/docs/vaccination-schedule.pdf", "_blank");
      return;
    }

    // 9. Remind me notification
    if (act === "remind me") {
      toast.success(
        `Reminder set! We will send you an SMS/WhatsApp reminder for ${context?.serviceName || "this service"} before the season starts.`
      );
      return;
    }

    // 10. Consult / Expert / Quote / Hire / Advise / Enquire
    if (
      act.includes("expert") ||
      act.includes("quote") ||
      act.includes("vet") ||
      act.includes("advise") ||
      act.includes("advised") ||
      act.includes("consult") ||
      act.includes("enquire") ||
      act.includes("hire") ||
      act === "know more"
    ) {
      openWhatsAppQuotation(
        context?.serviceName ||
          context?.subservice?.name ||
          context?.categoryTitle ||
          "Agricultural Specialist"
      );
      return;
    }

    // 11. Booking or Service Request actions
    if (context?.subservice) {
      setSelectedCategory(null);
      openBookingModal({
        id: context.subservice.id,
        name: context.subservice.name,
        description: context.subservice.description,
        estimatedCost: context.subservice.estimatedCost,
        categoryTitle:
          context.categoryTitle || selectedCategory?.title || "Mqulima Services",
      });
      return;
    }

    if (context?.category) {
      const firstSub = context.category.subservices[0];
      if (firstSub) {
        openBookingModal({
          id: firstSub.id,
          name: firstSub.name,
          description: firstSub.description,
          estimatedCost: firstSub.estimatedCost,
          categoryTitle: context.category.title,
        });
      } else {
        openWhatsAppQuotation(context.category.title);
      }
      return;
    }

    // Fallback
    openWhatsAppQuotation(actionText);
  };

  return (
    <AppLayout>
      <div className="bg-[#FAFBF9] text-[#1A261C] min-h-screen font-['Plus_Jakarta_Sans',sans-serif] antialiased selection:bg-[#85CC14] selection:text-white">
        
        {/* =========================================================================
            SECTION 1: HERO BANNER (Pixel-matched to Screenshot 4)
           ========================================================================= */}
        <section className="relative overflow-hidden bg-[#0F291E] text-white">
          {/* High-res panoramic agricultural background image with dark overlay */}
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center opacity-40 mix-blend-luminosity scale-105"
            style={{ backgroundImage: `url('/images/self-hosted/farm-field-banner-640w.webp')` }}
          />
          {/* Subtle radial green glow gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B2117] via-[#0F291E]/90 to-[#123828]/80 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B2117] via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 mx-auto w-full max-w-[1480px] px-4 sm:px-6 lg:px-8 xl:px-10 pt-6 pb-6 md:pt-8 md:pb-8">
            <div className="max-w-2xl text-left">
              
              {/* Top Pill Badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white/90 border border-white/15 mb-2.5">
                <Sprout className="h-3.5 w-3.5 text-[#85CC14]" />
                <span>MQULIMA SERVICES</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight tracking-tight font-['Outfit',sans-serif]">
                Services
              </h1>

              {/* Subheading Summarized Description */}
              <p className="mt-3 text-sm sm:text-base text-white/90 leading-relaxed font-normal max-w-2xl">
                All essential agricultural services in one place. Connect with verified regional specialists for soil analysis, veterinary care, machinery leasing, and farm support — booked in minutes at transparent rates.
              </p>

              {/* Action Buttons Row */}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handleActionButton("View Services")}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#85CC14] to-[#6FA810] text-[#0B2117] font-extrabold text-xs sm:text-sm hover:brightness-110 shadow-md shadow-[#85CC14]/20 transition-all duration-200 flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  <span>View Services</span>
                  <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                </button>

                <button
                  onClick={() => handleActionButton("Terms & Conditions")}
                  className="px-6 py-2.5 rounded-full bg-[#FACC15] hover:bg-[#EAB308] border border-[#FACC15] text-[#0B2117] font-extrabold text-xs sm:text-sm hover:brightness-105 shadow-md shadow-yellow-500/20 transition-all duration-200 flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  <FileText className="h-4 w-4 text-[#0B2117] stroke-[2.2]" />
                  <span>Terms & Conditions</span>
                </button>
              </div>

              {/* Trust Badges Checkmark Row */}
              <div className="mt-4 pt-3.5 border-t border-white/10 flex flex-wrap items-center gap-5 text-xs font-semibold text-white/90">
                <div className="flex items-center gap-1.5">
                  <div className="p-0.5 rounded-full bg-[#85CC14]/20 text-[#85CC14]">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                  <span>Vetted professionals</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="p-0.5 rounded-full bg-[#85CC14]/20 text-[#85CC14]">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                  <span>Nationwide coverage</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="p-0.5 rounded-full bg-[#85CC14]/20 text-[#85CC14]">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                  <span>Transparent pricing</span>
                </div>
              </div>

            </div>
          </div>

          {/* Stats Bar Ribbon at Bottom of Hero (Infinite Smooth Right-to-Left Continuous Marquee Carousel) */}
          <div className="relative z-10 bg-[#EDF7E2] border-t border-b border-[#D8EBC4] py-3.5 overflow-hidden">
            <div className="marquee-wrapper flex w-max items-center animate-marquee">
              {/* Track 1 */}
              <div className="flex shrink-0 items-center gap-10 sm:gap-16 pr-10 sm:pr-16">
                {[...SERVICES_HERO_STATS, ...SERVICES_HERO_STATS].map((stat, idx) => (
                  <div key={`t1-${idx}`} className="flex items-center gap-3 shrink-0">
                    <div className="p-2.5 rounded-full bg-[#85CC14]/25 text-[#2A520B] shrink-0">
                      <stat.icon className="h-5 w-5 stroke-[2]" />
                    </div>
                    <div className="text-left">
                      <span className="text-xl sm:text-2xl font-black text-[#1A380A] tracking-tight font-['Outfit',sans-serif] block leading-tight">
                        {stat.value}
                      </span>
                      <span className="text-[11px] font-semibold text-[#3D661B] whitespace-nowrap">{stat.label}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Track 2 (Identical Clone for 100% Seamless Infinite Continuous Loop) */}
              <div className="flex shrink-0 items-center gap-10 sm:gap-16 pr-10 sm:pr-16" aria-hidden="true">
                {[...SERVICES_HERO_STATS, ...SERVICES_HERO_STATS].map((stat, idx) => (
                  <div key={`t2-${idx}`} className="flex items-center gap-3 shrink-0">
                    <div className="p-2.5 rounded-full bg-[#85CC14]/25 text-[#2A520B] shrink-0">
                      <stat.icon className="h-5 w-5 stroke-[2]" />
                    </div>
                    <div className="text-left">
                      <span className="text-xl sm:text-2xl font-black text-[#1A380A] tracking-tight font-['Outfit',sans-serif] block leading-tight">
                        {stat.value}
                      </span>
                      <span className="text-[11px] font-semibold text-[#3D661B] whitespace-nowrap">{stat.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>


        {/* =========================================================================
            SECTION 2: STRUCTURED SERVICES & SUB-CATEGORIES
           ========================================================================= */}
        <section id="our-services-grid" className="py-16 md:py-24 bg-[#FAFBF9]">
          <div className="mx-auto w-full max-w-[1480px] px-4 sm:px-6 lg:px-8 xl:px-10">

            {/* Section Header */}
            <div className="text-left max-w-3xl mb-8 sm:mb-12">
              <span className="inline-block bg-[#E5F5D0] px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#35610D] mb-3 rounded-none border border-[#35610D]/20">
                STRUCTURED SERVICES &amp; SUB-CATEGORIES
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0F291E] tracking-tight leading-tight font-['Outfit',sans-serif]">
                Everything your farm needs,{" "}
                <span className="text-[#6EA810]">organized by category</span>
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
                Explore our specialist agricultural services arranged by main category and dedicated sub-categories. Select any category to view its vetted specialists, detailed procedures, and dispatch options.
              </p>
            </div>

            {/* Category Filter Dropdown Bar */}
            <div className="bg-white border border-slate-200/80 p-4 sm:p-5 shadow-xs mb-10 sm:mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#E5F5D0] text-[#16A34A] flex items-center justify-center">
                  <Filter className="h-4 w-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#0F291E]">
                    Filter by Service Category
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Select a category from the dropdown to filter services
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <select
                    id="service-category-dropdown"
                    value={activeCategoryFilter}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      setActiveCategoryFilter(selectedVal);
                      navigate({
                        to: "/services",
                        search: {
                          category: selectedVal === "all" ? undefined : selectedVal,
                        },
                        replace: true,
                      });
                    }}
                    className="w-full appearance-none bg-[#FAFBF9] hover:bg-slate-50 text-[#0F291E] border-2 border-slate-300 focus:border-[#16A34A] py-2.5 pl-4 pr-10 text-xs sm:text-sm font-bold rounded-none shadow-2xs cursor-pointer transition-all outline-none"
                  >
                    {CATEGORY_FILTERS.map((filter) => (
                      <option key={filter.id} value={filter.id}>
                        {filter.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#16A34A]">
                    <ChevronDown className="h-4 w-4 stroke-[2.5]" />
                  </div>
                </div>

                {activeCategoryFilter !== "all" && (
                  <button
                    onClick={() => {
                      setActiveCategoryFilter("all");
                      navigate({
                        to: "/services",
                        search: { category: undefined },
                        replace: true,
                      });
                    }}
                    className="py-2.5 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-none border border-slate-300 transition cursor-pointer flex items-center gap-1.5 shrink-0"
                    title="Reset to All Categories"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span className="hidden xs:inline">Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Structured Category Showcase & Nested Sub-services Grid */}
            <div className="space-y-16 lg:space-y-24">
              {visibleCategories.map((category, catIndex) => {
                const CategoryIcon = category.icon;

                return (
                  <div
                    key={category.id}
                    id={category.id}
                    className="scroll-mt-24"
                  >
                    {/* ========================================================
                        CATEGORY LEVEL (THE SERVICE ITSELF): FLAGSHIP SHOWCASE CARD
                       ======================================================== */}
                    <div className="bg-white border-2 border-[#16A34A]/25 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden mb-8 group/cat text-left">
                      {/* Top Banner Tag */}
                      <div className="bg-[#0F291E] text-white px-5 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10">
                        <div className="flex items-center gap-3">
                          <span className="bg-[#85CC14] text-[#0B2117] text-xs font-black uppercase tracking-wider px-3 py-1">
                            CATEGORY 0{category.part || catIndex + 1}
                          </span>
                          <span className="text-xs font-bold text-white/80 uppercase tracking-wider hidden sm:inline">
                            Mqulima Specialist Pillar
                          </span>
                        </div>
                        <div className="inline-flex items-center gap-2 text-xs font-black text-[#85CC14] bg-white/10 px-3 py-1">
                          <Layers className="h-3.5 w-3.5" />
                          <span>{category.servicesCountText.toUpperCase()} INCLUDED</span>
                        </div>
                      </div>

                      {/* 2-Column Category Presentation (Image & CTA on Left, Context on Right) */}
                      <div className="flex flex-col lg:flex-row items-stretch">
                        {/* LEFT COLUMN: Full Uncropped 16:9 Image + CTA Buttons Below It */}
                        <div className="w-full lg:w-1/2 xl:w-1/2 flex flex-col justify-between bg-white border-b lg:border-b-0 lg:border-r border-slate-200">
                          {/* Image Container - Natural 16:9 Ratio ensures zero cropping or cut-off */}
                          <div className="relative w-full aspect-[16/9] overflow-hidden bg-slate-900 flex items-center justify-center shrink-0">
                            <img
                              src={category.image}
                              alt={category.title}
                              className="w-full h-full object-cover group-hover/cat:scale-102 transition-transform duration-500"
                              loading={catIndex === 0 ? "eager" : "lazy"}
                              decoding="async"
                              width={736}
                              height={414}
                            />

                            {/* Clean Category Badge */}
                            <div className="absolute top-3.5 left-3.5 flex items-center gap-2 pointer-events-none">
                              <div className="p-1.5 bg-white/95 text-[#16A34A] shadow-md border border-white/50">
                                <CategoryIcon className="h-4 w-4 stroke-[2.5]" />
                              </div>
                              <span className="bg-[#0B2117]/90 text-[#85CC14] text-[10px] font-black px-2 py-0.5 tracking-wider uppercase border border-[#85CC14]/30 backdrop-blur-xs">
                                Vetted Service
                              </span>
                            </div>
                          </div>

                          {/* CTA Buttons - Directly Below the Image */}
                          <div className="p-4 sm:p-5 bg-white flex flex-wrap sm:flex-nowrap items-center gap-3 border-t border-slate-100 mt-auto">
                            <button
                              onClick={() =>
                                handleActionButton(category.action1Text, {
                                  category,
                                  categoryTitle: category.title,
                                })
                              }
                              className="py-3.5 px-6 bg-[#85CC14] hover:bg-[#74B510] text-[#0B2117] font-extrabold text-sm transition duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-98 shadow-sm flex-1 min-w-[130px]"
                            >
                              <span>{category.action1Text}</span>
                              <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
                            </button>

                            {category.action2Text && category.action2Text.toLowerCase().trim() !== "go home" && (
                              <button
                                onClick={() =>
                                  handleActionButton(category.action2Text!, {
                                    category,
                                    categoryTitle: category.title,
                                  })
                                }
                                className="py-3.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition duration-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 border border-slate-300 min-w-[100px]"
                              >
                                <span>{category.action2Text}</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* RIGHT COLUMN: Full Context (Main Service Category, Title, Narrative Description, & Sub-categories Checklist) */}
                        <div className="p-6 sm:p-8 lg:p-10 xl:p-12 w-full lg:w-1/2 xl:w-1/2 flex flex-col justify-between text-left bg-gradient-to-br from-white to-[#FAFBF9]">
                          <div>
                            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#16A34A] uppercase tracking-wider mb-2.5">
                              <CategoryIcon className="h-4 w-4" />
                              <span>Service Pillar 0{category.part || catIndex + 1}</span>
                            </div>

                            {/* Highlighted, Coloured & Numbered Service Title */}
                            <div className="flex items-center gap-3 mb-4 flex-wrap">
                              <span className="inline-flex items-center justify-center bg-[#85CC14] text-[#0B2117] text-lg sm:text-2xl font-black px-3.5 py-1 shadow-xs border border-[#85CC14]">
                                0{category.part || catIndex + 1}
                              </span>
                              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight font-['Outfit',sans-serif]">
                                <span className="text-[#0F291E] bg-[#E5F5D0] px-3.5 py-1 border-l-4 border-[#16A34A] inline-block shadow-xs">
                                  <span className="text-[#16A34A]">{category.title}</span>
                                </span>
                              </h3>
                            </div>

                            {/* Full Category Detailed Description */}
                            <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal mb-6">
                              {category.description}
                            </p>

                            {/* Subservice Checklist Badges - Numbered in Roman Numerals */}
                            <div>
                              <span className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-2">
                                Sub-categories Covered in 0{category.part || catIndex + 1}. {category.title}:
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {category.subservices.map((sub, sIdx) => (
                                  <a
                                    key={sub.id}
                                    href={`#subservice-${sub.id}`}
                                    className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 bg-[#E5F5D0]/70 hover:bg-[#85CC14] text-[#1A380A] border border-[#16A34A]/25 transition-colors duration-150 cursor-pointer"
                                  >
                                    <span className="font-black text-[#16A34A] text-[10px] bg-white px-1.5 py-0.5 border border-[#16A34A]/30">
                                      {toRoman(sIdx + 1)}
                                    </span>
                                    <span>{sub.name}</span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ========================================================
                        SUB-SERVICES LEVEL: THE SUB-CATEGORIES IN THIS CATEGORY
                       ======================================================== */}
                    <div 
                      id={`subservices-${category.id}`}
                      className="scroll-mt-28 pl-0 sm:pl-3 lg:pl-6 border-l-0 sm:border-l-4 sm:border-[#85CC14]/40 mt-8 mb-16 sm:mb-20"
                    >
                      {/* Sub-services Header Bar */}
                      <div className="flex items-center justify-between gap-3 mb-6 pb-2 border-b border-slate-200/80">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 bg-[#16A34A] text-white">
                            <Layers className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="text-lg sm:text-xl font-black text-[#0F291E] font-['Outfit',sans-serif] flex items-center gap-2 flex-wrap">
                              <span className="text-[#16A34A] font-extrabold">0{category.part || catIndex + 1}.</span>
                              <span>Sub-services in</span>
                              <span className="text-[#16A34A] bg-[#E5F5D0]/80 px-2 py-0.5 border-b-2 border-[#16A34A]">
                                {category.title}
                              </span>
                            </h4>
                            <span className="text-xs text-slate-500 font-medium">
                              {category.subservices.length} specialist services available to request directly
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Sub-services Cards Responsive Grid */}
                      <div
                        className={`grid grid-cols-1 ${
                          category.subservices.length === 2
                            ? "md:grid-cols-2"
                            : category.subservices.length === 4
                            ? "md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4"
                            : "md:grid-cols-2 lg:grid-cols-3"
                        } gap-6`}
                      >
                        {category.subservices.map((sub, subIdx) => {
                          const SubIcon = sub.icon || Sprout;

                          return (
                            <div
                              key={sub.id}
                              id={`subservice-${sub.id}`}
                              className="scroll-mt-28 bg-white border border-slate-200 hover:border-[#16A34A] shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group/sub text-left"
                            >
                              <div>
                                {/* Sub-service Image */}
                                <div className="relative h-52 sm:h-56 lg:h-60 w-full overflow-hidden bg-slate-900 shrink-0">
                                  <img
                                    src={sub.image}
                                    alt={sub.name}
                                    className="w-full h-full object-cover object-center group-hover/sub:scale-105 transition-transform duration-500"
                                    loading="lazy"
                                    decoding="async"
                                    width={500}
                                    height={300}
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                                  {/* Sub-service Badge with Roman Numeral */}
                                  <div className="absolute top-3 left-3">
                                    <span className="bg-[#0F291E]/95 text-[#85CC14] text-[11px] font-black uppercase tracking-wider px-2.5 py-1 border border-[#85CC14]/30 backdrop-blur-xs flex items-center gap-1.5">
                                      <span>SUB-SERVICE</span>
                                      <span className="bg-[#85CC14] text-[#0B2117] px-1.5 py-0.2 text-[10px] font-black">
                                        {toRoman(subIdx + 1)}
                                      </span>
                                    </span>
                                  </div>

                                  {/* Cost pill */}
                                  {sub.estimatedCost && (
                                    <div className="absolute top-3 right-3">
                                      <span className="bg-white/95 text-slate-800 text-[11px] font-bold px-2.5 py-1 shadow-xs border border-white/60">
                                        {sub.estimatedCost}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Sub-service Content */}
                                <div className="p-5 sm:p-6">
                                  <div className="flex items-start gap-3 mb-3">
                                    <div className="p-2 bg-[#E5F5D0] text-[#16A34A] shrink-0 mt-0.5">
                                      <SubIcon className="h-4 w-4" />
                                    </div>
                                    <h5 className="text-lg sm:text-xl font-black text-[#0F291E] font-['Outfit',sans-serif] leading-tight group-hover/sub:text-[#16A34A] transition-colors flex items-start gap-2.5">
                                      <span className="text-[#16A34A] font-black text-sm sm:text-base shrink-0 bg-[#E5F5D0] px-2 py-0.5 border border-[#16A34A]/30">
                                        {toRoman(subIdx + 1)}
                                      </span>
                                      <span className="mt-0.5">{sub.name}</span>
                                    </h5>
                                  </div>

                                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal mb-4">
                                    {sub.description}
                                  </p>

                                  {/* Special Desk Details for Agri Insurance */}
                                  {sub.id === "agri_insurance" && (
                                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 mb-4">
                                      <p className="font-bold text-[#16A34A] mb-1">
                                        Mqulima Agro-Insurance Expert Desk:
                                      </p>
                                      <p className="text-[11px] text-emerald-800 leading-relaxed">
                                        📞 Phone: <a href="tel:0723346134" className="font-bold underline">0723346134</a><br />
                                        ✉️ Email: <a href="mailto:mqulima@mqulima.com" className="font-bold underline">mqulima@mqulima.com</a><br />
                                        💬 WhatsApp: <a href="https://wa.me/254723346134" target="_blank" rel="noreferrer" className="font-bold underline">@mqulima (0723346134)</a>
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Sub-service Action Buttons */}
                              <div className="p-5 sm:p-6 pt-0 mt-auto">
                                <div className="pt-4 border-t border-slate-100 flex flex-wrap sm:flex-nowrap items-center gap-2">
                                  <button
                                    onClick={() =>
                                      handleActionButton(sub.action1Text, {
                                        subservice: sub,
                                        serviceName: sub.name,
                                        categoryTitle: category.title,
                                      })
                                    }
                                    className="flex-1 min-w-[120px] py-2.5 px-4 bg-[#85CC14] hover:bg-[#74B510] text-[#0B2117] font-extrabold text-xs sm:text-sm transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 shadow-xs"
                                  >
                                    <span>{sub.action1Text}</span>
                                    <ArrowUpRight className="h-3.5 w-3.5 stroke-[2.5]" />
                                  </button>

                                  {sub.action2Text && sub.action2Text.toLowerCase().trim() !== "go home" && (
                                    <button
                                      onClick={() =>
                                        handleActionButton(sub.action2Text!, {
                                          subservice: sub,
                                          serviceName: sub.name,
                                          categoryTitle: category.title,
                                        })
                                      }
                                      className="py-2.5 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm transition duration-150 flex items-center justify-center cursor-pointer border border-slate-200 active:scale-98"
                                    >
                                      <span>{sub.action2Text}</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </section>


        {/* =========================================================================
            SECTION 3: MQULIMA DIGITAL TOOLS GRID (Items #38 - #43)
           ========================================================================= */}
        <section id="mqulima-tools-grid" className="py-16 md:py-24 bg-[#0F291E] text-white relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B2117] via-[#0F291E] to-[#0B2117] pointer-events-none opacity-90" />
          
          <div className="relative z-10 mx-auto w-full max-w-[1480px] px-4 sm:px-6 lg:px-8 xl:px-10">
            {/* Tools Section Header */}
            <div className="text-left max-w-3xl mb-12">
              <span className="inline-block rounded-full bg-white/10 backdrop-blur-md px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#85CC14] border border-white/15 mb-3">
                MQULIMA TOOLS
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight font-['Outfit',sans-serif]">
                Farming decisions are only as good as the{" "}
                <span className="text-[#85CC14]">information behind them</span>
              </h2>
              <p className="mt-4 text-sm sm:text-base text-white/85 font-normal leading-relaxed">
                For too long, Kenyan farmers have had to make major calls on what to plant, when to sell and how to manage a farm without the same tools bigger players have always had access to. Mqulima Tools puts real-time markets, weather, mapping, records and AI-powered guidance directly in your hands, so every decision is backed by information, not guesswork. Explore Mqulima Tools, and start farming with the same information advantage the big players have always had.
              </p>

              {/* Tools Header Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handleActionButton("view toolbox")}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#85CC14] to-[#6FA810] text-[#0B2117] font-extrabold text-xs sm:text-sm hover:brightness-110 shadow-md shadow-[#85CC14]/20 transition-all duration-200 flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  <span>view toolbox</span>
                  <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                </button>
                <button
                  onClick={() => handleActionButton("view services")}
                  className="px-6 py-2.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white font-bold text-xs sm:text-sm hover:bg-white/25 transition-all duration-200 flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  <span>view services</span>
                </button>
              </div>
            </div>

            {/* 6 Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {TOOLS_CONFIG.map((tool) => {
                const IconComp = tool.icon;
                return (
                  <div
                    key={tool.id}
                    className="bg-white/5 backdrop-blur-md border border-white/10 rounded-none p-6 sm:p-7 flex flex-col justify-between hover:bg-white/10 hover:border-[#85CC14]/50 transition-all duration-300 group text-left"
                  >
                    <div>
                      {/* Top Row: Tool Number Pill and Icon */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-black tracking-wider uppercase px-2.5 py-1 rounded-none bg-[#85CC14]/20 text-[#85CC14] border border-[#85CC14]/30">
                          TOOL #{tool.number}
                        </span>
                        <div className="p-2.5 rounded-none bg-white/10 text-[#85CC14] group-hover:scale-110 transition-transform duration-200">
                          <IconComp className="h-5 w-5" />
                        </div>
                      </div>

                      {/* Tool Name */}
                      <h3 className="text-xl sm:text-2xl font-black text-white font-['Outfit',sans-serif] mb-2 tracking-tight">
                        {tool.name}
                      </h3>

                      {/* Tool Description */}
                      <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-normal min-h-[96px]">
                        {tool.description}
                      </p>
                    </div>

                    {/* Dual Action Buttons */}
                    <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2.5">
                      <button
                        onClick={() => handleActionButton(tool.action1Text, { serviceName: tool.name })}
                        className="flex-1 min-w-[120px] py-2.5 px-4 rounded-none bg-[#85CC14] hover:bg-[#74B510] text-[#0B2117] font-bold text-xs sm:text-sm transition duration-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 shadow-sm"
                      >
                        <span>{tool.action1Text}</span>
                        <ArrowUpRight className="h-3.5 w-3.5 stroke-[2.5]" />
                      </button>
                      {tool.action2Text && tool.action2Text.toLowerCase().trim() !== "go home" && (
                        <button
                          onClick={() => handleActionButton(tool.action2Text!, { serviceName: tool.name })}
                          className="py-2.5 px-4 rounded-none bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm transition duration-200 flex items-center justify-center cursor-pointer active:scale-98 border border-white/20"
                        >
                          <span>{tool.action2Text}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>


        {/* =========================================================================
            MODAL 1: VIEW CATEGORY SERVICES DRAWER / OVERLAY
           ========================================================================= */}
        <AnimatePresence>
          {selectedCategory && (
            <motion.div
              key="category-drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelectedCategory(null)}
              className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
            >
              <motion.div
                key="category-drawer-modal"
                initial={{ opacity: 0, scale: 0.96, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 15 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white w-full max-w-4xl rounded-none overflow-hidden shadow-2xl border border-slate-300 flex flex-col max-h-[90vh] cursor-default"
              >
                {/* Modal Header */}
                <div className="relative p-6 sm:p-8 bg-[#0F291E] text-white flex items-center justify-between shrink-0">
                  <div>
                    <span className="text-xs font-bold text-[#85CC14] uppercase tracking-wider block mb-1">
                      {selectedCategory.servicesCountText} AVAILABLE
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black font-['Outfit',sans-serif]">
                      {selectedCategory.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="p-2.5 rounded-none bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Subservices List */}
                <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-left">
                  <p className="text-sm text-slate-600 leading-relaxed font-normal">
                    {selectedCategory.description} Pick a specialized sub-service below to schedule a technician or request an instant cost quotation.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedCategory.subservices.map((sub, sIdx) => (
                      <div
                        key={sub.id}
                        className="p-5 rounded-none border border-slate-300 bg-slate-50/50 hover:bg-white hover:border-[#16A34A] transition-all duration-200 flex flex-col justify-between"
                      >
                        <div>
                          <div className="relative h-40 w-full rounded-none overflow-hidden mb-3 bg-slate-100">
                            <img src={sub.image} alt={sub.name} className="w-full h-full object-cover rounded-none" loading="lazy" decoding="async" width={400} height={160} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                          </div>
                          <h4 className="text-base font-bold text-slate-900 leading-snug mb-1 flex items-center gap-2">
                            <span className="text-[#16A34A] font-black text-xs bg-[#E5F5D0] px-1.5 py-0.5 border border-[#16A34A]/30">
                              {toRoman(sIdx + 1)}
                            </span>
                            <span>{sub.name}</span>
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {sub.description}
                          </p>

                          {sub.id === "agri_insurance" && (
                            <div className="mt-3 p-3 rounded-none bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
                              <p className="font-semibold text-[#16A34A] mb-1">Consult Mqulima Agro-Insurance Expert:</p>
                              <div className="space-y-0.5 text-[11px]">
                                <p>✉️ <a href="mailto:mqulima@mqulima.com" className="underline font-semibold hover:text-emerald-700">mqulima@mqulima.com</a></p>
                                <p>📞 Phone call: <a href="tel:0723346134" className="font-semibold">0723346134</a></p>
                                <p>💬 WhatsApp: <a href="https://wa.me/254723346134" target="_blank" rel="noreferrer" className="font-semibold underline">@mqulima (0723346134)</a></p>
                                <p>🌐 All Mqulima Social Channels</p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-200/60 flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => {
                              handleActionButton(sub.action1Text, {
                                subservice: sub,
                                serviceName: sub.name,
                                categoryTitle: selectedCategory.title,
                              });
                            }}
                            className="flex-1 min-w-[120px] py-2.5 px-3.5 rounded-none bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <span>{sub.action1Text}</span>
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </button>

                          {sub.action2Text && sub.action2Text.toLowerCase().trim() !== "go home" && (
                            <button
                              onClick={() => {
                                handleActionButton(sub.action2Text!, {
                                  subservice: sub,
                                  serviceName: sub.name,
                                  categoryTitle: selectedCategory.title,
                                });
                              }}
                              className="py-2.5 px-3.5 rounded-none bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer border border-slate-300"
                            >
                              <span>{sub.action2Text}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* =========================================================================
            MODAL 2: BOOKING WIZARD MODAL
           ========================================================================= */}
        <AnimatePresence>
          {selectedSubservice && (
            <motion.div
              key="booking-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeBookingModal}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden cursor-pointer"
            >
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 40, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white w-full max-w-xl max-h-[90vh] sm:max-h-[85vh] rounded-t-2xl sm:rounded-none shadow-2xl border-t sm:border border-slate-300 flex flex-col cursor-default"
              >
                {/* Header (Sticky so close X button is permanently accessible) */}
                <div className="sticky top-0 z-20 shrink-0 px-4 py-3 sm:px-6 sm:py-4 bg-[#0F291E] text-white border-b border-emerald-950">
                  {/* Mobile pull indicator bar */}
                  <div className="w-10 h-1 bg-white/25 rounded-full mx-auto -mt-0.5 mb-2.5 sm:hidden" />
                  
                  <div className="flex items-center justify-between text-left">
                    <div className="pr-3">
                      <span className="text-[10px] sm:text-xs font-bold text-[#85CC14] uppercase tracking-wider block">
                        {selectedSubservice.id === "lease_land" ? "LAND LEASING REQUEST" : "BOOKING REQUEST"}
                      </span>
                      <h3 className="text-base sm:text-lg md:text-xl font-bold font-['Outfit',sans-serif] line-clamp-1">
                        {selectedSubservice.name}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={closeBookingModal}
                      aria-label="Close booking modal"
                      className="p-1.5 sm:p-2 -mr-1 rounded-full sm:rounded-none bg-white/10 text-white hover:bg-white/20 active:scale-95 transition cursor-pointer shrink-0 flex items-center justify-center"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Content (Scrollable with comfortable mobile padding) */}
                <div className="overflow-y-auto overscroll-contain p-4 sm:p-6 text-left flex-1 space-y-3 sm:space-y-4">
                  {bookingStep === 1 && (
                    <form onSubmit={handleBookingSubmit} autoComplete="off" className="space-y-3 sm:space-y-3.5">
                      <div>
                        <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Farmer / Contact Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          autoComplete="off"
                          value={farmerName}
                          onChange={(e) => setFarmerName(e.target.value)}
                          placeholder="e.g. James Kariuki"
                          className="w-full rounded-none border border-slate-300 py-2 sm:py-2.5 px-3 text-xs sm:text-sm focus:border-[#16A34A] focus:outline-none transition"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
                        <div>
                          <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Phone Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            required
                            autoComplete="off"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="e.g. 0712345678"
                            className="w-full rounded-none border border-slate-300 py-2 sm:py-2.5 px-3 text-xs sm:text-sm focus:border-[#16A34A] focus:outline-none transition"
                          />
                          <span className="text-[10px] text-slate-500 mt-0.5 block">
                            {selectedSubservice.id === "lease_land" ? "Used to connect with you on WhatsApp" : "For instant SMS confirmation & dispatch"}
                          </span>
                        </div>

                        <div>
                          <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Email Address <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            autoComplete="off"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="e.g. james.kariuki@gmail.com"
                            className="w-full rounded-none border border-slate-300 py-2 sm:py-2.5 px-3 text-xs sm:text-sm focus:border-[#16A34A] focus:outline-none transition"
                          />
                          <span className="text-[10px] text-slate-500 mt-0.5 block">
                            For automated receipt & agronomist info
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
                        <div>
                          <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            County Location <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={county}
                            onChange={(e) => setCounty(e.target.value)}
                            className="w-full rounded-none border border-slate-300 py-2 sm:py-2.5 px-3 text-xs sm:text-sm focus:border-[#16A34A] focus:outline-none transition bg-white"
                          >
                            {KENYA_COUNTIES.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            {selectedSubservice.id === "lease_land" ? "Target Area / Specific Sub-County" : "Specific Farm Location / Area"}
                          </label>
                          <input
                            type="text"
                            autoComplete="off"
                            value={locationDetails}
                            onChange={(e) => setLocationDetails(e.target.value)}
                            placeholder={selectedSubservice.id === "lease_land" ? "e.g. Moiben, Turbo, or Naivasha" : "e.g. Turbo, Eldoret West"}
                            className="w-full rounded-none border border-slate-300 py-2 sm:py-2.5 px-3 text-xs sm:text-sm focus:border-[#16A34A] focus:outline-none transition"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
                        <div>
                          <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            {selectedSubservice.id === "lease_land" ? "Desired Land Size (Acres)" : "Farm Size / Project Scale"}
                          </label>
                          <input
                            type="text"
                            autoComplete="off"
                            value={farmScale}
                            onChange={(e) => setFarmScale(e.target.value)}
                            placeholder={selectedSubservice.id === "lease_land" ? "e.g. 5 Acres, 20 Acres, 50 Acres" : "e.g. 3 Acres or 10 Cows"}
                            className="w-full rounded-none border border-slate-300 py-2 sm:py-2.5 px-3 text-xs sm:text-sm focus:border-[#16A34A] focus:outline-none transition"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            {selectedSubservice.id === "lease_land" ? "Preferred Lease Start Date" : "Preferred Service Date"}
                          </label>
                          <input
                            type="date"
                            autoComplete="off"
                            value={bookingDate}
                            onChange={(e) => setBookingDate(e.target.value)}
                            className="w-full rounded-none border border-slate-300 py-2 sm:py-2.5 px-3 text-xs sm:text-sm focus:border-[#16A34A] focus:outline-none transition"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          {selectedSubservice.id === "lease_land" ? "Farming Purpose / Specific Land Needs" : "Specific Requirements / Notes"}
                        </label>
                        <textarea
                          rows={2}
                          autoComplete="off"
                          value={specialNotes}
                          onChange={(e) => setSpecialNotes(e.target.value)}
                          placeholder={selectedSubservice.id === "lease_land" ? "e.g. Maize farming, horticulture, requires irrigation water access, road accessibility..." : "Describe symptoms, crop type, or location landmarks..."}
                          className="w-full rounded-none border border-slate-300 py-2 px-3 text-xs sm:text-sm focus:border-[#16A34A] focus:outline-none transition"
                        />
                      </div>

                      {/* Reassurance banner */}
                      {selectedSubservice.id === "lease_land" ? (
                        <div className="bg-[#EBF8F0] border-l-4 border-[#16A34A] p-2.5 sm:p-3 text-xs text-[#166534] flex items-start gap-2">
                          <WhatsAppIcon className="h-4 w-4 shrink-0 text-[#16A34A] mt-0.5" />
                          <div>
                            <strong className="font-bold">Direct WhatsApp Land Leasing Desk:</strong>
                            <p className="mt-0.5 text-[11px] text-[#166534]/90">
                              Submitting will immediately open WhatsApp with your requested county and acreage so our Farmland Specialists can match and share available verified land parcels with you.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-[#EBF8F0] border-l-4 border-[#16A34A] p-2.5 sm:p-3 text-xs text-[#166534] flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 shrink-0 text-[#16A34A] mt-0.5" />
                          <div>
                            <strong className="font-bold">Instant Automatic Confirmation:</strong>
                            <p className="mt-0.5 text-[11px] text-[#166534]/90">
                              Upon booking, you will automatically receive an official confirmation email & SMS with your tracking reference code and assigned regional agronomist details.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Bottom Action Controls: Clear Exit / Cancel + Fast Submit */}
                      <div className="pt-3 border-t border-slate-200 mt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
                        <button
                          type="button"
                          onClick={closeBookingModal}
                          disabled={isSubmittingBooking}
                          className="w-full sm:w-auto py-2.5 sm:py-3 px-5 rounded-none border border-slate-300 text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-100 active:scale-[0.99] transition cursor-pointer text-center"
                        >
                          Cancel / Exit
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingBooking}
                          className="w-full sm:w-auto py-2.5 sm:py-3 px-7 rounded-none bg-[#16A34A] text-white font-bold text-xs sm:text-sm hover:bg-[#15803D] active:scale-[0.99] transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                        >
                          {isSubmittingBooking ? (
                            <>
                              <span className="inline-block h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              {selectedSubservice.id === "lease_land" ? "Connecting to WhatsApp..." : "Submitting..."}
                            </>
                          ) : selectedSubservice.id === "lease_land" ? (
                            <>
                              <WhatsAppIcon className="h-4 w-4 fill-white" />
                              <span>Request Available Lands on WhatsApp</span>
                              <ArrowRight className="h-4 w-4" />
                            </>
                          ) : (
                            <>
                              Submit Service Booking
                              <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}

                  {bookingStep === 3 && (
                    <div className="text-center py-4 sm:py-6 space-y-3 sm:space-y-4">
                      <div className="h-14 w-14 sm:h-16 sm:w-16 bg-[#E5F5D0] text-[#16A34A] rounded-none flex items-center justify-center mx-auto shadow-sm">
                        {selectedSubservice.id === "lease_land" ? (
                          <WhatsAppIcon className="h-8 w-8 text-[#16A34A]" />
                        ) : (
                          <Check className="h-7 w-7 sm:h-8 sm:w-8 stroke-[3]" />
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] sm:text-[11px] font-bold text-[#16A34A] uppercase tracking-wider block">
                          {selectedSubservice.id === "lease_land" ? "LAND LEASING REQUEST LOGGED" : "REQUEST CONFIRMED & LOGGED"}
                        </span>
                        <h4 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-['Outfit',sans-serif]">
                          {selectedSubservice.id === "lease_land" ? "Request Dispatched to WhatsApp!" : "Service Booking Confirmed!"}
                        </h4>
                      </div>

                      {/* Reference Badge */}
                      <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-300 px-3.5 py-1.5 sm:px-4 sm:py-2 font-mono font-bold text-slate-900 text-xs sm:text-sm">
                        <span className="text-slate-500 font-sans font-normal text-xs">Reference:</span>
                        <span className="text-[#16A34A]">{bookingReference}</span>
                      </div>

                      {selectedSubservice.id === "lease_land" ? (
                        <>
                          <p className="text-xs text-slate-600 max-w-md mx-auto pt-1">
                            Your land leasing request has been logged. Our Farmland Desk was launched on WhatsApp with your requested criteria. If WhatsApp did not open automatically, tap below to start chatting:
                          </p>
                          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                            <a
                              href={`https://wa.me/254723346134?text=${encodeURIComponent(
                                `Jambo Mqulima Agri-Desk! 🌿\n\nI am requesting available lands for leasing.\n\n📋 *Tracking Ref*: ${bookingReference || "MQ-SRV-LEASING"}\n👤 *Farmer / Client*: ${farmerName || user?.name || "Farmer"}\n📞 *Phone*: ${phone}\n📍 *County*: ${county}\n🌾 *Desired Land Size*: ${farmScale || "Open to options"}\n\nPlease share currently available verified farmland parcels and lease terms. Asante!`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2.5 sm:py-3 px-6 rounded-none bg-[#25D366] text-white font-bold text-xs sm:text-sm hover:bg-[#1EBE5D] transition cursor-pointer shadow-sm"
                            >
                              <WhatsAppIcon className="h-4 w-4 fill-white" />
                              <span>Continue to WhatsApp</span>
                            </a>
                            <button
                              type="button"
                              onClick={closeBookingModal}
                              className="w-full sm:w-auto py-2.5 sm:py-3 px-6 rounded-none bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-200 transition cursor-pointer"
                            >
                              Done / Close
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Delivery confirmations summary cards */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-md mx-auto text-left pt-1">
                            <div className="bg-slate-50 border border-slate-200 p-2.5 sm:p-3 rounded-none">
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-0.5">
                                <Mail className="h-3.5 w-3.5 text-[#16A34A]" />
                                <span>Email Confirmation</span>
                              </div>
                              <p className="text-[11px] text-slate-600 truncate">
                                Sent to <strong>{email || user?.email}</strong>
                              </p>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 p-2.5 sm:p-3 rounded-none">
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-0.5">
                                <Phone className="h-3.5 w-3.5 text-[#16A34A]" />
                                <span>SMS Notification</span>
                              </div>
                              <p className="text-[11px] text-slate-600 truncate">
                                Sent to <strong>{phone}</strong>
                              </p>
                            </div>
                          </div>

                          <p className="text-xs text-slate-600 max-w-md mx-auto pt-1">
                            An assigned regional field agronomist has received your request and will contact you directly on <strong>{phone}</strong> to coordinate on-site logistics.
                          </p>

                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={closeBookingModal}
                              className="w-full sm:w-auto py-2.5 sm:py-3 px-8 rounded-none bg-[#0F291E] text-white font-bold text-xs sm:text-sm hover:bg-[#16A34A] transition cursor-pointer"
                            >
                              Done / Close
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </AppLayout>
  );
}
