import { useState } from "react";
import { useDrive } from "@/context/DriveContext";
import type { renameProps } from "@/types";

function Rename({
  setRenameToggle,
  fileId,
  fileName,
  isFolder,
  fileExtension,
}: renameProps) {
  const [newName, setNewName] = useState(fileName);
  const { renameEntry } = useDrive();

  const rename = () => {
    if (!newName.trim()) return;
    const name = isFolder
      ? newName.trim()
      : newName.includes(".")
        ? newName.trim()
        : `${newName.trim()}.${fileExtension}`;
    void renameEntry(fileId, name, isFolder).then((ok) => {
      if (ok) setRenameToggle("");
    });
  };

  return (
    <div className="absolute top-9 z-10 space-y-2 rounded-xl bg-white p-3 shadow-lg shadow-[#bbb]">
      <h2 className="text-xl">Rename</h2>
      <input
        className="w-full rounded-md border border-textC py-1.5 indent-2 outline-textC2"
        type="text"
        placeholder="Rename"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
      />
      <div className="flex w-full justify-between font-medium text-textC2">
        <button
          type="button"
          onClick={() => setRenameToggle("")}
          className="rounded-full px-3 py-2 hover:bg-darkC2"
        >
          Cancel
        </button>
        <button
          onClick={rename}
          className={`rounded-full px-3 py-2 ${newName && "hover:bg-darkC2"}`}
        >
          Rename
        </button>
      </div>
    </div>
  );
}

export default Rename;
