import p1Img from "@/assets/products/p1.jpg";
import p2Img from "@/assets/products/p2.jpg";
import p3Img from "@/assets/products/p3.jpg";
import p4Img from "@/assets/products/p4.jpg";
import p5Img from "@/assets/products/p5.jpg";
import p6Img from "@/assets/products/p6.jpg";
import p7Img from "@/assets/products/p7.jpg";
import p8Img from "@/assets/products/p8.jpg";

export type Product = {
  id: string;
  name: string;
  category: "Pesticides" | "Fertilizers" | "Seeds" | "Livestock" | "Equipment";
  price: number;
  unit: string;
  brand: string;
  stock: number;
  image: string;
  description: string;
  badge?: string;
};

export const products: Product[] = [
  { id: "p1", name: "Mavuno Planting Fertilizer", category: "Fertilizers", price: 3450, unit: "50kg bag", brand: "Mavuno", stock: 124, image: p1Img, description: "Balanced NPK for maize, beans and vegetables. Boosts root development.", badge: "Bestseller" },
  { id: "p2", name: "DK 8031 Hybrid Maize Seed", category: "Seeds", price: 680, unit: "2kg pack", brand: "Dekalb", stock: 312, image: p2Img, description: "Drought-tolerant hybrid, matures in 120 days. Ideal for Rift Valley." },
  { id: "p3", name: "Ridomil Gold MZ 68WG", category: "Pesticides", price: 1250, unit: "1kg", brand: "Syngenta", stock: 88, image: p3Img, description: "Systemic fungicide for late blight in tomatoes and potatoes.", badge: "New" },
  { id: "p4", name: "Maclick Super Dewormer", category: "Livestock", price: 980, unit: "500ml", brand: "Norbrook", stock: 56, image: p4Img, description: "Broad-spectrum dewormer for cattle, sheep and goats." },
  { id: "p5", name: "CAN Top Dressing Fertilizer", category: "Fertilizers", price: 3200, unit: "50kg bag", brand: "Yara", stock: 210, image: p5Img, description: "Calcium Ammonium Nitrate — fast nitrogen release for top dressing." },
  { id: "p6", name: "Knapsack Sprayer 16L", category: "Equipment", price: 4500, unit: "1 unit", brand: "Cooper", stock: 34, image: p6Img, description: "Heavy-duty manual sprayer with adjustable nozzle and brass lance." },
  { id: "p7", name: "Sukari F1 Tomato Seed", category: "Seeds", price: 1850, unit: "10g", brand: "Royal Seed", stock: 142, image: p7Img, description: "Determinate hybrid, high yielding, resistant to bacterial wilt." },
  { id: "p8", name: "Layers Mash Premium", category: "Livestock", price: 3650, unit: "70kg", brand: "Unga Feeds", stock: 78, image: p8Img, description: "Complete ration for laying hens. Boosts egg production and shell quality.", badge: "Bulk -10%" },
];

export const services = [
  { id: "vet", name: "Vet Appointment", icon: "🩺", description: "Expert vets at your farm gate within 24 hours.", fields: ["Animal type", "Issue description", "Farm location", "Preferred date & time"], price: "From KES 1,500" },
  { id: "soil", name: "Soil Testing", icon: "🧫", description: "Lab-grade analysis with crop-specific recommendations.", fields: ["Farm size (acres)", "Crop type", "GPS / county"], price: "From KES 2,500" },
  { id: "silage", name: "Silage Shredding", icon: "⚙️", description: "Mobile shredders delivered to your farm. Same-day service.", fields: ["Forage type", "Quantity (tonnes)", "Preferred date"], price: "KES 800 / tonne" },
  { id: "ai", name: "Artificial Insemination", icon: "🧬", description: "Premium dairy genetics from certified technicians.", fields: ["Breed", "Number of animals", "Location"], price: "From KES 3,000" },
  { id: "machinery", name: "Machinery Rental", icon: "🚜", description: "Tractors, ploughs, planters — rent by the hour or day.", fields: ["Equipment type", "Duration", "Farm location"], price: "From KES 2,000/hr" },
  { id: "advisory", name: "Advisory Services", icon: "🧠", description: "1-on-1 with agronomists and farm business experts.", fields: ["Topic", "Farm type", "Preferred expert"], price: "From KES 1,000" },
];

export const counties = ["Uasin Gishu", "Trans Nzoia", "Nakuru", "Kiambu", "Meru", "Kakamega", "Bungoma", "Nyeri", "Machakos", "Kisii", "Kericho", "Nandi", "Bomet", "Murang'a", "Embu", "Tharaka Nithi", "Vihiga", "Migori", "Homa Bay", "Siaya"];

export const marketPrices = [
  { item: "Maize (90kg)", price: 4800, change: +3.2, market: "Eldoret" },
  { item: "Milk (litre)", price: 55, change: +1.5, market: "Nakuru" },
  { item: "Tomatoes (crate)", price: 6500, change: -4.1, market: "Kongowea" },
  { item: "Beans (90kg)", price: 11200, change: +2.8, market: "Kitale" },
  { item: "Irish Potatoes (50kg)", price: 3800, change: +0.5, market: "Nyandarua" },
  { item: "Avocado (kg)", price: 95, change: +6.2, market: "Murang'a" },
];

export const articles = [
  { id: "a1", category: "Crops", title: "How to double your maize yield in the long rains", excerpt: "A field-tested 5-step protocol from Trans Nzoia smallholders averaging 45 bags/acre.", readTime: "6 min" },
  { id: "a2", category: "Livestock", title: "Mastitis prevention: a dairy farmer's playbook", excerpt: "Cut your cow's mastitis incidence by 70% with this milking routine.", readTime: "4 min" },
  { id: "a3", category: "Climate", title: "Reading the 2026 long-rains forecast for Western Kenya", excerpt: "What KMD's outlook means for your planting calendar this season.", readTime: "5 min" },
  { id: "a4", category: "Business", title: "From smallholder to agripreneur: pricing your produce right", excerpt: "Stop selling at farm-gate prices. Here's how to access premium markets.", readTime: "7 min" },
];

export const aiSymptoms = [
  { id: "yellow", label: "Yellowing leaves", diagnoses: [{ cause: "Nitrogen deficiency", product: "p5", tip: "Apply CAN at 50kg/acre two weeks after germination." }] },
  { id: "stunted", label: "Stunted growth", diagnoses: [{ cause: "Phosphorus deficiency or poor soil", product: "p1", tip: "Book a soil test for an accurate prescription." }] },
  { id: "pest", label: "Pest damage on leaves", diagnoses: [{ cause: "Fall armyworm or aphids", product: "p3", tip: "Spray early morning. Re-apply after 7 days if needed." }] },
  { id: "wilt", label: "Wilting plants", diagnoses: [{ cause: "Bacterial wilt or under-watering", product: "p7", tip: "Switch to resistant varieties. Improve drainage." }] },
  { id: "spots", label: "Brown spots on leaves", diagnoses: [{ cause: "Late blight (fungal)", product: "p3", tip: "Apply preventatively in wet weather." }] },
];

export const stats = [
  { label: "Farmers Served", value: "5,000+" },
  { label: "Products Available", value: "317" },
  { label: "Counties Reached", value: "20+" },
  { label: "Consultations Done", value: "1,200+" },
  { label: "Avg. Yield Increase", value: "38%" },
  { label: "Same-Day Deliveries", value: "94%" },
];
