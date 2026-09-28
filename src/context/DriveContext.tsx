import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { api } from "@/api/client";
import type { ApiFile, ApiFolder, FolderTreeNode, StorageQuota } from "@/api/types";
import { useAuth } from "@/auth/AuthContext";
import MediaViewer, { type MediaViewerState } from "@/components/MediaViewer";
import type { FileEntry, UploadItem, ViewMode } from "@/types";
import { formatBytes } from "@/lib/utils";
import { collectDroppedFiles } from "@/lib/dropFiles";
import {
  DEFAULT_FILTERS,
  type DriveFilters,
  type ModifiedFilter,
  type PeopleFilter,
  type TypeFilter,
} from "@/lib/driveFilters";

const STARRED_KEY = "fdrive-starred-ids";
const VIEW_MODE_KEY = "fdrive-view-mode";
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
const VIDEO_EXTS = new Set(["mp4", "webm", "mov", "mkv", "m4v", "avi"]);

type DriveContextValue = {
  entries: FileEntry[];
  loading: boolean;
  quota: StorageQuota | null;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  filters: DriveFilters;
  setTypeFilter: (type: TypeFilter) => void;
  setPeopleFilter: (people: PeopleFilter) => void;
  setModifiedFilter: (modified: ModifiedFilter) => void;
  clearFilters: () => void;
  uploads: UploadItem[];
  setUploads: Dispatch<SetStateAction<UploadItem[]>>;
  refresh: () => Promise<void>;
  addFolder: (name: string, parentId: string) => Promise<string | null>;
  addFiles: (files: File[], parentId: string) => Promise<FileEntry[]>;
  renameEntry: (id: string, name: string, isFolder: boolean) => Promise<boolean>;
  moveEntry: (
    id: string,
    isFolder: boolean,
    destinationFolderId: string | null,
  ) => Promise<boolean>;
  starEntry: (id: string, starred: boolean) => void;
  trashEntry: (id: string, trashed: boolean) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  getByFolder: (folderId: string) => FileEntry[];
  getBreadcrumbs: (folderId: string) => { id: string; label: string }[];
  ensureFolderLoaded: (folderId: string) => Promise<void>;
  canEditFolder: (folderId: string) => boolean;
  openOrDownloadFile: (fileId: string, mode?: "open" | "download") => Promise<void>;
  downloadFolder: (folderId: string) => Promise<void>;
  uploadDropped: (
    dataTransfer: DataTransfer,
    parentFolderId: string,
  ) => Promise<void>;
  uploadFlatFiles: (files: File[], parentFolderId: string) => Promise<void>;
  uploadPathFiles: (
    files: { file: File; relativePath: string }[],
    parentFolderId: string,
  ) => Promise<void>;
};

const DriveContext = createContext<DriveContextValue | null>(null);

function loadStarred(): Set<string> {
  try {
    const raw = localStorage.getItem(STARRED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function saveStarred(ids: Set<string>) {
  localStorage.setItem(STARRED_KEY, JSON.stringify([...ids]));
}

function extensionOf(name: string): string {
  return name.includes(".") ? (name.split(".").pop()?.toLowerCase() ?? "") : "";
}

function isMediaEntry(entry: FileEntry): boolean {
  const mime = (entry.mimeType || "").toLowerCase();
  if (mime.startsWith("image/") || mime.startsWith("video/")) return true;
  return IMAGE_EXTS.has(entry.fileExtension) || VIDEO_EXTS.has(entry.fileExtension);
}

function asAccessRole(
  role: string | null | undefined,
): "owner" | "viewer" | "editor" | undefined {
  if (role === "owner" || role === "viewer" || role === "editor") return role;
  return undefined;
}

function mapFolder(
  folder: ApiFolder,
  starred: Set<string>,
  sharedIds: Set<string>,
  extras?: Partial<FileEntry>,
): FileEntry {
  return {
    id: folder.id,
    folderName: folder.name,
    isFolder: true,
    fileLink: "",
    fileName: "",
    isStarred: starred.has(folder.id),
    isTrashed: folder.is_trashed,
    fileExtension: "",
    folderId: folder.parent_id ?? "",
    updatedAt: folder.updated_at,
    isShared: sharedIds.has(folder.id),
    ownerId: folder.owner_id,
    accessRole: asAccessRole(folder.access_role) ?? (folder.owner_id ? undefined : "owner"),
    ...extras,
  };
}

function mapFile(
  file: ApiFile,
  starred: Set<string>,
  sharedIds: Set<string>,
  extras?: Partial<FileEntry>,
): FileEntry {
  return {
    id: file.id,
    folderName: "",
    isFolder: false,
    fileLink: "",
    fileName: file.name,
    isStarred: starred.has(file.id),
    isTrashed: file.is_trashed,
    fileExtension: extensionOf(file.name),
    folderId: file.folder_id ?? "",
    fileSize: file.size_bytes,
    mimeType: file.mime_type,
    updatedAt: file.updated_at,
    isShared: sharedIds.has(file.id),
    ownerId: file.owner_id,
    accessRole: asAccessRole(file.access_role),
    ...extras,
  };
}

function flattenTree(
  nodes: FolderTreeNode[],
): { id: string; name: string; parent_id: string | null }[] {
  const out: { id: string; name: string; parent_id: string | null }[] = [];
  const walk = (list: FolderTreeNode[]) => {
    for (const n of list) {
      out.push({ id: n.id, name: n.name, parent_id: n.parent_id });
      if (n.children?.length) walk(n.children);
    }
  };
  walk(nodes);
  return out;
}

async function fetchThumbnailUrl(fileId: string): Promise<string | null> {
  try {
    const thumb = await api.getThumbnailUrl(fileId);
    return thumb.preview_url;
  } catch {
    return null;
  }
}

function loadViewMode(): ViewMode {
  try {
    const raw = localStorage.getItem(VIEW_MODE_KEY);
    return raw === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}

export function DriveProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [quota, setQuota] = useState<StorageQuota | null>(null);
  const [loading, setLoading] = useState(false);
  const [starred, setStarred] = useState<Set<string>>(() => loadStarred());
  const [viewer, setViewer] = useState<MediaViewerState>(null);
  const [viewMode, setViewModeState] = useState<ViewMode>(() => loadViewMode());
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [filters, setFilters] = useState<DriveFilters>(DEFAULT_FILTERS);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    localStorage.setItem(VIEW_MODE_KEY, mode);
  }, []);

  const setTypeFilter = useCallback((type: TypeFilter) => {
    setFilters((prev) => ({ ...prev, type }));
  }, []);

  const setPeopleFilter = useCallback((people: PeopleFilter) => {
    setFilters((prev) => ({ ...prev, people }));
  }, []);

  const setModifiedFilter = useCallback((modified: ModifiedFilter) => {
    setFilters((prev) => ({ ...prev, modified }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const hydrateThumbnails = useCallback(async (list: FileEntry[]) => {
    const media = list.filter((e) => !e.isFolder && !e.isTrashed && isMediaEntry(e));
    if (media.length === 0) return;

    const updates = await Promise.all(
      media.map(async (entry) => {
        const url = await fetchThumbnailUrl(entry.id);
        return url ? { id: entry.id, url } : null;
      }),
    );

    const byId = new Map(
      updates.filter((u): u is { id: string; url: string } => Boolean(u)).map((u) => [u.id, u.url]),
    );
    if (byId.size === 0) {
      // Thumbs may still be generating — retry once shortly.
      window.setTimeout(() => {
        void (async () => {
          const retry = await Promise.all(
            media.map(async (entry) => {
              const url = await fetchThumbnailUrl(entry.id);
              return url ? { id: entry.id, url } : null;
            }),
          );
          const retryMap = new Map(
            retry
              .filter((u): u is { id: string; url: string } => Boolean(u))
              .map((u) => [u.id, u.url]),
          );
          if (retryMap.size === 0) return;
          setEntries((prev) =>
            prev.map((e) =>
              retryMap.has(e.id) ? { ...e, fileLink: retryMap.get(e.id)! } : e,
            ),
          );
        })();
      }, 2500);
      return;
    }

    setEntries((prev) =>
      prev.map((e) => (byId.has(e.id) ? { ...e, fileLink: byId.get(e.id)! } : e)),
    );
  }, []);

  const refresh = useCallback(async () => {
    if (!user) {
      setEntries([]);
      setQuota(null);
      return;
    }
    setLoading(true);
    try {
      const stars = loadStarred();
      setStarred(stars);

      const [tree, trash, quotaData, rootFiles, myShares, sharedWithMe] =
        await Promise.all([
          api.listFolderTree(),
          api.listTrash(),
          api.getStorageQuota(),
          api.listFolderFiles(null),
          api.listMyShares().catch(() => []),
          api.listSharedWithMe().catch(() => []),
        ]);

      const sharedIds = new Set(myShares.map((s) => s.resource_id));
      const myId = user.id;

      const flatFolders = flattenTree(tree);
      const folderMeta = new Map<string, ApiFolder>();

      const rootFolders = await api.listFolderContents(null);
      for (const folder of rootFolders.folders) {
        folderMeta.set(folder.id, folder);
      }
      await Promise.all(
        flatFolders.map(async (folder) => {
          try {
            const child = await api.listFolderContents(folder.id);
            for (const f of child.folders) folderMeta.set(f.id, f);
          } catch {
            /* ignore missing folder meta */
          }
        }),
      );

      const folderEntries: FileEntry[] = flatFolders.map((f) => {
        const meta = folderMeta.get(f.id);
        return mapFolder(
          meta ?? {
            id: f.id,
            name: f.name,
            parent_id: f.parent_id,
            path: "",
            is_trashed: false,
            created_at: "",
            updated_at: "",
            owner_id: myId,
            access_role: "owner",
          },
          stars,
          sharedIds,
          { accessRole: "owner", ownerId: myId },
        );
      });

      const fileEntries: FileEntry[] = rootFiles.map((f) =>
        mapFile(f, stars, sharedIds, {
          accessRole: asAccessRole(f.access_role) ?? "owner",
          ownerId: f.owner_id ?? myId,
        }),
      );
      for (const folder of flatFolders) {
        const files = await api.listFolderFiles(folder.id);
        fileEntries.push(
          ...files.map((f) =>
            mapFile(f, stars, sharedIds, {
              accessRole: asAccessRole(f.access_role) ?? "owner",
              ownerId: f.owner_id ?? myId,
            }),
          ),
        );
      }

      const sharedEntries: FileEntry[] = [];
      for (const item of sharedWithMe) {
        if (item.is_trashed) continue;
        const role = asAccessRole(item.role) ?? "viewer";
        if (item.resource_type === "folder") {
          sharedEntries.push({
            id: item.resource_id,
            folderName: item.resource_name,
            isFolder: true,
            fileLink: "",
            fileName: "",
            isStarred: stars.has(item.resource_id),
            isTrashed: false,
            fileExtension: "",
            folderId: "",
            updatedAt: item.updated_at ?? undefined,
            isShared: true,
            isSharedWithMe: true,
            accessRole: role,
          });
        } else {
          sharedEntries.push({
            id: item.resource_id,
            folderName: "",
            isFolder: false,
            fileLink: "",
            fileName: item.resource_name,
            isStarred: stars.has(item.resource_id),
            isTrashed: false,
            fileExtension: extensionOf(item.resource_name),
            folderId: "",
            fileSize: item.size_bytes ?? undefined,
            mimeType: item.mime_type,
            updatedAt: item.updated_at ?? undefined,
            isShared: true,
            isSharedWithMe: true,
            accessRole: role,
          });
        }
      }

      const trashEntries: FileEntry[] = trash.items.map((item) => {
        const isFolder = item.resource_type === "folder";
        return {
          id: item.resource_id,
          folderName: isFolder ? item.name : "",
          isFolder,
          fileLink: "",
          fileName: isFolder ? "" : item.name,
          isStarred: stars.has(item.resource_id),
          isTrashed: true,
          fileExtension: isFolder ? "" : extensionOf(item.name),
          folderId: "",
          fileSize: item.size_bytes ?? undefined,
          updatedAt: item.trashed_at ?? undefined,
          isShared: sharedIds.has(item.resource_id),
          accessRole: "owner" as const,
          ownerId: myId,
        };
      });

      const byId = new Map<string, FileEntry>();
      for (const e of [...folderEntries, ...fileEntries]) {
        byId.set(e.id, e);
      }
      // Shared-with-me overlays (keep role if already owned — shouldn't happen)
      for (const e of sharedEntries) {
        const existing = byId.get(e.id);
        if (existing && existing.accessRole === "owner") continue;
        byId.set(e.id, e);
      }
      for (const e of trashEntries) {
        byId.set(e.id, e);
      }

      const next = [...byId.values()];
      setEntries(next);
      setQuota(quotaData);
      void hydrateThumbnails(next);
    } catch (err) {
      console.error("Failed to refresh drive data", err);
      try {
        setQuota(await api.getStorageQuota());
      } catch {
        /* ignore */
      }
    } finally {
      setLoading(false);
    }
  }, [user, hydrateThumbnails]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const ensureFolderLoaded = useCallback(
    async (folderId: string) => {
      if (!folderId || !user) return;
      const stars = loadStarred();
      try {
        const [contents, files, myShares] = await Promise.all([
          api.listFolderContents(folderId),
          api.listFolderFiles(folderId),
          api.listMyShares().catch(() => []),
        ]);
        const sharedIds = new Set(myShares.map((s) => s.resource_id));
        const mediaEntries = files.map((f) => mapFile(f, stars, sharedIds));

        setEntries((prev) => {
          const parent = prev.find((e) => e.id === folderId);
          const inherit = parent?.accessRole;
          const fromShare = Boolean(parent?.isSharedWithMe);
          const byId = new Map(prev.map((e) => [e.id, e]));
          for (const f of contents.folders) {
            byId.set(
              f.id,
              mapFolder(f, stars, sharedIds, {
                accessRole: asAccessRole(f.access_role) ?? inherit,
                isSharedWithMe: fromShare,
              }),
            );
          }
          for (const f of files) {
            byId.set(
              f.id,
              mapFile(f, stars, sharedIds, {
                accessRole: asAccessRole(f.access_role) ?? inherit,
                isSharedWithMe: fromShare,
              }),
            );
          }
          return [...byId.values()];
        });

        void hydrateThumbnails(mediaEntries);
      } catch (err) {
        console.error("Failed to load shared folder contents", err);
      }
    },
    [user, hydrateThumbnails],
  );

  const addFolder = useCallback(
    async (name: string, parentId: string) => {
      const folderName = name.trim() || "Untitled folder";
      try {
        const created = await api.createFolder(folderName, parentId || null);
        await refresh();
        if (parentId) await ensureFolderLoaded(parentId);
        return created.id;
      } catch (err) {
        window.alert(err instanceof Error ? err.message : "Could not create folder");
        return null;
      }
    },
    [refresh, ensureFolderLoaded],
  );

  const addFiles = useCallback(
    async (files: File[], parentId: string) => {
      const created: FileEntry[] = [];
      for (const file of files) {
        try {
          const uploaded = await api.uploadFile(file, parentId || null);
          created.push(
            mapFile(uploaded, loadStarred(), new Set(), {
              accessRole: asAccessRole(uploaded.access_role) ?? "editor",
              folderId: uploaded.folder_id ?? parentId,
            }),
          );
        } catch (err) {
          window.alert(
            err instanceof Error ? err.message : `Upload failed for ${file.name}`,
          );
        }
      }
      await refresh();
      // refresh() only reloads owned + shared roots; reload this folder so
      // editor uploads into a shared folder appear without a full page refresh.
      if (parentId) await ensureFolderLoaded(parentId);
      return created;
    },
    [refresh, ensureFolderLoaded],
  );

  const renameEntry = useCallback(
    async (id: string, name: string, isFolder: boolean) => {
      if (!name.trim()) return false;
      try {
        if (isFolder) await api.renameFolder(id, name.trim());
        else await api.renameFile(id, name.trim());
        await refresh();
        return true;
      } catch (err) {
        window.alert(err instanceof Error ? err.message : "Rename failed");
        return false;
      }
    },
    [refresh],
  );

  const moveEntry = useCallback(
    async (id: string, isFolder: boolean, destinationFolderId: string | null) => {
      try {
        if (isFolder) await api.moveFolder(id, destinationFolderId);
        else await api.moveFile(id, destinationFolderId);
        await refresh();
        return true;
      } catch (err) {
        window.alert(err instanceof Error ? err.message : "Move failed");
        return false;
      }
    },
    [refresh],
  );

  const starEntry = useCallback((id: string, nextStarred: boolean) => {
    setStarred((prev) => {
      const copy = new Set(prev);
      if (nextStarred) copy.add(id);
      else copy.delete(id);
      saveStarred(copy);
      return copy;
    });
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isStarred: nextStarred } : e)),
    );
  }, []);

  const trashEntry = useCallback(
    async (id: string, trashed: boolean) => {
      const entry = entries.find((e) => e.id === id);
      if (!entry) return;
      try {
        if (trashed) {
          if (entry.isFolder) await api.moveFolderToTrash(id);
          else await api.moveFileToTrash(id);
        } else if (entry.isFolder) await api.restoreFolderFromTrash(id);
        else await api.restoreFileFromTrash(id);
        await refresh();
      } catch (err) {
        window.alert(err instanceof Error ? err.message : "Trash action failed");
      }
    },
    [entries, refresh],
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      const entry = entries.find((e) => e.id === id);
      if (!entry) return;
      try {
        if (entry.isFolder) await api.permanentlyDeleteFolder(id);
        else await api.permanentlyDeleteFile(id);
        await refresh();
      } catch (err) {
        window.alert(err instanceof Error ? err.message : "Delete failed");
      }
    },
    [entries, refresh],
  );

  const getByFolder = useCallback(
    (folderId: string) => entries.filter((e) => e.folderId === folderId),
    [entries],
  );

  const getBreadcrumbs = useCallback(
    (folderId: string) => {
      if (!folderId) return [{ id: "", label: "My Drive" }];
      const byId = new Map(entries.filter((e) => e.isFolder).map((e) => [e.id, e]));
      const labels: { id: string; label: string }[] = [];
      let pointer = byId.get(folderId);
      let sharedRoot = Boolean(pointer?.isSharedWithMe);
      while (pointer) {
        labels.unshift({ id: pointer.id, label: pointer.folderName });
        if (pointer.isSharedWithMe) sharedRoot = true;
        if (!pointer.folderId) break;
        const parent = byId.get(pointer.folderId);
        if (!parent) break;
        pointer = parent;
      }
      return [
        sharedRoot
          ? { id: "shared", label: "Shared with me" }
          : { id: "", label: "My Drive" },
        ...labels,
      ];
    },
    [entries],
  );

  const canEditFolder = useCallback(
    (folderId: string) => {
      if (!folderId) return true; // own My Drive root
      const folder = entries.find((e) => e.id === folderId && e.isFolder);
      if (!folder) return false;
      const role = folder.accessRole ?? "owner";
      return role === "owner" || role === "editor";
    },
    [entries],
  );

  const openOrDownloadFile = useCallback(
    async (fileId: string, mode: "open" | "download" = "download") => {
      try {
        if (mode === "open") {
          const entry = entries.find((e) => e.id === fileId);
          const preview = await api.getPreviewUrl(fileId);
          setViewer({
            url: preview.preview_url,
            name: entry?.fileName || "Preview",
            mimeType: preview.mime_type || entry?.mimeType || null,
          });
          return;
        }
        const data = await api.getDownloadUrl(fileId);
        window.open(data.download_url, "_blank", "noopener,noreferrer");
      } catch (err) {
        window.alert(err instanceof Error ? err.message : "Unable to open file");
      }
    },
    [entries],
  );

  const downloadFolder = useCallback(
    async (folderId: string) => {
      const folder = entries.find((e) => e.id === folderId && e.isFolder);
      const folderName = folder?.folderName || "folder";

      type ZipFile = { id: string; path: string };
      const collected: ZipFile[] = [];

      const walk = async (id: string, prefix: string) => {
        const [childFolders, files] = await Promise.all([
          api.listFolderContents(id),
          api.listFolderFiles(id),
        ]);
        for (const file of files) {
          if (file.is_trashed || file.status !== "ready") continue;
          collected.push({
            id: file.id,
            path: prefix ? `${prefix}/${file.name}` : file.name,
          });
        }
        for (const child of childFolders.folders) {
          if (child.is_trashed) continue;
          await walk(child.id, prefix ? `${prefix}/${child.name}` : child.name);
        }
      };

      try {
        await walk(folderId, "");
        if (collected.length === 0) {
          window.alert("This folder is empty.");
          return;
        }

        const JSZip = (await import("jszip")).default;
        const zip = new JSZip();
        for (const item of collected) {
          const { download_url } = await api.getDownloadUrl(item.id);
          const res = await fetch(download_url);
          if (!res.ok) throw new Error(`Could not download ${item.path}`);
          zip.file(item.path, await res.blob());
        }

        const blob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${folderName}.zip`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
      } catch (err) {
        window.alert(
          err instanceof Error
            ? err.message
            : "Could not download folder. Try downloading files individually.",
        );
      }
    },
    [entries],
  );

  const ensureWithinStorageLimit = useCallback(
    (bytesToAdd: number) => {
      const bytesUsed = quota?.bytes_used ?? 0;
      const bytesLimit = quota?.bytes_limit ?? 1;
      if (bytesUsed + bytesToAdd > bytesLimit) {
        window.alert(
          `You have reached your ${formatBytes(bytesLimit)} storage limit.`,
        );
        return false;
      }
      return true;
    },
    [quota],
  );

  const queueSingleUpload = useCallback(
    async (file: File, parentId: string) => {
      const uploadId = crypto.randomUUID();
      setUploads((prev) => [
        ...prev,
        { id: uploadId, name: file.name, progress: 10 },
      ]);
      try {
        setUploads((prev) =>
          prev.map((u) => (u.id === uploadId ? { ...u, progress: 40 } : u)),
        );
        const [created] = await addFiles([file], parentId);
        if (!created) {
          setUploads((prev) => prev.filter((u) => u.id !== uploadId));
          return;
        }
        setUploads((prev) =>
          prev.map((u) =>
            u.id === uploadId
              ? {
                  ...u,
                  progress: 100,
                  fileId: created.id,
                  fileLink: created.fileLink || "ready",
                }
              : u,
          ),
        );
      } catch {
        setUploads((prev) => prev.filter((u) => u.id !== uploadId));
      }
    },
    [addFiles],
  );

  const uploadFlatFiles = useCallback(
    async (files: File[], parentFolderId: string) => {
      if (files.length === 0) return;
      const total = files.reduce((sum, f) => sum + f.size, 0);
      if (!ensureWithinStorageLimit(total)) return;
      for (const file of files) {
        await queueSingleUpload(file, parentFolderId);
      }
    },
    [ensureWithinStorageLimit, queueSingleUpload],
  );

  const uploadPathFiles = useCallback(
    async (
      files: { file: File; relativePath: string }[],
      parentFolderId: string,
    ) => {
      if (files.length === 0) return;
      const total = files.reduce((sum, item) => sum + item.file.size, 0);
      if (!ensureWithinStorageLimit(total)) return;

      const folderPathMap = new Map<string, string>();
      let knownFolders = entries.filter((e) => e.isFolder && !e.isTrashed);

      for (const item of files) {
        const relativePath = item.relativePath || item.file.name;
        const parts = relativePath.split("/").filter(Boolean);
        const uploadName = parts.pop() || item.file.name;
        let parentId = parentFolderId;
        let pathKey = "";

        for (const segment of parts) {
          pathKey = pathKey ? `${pathKey}/${segment}` : segment;
          if (folderPathMap.has(pathKey)) {
            parentId = folderPathMap.get(pathKey)!;
            continue;
          }
          const existing = knownFolders.find(
            (entry) =>
              entry.folderId === parentId && entry.folderName === segment,
          );
          if (existing) {
            folderPathMap.set(pathKey, existing.id);
            parentId = existing.id;
            continue;
          }
          const createdId = await addFolder(segment, parentId);
          if (!createdId) break;
          folderPathMap.set(pathKey, createdId);
          knownFolders = [
            ...knownFolders,
            {
              id: createdId,
              folderName: segment,
              isFolder: true,
              fileLink: "",
              fileName: "",
              isStarred: false,
              isTrashed: false,
              fileExtension: "",
              folderId: parentId,
            },
          ];
          parentId = createdId;
        }

        const renamed = new File([item.file], uploadName, {
          type: item.file.type,
        });
        await queueSingleUpload(renamed, parentId);
      }
    },
    [addFolder, ensureWithinStorageLimit, entries, queueSingleUpload],
  );

  const uploadDropped = useCallback(
    async (dataTransfer: DataTransfer, parentFolderId: string) => {
      const dropped = await collectDroppedFiles(dataTransfer);
      if (dropped.length === 0) return;
      const hasNested = dropped.some((d) => d.relativePath.includes("/"));
      if (hasNested) {
        await uploadPathFiles(dropped, parentFolderId);
      } else {
        await uploadFlatFiles(
          dropped.map((d) => d.file),
          parentFolderId,
        );
      }
    },
    [uploadFlatFiles, uploadPathFiles],
  );

  const value = useMemo(
    () => ({
      entries,
      loading,
      quota,
      viewMode,
      setViewMode,
      filters,
      setTypeFilter,
      setPeopleFilter,
      setModifiedFilter,
      clearFilters,
      uploads,
      setUploads,
      refresh,
      addFolder,
      addFiles,
      renameEntry,
      moveEntry,
      starEntry,
      trashEntry,
      deleteEntry,
      getByFolder,
      getBreadcrumbs,
      ensureFolderLoaded,
      canEditFolder,
      openOrDownloadFile,
      downloadFolder,
      uploadDropped,
      uploadFlatFiles,
      uploadPathFiles,
    }),
    [
      entries,
      loading,
      quota,
      viewMode,
      setViewMode,
      filters,
      setTypeFilter,
      setPeopleFilter,
      setModifiedFilter,
      clearFilters,
      uploads,
      refresh,
      addFolder,
      addFiles,
      renameEntry,
      moveEntry,
      starEntry,
      trashEntry,
      deleteEntry,
      getByFolder,
      getBreadcrumbs,
      ensureFolderLoaded,
      canEditFolder,
      openOrDownloadFile,
      downloadFolder,
      uploadDropped,
      uploadFlatFiles,
      uploadPathFiles,
    ],
  );

  return (
    <DriveContext.Provider value={value}>
      {children}
      <MediaViewer media={viewer} onClose={() => setViewer(null)} />
    </DriveContext.Provider>
  );
}

export function useDrive() {
  const ctx = useContext(DriveContext);
  if (!ctx) throw new Error("useDrive must be used within DriveProvider");
  return ctx;
}
