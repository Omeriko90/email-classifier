import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  emailAccounts: many(emailAccounts),
  labels: many(labels),
  workflows: many(workflows),
}));

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Email Accounts - stores connected Gmail/Outlook accounts
export const emailAccounts = pgTable("email_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: varchar("provider").notNull(), // 'gmail' or 'outlook'
  email: varchar("email").notNull(),
  accessToken: text("access_token"), // Will be encrypted in production
  refreshToken: text("refresh_token"), // Will be encrypted in production
  tokenExpiry: timestamp("token_expiry"),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("email_accounts_user_id_idx").on(table.userId),
]);

export const emailAccountsRelations = relations(emailAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [emailAccounts.userId],
    references: [users.id],
  }),
  emails: many(emails),
}));

export const insertEmailAccountSchema = createInsertSchema(emailAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEmailAccount = z.infer<typeof insertEmailAccountSchema>;
export type EmailAccount = typeof emailAccounts.$inferSelect;

// Emails - stores synced emails from connected accounts
export const emails = pgTable("emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  emailAccountId: varchar("email_account_id").notNull().references(() => emailAccounts.id, { onDelete: 'cascade' }),
  messageId: varchar("message_id").notNull(), // Provider's unique ID
  subject: text("subject").notNull(),
  sender: varchar("sender").notNull(),
  senderEmail: varchar("sender_email").notNull(),
  receivedAt: timestamp("received_at").notNull(),
  bodyPreview: text("body_preview").notNull(),
  bodyFull: text("body_full"),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("emails_account_id_idx").on(table.emailAccountId),
  index("emails_received_at_idx").on(table.receivedAt),
  index("emails_account_message_idx").on(table.emailAccountId, table.messageId),
]);

export const emailsRelations = relations(emails, ({ one, many }) => ({
  emailAccount: one(emailAccounts, {
    fields: [emails.emailAccountId],
    references: [emailAccounts.id],
  }),
  labels: many(emailLabels),
}));

export const insertEmailSchema = createInsertSchema(emails).omit({
  id: true,
  createdAt: true,
});

export type InsertEmail = z.infer<typeof insertEmailSchema>;
export type Email = typeof emails.$inferSelect;

// Labels - custom user-defined labels for email categorization
export const labels = pgTable("labels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar("name").notNull(),
  color: varchar("color").notNull(), // HSL color string
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("labels_user_id_idx").on(table.userId),
]);

export const labelsRelations = relations(labels, ({ one, many }) => ({
  user: one(users, {
    fields: [labels.userId],
    references: [users.id],
  }),
  emails: many(emailLabels),
}));

export const insertLabelSchema = createInsertSchema(labels).omit({
  id: true,
  createdAt: true,
});

export type InsertLabel = z.infer<typeof insertLabelSchema>;
export type Label = typeof labels.$inferSelect;

// EmailLabels - many-to-many relationship between emails and labels
export const emailLabels = pgTable("email_labels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  emailId: varchar("email_id").notNull().references(() => emails.id, { onDelete: 'cascade' }),
  labelId: varchar("label_id").notNull().references(() => labels.id, { onDelete: 'cascade' }),
  isAuto: boolean("is_auto").default(false).notNull(), // true if AI-classified
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("email_labels_email_id_idx").on(table.emailId),
  index("email_labels_label_id_idx").on(table.labelId),
]);

export const emailLabelsRelations = relations(emailLabels, ({ one }) => ({
  email: one(emails, {
    fields: [emailLabels.emailId],
    references: [emails.id],
  }),
  label: one(labels, {
    fields: [emailLabels.labelId],
    references: [labels.id],
  }),
}));

export const insertEmailLabelSchema = createInsertSchema(emailLabels).omit({
  id: true,
  createdAt: true,
});

export type InsertEmailLabel = z.infer<typeof insertEmailLabelSchema>;
export type EmailLabel = typeof emailLabels.$inferSelect;

// Workflows - automated email summarization configurations
export const workflows = pgTable("workflows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar("name").notNull(),
  description: text("description"),
  frequency: varchar("frequency").notNull(), // 'weekly' or 'biweekly'
  filters: jsonb("filters").notNull(), // { labelIds: [], keywords: [], dateRange: {} }
  prompt: text("prompt").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("workflows_user_id_idx").on(table.userId),
]);

export const workflowsRelations = relations(workflows, ({ one, many }) => ({
  user: one(users, {
    fields: [workflows.userId],
    references: [users.id],
  }),
  executions: many(workflowExecutions),
}));

export const insertWorkflowSchema = createInsertSchema(workflows).omit({
  id: true,
  createdAt: true,
});

export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type Workflow = typeof workflows.$inferSelect;

// Workflow Executions - history of workflow runs
export const workflowExecutions = pgTable("workflow_executions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  summary: text("summary").notNull(),
  emailCount: integer("email_count").notNull(),
  executedAt: timestamp("executed_at").defaultNow(),
}, (table) => [
  index("workflow_executions_workflow_id_idx").on(table.workflowId),
  index("workflow_executions_executed_at_idx").on(table.executedAt),
]);

export const workflowExecutionsRelations = relations(workflowExecutions, ({ one }) => ({
  workflow: one(workflows, {
    fields: [workflowExecutions.workflowId],
    references: [workflows.id],
  }),
}));

export const insertWorkflowExecutionSchema = createInsertSchema(workflowExecutions).omit({
  id: true,
  executedAt: true,
});

export type InsertWorkflowExecution = z.infer<typeof insertWorkflowExecutionSchema>;
export type WorkflowExecution = typeof workflowExecutions.$inferSelect;

// Extended types for frontend use with relations
export type EmailWithLabels = Email & {
  labels: (EmailLabel & { label: Label })[];
};

export type WorkflowWithExecutions = Workflow & {
  executions: WorkflowExecution[];
};

export type LabelWithCount = Label & {
  emailCount: number;
};
