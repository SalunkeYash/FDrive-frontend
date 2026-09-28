import type { FileEntry } from "@/types";

export type TypeFilter =
  | "any"
  | "folder"
  | "document"
  | "pdf"
  | "image"
  | "video"
  | "audio"
  | "archive"
  | "other";

export type PeopleFilter = "anyone" | "shared" | "not_shared";

export type ModifiedFilter =
  | "any"
  | "today"
  | "last7"
  | "last30"
  | "this_year"
  | "last_year";

export type DriveFilters = {
  type: TypeFilter;
  people: PeopleFilter;
  modified: ModifiedFilter;
};

export const DEFAULT_FILTERS: DriveFilters = {
  type: "any",
  people: "anyone",
  modified: "any",
};

const IMAGE_EXTS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "ico",
  "jfif",
  "bmp",
  "svg",
  "heic",
  "raw",
  "cr2",
  "cr3",
  "nef",
  "nrw",
  "arw",
  "dng",
  "orf",
  "rw2",
  "pef",
  "srw",
  "raf",
  "x3f",
]);
const VIDEO_EXTS = new Set([
  "mp4",
  "webm",
  "mov",
  "mkv",
  "m4v",
  "avi",
  "wmv",
]);
const AUDIO_EXTS = new Set(["mp3", "wav", "aac", "flac", "ogg", "m4a"]);
const DOC_EXTS = new Set([
  "doc",
  "docx",
  "txt",
  "rtf",
  "odt",
  "md",
  "pages",
  "xls",
  "xlsx",
  "csv",
  "ods",
  "ppt",
  "pptx",
  "odp",
]);
const ARCHIVE_EXTS = new Set(["zip", "rar", "7z", "tar", "gz", "bz2"]);

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function matchesType(entry: FileEntry, type: TypeFilter): boolean {
  if (type === "any") return true;
  if (type === "folder") return entry.isFolder;
  if (entry.isFolder) return false;

  const ext = entry.fileExtension;
  const mime = (entry.mimeType || "").toLowerCase();

  switch (type) {
    case "image":
      return mime.startsWith("image/") || IMAGE_EXTS.has(ext);
    case "video":
      return mime.startsWith("video/") || VIDEO_EXTS.has(ext);
    case "audio":
      return mime.startsWith("audio/") || AUDIO_EXTS.has(ext);
    case "pdf":
      return mime === "application/pdf" || ext === "pdf";
    case "document":
      return (
        DOC_EXTS.has(ext) ||
        mime.includes("document") ||
        mime.includes("sheet") ||
        mime.includes("presentation") ||
        mime.startsWith("text/")
      );
    case "archive":
      return ARCHIVE_EXTS.has(ext) || mime.includes("zip") || mime.includes("compressed");
    case "other":
      return !(
        mime.startsWith("image/") ||
        mime.startsWith("video/") ||
        mime.startsWith("audio/") ||
        mime === "application/pdf" ||
        ext === "pdf" ||
        IMAGE_EXTS.has(ext) ||
        VIDEO_EXTS.has(ext) ||
        AUDIO_EXTS.has(ext) ||
        DOC_EXTS.has(ext) ||
        ARCHIVE_EXTS.has(ext)
      );
    default:
      return true;
  }
}

function matchesPeople(entry: FileEntry, people: PeopleFilter): boolean {
  if (people === "anyone") return true;
  if (people === "shared") return Boolean(entry.isShared);
  return !entry.isShared;
}

function matchesModified(entry: FileEntry, modified: ModifiedFilter): boolean {
  if (modified === "any") return true;
  if (!entry.updatedAt) return false;

  const updated = new Date(entry.updatedAt);
  if (Number.isNaN(updated.getTime())) return false;

  const now = new Date();
  const today = startOfDay(now);

  switch (modified) {
    case "today":
      return updated >= today;
    case "last7": {
      const from = new Date(today);
      from.setDate(from.getDate() - 7);
      return updated >= from;
    }
    case "last30": {
      const from = new Date(today);
      from.setDate(from.getDate() - 30);
      return updated >= from;
    }
    case "this_year":
      return updated.getFullYear() === now.getFullYear();
    case "last_year":
      return updated.getFullYear() === now.getFullYear() - 1;
    default:
      return true;
  }
}

export function matchesDriveFilters(
  entry: FileEntry,
  filters: DriveFilters,
): boolean {
  return (
    matchesType(entry, filters.type) &&
    matchesPeople(entry, filters.people) &&
    matchesModified(entry, filters.modified)
  );
}

export function hasActiveFilters(filters: DriveFilters): boolean {
  return (
    filters.type !== "any" ||
    filters.people !== "anyone" ||
    filters.modified !== "any"
  );
}
