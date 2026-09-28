import { useState } from "react";
import { AiOutlineClose, AiOutlineLoading3Quarters } from "react-icons/ai";
import {
  IoIosArrowDown,
  IoIosArrowUp,
  IoMdCheckmarkCircle,
} from "react-icons/io";
import { useDrive } from "@/context/DriveContext";
import fileIcons from "./fileIcons";
import type { ProgressIndicatorProps } from "@/types";

function ProgressIndicator({ uploads, setUploads }: ProgressIndicatorProps) {
  const [minimize, setMinimize] = useState(false);
  const { openOrDownloadFile } = useDrive();
  const activeUploads = uploads.filter((upload) => upload.progress < 100);
  const isUploading = activeUploads.length > 0;

  const fileNames = uploads.map((upload) => {
    const fileExtension = upload.name.split(".").pop();
    const isReady = upload.progress >= 100;
    return (
      <div
        key={upload.id}
        onClick={() => {
          if (!isReady || !upload.fileId) return;
          void openOrDownloadFile(upload.fileId, "open");
        }}
        className={`flex items-center justify-between bg-white py-2.5 pl-4 pr-2 ${
          isReady && upload.fileId
            ? "cursor-pointer hover:bg-darkC"
            : "cursor-default"
        }`}
      >
        <div className="flex items-center space-x-3">
          {fileExtension && fileIcons[fileExtension] ? (
            <div className="h-6 w-6">{fileIcons[fileExtension]}</div>
          ) : (
            <div className="h-6 w-6">{fileIcons["any"]}</div>
          )}
          <span className="w-60 truncate">{upload.name}</span>
        </div>
        {upload.progress < 100 ? (
          <span className="pr-2">{upload.progress}%</span>
        ) : (
          <IoMdCheckmarkCircle className="h-9 w-9 p-1.5 pr-2 text-green-600" />
        )}
      </div>
    );
  });

  if (uploads.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-0 right-0 z-30 p-0">
      <div
        className={`pointer-events-auto w-[23rem] overflow-hidden rounded-t-2xl bg-white shadow-lg ring-1 ring-[#dadce0] ${
          minimize ? "max-h-12" : "max-h-80"
        }`}
      >
        <div className="flex items-center justify-between bg-bgc py-2 pl-4 pr-2">
          {isUploading ? (
            <h3 className="flex items-center space-x-5 font-medium text-textC">
              <span className="animate-pulse">
                Uploading {activeUploads.length} file
                {activeUploads.length > 1 && "s"}
              </span>
              <AiOutlineLoading3Quarters className="animate-spin text-green-600" />
            </h3>
          ) : (
            <h3 className="font-medium text-textC">
              {uploads.length} upload{uploads.length > 1 && "s"} complete
            </h3>
          )}
          <div className="flex items-center">
            {minimize ? (
              <IoIosArrowUp
                onClick={() => setMinimize(false)}
                className="h-9 w-9 cursor-pointer rounded-full p-2 hover:bg-darkC"
              />
            ) : (
              <IoIosArrowDown
                onClick={() => setMinimize(true)}
                className="h-9 w-9 cursor-pointer rounded-full p-2 hover:bg-darkC"
              />
            )}
            <AiOutlineClose
              onClick={() => setUploads([])}
              className="h-9 w-9 cursor-pointer rounded-full p-2 hover:bg-darkC"
            />
          </div>
        </div>
        {!minimize && (
          <div className="flex max-h-60 flex-col overflow-y-auto">{fileNames}</div>
        )}
      </div>
    </div>
  );
}

export default ProgressIndicator;
