import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AiFillFolder } from "react-icons/ai";
import { MdOutlineInsertDriveFile } from "react-icons/md";
import { TbDownload } from "react-icons/tb";
import { api, ApiError } from "@/api/client";
import type { ApiFile, ApiFolder, SharedLinkContents } from "@/api/types";
import fileIcons from "@/components/fileIcons";
import { formatBytes } from "@/lib/utils";

const IMAGE_EXTS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "ico",
  "jfif",
  "bmp",
  "heic",
  "raw",
  "cr2",
  "cr3",
  "nef",
  "arw",
  "dng",
  "orf",
  "rw2",
  "raf",
]);

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

function isMedia(file: ApiFile): boolean {
  const mime = file.mime_type || "";
  if (mime.startsWith("image/") || mime.startsWith("video/")) return true;
  return IMAGE_EXTS.has(extOf(file.name));
}

export default function SharedLinkPage() {
  const { token = "" } = useParams();
  const [data, setData] = useState<SharedLinkContents | null>(null);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.listSharedLinkContents(token, folderId);
        if (cancelled) return;
        setData(result);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "Share link not found",
          );
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, folderId]);

  useEffect(() => {
    if (!data) return;
    let cancelled = false;
    (async () => {
      const next: Record<string, string> = {};
      await Promise.all(
        data.files.filter(isMedia).map(async (file) => {
          try {
            const thumb = await api.sharedLinkThumbnailUrl(token, file.id);
            next[file.id] = thumb.preview_url;
          } catch {
            /* ignore missing thumbs */
          }
        }),
      );
      if (!cancelled) setThumbs(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [data, token]);

  const openFile = async (file: ApiFile) => {
    try {
      if (isMedia(file)) {
        const preview = await api.sharedLinkPreviewUrl(token, file.id);
        setPreviewUrl(preview.preview_url);
        setPreviewName(file.name);
        return;
      }
      const dl = await api.sharedLinkDownloadUrl(token, file.id);
      window.open(dl.download_url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not open file");
    }
  };

  const downloadFile = async (file: ApiFile) => {
    try {
      const dl = await api.sharedLinkDownloadUrl(token, file.id);
      window.open(dl.download_url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not download file",
      );
    }
  };

  const goUp = () => {
    if (!data) return;
    if (data.parent_folder_id) setFolderId(data.parent_folder_id);
    else if (data.current_folder_id !== data.resource_id) {
      setFolderId(data.resource_id);
    }
  };

  const canGoBack =
    Boolean(data) &&
    data!.resource_type === "folder" &&
    data!.current_folder_id !== data!.resource_id;

  return (
    <div className="min-h-screen bg-[#f8fafd]">
      <header className="sticky top-0 z-10 border-b border-[#e0e3e7] bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8f0fe]">
              {data?.resource_type === "file" ? (
                <MdOutlineInsertDriveFile className="h-5 w-5 text-[#1a73e8]" />
              ) : (
                <AiFillFolder className="h-5 w-5 text-[#1a73e8]" />
              )}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-medium text-[#1f1f1f] sm:text-xl">
                {data?.resource_name || (loading ? "Loading…" : "Shared item")}
              </h1>
              <p className="truncate text-xs text-[#5f6368]">
                Shared via link
                {data ? ` · ${data.role}` : ""}
              </p>
            </div>
          </div>
          <Link
            to="/login"
            className="shrink-0 rounded-full bg-[#1a73e8] px-4 py-2 text-sm font-medium text-white hover:bg-[#1558b0]"
          >
            Go to Drive
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {canGoBack && (
          <button
            type="button"
            onClick={goUp}
            className="mb-4 rounded-full px-3 py-1.5 text-sm font-medium text-[#1a73e8] hover:bg-[#e8f0fe]"
          >
            ← Back
          </button>
        )}

        {loading && !data && (
          <p className="text-sm text-[#5f6368]">Loading shared items…</p>
        )}

        {data && (
          <>
            {data.folders.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-3 text-sm font-medium text-[#444746]">
                  Folders
                </h2>
                <div className="flex flex-wrap gap-3">
                  {data.folders.map((folder: ApiFolder) => (
                    <button
                      key={folder.id}
                      type="button"
                      onClick={() => setFolderId(folder.id)}
                      className="flex w-[13.75rem] items-center gap-3 rounded-xl bg-[#e9eef6] px-3 py-3 text-left hover:bg-[#dde3ea]"
                    >
                      <AiFillFolder className="h-6 w-6 shrink-0 text-[#444746]" />
                      <span className="truncate text-sm font-medium text-[#1f1f1f]">
                        {folder.name}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="mb-3 text-sm font-medium text-[#444746]">Files</h2>
              {data.files.length === 0 ? (
                <p className="text-sm text-[#5f6368]">No files here.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {data.files.map((file: ApiFile) => {
                    const ext = extOf(file.name);
                    const icon =
                      fileIcons[ext as keyof typeof fileIcons] ?? fileIcons.any;
                    return (
                      <div
                        key={file.id}
                        className="group relative flex flex-col overflow-hidden rounded-xl bg-[#e9eef6] hover:bg-[#dde3ea]"
                      >
                        <button
                          type="button"
                          onClick={() => void openFile(file)}
                          className="flex w-full flex-col text-left"
                        >
                          <div className="flex items-center gap-2 px-3 py-2.5">
                            <span className="h-5 w-5 shrink-0">{icon}</span>
                            <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#1f1f1f]">
                              {file.name}
                            </span>
                          </div>
                          <div className="mx-2 mb-2 flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-white">
                            {thumbs[file.id] ? (
                              <img
                                src={thumbs[file.id]}
                                alt=""
                                className="h-full w-full object-cover object-center [image-orientation:from-image]"
                              />
                            ) : (
                              <div className="h-14 w-14 opacity-80">{icon}</div>
                            )}
                          </div>
                          {file.size_bytes != null && (
                            <p className="px-3 pb-2 text-[11px] text-[#5f6368]">
                              {formatBytes(file.size_bytes)}
                            </p>
                          )}
                        </button>
                        <button
                          type="button"
                          title="Download"
                          onClick={(e) => {
                            e.stopPropagation();
                            void downloadFile(file);
                          }}
                          className="absolute right-2 top-2 rounded-full bg-white p-1.5 text-[#444746] opacity-0 shadow-sm hover:bg-[#f1f3f4] group-hover:opacity-100"
                        >
                          <TbDownload className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={() => {
            setPreviewUrl(null);
            setPreviewName(null);
          }}
        >
          <div
            className="flex max-h-[92vh] max-w-5xl flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {previewName && (
              <p className="mb-3 truncate text-center text-sm text-white">
                {previewName}
              </p>
            )}
            <img
              src={previewUrl}
              alt={previewName || "Preview"}
              className="max-h-[85vh] max-w-full rounded-lg object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
