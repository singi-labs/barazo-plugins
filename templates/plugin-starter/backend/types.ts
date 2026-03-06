/**
 * Plugin type definitions -- replace with @barazo/plugin-types when available.
 */

export interface PluginContext {
  readonly pluginName: string
  readonly pluginVersion: string
  readonly db: unknown
  readonly settings: { get(key: string): unknown; getAll(): Record<string, unknown> }
  readonly logger: {
    info(msg: string | Record<string, unknown>, ...args: unknown[]): void
    warn(msg: string | Record<string, unknown>, ...args: unknown[]): void
    error(msg: string | Record<string, unknown>, ...args: unknown[]): void
  }
  readonly communityDid: string
}
