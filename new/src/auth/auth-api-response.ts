import type { ApiResponse } from "../service/http/types";

export function getApiResponseMessage(
  response: ApiResponse<unknown>,
  fallback: string,
): string {
  const notification = response.notifications.find((item) => item.message);

  return notification?.message || response.error?.message || fallback;
}
