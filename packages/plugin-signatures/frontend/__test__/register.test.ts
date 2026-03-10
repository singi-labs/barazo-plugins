import { describe, it, expect } from 'vitest'
import { register } from '../register'

describe('register', () => {
  it('registers all three components to correct slots', () => {
    const registrations: Array<{ slot: string; component: unknown }> = []
    const mockRegistry = {
      add(slot: string, component: unknown) {
        registrations.push({ slot, component })
      },
    }

    register(mockRegistry)

    expect(registrations).toHaveLength(3)
    expect(registrations[0].slot).toBe('settings-community')
    expect(registrations[1].slot).toBe('settings-global')
    expect(registrations[2].slot).toBe('post-content')

    // All registered components should be functions (React components)
    for (const reg of registrations) {
      expect(typeof reg.component).toBe('function')
    }
  })
})
