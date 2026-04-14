import {
  pgTable,
  uuid,
  bigint,
  varchar,
  jsonb,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

export const leads = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadNo: bigint("lead_no", { mode: "number" }).notNull().unique(),
  industry: varchar("industry", { length: 50 }).notNull(),
  calculationData: jsonb("calculation_data").notNull(),
  estimatedQuota: integer("estimated_quota").notNull(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  contactPerson: varchar("contact_person", { length: 255 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 30 }).notNull(),
  deviceId: varchar("device_id", { length: 100 }),
  userAgent: varchar("user_agent", { length: 2048 }),
  status: varchar("status", { length: 30 }).default("new").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
