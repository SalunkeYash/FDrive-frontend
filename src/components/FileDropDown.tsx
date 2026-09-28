import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HiOutlineArrowsExpand } from "react-icons/hi";
import {
  MdDriveFileRenameOutline,
  MdOutlineDriveFileMove,
  MdOutlineRestore,
  MdOutlineShare,
  MdStarBorder,
  MdStarRate,
} from "react-icons/md";
import { AiOutlineLink } from "react-icons/ai";
import { RiDeleteBin6Line, RiFolderSettingsLine } from "react-icons/ri";
import { TbDownload } from "react-icons/tb";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "@/api/client";
import { useDrive } from "@/context/DriveContext";
import type { FileDropDownProps } from "@/types";
import MoveModal from "./MoveModal";
import ShareModal from "./ShareModal";

type FlyoutPos = { top: number; left: number };

function FileDropDown({
  file,
  setOpenMenu,
  select,
  isFolderComp,
  folderId,
  setRenameToggle,
}: FileDropDownProps) {
  const navigate = useNavigate();
  const {
    starEntry,
    trashEntry,
    deleteEntry,
    openOrDownloadFile,
    downloadFolder,
  } = useDrive();
  const [showOrganize, setShowOrganize] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showMove, setShowMove] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [shareFlyout, setShareFlyout] = useState<FlyoutPos | null>(null);
  const [organizeFlyout, setOrganizeFlyout] = useState<FlyoutPos | null>(null);
  const shareBtnRef = useRef<HTMLButtonElement>(null);
  const organizeBtnRef = useRef<HTMLButtonElement>(null);

  const closeMenu = () => setOpenMenu("");
  const role = file.accessRole ?? "owner";
  const isOwner = role === "owner";
  const canEdit = role === "owner" || role === "editor";

  useLayoutEffect(() => {
    if (!showShareMenu || !shareBtnRef.current) {
      setShareFlyout(null);
      return;
    }
    const rect = shareBtnRef.current.getBoundingClientRect();
    setShareFlyout({ top: rect.top, left: rect.right + 4 });
  }, [showShareMenu]);

  useLayoutEffect(() => {
    if (!showOrganize || !organizeBtnRef.current) {
      setOrganizeFlyout(null);
      return;
    }
    const rect = organizeBtnRef.current.getBoundingClientRect();
    setOrganizeFlyout({ top: rect.top, left: rect.right + 4 });
  }, [showOrganize]);

  const copyShareLink = async () => {
    try {
      const resourceType = file.isFolder ? "folder" : "file";
      const url = `${window.location.origin}/open/${resourceType}/${file.id}`;
      await navigator.clipboard.writeText(url);
      setCopyMessage("Link copied");
      setTimeout(() => closeMenu(), 600);
    } catch (err) {
      setCopyMessage(
        err instanceof ApiError ? err.message : "Could not copy link",
      );
    }
  };

  const menuItem =
    "flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-[#f1f3f4]";

  return (
    <>
      {!showMove && !showShare && (
        <section
          onClick={(event) => event.stopPropagation()}
          className="absolute right-0 top-9 z-30 w-56 rounded-lg border border-[#dadce0] bg-white py-1.5 shadow-lg"
        >
          {select !== "trashed" ? (
            <>
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  if (isFolderComp) navigate(`/drive/folders/${folderId}`);
                  else void openOrDownloadFile(file.id, "open");
                }}
                className={menuItem}
              >
                <HiOutlineArrowsExpand className="h-5 w-5 shrink-0 text-[#444746]" />
                <span className="text-sm text-[#1f1f1f]">Open</span>
              </button>

              {isOwner && (
                <button
                  ref={shareBtnRef}
                  type="button"
                  onClick={() => {
                    setShowOrganize(false);
                    setShowShareMenu((prev) => !prev);
                  }}
                  className={`${menuItem} ${showShareMenu ? "bg-[#f1f3f4]" : ""}`}
                >
                  <MdOutlineShare className="h-5 w-5 shrink-0 text-[#444746]" />
                  <span className="flex-1 text-sm text-[#1f1f1f]">Share</span>
                  <span className="text-xs text-[#444746]">▸</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (isFolderComp) {
                    closeMenu();
                    void downloadFolder(folderId);
                  } else {
                    closeMenu();
                    void openOrDownloadFile(file.id, "download");
                  }
                }}
                className={menuItem}
              >
                <TbDownload className="h-5 w-5 shrink-0 text-[#444746]" />
                <span className="text-sm text-[#1f1f1f]">Download</span>
              </button>

              {canEdit && (
                <button
                  type="button"
                  onClick={() => {
                    closeMenu();
                    setRenameToggle(file.id);
                  }}
                  className={menuItem}
                >
                  <MdDriveFileRenameOutline className="h-5 w-5 shrink-0 text-[#444746]" />
                  <span className="text-sm text-[#1f1f1f]">Rename</span>
                </button>
              )}

              {canEdit && (
                <button
                  ref={organizeBtnRef}
                  type="button"
                  onClick={() => {
                    setShowShareMenu(false);
                    setShowOrganize((prev) => !prev);
                  }}
                  className={`${menuItem} border-t border-[#e0e3e7] ${showOrganize ? "bg-[#f1f3f4]" : ""}`}
                >
                  <RiFolderSettingsLine className="h-5 w-5 shrink-0 text-[#444746]" />
                  <span className="flex-1 text-sm text-[#1f1f1f]">Organize</span>
                  <span className="text-xs text-[#444746]">▸</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  starEntry(file.id, !file.isStarred);
                }}
                className={menuItem}
              >
                {file.isStarred ? (
                  <MdStarRate className="h-5 w-5 shrink-0 text-yellow-500" />
                ) : (
                  <MdStarBorder className="h-5 w-5 shrink-0 text-[#444746]" />
                )}
                <span className="text-sm text-[#1f1f1f]">
                  {file.isStarred ? "Remove star" : "Add to starred"}
                </span>
              </button>

              {isOwner && (
                <button
                  type="button"
                  onClick={() => {
                    closeMenu();
                    void trashEntry(file.id, true);
                  }}
                  className={menuItem}
                >
                  <RiDeleteBin6Line className="h-5 w-5 shrink-0 text-[#444746]" />
                  <span className="text-sm text-[#1f1f1f]">Move to bin</span>
                </button>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  void trashEntry(file.id, false);
                }}
                className={menuItem}
              >
                <MdOutlineRestore className="h-5 w-5 shrink-0 text-[#444746]" />
                <span className="text-sm text-[#1f1f1f]">Restore</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  void deleteEntry(file.id);
                }}
                className={menuItem}
              >
                <RiDeleteBin6Line className="h-5 w-5 shrink-0 text-[#444746]" />
                <span className="text-sm text-[#1f1f1f]">Delete forever</span>
              </button>
            </>
          )}
        </section>
      )}

      {showShareMenu &&
        !showShare &&
        shareFlyout &&
        createPortal(
          <div
            data-file-menu={file.id}
            className="fixed z-[80] w-44 rounded-lg border border-[#dadce0] bg-white py-1 shadow-lg"
            style={{ top: shareFlyout.top, left: shareFlyout.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                setShowShareMenu(false);
                setShareFlyout(null);
                setShowShare(true);
              }}
              className={menuItem}
            >
              <MdOutlineShare className="h-5 w-5 shrink-0 text-[#444746]" />
              <span className="text-sm text-[#1f1f1f]">Share</span>
            </button>
            <button
              type="button"
              onClick={() => void copyShareLink()}
              className={menuItem}
            >
              <AiOutlineLink className="h-5 w-5 shrink-0 text-[#444746]" />
              <span className="text-sm text-[#1f1f1f]">Copy link</span>
            </button>
            {copyMessage && (
              <p className="px-4 py-1 text-xs text-[#188038]">{copyMessage}</p>
            )}
          </div>,
          document.body,
        )}

      {showOrganize &&
        !showMove &&
        organizeFlyout &&
        createPortal(
          <div
            data-file-menu={file.id}
            className="fixed z-[80] w-44 rounded-lg border border-[#dadce0] bg-white py-1 shadow-lg"
            style={{ top: organizeFlyout.top, left: organizeFlyout.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                setShowOrganize(false);
                setOrganizeFlyout(null);
                setShowMove(true);
              }}
              className={menuItem}
            >
              <MdOutlineDriveFileMove className="h-5 w-5 shrink-0 text-[#444746]" />
              <span className="text-sm text-[#1f1f1f]">Move</span>
            </button>
          </div>,
          document.body,
        )}

      {showMove && (
        <MoveModal
          entry={file}
          onClose={() => {
            setShowMove(false);
            closeMenu();
          }}
        />
      )}
      {showShare && (
        <ShareModal
          entry={file}
          onClose={() => {
            setShowShare(false);
            closeMenu();
          }}
        />
      )}
    </>
  );
}

export default FileDropDown;
