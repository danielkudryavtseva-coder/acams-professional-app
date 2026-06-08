import nodemailer from "nodemailer";

export type MailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

function hasSmtp(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT);
}

export async function sendMail(payload: MailPayload): Promise<void> {
  const from = process.env.MAIL_FROM ?? '"ACAMS" <noreply@localhost>';

  if (!hasSmtp()) {
    // eslint-disable-next-line no-console
    console.log("[email:dev] Skipping SMTP — logging message instead");
    // eslint-disable-next-line no-console
    console.log({ from, ...payload });
    return;
  }

  const port = Number(process.env.SMTP_PORT ?? "587");
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });

  await transporter.sendMail({
    from,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html ?? payload.text,
  });
}
