import { integer, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core'

export const rawMessagesTable = pgTable('raw_messages', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  senderId: varchar({ length: 128 }).notNull(),
  text: varchar({ length: 2000 }).notNull(),
  timestamp: timestamp().notNull(),
})
