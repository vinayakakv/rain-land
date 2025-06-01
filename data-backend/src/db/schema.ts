import {
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
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
    timestamp: timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [
    index('timestamp_idx').on(table.timestamp),
    uniqueIndex('row_unique_index').on(
      table.senderName,
      table.senderId,
      table.text,
      table.timestamp,
    ),
  ],
)

export const rawMessagesSchema = createInsertSchema(rawMessagesTable)
