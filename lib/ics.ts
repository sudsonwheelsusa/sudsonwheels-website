import type { JobRecord } from "@/lib/types";

function icsDate(iso: string): string {
  return iso.replace(/[-:]/g, "").split(".")[0] + "Z";
}

function icsEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function generateJobIcs(job: Pick<JobRecord, "id" | "title" | "scheduled_start" | "scheduled_end" | "location_address" | "service_name" | "customer_name">): string {
  const now = icsDate(new Date().toISOString());
  const start = icsDate(job.scheduled_start);
  const end = job.scheduled_end
    ? icsDate(job.scheduled_end)
    : icsDate(new Date(new Date(job.scheduled_start).getTime() + 60 * 60 * 1000).toISOString());

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SudsOnWheels//Job Scheduler//EN",
    "BEGIN:VEVENT",
    `UID:${job.id}@sudsonwheelsusa.com`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${icsEscape(job.title)}`,
    job.location_address ? `LOCATION:${icsEscape(job.location_address)}` : "",
    `DESCRIPTION:${icsEscape(`${job.service_name} - ${job.customer_name}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.join("\r\n");
}
