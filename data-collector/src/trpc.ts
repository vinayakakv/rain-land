import { createTRPCClient, httpBatchLink } from '@trpc/client'
import superjson from 'superjson'
import type { AppRouter } from '../../data-backend/src/server'
import { env } from './env'

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: env.DATA_COLLECTOR_URL,
      transformer: superjson,
    }),
  ],
})
