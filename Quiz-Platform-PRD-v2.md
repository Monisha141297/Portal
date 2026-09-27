# Training & Assessment Platform — PRD v2

**Stack:** React + TypeScript (web) · React Native (mobile) · Node.js + Express · PostgreSQL (system of record) · Redis (real-time session layer)

---

## 1. Purpose & Scope

This extends the existing quiz platform spec with the newly mandated features:

- Training-video-gated assessments (per product)
- Badges will be provided based on some condition.
- Question delivery with per-participant question shuffling
- Invite-link based quiz assignment
- Examiner hierarchy for CRUD operation.
- Photo upload
- Native mobile support (React Native)
- Redis as the live-session layer, reconciled into Postgres as system of record

It replaces the original MSSQL-based design with **Postgres + Redis**, and reframes the "submission" model from a single end-of-quiz POST into a **per-question, real-time event stream**.

---

## 2. Roles

| Role | Summary |
|---|---|
| **Participant (Employee)** | Logs in → sees assigned products needing training → watches product video → takes assessment → sees result  |
| **Examiner** | Creates question pools & quizzes, schedules them, generates invite links, reviews results, manages retakes. Any Examiner can **view** any other Examiner's quizzes; only the **owner** can edit/delete a quiz while it's in `DRAFT`. Once `SCHEDULED`, **no one** (including the owner) can edit questions/marks/timing. |
| **Admin** | Read-only visualization across all participants/quizzes/results. No export, no drill-down into individual answers. |

### 2.1 Examiner visibility matrix

| Action | Own quiz (Draft) | Other's quiz (Draft) | Any quiz (Scheduled+) |
|---|---|---|---|
| View | ✅ | ✅ | ✅ |
| Edit questions/marks/timing | ✅ | ❌ | ❌ (nobody) |
| Delete | ✅ | ❌ | ❌ (delete only pre-schedule) |
| Schedule | ✅ | ❌ | — |
| View results | ✅ | ✅ | ✅ |

---

## 3. Core Flows

### 3.1 Participant

1. Login → landing page lists **products requiring training**, each with a status chip (Not started / In progress / Passed / Failed – retake pending).
2. Select a product → **watch the product video** (progress tracked; assessment unlocks at 90%+ watched, or on completion — confirm threshold with stakeholders).
3. Video complete → **Start Assessment** becomes available (only within the invite/schedule window).
4. Quiz runs live, one question at a time, server-paced (see §6).
5. Post-deadline (or post-submit for Understanding quizzes): view score, correct/incorrect breakdown, and any **badges earned**.
6. **Mandatory** quiz failed → participant waits for Examiner to mark "Must Retake" → gets notified → retakes (max 3 attempts total, new random 10-of-50 question set each time). Each participants receives same set of questions but not in same order.
7. **Understanding** quiz: no passing criteria, no retake, no scheduling required — can be attempted ad hoc within its availability window.

### 3.2 Examiner

1. Build a **Question Pool** (e.g., 50 MCQs) per product/topic.
2. Create a **Quiz**: type (Mandatory/Understanding), pool reference, questions-per-attempt (e.g., 10 of 50), time per question or total time limit, passing criteria (Mandatory only), max attempts (Mandatory only, ≤3).
3. **Schedule** the quiz → system locks questions/marks/timing → generates an **invite link** (and/or direct bulk assignment by emp ID).
4. Distribute invite link / assignment triggers notification (email + in-app).
5. After deadline: review per-participant results, mark failed Mandatory attempts as "Must Retake" or "Retake Not Required", export CSV/Excel.

### 3.3 Admin

Read-only dashboard: Quiz title, Participant, Score, Attempt count, pass/fail aggregate charts. No export, no per-question drill-down.

---

## 4. New Feature Specs

### 4.1 Badges (Gamification)

Ten badges, awarded event-driven (async worker consumes domain events, no synchronous coupling to the quiz-submit path):

| # | Badge | Trigger |
|---|---|---|
| 1 | Welcome Aboard | First successful login |
| 2 | First Steps | First product video completed |
| 3 | Quiz Taker | First assessment attempt started |
| 4 | First Pass | First Mandatory quiz passed |
| 5 | Perfect Score | 100% on any assessment |
| 6 | Comeback | Passed on a retake after a prior fail |
| 7 | Speedster | Passed with >30% of time remaining |
| 8 | Well Rounded | Passed 5 different product assessments |
| 9 | Understanding Star | Completed 5 Understanding quizzes |
| 10 | Perfect Streak | Passed 3 Mandatory quizzes in a row, first attempt each time |

Badges table stores `UserBadge(userId, badgeId, awardedAt, attemptId)`. Badge evaluation is a Redis-Streams consumer (`badge-worker`) so it never blocks scoring.

### 4.2 Randomized-but-distinct question sets, live delivery

- Pool of 50 → each participant gets a **random 10**, seeded by `hash(participantId, attemptId, poolId)` (deterministic + reproducible for audit, not guessable).
- For **live/synchronous** quizzes (25 people starting together), order is additionally per-participant-shuffled: same 10 question IDs *can* repeat across participants (pool is finite), but **presentation order differs** per participant, so screen-glancing doesn't help.
- Delivery is **server-paced**: the server pushes `QUESTION_STARTED` per participant on their own clock (not lock-step), each question carrying its own `duration` and `endsAt`.

### 4.3 Invite links

`InviteLink(id, quizId, token, expiresAt, maxUses, usedCount, createdBy)`. Opening the link authenticates (or gates self-registration) then auto-creates a `ParticipantQuizMapping` row if the participant is eligible.

### 4.4 Photo upload

Profile photo screen: client-side crop → `POST /api/participant/profile/photo` (multipart, max 5MB, jpg/png) → stored in object storage (S3-compatible), Postgres stores the URL only. Not logged in audit trail beyond the upload event metadata.

### 4.5 Mobile (React Native)

Same API surface as web. Additional considerations:
- Video playback must handle backgrounding (pause, don't lose watched-progress).
- Quiz screen must survive app backgrounding within the session-timeout window (resume from Redis-held state, see §6.3).
- Push notifications (FCM/APNs) mirror the web email/dashboard notification triggers.

---

## 5. High-Level Architecture

```
┌─────────────┐      ┌─────────────┐
│  React Web  │      │ React Native│
└──────┬──────┘      └──────┬──────┘
       │        HTTPS / WSS │
       └───────────┬────────┘
                    ▼
          ┌───────────────────┐
          │  Express API tier │  (stateless, horizontally scaled)
          └─────────┬──────────┘
                     │
        ┌────────────┼─────────────┐
        ▼            ▼             ▼
   ┌─────────┐  ┌──────────┐  ┌──────────┐
   │  Redis  │  │ Postgres │  │  S3 (obj)│
   │ (live   │  │ (system  │  │ (video,  │
   │ session,│  │ of       │  │ photos)  │
   │ cache,  │  │ record)  │  └──────────┘
   │ queue)  │  └──────────┘
   └─────────┘
        ▲
        │ async flush / reconcile worker
        └───────────────────────────────┘
```

### 5.1 Why Redis sits in front of Postgres for live quizzes

300 participants can each submit an answer within a 2-second window per question. Writing every `ANSWER_SUBMITTED` directly to Postgres as an individual transaction is the exact bottleneck the original spec flagged in §9. Instead:

1. **During the quiz**, all session state lives in Redis:
   - `session:{attemptId}` — hash: `currentQuestionSeq`, `startedAt`, `status`
   - `session:{attemptId}:q:{questionId}` — hash: `startedAt`, `endsAt`, `duration`
   - `session:{attemptId}:answers` — Redis Stream (`XADD`), one entry per accepted answer: `{questionId, answerId, submittedAt}`
2. **Idempotent accept logic** happens in Redis, not Postgres (cheap, single-threaded ops, no lock contention):
   ```
   if submittedAt <= question.endsAt:
       XADD session:{attemptId}:answers * questionId=Q102 answerId=C submittedAt=...
       # dedupe: a Lua script checks a per-question SETNX flag
       #   session:{attemptId}:q:{questionId}:answered → prevents double count
   else:
       reject (TIMEOUT)
   ```
3. **On quiz completion** (last question ends, or participant submits early), a worker:
   - Reads the full `answers` stream for that attempt from Redis
   - Computes the score (join against Question marks, cached in Redis too)
   - Writes **one atomic Postgres transaction**: `INSERT Attempt`, bulk `INSERT AttemptAnswer` (one round trip, multi-row insert), `UPDATE Result`
   - Publishes `RESULT_READY` for the notification + badge workers
   - Clears the Redis session keys (TTL = quiz duration + 1h as a safety net if the worker never runs)

This means Postgres sees **one write per participant per attempt**, not one write per answer — turning ~3,000 potential writes (300 participants × 10 questions) into ~300 batched writes at completion.

### 5.2 Failure handling

- Redis unavailable mid-quiz → participant's in-flight answers are cached client-side (IndexedDB / RN AsyncStorage) and retried; server rejects new question starts with a "please retry" state rather than silently losing data.
- Worker crash before Postgres flush → Redis keys survive (TTL-bounded); a recovery job scans for `session:*` hashes with `status=COMPLETED_PENDING_FLUSH` older than N minutes and re-runs the flush.
- Postgres write fails → transaction rolls back, Redis session is **not** cleared, flush is retried with backoff; participant sees "processing" rather than an error.

---

## 6. Live Question Protocol

Client and server exchange events over WebSocket (fallback: short-poll):

```jsonc
// Server → client
{
  "event": "QUESTION_STARTED",
  "attemptId": "a-823491",
  "questionId": "Q102",
  "sequence": 7,
  "duration": 20,
  "endsAt": "2026-09-26T10:15:40Z",
  "question": "Which PPE is mandatory?",
  "options": [
    { "id": "A", "text": "Safety goggles" },
    { "id": "B", "text": "Helmet" },
    { "id": "C", "text": "Safety goggles + gloves" },
    { "id": "D", "text": "None" }
  ]
}

// Client → server
{
  "event": "ANSWER_SUBMITTED",
  "attemptId": "a-823491",
  "questionId": "Q102",
  "answerId": "C",
  "clientTimestamp": 1758880540123
}

// Server → client (ack)
{ "event": "ANSWER_ACK", "questionId": "Q102", "status": "ACCEPTED" | "DUPLICATE" | "TIMEOUT" }
```

Server always re-derives `submittedAt` from its own clock on receipt (client timestamp is for latency diagnostics only, never trusted for the accept/reject decision).

---

## 7. API Boundaries

Grouped by domain; all under `/api`. Auth via `Authorization: Bearer {JWT}`.

### Auth
```
POST /auth/login
POST /auth/refresh
POST /auth/logout
```

### Participant
```
GET  /participant/products                 # products needing training + status
GET  /participant/products/:id/video        # signed video URL
GET  /participant/quizzes                   # assigned/invited, with status
GET  /participant/quiz/:quizId              # metadata (pre-start)
POST /participant/quiz/:quizId/start        # creates Attempt, opens Redis session
WS   /participant/quiz/:attemptId/live       # question/answer event stream
GET  /participant/quiz/:attemptId/result     # post-deadline only
GET  /participant/badges
POST /participant/profile/photo
POST /participant/invite/:token/accept   # Validate the token and make Quiz assigned to avoid duplicate accept
```

### Examiner
```
POST   /examiner/pool                       # create question pool
PUT    /examiner/pool/:id                   # edit (pre-schedule only)
DELETE /examiner/pool/:id
POST   /examiner/pool/:id/questions
PUT    /examiner/quiz                       # create (draft)
PUT    /examiner/quiz/:id                   # edit (own, pre-schedule)
DELETE /examiner/quiz/:id                   # (own, pre-schedule)
POST   /examiner/quiz/:id/schedule
POST   /examiner/quiz/:id/invite-link
POST   /examiner/quiz/:id/assign            # bulk/individual by emp ID
GET    /examiner/quiz/:id/results
GET    /examiner/quiz/:id/results/:participantId   # answer-by-answer drilldown
POST   /examiner/result/:attemptId/retake-decision # Must Retake | Not Required
POST   /examiner/result/:attemptId/invalidate
GET    /examiner/quiz/:id/export            # streamed CSV/Excel, post-deadline
```

### Admin
```
GET /admin/results          # passed only, no drilldown
GET /admin/analytics/:quizId
```

### Shared
```
GET /health
```

---

## 8. Database Schema (PostgreSQL)

```sql
-- Identity
User(id UUID PK, empId TEXT UNIQUE, name TEXT, email TEXT, orgEmail TEXT,
     phone TEXT, designation TEXT, title TEXT, doj DATE, dob DATE,
     role TEXT CHECK (role IN ('PARTICIPANT','EXAMINER','ADMIN')),
     photoUrl TEXT, passwordHash TEXT, createdAt TIMESTAMPTZ)

-- Training content
Product(id UUID PK, name TEXT, description TEXT, videoUrl TEXT, createdBy UUID FK->User)
ParticipantProductAssignment(id UUID PK, userId UUID FK, productId UUID FK, status TEXT)
VideoProgress(id UUID PK, userId UUID FK, productId UUID FK, watchedSeconds INT, completedAt TIMESTAMPTZ)

-- Question bank
QuestionPool(id UUID PK, examinerId UUID FK, productId UUID FK, name TEXT, createdAt TIMESTAMPTZ)
Question(id UUID PK, poolId UUID FK, text TEXT, options JSONB, correctOptionId TEXT, marks INT)

-- Quiz
Quiz(id UUID PK, poolId UUID FK, examinerId UUID FK, title TEXT,
     type TEXT CHECK (type IN ('MANDATORY','UNDERSTANDING')),
     questionsPerAttempt INT, timePerQuestionSec INT, totalTimeLimitSec INT,
     passingCriteria INT NULL, maxAttempts INT DEFAULT 1,
     status TEXT CHECK (status IN ('DRAFT','SCHEDULED','ACTIVE','DEADLINE_PASSED')),
     deadline TIMESTAMPTZ NULL, createdAt TIMESTAMPTZ, version INT DEFAULT 1)

InviteLink(id UUID PK, quizId UUID FK, token TEXT UNIQUE, expiresAt TIMESTAMPTZ,
           maxUses INT, usedCount INT DEFAULT 0, createdBy UUID FK)

ParticipantQuizMapping(id UUID PK, userId UUID FK, quizId UUID FK,
                        UNIQUE(userId, quizId))

-- Attempts / results
Attempt(id UUID PK, userId UUID FK, quizId UUID FK, attemptNumber INT,
        selectedQuestionIds JSONB, questionOrder JSONB,
        startedAt TIMESTAMPTZ, submittedAt TIMESTAMPTZ,
        status TEXT CHECK (status IN ('IN_PROGRESS','SUBMITTED','TIMED_OUT','INVALIDATED')),
        UNIQUE(userId, quizId, attemptNumber))

AttemptAnswer(id UUID PK, attemptId UUID FK, questionId UUID FK,
              selectedOptionId TEXT, isCorrect BOOLEAN, answeredAt TIMESTAMPTZ)

Result(id UUID PK, attemptId UUID FK UNIQUE, score INT, maxScore INT,
       passed BOOLEAN NULL, retakeDecision TEXT NULL, invalidated BOOLEAN DEFAULT FALSE)

-- Badges
Badge(id UUID PK, code TEXT UNIQUE, name TEXT, description TEXT, iconUrl TEXT)
UserBadge(id UUID PK, userId UUID FK, badgeId UUID FK, attemptId UUID NULL, awardedAt TIMESTAMPTZ,
          UNIQUE(userId, badgeId))

-- Audit
AuditLog(id UUID PK, timestamp TIMESTAMPTZ, correlationId UUID, requestId UUID,
         userId UUID NULL, role TEXT, endpoint TEXT, method TEXT, statusCode INT,
         durationMs INT, severity TEXT)

-- Indexes
CREATE INDEX ON Attempt (userId, quizId);
CREATE INDEX ON Attempt (quizId);
CREATE INDEX ON AttemptAnswer (attemptId);
CREATE INDEX ON AuditLog (timestamp, userId, endpoint);
CREATE INDEX ON ParticipantQuizMapping (userId);
```

### 8.1 Redis key design

| Key | Type | TTL | Purpose |
|---|---|---|---|
| `pool:{poolId}` | hash/JSON | schedule deadline + 1h | cached question pool |
| `session:{attemptId}` | hash | quiz duration + 1h | live attempt state |
| `session:{attemptId}:q:{questionId}` | hash | same as above | per-question window |
| `session:{attemptId}:q:{questionId}:answered:{userId}` | string flag | same as above | idempotency guard |
| `session:{attemptId}:answers` | stream | same as above | append-only accepted answers |
| `idempotency:{key}` | string | 1h | duplicate submission guard (non-live endpoints) |
| `rate:{userId}:{route}` | counter | sliding window | rate limiting |

---

## 9. Test Cases

### 9.1 Unit
- Score calculator: correct/incorrect/unattempted combinations, zero-partial-credit rule
- Randomization: same seed → same 10 questions; different seed/attempt → different set; distribution uniformity across 50 questions over 1,000 simulated draws
- Badge trigger functions: each of the 10 badges fires exactly once, never re-awarded
- Idempotency guard: duplicate `ANSWER_SUBMITTED` for same question → second call returns `DUPLICATE`, no double score

### 9.2 Integration
- Full attempt lifecycle: start → N question events → submit → Result row created, Redis session cleared
- Late submission: answer arrives after `endsAt` → `TIMEOUT`, not scored
- Schedule lock: attempt to edit questions/marks on a `SCHEDULED` quiz → rejected with `QUIZ_ALREADY_SCHEDULED`
- Examiner visibility: E2 attempts to edit E1's draft quiz → `403 UNAUTHORIZED_RESOURCE_ACCESS`
- Retake flow: fail → Examiner marks "Must Retake" → participant gets a 4th... wait, capped at 3 total → 4th attempt rejected
- Invite link: expired token rejected; `maxUses` exhausted rejected
- Video gating: assessment start blocked until video-progress threshold met

### 9.3 Concurrency / Load
- 300 simulated participants submit answers to the same question within a 2-second window → zero duplicate `AttemptAnswer` rows, P95 answer-accept latency < 100ms
- 25 participants start the same live quiz simultaneously → each receives a distinct presentation order of their 10-question set
- Redis → Postgres flush worker: kill the worker mid-flush, restart, verify recovery job completes the write exactly once (no duplicate Attempt rows)

### 9.4 Failure/Recovery
- Redis outage mid-quiz → client buffers answers locally, resumes on reconnect within session-timeout window
- Postgres outage during flush → Redis session retained, flush retried with backoff, no data loss
- App backgrounded on mobile mid-quiz → resumes from Redis-held question state within session timeout; past session timeout → "deadline reached" message

### 9.5 Security
- SQLi/XSS payloads in question text, answer options, profile fields → rejected/escaped
- RBAC: Participant attempts `/examiner/*` routes → 403
- Rate limiting: exceed `quiz submit: 3/quiz` → 429
- JWT tampering (role claim modified) → rejected at middleware

### 9.6 Mobile-specific
- Video pause/resume across app background/foreground preserves watched-seconds
- Push notification delivery for assign / deadline-approaching / result-ready
- Offline answer queue flushes correctly on reconnect without exceeding the question's `endsAt`

---

## 10. UI Direction (screens)

**Platform:** Web (React + TypeScript) & Mobile (React Native)
---

## 1. Design System Foundation

### 1.1 Color Palette

**Primary Brand Colors:**
```
Navy (Deep Ink):        #12213A  — Primary text, headers, core UI elements
Amber (Warm Signal):    #F2A83B  — Primary actions, timers, accent only
Off-White (Surface):    #F7F5F1  — Primary background, card surfaces
Teal (Success Only):    #2E7D6B  — Pass/success state exclusively
Fail Red:               #E63946  — Failed/error state exclusively
```

**Supporting Colors:**
```
Text Dark:              #3a3a37  — Primary body text
Text Muted:             #8b8b87  — Secondary text, hints, labels
Border Light:           #e5e3df  — Hairline 0.5px borders, dividers
Background Gray:        #f0f0f0  — Subtle backgrounds, disabled states
Success Light:          #e8f5e9  — Passed pill background
Error Light:            #ffebee  — Failed pill background
Warning Light:          #fff3e0  — In-progress pill background
```

**Design Principle:**
- Navy is the structural base (authority, ops/field safety tone)
- Amber is the **single accent** (all primary actions, timers, emphasis)
- Teal is **reserved for success only** (never use for other states to avoid competing with amber)
- Red for errors/failures (standard, no competition)
- No color stacking or drop-shadow layering (minimal, clean aesthetic)

---

### 1.2 Typography

**Single Font Family:**
```
Primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif
Fallback: Inter, Söhne, or any modern grotesk sans-serif
NO serif display fonts — keep it grounded, ops-focused
```

**Font Weights & Sizes:**
```
Regular (400):          Body text, descriptions, secondary content
Medium (500):           Labels, small headings, emphasis within prose
Bold (600):             Headings, primary actions, strong emphasis

H1 (Page Title):        22px, weight 500, navy (#12213A), line-height 1.3
H2 (Section Title):     18px, weight 500, navy, line-height 1.3
H3 (Subsection):        16px, weight 500, navy, line-height 1.4
Body Large:             16px, weight 400, text-dark (#3a3a37), line-height 1.6
Body Regular:           14px, weight 400, text-dark, line-height 1.5
Body Small:             13px, weight 400, text-muted (#8b8b87), line-height 1.5
Label:                  12px, weight 500, text-muted, letter-spacing 0.3px (caps)
Caption:                11px, weight 400, text-muted, line-height 1.4

Score / Large Numeral:  52px, weight 600, navy — used for quiz scores, big metrics
Timer Numeral:          28px, weight 600, amber — countdown displays
Product Counter:        18px, weight 600, navy — "7 of 10" format
```

**Design Principle:**
- One sans family for everything (no switching between display/serif)
- Large, confident numerals for scores and timers (primary visual information)
- Weight hierarchy via size + weight combination, not stacking
- All caps labels use 0.3px letter-spacing for clarity

---

### 1.3 Spacing & Layout

**Spacing Scale:**
```
xs:         4px   — micro gaps between inline elements
sm:         8px   — tight spacing, gaps in lists
md:         12px  — standard spacing, padding in containers
lg:         16px  — generous spacing, card padding
xl:         20px  — spacious section spacing
xxl:        24px  — major section breaks, hero spacing
xxxl:       28px+ — full-page spacing
```

**Grid & Container:**
```
Mobile (default):       Single column, full-width with 16px edge padding
Tablet (600px+):        2 columns on product cards, dense layouts still 1-col
Desktop (1200px+):      3+ columns on product cards, full tables visible
Max Content Width:      1200px (examiner tables, admin dashboards)

Padding Standard:       16px (cards), 12px (compact), 20px (spacious)
Gap (flex/grid):        12px between items (tight), 16px (standard)
Border Radius:          4px (inputs/controls), 6px (buttons), 8px (cards), 12px (containers)
```

**Mobile-First Approach:**
- All layouts designed for 380px width first (small phone)
- Scale up: 600px (tablet), 1200px (desktop), 1920px (ultra-wide)
- Touch targets: min 44×44px (all buttons, tappable elements)
- Vertical rhythm: spacing consistent, readability on small screens

---

## 2. Component Library

### 2.1 Buttons

**Primary Button (Amber Accent)**
```
Background:     #F2A83B (amber)
Text:           #12213A (navy), weight 500, 14px
Padding:        12px 16px (44px min height including padding)
Border Radius:  6px
Border:         None
Hover:          Background #e6931f (darker amber)
Active:         Background #d68417 (even darker)
Disabled:       Background #d0d0d0 (gray), text #888888, cursor not-allowed
State Indicator: None (no icon, pure text/action)
```

**Secondary Button (White)**
```
Background:     #ffffff (white)
Text:           #12213A (navy), weight 500, 14px
Border:         0.5px solid #e5e3df (light border)
Padding:        12px 16px
Border Radius:  6px
Hover:          Border #F2A83B (amber), background #fffbf5 (off-white tint)
Active:         Border #d68417, background #fff3e0
Disabled:       Background #f0f0f0, text #8b8b87, border #e5e3df
```

**Danger Button (Red)**
```
Background:     #E63946 (red)
Text:           #ffffff (white), weight 600, 14px
Padding:        12px 16px
Border Radius:  6px
Hover:          Background #d62828 (darker red)
Active:         Background #c41622
Disabled:       Background #d0d0d0, cursor not-allowed
Warning:        Used only for destructive actions (delete, invalidate)
```

**Icon Button (Compact)**
```
Width / Height: 24px (for inline), 32px (for toolbars)
Background:     Transparent or #f0f0f0 (hover)
Icon:           Navy (#12213A), 16px
Border:         0.5px solid #e5e3df on hover
Padding:        4px (centers 16px icon in 24px button)
Border Radius:  4px
Transition:     150ms ease on border-color, background
Use Case:       Edit (✏️), Delete (🗑️), View (👁️), More (⋯)
```

**Link Button (Text)**
```
Text:           #12213A (navy), weight 500, 14px
Decoration:     None (no underline)
Hover:          #F2A83B (amber)
Active:         #12213A
Padding:        0 (no padding, text-only)
Use Case:       Navigation, inline actions, secondary CTA
```

**Button Group (Related Actions)**
```
Layout:         Horizontal flex, gap 8px
Behavior:       All buttons same height (44px min)
Primary Button: Always rightmost or leftmost (depends on flow)
Example:        [Cancel]  [Save] or [Save]  [Cancel]
```

---

### 2.2 Form Inputs

**Text Input / Text Area**
```
Background:     #ffffff (white)
Border:         0.5px solid #e5e3df (light)
Text:           #3a3a37 (text-dark), 14px
Placeholder:    #8b8b87 (text-muted), 14px, 60% opacity
Padding:        12px 16px (36px min height for single-line)
Border Radius:  6px
Focus:          Border 1px solid #F2A83B (amber), shadow 0 0 0 2px rgba(242, 168, 59, 0.1)
Disabled:       Background #f0f0f0, text #8b8b87, border #e5e3df
Error:          Border 1px solid #E63946 (red)
```

**Select Dropdown**
```
Background:     #ffffff
Border:         0.5px solid #e5e3df
Text:           #3a3a37, 14px
Padding:        10px 12px
Border Radius:  6px
Icon:           Navy dropdown arrow, 16px, right-aligned
Focus:          Border amber, shadow (same as text input)
Disabled:       Background #f0f0f0, opacity 0.6
Height:         36px (compact)
```

**Checkbox / Radio**
```
Size:           16×16px (checkbox), 20px diameter (radio)
Border:         1px solid #e5e3df
Background:     White (unchecked), #F2A83B (checked)
Icon:           Navy checkmark (checkbox), white dot (radio)
Padding:        4px around control
Focus:          Outline 2px solid #F2A83B with 2px gap
Disabled:       Opacity 0.5, cursor not-allowed
Label:          14px, gray, 8px left of control
```

**Toggle Switch**
```
Width:          48px, Height: 24px
Background:     #d0d0d0 (off), #2E7D6B (on, teal)
Circle:         8px diameter, white, 2px padding inside
Border Radius:  12px (pill shape)
Animation:      300ms ease when toggling
Disabled:       Opacity 0.5, cursor not-allowed
```

**Date Picker**
```
Display:        Text input + calendar icon
Format:         dd-mm-yyyy
Picker Modal:   Inline calendar below input
Selected Date:  Background #F2A83B (amber), text navy
Today Marker:   Circle border (amber) around current date
Transition:     Fade in 150ms when opened
```

---

### 2.3 Status Pills & Badges

**Status Pill (Inline)**
```
Passed:
  Background:   #e8f5e9 (light teal)
  Text:         #2E7D6B (teal), weight 500, 12px
  Padding:      4px 8px
  Border Radius: 4px (rectangle, not pill-shaped)

Failed:
  Background:   #ffebee (light red)
  Text:         #E63946 (red), weight 500, 12px
  Padding:      4px 8px
  Border Radius: 4px

In Progress:
  Background:   #fff3e0 (light amber/orange)
  Text:         #e65100 (dark orange), weight 500, 12px
  Padding:      4px 8px
  Border Radius: 4px

Not Started:
  Background:   #f0f0f0 (light gray)
  Text:         #8b8b87 (muted), weight 500, 12px
  Padding:      4px 8px
  Border Radius: 4px

Retake Required:
  Background:   #ffebee (light red)
  Text:         #E63946 (red), weight 500, 12px
  Padding:      4px 8px
  Border Radius: 4px

Design Principle: Plain rectangles, NOT pill-shaped (12213A design = ops/field safety, not playful)
```

**Badge (Achievement / Award)**
```
Icon:           Emoji or SVG (28px)
Label:          12px, navy, weight 500, centered
Earned:         Full opacity (1.0), navy text
Locked:         Opacity 0.4, muted text
Container:      8px padding, 8px border-radius, background #f9f9f9 on hover
Layout:         3-column grid on mobile, flexible on desktop
Tooltip:        On hover, show "Earned: [date]" or "[locked condition]"
```

---

### 2.4 Cards & Containers

**Product Card (Participant Landing)**
```
Background:     #ffffff (white)
Border:         0.5px solid #e5e3df
Border Radius:  12px
Shadow:         None (no stacking drops shadows)
Padding:        0 (content padding handled inside)
Overflow:       hidden (rounded corners)

Structure:
  Thumbnail:    Aspect ratio 4:3, background navy gradient (placeholder)
  Content:      16px padding all sides
  Title:        16px, navy, weight 500, margin-bottom 8px
  Subtitle:     13px, text-muted, margin-bottom 8px
  Status:       Status pill (see 2.3)
  Progress:     2px bar, 100% width, 2px height, amber fill
  
Hover State:    Border #F2A83B (amber), subtle shadow 0 2px 8px rgba(18, 33, 58, 0.08)
Responsive:     2 columns on mobile, 3+ on desktop
```

**Result / Score Card**
```
Background:     #ffffff
Border:         0.5px solid #e5e3df
Border Radius:  12px
Padding:        24px 16px (spacious)
Text Align:     Center

Layout:
  Label:        12px, text-muted, uppercase, margin-bottom 8px
  Score:        52px, navy, weight 600, line-height 1.0, margin-bottom 16px
  Max:          14px, text-muted, margin-bottom 16px
  Badge:        Status pill (see 2.3)
  
Purpose:        Prominent score display (always first on results screen)
```

**Breakdown Table Card**
```
Background:     #ffffff
Border:         0.5px solid #e5e3df
Border Radius:  12px
Padding:        16px

Header:
  Title:        13px, text-muted, uppercase, letter-spacing 0.3px, margin-bottom 12px
  Divider:      0.5px light border below title

Rows:
  Each Row:     Flex (space-between), padding 8px 0
  Label:        13px, text-muted, left-aligned
  Value:        13px, navy, weight 500, right-aligned
  Divider:      0.5px border between rows (last row: no border)

Purpose:        Performance breakdown, participation summary
```

**Data Table Container**
```
Background:     #ffffff
Border:         0.5px solid #e5e3df
Border Radius:  8px
Overflow:       Hidden (rounded corners)
Shadow:         None

Table Structure:
  Header:       Background #f5f5f3 (slightly darker off-white)
  Cells:        Padding 10px 12px
  Row Dividers: 0.5px border between rows
  Hover:        Row background tints to #fafaf8 on hover
  
Responsive:     Horizontal scroll on mobile (table width > viewport)
               Full visible on desktop (1200px+)
```

---

### 2.5 Typography & Text Elements

**Page Heading**
```
Size:           22px
Weight:         500 (medium)
Color:          #12213A (navy)
Line Height:    1.3
Margin Bottom:  4px (tight)
Example:        "Your training dashboard"
```

**Page Subheading**
```
Size:           14px
Weight:         400
Color:          #8b8b87 (text-muted)
Line Height:    1.5
Margin Bottom:  24px (spacious)
Example:        "3 products require certification"
```

**Section Title**
```
Size:           18px
Weight:         500
Color:          #12213A
Line Height:    1.3
Margin Bottom:  16px
Margin Top:     24px (if not first)
Example:        "Active" (on product grid) or "Performance breakdown"
```

**Label (Form, Table Header)**
```
Size:           12px or 11px (smaller in tables)
Weight:         500
Color:          #8b8b87 (text-muted)
Text Transform: uppercase (for headers)
Letter Spacing: 0.3px (for headers)
Example:        "QUIZ SETTINGS" or "Status"
```

**Hint / Help Text**
```
Size:           13px
Weight:         400
Color:          #8b8b87
Font Style:     normal (not italic)
Line Height:    1.5
Example:        "Watch 90% to unlock the assessment"
```

**Error Message**
```
Size:           13px
Weight:         400
Color:          #E63946 (red)
Icon:           ⚠️ (optional, prepended)
Example:        "⚠️ This quiz has ended"
```

**Success Message**
```
Size:           13px
Weight:         400
Color:          #2E7D6B (teal)
Icon:           ✓ (optional, prepended)
Example:        "✓ Retake decision recorded"
```

---

### 2.6 Borders & Dividers

**Hairline Border (Most Common)**
```
Width:          0.5px
Color:          #e5e3df (light gray-brown)
Usage:          Card edges, input borders, table dividers
Opacity:        100% (not semi-transparent)
```

**Section Divider**
```
Width:          0.5px
Color:          #e5e3df
Height:         100% (for vertical) or 100% (for horizontal)
Margin:         12px 0 (above/below sections)
```

**Accent Border (Focus State)**
```
Width:          1px or 2px
Color:          #F2A83B (amber)
Usage:          Focused inputs, selected options, primary emphasis
Transition:     150ms ease when entering/leaving focus
```

---

### 2.7 Shadows & Depth

**No Drop-Shadow Stacking (Design Principle)**
```
Default State:  No shadow (clean, flat)
Hover State:    Subtle shadow only
  Shadow:       0 2px 8px rgba(18, 33, 58, 0.08) — cards, buttons
  Transition:   150ms ease on shadow
Elevated/Modal: Shadow 0 4px 16px rgba(18, 33, 58, 0.12)
Focus State:    Outline shadow (see input focus in 2.2)
```

---

## 3. Screen Templates by Role

### 3.1 PARTICIPANT (Employee / Trainee)

#### Screen: Landing Dashboard (Product Grid)

**URL:** `/training` (after login, redirect based on role)

**Header Layout:**
```
┌────────────────────────────────────────────────────────────────┐
│ Logo/Brand            [Training] [Examiner] [Admin]  User > Log │
└────────────────────────────────────────────────────────────────┘
```
- Top nav: CertifyOps logo left, role-based tabs center (Training, Examiner, Admin), user menu right
- Role tabs only show if user has multiple roles; else hidden
- Background: navy (#12213A), text/icons: white
- Height: 48px, padding 12px horizontal

**Page Content:**
```
Heading:        "Your training"
Subheading:     "6 of 6 products require certification"
Status Tabs:    [Active (6)] [Completed (0)]

Product Grid:
  - 2 columns on mobile (380px), 3 on tablet (600px), 4 on desktop (1200px+)
  - Card: 160px width (mobile), 200px+ (desktop)
  - Spacing: 12px gap
  - Each card: thumbnail (4:3 aspect) + title + subtitle + status pill + progress bar
  
Empty State:    "No completed products yet." (shown in Completed tab if none)
```

**Mobile Behavior:**
- Full-width cards with equal spacing
- Single column until 600px breakpoint
- Touch targets: 44px min (card touchable)

**Navigation:**
- Click product card → navigate to video player screen
- From top nav tabs: switch between Training/Examiner/Admin (if user has role)

---

#### Screen: Video Player

**URL:** `/training/products/:productId/video`

**Header:**
```
⬅ Back             [Product title]                   
```
- Minimal chrome (back button only)
- Background: navy (#12213A)
- Height: 44px

**Video Container:**
```
Full-Bleed Player (video or placeholder)
  - Background: navy gradient (placeholder)
  - Aspect Ratio: 16:9
  - Responsive: 100% width, height auto

Progress Ring (Centered, Amber):
  - Size: 120px diameter
  - Percentage: 80% watched
  - Ring Style: Amber stroke on semi-transparent background
  - Text Inside: "80% watched" (large), "16:45 / 21:00" (small)

Play Overlay:
  - Position: bottom-center, semi-transparent black background
  - Button: Amber, circular, size 40px
  - Label: "Resume playback"
```

**Video Metadata (Below Player):**
```
Title:          "Eco Plaster Safety Protocols" (18px, navy, bold)
Description:    "Learn the essential safety procedures..." (14px, text-dark)
Info Box:       "ℹ️ Watch 90% to unlock the assessment" (12px, amber background pill)
Button:         "Start assessment" (primary amber, full-width, 44px)
  - Disabled if video progress < 90%
  - Enabled at 90%+
```

**Mobile Behavior:**
- Full-bleed video on small screens
- Progress ring scales: 100px on mobile, 120px on tablet
- Metadata stacks vertically
- Video controls auto-hide after 3 seconds (standard player pattern)

---

#### Screen: Live Quiz Question

**URL:** `/training/quiz/:quizId/attempt/:attemptId/live`

**Header:**
```
┌────────────────────────────────────────────────────────────────┐
│ [Quiz Title]                              [7 of 10]            │
└────────────────────────────────────────────────────────────────┘
```
- Navy background, white text
- Left: Quiz title (16px), Right: question counter (13px, muted)
- Height: 44px, padding 12px 16px

**Question Content Area:**
```
Question Number:    "Question 7" (12px, text-muted, uppercase)
Question Text:      "Which of the following is the primary safety concern..." 
                    (18px, navy, bold, margin-bottom 24px)

Options List:       Flex column, gap 10px
  Each Option:
    - Full width
    - Padding: 14px 16px
    - Background: white (unselected), #fffbf5 (selected)
    - Border: 1px light (unselected), 2px amber (selected)
    - Border Radius: 6px
    - Label Circle: 24px diameter, navy border (unselected), amber fill + white text (selected)
    - Text: 14px, navy/gray, left-aligned

Timer Ring:         Centered below options, 100px diameter
  - Amber stroke, fills counter-clockwise
  - Text: "15" (large, 28px amber), "seconds" (12px gray) below
  - Position: absolute center

Submit Button:      Full-width, amber, 44px, margin-top 16px
  - Text: "Submit answer" (14px, navy, bold)
  - Disabled if no option selected (gray)

Warning Text:       "⚠️ 5 seconds remaining" (11px, red, center-aligned)
  - Only shown when <= 5 seconds left
```

**Mobile Behavior:**
- Single column, no sideways scrolling
- Timer ring: 100px on mobile, 120px on tablet
- Options stack vertically, full-width
- Touch targets: 44px min (each option, button)

**Responsive:**
- Mobile (380px): single column, timer below options
- Tablet (600px+): same layout, slightly larger text/elements
- Desktop (1200px+): centered content column, max-width 600px

---

#### Screen: Results + Badges

**URL:** `/training/quiz/:quizId/attempt/:attemptId/results`

**Available:** Post-deadline only

**Page Layout:**
```
⬅ Back            [Quiz Title] - Results

Score Section (Card):
  Label:          "Your score" (12px, muted, uppercase)
  Score:          "78" (52px, navy, bold)
  Max:            "out of 100 points" (14px, gray)
  Status:         "PASSED ✓" (teal pill) or "FAILED" (red pill)

Breakdown Card:
  Title:          "Performance breakdown" (13px, muted, uppercase)
  Rows:
    - Correct answers:        8 of 10
    - Time taken:             4:32
    - Passing criteria:       ≥ 70 points
    - Attempt:                1 of 3

Badges Card:
  Title:          "Badges earned this session" (13px, muted, uppercase)
  Grid:           3 columns on mobile, flexible on desktop
  Each Badge:     Icon (28px emoji) + label (11px)
    - Earned: full opacity, navy text
    - Locked: opacity 0.4, muted text

Action Buttons:
  Primary:        "Review your answers" (amber button, full-width)
  Secondary:      "Back to dashboard" (white button, full-width)
```

**Mobile Behavior:**
- Full-width cards, stacked vertically
- Score card first (visual hero)
- Badges grid wraps on small screens

---

### 3.2 EXAMINER (Quiz Creator & Manager)

#### Screen: Quiz Management Dashboard

**URL:** `/examiner` (role-based landing)

**Header:**
```
┌────────────────────────────────────────────────────────────────┐
│ Logo/Brand       [Quizzes] [Scheduled] [Question pools]  > ☰   │
│                                                     [+ New quiz] │
└────────────────────────────────────────────────────────────────┘
```
- Tabs: Quizzes (default), Scheduled, Question pools
- Action button: "+ New quiz" (amber, top-right)

**Quizzes Tab Content:**
```
Filters (Row):
  [Status ▼: All]  [Type ▼: All]  [Search...]

Quiz List (Table or Dense Cards):
  Columns:
    - Quiz Title (16px, navy, bold, clickable)
    - Type (Understanding/Mandatory)
    - Status (Draft/Scheduled/Active/Deadline Passed)
    - Created Date
    - Actions (small icons: view, results, edit, delete)

Per Quiz Row:
  - Hover: light background tint
  - Draft: [✏️ Edit] [🗑️ Delete] [📅 Schedule]
  - Scheduled+: [👁️ View] [📊 Results] [🔗 Invite Link] [⋯ More]

Summary Bar (Below table):
  "5 quizzes total  |  3 scheduled  |  2 draft"
```

**Mobile Behavior:**
- Filters stack vertically on mobile
- Table scrolls horizontally (actions always visible)
- Dense layout (compact padding, tighter text)

---

#### Screen: Create / Edit Quiz

**URL:** `/examiner/quiz/new` or `/examiner/quiz/:quizId/edit`

**Header:**
```
⬅ Back              Create New Quiz             [Draft auto-saving indicator]
```

**Form Sections (Stacked Vertically):**

**Quiz Information:**
```
Title:              [Text input, required]
Description:        [Text area, optional]
Type:               ◉ Mandatory  ○ Understanding (radio buttons)
Question Pool:      [Select pool dropdown] or [Create new pool link]
```

**Quiz Settings:**
```
Questions per attempt:      [Number input] (of X total in pool)
Time per question:          [Number input] seconds
Total time limit:           [Number input] minutes (optional)

(Conditional: if Mandatory)
Passing Criteria:           [Number input] points
Max Attempts:               [Number input] (default: 3, max: 3)
```

**Actions:**
```
Primary:   [Schedule quiz] (amber button, full-width)
Secondary: [Save as draft] (white button, full-width)
```

**Mobile Behavior:**
- Full-width inputs (100% container width)
- Labels above inputs
- Number inputs with +/- spinners (mobile-friendly)
- Form sections separated by light border dividers

---

#### Screen: Question Pool Management

**URL:** `/examiner/question-pools/:poolId`

**Header:**
```
⬅ Back          [Pool Name]                [+ Add question]
                Pool: 50 questions          [🗑️ Delete pool]
```

**Question List (Dense Table):**
```
Columns:
  # (sequence)
  Question Text (truncated, clickable)
  Marks Assigned
  Type (MCQ)
  Actions ([✏️ Edit] [🗑️ Delete])

Each Question Row:
  - 44px height (min)
  - Hover: light background tint, border-left amber accent
  - Click: expand to show options or edit inline

Search / Filter:
  [Search questions...]  [Filter by marks ▼]
```

**Add Question Modal (Overlay):**
```
Title:              "Add question"
Question Text:      [Text area]
Options:            4 fields (A, B, C, D)
  - Each labeled with letter circle
  - Correct answer: radio button selector
Marks:              [Number input]
Buttons:            [Cancel] [Add question]
```

**Mobile Behavior:**
- Question text truncates on mobile (full text on tap to expand)
- Actions collapse into dropdown menu (⋯) on mobile
- Modal takes full screen (overlay)

---

#### Screen: Results Drilldown (Per Participant)

**URL:** `/examiner/quiz/:quizId/results/:participantId`

**Header:**
```
⬅ Back              [Quiz Name] - [Participant Name]
```

**Participant Card:**
```
Name:               "Aravind Kumar (emp_12345)"
Email:              "aravind@company.com"
Score:              85/100  |  Status: PASSED ✓  |  Attempt: 1 of 3
Time:               4:32  |  Submitted: Apr 1, 14:30
```

**Retake Decision Section:**
```
Options:            ○ Not marked yet
                    ○ Must retake (send notification)
                    ○ Retake not required

Feedback:           [Text area, optional]
Button:             [Save decision] (primary amber)
```

**Per-Question Breakdown:**
```
Q1: [Question text]
    Your answer:    B
    Correctness:    ✓ Correct  (+5 points)
    Expected:       B

Q2: [Question text]
    Your answer:    A
    Correctness:    ✗ Wrong  (0 points)
    Expected:       C
    
... (per each question)
```

**Action Buttons:**
```
[Mark for retake] [Invalidate result] [Back to results]
```

**Mobile Behavior:**
- Full-width question cards, stacked
- Answer options visible inline
- Participant card is sticky header (stays visible when scrolling)

---

#### Screen: Results Export / Analytics

**URL:** `/examiner/quiz/:quizId/results`

**Header:**
```
⬅ Back              [Quiz Name] - Results     [Export CSV] [Export Excel]
```

**Summary Stats (Cards):**
```
Card Layout:        4 cards (responsive: 2 on mobile, 4 on desktop)
Total Attempts:     24
Passed:             18 (75%)
Failed:             6 (25%)
Avg Score:          81
```

**Filters:**
```
[Status ▼: All]  [Attempt ▼: All]  [Search...]
```

**Results Table:**
```
Columns:
  Participant Name (clickable → drilldown)
  Score (right-aligned, bold)
  Status (pill: Passed/Failed/Pending)
  Attempt (e.g., "1 of 3")
  Time Taken (seconds)
  Actions (icons: view, mark retake, invalidate)

Per Row:
  - Hover: light background
  - Status pills use semantic colors (teal/red/gray)
  - Actions visible as icons with tooltips
```

**Mobile Behavior:**
- Table horizontal-scrolls on mobile
- Columns collapse on small screens (hide Time, show Actions in menu)
- Results still dense and queryable

---

### 3.3 ADMIN (Organization-Level Overview)

#### Screen: Results Dashboard (Passed Participants Only)

**URL:** `/admin/results`

**Header:**
```
┌────────────────────────────────────────────────────────────────┐
│ Logo/Brand         [Overview] [Products] [People]         ☰    │
└────────────────────────────────────────────────────────────────┘
```

**Filters:**
```
[Quiz ▼: All]  [Pass Rate ▼: All]
```

**Results Table (Read-Only):**
```
Columns:
  Quiz Title
  Participant Name
  Score
  Attempt

Rows:
  - White background (no hover state)
  - No clickable actions (read-only interface)
  - Sorted by quiz, then participant
  
No Export:          Admin cannot export results (restricted)
```

**Warning Banner:**
```
"This view shows passed participants only. For detailed reporting,
contact Examiners or access the Examiner dashboard."
(12px, info pill styling)
```

**Mobile Behavior:**
- Table scrolls horizontally on mobile
- Columns: Quiz | Participant | Score (always visible)
- Read-only, minimal interactions

---

#### Screen: Analytics Dashboard (Per Quiz)

**URL:** `/admin/analytics/:quizId`

**Header:**
```
⬅ Back              [Quiz Name] - Analytics     [Refresh]
```

**Summary Stats:**
```
Cards (3-4 on desktop, stack on mobile):
  Total Participants:   24
  Pass Rate:            75%
  Average Score:        81
  Passing Criteria:     ≥ 70 points
```

**Score Distribution Chart:**
```
Type:               Histogram (bar chart)
X-Axis:             Score ranges (50-59, 60-69, 70-79, 80-89, 90-99)
Y-Axis:             Count
Bars:               Navy, amber threshold line at passing criteria
Hover:              Show count tooltip
```

**Per-Question Performance:**
```
Table (if chart visible):
  Q1: 92% correct
  Q2: 85% correct
  Q3: 79% correct
  ... (sorted by difficulty)
  
Sorted:             Easiest to hardest (highest % to lowest)
```

**Insights (Text):**
```
✓ Overall strong performance (75% pass rate)
⚠️ Q5 has lowest accuracy (68%) — consider review
⚠️ 6 participants scored <65 — recommend retrain
```

**Mobile Behavior:**
- Charts stack vertically
- Histogram shorter on mobile (half-height)
- Text insights adapt to screen width

---

#### Screen: Organizational Training Progress

**URL:** `/admin/compliance`

**Header:**
```
Organization: [Acme Corp]  |  Period: [Q1 2024 ▼]
```

**Overall Progress:**
```
Summary:
  Total Employees: 500
  Completed All Required: 320 (64%)
  In Progress: 120 (24%)
  Not Started: 60 (12%)

Progress Bar:
  Background: light gray
  Fill: navy 64%, amber 24%, gray remainder
  Height: 8px, border-radius: 4px
  Label: "64% complete"
```

**Product Certification Status:**
```
Rows (one per product):
  Product Name
  Certification %: [████████░░ 80%]
  
Progress bars:
  Background: light gray
  Fill: navy (teal for success)
  Height: 4px
  
Example:
  Eco Plaster Safety     ████████░░ 80% certified
  PPE Protocols          ███████░░░ 70% certified
  Compliance 2024        ██████░░░░ 60% certified
```

**Top Performers:**
```
List (text):
  • Aravind Kumar (8 badges)
  • Maya Patel (7 badges)
  • Priya Desai (6 badges)
```

**At Risk (Behind Schedule):**
```
List (text):
  • Senthil Raj (0/6 completed)
  • Ravi Kumar (1/6 completed)
  • 18 others (1-2/6 completed)
```

**Export:**
```
Buttons: [Export PDF] [Export CSV]
```

**Mobile Behavior:**
- Full-width progress bars
- Lists wrap naturally
- Summary text stacks
- Buttons full-width

---

## 4. Navigation Architecture

### 4.1 Top Navigation (Primary)

**All Roles:**
```
┌────────────────────────────────────────────────────────────────┐
│ [Logo]  [Role-Based Tabs]              [User Menu] [Hamburger] │
└────────────────────────────────────────────────────────────────┘

Participant:
  Logo → /training
  Tabs: Training | (Examiner) | (Admin)  [only if user has roles]
  User Menu: My Profile | Settings | Help | Log out

Examiner:
  Logo → /examiner
  Tabs: Quizzes | Scheduled | Question Pools | (Training) | (Admin)
  User Menu: My Profile | Settings | Help | Log out

Admin:
  Logo → /admin
  Tabs: Overview | Products | People | (Training) | (Examiner)
  User Menu: My Profile | Settings | Help | Log out
```

**Design:**
- Background: navy (#12213A)
- Text/Icons: white
- Height: 48px
- Logo: 32px max, white
- Tabs: 14px, weight 500, padding 12px 16px each
- Active tab: navy background, amber underline (2px)
- User Menu: dropdown on click, navy background with white text

**Mobile (< 600px):**
```
┌──────────────────────────────┐
│ [Logo]  [Hamburger ☰]        │
└──────────────────────────────┘

Hamburger opens vertical menu:
  - Role tabs (Training, Examiner, Admin)
  - User profile
  - Settings
  - Help
  - Log out
```

---

### 4.2 Breadcrumb Navigation (Optional, Secondary)

**Used on:**
- Quiz edit/view pages
- Question pool pages
- Results drilldown

**Format:**
```
⬅ Back  /  Current Page Title
(left-aligned, below top nav)
```

**Mobile:**
- Back button only (arrow icon + text "Back")
- Breadcrumb hidden on mobile to save space

---

### 4.3 Role-Based Access Control

**Conditional Rendering:**
```
Participant sees:     /training, /quiz/*, badges, profile
                      Hidden: /examiner, /admin

Examiner sees:        /examiner, /quiz/*, /results/*, /pools/*
                      Hidden: /admin
                      Visible (if multi-role): /training link in tabs

Admin sees:           /admin, /results, /analytics, /compliance
                      Visible (if multi-role): /training, /examiner links in tabs
                      Hidden drill-down actions

Multi-Role User:      All tabs visible, click to switch roles
                      Role persists until explicitly switched
```

---

## 5. Responsive Design Breakpoints

### 5.1 Mobile-First Cascade

```
Default (Mobile):       380px width
Tablet:                 600px+
Desktop:                1200px+
Ultra-Wide:             1920px+

Product Grid:
  Mobile (380px):       2 columns
  Tablet (600px):       2-3 columns
  Desktop (1200px):     3-4 columns
  Ultra (1920px):       4-5 columns

Tables:
  Mobile:               Horizontal scroll (actions in dropdown)
  Desktop:              Full visible, all columns shown

Modals:
  Mobile:               Full-screen overlay, 100% width
  Desktop:              Centered container, max-width 600px, 8px margin

Forms:
  Mobile:               Single column, full-width inputs
  Desktop:              2-column grid (if form is long), max 600px width
```

---

## 6. Accessibility & Inclusivity

### 6.1 Color Contrast

```
Text on Background:     WCAG AA minimum 4.5:1 ratio
  Navy text on white:   21:1 ✓
  Navy text on off-white: 19:1 ✓
  Gray text on white:   7:1 ✓
  
Amber accent on white:  5.2:1 ✓
Teal on white:          5.8:1 ✓
Red on white:           5.1:1 ✓
```

### 6.2 Touch Targets

```
Minimum:                44×44px (buttons, tappable elements)
Links in text:          44px height (vertical), 12px min width
Spacing between:        8px gap between adjacent touch targets
```

### 6.3 Keyboard Navigation

```
Tab Order:              Left-to-right, top-to-bottom
Focus Visible:          Outline 2px solid #F2A83B with 2px gap
Skip Links:             "Skip to main content" (hidden until focused)
Modals:                 Trap focus inside modal, restore on close
```

### 6.4 Screen Reader Support

```
Form Labels:            <label> elements with <input>
ARIA Labels:            aria-label on icon buttons
ARIA Live:              aria-live="polite" on notifications
Image Alt Text:         All product images + badge icons have alt text
```

---

## 7. Animation & Transitions

### 7.1 Motion Principles

```
Default Duration:       150ms (short, snappy)
Longer Transitions:     300ms (modal opens, page transitions)
Easing:                 cubic-bezier(0.4, 0, 0.2, 1) — ease-in-out
```

### 7.2 Specific Animations

```
Button Hover:           Border/shadow change 150ms ease
Input Focus:            Border color + shadow 150ms ease
Modal Open:             Fade in 300ms, slide down 300ms
Dropdown Open:          Fade in 150ms, scale 0.95 → 1.0
Tab Switch:             Fade content out 150ms, fade in 150ms
Progress Bar Fill:      Smooth transition on stroke-dashoffset 300ms
Timer Countdown:        No animation (discrete number updates)
```

### 7.3 Disable Animations (Accessibility)

```
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. Dark Mode (Future Consideration)

**Not currently implemented, but design system supports:**

```
If implementing dark mode in future:

Base Colors:
  Dark Navy:            #0d1117 (instead of #12213A)
  Amber:                #F2A83B (no change, high contrast)
  Off-White → Off-Gray: #1c1c1b (surfaces)
  Text Light:           #e0e0de (instead of #3a3a37)
  Text Muted:           #8b8b87 (lighter, but similar)
  
Border Light:           #3a3a37 (instead of #e5e3df)
Teal:                   #4fa89e (slightly lighter for dark)
Red:                    #ff5757 (slightly brighter for dark)
```

---

## 9. Implementation Checklist

### Component Library (React/TypeScript)

```
✓ Button (variants: primary, secondary, danger, text, icon)
✓ Input (text, textarea, number, email, password, search)
✓ Select (dropdown with options)
✓ Checkbox / Radio
✓ Toggle Switch
✓ StatusPill (passed, failed, in-progress, not-started, retake)
✓ Badge (earned, locked)
✓ Card (product, result, breakdown, data table)
✓ Table (dense, scrollable, sortable)
✓ Modal / Dialog
✓ Toast / Notification (success, error, warning, info)
✓ Breadcrumb
✓ Tabs (role-based)
✓ ProgressBar (linear and circular)
✓ Spinner / Loading
✓ Empty State
✓ Error Boundary
✓ Tooltip
✓ Avatar (for participants)
✓ DatePicker
✓ TimerRing (circular countdown)
```

### Pages / Screens

**Participant:**
```
✓ Login
✓ Landing (product grid)
✓ Video Player
✓ Live Quiz
✓ Results + Badges
✓ Profile / History
```

**Examiner:**
```
✓ Login
✓ Dashboard (quiz management)
✓ Create / Edit Quiz
✓ Question Pool
✓ Results Drilldown
✓ Export / Analytics
```

**Admin:**
```
✓ Login
✓ Results Dashboard
✓ Analytics
✓ Compliance
```

---

## 10. QA & Testing

### Visual Regression Testing

```
Tool:               Percy CI or similar
Baseline:           All 15+ screens on mobile, tablet, desktop
Update:             When design intentionally changes
Report:             Visual diffs on every PR
```

### Accessibility Audit

```
Tool:               axe DevTools, Lighthouse
Standards:          WCAG 2.1 AA
Tests:
  ✓ Color contrast (all text, backgrounds)
  ✓ Keyboard navigation (all pages)
  ✓ Screen reader (form labels, images, landmarks)
  ✓ Focus visible (all interactive elements)
  ✓ Touch target size (44×44px min)
```

### Cross-Browser Testing

```
Browsers:           Chrome, Firefox, Safari, Edge
Mobile:             iOS Safari, Chrome Android
Versions:           Latest 2 major versions + 1 previous
Orientation:        Portrait + Landscape (mobile)
```

---

## 11. Design Tokens (CSS Variables)

```css
:root {
  /* Colors */
  --color-navy: #12213A;
  --color-amber: #F2A83B;
  --color-off-white: #F7F5F1;
  --color-teal: #2E7D6B;
  --color-fail-red: #E63946;
  --color-text-dark: #3a3a37;
  --color-text-muted: #8b8b87;
  --color-border-light: #e5e3df;
  
  /* Typography */
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-bold: 600;
  
  --font-size-h1: 22px;
  --font-size-h2: 18px;
  --font-size-body: 14px;
  --font-size-label: 12px;
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 20px;
  
  /* Borders */
  --border-light: 0.5px solid var(--color-border-light);
  --border-radius-sm: 4px;
  --border-radius-md: 6px;
  --border-radius-lg: 8px;
  --border-radius-xl: 12px;
  
  /* Shadows */
  --shadow-sm: 0 2px 8px rgba(18, 33, 58, 0.08);
  --shadow-md: 0 4px 16px rgba(18, 33, 58, 0.12);
  
  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 300ms ease;
}
```

---

## 12. Figma / Design Tool Setup

### Figma Library Structure

```
Workspace:          Training & Assessment Platform
Main Files:
  - Design System (colors, typography, spacing tokens)
  - Components (all reusable components)
  - Participant Flows (landing, video, quiz, results)
  - Examiner Flows (dashboard, edit, results)
  - Admin Flows (overview, analytics)
  - Mobile Screens (all screens at 380px viewport)
  - Tablet Screens (600px viewport)
  - Desktop Screens (1200px viewport)

Shared Libraries:
  - Brand Guidelines (logo, spacing, colors)
  - Icon System (if using custom icons)
```

---

## 13. Development Guidelines

### CSS / Styling Approach

```
Framework:          Tailwind CSS (preferred) or CSS Modules
Color Utilities:    Use design tokens via CSS variables
Breakpoints:        sm: 600px, md: 1200px, lg: 1920px
Component Scoping:  CSS Modules or Styled Components (BEM for class names)
```

### React Component Patterns

```
Component Structure:
  import Button from '@/components/Button'
  
  <Button variant="primary" size="medium" disabled={false}>
    Save changes
  </Button>

Prop Types:
  variant: 'primary' | 'secondary' | 'danger' | 'text' | 'icon'
  size: 'small' | 'medium' | 'large'
  onClick: handler function
  disabled: boolean
  className: string (for overrides)
```

---

## 14. Known Design Constraints & Decisions

| Constraint | Decision | Rationale |
|---|---|---|
| Single Accent Color | Amber (#F2A83B) | Prevents color chaos, signals primary actions clearly |
| No Drop-Shadow Stacking | Subtle shadows only on hover | Clean, ops-focused aesthetic (not playful) |
| Status via Color + Text | Never color-alone | Accessibility for colorblind users |
| Mobile-First Responsive | 380px base, scale up | Most participants use phones, optimize for mobile UX |
| No Serif Display Fonts | Grotesk sans only | Maintains field-safety tone, modern feel |
| Dense Tables over Cards | Examiners need data density | Examiner dashboard is a working tool, not consumer UI |
| Live Quiz: Pacing as Visual | Circular timer ring primary | Countdown is the key mechanic, should dominate UI |
| Results: Score First | Large numeral before breakdown | Users want to see score immediately (success/failure) |

---

## 15. Future Enhancements

```
Phase 2 (Post-Launch):
  - Dark mode support
  - Internalization (i18n) — Hindi, Tamil, other languages
  - Advanced data visualization (D3 charts for admin analytics)
  - Accessibility refinements (WCAG 2.1 AAA)
  - Performance optimization (lazy-loaded modals, code splitting)

Phase 3 (Scaling):
  - Custom theming (white-label for different orgs)
  - Advanced filters (saved views, favorites)
  - Real-time collaboration (multiple examiners editing same quiz)
  - Mobile app-specific UX (push notifications, offline mode)
```

---



---

## 11. Open Questions for Stakeholders

1. Video completion threshold to unlock assessment — 90% watched, or explicit "mark complete"?
2. Do Understanding quizzes still need an invite link, or are they always open to all assigned participants?
3. Badge #10 "Perfect Streak" — does an Understanding quiz pass count toward the streak, or Mandatory only?
4. React Native: single codebase with web (React Native Web) or fully separate mobile app?
5. Object storage provider for video/photos (S3 direct vs. CDN-fronted)?
