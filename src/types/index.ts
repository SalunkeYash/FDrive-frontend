import type { Dispatch, ReactNode, SetStateAction, ChangeEvent } from "react";

export type ViewMode = "grid" | "list";

export type FileEntry = {
  id: string;
  folderName: string;
  isFolder: boolean;
  fileLink: string;
  fileName: string;
  isStarred: boolean;
  isTrashed: boolean;
  fileExtension: string;
  folderId: string;
  fileSize?: number;
  mimeType?: string | null;
  updatedAt?: string;
  isShared?: boolean;
  /** True when this item was shared with the signed-in user */
  isSharedWithMe?: boolean;
  /** owner | viewer | editor — from API when known */
  accessRole?: "owner" | "viewer" | "editor";
  ownerId?: string;
};

export type UploadItem = {
  id: string;
  name: string;
  progress: number;
  fileId?: string;
  fileLink?: string;
};

export type UserInfoProps = {
  setDisplayUserInfo: Dispatch<SetStateAction<boolean>>;
};

export type folderToggleProps = {
  setFolderToggle: Dispatch<SetStateAction<boolean>>;
  setFolderName: Dispatch<SetStateAction<string>>;
  uploadFolder: () => string | null | Promise<string | null>;
};

export type folderToggleAndUpload = {
  uploadFile: (e: ChangeEvent<HTMLInputElement>) => void;
  uploadFolderFiles?: (e: ChangeEvent<HTMLInputElement>) => void;
  setFolderToggle: Dispatch<SetStateAction<boolean>>;
  setIsDropDown: Dispatch<SetStateAction<boolean>>;
};

export type FileIcons = {
  [key: string]: ReactNode;
};

export type ProgressIndicatorProps = {
  uploads: UploadItem[];
  setUploads: Dispatch<SetStateAction<UploadItem[]>>;
};

export type FileDropDownProps = {
  file: FileEntry;
  folderId: string;
  isFolderComp: boolean;
  select: string;
  setOpenMenu: Dispatch<SetStateAction<string>>;
  setRenameToggle: Dispatch<SetStateAction<string>>;
};

export type renameProps = {
  fileExtension: string;
  fileName: string;
  fileId: string;
  isFolder: boolean;
  setRenameToggle: Dispatch<SetStateAction<string>>;
};
