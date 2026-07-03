export type ReferenceSearchHit = {
  title: string;
  content: string;
  sourcePath: string;
  tags?: string[];
  modifiedAt?: string;
  score?: number;
};

export type ReferenceSearchRequest = {
  query?: string;
  pathPrefix?: string;
  cpfCnpj?: string;
  study?: string;
  extensions?: string[];
  modifiedAfter?: string;
  basePath?: string;
  maxResults?: number;
};

export type ReferenceSearchResult = {
  hits: ReferenceSearchHit[];
  citations: string[];
  contextText: string;
  provider: "cloud" | "local";
  matchedByCpfCount?: number;
};
