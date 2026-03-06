import { describe, it, expect, vi } from 'vitest'
import { onInstall, onUninstall, onEnable, onDisable, onProfileSync } from '../hooks.js'
import { createMockContext, createMockDb, createMockAtProto, type MockDb } from './mock-context.js'

describe('lifecycle hooks', () => {
  describe('onInstall', () => {
    it('runs migration up (3 SQL statements)', async () => {
      const ctx = createMockContext()
      await onInstall(ctx)
      const db = ctx.db as MockDb
      expect(db.executedQueries).toHaveLength(3)
      expect(db.executedQueries[0]).toContain('CREATE TABLE')
    })

    it('logs installation message', async () => {
      const info = vi.fn()
      const ctx = createMockContext({ logger: { info, warn: vi.fn(), error: vi.fn() } })
      await onInstall(ctx)
      expect(info).toHaveBeenCalledWith(
        'plugin-signatures installed: created plugin_signatures table'
      )
    })
  })

  describe('onUninstall', () => {
    it('runs migration down (1 SQL statement)', async () => {
      const ctx = createMockContext()
      await onUninstall(ctx)
      const db = ctx.db as MockDb
      expect(db.executedQueries).toHaveLength(1)
      expect(db.executedQueries[0]).toContain('DROP TABLE')
    })
  })

  describe('onEnable', () => {
    it('logs enable message', () => {
      const info = vi.fn()
      const ctx = createMockContext({ logger: { info, warn: vi.fn(), error: vi.fn() } })
      onEnable(ctx)
      expect(info).toHaveBeenCalledWith('plugin-signatures enabled')
    })
  })

  describe('onDisable', () => {
    it('logs disable message', () => {
      const info = vi.fn()
      const ctx = createMockContext({ logger: { info, warn: vi.fn(), error: vi.fn() } })
      onDisable(ctx)
      expect(info).toHaveBeenCalledWith('plugin-signatures disabled')
    })
  })

  describe('onProfileSync', () => {
    it('does nothing when atproto is not available', async () => {
      const db = createMockDb()
      const ctx = createMockContext({ db, atproto: undefined })
      await onProfileSync(ctx, 'did:plc:user1')
      expect(db.executedQueries).toHaveLength(0)
    })

    it('does nothing when no PDS record exists', async () => {
      const db = createMockDb()
      const atproto = createMockAtProto()
      const ctx = createMockContext({ db, atproto })
      await onProfileSync(ctx, 'did:plc:user1')
      expect(db.executedQueries).toHaveLength(0)
    })

    it('caches PDS signature locally', async () => {
      const db = createMockDb()
      const atproto = createMockAtProto()
      atproto.records.set('did:plc:user1:forum.barazo.actor.signature:self', {
        text: 'My portable sig',
        createdAt: '2026-03-06T00:00:00Z',
      })
      const ctx = createMockContext({ db, atproto })

      await onProfileSync(ctx, 'did:plc:user1')

      expect(db.executedQueries).toHaveLength(1)
      expect(db.executedQueries[0]).toContain('INSERT INTO plugin_signatures')
      expect(db.executedQueries[0]).toContain('ON CONFLICT')
    })

    it('logs sync message on success', async () => {
      const info = vi.fn()
      const atproto = createMockAtProto()
      atproto.records.set('did:plc:user1:forum.barazo.actor.signature:self', {
        text: 'sig',
        createdAt: '2026-03-06T00:00:00Z',
      })
      const ctx = createMockContext({
        atproto,
        logger: { info, warn: vi.fn(), error: vi.fn() },
      })

      await onProfileSync(ctx, 'did:plc:user1')
      expect(info).toHaveBeenCalledWith({ did: 'did:plc:user1' }, 'synced signature from PDS')
    })
  })
})
