import { sql } from 'drizzle-orm'
import type { PluginContext } from '../types.js'

export async function up(ctx: PluginContext): Promise<void> {
  await ctx.db.execute(
    sql`
      CREATE TABLE IF NOT EXISTS plugin_signatures (
        did TEXT NOT NULL,
        community_did TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (did, community_did)
      )
    `
  )

  await ctx.db.execute(sql`ALTER TABLE plugin_signatures ENABLE ROW LEVEL SECURITY`)

  await ctx.db.execute(
    sql`
      CREATE POLICY tenant_isolation ON plugin_signatures
        USING (community_did = current_setting('app.current_community_did', true))
    `
  )
}

export async function down(ctx: PluginContext): Promise<void> {
  await ctx.db.execute(sql`DROP TABLE IF EXISTS plugin_signatures`)
}
