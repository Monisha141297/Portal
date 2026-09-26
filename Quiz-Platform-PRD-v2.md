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

Modern, high-energy but not childish — closer to a **field-safety / operations app** than a consumer quiz toy, since the content is workplace training (PPE, compliance, product certification). Suggested direction:

- **Palette**: deep ink navy (`#12213A`) as the base, a warm signal amber (`#F2A83B`) as the single accent (used only for primary actions and the live-question timer ring), off-white (`#F7F5F1`) surfaces, a muted teal (`#2E7D6B`) reserved solely for "passed/success" states so it doesn't compete with amber.
- **Type**: one grotesk sans (e.g., a Söhne/Inter-class face) for everything; large, confident numerals for scores and timers — no separate display serif.
- **Landing (participant)**: a card grid of assigned products, each card = product thumbnail + a slim status pill (not a badge-shaped chip — a plain rounded rectangle with text), no drop shadows stacked on drop shadows.
- **Video screen**: full-bleed player, minimal chrome, progress ring instead of a scrub bar cluttered with controls.
- **Live quiz screen (mobile-first)**: one question per screen, big tappable option rows, a circular countdown ring around nothing decorative — it *is* the primary visual element of the screen since pacing is the whole mechanic.
- **Result/badges screen**: score first (large numeral), pass/fail state via color only (teal/amber-adjacent warning red for fail, never the accent amber itself), badges shown as a simple row of icon + label, not gamified confetti.
- **Examiner dashboard**: dense data table, not cards — this is a working tool, not a marketing surface.

I can build an actual clickable mockup (participant flow: product list → video → live quiz → result) as a follow-up artifact if useful — happy to do that next, focused on 3–4 key screens rather than the whole app, to keep it fast to iterate on.

---

## 11. Open Questions for Stakeholders

1. Video completion threshold to unlock assessment — 90% watched, or explicit "mark complete"?
2. Do Understanding quizzes still need an invite link, or are they always open to all assigned participants?
3. Badge #10 "Perfect Streak" — does an Understanding quiz pass count toward the streak, or Mandatory only?
4. React Native: single codebase with web (React Native Web) or fully separate mobile app?
5. Object storage provider for video/photos (S3 direct vs. CDN-fronted)?
