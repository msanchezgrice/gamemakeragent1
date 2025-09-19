import { InMemoryRunStore } from './store.memory.js';
import { PgRunStore } from './store.pg.js';
import { SupabaseRunStore } from './store.supabase.js';
export function createRunStore() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseServiceKey) {
        return new SupabaseRunStore();
    }
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl) {
        return new PgRunStore(databaseUrl);
    }
    return new InMemoryRunStore();
}
//# sourceMappingURL=store.factory.js.map