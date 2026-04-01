export type AbntWebRefInput = {
  title: string;
  url: string;
  accessedAt?: Date;
};

function normalizeTitle(value: string): string {
  return (value || "Fonte sem título").trim().replace(/\s+/g, " ");
}

function normalizeUrl(value: string): string {
  return (value || "").trim();
}

function formatAccessDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = String(date.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Formata referência web em estilo ABNT (NBR 6023 simplificada para conteúdo online).
 */
export function formatAbntWebReference(input: AbntWebRefInput): string {
  const title = normalizeTitle(input.title).toUpperCase();
  const url = normalizeUrl(input.url);
  const accessedAt = formatAccessDate(input.accessedAt ?? new Date());
  return `${title}. Disponível em: <${url}>. Acesso em: ${accessedAt}.`;
}
