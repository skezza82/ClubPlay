
import { MOCK_CLUBS, MOCK_GAMES, MOCK_MEMBERS, MOCK_SCORES, MOCK_SESSIONS, MOCK_USERS, MOCK_JOIN_REQUESTS } from './mockData';

class MockSupabaseClient {
    private data: any = {
        profiles: MOCK_USERS,
        clubs: MOCK_CLUBS,
        club_members: MOCK_MEMBERS,
        games: MOCK_GAMES,
        weekly_sessions: MOCK_SESSIONS,
        scores: MOCK_SCORES,
        join_requests: MOCK_JOIN_REQUESTS,
    };

    from(table: string) {
        return new QueryBuilder(this.data[table] || [], (newData: any[]) => {
            this.data[table] = newData;
        });
    }

    get auth() {
        return {
            getUser: async () => ({ data: { user: null }, error: null }),
            signInWithPassword: async () => ({ data: { user: { id: 'user-1' }, session: {} }, error: null }),
            signUp: async (payload: any) => {
                const newUser = {
                    id: `user-${Date.now()}`,
                    email: payload.email,
                    user_metadata: payload.options?.data
                };
                return { data: { user: newUser, session: {} }, error: null };
            },
            signOut: async () => ({ error: null }),
        };
    }
}

class QueryBuilder {
    private dataItems: any[];
    private filters: ((item: any) => boolean)[] = [];
    private limitCount: number | null = null;
    private orderConfig: { column: string, ascending: boolean } | null = null;
    private updateConfig: any | null = null;
    private onCommit: (newData: any[]) => void;

    constructor(data: any[], onCommit: (newData: any[]) => void = () => { }) {
        this.dataItems = [...data];
        this.onCommit = onCommit;
    }

    select(columns = '*') {
        return this;
    }

    insert(records: any | any[]) {
        const newRecords = Array.isArray(records) ? records : [records];
        this.dataItems = [...this.dataItems, ...newRecords.map(r => ({ id: Math.random().toString(36).substr(2, 9), ...r }))];
        this.onCommit(this.dataItems);
        return this;
    }

    update(values: any) {
        this.updateConfig = values;
        return this;
    }

    eq(column: string, value: any) {
        this.filters.push(item => item[column] === value);
        return this;
    }

    in(column: string, values: any[]) {
        this.filters.push(item => values.includes(item[column]));
        return this;
    }

    single() {
        const result = this.execute();
        if (result.data && result.data.length > 0) {
            return { data: result.data[0], error: null };
        }
        return { data: null, error: { message: 'No rows found' } };
    }

    order(column: string, { ascending = true } = {}) {
        this.orderConfig = { column, ascending };
        return this;
    }

    limit(count: number) {
        this.limitCount = count;
        return this;
    }

    then(resolve: (value: any) => void, reject: (reason: any) => void) {
        const result = this.execute();
        resolve(result);
    }

    private executeFiltered() {
        let result = this.dataItems;
        for (const filter of this.filters) {
            result = result.filter(filter);
        }
        return result;
    }

    private execute() {
        if (this.updateConfig) {
            const results = this.executeFiltered();
            const idsToUpdate = new Set(results.map(r => r.id));
            this.dataItems = this.dataItems.map(item => idsToUpdate.has(item.id) ? { ...item, ...this.updateConfig } : item);
            this.onCommit(this.dataItems);
            return { data: this.updateConfig, error: null };
        }

        let result = this.executeFiltered();

        if (this.orderConfig) {
            const { column, ascending } = this.orderConfig;
            result.sort((a: any, b: any) => {
                if (a[column] < b[column]) return ascending ? -1 : 1;
                if (a[column] > b[column]) return ascending ? 1 : -1;
                return 0;
            });
        }

        if (this.limitCount !== null) {
            result = result.slice(0, this.limitCount);
        }

        return { data: result, error: null };
    }
}

export const supabase = new MockSupabaseClient();
