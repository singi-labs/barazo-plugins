/**
 * Plugin type definitions.
 *
 * These mirror the interfaces from barazo-api/src/lib/plugins/types.ts.
 * Once a shared @barazo/plugin-types package exists, this file should be
 * replaced with a re-export from that package.
 */

export interface ScopedDatabase {
  execute(query: unknown): Promise<unknown>
  query(tableName: string): unknown
}

export interface ScopedAtProto {
  getRecord(did: string, collection: string, rkey: string): Promise<unknown>
  putRecord(collection: string, rkey: string, record: unknown): Promise<void>
  deleteRecord(collection: string, rkey: string): Promise<void>
}

export interface ScopedCache {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttlSeconds?: number): Promise<void>
  del(key: string): Promise<void>
}

export interface PluginSettings {
  get(key: string): unknown
  getAll(): Record<string, unknown>
}

export interface PluginContext {
  readonly pluginName: string
  readonly pluginVersion: string
  readonly db: ScopedDatabase
  readonly settings: PluginSettings
  readonly atproto?: ScopedAtProto
  readonly cache?: ScopedCache
  readonly logger: {
    info(msg: string | Record<string, unknown>, ...args: unknown[]): void
    warn(msg: string | Record<string, unknown>, ...args: unknown[]): void
    error(msg: string | Record<string, unknown>, ...args: unknown[]): void
  }
  readonly communityDid: string
}
