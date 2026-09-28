import { useEffect, useMemo } from "react";
import { DotLoader } from "react-spinners";
import FileHeader from "@/components/FileHeader";
import GetFiles from "@/components/GetFiles";
import GetFolders from "@/components/GetFolders";
import { useDrive } from "@/context/DriveContext";

export default function SharedWithMe() {
  const { entries, loading, viewMode } = useDrive();

  const list = useMemo(
    () =>
      entries.filter(
        (e) => e.isSharedWithMe && !e.isTrashed && e.folderId === "",
      ),
    [entries],
  );
  const isFolder = list.some((item) => item.isFolder);
  const isFile = list.some((item) => !item.isFolder);
  const isLoading = loading && list.length === 0;
  const layoutClass =
    viewMode === "list"
      ? "flex w-full flex-col gap-0.5 text-textC"
      : "flex flex-wrap justify-start gap-x-3 gap-y-5 text-textC";

  useEffect(() => {
    document.title = "Shared with me - FDrive";
  }, []);

  return (
    <div>
      <FileHeader headerName="Shared with me" />
      <div className="h-[75vh] w-full overflow-y-auto p-5">
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
                  <GetFolders folderId="" select="shared-with-me" />
                </div>
              </div>
            )}
            {isFile && (
              <div className="mb-5 flex flex-col space-y-4">
                <h2>Files</h2>
                <div className={layoutClass}>
                  <GetFiles folderId="" select="shared-with-me" />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-textC">
            <p className="text-lg font-medium">Nothing shared with you yet</p>
            <p className="mt-1 text-sm text-[#5f6368]">
              When someone shares a file or folder, it shows up here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
