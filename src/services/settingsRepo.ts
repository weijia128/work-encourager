import { settingsSchema, type Settings } from "../domain/settings";
import type { KeyValueStore } from "./kvStore";

const SETTINGS_KEY = "settings";

export async function loadSettings(kv: KeyValueStore): Promise<Settings | null> {
  try {
    const raw = await kv.get<unknown>(SETTINGS_KEY);
    if (raw === undefined) return null;
    const parsed = settingsSchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function saveSettings(kv: KeyValueStore, settings: Settings): Promise<void> {
  const parsed = settingsSchema.safeParse(settings);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "设置无效");
  await kv.set(SETTINGS_KEY, parsed.data);
}
