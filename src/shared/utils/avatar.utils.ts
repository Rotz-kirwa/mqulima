export function resolveAvatar(avatarUrl: string | null | undefined, name: string): string {
  if (avatarUrl && (avatarUrl.startsWith("http") || avatarUrl.startsWith("data:"))) {
    return avatarUrl;
  }
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
    name || "Mqulima Farmer"
  )}&backgroundColor=1a5438&textColor=ffffff`;
}
