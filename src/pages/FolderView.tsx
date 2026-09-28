import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { DotLoader } from "react-spinners";
import DropZone from "@/components/DropZone";
import FileHeader from "@/components/FileHeader";
import GetFiles from "@/components/GetFiles";
import GetFolders from "@/components/GetFolders";
import { useDrive } from "@/context/DriveContext";
import { hasActiveFilters, matchesDriveFilters } from "@/lib/driveFilters";

export default function FolderView() {
  const { folderId = "" } = useParams();
  const {
    getByFolder,
    getBreadcrumbs,
    entries,
    loading,
    viewMode,
    filters,
    ensureFolderLoaded,
  } = useDrive();

  useEffect(() => {
    if (!folderId || loading) return;
    void ensureFolderLoaded(folderId);
  }, [folderId, loading, ensureFolderLoaded]);

  const list = getByFolder(folderId);
  const filtered = useMemo(
    () => list.filter((item) => matchesDriveFilters(item, filters)),
    [list, filters],
  );
  const current = entries.find((e) => e.id === folderId && e.isFolder);
  const canEdit =
    !current?.accessRole ||
    current.accessRole === "owner" ||
    current.accessRole === "editor";
  const breadcrumbs = getBreadcrumbs(folderId);
  const isFolder = filtered.some((item) => item.isFolder && !item.isTrashed);
  const isFile = filtered.some((item) => !item.isFolder && !item.isTrashed);
  const hasUnfiltered =
    list.some((item) => item.isFolder && !item.isTrashed) ||
    list.some((item) => !item.isFolder && !item.isTrashed);
  const isLoading = loading && !hasUnfiltered;
  const layoutClass =
    viewMode === "list"
      ? "flex w-full flex-col gap-0.5 text-textC"
      : "flex flex-wrap justify-start gap-x-3 gap-y-5 text-textC";

  useEffect(() => {
    document.title = `${current?.folderName ?? "Folder"} - Drive`;
  }, [current?.folderName]);

  const body = (
    <>
      {isLoading ? (
        <div className="flex h-full items-center justify-center">
          <DotLoader color="#b8c2d7" size={60} />
        </div>
      ) : isFile || isFolder ? (
        <>
          {isFolder && (
            <div className="mb-5 flex flex-col space-y-4">
              <h2>Folders</h2>
              <div className={layoutClass}>
                <GetFolders folderId={folderId} select="" />
              </div>
            </div>
          )}
          {isFile && (
            <div className="mb-5 flex flex-col space-y-4">
              <h2>Files</h2>
              <div className={layoutClass}>
                <GetFiles folderId={folderId} select="" />
              </div>
            </div>
          )}
        </>
      ) : hasUnfiltered && hasActiveFilters(filters) ? (
        <div className="flex h-full flex-col items-center justify-center text-textC">
          <p className="text-lg font-medium">No items match these filters</p>
          <p className="mt-1 text-sm text-[#5f6368]">
            Try clearing Type, People, or Modified.
          </p>
        </div>
      ) : (
        <div className="flex h-full flex-col items-center justify-center">
          <p className="mb-4 text-sm text-[#5f6368]">
            {canEdit
              ? "Drag and drop files or folders here to upload"
              : "This shared folder is empty"}
          </p>
          <img
            draggable={false}
            src="/empty_state_folder.png"
            alt="empty-folder"
            className="w-full max-w-md object-cover object-center"
          />
        </div>
      )}
    </>
  );

  return (
    <div>
      <FileHeader
        headerName={current?.folderName ?? "Folder"}
        breadcrumbs={breadcrumbs}
      />
      <div className="h-[75vh] w-full overflow-y-auto p-5">
        {canEdit ? <DropZone folderId={folderId}>{body}</DropZone> : body}
      </div>
    </div>
  );
}
