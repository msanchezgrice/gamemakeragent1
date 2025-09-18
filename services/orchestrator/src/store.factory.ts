import { InMemoryRunStore } from './store.memory.js';
import { PgRunStore } from './store.pg.js';
import type { RunStore } from './store.js';

export function createRunStore(): RunStore {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    return new PgRunStore(databaseUrl);
  }
  return new InMemoryRunStore();
}
