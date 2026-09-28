export const formatBytes = (bytes: number) => {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

export const USER_STORAGE_LIMIT_BYTES = 200 * 1024 * 1024;

const AVATAR_COLORS = [
  "#7c4dff",
  "#00897b",
  "#e53935",
  "#1e88e5",
  "#fb8c00",
  "#43a047",
  "#8e24aa",
  "#3949ab",
];

export function emailInitial(email?: string | null): string {
  const ch = email?.trim()?.[0];
  return ch ? ch.toUpperCase() : "?";
}

export function avatarColorForEmail(email?: string | null): string {
  const value = email?.trim().toLowerCase() || "";
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
