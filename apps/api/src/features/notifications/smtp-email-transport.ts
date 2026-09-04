import nodemailer from "nodemailer";
import type { SmtpConfig } from "../../config/config.js";
import type { EmailMessage, EmailTransport } from "./notification-worker.js";

export function createSmtpEmailTransport(config: SmtpConfig): EmailTransport {
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.password },
  });
  return {
    async send(message: EmailMessage) {
      await transport.sendMail({ ...message, from: config.from });
    },
  };
}
