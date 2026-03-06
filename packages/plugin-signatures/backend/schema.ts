import { pgTable, text, timestamp, primaryKey } from 'drizzle-orm/pg-core'

export const pluginSignatures = pgTable(
  'plugin_signatures',
  {
    did: text('did').notNull(),
    communityDid: text('community_did').notNull(),
    text: text('text').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.did, table.communityDid] })]
)
