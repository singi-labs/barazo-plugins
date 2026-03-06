// Plugin frontend registration
// Register components into PluginSlot injection points

export function register(registry: { add: (slot: string, component: unknown) => void }): void {
  // Example: registry.add('post-content', MyComponent)
}
