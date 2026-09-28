import { useState, type ChangeEvent } from "react";
import { useParams } from "react-router-dom";
import { HiOutlinePlusSm } from "react-icons/hi";
import DropDown from "./addBtnComponents/DropDown";
import AddFolder from "./addBtnComponents/AddFolder";
import Navbar from "./Navbar";
import ProgressIndicator from "./ProgressIndicator";
import { useDrive } from "@/context/DriveContext";
import { formatBytes } from "@/lib/utils";

function SideMenu() {
  const { folderId = "" } = useParams();
  const [isDropDown, setIsDropDown] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderToggle, setFolderToggle] = useState(false);
  const {
    addFolder,
    quota,
    uploads,
    setUploads,
    uploadFlatFiles,
    uploadPathFiles,
    canEditFolder,
  } = useDrive();

  const currentFolderId = folderId;
  const canUpload = canEditFolder(currentFolderId);
  const bytesUsed = quota?.bytes_used ?? 0;
  const bytesLimit = quota?.bytes_limit ?? 1;

  const uploadFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!canUpload) {
      window.alert("You only have view access to this folder.");
      return;
    }
    await uploadFlatFiles(files, currentFolderId);
  };

  const uploadFolder = async () => {
    if (!canUpload) {
      window.alert("You only have view access to this folder.");
      return null;
    }
    return addFolder(folderName, currentFolderId);
  };

  const uploadFolderFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!canUpload) {
      window.alert("You only have view access to this folder.");
      return;
    }
    await uploadPathFiles(
      files.map((file) => ({
        file,
        relativePath: file.webkitRelativePath || file.name,
      })),
      currentFolderId,
    );
  };

  return (
    <section className="relative z-10 h-[90vh] w-16 space-y-4 duration-500 tablet:w-60">
      <div className="relative">
        {canUpload ? (
          <button
            type="button"
            onClick={() => setIsDropDown((open) => !open)}
            className="mt-1 flex w-fit items-center justify-center space-x-2 rounded-2xl bg-white p-3 text-textC shadow-md shadow-[#ddd] duration-300 hover:bg-darkC2 hover:shadow-[#bbb] tablet:px-5 tablet:py-4"
          >
            <HiOutlinePlusSm className="h-6 w-6" />
            <span className="hidden text-sm font-medium tablet:block">New</span>
          </button>
        ) : (
          <div
            className="mt-1 flex w-fit items-center justify-center space-x-2 rounded-2xl bg-white/70 p-3 text-[#5f6368] tablet:px-5 tablet:py-4"
            title="View-only — uploads are not allowed"
          >
            <HiOutlinePlusSm className="h-6 w-6 opacity-40" />
            <span className="hidden text-sm font-medium tablet:block">
              View only
            </span>
          </div>
        )}
        {isDropDown && canUpload && (
          <DropDown
            setFolderToggle={setFolderToggle}
            uploadFile={uploadFile}
            uploadFolderFiles={uploadFolderFiles}
            setIsDropDown={setIsDropDown}
          />
        )}
      </div>
      <ProgressIndicator uploads={uploads} setUploads={setUploads} />
      {folderToggle && canUpload && (
        <AddFolder
          setFolderToggle={setFolderToggle}
          setFolderName={setFolderName}
          uploadFolder={uploadFolder}
        />
      )}
      <Navbar />
      <div className="absolute bottom-4 left-0 w-full pr-4">
        <div className="rounded-2xl bg-white/90 px-2 py-3 text-sm text-textC shadow-sm shadow-[#ddd] tablet:px-4">
          <div className="mb-2 flex items-center justify-between font-medium">
            <span className="hidden tablet:block">Storage</span>
            <span>
              {formatBytes(bytesUsed)} / {formatBytes(bytesLimit)}
            </span>
          </div>
          <div className="hidden h-2 overflow-hidden rounded-full bg-darkC2 tablet:block">
            <div
              className={`h-full rounded-full ${
                bytesUsed >= bytesLimit / 1.25 ? "bg-red-500" : "bg-[#1a73e8]"
              }`}
              style={{
                width: `${Math.min(100, (bytesUsed / bytesLimit) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default SideMenu;
