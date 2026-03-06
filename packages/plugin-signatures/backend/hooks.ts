import { sql } from 'drizzle-orm'
import type { PluginContext } from './types.js'
import { up, down } from './migrations/001-create-plugin-signatures.js'

export async function onInstall(ctx: PluginContext): Promise<void> {
  await up(ctx)
  ctx.logger.info('plugin-signatures installed: created plugin_signatures table')
}

export async function onUninstall(ctx: PluginContext): Promise<void> {
  await down(ctx)
  ctx.logger.info('plugin-signatures uninstalled: dropped plugin_signatures table')
}

export function onEnable(ctx: PluginContext): void {
  ctx.logger.info('plugin-signatures enabled')
}

export function onDisable(ctx: PluginContext): void {
  ctx.logger.info('plugin-signatures disabled')
}

export async function onProfileSync(ctx: PluginContext, userDid: string): Promise<void> {
  if (!ctx.atproto) return

  const record = (await ctx.atproto.getRecord(userDid, 'forum.barazo.actor.signature', 'self')) as {
    text: string
  } | null

  if (!record) return

  // Cache as PDS default (community_did = '' means global/portable default)
  await ctx.db.execute(
    sql`
      INSERT INTO plugin_signatures (did, community_did, text, updated_at)
      VALUES (${userDid}, '', ${record.text}, now())
      ON CONFLICT (did, community_did)
      DO UPDATE SET text = ${record.text}, updated_at = now()
    `
  )

  ctx.logger.info({ did: userDid }, 'synced signature from PDS')
}
