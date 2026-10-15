// ============================================================================
// WeatherPanel.tsx — Ultra-Modern Dribbble-Style Weather Dashboard
// Inspired by Clean Minimalist Aesthetics with Integrated Agro-Intelligence
// ============================================================================

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  Navigation,
  Compass,
  MapPin,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  Snowflake,
  Wind,
  Droplets,
  Eye,
  Leaf,
  Check,
  Sparkles,
  Zap,
  X,
  Moon,
  Clock
} from "lucide-react";
import { useWeather, KENYA_COUNTIES, resolveLabel, type CountyName, type UseWeatherState } from "@/hooks/useWeather";
import type { DailyForecast, HourlySnapshot } from "@/lib/weather-types";

// Direction lookup
function getWindDirection(deg: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

// Convert Celsius to Fahrenheit
function toUnit(celsius: number, isFahrenheit: boolean): number {
  if (isFahrenheit) {
    return Math.round((celsius * 9) / 5 + 32);
  }
  return Math.round(celsius);
}

// Format Sunrise and Sunset ISO timestamps into "6:35 AM"
function formatSunTime(iso: string): string {
  if (!iso) return "--:--";
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-KE", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Africa/Nairobi",
    });
  } catch {
    return iso.substring(11, 16);
  }
}

// Kenyan Clock Hook
function useKenyaClock() {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!mounted) {
    return { dayName: "Monday", timeString: "16:00" };
  }

  const dayName = now.toLocaleDateString("en-KE", {
    weekday: "long",
    timeZone: "Africa/Nairobi",
  });

  const timeString = now.toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Africa/Nairobi",
  });

  return { dayName, timeString };
}

// Calculate if it is currently night time in Kenya based on real sunrise/sunset times
function isNightNowInKenya(sunriseIso?: string, sunsetIso?: string, apiIsDay?: boolean): boolean {
  try {
    const now = new Date();
    const kenyaHour = parseInt(
      now.toLocaleTimeString("en-US", { hour: "numeric", hour12: false, timeZone: "Africa/Nairobi" }),
      10
    );
    const kenyaMin = parseInt(
      now.toLocaleTimeString("en-US", { minute: "numeric", timeZone: "Africa/Nairobi" }),
      10
    );
    const currentMins = kenyaHour * 60 + kenyaMin;

    if (sunriseIso && sunsetIso) {
      const rParts = sunriseIso.split("T")[1]?.split(":") ?? ["06", "25"];
      const sParts = sunsetIso.split("T")[1]?.split(":") ?? ["18", "35"];
      const riseMins = parseInt(rParts[0], 10) * 60 + parseInt(rParts[1], 10);
      const setMins = parseInt(sParts[0], 10) * 60 + parseInt(sParts[1], 10);
      return currentMins < riseMins || currentMins >= setMins;
    }

    if (apiIsDay !== undefined) {
      return !apiIsDay;
    }

    return kenyaHour < 6 || kenyaHour >= 19;
  } catch {
    const h = new Date().getHours();
    return h < 6 || h >= 19;
  }
}

interface HourlyCardData {
  timeLabel: string;
  subLabel?: string;
  temp: number;
  weatherCode: number;
  isNight: boolean;
  rainProb: number;
}

function getHourlyForecastCards(
  data: WeatherViewModel | null,
  isFahrenheit: boolean,
  currentIsNight: boolean
): HourlyCardData[] {
  const currentTemp = data?.current.temperature_2m ?? 21;
  const currentCode = data?.current.weather_code ?? 2;
  const currentRain = data?.daily[0]?.precipitationProbMax ?? 30;
  const sunrise = data?.daily[0]?.sunrise;
  const sunset = data?.daily[0]?.sunset;

  const hourlyTimes = data?.raw?.hourly?.time;
  const hourlyTemps = data?.raw?.hourly?.temperature_2m;
  const hourlyRain = data?.raw?.hourly?.precipitation_probability;
  const hourlyCodes = data?.raw?.hourly?.weather_code;
  const hourlyIsDay = data?.raw?.hourly?.is_day;

  const now = new Date();
  const kenyaHourStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    hour12: false,
    timeZone: "Africa/Nairobi",
  });
  const kenyaHour = parseInt(kenyaHourStr, 10);
  const kenyaMinStr = now.toLocaleTimeString("en-US", {
    minute: "2-digit",
    timeZone: "Africa/Nairobi",
  });

  const rParts = sunrise?.split("T")[1]?.split(":") ?? ["06", "25"];
  const sParts = sunset?.split("T")[1]?.split(":") ?? ["18", "35"];
  const riseMins = parseInt(rParts[0], 10) * 60 + parseInt(rParts[1], 10);
  const setMins = parseInt(sParts[0], 10) * 60 + parseInt(sParts[1], 10);

  if (hourlyTimes && hourlyTemps && hourlyTimes.length > 0) {
    const kenyaDateStr = now.toLocaleDateString("en-CA", {
      timeZone: "Africa/Nairobi",
    });
    const prefix = `${kenyaDateStr}T${kenyaHour.toString().padStart(2, "0")}`;

    let startIndex = hourlyTimes.findIndex((t) => t.startsWith(prefix));
    if (startIndex === -1) {
      startIndex = Math.min(kenyaHour, hourlyTimes.length - 1);
    }

    const cards: HourlyCardData[] = [];
    for (let i = 0; i < 7; i++) {
      const idx = startIndex + (i === 0 ? 0 : i * 2);
      if (idx >= hourlyTimes.length) break;

      const timeStr = hourlyTimes[idx];
      const hPart = timeStr.split("T")[1]?.substring(0, 5) ?? "00:00";
      const hNum = parseInt(hPart.split(":")[0], 10);

      let slotNight = false;
      if (hourlyIsDay && hourlyIsDay[idx] !== undefined) {
        slotNight = hourlyIsDay[idx] === 0;
      } else {
        const hMins = hNum * 60;
        slotNight = hMins < riseMins || hMins >= setMins;
      }

      const tempVal = hourlyTemps[idx] ?? currentTemp;
      const rainVal = hourlyRain ? (hourlyRain[idx] ?? currentRain) : currentRain;
      const codeVal = hourlyCodes ? (hourlyCodes[idx] ?? currentCode) : currentCode;

      cards.push({
        timeLabel: i === 0 ? "Now" : hPart,
        subLabel: i === 0 ? `${kenyaHourStr}:${kenyaMinStr}` : hNum >= 12 ? "PM" : "AM",
        temp: toUnit(tempVal, isFahrenheit),
        weatherCode: codeVal,
        isNight: slotNight,
        rainProb: rainVal,
      });
    }

    if (cards.length >= 4) return cards;
  }

  // Fallback 7 hours
  return Array.from({ length: 7 }, (_, i) => {
    const slotHour = (kenyaHour + i * 2) % 24;
    const hMins = slotHour * 60;
    const slotNight = hMins < riseMins || hMins >= setMins;
    const hourLabel = i === 0 ? "Now" : `${slotHour.toString().padStart(2, "0")}:00`;
    const tempDelta = slotNight ? -Math.min(i, 3) : Math.max(0, 4 - Math.abs(slotHour - 14));

    return {
      timeLabel: hourLabel,
      subLabel: i === 0 ? `${kenyaHourStr}:${kenyaMinStr}` : slotHour >= 12 ? "PM" : "AM",
      temp: toUnit(currentTemp + tempDelta, isFahrenheit),
      weatherCode: currentCode,
      isNight: slotNight,
      rainProb: currentRain,
    };
  });
}

// Minimalist Iconic Weather Graphic (Day Sun or Night Moon + Cloud + Blue Rain Bars)
function HeroWeatherGraphic({
  code,
  isRainy,
  isNight = false
}: {
  code: number;
  isRainy: boolean;
  isNight?: boolean;
}) {
  const isRain = isRainy || (code >= 51 && code <= 67) || (code >= 80 && code <= 82);
  const isStorm = code >= 95;
  const isCloudy = code >= 2 && code <= 48;

  return (
    <div className="relative w-44 h-36 mx-auto flex items-center justify-center select-none my-2">
      {isNight ? (
        /* ── NIGHT CELESTIAL GRAPHIC (Glow Moon + Stars + Cloud + Rain Bars) ── */
        <div className="relative">
          {/* Glowing Moon Sphere with Indigo Night Aura */}
          <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 shadow-xl shadow-indigo-950/40 flex items-center justify-center transform -translate-x-3 -translate-y-1 relative border border-indigo-400/25 overflow-hidden">
            {/* Soft Pearl-Gold Moon Disc */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-100/90 via-slate-100 to-white shadow-inner flex items-center justify-center relative">
              {/* Moon Craters */}
              <div className="absolute top-3 left-4 w-3.5 h-3.5 rounded-full bg-slate-300/40" />
              <div className="absolute bottom-4 left-6 w-5 h-5 rounded-full bg-slate-300/35" />
              <div className="absolute top-8 right-4 w-2.5 h-2.5 rounded-full bg-slate-300/30" />
              {/* Crescent Shadow Overlay */}
              <div className="absolute -top-1 -right-2 w-16 h-16 rounded-full bg-gradient-to-bl from-indigo-950/50 to-transparent" />
            </div>
          </div>

          {/* Twinkling Night Stars */}
          <div className="absolute -top-2 right-1 text-amber-200 text-xs animate-pulse">✦</div>
          <div className="absolute top-2 -left-2 text-indigo-200 text-[10px] animate-pulse [animation-delay:400ms]">★</div>
          <div className="absolute bottom-1 right-2 text-amber-100 text-[9px] animate-pulse [animation-delay:800ms]">✦</div>

          {/* Soft Night Cloud Silhouette Outline */}
          <div className="absolute -top-3 -left-3 w-32 h-20">
            <svg viewBox="0 0 100 65" className="w-full h-full fill-slate-800/85 stroke-indigo-400/40 stroke-[1.5] drop-shadow-xs">
              <path d="M 25,55 A 18,18 0 0,1 30,22 A 25,25 0 0,1 70,22 A 18,18 0 0,1 82,55 Z" />
            </svg>
          </div>

          {/* Rain Bars (Iconic Blue Vertical Bars matching Dribbble reference) */}
          {isRain && (
            <div className="absolute right-0 top-12 flex gap-1.5 transform translate-x-3">
              <div className="w-1.5 h-10 rounded-full bg-[#3D5AFE] animate-pulse shadow-xs shadow-blue-500/50" />
              <div className="w-1.5 h-12 rounded-full bg-[#3D5AFE] animate-pulse shadow-xs shadow-blue-500/50 [animation-delay:150ms]" />
              <div className="w-1.5 h-12 rounded-full bg-[#3D5AFE] animate-pulse shadow-xs shadow-blue-500/50 [animation-delay:300ms]" />
              <div className="w-1.5 h-10 rounded-full bg-[#3D5AFE] animate-pulse shadow-xs shadow-blue-500/50 [animation-delay:450ms]" />
            </div>
          )}

          {/* Storm Lightning if thunderstorm */}
          {isStorm && (
            <div className="absolute right-1 top-10 text-amber-400 animate-bounce">
              <Zap className="h-8 w-8 fill-amber-300 drop-shadow-md" />
            </div>
          )}
        </div>
      ) : (
        /* ── DAY SUN GRAPHIC (Sun disc + Cloud + Rain Bars) ── */
        <div className="relative">
          <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-[#FFAA00] via-[#FFB703] to-[#FCD34D] shadow-lg shadow-amber-400/30 flex items-center justify-center transform -translate-x-3 -translate-y-1">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400/20 to-transparent pointer-events-none" />
          </div>

          <div className="absolute -top-3 -left-3 w-32 h-20">
            <svg viewBox="0 0 100 65" className="w-full h-full fill-white/80 stroke-slate-200/80 stroke-[2] drop-shadow-xs">
              <path d="M 25,55 A 18,18 0 0,1 30,22 A 25,25 0 0,1 70,22 A 18,18 0 0,1 82,55 Z" />
            </svg>
          </div>

          {isRain && (
            <div className="absolute right-0 top-12 flex gap-1.5 transform translate-x-3">
              <div className="w-1.5 h-10 rounded-full bg-[#3D5AFE] animate-pulse" />
              <div className="w-1.5 h-12 rounded-full bg-[#3D5AFE] animate-pulse [animation-delay:150ms]" />
              <div className="w-1.5 h-12 rounded-full bg-[#3D5AFE] animate-pulse [animation-delay:300ms]" />
              <div className="w-1.5 h-10 rounded-full bg-[#3D5AFE] animate-pulse [animation-delay:450ms]" />
            </div>
          )}

          {isStorm && (
            <div className="absolute right-1 top-10 text-amber-500 animate-bounce">
              <Zap className="h-8 w-8 fill-amber-400" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Mini weather icon for forecast cards (Day & Night Aware)
function MiniWeatherIcon({
  code,
  isNight = false,
  className = "h-7 w-7"
}: {
  code: number;
  isNight?: boolean;
  className?: string;
}) {
  // Thunderstorm
  if (code >= 95) {
    return (
      <div className="relative w-6 h-6 flex items-center justify-center my-1">
        <CloudLightning className="h-5 w-5 text-amber-500" />
      </div>
    );
  }

  // Rain / Drizzle
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return (
      <div className="relative w-7 h-7 flex items-center justify-center my-1">
        {isNight ? (
          <div className="w-3.5 h-3.5 rounded-full bg-slate-800 border border-indigo-400/40 absolute top-0.5 left-0.5 flex items-center justify-center">
            <Moon className="h-2 w-2 text-amber-200 fill-amber-200/50" />
          </div>
        ) : (
          <div className="w-3.5 h-3.5 rounded-full bg-amber-400 absolute top-0.5 left-0.5" />
        )}
        <Cloud className={`h-4 w-4 absolute bottom-1 right-0 ${isNight ? "text-slate-400" : "text-slate-300"}`} />
        <div className="flex gap-0.5 absolute -bottom-1 right-1">
          <div className="w-0.5 h-2.5 bg-[#3D5AFE] rounded-full" />
          <div className="w-0.5 h-2.5 bg-[#3D5AFE] rounded-full" />
        </div>
      </div>
    );
  }

  // Clear Sky / Mainly Clear
  if (code === 0 || code === 1) {
    if (isNight) {
      return (
        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-slate-800 to-indigo-950 border border-indigo-400/30 shadow-2xs flex items-center justify-center my-1">
          <Moon className="h-3.5 w-3.5 text-amber-200 fill-amber-200/40" />
        </div>
      );
    }
    return (
      <div className="w-6 h-6 rounded-full bg-[#FFAA00] shadow-xs shadow-amber-400/50 flex items-center justify-center my-1">
        <Sun className="h-4 w-4 text-white" />
      </div>
    );
  }

  // Partly Cloudy / Overcast / Fog
  if (code >= 2 && code <= 48) {
    return (
      <div className="relative w-6 h-6 flex items-center justify-center my-1">
        {isNight ? (
          <>
            <Moon className="h-3 w-3 text-amber-200 fill-amber-200/40 absolute top-0 left-0" />
            <Cloud className="h-4 w-4 text-slate-400 absolute bottom-0 right-0" />
          </>
        ) : (
          <>
            <div className="w-3 h-3 rounded-full bg-amber-400 absolute top-0 left-0.5" />
            <Cloud className="h-4 w-4 text-slate-400 absolute bottom-0 right-0" />
          </>
        )}
      </div>
    );
  }

  // Default fallback
  if (isNight) {
    return (
      <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center my-1">
        <Moon className="h-3.5 w-3.5 text-amber-200" />
      </div>
    );
  }

  return (
    <div className="w-6 h-6 rounded-full bg-[#FFAA00] flex items-center justify-center my-1">
      <Sun className="h-4 w-4 text-white" />
    </div>
  );
}

// Semicircular Radial Gauge for UV Index
function UvIndexGauge({ value }: { value: number }) {
  const max = 12;
  const clamped = Math.min(Math.max(value, 0), max);
  const percentage = clamped / max;
  
  // Circumference of semi-circle with r=46
  // Total arc length = PI * r = 144.5
  const strokeDashoffset = 144.5 * (1 - percentage);

  return (
    <div className="relative w-36 h-20 mx-auto flex items-end justify-center">
      <svg className="w-36 h-20 overflow-visible" viewBox="0 0 120 70">
        {/* Background Track Arc */}
        <path
          d="M 14,64 A 46,46 0 0,1 106,64"
          fill="none"
          stroke="#E9ECEF"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Active Progress Arc */}
        <path
          d="M 14,64 A 46,46 0 0,1 106,64"
          fill="none"
          stroke="url(#uv-gradient)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray="144.5"
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700 ease-out"
        />
        <defs>
          <linearGradient id="uv-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFAA00" />
            <stop offset="100%" stopColor="#FF7A00" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center Value */}
      <div className="absolute bottom-1 font-bold text-3xl text-slate-800 leading-none">
        {clamped}
      </div>
    </div>
  );
}

// Vertical pill slider component (used for Humidity & Air Quality)
function VerticalPillSlider({ percentage, color = "#3D5AFE" }: { percentage: number; color?: string }) {
  const clamped = Math.min(Math.max(percentage, 5), 95);

  return (
    <div className="w-5 h-16 rounded-full bg-slate-100 p-0.5 relative flex justify-center items-center">
      <div
        className="w-3.5 h-3.5 rounded-full absolute transition-all duration-500 shadow-xs"
        style={{
          bottom: `${clamped}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
}

// Major towns & common search aliases mapped to Kenyan counties
const COUNTY_ALIASES: Record<string, string[]> = {
  "Baringo": ["Kabarnet", "Eldama Ravine", "Marigat", "Mogotio"],
  "Bomet": ["Sotik", "Chepalungu", "Longisa"],
  "Bungoma": ["Webuye", "Kimilili", "Sirisia", "Kanduyi"],
  "Busia": ["Malaba", "Nambale", "Funyula"],
  "Elgeyo-Marakwet": ["Elgeyo Marakwet", "Iten", "Kapsowar", "Tambach"],
  "Embu": ["Runyenjes", "Siakago", "Manyatta"],
  "Garissa": ["Dadaab", "Masalani", "Bura"],
  "Homa Bay": ["Homabay", "Mbita", "Oyugis", "Kendubay"],
  "Isiolo": ["Merti", "Garbatulla"],
  "Kajiado": ["Ngong", "Kitengela", "Ongata Rongai", "Loitokitok", "Kiserian"],
  "Kakamega": ["Mumias", "Lugari", "Malava", "Butere"],
  "Kericho": ["Litein", "Londiani", "Kipkelion"],
  "Kiambu": ["Thika", "Ruiru", "Kikuyu", "Limuru", "Githunguri", "Kiambu Town"],
  "Kilifi": ["Malindi", "Watamu", "Mtwapa", "Mariakani", "Kilifi Town"],
  "Kirinyaga": ["Kerugoya", "Kutus", "Sagana", "Mwea", "Wang'uru"],
  "Kisii": ["Ogembo", "Suneka", "Nyamache", "Kisii Town"],
  "Kisumu": ["Maseno", "Ahero", "Muhoroni", "Kondele", "Kisumu City"],
  "Kitui": ["Mwingi", "Mutomo", "Kitui Town"],
  "Kwale": ["Diani", "Msambweni", "Ukunda", "Kinango", "Lunga Lunga"],
  "Laikipia": ["Nanyuki", "Nyahururu", "Rumuruti", "Doldol"],
  "Lamu": ["Mpeketoni", "Lamu Island", "Shela", "Faza"],
  "Machakos": ["Athi River", "Kangundo", "Tala", "Mavoko", "Machakos Town"],
  "Makueni": ["Wote", "Emali", "Kibwezi", "Makindu", "Mtito Andei"],
  "Mandera": ["Rhamu", "Elwak"],
  "Marsabit": ["Moyale", "North Horr", "Laisamis"],
  "Meru": ["Maua", "Nkubu", "Timau", "Makutano", "Meru Town"],
  "Migori": ["Rongo", "Awendo", "Isebania", "Kehancha"],
  "Mombasa": ["Nyali", "Likoni", "Changamwe", "Kisauni", "Bamburi", "Mombasa City"],
  "Murang'a": ["Muranga", "Kenol", "Kangema", "Maragua"],
  "Nairobi": ["Nairobi City", "Westlands", "Karen", "Kasarani", "Embakasi", "CBD"],
  "Nakuru": ["Naivasha", "Molo", "Gilgil", "Njoro", "Rongai", "Nakuru City"],
  "Nandi": ["Kapsabet", "Nandi Hills", "Mosoriot"],
  "Narok": ["Kilgoris", "Maasai Mara", "Narok Town"],
  "Nyamira": ["Keroka", "Nyansiongo", "Manga"],
  "Nyandarua": ["Ol Kalou", "Engineer", "Ndaragwa"],
  "Nyeri": ["Karatina", "Othaya", "Mukurweini", "Nyeri Town"],
  "Samburu": ["Maralal", "Baragoi", "Wamba"],
  "Siaya": ["Bondo", "Ugunja", "Yala", "Usenge"],
  "Taita-Taveta": ["Taita Taveta", "Voi", "Wundanyi", "Taveta", "Mwatate"],
  "Tana River": ["Hola", "Garsen", "Madogo"],
  "Tharaka-Nithi": ["Tharaka Nithi", "Chuka", "Marimanti"],
  "Trans Nzoia": ["Kitale", "Kiminini", "Endebess"],
  "Turkana": ["Lodwar", "Kakuma", "Lokichogio"],
  "Uasin Gishu": ["Eldoret", "Turbo", "Moiben", "Burnt Forest", "Eldoret City"],
  "Vihiga": ["Mbale", "Chavakali", "Luanda", "Hamisi"],
  "Wajir": ["Habaswein", "Griftu", "Bute"],
  "West Pokot": ["Kapenguria", "Chepareria", "Sigor"]
};

interface WeatherPanelProps {
  weatherState?: UseWeatherState;
}

export function WeatherPanel({ weatherState }: WeatherPanelProps = {}) {
  const localState = useWeather("Nairobi");
  const state = weatherState ?? localState;
  const {
    data,
    loading,
    error,
    location,
    selectCounty,
    detectGPS,
    refresh,
  } = state;

  const [isFahrenheit, setIsFahrenheit] = useState(false);
  const [activeTab, setActiveTab] = useState<"today" | "week">("week");
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedHourIndex, setSelectedHourIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [showAgroDetails, setShowAgroDetails] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { dayName, timeString } = useKenyaClock();
  const locationLabel = resolveLabel(location);
  
  // All 47 Kenya counties sorted alphabetically
  const countyList = useMemo(() => {
    return (Object.keys(KENYA_COUNTIES) as CountyName[]).sort((a, b) =>
      a.localeCompare(b)
    );
  }, []);

  const activeCounty = location.type === "county" ? location.county : null;

  // Filter counties by search term or major towns / aliases (Shows ALL 47 when query is empty)
  const filteredCounties = useMemo(() => {
    const raw = searchQuery.trim().toLowerCase();
    if (!raw) return countyList;
    const cleanQ = raw.replace(/[-'"]/g, " ");
    return countyList.filter((c) => {
      const cleanName = c.toLowerCase().replace(/[-'"]/g, " ");
      if (cleanName.includes(cleanQ) || c.toLowerCase().includes(raw)) return true;
      const aliases = COUNTY_ALIASES[c];
      if (aliases && aliases.some((a) => a.toLowerCase().includes(raw) || a.toLowerCase().replace(/[-'"]/g, " ").includes(cleanQ))) {
        return true;
      }
      return false;
    });
  }, [countyList, searchQuery]);

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Real-time Day / Night Detection in Kenya
  const isNight = isNightNowInKenya(data?.daily[0]?.sunrise, data?.daily[0]?.sunset, data?.isDay);

  // Hourly forecast slots for the "Today" tab (showing exact times & recognizing day/night transitions)
  const hourlyCards = useMemo(() => {
    return getHourlyForecastCards(data, isFahrenheit, isNight);
  }, [data, isFahrenheit, isNight]);

  // Current Temperature in selected unit
  const currentTemp = data ? toUnit(data.current.temperature_2m, isFahrenheit) : 22;
  const rainProb = data?.daily[0]?.precipitationProbMax ?? data?.hourlySnapshot?.precipProbability ?? 30;
  const weatherCode = data?.current.weather_code ?? 2;
  const isRainy = (data?.current.precipitation ?? 0) > 0 || rainProb > 40;

  // Highlights metrics
  const uvValue = data?.daily[0]?.uvIndexMax ?? 5;
  const windSpeedKmh = data ? data.current.wind_speed_10m.toFixed(2) : "7.70";
  const windDir = data ? getWindDirection(data.current.wind_direction_10m) : "WSW";
  const sunriseStr = data?.daily[0]?.sunrise ? formatSunTime(data.daily[0].sunrise) : "6:35 AM";
  const sunsetStr = data?.daily[0]?.sunset ? formatSunTime(data.daily[0].sunset) : "6:42 PM";
  const humidity = data?.current.relative_humidity_2m ?? 68;
  const cloudCover = data?.current.cloud_cover ?? 45;
  const visibilityKm = (10 - (cloudCover * 0.04)).toFixed(1);
  const sprayStatus = data?.advisory?.sprayWindow ?? "IDEAL";

  const handleCountySelect = (county: CountyName) => {
    selectCounty(county);
    setSearchQuery("");
    setSearchOpen(false);
  };

  return (
    <div className="w-full max-w-6xl mx-auto my-4 text-left font-['Open_Sans',sans-serif]">
      {/* ── Main Container (Rounded Dribbble Frame) ── */}
      <div className="bg-[#F6F6F8] rounded-[2.5rem] shadow-2xl shadow-slate-200/70 border border-slate-200/80 overflow-hidden">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">

          {/* ═════════════════════════════════════════════════════════════════
              LEFT COLUMN: SEARCH, WEATHER HERO ILLUSTRATION, MAIN TEMP
          ═════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-4 bg-white p-7 sm:p-9 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-100 relative">
            
            {/* Top Search Input & GPS Trigger */}
            <div className="relative" ref={searchRef}>
              <div className="flex items-center gap-2 bg-[#F6F6F8] rounded-full px-4 py-2.5 border border-transparent focus-within:border-slate-300 transition">
                <Search className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search 47 Kenyan counties..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  className="bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none w-full font-medium"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    title="Clear search"
                    className="p-1 rounded-full text-slate-400 hover:text-slate-800 transition cursor-pointer shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSearchOpen(!searchOpen)}
                    title="Toggle all 47 counties"
                    className="p-1 rounded-full text-slate-400 hover:text-slate-800 transition cursor-pointer shrink-0"
                  >
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${searchOpen ? "rotate-180" : ""}`} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={detectGPS}
                  title="Detect my current location via GPS"
                  className="p-1 rounded-full text-slate-400 hover:text-slate-800 hover:bg-white transition cursor-pointer shrink-0"
                >
                  <Navigation className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Autocomplete County Dropdown — Displays ALL 47 Kenyan Counties */}
              {searchOpen && (
                <div className="absolute top-12 left-0 right-0 z-50 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2.5 max-h-80 flex flex-col">
                  {/* Header with counter badge */}
                  <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-100 mb-1 shrink-0">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      All 47 Kenyan Counties
                    </span>
                    <span className="text-[10px] font-bold text-[#0F766E] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      {filteredCounties.length === 47 ? "47 Available" : `${filteredCounties.length} found`}
                    </span>
                  </div>

                  {/* Quick Farming Hub Pills (when not actively searching) */}
                  {!searchQuery.trim() && (
                    <div className="px-2 pt-1 pb-2 border-b border-slate-100 mb-1 shrink-0">
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-0.5">
                        Major Farming Hubs
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(["Nairobi", "Nakuru", "Uasin Gishu", "Kiambu", "Meru", "Kisumu", "Mombasa"] as CountyName[]).map((hub) => (
                          <button
                            key={hub}
                            type="button"
                            onClick={() => handleCountySelect(hub)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                              activeCounty === hub
                                ? "bg-[#0F766E] text-white shadow-xs"
                                : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-[#0F766E]"
                            }`}
                          >
                            {hub}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Scrollable list of ALL 47 counties */}
                  <div className="overflow-y-auto max-h-56 pr-1 space-y-0.5 overscroll-contain">
                    {filteredCounties.map((c) => {
                      const isSelected = activeCounty === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => handleCountySelect(c)}
                          className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-xl transition flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? "bg-emerald-50 text-[#0F766E] border border-emerald-200/60 font-bold"
                              : "text-slate-700 hover:bg-[#F6F6F8] hover:text-[#0F766E]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className={`h-3.5 w-3.5 ${isSelected ? "text-[#0F766E]" : "text-slate-300"}`} />
                            <span>{c} County</span>
                          </div>
                          {isSelected ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-[#0F766E]">
                              Selected
                              <Check className="h-3 w-3 stroke-[3]" />
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-300 font-normal">Kenya</span>
                          )}
                        </button>
                      );
                    })}
                    {filteredCounties.length === 0 && (
                      <div className="py-6 px-4 text-center">
                        <p className="text-xs font-semibold text-slate-600">No counties found</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Try searching by county name or town (e.g. Eldoret, Thika, Naivasha)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Weather Art Graphic — Dynamically adapts to Day Sun or Night Moon */}
            <div className="my-auto py-4">
              <HeroWeatherGraphic code={weatherCode} isRainy={isRainy} isNight={isNight} />

              {/* Main Temperature Number */}
              <div className="mt-4">
                <div className="flex items-start justify-start leading-none tracking-tight">
                  <span className="text-7xl sm:text-8xl font-light text-slate-800 tracking-tighter">
                    {currentTemp}
                  </span>
                  <span className="text-3xl sm:text-4xl font-normal text-slate-600 ml-1 mt-1">
                    °{isFahrenheit ? "F" : "C"}
                  </span>
                </div>

                {/* Day & Time with Real-Time Day/Night Recognition */}
                <div className="text-sm font-medium text-slate-500 mt-2 flex items-center gap-2">
                  <span className="text-slate-800 font-bold">{dayName}</span>,
                  <span className="text-slate-600">{timeString}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs ${
                      isNight
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200/70"
                        : "bg-amber-50 text-amber-700 border border-amber-200/70"
                    }`}
                  >
                    {isNight ? (
                      <Moon className="h-2.5 w-2.5 text-indigo-600 fill-indigo-600/30" />
                    ) : (
                      <Sun className="h-2.5 w-2.5 text-amber-500" />
                    )}
                    {isNight ? "Night" : "Day"}
                  </span>
                </div>
              </div>

              {/* Divider Line */}
              <div className="border-b border-slate-100 my-6" />

              {/* Weather Condition & Rain Percentage */}
              <div className="space-y-3 text-xs font-semibold text-slate-600">
                <div className="flex items-center gap-2.5">
                  {isNight ? (
                    <Moon className="h-4 w-4 text-indigo-500" />
                  ) : (
                    <Cloud className="h-4 w-4 text-slate-400" />
                  )}
                  <span>
                    {data?.conditionLabel
                      ? isNight && data.conditionLabel === "Clear Sky"
                        ? "Clear Night"
                        : isNight && data.conditionLabel === "Mainly Clear"
                        ? "Mainly Clear Night"
                        : isNight && data.conditionLabel === "Partly Cloudy"
                        ? "Partly Cloudy Night"
                        : data.conditionLabel
                      : isNight ? "Night Conditions" : "Mostly Cloudy"}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex gap-0.5 items-center">
                    <div className="w-1 h-3.5 bg-[#3D5AFE] rounded-full" />
                    <div className="w-1 h-3.5 bg-[#3D5AFE] rounded-full" />
                    <div className="w-1 h-3.5 bg-[#3D5AFE] rounded-full" />
                  </div>
                  <span>Rain - {rainProb}%</span>
                </div>
              </div>
            </div>

            {/* Bottom City / County Card with Landscape Photo */}
            <div className="mt-6 rounded-2xl overflow-hidden h-24 relative shadow-sm group">
              <img
                src="/images/mkulima_hero_farm.webp"
                alt={locationLabel}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent flex items-end p-3.5">
                <div className="flex items-center gap-1.5 text-white">
                  <MapPin className="h-3.5 w-3.5 text-[#FFAA00]" />
                  <span className="text-xs font-bold tracking-wide">{locationLabel}, Kenya</span>
                </div>
              </div>
            </div>

          </div>

          {/* ═════════════════════════════════════════════════════════════════
              RIGHT COLUMN: TOP BAR, WEEK FORECAST CARDS, TODAY'S HIGHLIGHTS
          ═════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-8 bg-[#F6F6F8] p-7 sm:p-9 space-y-7 flex flex-col justify-between">
            
            {/* Top Navigation & Controls */}
            <div className="flex items-center justify-between">
              {/* Tab Switcher: Today | Week */}
              <div className="flex items-center gap-6 text-sm font-bold">
                <button
                  onClick={() => setActiveTab("today")}
                  className={`pb-1 transition cursor-pointer ${
                    activeTab === "today"
                      ? "text-slate-900 border-b-2 border-slate-900"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setActiveTab("week")}
                  className={`pb-1 transition cursor-pointer ${
                    activeTab === "week"
                      ? "text-slate-900 border-b-2 border-slate-900"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  Week
                </button>
              </div>

              {/* Right Units & Profile Buttons */}
              <div className="flex items-center gap-3">
                {/* Temperature Unit Switcher (°C / °F) */}
                <div className="flex items-center bg-white rounded-full p-1 shadow-2xs border border-slate-200/60">
                  <button
                    onClick={() => setIsFahrenheit(false)}
                    className={`w-7 h-7 rounded-full text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                      !isFahrenheit ? "bg-black text-white" : "text-slate-500 hover:text-black"
                    }`}
                  >
                    °C
                  </button>
                  <button
                    onClick={() => setIsFahrenheit(true)}
                    className={`w-7 h-7 rounded-full text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                      isFahrenheit ? "bg-black text-white" : "text-slate-500 hover:text-black"
                    }`}
                  >
                    °F
                  </button>
                </div>

                {/* Refresh Trigger */}
                <button
                  onClick={refresh}
                  disabled={loading}
                  title="Synchronize live weather telemetry"
                  className="w-9 h-9 rounded-full bg-white hover:bg-slate-100 flex items-center justify-center text-slate-600 transition shadow-2xs border border-slate-200/60 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#0F766E]" : ""}`} />
                </button>
              </div>
            </div>

            {/* Forecast Row (Today Hourly vs Week Daily) */}
            <div>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5 sm:gap-3">
                {activeTab === "today" ? (
                  /* ── HOURLY FORECAST CARDS (Displaying exact times & Day/Night transitions) ── */
                  hourlyCards.map((slot, idx) => {
                    const isSelected = selectedHourIndex === idx;
                    return (
                      <div
                        key={slot.timeLabel + idx}
                        onClick={() => setSelectedHourIndex(idx)}
                        className={`bg-white rounded-2xl p-2.5 sm:p-3 text-center transition-all cursor-pointer flex flex-col items-center justify-between min-h-[120px] border ${
                          isSelected
                            ? "ring-2 ring-slate-800 shadow-md border-transparent scale-102"
                            : "border-slate-100 hover:shadow-md hover:border-slate-200"
                        }`}
                      >
                        {/* Time Header */}
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">
                            {slot.timeLabel}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 block -mt-0.5">
                            {slot.subLabel}
                          </span>
                        </div>

                        {/* Weather Icon with Day / Night Awareness */}
                        <MiniWeatherIcon code={slot.weatherCode} isNight={slot.isNight} />

                        {/* Temperature & Rain Chance */}
                        <div>
                          <div className="text-xs font-bold text-slate-800">
                            {slot.temp}°
                          </div>
                          {slot.rainProb > 15 && (
                            <div className="text-[10px] text-[#3D5AFE] font-semibold mt-0.5">
                              {slot.rainProb}%
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  /* ── 7-DAY FORECAST CARDS (Week View) ── */
                  data?.daily.slice(0, 7).map((day: DailyForecast, idx: number) => {
                    const dayDate = new Date(day.date);
                    const shortDay = dayDate.toLocaleDateString("en-US", { weekday: "short" });
                    const isSelected = selectedDayIndex === idx;

                    const maxT = toUnit(day.tempMax, isFahrenheit);
                    const minT = toUnit(day.tempMin, isFahrenheit);
                    // For "Today" card (idx === 0), reflect current Day/Night status!
                    const cardIsNight = idx === 0 ? isNight : false;

                    return (
                      <div
                        key={day.date}
                        onClick={() => setSelectedDayIndex(idx)}
                        className={`bg-white rounded-2xl p-2.5 sm:p-3 text-center transition-all cursor-pointer flex flex-col items-center justify-between min-h-[120px] border ${
                          isSelected
                            ? "ring-2 ring-slate-800 shadow-md border-transparent scale-102"
                            : "border-slate-100 hover:shadow-md hover:border-slate-200"
                        }`}
                      >
                        <div>
                          <span className="text-xs font-semibold text-slate-700 block">
                            {idx === 0 ? "Today" : shortDay}
                          </span>
                          {idx === 0 && (
                            <span className="text-[10px] font-bold text-indigo-600 block -mt-0.5">
                              {isNight ? "Night" : "Now"}
                            </span>
                          )}
                        </div>

                        <MiniWeatherIcon code={day.weatherCode} isNight={cardIsNight} />

                        <div className="text-xs space-x-1">
                          <span className="font-bold text-slate-800">{maxT}°</span>
                          <span className="text-slate-400 font-normal">{minT}°</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Today's Highlights Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Today's Highlights
              </h3>

              {/* 6 Grid Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-4.5">
                
                {/* 1. UV Index */}
                <div className="bg-white rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition">
                  <span className="text-xs font-semibold text-slate-400 block mb-1">
                    UV Index
                  </span>
                  <div className="my-2">
                    <UvIndexGauge value={uvValue} />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 block text-center mt-1">
                    {uvValue >= 8 ? "Very High ☀️" : uvValue >= 6 ? "High Exposure" : "Moderate"}
                  </span>
                </div>

                {/* 2. Wind Status */}
                <div className="bg-white rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition">
                  <span className="text-xs font-semibold text-slate-400 block">
                    Wind Status
                  </span>
                  <div className="my-auto py-2">
                    <div className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                      {windSpeedKmh} <span className="text-base font-normal text-slate-500">km/h</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-blue-600">
                      <Compass className="h-3.5 w-3.5" />
                    </div>
                    <span>{windDir}</span>
                  </div>
                </div>

                {/* 3. Sunrise & Sunset */}
                <div className="bg-white rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition">
                  <span className="text-xs font-semibold text-slate-400 block mb-2">
                    Sunrise & Sunset
                  </span>
                  <div className="space-y-3.5 my-auto">
                    {/* Sunrise */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                        <ArrowUp className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800 leading-none">
                          {sunriseStr}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">- 1m 46s</span>
                      </div>
                    </div>

                    {/* Sunset */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                        <ArrowDown className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800 leading-none">
                          {sunsetStr}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">+ 2m 22s</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Humidity */}
                <div className="bg-white rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">
                      Humidity
                    </span>
                    <VerticalPillSlider percentage={humidity} color="#3D5AFE" />
                  </div>
                  <div className="my-auto py-2">
                    <div className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                      {humidity}<span className="text-xl font-normal text-slate-500">%</span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                    {humidity < 40 ? "Dry 🌵" : humidity > 75 ? "Humid 💧" : "Normal 👍"}
                  </span>
                </div>

                {/* 5. Visibility */}
                <div className="bg-white rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition">
                  <span className="text-xs font-semibold text-slate-400 block">
                    Visibility
                  </span>
                  <div className="my-auto py-2">
                    <div className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                      {visibilityKm} <span className="text-base font-normal text-slate-500">km</span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                    {Number(visibilityKm) > 8 ? "Good 🙂" : "Average 😐"}
                  </span>
                </div>

                {/* 6. Air Quality & Agricultural Spray Window */}
                <div className="bg-white rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">
                      Air Quality
                    </span>
                    <VerticalPillSlider percentage={sprayStatus === "IDEAL" ? 85 : 45} color="#16A34A" />
                  </div>
                  <div className="my-auto py-2">
                    <div className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                      {sprayStatus === "IDEAL" ? "105" : "65"}
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                    {sprayStatus === "IDEAL" ? "Ideal Spray 👍" : "Unstable ⚠️"}
                  </span>
                </div>

              </div>
            </div>

            {/* ── Collapsible Agricultural Soil & Evapotranspiration Drawer ── */}
            <div className="pt-2">
              <button
                onClick={() => setShowAgroDetails(!showAgroDetails)}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200/80 transition flex items-center justify-between text-xs font-bold text-slate-700 cursor-pointer shadow-2xs"
              >
                <span className="flex items-center gap-2 text-[#0F766E]">
                  <Leaf className="h-4 w-4" />
                  <span>Agronomic Soil & Spray Intelligence (Mqulima Core)</span>
                </span>
                {showAgroDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {showAgroDetails && data && (
                <div className="mt-3 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Soil Temp</span>
                      <strong className="text-base font-bold text-slate-800">
                        {data.hourlySnapshot.soilTemperature.toFixed(1)}°C
                      </strong>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Daily ET0</span>
                      <strong className="text-base font-bold text-slate-800">
                        {data.daily[0]?.et0.toFixed(2) ?? "3.80"} mm
                      </strong>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Pressure</span>
                      <strong className="text-base font-bold text-slate-800">
                        {data.current.surface_pressure.toFixed(0)} hPa
                      </strong>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Elevation</span>
                      <strong className="text-base font-bold text-slate-800">
                        {Math.round(data.raw.elevation)}m asl
                      </strong>
                    </div>
                  </div>

                  {/* AI Recommendations */}
                  {data.advisory.recommendations.length > 0 && (
                    <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100 text-left">
                      <span className="text-[10px] font-black uppercase text-emerald-800 block mb-1.5 flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3 text-emerald-600" />
                        AI Agronomic Recommendation
                      </span>
                      <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                        {data.advisory.recommendations[0]}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
