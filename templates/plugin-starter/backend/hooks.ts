import type { PluginContext } from './types.js'

export function onInstall(ctx: PluginContext): void {
  ctx.logger.info('Example plugin installed')
}

export function onEnable(ctx: PluginContext): void {
  ctx.logger.info('Example plugin enabled')
}
