import { storage } from "./storage";

export async function seedTestData(userId: string) {
  console.log("Seeding test data for user:", userId);

  // Create a test email account
  const emailAccount = await storage.createEmailAccount({
    userId,
    provider: "gmail",
    email: "demo@example.com",
    accessToken: "test_token",
    refreshToken: "test_refresh",
    tokenExpiry: new Date(Date.now() + 3600000),
  });

  console.log("Created email account:", emailAccount.email);

  // Create test emails
  const sampleEmails = [
    {
      subject: "Project Update: Q4 Planning",
      sender: "Sarah Johnson",
      senderEmail: "sarah.j@company.com",
      bodyPreview: "Hi team, I wanted to share the latest updates on our Q4 planning. We've made significant progress on the roadmap and identified key priorities for the next quarter. Please review the attached documents before our meeting on Friday.",
      receivedAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
      isRead: false,
    },
    {
      subject: "Invoice #12345 - Payment Due",
      sender: "Accounting Team",
      senderEmail: "billing@vendor.com",
      bodyPreview: "Your invoice #12345 for the period of September 2025 is now due. Total amount: $1,250.00. Please process payment by October 30th to avoid late fees.",
      receivedAt: new Date(Date.now() - 86400000 * 5), // 5 days ago
      isRead: true,
    },
    {
      subject: "Team Lunch Tomorrow at 12pm",
      sender: "Alex Martinez",
      senderEmail: "alex.m@company.com",
      bodyPreview: "Hey everyone! Just a reminder about team lunch tomorrow at the Italian place down the street. See you all at noon!",
      receivedAt: new Date(Date.now() - 3600000 * 18), // 18 hours ago
      isRead: false,
    },
    {
      subject: "Marketing Campaign Results - September",
      sender: "Marketing Analytics",
      senderEmail: "analytics@company.com",
      bodyPreview: "The September campaign exceeded expectations with a 24% increase in conversions. Click-through rates improved by 18% compared to August. Detailed breakdown attached.",
      receivedAt: new Date(Date.now() - 86400000 * 7), // 1 week ago
      isRead: true,
    },
    {
      subject: "Re: Bug Report - Login Issue",
      sender: "Tech Support",
      senderEmail: "support@company.com",
      bodyPreview: "Thanks for reporting this issue. Our engineering team has identified the root cause and deployed a fix. The login problem should now be resolved. Please let us know if you experience any further issues.",
      receivedAt: new Date(Date.now() - 3600000 * 4), // 4 hours ago
      isRead: false,
    },
    {
      subject: "Webinar Invitation: AI in Business",
      sender: "Events Team",
      senderEmail: "events@conference.com",
      bodyPreview: "You're invited to our upcoming webinar on 'Leveraging AI for Business Growth' featuring industry leaders. Join us on November 5th at 2pm EST. Register now to secure your spot!",
      receivedAt: new Date(Date.now() - 86400000 * 1), // 1 day ago
      isRead: false,
    },
  ];

  for (const emailData of sampleEmails) {
    await storage.createEmail({
      ...emailData,
      emailAccountId: emailAccount.id,
      messageId: `msg_${Math.random().toString(36).substr(2, 9)}`,
      bodyFull: emailData.bodyPreview + "\n\nBest regards,\n" + emailData.sender,
    });
  }

  console.log(`Created ${sampleEmails.length} test emails`);

  // Create some test labels
  const labels = [
    { name: "Work", color: "239 70% 60%", description: "Work-related emails" },
    { name: "Personal", color: "142 70% 60%", description: "Personal correspondence" },
    { name: "Important", color: "0 70% 60%", description: "High priority items" },
    { name: "Finance", color: "45 70% 60%", description: "Invoices and payments" },
    { name: "Marketing", color: "280 70% 60%", description: "Marketing campaigns" },
  ];

  for (const labelData of labels) {
    await storage.createLabel({
      ...labelData,
      userId,
    });
  }

  console.log(`Created ${labels.length} test labels`);
  console.log("Test data seeding complete!");
}
