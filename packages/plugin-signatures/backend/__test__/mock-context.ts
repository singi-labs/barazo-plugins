import type { PluginContext, ScopedDatabase, ScopedAtProto } from '../types.js'

/** Extract SQL text from a Drizzle sql`` template literal object. */
function extractSqlText(query: unknown): string {
  if (typeof query === 'string') return query
  const obj = query as Record<string, unknown>
  if (Array.isArray(obj.queryChunks)) {
    return (obj.queryChunks as Array<{ value?: string[] }>)
      .flatMap((chunk) => chunk.value ?? [])
      .join('')
  }
  return String(query)
}

export interface MockDb extends ScopedDatabase {
  executedQueries: string[]
}

export interface MockAtProto extends ScopedAtProto {
  records: Map<string, unknown>
}

export function createMockDb(): MockDb {
  const executedQueries: string[] = []
  return {
    executedQueries,
    execute(query: unknown): Promise<unknown> {
      executedQueries.push(extractSqlText(query))
      return Promise.resolve({ rows: [] })
    },
    query(_tableName: string): unknown {
      throw new Error('ScopedDatabase.query() is not yet implemented')
    },
  }
}

export function createMockAtProto(): MockAtProto {
  const records = new Map<string, unknown>()
  return {
    records,
    getRecord(did: string, collection: string, rkey: string): Promise<unknown> {
      return Promise.resolve(records.get(`${did}:${collection}:${rkey}`) ?? null)
    },
    putRecord(collection: string, rkey: string, record: unknown): Promise<void> {
      records.set(`:${collection}:${rkey}`, record)
      return Promise.resolve()
    },
    deleteRecord(collection: string, rkey: string): Promise<void> {
      records.delete(`:${collection}:${rkey}`)
      return Promise.resolve()
    },
  }
}

export function createMockContext(overrides?: Partial<PluginContext>): PluginContext {
  const db = createMockDb()
  return {
    pluginName: '@barazo/plugin-signatures',
    pluginVersion: '0.1.0',
    db,
    settings: {
      get(key: string): unknown {
        const defaults: Record<string, unknown> = {
          contentMode: 'plaintext',
          maxCharacters: 200,
          displayMode: 'first_per_thread',
          newMemberDelay: 0,
        }
        return defaults[key]
      },
      getAll() {
        return {
          contentMode: 'plaintext',
          maxCharacters: 200,
          displayMode: 'first_per_thread',
          newMemberDelay: 0,
        }
      },
    },
    logger: {
      info: () => {},
      warn: () => {},
      error: () => {},
    },
    communityDid: 'did:plc:test-community',
    ...overrides,
  }
}
