import {
  index,
  integer,
  pgTable,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'

export const rawMessagesTable = pgTable(
  'raw_messages',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    senderId: varchar({ length: 128 }).notNull(),
    senderName: varchar({ length: 128 }).notNull(),
    text: varchar({ length: 2000 }).notNull(),
    timestamp: timestamp().notNull(),
  },
  (table) => [index('timestamp_idx').on(table.timestamp)],
)

export const rawMessagesSchema = createInsertSchema(rawMessagesTable)
