import type { PluginContext } from './types.js'

export function onInstall(ctx: PluginContext): void {
  ctx.logger.info('plugin-signatures installed')
}

export function onUninstall(ctx: PluginContext): void {
  ctx.logger.info('plugin-signatures uninstalled')
}

export function onEnable(ctx: PluginContext): void {
  ctx.logger.info('plugin-signatures enabled')
}

export function onDisable(ctx: PluginContext): void {
  ctx.logger.info('plugin-signatures disabled')
}

export function onProfileSync(ctx: PluginContext, _userDid: string): void {
  ctx.logger.info('plugin-signatures profile sync (stub)')
}
