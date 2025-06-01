import { createHTTPServer } from '@trpc/server/adapters/standalone'
import { db } from './db'
import { rawMessagesSchema, rawMessagesTable } from './db/schema'
import { env } from './env'
import { publicProcedure, router } from './trpc'

const appRouter = router({
  insertRawMessages: publicProcedure
    .input(rawMessagesSchema.array())
    .mutation(async (request) => {
      const { input } = request
      try {
        await db.insert(rawMessagesTable).values(input)
        return { success: true as const }
      } catch (error) {
        return { success: false as const, error }
      }
    }),
})

const server = createHTTPServer({
  router: appRouter,
})

server.listen(env.PORT)

export type AppRouter = typeof appRouter
