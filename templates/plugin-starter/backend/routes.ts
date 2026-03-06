import type { FastifyPluginCallback } from 'fastify'

export const routes: FastifyPluginCallback = (app, _opts, done) => {
  app.get('/hello', () => {
    return { message: 'Hello from the example plugin!' }
  })

  done()
}
