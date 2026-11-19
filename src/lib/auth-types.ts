export type User = {
  id: string;
  name: string;
  email: string;
  county: string;
  farmSize: string;
  crops: string;
  livestock: string;
  role?: string;
  phone?: string;
  avatarUrl?: string;
  username?: string;
  yearsFarming?: number;
};

export function getUserInitials(name?: string | null, email?: string | null): string {
  const cleanName = (name || "").trim();
  if (cleanName) {
    const parts = cleanName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  const cleanEmail = (email || "").trim();
  return cleanEmail ? cleanEmail.charAt(0).toUpperCase() : "M";
}
