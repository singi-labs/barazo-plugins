import type { PluginContext } from './types.js'

export async function onInstall(ctx: PluginContext): Promise<void> {
  ctx.logger.info('Example plugin installed')
}

export async function onEnable(ctx: PluginContext): Promise<void> {
  ctx.logger.info('Example plugin enabled')
}
