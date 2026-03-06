import { describe, it, expect, beforeEach } from 'vitest'
import Fastify from 'fastify'
import type { FastifyInstance } from 'fastify'
import { signatureRoutes } from '../routes.js'
import { createMockContext, createMockDb, createMockAtProto, type MockDb } from './mock-context.js'
import type { PluginContext } from '../types.js'

interface JsonResponse {
  text?: string
  source?: string
  error?: string
  ok?: boolean
  did?: string
  createdAt?: string
  updatedAt?: string
}

/** Parse response body as typed JSON (avoids ESLint any-access issues). */
function parseBody(res: { body: string }): JsonResponse {
  return JSON.parse(res.body) as JsonResponse
}

/** Build a Fastify app with the signature routes registered. */
async function buildApp(ctx: PluginContext, authDid?: string): Promise<FastifyInstance> {
  const app = Fastify()

  // Simulate auth decorator: set request.user if authDid is provided
  if (authDid) {
    app.decorateRequest('user', null)
    app.addHook('preHandler', (request, _reply, done) => {
      ;(request as unknown as { user: { did: string } }).user = { did: authDid }
      done()
    })
  }

  await app.register(signatureRoutes, { ctx })
  return app
}

describe('signature routes', () => {
  let db: MockDb
  let ctx: PluginContext

  beforeEach(() => {
    db = createMockDb()
    ctx = createMockContext({ db })
  })

  describe('GET /:did', () => {
    it('returns 400 for invalid DID', async () => {
      const app = await buildApp(ctx)
      const res = await app.inject({ method: 'GET', url: '/not-a-did' })
      expect(res.statusCode).toBe(400)
    })

    it('returns 404 when no signature exists', async () => {
      const app = await buildApp(ctx)
      const res = await app.inject({ method: 'GET', url: '/did:plc:test123' })
      expect(res.statusCode).toBe(404)
    })

    it('returns signature with community source', async () => {
      const mockDb = createMockDb()
      mockDb.execute = () =>
        Promise.resolve({
          rows: [
            {
              text: 'Hello from community',
              community_did: 'did:plc:test-community',
              updated_at: '2026-03-06T00:00:00Z',
            },
          ],
        })
      const appCtx = createMockContext({ db: mockDb })
      const app = await buildApp(appCtx)

      const res = await app.inject({ method: 'GET', url: '/did:plc:user1' })
      expect(res.statusCode).toBe(200)
      const body = parseBody(res)
      expect(body.text).toBe('Hello from community')
      expect(body.source).toBe('community')
    })

    it('returns signature with pds_default source', async () => {
      const mockDb = createMockDb()
      mockDb.execute = () =>
        Promise.resolve({
          rows: [
            {
              text: 'PDS default sig',
              community_did: '',
              updated_at: '2026-03-06T00:00:00Z',
            },
          ],
        })
      const appCtx = createMockContext({ db: mockDb })
      const app = await buildApp(appCtx)

      const res = await app.inject({ method: 'GET', url: '/did:plc:user1' })
      expect(res.statusCode).toBe(200)
      expect(parseBody(res).source).toBe('pds_default')
    })
  })

  describe('PUT /community', () => {
    it('returns 401 without auth', async () => {
      const app = await buildApp(ctx)
      const res = await app.inject({
        method: 'PUT',
        url: '/community',
        payload: { text: 'test' },
      })
      expect(res.statusCode).toBe(401)
    })

    it('returns 400 for empty text', async () => {
      const app = await buildApp(ctx, 'did:plc:user1')
      const res = await app.inject({
        method: 'PUT',
        url: '/community',
        payload: { text: '' },
      })
      expect(res.statusCode).toBe(400)
    })

    it('returns 400 when text exceeds community limit', async () => {
      const app = await buildApp(ctx, 'did:plc:user1')
      const res = await app.inject({
        method: 'PUT',
        url: '/community',
        payload: { text: 'a'.repeat(201) }, // maxCharacters default = 200
      })
      expect(res.statusCode).toBe(400)
      expect(parseBody(res).error).toContain('200')
    })

    it('upserts signature and returns ok', async () => {
      const app = await buildApp(ctx, 'did:plc:user1')
      const res = await app.inject({
        method: 'PUT',
        url: '/community',
        payload: { text: 'My signature' },
      })
      expect(res.statusCode).toBe(200)
      expect(parseBody(res).ok).toBe(true)
      expect(db.executedQueries).toHaveLength(1)
      expect(db.executedQueries[0]).toContain('INSERT INTO plugin_signatures')
    })
  })

  describe('DELETE /community', () => {
    it('returns 401 without auth', async () => {
      const app = await buildApp(ctx)
      const res = await app.inject({ method: 'DELETE', url: '/community' })
      expect(res.statusCode).toBe(401)
    })

    it('deletes community signature and returns ok', async () => {
      const app = await buildApp(ctx, 'did:plc:user1')
      const res = await app.inject({ method: 'DELETE', url: '/community' })
      expect(res.statusCode).toBe(200)
      expect(parseBody(res).ok).toBe(true)
      expect(db.executedQueries).toHaveLength(1)
      expect(db.executedQueries[0]).toContain('DELETE FROM plugin_signatures')
    })
  })

  describe('PUT /default', () => {
    it('returns 401 without auth', async () => {
      const app = await buildApp(ctx)
      const res = await app.inject({
        method: 'PUT',
        url: '/default',
        payload: { text: 'test' },
      })
      expect(res.statusCode).toBe(401)
    })

    it('returns 503 when atproto is not available', async () => {
      const noAtProtoCtx = createMockContext({ db, atproto: undefined })
      const app = await buildApp(noAtProtoCtx, 'did:plc:user1')
      const res = await app.inject({
        method: 'PUT',
        url: '/default',
        payload: { text: 'test' },
      })
      expect(res.statusCode).toBe(503)
    })

    it('writes to PDS and caches locally', async () => {
      const atproto = createMockAtProto()
      const atProtoCtx = createMockContext({ db, atproto })
      const app = await buildApp(atProtoCtx, 'did:plc:user1')

      const res = await app.inject({
        method: 'PUT',
        url: '/default',
        payload: { text: 'My default sig' },
      })
      expect(res.statusCode).toBe(200)

      // Verify PDS write
      const pdsRecord = atproto.records.get(':forum.barazo.actor.signature:self') as
        | { text: string }
        | undefined
      expect(pdsRecord).toBeDefined()
      expect(pdsRecord?.text).toBe('My default sig')

      // Verify local cache
      expect(db.executedQueries).toHaveLength(1)
      expect(db.executedQueries[0]).toContain('INSERT INTO plugin_signatures')
    })
  })

  describe('GET /default', () => {
    it('returns 401 without auth', async () => {
      const app = await buildApp(ctx)
      const res = await app.inject({ method: 'GET', url: '/default' })
      expect(res.statusCode).toBe(401)
    })

    it('returns 503 when atproto is not available', async () => {
      const noAtProtoCtx = createMockContext({ db, atproto: undefined })
      const app = await buildApp(noAtProtoCtx, 'did:plc:user1')
      const res = await app.inject({ method: 'GET', url: '/default' })
      expect(res.statusCode).toBe(503)
    })

    it('returns 404 when no PDS record exists', async () => {
      const atproto = createMockAtProto()
      const atProtoCtx = createMockContext({ db, atproto })
      const app = await buildApp(atProtoCtx, 'did:plc:user1')
      const res = await app.inject({ method: 'GET', url: '/default' })
      expect(res.statusCode).toBe(404)
    })

    it('returns signature from PDS', async () => {
      const atproto = createMockAtProto()
      atproto.records.set('did:plc:user1:forum.barazo.actor.signature:self', {
        text: 'PDS sig',
        createdAt: '2026-03-06T00:00:00Z',
      })
      const atProtoCtx = createMockContext({ db, atproto })
      const app = await buildApp(atProtoCtx, 'did:plc:user1')

      const res = await app.inject({ method: 'GET', url: '/default' })
      expect(res.statusCode).toBe(200)
      expect(parseBody(res).text).toBe('PDS sig')
    })
  })
})
