import { render } from "@react-email/components";
import nodemailer from "nodemailer";

import { env } from "@/env";

import { MeerkatMeetingEmail } from "./meeting-email";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  ...(env.SMTP_USER && env.SMTP_PASS
    ? {
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      }
    : {}),
});

type SendMeetingEmailProps = {
  roomLink: string;
  scheduledDateAndTime: string;
  to: string;
  from: string;
  subject: string;
};

export async function sendMeetingEmail({
  roomLink,
  scheduledDateAndTime,
  to,
  from,
  subject,
}: SendMeetingEmailProps) {
  const parsedDate = new Date(scheduledDateAndTime);
  const scheduledDate = parsedDate.toLocaleDateString();
  const scheduledTime = parsedDate.toLocaleTimeString();

  const emailHtml = await render(
    MeerkatMeetingEmail({
      roomLink,
      scheduledDate,
      scheduledTime,
    })
  );

  const options = {
    from,
    to,
    subject,
    html: emailHtml,
  };

  await transporter.sendMail(options);
}