import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AiFillFolder } from "react-icons/ai";
import { BsThreeDotsVertical } from "react-icons/bs";
import { useDrive } from "@/context/DriveContext";
import { matchesDriveFilters } from "@/lib/driveFilters";
import FileDropDown from "./FileDropDown";
import Rename from "./Rename";

function GetFolders({
  folderId,
  select,
}: {
  folderId: string;
  select: string;
}) {
  const [openMenu, setOpenMenu] = useState("");
  const [renameToggle, setRenameToggle] = useState("");
  const navigate = useNavigate();
  const { entries, getByFolder, viewMode, filters } = useDrive();
  const folderList = select ? entries : getByFolder(folderId);
  const isList = viewMode === "list";

  const handleMenuToggle = (fileId: string) => {
    setRenameToggle("");
    setOpenMenu((prev) => (prev === fileId ? "" : fileId));
    window.dispatchEvent(
      new CustomEvent("drive-menu-open", {
        detail: { fileId, source: "folders" },
      }),
    );
  };

  React.useEffect(() => {
    const handleCloseOtherMenus = (event: Event) => {
      const customEvent = event as CustomEvent<{ source: string }>;
      if (customEvent.detail?.source !== "folders") {
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
      {folderList.map((folder) => {
        let condition = folder.isFolder && !folder.isTrashed;
        if (select === "starred")
          condition = folder.isFolder && folder.isStarred && !folder.isTrashed;
        else if (select === "trashed")
          condition = folder.isFolder && folder.isTrashed;
        else if (select === "shared-with-me")
          condition =
            folder.isFolder &&
            !folder.isTrashed &&
            Boolean(folder.isSharedWithMe) &&
            folder.folderId === "";
        if (!condition) return null;
        if (select !== "shared-with-me" && !matchesDriveFilters(folder, filters))
          return null;

        const openFolder = () => {
          if (select !== "trashed") {
            navigate(`/drive/folders/${folder.id}`);
          }
        };

        if (isList) {
          return (
            <div
              key={folder.id}
              data-file-menu={folder.id}
              onDoubleClick={openFolder}
              className="relative flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-darkC2"
            >
              <AiFillFolder className="h-6 w-6 shrink-0 text-textC" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-textC">
                {folder.folderName}
              </span>
              <span className="hidden text-xs text-[#5f6368] tablet:inline">
                Folder
              </span>
              <BsThreeDotsVertical
                onClick={(event) => {
                  event.stopPropagation();
                  handleMenuToggle(folder.id);
                }}
                className="h-6 w-6 shrink-0 cursor-pointer rounded-full p-1 hover:bg-[#ccc]"
              />
              {openMenu === folder.id && (
                <FileDropDown
                  file={folder}
                  setOpenMenu={setOpenMenu}
                  isFolderComp
                  select={select}
                  folderId={folder.id}
                  setRenameToggle={setRenameToggle}
                />
              )}
              {renameToggle === folder.id && (
                <Rename
                  setRenameToggle={setRenameToggle}
                  fileId={folder.id}
                  fileName={folder.folderName}
                  isFolder
                  fileExtension=""
                />
              )}
            </div>
          );
        }

        return (
          <div
            key={folder.id}
            data-file-menu={folder.id}
            onDoubleClick={openFolder}
            className="relative flex w-[13.75rem] cursor-alias items-center justify-between rounded-xl bg-darkC2 p-3 hover:bg-darkC"
          >
            <div className="flex items-center space-x-2">
              <AiFillFolder className="h-6 w-6" />
              <span className="w-32 truncate text-sm font-medium text-textC">
                {folder.folderName}
              </span>
            </div>
            <BsThreeDotsVertical
              onClick={(event) => {
                event.stopPropagation();
                handleMenuToggle(folder.id);
              }}
              className="h-6 w-6 cursor-pointer rounded-full p-1 hover:bg-[#ccc]"
            />
            {openMenu === folder.id && (
              <FileDropDown
                file={folder}
                setOpenMenu={setOpenMenu}
                isFolderComp
                select={select}
                folderId={folder.id}
                setRenameToggle={setRenameToggle}
              />
            )}
            {renameToggle === folder.id && (
              <Rename
                setRenameToggle={setRenameToggle}
                fileId={folder.id}
                fileName={folder.folderName}
                isFolder
                fileExtension=""
              />
            )}
          </div>
        );
      })}
    </>
  );
}

export default GetFolders;
