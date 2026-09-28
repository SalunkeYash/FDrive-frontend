import type {
  AccessRequestItem,
  ApiFile,
  ApiFolder,
  FolderTreeNode,
  ResolveSharedItem,
  ResourceAccess,
  SharedLinkAccess,
  SharedLinkContents,
  SharedWithMeItem,
  ShareResponse,
  StorageQuota,
  TokenResponse,
  TrashItem,
  UserProfile,
} from "./types";

const ACCESS_KEY = "fdrive_access_token";
const REFRESH_KEY = "fdrive_refresh_token";

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function storeTokens(tokens: TokenResponse): void {
  localStorage.setItem(ACCESS_KEY, tokens.access_token);
  localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function parseError(res: Response): Promise<ApiError> {
  let message = `Request failed (${res.status})`;
  try {
    const body = (await res.json()) as { detail?: string | { msg: string }[] };
    if (typeof body.detail === "string") message = body.detail;
    else if (Array.isArray(body.detail) && body.detail[0]?.msg) {
      message = body.detail[0].msg;
    }
  } catch {
    /* ignore */
  }
  return new ApiError(res.status, message);
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (auth) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(path, { ...options, headers });
  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  registerAccount(email: string, password: string, displayName?: string) {
    return apiFetch<TokenResponse>(
      "/api/v1/auth/register-account",
      {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          display_name: displayName || null,
        }),
      },
      false,
    );
  },

  login(email: string, password: string) {
    return apiFetch<TokenResponse>(
      "/api/v1/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
      false,
    );
  },

  logout() {
    const refresh = getRefreshToken();
    if (!refresh) return Promise.resolve();
    return apiFetch<void>(
      "/api/v1/auth/logout",
      { method: "POST", body: JSON.stringify({ refresh_token: refresh }) },
      false,
    ).catch(() => undefined);
  },

  getProfile() {
    return apiFetch<UserProfile>("/api/v1/account/profile");
  },

  updateProfile(displayName: string | null) {
    return apiFetch<UserProfile>("/api/v1/account/profile", {
      method: "PATCH",
      body: JSON.stringify({ display_name: displayName }),
    });
  },

  getStorageQuota() {
    return apiFetch<StorageQuota>("/api/v1/account/storage-quota");
  },

  listFolderTree() {
    return apiFetch<FolderTreeNode[]>("/api/v1/folders/list-folder-tree");
  },

  listFolderContents(parentFolderId?: string | null) {
    const q =
      parentFolderId == null || parentFolderId === ""
        ? ""
        : `?parent_folder_id=${encodeURIComponent(parentFolderId)}`;
    return apiFetch<{ parent_folder_id: string | null; folders: ApiFolder[] }>(
      `/api/v1/folders/list-folder-contents${q}`,
    );
  },

  createFolder(name: string, parentFolderId?: string | null) {
    return apiFetch<ApiFolder>("/api/v1/folders/create-folder", {
      method: "POST",
      body: JSON.stringify({
        name,
        parent_folder_id: parentFolderId || null,
      }),
    });
  },

  renameFolder(folderId: string, name: string) {
    return apiFetch<ApiFolder>(`/api/v1/folders/${folderId}/rename-folder`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
  },

  listFolderFiles(folderId?: string | null) {
    const q =
      folderId == null || folderId === ""
        ? ""
        : `?folder_id=${encodeURIComponent(folderId)}`;
    return apiFetch<ApiFile[]>(`/api/v1/files/list-folder-files${q}`);
  },

  renameFile(fileId: string, fileName: string) {
    return apiFetch<ApiFile>(`/api/v1/files/${fileId}/rename-file`, {
      method: "PATCH",
      body: JSON.stringify({ file_name: fileName }),
    });
  },

  moveFile(fileId: string, destinationFolderId: string | null) {
    return apiFetch<ApiFile>(`/api/v1/files/${fileId}/move-file`, {
      method: "POST",
      body: JSON.stringify({ destination_folder_id: destinationFolderId }),
    });
  },

  moveFolder(folderId: string, destinationParentFolderId: string | null) {
    return apiFetch<ApiFolder>(`/api/v1/folders/${folderId}/move-folder`, {
      method: "POST",
      body: JSON.stringify({
        destination_parent_folder_id: destinationParentFolderId,
      }),
    });
  },

  createUserShare(input: {
    resourceType: "file" | "folder";
    resourceId: string;
    granteeEmail: string;
    role?: "viewer" | "editor";
  }) {
    return apiFetch<ShareResponse>("/api/v1/shares/create-user-share", {
      method: "POST",
      body: JSON.stringify({
        resource_type: input.resourceType,
        resource_id: input.resourceId,
        grantee_email: input.granteeEmail,
        role: input.role || "viewer",
      }),
    });
  },

  createLinkShare(input: {
    resourceType: "file" | "folder";
    resourceId: string;
    role?: "viewer" | "editor";
  }) {
    return apiFetch<ShareResponse>("/api/v1/shares/create-link-share", {
      method: "POST",
      body: JSON.stringify({
        resource_type: input.resourceType,
        resource_id: input.resourceId,
        role: input.role || "viewer",
      }),
    });
  },

  setLinkAccess(input: {
    resourceType: "file" | "folder";
    resourceId: string;
    access: "restricted" | "anyone";
    role?: "viewer" | "editor";
  }) {
    return apiFetch<ResourceAccess>("/api/v1/shares/set-link-access", {
      method: "POST",
      body: JSON.stringify({
        resource_type: input.resourceType,
        resource_id: input.resourceId,
        access: input.access,
        role: input.role || "viewer",
      }),
    });
  },

  listResourceAccess(resourceType: "file" | "folder", resourceId: string) {
    const params = new URLSearchParams({
      resource_type: resourceType,
      resource_id: resourceId,
    });
    return apiFetch<ResourceAccess>(
      `/api/v1/shares/list-resource-access?${params}`,
    );
  },

  listMyShares() {
    return apiFetch<ShareResponse[]>("/api/v1/shares/list-my-shares");
  },

  listSharedWithMe() {
    return apiFetch<SharedWithMeItem[]>("/api/v1/shares/list-shared-with-me");
  },

  revokeShare(shareId: string) {
    return apiFetch<void>(`/api/v1/shares/${shareId}/revoke-share`, {
      method: "POST",
    });
  },

  accessSharedLink(token: string) {
    return apiFetch<SharedLinkAccess>(
      `/api/v1/shares/access-shared-link/${encodeURIComponent(token)}`,
      {},
      false,
    );
  },

  resolveSharedItem(resourceType: "file" | "folder", resourceId: string) {
    const params = new URLSearchParams({
      resource_type: resourceType,
      resource_id: resourceId,
    });
    // Send auth if present so allowed users open directly.
    return apiFetch<ResolveSharedItem>(
      `/api/v1/shares/resolve-shared-item?${params}`,
      {},
      Boolean(getAccessToken()),
    );
  },

  requestAccess(input: {
    resourceType: "file" | "folder";
    resourceId: string;
    role?: "viewer" | "editor";
    message?: string;
  }) {
    return apiFetch<AccessRequestItem>("/api/v1/shares/request-access", {
      method: "POST",
      body: JSON.stringify({
        resource_type: input.resourceType,
        resource_id: input.resourceId,
        role: input.role || "viewer",
        message: input.message || null,
      }),
    });
  },

  listAccessRequests(resourceType: "file" | "folder", resourceId: string) {
    const params = new URLSearchParams({
      resource_type: resourceType,
      resource_id: resourceId,
    });
    return apiFetch<AccessRequestItem[]>(
      `/api/v1/shares/list-access-requests?${params}`,
    );
  },

  approveAccessRequest(requestId: string) {
    return apiFetch<ShareResponse>(
      `/api/v1/shares/access-requests/${requestId}/approve`,
      { method: "POST" },
    );
  },

  denyAccessRequest(requestId: string) {
    return apiFetch<void>(
      `/api/v1/shares/access-requests/${requestId}/deny`,
      { method: "POST" },
    );
  },

  listSharedLinkContents(token: string, folderId?: string | null) {
    const params = new URLSearchParams();
    if (folderId) params.set("folder_id", folderId);
    const qs = params.toString();
    return apiFetch<SharedLinkContents>(
      `/api/v1/shares/link/${encodeURIComponent(token)}/contents${qs ? `?${qs}` : ""}`,
      {},
      false,
    );
  },

  sharedLinkDownloadUrl(token: string, fileId: string) {
    return apiFetch<{
      file_id: string;
      file_name: string;
      download_url: string;
      expires_in_seconds: number;
      size_bytes: number;
      mime_type: string | null;
    }>(
      `/api/v1/shares/link/${encodeURIComponent(token)}/files/${fileId}/download-url`,
      {},
      false,
    );
  },

  sharedLinkPreviewUrl(token: string, fileId: string) {
    return apiFetch<{
      file_id: string;
      variant: string;
      preview_url: string;
      expires_in_seconds: number;
      mime_type: string | null;
    }>(
      `/api/v1/shares/link/${encodeURIComponent(token)}/files/${fileId}/preview-url`,
      {},
      false,
    );
  },

  sharedLinkThumbnailUrl(token: string, fileId: string) {
    return apiFetch<{
      file_id: string;
      variant: string;
      preview_url: string;
      expires_in_seconds: number;
      mime_type: string | null;
    }>(
      `/api/v1/shares/link/${encodeURIComponent(token)}/files/${fileId}/thumbnail-url`,
      {},
      false,
    );
  },

  async uploadFile(file: File, folderId?: string | null) {
    const meta = await apiFetch<{
      file_id: string;
      upload_url: string;
      required_headers: Record<string, string>;
    }>("/api/v1/files/request-upload-url", {
      method: "POST",
      body: JSON.stringify({
        file_name: file.name,
        size_bytes: file.size,
        mime_type: file.type || null,
        folder_id: folderId || null,
      }),
    });

    const put = await fetch(meta.upload_url, {
      method: "PUT",
      headers: new Headers(meta.required_headers),
      body: file,
    });
    if (!put.ok) throw new ApiError(put.status, "Upload to storage failed");

    return apiFetch<ApiFile>(`/api/v1/files/${meta.file_id}/complete-upload`, {
      method: "POST",
    });
  },

  async getDownloadUrl(fileId: string) {
    return apiFetch<{
      download_url: string;
      file_name: string;
    }>(`/api/v1/files/${fileId}/request-download-url`);
  },

  async getPreviewUrl(fileId: string) {
    return apiFetch<{
      preview_url: string;
      mime_type: string | null;
    }>(`/api/v1/previews/${fileId}/request-preview-url`);
  },

  async getThumbnailUrl(fileId: string) {
    return apiFetch<{
      preview_url: string;
      mime_type: string | null;
    }>(`/api/v1/previews/${fileId}/request-thumbnail-url`);
  },

  listTrash() {
    return apiFetch<{ items: TrashItem[] }>("/api/v1/trash/list-trash-items");
  },

  moveFileToTrash(fileId: string) {
    return apiFetch<ApiFile>(`/api/v1/trash/files/${fileId}/move-file-to-trash`, {
      method: "POST",
    });
  },

  restoreFileFromTrash(fileId: string) {
    return apiFetch<ApiFile>(
      `/api/v1/trash/files/${fileId}/restore-file-from-trash`,
      { method: "POST" },
    );
  },

  permanentlyDeleteFile(fileId: string) {
    return apiFetch<void>(
      `/api/v1/trash/files/${fileId}/permanently-delete-file`,
      { method: "POST" },
    );
  },

  moveFolderToTrash(folderId: string) {
    return apiFetch<ApiFolder>(
      `/api/v1/trash/folders/${folderId}/move-folder-to-trash`,
      { method: "POST" },
    );
  },

  restoreFolderFromTrash(folderId: string) {
    return apiFetch<ApiFolder>(
      `/api/v1/trash/folders/${folderId}/restore-folder-from-trash`,
      { method: "POST" },
    );
  },

  permanentlyDeleteFolder(folderId: string) {
    return apiFetch<void>(
      `/api/v1/trash/folders/${folderId}/permanently-delete-folder`,
      { method: "POST" },
    );
  },

  searchDrive(q: string) {
    return apiFetch<{
      query: string;
      files: ApiFile[];
      folders: ApiFolder[];
    }>(`/api/v1/search/search-drive?q=${encodeURIComponent(q)}`);
  },
};
