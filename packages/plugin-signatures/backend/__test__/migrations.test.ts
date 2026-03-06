import { describe, it, expect } from 'vitest'
import { up, down } from '../migrations/001-create-plugin-signatures.js'
import { createMockContext, type MockDb } from './mock-context.js'

describe('001-create-plugin-signatures migration', () => {
  describe('up', () => {
    it('executes three SQL statements (table, RLS, policy)', async () => {
      const ctx = createMockContext()
      await up(ctx)
      const db = ctx.db as MockDb
      expect(db.executedQueries).toHaveLength(3)
    })

    it('creates the plugin_signatures table', async () => {
      const ctx = createMockContext()
      await up(ctx)
      const db = ctx.db as MockDb
      const firstQuery = db.executedQueries[0]
      expect(firstQuery).toContain('CREATE TABLE')
      expect(firstQuery).toContain('plugin_signatures')
    })

    it('enables row level security', async () => {
      const ctx = createMockContext()
      await up(ctx)
      const db = ctx.db as MockDb
      const secondQuery = db.executedQueries[1]
      expect(secondQuery).toContain('ROW LEVEL SECURITY')
    })

    it('creates tenant isolation policy', async () => {
      const ctx = createMockContext()
      await up(ctx)
      const db = ctx.db as MockDb
      const thirdQuery = db.executedQueries[2]
      expect(thirdQuery).toContain('tenant_isolation')
      expect(thirdQuery).toContain('app.current_community_did')
    })
  })

  describe('down', () => {
    it('drops the plugin_signatures table', async () => {
      const ctx = createMockContext()
      await down(ctx)
      const db = ctx.db as MockDb
      expect(db.executedQueries).toHaveLength(1)
      const query = db.executedQueries[0]
      expect(query).toContain('DROP TABLE')
      expect(query).toContain('plugin_signatures')
    })
  })
})
