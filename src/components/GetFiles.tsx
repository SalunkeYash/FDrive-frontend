import React, { useEffect, useRef, useState } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaPlay } from "react-icons/fa";
import { useDrive } from "@/context/DriveContext";
import { matchesDriveFilters } from "@/lib/driveFilters";
import { formatBytes } from "@/lib/utils";
import fileIcons from "./fileIcons";
import FileDropDown from "./FileDropDown";
import Rename from "./Rename";

const IMAGE_EXTS = [
  "jpg",
  "ico",
  "webp",
  "png",
  "jpeg",
  "gif",
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
];
const VIDEO_EXTS = ["mp4", "webm", "mov", "mkv", "m4v"];

function LazyMediaThumb({
  fileId,
  fileName,
  fileLink,
  isVideo,
  fallback,
  className,
  imgClassName,
}: {
  fileId: string;
  fileName: string;
  fileLink: string;
  isVideo: boolean;
  fallback: React.ReactNode;
  className?: string;
  imgClassName: string;
}) {
  const { requestThumbnail } = useDrive();
  const ref = useRef<HTMLDivElement | null>(null);
  const [src, setSrc] = useState(fileLink);

  useEffect(() => {
    setSrc(fileLink);
  }, [fileLink, fileId]);

  useEffect(() => {
    if (src) return;
    const el = ref.current;
    if (!el) return;

    let cancelled = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        void requestThumbnail(fileId).then((url) => {
          if (!cancelled && url) setSrc(url);
        });
      },
      { rootMargin: "160px" },
    );
    observer.observe(el);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [fileId, src, requestThumbnail]);

  return (
    <div ref={ref} className={className ?? "relative h-full w-full"}>
      {src ? (
        <>
          <img
            src={src}
            alt={fileName}
            draggable={false}
            className={imgClassName}
          />
          {isVideo && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="rounded-full bg-black/55 p-3 text-white">
                <FaPlay className="h-4 w-4 translate-x-0.5" />
              </span>
            </span>
          )}
        </>
      ) : (
        fallback
      )}
    </div>
  );
}

function GetFiles({ folderId, select }: { folderId: string; select: string }) {
  const [openMenu, setOpenMenu] = useState("");
  const [renameToggle, setRenameToggle] = useState("");
  const { entries, getByFolder, openOrDownloadFile, viewMode, filters } =
    useDrive();
  const fileList = select ? entries : getByFolder(folderId);
  const isList = viewMode === "list";

  const openFile = (fileId: string) => {
    void openOrDownloadFile(fileId, "open");
  };

  const handleMenuToggle = (fileId: string) => {
    setRenameToggle("");
    setOpenMenu((prev) => (prev === fileId ? "" : fileId));
    window.dispatchEvent(
      new CustomEvent("drive-menu-open", {
        detail: { fileId, source: "files" },
      }),
    );
  };

  React.useEffect(() => {
    const handleCloseOtherMenus = (event: Event) => {
      const customEvent = event as CustomEvent<{ source: string }>;
      if (customEvent.detail?.source !== "files") {
        setOpenMenu("");
        setRenameToggle("");
      }
    };
    window.addEventListener(
      "drive-menu-open",
      handleCloseOtherMenus as EventListener,
    );
    return () =>
      window.removeEventListener(
        "drive-menu-open",
        handleCloseOtherMenus as EventListener,
      );
  }, []);

  React.useEffect(() => {
    if (!openMenu) return;
    const onDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest(`[data-file-menu="${openMenu}"]`)) return;
      if (target?.closest("[data-drive-modal]")) return;
      setOpenMenu("");
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openMenu]);

  return (
    <>
      {fileList.map((file) => {
        let condition = !file.isFolder && !file.isTrashed;
        if (select === "starred")
          condition = !file.isFolder && file.isStarred && !file.isTrashed;
        else if (select === "trashed")
          condition = !file.isFolder && file.isTrashed;
        else if (select === "shared-with-me")
          condition =
            !file.isFolder &&
            !file.isTrashed &&
            Boolean(file.isSharedWithMe) &&
            file.folderId === "";
        if (!condition) return null;
        if (select !== "shared-with-me" && !matchesDriveFilters(file, filters))
          return null;

        const icon =
          fileIcons[file.fileExtension as keyof typeof fileIcons] ??
          fileIcons["any"];

        const isImage =
          IMAGE_EXTS.includes(file.fileExtension) ||
          (file.mimeType || "").startsWith("image/");
        const isVideo =
          VIDEO_EXTS.includes(file.fileExtension) ||
          (file.mimeType || "").startsWith("video/");
        const isMedia = isImage || isVideo;

        let preview: React.ReactNode;
        if (isMedia) {
          preview = (
            <LazyMediaThumb
              fileId={file.id}
              fileName={file.fileName}
              fileLink={file.fileLink}
              isVideo={isVideo}
              fallback={<div className="flex h-full w-full items-center justify-center"><div className="h-36 w-36">{icon}</div></div>}
              imgClassName="h-full w-full rounded-sm object-cover object-center [image-orientation:from-image]"
            />
          );
        } else if (file.fileExtension === "mp3" && file.fileLink) {
          preview = (
            <div className="flex flex-col items-center justify-center">
              <div className="h-24 w-24">{icon}</div>
              <audio controls className="w-44">
                <source src={file.fileLink} type="audio/mpeg" />
              </audio>
            </div>
          );
        } else {
          preview = <div className="h-36 w-36">{icon}</div>;
        }

        if (isList) {
          return (
            <div
              key={file.id}
              data-file-menu={file.id}
              onDoubleClick={() => openFile(file.id)}
              className="relative flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-darkC2"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-darkC2">
                {isMedia ? (
                  <LazyMediaThumb
                    fileId={file.id}
                    fileName=""
                    fileLink={file.fileLink}
                    isVideo={false}
                    fallback={<div className="h-6 w-6">{icon}</div>}
                    className="relative h-full w-full"
                    imgClassName="h-full w-full object-cover [image-orientation:from-image]"
                  />
                ) : (
                  <div className="h-6 w-6">{icon}</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-textC">
                  {file.fileName}
                </p>
                <p className="text-xs text-[#5f6368]">
                  {file.fileSize != null ? formatBytes(file.fileSize) : "—"}
                </p>
              </div>
              <BsThreeDotsVertical
                onClick={(event) => {
                  event.stopPropagation();
                  handleMenuToggle(file.id);
                }}
                className="h-6 w-6 shrink-0 cursor-pointer rounded-full p-1 hover:bg-[#ccc]"
              />
              {openMenu === file.id && (
                <FileDropDown
                  file={file}
                  setOpenMenu={setOpenMenu}
                  isFolderComp={false}
                  select={select}
                  folderId=""
                  setRenameToggle={setRenameToggle}
                />
              )}
              {renameToggle === file.id && (
                <Rename
                  setRenameToggle={setRenameToggle}
                  fileId={file.id}
                  isFolder={false}
                  fileName={file.fileName}
                  fileExtension={file.fileExtension}
                />
              )}
            </div>
          );
        }

        return (
          <div
            key={file.id}
            onDoubleClick={() => openFile(file.id)}
            className="hover:cursor-alias"
          >
            <div className="flex w-full flex-col items-center justify-center overflow-visible rounded-xl bg-darkC2 px-2.5 hover:bg-darkC">
              <div
                data-file-menu={file.id}
                className="relative flex w-full items-center justify-between px-1 py-3"
              >
                <div className="flex items-center space-x-4">
                  <div className="h-6 w-6">{icon}</div>
                  <span className="w-32 truncate text-sm font-medium text-textC">
                    {file.fileName}
                  </span>
                </div>
                <BsThreeDotsVertical
                  onClick={(event) => {
                    event.stopPropagation();
                    handleMenuToggle(file.id);
                  }}
                  className="h-6 w-6 cursor-pointer rounded-full p-1 hover:bg-[#ccc]"
                />
                {openMenu === file.id && (
                  <FileDropDown
                    file={file}
                    setOpenMenu={setOpenMenu}
                    isFolderComp={false}
                    select={select}
                    folderId=""
                    setRenameToggle={setRenameToggle}
                  />
                )}
                {renameToggle === file.id && (
                  <Rename
                    setRenameToggle={setRenameToggle}
                    fileId={file.id}
                    isFolder={false}
                    fileName={file.fileName}
                    fileExtension={file.fileExtension}
                  />
                )}
              </div>
              <div className="flex h-44 w-48 items-center justify-center overflow-hidden pb-2.5">
                {preview}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

export default GetFiles;
