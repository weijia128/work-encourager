import { describe, expect, it, vi } from "vitest";
import { BUNDLED_COPY_LIBRARY } from "../domain/copywriter";
import { createMemoryStore } from "./kvStore";
import { loadCopyLibrary } from "./copyLibrary";

const remote = {
  version: BUNDLED_COPY_LIBRARY.version + 1,
  humor: ["新的班味文案"],
  dao: ["道法自然 ——《道德经》"],
};

describe("copy library loader", () => {
  it("uses bundled content when no remote URL is configured", async () => {
    await expect(loadCopyLibrary(createMemoryStore(), vi.fn(), undefined)).resolves.toEqual(
      BUNDLED_COPY_LIBRARY,
    );
  });

  it("validates and caches a newer remote library", async () => {
    const kv = createMemoryStore();
    const fetchJson = vi.fn(async () => remote);
    await expect(loadCopyLibrary(kv, fetchJson, "https://example.com/copy.json")).resolves.toEqual(
      remote,
    );
    expect(fetchJson).toHaveBeenCalledWith("https://example.com/copy.json");
    await expect(kv.get("copy-library")).resolves.toEqual(remote);
  });

  it("keeps cached content when the network fails", async () => {
    const kv = createMemoryStore();
    await kv.set("copy-library", remote);
    const fetchJson = vi.fn(async () => {
      throw new Error("offline");
    });
    await expect(loadCopyLibrary(kv, fetchJson, "https://example.com/copy.json")).resolves.toEqual(
      remote,
    );
  });

  it("rejects malformed remote content and does not overwrite the cache", async () => {
    const kv = createMemoryStore();
    await kv.set("copy-library", remote);
    await expect(
      loadCopyLibrary(kv, async () => ({ version: -1, humor: [], dao: [] }), "https://bad"),
    ).resolves.toEqual(remote);
    await expect(kv.get("copy-library")).resolves.toEqual(remote);
  });
});
