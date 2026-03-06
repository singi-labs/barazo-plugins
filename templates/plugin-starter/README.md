# Plugin Starter Template

Copy this template to create a new Barazo plugin.

## Quick Start

1. Copy this directory to `packages/your-plugin-name/`
2. Update `package.json` and `plugin.json` with your plugin details
3. Implement your backend hooks and routes in `backend/`
4. Implement frontend components in `frontend/`
5. Run `pnpm build && pnpm test` to verify

## Plugin Structure

- `plugin.json` -- Plugin manifest (name, permissions, settings, hooks)
- `backend/hooks.ts` -- Lifecycle hooks (onInstall, onEnable, etc.)
- `backend/routes.ts` -- Fastify routes (scoped under `/api/ext/<name>/`)
- `frontend/register.ts` -- Register components into PluginSlots

## Documentation

See the [Plugin Developer Guide](https://docs.barazo.forum/developer/plugins) for full documentation.
