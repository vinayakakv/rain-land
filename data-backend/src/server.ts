import { createHTTPServer } from '@trpc/server/adapters/standalone'
import z from 'zod/v4'
import { db } from './db'
import { rawMessagesTable } from './db/schema'
import { env } from './env'
import { publicProcedure, router } from './trpc'

const appRouter = router({
  insertRawMessages: publicProcedure
    .input(
      z.object({
        senderId: z.string().min(1),
        text: z.string().min(1),
        timestamp: z.coerce.date(),
      }),
    )
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
