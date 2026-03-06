import type { FastifyPluginCallback, FastifyRequest } from 'fastify'
import { sql } from 'drizzle-orm'
import type { PluginContext } from './types.js'
import { signatureInputSchema, didParamSchema } from './validation.js'

export interface SignatureRoutesOpts {
  ctx: PluginContext
}

/** Authenticated user from Fastify request decorator (set by barazo-api auth). */
interface AuthUser {
  did: string
}

function getAuthUser(request: FastifyRequest): AuthUser | null {
  return (request as unknown as { user?: AuthUser }).user ?? null
}

export const signatureRoutes: FastifyPluginCallback<SignatureRoutesOpts> = (app, opts, done) => {
  const { ctx } = opts

  /**
   * GET /:did — resolve signature for a user.
   * Resolution: community override (community_did = ctx.communityDid) > PDS default (community_did = '').
   * Public endpoint, no auth required.
   */
  app.get<{ Params: { did: string } }>('/:did', async (request, reply) => {
    const params = didParamSchema.safeParse(request.params)
    if (!params.success) {
      return reply.status(400).send({ error: 'Invalid DID' })
    }

    const { did } = params.data

    // Fetch both community override and PDS default in one query, prefer community override
    const result = (await ctx.db.execute(
      sql`
        SELECT text, community_did, updated_at
        FROM plugin_signatures
        WHERE did = ${did}
          AND community_did IN (${ctx.communityDid}, '')
        ORDER BY
          CASE WHEN community_did = ${ctx.communityDid} THEN 0 ELSE 1 END
        LIMIT 1
      `
    )) as { rows: Array<{ text: string; community_did: string; updated_at: string }> }

    if (!result.rows.length) {
      return reply.status(404).send({ error: 'No signature found' })
    }

    const row = result.rows[0]
    return reply.send({
      did,
      text: row.text,
      source: row.community_did === '' ? 'pds_default' : 'community',
      updatedAt: row.updated_at,
    })
  })

  /**
   * PUT /community — set or update community-specific signature.
   * Auth required. Character limit enforced from plugin settings.
   */
  app.put('/community', async (request, reply) => {
    const user = getAuthUser(request)
    if (!user) {
      return reply.status(401).send({ error: 'Authentication required' })
    }

    const body = signatureInputSchema.safeParse(request.body)
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid signature', details: body.error.issues })
    }

    const maxCharsSetting = ctx.settings.get('maxCharacters')
    const maxChars = typeof maxCharsSetting === 'number' ? maxCharsSetting : 200
    if (body.data.text.length > maxChars) {
      return reply
        .status(400)
        .send({ error: `Signature exceeds community limit of ${String(maxChars)} characters` })
    }

    await ctx.db.execute(
      sql`
        INSERT INTO plugin_signatures (did, community_did, text, updated_at)
        VALUES (${user.did}, ${ctx.communityDid}, ${body.data.text}, now())
        ON CONFLICT (did, community_did)
        DO UPDATE SET text = ${body.data.text}, updated_at = now()
      `
    )

    return reply.status(200).send({ ok: true })
  })

  /**
   * DELETE /community — remove community-specific signature override.
   * Auth required. Falls back to PDS default after removal.
   */
  app.delete('/community', async (request, reply) => {
    const user = getAuthUser(request)
    if (!user) {
      return reply.status(401).send({ error: 'Authentication required' })
    }

    await ctx.db.execute(
      sql`
        DELETE FROM plugin_signatures
        WHERE did = ${user.did} AND community_did = ${ctx.communityDid}
      `
    )

    return reply.status(200).send({ ok: true })
  })

  /**
   * PUT /default — write default signature to user's PDS.
   * Auth required. Writes forum.barazo.actor.signature record with key "self".
   * Also caches locally as PDS default (community_did = '').
   */
  app.put('/default', async (request, reply) => {
    const user = getAuthUser(request)
    if (!user) {
      return reply.status(401).send({ error: 'Authentication required' })
    }

    if (!ctx.atproto) {
      return reply.status(503).send({ error: 'AT Protocol operations not available' })
    }

    const body = signatureInputSchema.safeParse(request.body)
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid signature', details: body.error.issues })
    }

    // Lexicon limit: 300 graphemes / 3000 bytes
    if (body.data.text.length > 3000) {
      return reply.status(400).send({ error: 'Signature exceeds PDS limit of 3000 bytes' })
    }

    // Write to user's PDS
    await ctx.atproto.putRecord('forum.barazo.actor.signature', 'self', {
      text: body.data.text,
      createdAt: new Date().toISOString(),
    })

    // Cache locally as PDS default
    await ctx.db.execute(
      sql`
        INSERT INTO plugin_signatures (did, community_did, text, updated_at)
        VALUES (${user.did}, '', ${body.data.text}, now())
        ON CONFLICT (did, community_did)
        DO UPDATE SET text = ${body.data.text}, updated_at = now()
      `
    )

    return reply.status(200).send({ ok: true })
  })

  /**
   * GET /default — read default signature from user's PDS.
   * Auth required.
   */
  app.get('/default', async (request, reply) => {
    const user = getAuthUser(request)
    if (!user) {
      return reply.status(401).send({ error: 'Authentication required' })
    }

    if (!ctx.atproto) {
      return reply.status(503).send({ error: 'AT Protocol operations not available' })
    }

    const record = (await ctx.atproto.getRecord(
      user.did,
      'forum.barazo.actor.signature',
      'self'
    )) as { text: string; createdAt: string } | null

    if (!record) {
      return reply.status(404).send({ error: 'No default signature found' })
    }

    return reply.send({
      did: user.did,
      text: record.text,
      createdAt: record.createdAt,
    })
  })

  done()
}
