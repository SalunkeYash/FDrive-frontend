import { api } from "@/api/client";

const MAX_CONCURRENT = 6;
const RETRY_DELAY_MS = 2500;

const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string | null>>();
const retried = new Set<string>();

let active = 0;
const waitQueue: Array<() => void> = [];

async function withSlot<T>(fn: () => Promise<T>): Promise<T> {
  if (active >= MAX_CONCURRENT) {
    await new Promise<void>((resolve) => waitQueue.push(resolve));
  }
  active += 1;
  try {
    return await fn();
  } finally {
    active -= 1;
    waitQueue.shift()?.();
  }
}

async function fetchOnce(fileId: string): Promise<string | null> {
  try {
    const thumb = await api.getThumbnailUrl(fileId);
    return thumb.preview_url;
  } catch {
    return null;
  }
}

export function getCachedThumbnail(fileId: string): string | undefined {
  return cache.get(fileId);
}

export function clearThumbnailCache(): void {
  cache.clear();
  inflight.clear();
  retried.clear();
}

/** Deduped, concurrency-limited thumbnail URL fetch with one delayed retry. */
export function requestThumbnailUrl(fileId: string): Promise<string | null> {
  const cached = cache.get(fileId);
  if (cached) return Promise.resolve(cached);

  const pending = inflight.get(fileId);
  if (pending) return pending;

  const promise = withSlot(async () => {
    let url = await fetchOnce(fileId);
    if (!url && !retried.has(fileId)) {
      retried.add(fileId);
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      url = await fetchOnce(fileId);
    }
    if (url) cache.set(fileId, url);
    return url;
  }).finally(() => {
    inflight.delete(fileId);
  });

  inflight.set(fileId, promise);
  return promise;
}
