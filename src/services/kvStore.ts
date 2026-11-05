import { load } from "@tauri-apps/plugin-store";

export interface KeyValueStore {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
}

export function createMemoryStore(): KeyValueStore {
  const values = new Map<string, unknown>();
  return {
    async get<T>(key: string): Promise<T | undefined> {
      return values.get(key) as T | undefined;
    },
    async set<T>(key: string, value: T): Promise<void> {
      values.set(key, value);
    },
  };
}

export async function createTauriStore(): Promise<KeyValueStore> {
  const store = await load("settings.json", { autoSave: false });
  return {
    async get<T>(key: string): Promise<T | undefined> {
      return store.get<T>(key);
    },
    async set<T>(key: string, value: T): Promise<void> {
      await store.set(key, value);
      await store.save();
    },
  };
}
