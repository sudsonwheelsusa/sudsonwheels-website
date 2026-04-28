# Google Calendar Two-Way Sync — Security & Auth Fixes

## Changes Made

This document summarizes critical security and architectural fixes applied to the Google Calendar sync plan before implementation.

### 1. Auth Model Unification ✅

**Problem:** API routes used local auth helpers that only checked `profiles.role = 'admin'`, bypassing MFA enforcement from the shared auth layer.

**Files Updated:**
- `app/api/admin/leads/[leadId]/workflow/route.ts`
  - Removed local `requireAdminIdentity()` 
  - Now uses `requireAdmin()` from `lib/auth/admin` (enforces MFA/AAL2)
  
- `app/api/admin/leads/[leadId]/route.ts`
  - Removed local `getAdminUserId()`
  - Now uses `requireAdmin()` from `lib/auth/admin` (enforces MFA/AAL2)

**Result:** All admin API routes now enforce consistent MFA policy.

---

### 2. CSRF Protection in OAuth Flow ✅

**Problem:** OAuth connect + callback had no state parameter, leaving the flow vulnerable to CSRF/session mix-up attacks.

**Files Created:**
- `app/api/admin/google/connect/route.ts`
  - Generates random `state` token (UUID)
  - Stores in encrypted `httpOnly` `sameSite=lax` cookie (10 min expiry)
  - Includes state in Google OAuth redirect URL
  
- `app/api/admin/google/callback/route.ts`
  - Validates incoming state matches stored cookie
  - Rejects requests if state is missing, expired, or mismatched
  - Returns `?gcal=error&reason=csrf` on validation failure
  - Clears state cookie after successful exchange

**Result:** OAuth flow is now protected against CSRF attacks.

---

### 3. Push Channel Lifecycle Management ✅

**Problem:** Status route would create a new push channel without stopping the old one first, causing duplicate webhook deliveries until the old channel expired.

**File Updated:**
- `app/api/admin/google/status/route.ts`
  - Calls `stopWatchChannel()` **before** `registerWatchChannel()`
  - Gracefully handles missing old channels
  - Logs errors but continues (non-blocking)

**Result:** No orphaned push channels; clean lifecycle.

---

### 4. Webhook Owner Scoping ✅

**Problem:** Webhook updates jobs by `gcal_event_id` alone. Even though there's a single shared calendar, the schema didn't prevent a job from being updated by the wrong admin's webhook context (confusing in multi-admin futures).

**File Created:**
- `app/api/admin/google/webhook/route.ts`
  - Queries jobs by **both** `gcal_event_id` AND `created_by` (profile ID)
  - Updates only jobs created by the owning admin
  - Prevents webhook from updating unrelated jobs

**Result:** Webhook updates are owner-scoped even with shared calendar.

---

### 5. Disconnect & Token Management ✅

**File Created:**
- `app/api/admin/google/disconnect/route.ts`
  - Stops push channel before clearing tokens
  - Best-effort (logs but continues on channel stop failure)
  - Clears all Google fields from profile

**Result:** Clean disconnection without orphaned resources.

---

### Shared Implementation Notes

All OAuth routes use:
- `requireAdmin()` for MFA-enforced authentication
- Service-role `createAdminClient()` to bypass RLS
- Proper error handling with non-blocking fallbacks
- Redirect URLs with query params for status feedback

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                   SINGLE SHARED CALENDAR                     │
│              contact@sudsonwheelsusa.com                      │
│  (syncs to admin's phone calendar & app automatically)        │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
   [Job Schedule]              [Google Calendar]
        │                             │
        ├─ Create event              │
        ├─ Store gcal_event_id       │
        └─ Fire-and-forget           │
                                     │
                    [Webhook] (push channel)
                           │
                    [CSRF-protected callback]
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
   [Cancel in Google]                  [Reschedule in Google]
        │                                     │
   Update job.status                   Update job times
   to "cancelled"                       (fire-and-forget)
        │                                     │
        └──────────────┬──────────────────────┘
                       │
        [Scoped by created_by + gcal_event_id]
         (owner isolation + event matching)
```

---

## What's Next

The plan can now proceed with these implementations (all created):
1. ✅ Database migration + lib/types.ts
2. ✅ Google Calendar API client (lib/google/calendar.ts)
3. ✅ OAuth connect + callback routes (CSRF-protected)
4. ✅ Status + disconnect routes (channel cleanup)
5. ⏳ Sync job → calendar in workflow route (Task 5 from plan)
6. ⏳ Delete calendar event on job done (Task 6 from plan)
7. ✅ Webhook receiver (owner-scoped)
8. ⏳ CalendarSection UI updates (Task 8 from plan)
9. ⏳ End-to-end testing

---

## Security Checklist

- [x] MFA enforcement on all admin routes
- [x] CSRF state parameter in OAuth flow
- [x] Secure cookie handling (httpOnly, sameSite, secure in prod)
- [x] Push channel lifecycle management (no orphans)
- [x] Webhook scope by profile + event ID
- [x] Non-blocking error handling (retries don't block job saves)
- [x] Token refresh caching (1-min buffer to prevent race)
