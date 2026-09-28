import { useState, type DragEvent, type ReactNode } from "react";
import { MdOutlineFileUpload } from "react-icons/md";
import { useDrive } from "@/context/DriveContext";

function DropZone({
  folderId,
  children,
  enabled = true,
}: {
  folderId: string;
  children: ReactNode;
  enabled?: boolean;
}) {
  const { uploadDropped } = useDrive();
  const [dragging, setDragging] = useState(false);
  const [depth, setDepth] = useState(0);

  if (!enabled) return <>{children}</>;

  const onDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.dataTransfer.types.includes("Files")) return;
    setDepth((d) => d + 1);
    setDragging(true);
  };

  const onDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDepth((d) => {
      const next = Math.max(0, d - 1);
      if (next === 0) setDragging(false);
      return next;
    });
  };

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    setDepth(0);
    if (!e.dataTransfer) return;
    void uploadDropped(e.dataTransfer, folderId);
  };

  return (
    <div
      className="relative h-full min-h-[60vh]"
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {children}
      {dragging && (
        <div className="pointer-events-none absolute inset-2 z-30 flex items-center justify-center rounded-2xl border-2 border-dashed border-[#1a73e8] bg-[#e8f0fe]/90">
          <div className="flex flex-col items-center gap-2 text-[#1a73e8]">
            <MdOutlineFileUpload className="h-12 w-12" />
            <p className="text-base font-medium">Drop files or folders to upload</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default DropZone;
