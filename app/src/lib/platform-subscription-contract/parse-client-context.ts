import type { PlatformSubscriptionClientContext } from "./types";

/** Interpretação leve de User-Agent (marca/modelo quando disponível). */
export function parseClientContextFromUserAgent(
  userAgent: string | undefined,
  ipAddress?: string,
): PlatformSubscriptionClientContext {
  const ua = (userAgent ?? "").trim();
  if (!ua && !ipAddress) return { ipAddress };

  let osLabel = "Desconhecido";
  if (/Windows NT/i.test(ua)) osLabel = "Windows";
  else if (/Mac OS X|Macintosh/i.test(ua)) osLabel = "macOS";
  else if (/Android/i.test(ua)) osLabel = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) osLabel = "iOS";
  else if (/Linux/i.test(ua)) osLabel = "Linux";

  let browserLabel = "Desconhecido";
  if (/Edg\//i.test(ua)) browserLabel = "Microsoft Edge";
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browserLabel = "Chrome";
  else if (/Firefox\//i.test(ua)) browserLabel = "Firefox";
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browserLabel = "Safari";

  let deviceLabel = "Computador";
  if (/iPhone/i.test(ua)) deviceLabel = "Apple iPhone";
  else if (/iPad/i.test(ua)) deviceLabel = "Apple iPad";
  else if (/Android/i.test(ua)) {
    const m = ua.match(/;\s*([^;)]+)\s+Build\//);
    deviceLabel = m?.[1]?.trim() ? `Android — ${m[1].trim()}` : "Dispositivo Android";
  } else if (/Macintosh/i.test(ua)) deviceLabel = "Apple Mac";
  else if (/Windows/i.test(ua)) deviceLabel = "PC Windows";

  return {
    ipAddress: ipAddress?.split(",")[0]?.trim(),
    userAgent: ua.slice(0, 512),
    osLabel,
    browserLabel,
    deviceLabel,
  };
}

export function formatClientContextLine(ctx: PlatformSubscriptionClientContext | undefined): string {
  if (!ctx) return "—";
  const parts = [
    ctx.ipAddress ? `IP: ${ctx.ipAddress}` : null,
    ctx.deviceLabel ? `Equipamento: ${ctx.deviceLabel}` : null,
    ctx.osLabel && ctx.browserLabel ? `SO/Navegador: ${ctx.osLabel} / ${ctx.browserLabel}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "—";
}
