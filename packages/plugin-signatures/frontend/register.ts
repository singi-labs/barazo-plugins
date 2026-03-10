import type { ComponentType } from 'react'
import { CommunitySignatureField } from './CommunitySignatureField'
import { DefaultSignatureField } from './DefaultSignatureField'
import { PostSignature } from './PostSignature'

interface PluginComponentRegistry {
  add: (slot: string, component: ComponentType<Record<string, unknown>>) => void
}

export function register(registry: PluginComponentRegistry): void {
  registry.add(
    'settings-community',
    CommunitySignatureField as ComponentType<Record<string, unknown>>
  )
  registry.add('settings-global', DefaultSignatureField as ComponentType<Record<string, unknown>>)
  registry.add('post-content', PostSignature as ComponentType<Record<string, unknown>>)
}
