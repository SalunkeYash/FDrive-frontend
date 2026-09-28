export type DroppedFile = {
  file: File;
  relativePath: string;
};

type FileSystemEntryLike = {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
};

type FileSystemFileEntryLike = FileSystemEntryLike & {
  file: (
    success: (file: File) => void,
    error?: (err: DOMException) => void,
  ) => void;
};

type FileSystemDirectoryReaderLike = {
  readEntries: (
    success: (entries: FileSystemEntryLike[]) => void,
    error?: (err: DOMException) => void,
  ) => void;
};

type FileSystemDirectoryEntryLike = FileSystemEntryLike & {
  createReader: () => FileSystemDirectoryReaderLike;
};

async function readFileEntry(
  entry: FileSystemFileEntryLike,
  pathPrefix: string,
): Promise<DroppedFile> {
  const file = await new Promise<File>((resolve, reject) => {
    entry.file(resolve, reject);
  });
  const relativePath = pathPrefix ? `${pathPrefix}/${file.name}` : file.name;
  return { file, relativePath };
}

async function readDirectoryEntry(
  entry: FileSystemDirectoryEntryLike,
  pathPrefix: string,
): Promise<DroppedFile[]> {
  const reader = entry.createReader();
  const collected: DroppedFile[] = [];

  const readBatch = async (): Promise<void> => {
    const entries = await new Promise<FileSystemEntryLike[]>((resolve, reject) => {
      reader.readEntries(resolve, reject);
    });
    if (entries.length === 0) return;

    for (const child of entries) {
      const nextPath = pathPrefix ? `${pathPrefix}/${child.name}` : child.name;
      if (child.isFile) {
        collected.push(
          await readFileEntry(child as FileSystemFileEntryLike, pathPrefix),
        );
      } else if (child.isDirectory) {
        collected.push(
          ...(await readDirectoryEntry(
            child as FileSystemDirectoryEntryLike,
            nextPath,
          )),
        );
      }
    }
    await readBatch();
  };

  await readBatch();
  return collected;
}

/** Collect files/folders from a browser drop event (supports nested folders). */
export async function collectDroppedFiles(
  dataTransfer: DataTransfer,
): Promise<DroppedFile[]> {
  const items = Array.from(dataTransfer.items || []);
  if (items.length === 0) {
    return Array.from(dataTransfer.files || []).map((file) => ({
      file,
      relativePath: file.webkitRelativePath || file.name,
    }));
  }

  const results: DroppedFile[] = [];

  for (const item of items) {
    const entry = item.webkitGetAsEntry?.() as FileSystemEntryLike | null;
    if (!entry) {
      const file = item.getAsFile();
      if (file) {
        results.push({
          file,
          relativePath: file.webkitRelativePath || file.name,
        });
      }
      continue;
    }

    if (entry.isFile) {
      results.push(
        await readFileEntry(entry as FileSystemFileEntryLike, ""),
      );
    } else if (entry.isDirectory) {
      results.push(
        ...(await readDirectoryEntry(
          entry as FileSystemDirectoryEntryLike,
          entry.name,
        )),
      );
    }
  }

  return results;
}
