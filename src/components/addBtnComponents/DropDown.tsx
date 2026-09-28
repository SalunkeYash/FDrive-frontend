import { MdOutlineCreateNewFolder } from "react-icons/md";
import UploadFileBtn from "./UploadFileBtn";
import type { folderToggleAndUpload } from "@/types";

function DropDown({
  setFolderToggle,
  setIsDropDown,
  uploadFile,
  uploadFolderFiles,
}: folderToggleAndUpload) {
  return (
    <>
      {/* Full-screen click catcher — does not shift layout */}
      <div
        className="fixed inset-0 z-40"
        onClick={() => setIsDropDown(false)}
        aria-hidden
      />
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute left-0 top-[3.75rem] z-50 w-72 overflow-hidden rounded-2xl bg-white text-textC shadow-lg ring-1 ring-[#dadce0]"
      >
        <div className="border-b border-[#e0e3e7] py-2">
          <button
            type="button"
            onClick={() => {
              setFolderToggle(true);
              setIsDropDown(false);
            }}
            className="flex w-full items-center space-x-3 px-4 py-2 hover:bg-darkC"
          >
            <MdOutlineCreateNewFolder className="h-5 w-5" />
            <span>New folder</span>
          </button>
        </div>
        <div className="py-2">
          <UploadFileBtn
            uploadFile={(e) => {
              uploadFile(e);
              setIsDropDown(false);
            }}
            uploadFolderFiles={
              uploadFolderFiles
                ? (e) => {
                    uploadFolderFiles(e);
                    setIsDropDown(false);
                  }
                : undefined
            }
          />
        </div>
      </div>
    </>
  );
}

export default DropDown;
