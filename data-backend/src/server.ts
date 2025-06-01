import { createHTTPServer } from '@trpc/server/adapters/standalone'
import { sql } from 'drizzle-orm'
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
        await db.insert(rawMessagesTable).values(input).onConflictDoNothing()
        return { success: true as const }
      } catch (error) {
        return { success: false as const, error }
      }
    }),
  getLastMessageTimestamp: publicProcedure.query(async () => {
    const [firstRow] = await db
      .select({
        timestamp: sql<Date>`coalesce(max(${rawMessagesTable.timestamp}), date('1990-01-01'))`,
      })
      .from(rawMessagesTable)
    // biome-ignore lint/style/noNonNullAssertion: We always get a row because of `coalesce`
    return firstRow!.timestamp
  }),
})

const server = createHTTPServer({
  router: appRouter,
})

server.listen(env.PORT)

export type AppRouter = typeof appRouter
