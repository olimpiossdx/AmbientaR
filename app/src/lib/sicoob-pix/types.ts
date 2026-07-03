export type SicoobPixEnvironment = "sandbox" | "production";

export type SicoobOAuthTokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

export type SicoobCobImmediateRequest = {
  calendario: { expiracao: number };
  valor: { original: string };
  chave: string;
  solicitacaoPagador?: string;
  infoAdicionais?: Array<{ nome: string; valor: string }>;
};

export type SicoobCobImmediateResponse = {
  txid: string;
  status: string;
  pixCopiaECola?: string;
  location?: string;
  calendario?: { criacao?: string; expiracao?: number };
  valor?: { original?: string };
};

export type SicoobWebhookPixItem = {
  endToEndId?: string;
  txid?: string;
  valor?: string;
  horario?: string;
  chave?: string;
};

export type SicoobConfigDiagnostic = {
  mockMode: boolean;
  environment: SicoobPixEnvironment;
  hasClientId: boolean;
  hasPixKey: boolean;
  hasCertificate: boolean;
  apiBaseUrl: string;
  ready: boolean;
  notes: string[];
};
