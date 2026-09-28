import { AiOutlineClose } from "react-icons/ai";

export type MediaViewerState = {
  url: string;
  name: string;
  mimeType: string | null;
} | null;

function MediaViewer({
  media,
  onClose,
}: {
  media: MediaViewerState;
  onClose: () => void;
}) {
  if (!media) return null;

  const isVideo = (media.mimeType || "").startsWith("video/");
  const isImage = (media.mimeType || "").startsWith("image/");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative flex h-[92vh] w-[96vw] max-w-7xl flex-col overflow-hidden rounded-xl bg-black shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <p className="min-w-0 truncate text-sm text-white/90">{media.name}</p>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Close preview"
          >
            <AiOutlineClose className="h-5 w-5" />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center p-2 sm:p-4">
          {isVideo ? (
            <video
              key={media.url}
              src={media.url}
              controls
              autoPlay
              className="max-h-full max-w-full object-contain"
            />
          ) : isImage ? (
            <img
              src={media.url}
              alt={media.name}
              className="max-h-full max-w-full object-contain [image-orientation:from-image]"
            />
          ) : (
            <div className="p-8 text-white">
              Preview is not available for this file type.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MediaViewer;
