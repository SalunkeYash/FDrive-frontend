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

type Envelope<T> = {
  ok: boolean;
  message?: string | unknown;
  data?: T;
};

async function parseError(res: Response): Promise<ApiError> {
  let message = `Request failed (${res.status})`;
  try {
    const body = (await res.json()) as Envelope<unknown> & {
      detail?: string | { msg: string }[];
    };
    if (typeof body.message === "string") message = body.message;
    else if (typeof body.detail === "string") message = body.detail;
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
  const body = (await res.json()) as Envelope<T>;
  if (body && typeof body === "object" && "ok" in body) {
    if (!body.ok) {
      const msg =
        typeof body.message === "string"
          ? body.message
          : `Request failed (${res.status})`;
      throw new ApiError(res.status, msg);
    }
    return body.data as T;
  }
  return body as T;
}

export const api = {
  registerAccount(email: string, password: string, displayName?: string) {
    return apiFetch<TokenResponse>(
      "/auth/register",
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
      "/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
      false,
    );
  },

  logout() {
    const refresh = getRefreshToken();
    if (!refresh) return Promise.resolve();
    return apiFetch<void>(
      "/auth/logout",
      { method: "POST", body: JSON.stringify({ refresh_token: refresh }) },
      false,
    ).catch(() => undefined);
  },

  getProfile() {
    return apiFetch<UserProfile>("/account/profile");
  },

  updateProfile(displayName: string | null) {
    return apiFetch<UserProfile>("/account/profile", {
      method: "PATCH",
      body: JSON.stringify({ display_name: displayName }),
    });
  },

  getStorageQuota() {
    return apiFetch<StorageQuota>("/account/storage-quota");
  },

  listFolderTree() {
    return apiFetch<FolderTreeNode[]>("/folders/tree");
  },

  listFolderContents(parentFolderId?: string | null) {
    const q =
      parentFolderId == null || parentFolderId === ""
        ? ""
        : `?parent_folder_id=${encodeURIComponent(parentFolderId)}`;
    return apiFetch<{ parent_folder_id: string | null; folders: ApiFolder[] }>(
      `/folders/contents${q}`,
    );
  },

  createFolder(name: string, parentFolderId?: string | null) {
    return apiFetch<ApiFolder>("/folders", {
      method: "POST",
      body: JSON.stringify({
        name,
        parent_folder_id: parentFolderId || null,
      }),
    });
  },

  renameFolder(folderId: string, name: string) {
    return apiFetch<ApiFolder>(`/folders/${folderId}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
  },

  listFolderFiles(folderId?: string | null) {
    const q =
      folderId == null || folderId === ""
        ? ""
        : `?folder_id=${encodeURIComponent(folderId)}`;
    return apiFetch<ApiFile[]>(`/files${q}`);
  },

  renameFile(fileId: string, fileName: string) {
    return apiFetch<ApiFile>(`/files/${fileId}`, {
      method: "PATCH",
      body: JSON.stringify({ file_name: fileName }),
    });
  },

  moveFile(fileId: string, destinationFolderId: string | null) {
    return apiFetch<ApiFile>(`/files/${fileId}/move`, {
      method: "POST",
      body: JSON.stringify({ destination_folder_id: destinationFolderId }),
    });
  },

  moveFolder(folderId: string, destinationParentFolderId: string | null) {
    return apiFetch<ApiFolder>(`/folders/${folderId}/move`, {
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
    return apiFetch<ShareResponse>("/shares/user", {
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
    return apiFetch<ShareResponse>("/shares/link", {
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
    return apiFetch<ResourceAccess>("/shares/link-access", {
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
    return apiFetch<ResourceAccess>(`/shares/resource-access?${params}`);
  },

  listMyShares() {
    return apiFetch<ShareResponse[]>("/shares/mine");
  },

  listSharedWithMe() {
    return apiFetch<SharedWithMeItem[]>("/shares/shared-with-me");
  },

  revokeShare(shareId: string) {
    return apiFetch<void>(`/shares/${shareId}/revoke`, {
      method: "POST",
    });
  },

  accessSharedLink(token: string) {
    return apiFetch<SharedLinkAccess>(
      `/shares/link/${encodeURIComponent(token)}`,
      {},
      false,
    );
  },

  resolveSharedItem(resourceType: "file" | "folder", resourceId: string) {
    const params = new URLSearchParams({
      resource_type: resourceType,
      resource_id: resourceId,
    });
    return apiFetch<ResolveSharedItem>(
      `/shares/resolve?${params}`,
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
    return apiFetch<AccessRequestItem>("/shares/access-requests", {
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
    return apiFetch<AccessRequestItem[]>(`/shares/access-requests?${params}`);
  },

  approveAccessRequest(requestId: string) {
    return apiFetch<ShareResponse>(
      `/shares/access-requests/${requestId}/approve`,
      { method: "POST" },
    );
  },

  denyAccessRequest(requestId: string) {
    return apiFetch<void>(`/shares/access-requests/${requestId}/deny`, {
      method: "POST",
    });
  },

  listSharedLinkContents(token: string, folderId?: string | null) {
    const params = new URLSearchParams();
    if (folderId) params.set("folder_id", folderId);
    const qs = params.toString();
    return apiFetch<SharedLinkContents>(
      `/shares/link/${encodeURIComponent(token)}/contents${qs ? `?${qs}` : ""}`,
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
      `/shares/link/${encodeURIComponent(token)}/files/${fileId}/download-url`,
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
      `/shares/link/${encodeURIComponent(token)}/files/${fileId}/preview-url`,
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
      `/shares/link/${encodeURIComponent(token)}/files/${fileId}/thumbnail-url`,
      {},
      false,
    );
  },

  async uploadFile(file: File, folderId?: string | null) {
    const meta = await apiFetch<{
      file_id: string;
      upload_url: string;
      required_headers: Record<string, string>;
    }>("/files/upload-url", {
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

    return apiFetch<ApiFile>(`/files/${meta.file_id}/complete-upload`, {
      method: "POST",
    });
  },

  async getDownloadUrl(fileId: string) {
    return apiFetch<{
      download_url: string;
      file_name: string;
    }>(`/files/${fileId}/download-url`);
  },

  async getPreviewUrl(fileId: string) {
    return apiFetch<{
      preview_url: string;
      mime_type: string | null;
    }>(`/previews/${fileId}/preview-url`);
  },

  async getThumbnailUrl(fileId: string) {
    return apiFetch<{
      preview_url: string;
      mime_type: string | null;
    }>(`/previews/${fileId}/thumbnail-url`);
  },

  listTrash() {
    return apiFetch<{ items: TrashItem[] }>("/trash");
  },

  moveFileToTrash(fileId: string) {
    return apiFetch<ApiFile>(`/trash/files/${fileId}`, {
      method: "POST",
    });
  },

  restoreFileFromTrash(fileId: string) {
    return apiFetch<ApiFile>(`/trash/files/${fileId}/restore`, {
      method: "POST",
    });
  },

  permanentlyDeleteFile(fileId: string) {
    return apiFetch<void>(`/trash/files/${fileId}/delete`, {
      method: "POST",
    });
  },

  moveFolderToTrash(folderId: string) {
    return apiFetch<ApiFolder>(`/trash/folders/${folderId}`, {
      method: "POST",
    });
  },

  restoreFolderFromTrash(folderId: string) {
    return apiFetch<ApiFolder>(`/trash/folders/${folderId}/restore`, {
      method: "POST",
    });
  },

  permanentlyDeleteFolder(folderId: string) {
    return apiFetch<void>(`/trash/folders/${folderId}/delete`, {
      method: "POST",
    });
  },

  searchDrive(q: string) {
    return apiFetch<{
      query: string;
      files: ApiFile[];
      folders: ApiFolder[];
    }>(`/search?q=${encodeURIComponent(q)}`);
  },
};
