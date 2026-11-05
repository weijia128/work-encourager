import { z } from "zod";
import { BUNDLED_COPY_LIBRARY, type CopyLibrary } from "../domain/copywriter";
import type { KeyValueStore } from "./kvStore";

const CACHE_KEY = "copy-library";
export const COPY_LIBRARY_URL = import.meta.env.VITE_COPY_LIBRARY_URL?.trim() as string | undefined;

const copyLibrarySchema: z.ZodType<CopyLibrary> = z.object({
  version: z.number().int().positive(),
  humor: z.array(z.string().trim().min(1).max(120)).min(1).max(200),
  dao: z.array(z.string().trim().min(1).max(120)).min(1).max(200),
});

async function loadCached(kv: KeyValueStore): Promise<CopyLibrary | null> {
  try {
    const result = copyLibrarySchema.safeParse(await kv.get<unknown>(CACHE_KEY));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export async function loadCopyLibrary(
  kv: KeyValueStore,
  fetchJson: (url: string) => Promise<unknown>,
  url: string | undefined = COPY_LIBRARY_URL,
): Promise<CopyLibrary> {
  const cached = await loadCached(kv);
  const current =
    cached && cached.version > BUNDLED_COPY_LIBRARY.version ? cached : BUNDLED_COPY_LIBRARY;
  if (!url) return current;
  try {
    const result = copyLibrarySchema.safeParse(await fetchJson(url));
    if (!result.success || result.data.version <= current.version) return current;
    try {
      await kv.set(CACHE_KEY, result.data);
    } catch {
      // A cache failure must not prevent valid remote copy from being used.
    }
    return result.data;
  } catch {
    return current;
  }
}
