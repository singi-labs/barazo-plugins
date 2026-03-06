import type { PluginContext } from './types.js'

export async function onInstall(ctx: PluginContext): Promise<void> {
  ctx.logger.info('plugin-signatures installed')
}

export async function onUninstall(ctx: PluginContext): Promise<void> {
  ctx.logger.info('plugin-signatures uninstalled')
}

export async function onEnable(ctx: PluginContext): Promise<void> {
  ctx.logger.info('plugin-signatures enabled')
}

export async function onDisable(ctx: PluginContext): Promise<void> {
  ctx.logger.info('plugin-signatures disabled')
}

export async function onProfileSync(ctx: PluginContext, _userDid: string): Promise<void> {
  ctx.logger.info('plugin-signatures profile sync (stub)')
}
