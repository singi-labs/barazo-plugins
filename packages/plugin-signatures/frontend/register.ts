import type { ComponentType } from 'react'
import { CommunitySignatureField } from './CommunitySignatureField.js'
import { DefaultSignatureField } from './DefaultSignatureField.js'
import { PostSignature } from './PostSignature.js'

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
