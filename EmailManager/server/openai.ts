import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function classifyEmail(
  emailSubject: string,
  emailBody: string,
  availableLabels: { id: string; name: string }[]
): Promise<string[]> {
  if (availableLabels.length === 0) {
    return [];
  }

  const labelNames = availableLabels.map(l => l.name).join(', ');
  
  const prompt = `You are an email classification assistant. Classify the following email into one or more of these categories: ${labelNames}

Email Subject: ${emailSubject}
Email Body: ${emailBody}

Return only a JSON object with a "labels" array containing the matching category names from the provided list. Only use categories from the list provided. If none match, return an empty array.

Example response format: { "labels": ["Work", "Important"] }`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_completion_tokens: 500,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    const suggestedLabels = result.labels || [];

    // Return label IDs that match the suggested names
    return availableLabels
      .filter(label => 
        suggestedLabels.some((name: string) => 
          name.toLowerCase() === label.name.toLowerCase()
        )
      )
      .map(label => label.id);
  } catch (error) {
    console.error("OpenAI classification error:", error);
    return [];
  }
}

export async function generateWorkflowSummary(
  emailData: { subject: string; sender: string; bodyPreview: string }[],
  customPrompt: string
): Promise<string> {
  if (emailData.length === 0) {
    return "No emails found matching the workflow criteria.";
  }

  const emailTexts = emailData
    .map(e => `Subject: ${e.subject}\nFrom: ${e.sender}\n${e.bodyPreview}`)
    .join('\n\n---\n\n');

  const prompt = `${customPrompt}\n\nEmails to summarize:\n\n${emailTexts}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 2048,
    });

    return response.choices[0].message.content || "Summary generation failed.";
  } catch (error) {
    console.error("OpenAI summary generation error:", error);
    throw new Error("Failed to generate summary");
  }
}
