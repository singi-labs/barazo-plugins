# Barazo Plugins

Official and community plugins for the [Barazo](https://barazo.forum) forum platform.

## Structure

- `packages/` -- Published plugins (npm packages)
- `templates/plugin-starter/` -- Template for creating new plugins

## Development

```bash
pnpm install
pnpm build
pnpm test
```

## Plugin Guidelines

- Plugins declare capabilities in `plugin.json` manifest
- Backend code interacts through `PluginContext` (never raw infrastructure)
- Frontend code registers components into named `PluginSlot` injection points
- Plugin tables must be prefixed with `plugin_`
- Plugin cache keys are auto-prefixed with `plugin:<name>:`
- Plugin routes are scoped under `/api/ext/<name>/`

## Creating a Plugin

Copy `templates/plugin-starter/` and customize:

1. Update `package.json` with your plugin name and description
2. Update `plugin.json` with manifest details
3. Implement backend hooks and routes
4. Implement frontend components
5. Write tests
