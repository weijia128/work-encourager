import { fetch } from "@tauri-apps/plugin-http";

export async function httpFetchJson(url: string): Promise<unknown> {
  const signal = AbortSignal.timeout(10_000);
  const response = await fetch(url, { connectTimeout: 10_000, signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json() as Promise<unknown>;
}
