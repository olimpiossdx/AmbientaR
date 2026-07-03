/** Fonte de sync Microsoft Graph (conta projetos ou financeiro). */
export type OnedriveSyncSourceKind = "projects" | "financial";

export type OnedriveSyncSource = {
  id: string;
  kind: OnedriveSyncSourceKind;
  provider: "microsoft_graph";
  driveId: string;
  driveName?: string;
  rootFolderItemId?: string;
  lastDeltaLink?: string;
  lastSyncAt?: string;
  lastSyncStatus?: "idle" | "running" | "ok" | "error";
  lastSyncError?: string;
  catalogVersion?: number;
  updatedAt?: string;
};

export type ClientFolderLinkMethod =
  | "admin_manual"
  | "auto_matched"
  | "auto_confirmed_by_admin";

export type ClientFolderPortalAccess = "readonly" | "readwrite";

export type ClientFolderLinkStatus =
  | "pending_review"
  | "active"
  | "rejected";

export type ClientFolderLink = {
  id: string;
  clientId: string;
  syncSourceId: string;
  oneDriveItemId: string;
  oneDrivePath: string;
  linkMethod: ClientFolderLinkMethod;
  matchScore?: number;
  matchReason?: string;
  status: ClientFolderLinkStatus;
  portalAccess: ClientFolderPortalAccess;
  syncEnabled: boolean;
  /** Cursor Graph delta desta pasta (por cliente). */
  lastDeltaLink?: string;
  lastSyncAt?: string;
  billingStatus?: "none" | "pending" | "active" | "suspended";
  storageQuotaMb?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type OnedriveCatalogNamespace = "technical" | "financial" | "client_portal";

export type OnedriveIndexStatus = "pending" | "indexed" | "skipped" | "failed";

export type OnedriveCatalogEntry = {
  id: string;
  syncSourceId: string;
  clientId?: string;
  itemId: string;
  parentItemId?: string;
  path: string;
  name: string;
  isFolder: boolean;
  size?: number;
  mimeType?: string;
  modifiedAt?: string;
  deleted: boolean;
  eTag?: string;
  namespace: OnedriveCatalogNamespace;
  indexStatus?: OnedriveIndexStatus;
  updatedAt?: string;
};

export type GraphDriveItem = {
  id: string;
  name: string;
  eTag?: string;
  size?: number;
  webUrl?: string;
  folder?: { childCount?: number };
  file?: { mimeType?: string };
  parentReference?: {
    driveId?: string;
    id?: string;
    path?: string;
  };
  deleted?: Record<string, unknown>;
};

export type GraphDeltaResponse = {
  value?: GraphDriveItem[];
  "@odata.nextLink"?: string;
  "@odata.deltaLink"?: string;
};
