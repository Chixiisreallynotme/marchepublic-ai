/**
 * Abstraction du store de rate-limit. V1: MemoryStore (mono-instance).
 * V2: implémenter RedisStore {get,set} et passer à createLimiter(store) —
 * zéro changement sur les routes.
 */
export interface RateLimitStore {
  get(key: string): Promise<{ count: number; resetAt: number } | undefined>;
  set(key: string, value: { count: number; resetAt: number }): Promise<void>;
}

export const memoryStore: RateLimitStore = {
  async get(key) {
    return store.get(key);
  },
  async set(key, value) {
    store.set(key, value);
  },
};

const store = new Map<string, { count: number; resetAt: number }>();
