import React from "react";
import { Users, ShieldCheck, MapPin, UserPlus } from "lucide-react";
import { FarmerProfile } from "../types/community.types";
import { resolveAvatar } from "@/shared/utils/avatar.utils";

interface Props {
  farmers: FarmerProfile[];
}

export const FarmerDirectory: React.FC<Props> = ({ farmers }) => {
  const defaultFarmers: FarmerProfile[] = [
    {
      username: "@grace_wambui",
      name: "Grace Wambui",
      country: "Kenya",
      county: "Kiambu",
      interests: ["Avocado Farming", "Organic Pest Control"],
      crops: ["Hass Avocado", "Macadamia"],
      livestock: ["Dairy Cows"],
      yearsFarming: 8,
      certifications: ["GlobalGAP Certified"],
      reputationScore: 480,
      followersCount: 142,
      followers: [],
    },
    {
      username: "@abel_kibet",
      name: "Abel Kibet",
      country: "Kenya",
      county: "Uasin Gishu",
      interests: ["Grain Storage", "Drip Irrigation"],
      crops: ["Maize", "Wheat"],
      livestock: [],
      yearsFarming: 12,
      certifications: ["KEPHIS Seed Grower"],
      reputationScore: 890,
      followersCount: 310,
      followers: [],
    }
  ];

  const farmerList = farmers && farmers.length > 0 ? farmers : defaultFarmers;

  return (
    <div className="space-y-4">
      <div className="bg-[#0C1510] border border-[#1B3627] p-4 rounded-2xl flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white">Farmer Network Directory</h2>
          <p className="text-xs text-white/60">Connect with certified local producers and extension experts in your county.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {farmerList.map((f, i) => (
          <div key={f.username || i} className="bg-[#0C1510] border border-[#1B3627] p-4 rounded-2xl space-y-3 hover:border-[#2D6A4F]/60 transition-all">
            <div className="flex items-center gap-3">
              <img
                src={resolveAvatar(f.avatarUrl, f.name)}
                alt={f.name}
                className="h-10 w-10 rounded-full object-cover border border-[#2D6A4F]/40"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <h3 className="text-xs font-bold text-white truncate">{f.name}</h3>
                  <ShieldCheck className="h-3.5 w-3.5 text-[#4CAF50] shrink-0" />
                </div>
                <div className="text-[11px] text-white/50">{f.username}</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-white/60">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-emerald-400" />
                {f.county}
              </span>
              <span>{f.yearsFarming} yrs farming</span>
            </div>

            {f.crops && f.crops.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {f.crops.slice(0, 3).map((crop, idx) => (
                  <span key={idx} className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px] text-emerald-300">
                    {crop}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
