import "server-only";

import { Resend } from "resend";
import type { JobRecord, LeadRecord } from "@/lib/types";

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "SudsOnWheels <noreply@sudsonwheelsusa.com>";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new Resend(apiKey);
}

async function sendEmail(input: {
  to: string | string[];
  subject: string;
  text: string;
}) {
  const resend = getResend();

  if (!resend) {
    return;
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    ...input,
  });
}

export async function sendLeadNotificationEmails(lead: LeadRecord) {
  const ownerEmail = process.env.OWNER_EMAIL;

  const ownerLines = [
    "A new quote request was sent.",
    "",
    `Lead ID: ${lead.id}`,
    `Name: ${lead.first_name} ${lead.last_name}`,
    `Phone: ${lead.phone}`,
    `Email: ${lead.email}`,
    `Service: ${lead.service_name}`,
    lead.location_address ? `Address: ${lead.location_address}` : "",
    lead.message ? `Message: ${lead.message}` : "",
    "",
    `Admin review: /portal/dashboard`,
  ]
    .filter(Boolean)
    .join("\n");

  const customerLines = [
    `Hi ${lead.first_name},`,
    "",
    "We received your quote request and will review it shortly.",
    `Requested service: ${lead.service_name}`,
    lead.location_address ? `Address: ${lead.location_address}` : "",
    "",
    "You should hear back from us within one business day.",
    "",
    "SudsOnWheels",
  ]
    .filter(Boolean)
    .join("\n");

  await Promise.allSettled([
    ownerEmail
      ? sendEmail({
          to: ownerEmail,
          subject: `New quote request - ${lead.first_name} ${lead.last_name}`,
          text: ownerLines,
        })
      : Promise.resolve(),
    sendEmail({
      to: lead.email,
      subject: "We received your request",
      text: customerLines,
    }),
  ]);
}

export async function sendQuoteEmail(input: {
  lead: LeadRecord;
  amount: number;
  notes?: string | null;
}) {
  await sendEmail({
    to: input.lead.email,
    subject: "Your SudsOnWheels estimate",
    text: [
      `Hi ${input.lead.first_name},`,
      "",
      `Your estimate for ${input.lead.service_name} is $${input.amount.toFixed(2)}.`,
      input.notes ? `Notes: ${input.notes}` : "",
      "",
      "Reply to this email or contact us directly if you want to move forward.",
      "",
      "SudsOnWheels",
    ]
      .filter(Boolean)
      .join("\n"),
  });
}

export async function sendScheduledJobEmail(input: {
  lead: LeadRecord;
  job: JobRecord;
}) {
  await sendEmail({
    to: input.lead.email,
    subject: "Your SudsOnWheels job is scheduled",
    text: [
      `Hi ${input.lead.first_name},`,
      "",
      `Your ${input.lead.service_name} job is scheduled for ${new Date(
        input.job.scheduled_start
      ).toLocaleString()}.`,
      input.job.location_address
        ? `Location: ${input.job.location_address}`
        : "",
      "",
      "If anything changes, just reply to this email.",
      "",
      "SudsOnWheels",
    ]
      .filter(Boolean)
      .join("\n"),
  });
}
