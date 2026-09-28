import { useMemo, useState } from "react";
import { AiFillFolder, AiOutlineClose } from "react-icons/ai";
import { useDrive } from "@/context/DriveContext";
import type { FileEntry } from "@/types";

type MoveModalProps = {
  entry: FileEntry;
  onClose: () => void;
};

function MoveModal({ entry, onClose }: MoveModalProps) {
  const { entries, moveEntry } = useDrive();
  const [destinationId, setDestinationId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const folders = useMemo(() => {
    const list = entries.filter(
      (e) => e.isFolder && !e.isTrashed && e.id !== entry.id,
    );

    // Don't allow moving a folder into its own descendant.
    if (entry.isFolder) {
      const blocked = new Set<string>([entry.id]);
      let grew = true;
      while (grew) {
        grew = false;
        for (const f of list) {
          if (blocked.has(f.folderId) && !blocked.has(f.id)) {
            blocked.add(f.id);
            grew = true;
          }
        }
      }
      return list.filter((f) => !blocked.has(f.id));
    }
    return list;
  }, [entries, entry]);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const ok = await moveEntry(
      entry.id,
      entry.isFolder,
      destinationId || null,
    );
    setBusy(false);
    if (ok) onClose();
    else setError("Could not move item.");
  };

  return (
    <div
      data-drive-modal
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-[#1f1f1f]">
            Move “{entry.isFolder ? entry.folderName : entry.fileName}”
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-darkC2"
            aria-label="Close"
          >
            <AiOutlineClose className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-2 text-sm text-textC">Choose a destination folder</p>
        <div className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-[#e0e3e7] p-2">
          <button
            type="button"
            onClick={() => setDestinationId("")}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${
              destinationId === "" ? "bg-[#e8f0fe]" : "hover:bg-darkC2"
            }`}
          >
            <AiFillFolder className="h-5 w-5 text-textC" />
            My Drive
          </button>
          {folders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              onClick={() => setDestinationId(folder.id)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                destinationId === folder.id ? "bg-[#e8f0fe]" : "hover:bg-darkC2"
              }`}
            >
              <AiFillFolder className="h-5 w-5 text-textC" />
              <span className="truncate">{folder.folderName}</span>
            </button>
          ))}
        </div>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-medium hover:bg-darkC2"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              void submit();
            }}
            className="rounded-full bg-[#1a73e8] px-4 py-2 text-sm font-medium text-white hover:bg-[#1558b0] disabled:opacity-60"
          >
            {busy ? "Moving…" : "Move"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MoveModal;
