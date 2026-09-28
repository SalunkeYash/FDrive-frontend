import { useEffect } from "react";
import { DotLoader } from "react-spinners";
import FileHeader from "@/components/FileHeader";
import GetFiles from "@/components/GetFiles";
import GetFolders from "@/components/GetFolders";
import { useDrive } from "@/context/DriveContext";

export default function Starred() {
  const { entries, loading, viewMode } = useDrive();
  const isFolder = entries.some(
    (i) => i.isFolder && i.isStarred && !i.isTrashed,
  );
  const isFile = entries.some(
    (i) => !i.isFolder && i.isStarred && !i.isTrashed,
  );
  const isLoading = loading && !isFile && !isFolder;
  const layoutClass =
    viewMode === "list"
      ? "flex w-full flex-col gap-0.5 text-textC"
      : "flex flex-wrap justify-start gap-x-3 gap-y-5 text-textC";

  useEffect(() => {
    document.title = "Starred - Drive";
  }, []);

  return (
    <div>
      <FileHeader headerName="Starred" />
      <div className="h-[75vh] w-full overflow-y-auto p-5">
        {!isFile && !isFolder && isLoading ? (
          <div className="flex h-full items-center justify-center">
            <DotLoader color="#b8c2d7" size={60} />
          </div>
        ) : isFile || isFolder ? (
          <>
            {isFolder && (
              <div className="mb-5 flex flex-col space-y-4">
                <h2>Folders</h2>
                <div className={layoutClass}>
                  <GetFolders folderId="" select="starred" />
                </div>
              </div>
            )}
            {isFile && (
              <div className="mb-5 flex flex-col space-y-4">
                <h2>Files</h2>
                <div className={layoutClass}>
                  <GetFiles folderId="" select="starred" />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center">
            <img
              draggable={false}
              src="/empty_state_starred.svg"
              alt="empty-starred"
              className="w-64 object-contain"
            />
            <p className="mt-4 text-textC">No starred files</p>
          </div>
        )}
      </div>
    </div>
  );
}
