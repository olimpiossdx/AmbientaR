/** txid Pix: 1–35 caracteres alfanuméricos (BCB / Sicoob). */
export function buildPlatformPaymentTxid(userId: string): string {
  const uidPart = userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
  const timePart = Date.now().toString(36);
  const raw = `amb${uidPart}${timePart}`;
  return raw.slice(0, 35);
}

export function isValidPlatformPaymentTxid(txid: string): boolean {
  return /^[a-zA-Z0-9]{1,35}$/.test(txid);
}
