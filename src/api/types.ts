export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
};

export type UserProfile = {
  id: string;
  email: string;
  display_name: string | null;
  bytes_used: number;
  bytes_limit: number;
};

export type StorageQuota = {
  bytes_used: number;
  bytes_limit: number;
  bytes_remaining: number;
  usage_percent: number;
};

export type ApiFolder = {
  id: string;
  owner_id?: string;
  name: string;
  parent_id: string | null;
  path: string;
  is_trashed: boolean;
  created_at: string;
  updated_at: string;
  access_role?: string | null;
};

export type ApiFile = {
  id: string;
  owner_id?: string;
  name: string;
  folder_id: string | null;
  mime_type: string | null;
  size_bytes: number;
  status: string;
  is_trashed: boolean;
  created_at: string;
  updated_at: string;
  access_role?: string | null;
};

export type FolderTreeNode = {
  id: string;
  name: string;
  parent_id: string | null;
  path: string;
  children: FolderTreeNode[];
};

export type TrashItem = {
  resource_type: string;
  resource_id: string;
  name: string;
  trashed_at: string | null;
  size_bytes: number | null;
};

export type ShareResponse = {
  id: string;
  resource_type: string;
  resource_id: string;
  grantee_user_id: string | null;
  role: string;
  token: string | null;
  expires_at: string | null;
  created_at: string;
};

export type ResourceAccessPerson = {
  share_id: string | null;
  email: string;
  display_name: string | null;
  role: string;
};

export type ResourceLinkAccess = {
  enabled: boolean;
  share_id: string | null;
  token: string | null;
  role: string | null;
};

export type ResourceAccess = {
  resource_type: string;
  resource_id: string;
  owner: ResourceAccessPerson;
  people: ResourceAccessPerson[];
  link: ResourceLinkAccess;
};

export type SharedWithMeItem = {
  share_id: string;
  resource_type: string;
  resource_id: string;
  role: string;
  resource_name: string;
  mime_type?: string | null;
  size_bytes?: number | null;
  folder_id?: string | null;
  parent_id?: string | null;
  updated_at?: string | null;
  is_trashed: boolean;
};

export type SharedLinkAccess = {
  share_id: string;
  resource_type: string;
  resource_id: string;
  role: string;
  resource_name: string;
};

export type SharedLinkContents = {
  share_id: string;
  resource_type: string;
  resource_id: string;
  role: string;
  resource_name: string;
  current_folder_id: string | null;
  parent_folder_id: string | null;
  folders: ApiFolder[];
  files: ApiFile[];
};

export type ResolveSharedItem = {
  status: "public" | "allowed" | "denied" | "not_found" | string;
  resource_type: string;
  resource_id: string;
  resource_name: string | null;
  role: string | null;
  link_token: string | null;
  owner_email: string | null;
};

export type AccessRequestItem = {
  id: string;
  resource_type: string;
  resource_id: string;
  requested_role: string;
  message: string | null;
  status: string;
  requester_email: string | null;
  requester_display_name: string | null;
  resource_name: string | null;
  created_at: string;
};
