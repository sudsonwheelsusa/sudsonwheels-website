import "server-only";

import type { GoogleTokens } from "@/lib/types";

const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

export interface CalendarEventInput {
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
}

export interface CalendarEventResult {
  id: string;
  summary: string;
  status: string;
  start: { dateTime: string };
  end: { dateTime: string };
  updated: string;
}

export interface WatchChannelResult {
  channelId: string;
  resourceId: string;
  expiry_ms: number;
}

async function refreshTokens(tokens: GoogleTokens): Promise<GoogleTokens> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: tokens.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google token refresh failed: ${err}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  return {
    ...tokens,
    access_token: data.access_token,
    expiry_ms: Date.now() + data.expires_in * 1000 - 60_000,
  };
}

export async function getValidTokens(tokens: GoogleTokens): Promise<GoogleTokens> {
  if (Date.now() < tokens.expiry_ms) return tokens;
  return refreshTokens(tokens);
}

async function calFetch<T>(tokens: GoogleTokens, path: string, init?: RequestInit): Promise<T> {
  const valid = await getValidTokens(tokens);
  const res = await fetch(`${CALENDAR_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${valid.access_token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Calendar API ${res.status}: ${err}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function createCalendarEvent(
  tokens: GoogleTokens,
  calendarId: string,
  event: CalendarEventInput,
): Promise<CalendarEventResult> {
  return calFetch<CalendarEventResult>(
    tokens,
    `/calendars/${encodeURIComponent(calendarId)}/events`,
    { method: "POST", body: JSON.stringify(event) },
  );
}

export async function updateCalendarEvent(
  tokens: GoogleTokens,
  calendarId: string,
  eventId: string,
  event: Partial<CalendarEventInput>,
): Promise<CalendarEventResult> {
  return calFetch<CalendarEventResult>(
    tokens,
    `/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    { method: "PATCH", body: JSON.stringify(event) },
  );
}

export async function deleteCalendarEvent(
  tokens: GoogleTokens,
  calendarId: string,
  eventId: string,
): Promise<void> {
  return calFetch<void>(
    tokens,
    `/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    { method: "DELETE" },
  );
}

export async function registerWatchChannel(
  tokens: GoogleTokens,
  calendarId: string,
  webhookUrl: string,
  channelId: string,
  channelToken: string,
): Promise<WatchChannelResult> {
  const result = await calFetch<{ id: string; resourceId: string; expiration: string }>(
    tokens,
    `/calendars/${encodeURIComponent(calendarId)}/events/watch`,
    {
      method: "POST",
      body: JSON.stringify({
        id: channelId,
        type: "web_hook",
        address: webhookUrl,
        token: channelToken,
      }),
    },
  );
  return {
    channelId: result.id,
    resourceId: result.resourceId,
    expiry_ms: Number(result.expiration),
  };
}

export async function stopWatchChannel(
  tokens: GoogleTokens,
  channelId: string,
  resourceId: string,
): Promise<void> {
  return calFetch<void>(tokens, "/channels/stop", {
    method: "POST",
    body: JSON.stringify({ id: channelId, resourceId }),
  });
}
