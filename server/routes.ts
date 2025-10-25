import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { classifyEmail, generateWorkflowSummary } from "./openai";
import { seedTestData } from "./seed";
import { z } from "zod";
import { insertLabelSchema, insertWorkflowSchema, insertEmailSchema, insertEmailAccountSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Seed test data endpoint (for demo purposes)
  app.post('/api/seed-test-data', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await seedTestData(userId);
      res.json({ message: "Test data seeded successfully" });
    } catch (error) {
      console.error("Error seeding test data:", error);
      res.status(500).json({ message: "Failed to seed test data" });
    }
  });

  // Stats endpoint
  app.get('/api/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Email Account routes
  app.get('/api/email-accounts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accounts = await storage.getEmailAccountsByUserId(userId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching email accounts:", error);
      res.status(500).json({ message: "Failed to fetch email accounts" });
    }
  });

  app.post('/api/email-accounts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertEmailAccountSchema.parse({ ...req.body, userId });
      const account = await storage.createEmailAccount(validatedData);
      res.json(account);
    } catch (error) {
      console.error("Error creating email account:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create email account" });
    }
  });

  // Email routes
  app.get('/api/emails', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const emails = await storage.getEmailsByUserId(userId);
      res.json(emails);
    } catch (error) {
      console.error("Error fetching emails:", error);
      res.status(500).json({ message: "Failed to fetch emails" });
    }
  });

  app.get('/api/emails/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const email = await storage.getEmailById(req.params.id, userId);
      if (!email) {
        return res.status(404).json({ message: "Email not found" });
      }
      res.json(email);
    } catch (error) {
      console.error("Error fetching email:", error);
      res.status(500).json({ message: "Failed to fetch email" });
    }
  });

  app.post('/api/emails', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertEmailSchema.parse(req.body);
      const email = await storage.createEmail(validatedData);
      res.json(email);
    } catch (error) {
      console.error("Error creating email:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create email" });
    }
  });

  app.patch('/api/emails/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { isRead } = req.body;
      await storage.markEmailAsRead(req.params.id, userId, isRead);
      res.json({ message: "Email updated" });
    } catch (error) {
      console.error("Error updating email:", error);
      res.status(500).json({ message: "Failed to update email" });
    }
  });

  app.post('/api/emails/:id/classify', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const emailId = req.params.id;

      const email = await storage.getEmailById(emailId, userId);
      if (!email) {
        return res.status(404).json({ message: "Email not found" });
      }

      const labels = await storage.getLabelsByUserId(userId);
      if (labels.length === 0) {
        return res.status(400).json({ message: "No labels available for classification" });
      }

      const suggestedLabelIds = await classifyEmail(
        email.subject,
        email.bodyPreview,
        labels
      );

      // Add suggested labels to email
      for (const labelId of suggestedLabelIds) {
        await storage.addLabelToEmail({
          emailId,
          labelId,
          isAuto: true,
        }, userId);
      }

      res.json({ message: "Email classified", labelIds: suggestedLabelIds });
    } catch (error) {
      console.error("Error classifying email:", error);
      res.status(500).json({ message: "Failed to classify email" });
    }
  });

  // Label routes
  app.get('/api/labels', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const labels = await storage.getLabelsByUserId(userId);
      res.json(labels);
    } catch (error) {
      console.error("Error fetching labels:", error);
      res.status(500).json({ message: "Failed to fetch labels" });
    }
  });

  app.post('/api/labels', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertLabelSchema.parse({ ...req.body, userId });
      const label = await storage.createLabel(validatedData);
      res.json(label);
    } catch (error) {
      console.error("Error creating label:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create label" });
    }
  });

  app.put('/api/labels/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertLabelSchema.partial().parse(req.body);
      const label = await storage.updateLabel(req.params.id, userId, validatedData);
      res.json(label);
    } catch (error) {
      console.error("Error updating label:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update label" });
    }
  });

  app.delete('/api/labels/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteLabel(req.params.id, userId);
      res.json({ message: "Label deleted" });
    } catch (error) {
      console.error("Error deleting label:", error);
      res.status(500).json({ message: "Failed to delete label" });
    }
  });

  // Email label routes
  app.post('/api/emails/:emailId/labels', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { labelId } = req.body;
      await storage.addLabelToEmail({
        emailId: req.params.emailId,
        labelId,
        isAuto: false,
      }, userId);
      res.json({ message: "Label added" });
    } catch (error) {
      console.error("Error adding label:", error);
      res.status(500).json({ message: "Failed to add label" });
    }
  });

  app.delete('/api/emails/:emailId/labels/:labelId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.removeLabelFromEmail(req.params.emailId, req.params.labelId, userId);
      res.json({ message: "Label removed" });
    } catch (error) {
      console.error("Error removing label:", error);
      res.status(500).json({ message: "Failed to remove label" });
    }
  });

  // Workflow routes
  app.get('/api/workflows', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const workflows = await storage.getWorkflowsByUserId(userId);
      res.json(workflows);
    } catch (error) {
      console.error("Error fetching workflows:", error);
      res.status(500).json({ message: "Failed to fetch workflows" });
    }
  });

  app.post('/api/workflows', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Calculate next run date based on frequency
      const now = new Date();
      const nextRunAt = new Date(now);
      if (req.body.frequency === 'weekly') {
        nextRunAt.setDate(nextRunAt.getDate() + 7);
      } else if (req.body.frequency === 'biweekly') {
        nextRunAt.setDate(nextRunAt.getDate() + 14);
      }

      const validatedData = insertWorkflowSchema.parse({
        ...req.body,
        userId,
        nextRunAt,
        filters: req.body.labelIds ? { labelIds: req.body.labelIds } : {},
      });

      const workflow = await storage.createWorkflow(validatedData);
      res.json(workflow);
    } catch (error) {
      console.error("Error creating workflow:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create workflow" });
    }
  });

  app.patch('/api/workflows/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertWorkflowSchema.partial().parse(req.body);
      const workflow = await storage.updateWorkflow(req.params.id, userId, validatedData);
      res.json(workflow);
    } catch (error) {
      console.error("Error updating workflow:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update workflow" });
    }
  });

  app.delete('/api/workflows/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteWorkflow(req.params.id, userId);
      res.json({ message: "Workflow deleted" });
    } catch (error) {
      console.error("Error deleting workflow:", error);
      res.status(500).json({ message: "Failed to delete workflow" });
    }
  });

  // Workflow execution routes
  app.get('/api/workflows/:id/executions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const executions = await storage.getExecutionsByWorkflowId(req.params.id, userId);
      res.json(executions);
    } catch (error) {
      console.error("Error fetching executions:", error);
      res.status(500).json({ message: "Failed to fetch executions" });
    }
  });

  app.post('/api/workflows/:id/execute', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const workflow = await storage.getWorkflowById(req.params.id, userId);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }

      // Get emails matching the workflow filters
      const allEmails = await storage.getEmailsByUserId(workflow.userId);
      const filters = workflow.filters as any;
      
      let filteredEmails = allEmails;
      if (filters.labelIds && filters.labelIds.length > 0) {
        filteredEmails = allEmails.filter(email =>
          email.labels.some(el => filters.labelIds.includes(el.label.id))
        );
      }

      if (filteredEmails.length === 0) {
        return res.status(400).json({ message: "No emails match the workflow criteria" });
      }

      const summary = await generateWorkflowSummary(
        filteredEmails.map(e => ({
          subject: e.subject,
          sender: e.sender,
          bodyPreview: e.bodyPreview,
        })),
        workflow.prompt
      );

      const execution = await storage.createWorkflowExecution({
        workflowId: workflow.id,
        summary,
        emailCount: filteredEmails.length,
      });

      // Update workflow last run
      await storage.updateWorkflow(workflow.id, userId, {
        lastRunAt: new Date(),
      });

      res.json(execution);
    } catch (error) {
      console.error("Error executing workflow:", error);
      res.status(500).json({ message: "Failed to execute workflow" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
