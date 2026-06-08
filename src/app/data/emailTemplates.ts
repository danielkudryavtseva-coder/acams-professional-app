/**
 * Email templates for recruiter and banker outreach.
 */

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: "cold_outreach" | "follow_up" | "thank_you" | "networking" | "application";
  tags: string[];
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "cold-ib-analyst",
    name: "Cold Outreach - IB Analyst",
    subject: "Interest in {{firm_name}} — {{your_school}} Student",
    category: "cold_outreach",
    tags: ["investment banking", "analyst", "cold"],
    body: `Hi {{first_name}},

I hope this message finds you well. My name is {{your_name}}, and I'm a {{year}} at {{your_school}} studying {{your_major}}.

I've been following {{firm_name}}'s work in {{sector}}, particularly {{specific_deal_or_news}}, and I'm deeply interested in pursuing a career in investment banking.

I would love to learn more about your experience at {{firm_name}} and any advice you might have for someone looking to break into the industry. Would you be open to a 15–20 minute call at your convenience?

Thank you for your time and consideration.

Best regards,
{{your_name}}
{{your_school}} | {{your_major}} | Class of {{graduation_year}}
{{your_email}} | {{your_linkedin}}`,
  },
  {
    id: "follow-up-post-call",
    name: "Follow-Up After Informational",
    subject: "Thank You — {{firm_name}} Informational",
    category: "follow_up",
    tags: ["follow-up", "networking"],
    body: `Hi {{first_name}},

Thank you so much for taking the time to speak with me today. I really appreciated your insights on {{topic_discussed}} and your perspective on {{firm_name}}'s culture.

I'll definitely look into {{resource_mentioned}} as you suggested. I'm even more excited about the opportunity at {{firm_name}} after our conversation.

I'll keep you updated on my application status. Please don't hesitate to reach out if there's anything I can do.

Best,
{{your_name}}`,
  },
  {
    id: "recruiter-outreach",
    name: "Recruiter Outreach",
    subject: "{{your_school}} Student — {{role}} Opportunities at {{firm_name}}",
    category: "cold_outreach",
    tags: ["recruiter", "application"],
    body: `Hi {{first_name}},

My name is {{your_name}}, a {{year}} at {{your_school}}. I'm reaching out to express my strong interest in {{role}} opportunities at {{firm_name}} for {{season}} {{year}}.

I have experience in {{relevant_experience}} and have maintained a {{gpa}} GPA in {{your_major}}. My background in {{specific_skill}} particularly aligns with {{firm_name}}'s focus on {{firm_focus}}.

Could you share any information about the recruiting process or timeline? I've already applied through the portal and wanted to follow up directly.

Thank you for your time.

Sincerely,
{{your_name}}
{{your_school}} | {{graduation_year}}`,
  },
  {
    id: "pe-networking",
    name: "PE Networking — Alumni",
    subject: "{{your_school}} Alum — Interest in PE at {{firm_name}}",
    category: "networking",
    tags: ["private equity", "alumni", "networking"],
    body: `Hi {{first_name}},

I came across your profile through the {{your_school}} alumni network. I'm a {{year}} studying {{your_major}} and am very interested in private equity, particularly in {{sector}}.

I noticed you worked in {{previous_role}} before joining {{firm_name}}, which closely mirrors the path I'm hoping to take. I'd love to hear more about your transition and any advice for someone in my position.

If you're open to it, I'd appreciate 15 minutes of your time for a quick call. I'm happy to work around your schedule.

Best regards,
{{your_name}}`,
  },
  {
    id: "thank-you-interview",
    name: "Post-Interview Thank You",
    subject: "Thank You — {{role}} Interview at {{firm_name}}",
    category: "thank_you",
    tags: ["interview", "thank-you"],
    body: `Dear {{first_name}},

Thank you for the opportunity to interview for the {{role}} position at {{firm_name}}. I truly enjoyed speaking with you and the team about {{topic_discussed}}.

Our conversation reinforced my enthusiasm for the role, especially regarding {{specific_aspect}}. I'm confident that my experience in {{relevant_experience}} would allow me to contribute meaningfully.

Please don't hesitate to reach out if you need any additional information. I look forward to hearing from you.

Warm regards,
{{your_name}}`,
  },
];

export function getTemplatesByCategory(category: EmailTemplate["category"]): EmailTemplate[] {
  return EMAIL_TEMPLATES.filter((t) => t.category === category);
}

export function fillTemplate(template: EmailTemplate, vars: Record<string, string>): string {
  let body = template.body;
  for (const [key, value] of Object.entries(vars)) {
    body = body.split(`{{${key}}}`).join(value);
  }
  return body;
}
