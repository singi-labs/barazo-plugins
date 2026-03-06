import type { FastifyPluginCallback } from 'fastify'

export const signatureRoutes: FastifyPluginCallback = (app, _opts, done) => {
  // Stub routes -- implemented in Phase 3 (Task 3.3)
  // GET /:did -- resolve signature for user
  // PUT /community -- set community signature
  // DELETE /community -- remove community override
  // PUT /default -- write default signature to PDS
  // GET /default -- read default signature from PDS

  done()
}
