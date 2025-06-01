import { z } from 'zod/v4'

const envSchema = z.object(
  {
    WHATSAPP_GROUP_ID: z.string().min(1),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1),
    SENDER_ID_HASH_SECRET: z.string().min(1),
    DATA_COLLECTOR_URL: z.string().min(1),
  },
  { error: 'Required environment variables missing' },
)

export const env = envSchema.parse(process.env)
