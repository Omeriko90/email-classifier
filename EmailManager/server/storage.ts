import {
  users,
  emailAccounts,
  emails,
  labels,
  emailLabels,
  workflows,
  workflowExecutions,
  type User,
  type UpsertUser,
  type EmailAccount,
  type InsertEmailAccount,
  type Email,
  type InsertEmail,
  type Label,
  type InsertLabel,
  type InsertEmailLabel,
  type Workflow,
  type InsertWorkflow,
  type WorkflowExecution,
  type InsertWorkflowExecution,
  type EmailWithLabels,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, inArray, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Email account operations
  createEmailAccount(account: InsertEmailAccount): Promise<EmailAccount>;
  getEmailAccountsByUserId(userId: string): Promise<EmailAccount[]>;
  updateEmailAccountLastSync(accountId: string): Promise<void>;

  // Email operations
  createEmail(email: InsertEmail): Promise<Email>;
  getEmailsByUserId(userId: string): Promise<EmailWithLabels[]>;
  getEmailById(emailId: string, userId: string): Promise<EmailWithLabels | undefined>;
  markEmailAsRead(emailId: string, userId: string, isRead: boolean): Promise<void>;

  // Label operations
  createLabel(label: InsertLabel): Promise<Label>;
  getLabelsByUserId(userId: string): Promise<Label[]>;
  getLabelById(labelId: string, userId: string): Promise<Label | undefined>;
  updateLabel(labelId: string, userId: string, data: Partial<InsertLabel>): Promise<Label>;
  deleteLabel(labelId: string, userId: string): Promise<void>;

  // Email label operations
  addLabelToEmail(data: InsertEmailLabel, userId: string): Promise<void>;
  removeLabelFromEmail(emailId: string, labelId: string, userId: string): Promise<void>;

  // Workflow operations
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  getWorkflowsByUserId(userId: string): Promise<Workflow[]>;
  getWorkflowById(workflowId: string, userId: string): Promise<Workflow | undefined>;
  updateWorkflow(workflowId: string, userId: string, data: Partial<InsertWorkflow>): Promise<Workflow>;
  deleteWorkflow(workflowId: string, userId: string): Promise<void>;

  // Workflow execution operations
  createWorkflowExecution(execution: InsertWorkflowExecution): Promise<WorkflowExecution>;
  getExecutionsByWorkflowId(workflowId: string, userId: string): Promise<WorkflowExecution[]>;

  // Stats
  getStats(userId: string): Promise<{
    totalEmails: number;
    unreadEmails: number;
    totalLabels: number;
    activeWorkflows: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Email account operations
  async createEmailAccount(account: InsertEmailAccount): Promise<EmailAccount> {
    const [emailAccount] = await db
      .insert(emailAccounts)
      .values(account)
      .returning();
    return emailAccount;
  }

  async getEmailAccountsByUserId(userId: string): Promise<EmailAccount[]> {
    return await db
      .select()
      .from(emailAccounts)
      .where(eq(emailAccounts.userId, userId));
  }

  async updateEmailAccountLastSync(accountId: string): Promise<void> {
    await db
      .update(emailAccounts)
      .set({ lastSyncedAt: new Date() })
      .where(eq(emailAccounts.id, accountId));
  }

  // Email operations
  async createEmail(email: InsertEmail): Promise<Email> {
    const [newEmail] = await db
      .insert(emails)
      .values(email)
      .returning();
    return newEmail;
  }

  async getEmailsByUserId(userId: string): Promise<EmailWithLabels[]> {
    const userEmails = await db
      .select({
        email: emails,
        emailLabel: emailLabels,
        label: labels,
      })
      .from(emails)
      .innerJoin(emailAccounts, eq(emails.emailAccountId, emailAccounts.id))
      .leftJoin(emailLabels, eq(emails.id, emailLabels.emailId))
      .leftJoin(labels, eq(emailLabels.labelId, labels.id))
      .where(eq(emailAccounts.userId, userId))
      .orderBy(desc(emails.receivedAt));

    // Group emails with their labels
    const emailMap = new Map<string, EmailWithLabels>();
    
    for (const row of userEmails) {
      if (!emailMap.has(row.email.id)) {
        emailMap.set(row.email.id, {
          ...row.email,
          labels: [],
        });
      }
      
      if (row.emailLabel && row.label) {
        emailMap.get(row.email.id)!.labels.push({
          ...row.emailLabel,
          label: row.label,
        });
      }
    }

    return Array.from(emailMap.values());
  }

  async getEmailById(emailId: string, userId: string): Promise<EmailWithLabels | undefined> {
    const emailData = await db
      .select({
        email: emails,
        emailLabel: emailLabels,
        label: labels,
      })
      .from(emails)
      .innerJoin(emailAccounts, eq(emails.emailAccountId, emailAccounts.id))
      .leftJoin(emailLabels, eq(emails.id, emailLabels.emailId))
      .leftJoin(labels, eq(emailLabels.labelId, labels.id))
      .where(and(eq(emails.id, emailId), eq(emailAccounts.userId, userId)));

    if (emailData.length === 0) return undefined;

    const email: EmailWithLabels = {
      ...emailData[0].email,
      labels: [],
    };

    for (const row of emailData) {
      if (row.emailLabel && row.label) {
        email.labels.push({
          ...row.emailLabel,
          label: row.label,
        });
      }
    }

    return email;
  }

  async markEmailAsRead(emailId: string, userId: string, isRead: boolean): Promise<void> {
    // First verify the email belongs to the user
    const email = await this.getEmailById(emailId, userId);
    if (!email) {
      throw new Error("Email not found");
    }
    
    await db
      .update(emails)
      .set({ isRead })
      .where(eq(emails.id, emailId));
  }

  // Label operations
  async createLabel(label: InsertLabel): Promise<Label> {
    const [newLabel] = await db
      .insert(labels)
      .values(label)
      .returning();
    return newLabel;
  }

  async getLabelsByUserId(userId: string): Promise<Label[]> {
    return await db
      .select()
      .from(labels)
      .where(eq(labels.userId, userId))
      .orderBy(labels.name);
  }

  async getLabelById(labelId: string, userId: string): Promise<Label | undefined> {
    const [label] = await db
      .select()
      .from(labels)
      .where(and(eq(labels.id, labelId), eq(labels.userId, userId)));
    return label;
  }

  async updateLabel(labelId: string, userId: string, data: Partial<InsertLabel>): Promise<Label> {
    const [label] = await db
      .update(labels)
      .set(data)
      .where(and(eq(labels.id, labelId), eq(labels.userId, userId)))
      .returning();
    return label;
  }

  async deleteLabel(labelId: string, userId: string): Promise<void> {
    await db.delete(labels).where(and(eq(labels.id, labelId), eq(labels.userId, userId)));
  }

  // Email label operations
  async addLabelToEmail(data: InsertEmailLabel, userId: string): Promise<void> {
    // Verify email and label belong to user
    const email = await this.getEmailById(data.emailId, userId);
    const label = await this.getLabelById(data.labelId, userId);
    
    if (!email || !label) {
      throw new Error("Email or label not found");
    }
    
    await db.insert(emailLabels).values(data).onConflictDoNothing();
  }

  async removeLabelFromEmail(emailId: string, labelId: string, userId: string): Promise<void> {
    // Verify email and label belong to user
    const email = await this.getEmailById(emailId, userId);
    const label = await this.getLabelById(labelId, userId);
    
    if (!email || !label) {
      throw new Error("Email or label not found");
    }
    
    await db
      .delete(emailLabels)
      .where(
        and(
          eq(emailLabels.emailId, emailId),
          eq(emailLabels.labelId, labelId)
        )
      );
  }

  // Workflow operations
  async createWorkflow(workflow: InsertWorkflow): Promise<Workflow> {
    const [newWorkflow] = await db
      .insert(workflows)
      .values(workflow)
      .returning();
    return newWorkflow;
  }

  async getWorkflowsByUserId(userId: string): Promise<Workflow[]> {
    return await db
      .select()
      .from(workflows)
      .where(eq(workflows.userId, userId))
      .orderBy(desc(workflows.createdAt));
  }

  async getWorkflowById(workflowId: string, userId: string): Promise<Workflow | undefined> {
    const [workflow] = await db
      .select()
      .from(workflows)
      .where(and(eq(workflows.id, workflowId), eq(workflows.userId, userId)));
    return workflow;
  }

  async updateWorkflow(workflowId: string, userId: string, data: Partial<InsertWorkflow>): Promise<Workflow> {
    const [workflow] = await db
      .update(workflows)
      .set(data)
      .where(and(eq(workflows.id, workflowId), eq(workflows.userId, userId)))
      .returning();
    return workflow;
  }

  async deleteWorkflow(workflowId: string, userId: string): Promise<void> {
    await db.delete(workflows).where(and(eq(workflows.id, workflowId), eq(workflows.userId, userId)));
  }

  // Workflow execution operations
  async createWorkflowExecution(execution: InsertWorkflowExecution): Promise<WorkflowExecution> {
    const [newExecution] = await db
      .insert(workflowExecutions)
      .values(execution)
      .returning();
    return newExecution;
  }

  async getExecutionsByWorkflowId(workflowId: string, userId: string): Promise<WorkflowExecution[]> {
    return await db
      .select({ execution: workflowExecutions })
      .from(workflowExecutions)
      .innerJoin(workflows, eq(workflowExecutions.workflowId, workflows.id))
      .where(and(eq(workflowExecutions.workflowId, workflowId), eq(workflows.userId, userId)))
      .orderBy(desc(workflowExecutions.executedAt))
      .limit(10)
      .then(rows => rows.map(r => r.execution));
  }

  // Stats
  async getStats(userId: string): Promise<{
    totalEmails: number;
    unreadEmails: number;
    totalLabels: number;
    activeWorkflows: number;
  }> {
    const [emailStats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        unread: sql<number>`count(*) filter (where ${emails.isRead} = false)::int`,
      })
      .from(emails)
      .innerJoin(emailAccounts, eq(emails.emailAccountId, emailAccounts.id))
      .where(eq(emailAccounts.userId, userId));

    const [labelCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(labels)
      .where(eq(labels.userId, userId));

    const [workflowCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(workflows)
      .where(and(eq(workflows.userId, userId), eq(workflows.isActive, true)));

    return {
      totalEmails: emailStats?.total || 0,
      unreadEmails: emailStats?.unread || 0,
      totalLabels: labelCount?.count || 0,
      activeWorkflows: workflowCount?.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();
