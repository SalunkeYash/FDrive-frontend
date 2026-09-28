import { useState } from "react";
import type { folderToggleProps } from "@/types";

function AddFolder({
  setFolderToggle,
  setFolderName,
  uploadFolder,
}: folderToggleProps) {
  const [busy, setBusy] = useState(false);

  const addFolder = async () => {
    setBusy(true);
    try {
      const createdId = await uploadFolder();
      if (createdId) setFolderToggle(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      onClick={() => setFolderToggle(false)}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-6 rounded-xl bg-white p-5 shadow-lg"
      >
        <h2 className="text-2xl text-textC">New folder</h2>
        <input
          className="w-full rounded-md border border-textC py-2 indent-5 outline-textC2"
          type="text"
          placeholder="Untitled folder"
          autoFocus
          onChange={(e) => setFolderName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !busy) void addFolder();
          }}
        />
        <div className="flex w-full justify-end space-x-3 font-medium text-textC2">
          <button
            type="button"
            onClick={() => setFolderToggle(false)}
            className="rounded-full px-3 py-2 hover:bg-darkC2"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void addFolder()}
            className="rounded-full px-3 py-2 hover:bg-darkC2 disabled:opacity-50"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddFolder;
