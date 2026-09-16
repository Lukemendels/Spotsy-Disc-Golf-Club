# LOOP PROMPT — Firestore setup + security hardening for Spotsy Disc Golf Club PWA

Paste this whole file into an agentic coding session (e.g. Antigravity) running
at the repo root. Work it as a loop: inspect current state, attempt each task in
order, VERIFY it with real command output, fix and retry on failure, and do not
stop until every applicable box in the Completion checklist is checked.

Repo: `Lukemendels/Spotsy-Disc-Golf-Club`, branch `main`.
Stack: React 19 + Vite 6 + TypeScript, `firebase` JS SDK v12.17.0, deployed to
GitHub Pages via `.github/workflows/deploy-pages.yml`.

---

## 0. Operating constraints

- Treat the current repository as authoritative. Re-read any file before
  modifying it; this prompt may lag later commits.
- Do not weaken security rules merely to make a test pass.
- Do not change `.github/workflows/deploy-pages.yml`.
- Do not remove or break the existing `public/activity.json` Facebook feed
  path. Firestore is a new/future sink unless the current repo already contains
  a later migration.
- Do not commit privileged credentials, service-account JSON, private keys,
  bot passwords, refresh tokens, GitHub PATs, or other secrets.
- Firebase web config values (including the browser `apiKey`) are client
  configuration, not a server secret. Do not invent a fake/redacted key or
  fail hygiene merely because an `AIza...` Firebase web key is committed.
  Instead, verify the key belongs to this Firebase web app and is appropriately
  API-restricted in Google Cloud if practical. Never commit privileged
  credentials.
- The Firestore database in use is NAMED, not `(default)`. Every setup,
  deploy, seed, verification, and read/write test must explicitly target the
  named database ID below.

## 1. Verified repo facts

- **Firebase project:** `chief-of-staff-api`
- **Named Firestore database:**
  `ai-studio-spotsydiscgolfdi-9ba4b12c-c2d9-4100-a858-c5aef837e6ef`
- **Client config:** `firebase-applet-config.json` at repo root, imported by
  `src/lib/firebase.ts`. The client already calls
  `getFirestore(app, firestoreDatabaseId)` when the ID is present.
- **Rules:** `firestore.rules` at repo root (`rules_version = '2'`).
- **Blueprint collections:** `events`, `courses`, `rounds`, `users`,
  `officers`, `beginnerSignups`, `announcementSubscriptions`, with
  `rounds/{roundId}/messages` as a subcollection.
- **Document shapes:** `src/types.ts` defines `Event`, `Course`, `Round`,
  `Message`, `UserProfile`, `Officer`, `BeginnerSignup`,
  `AnnouncementSubscription`, plus `FacebookPost` and
  `FacebookActivityFeed`.
- **Auth:** Google sign-in via Firebase Auth in `src/context/AuthContext.tsx`.
  A user profile doc is created at `users/{uid}` on first authenticated sign-in.
  There is also a localStorage demo-user fallback (`spotsy_demo_user`). The
  demo identity is not a trusted Firebase Auth principal and must not be given
  backend authority merely because localStorage says `club_admin`.
- **Seed data:** `src/data/seedData.ts` contains shapes usable for initial
  `courses` / `events` seed documents.
- **Current Facebook sync:** automation currently updates
  `public/activity.json` in the repo. Do NOT assume it already writes to
  Firestore. This loop prepares a secure `facebookFeed` Firestore sink and
  client reader; migrating the sync writer is a separate step unless a later
  repo commit already did so.
- **Missing deploy config at the time this prompt was written:** no
  `firebase.json` or `.firebaserc` was present. Re-check before creating them.

## 2. Security problems that must be corrected before adding the bot

The original rules used broad `isSignedIn()` checks for several collections.
That creates two issues:

1. A dedicated feed-sync Firebase Auth user with a `feedSync` custom claim
   would still inherit every permission granted to *all* signed-in users. A
   custom claim adds permission; it does not subtract existing permission.
   Therefore the bot is NOT least-privilege unless non-feed write paths
   explicitly exclude it (or are otherwise restricted more tightly).
2. The original `users/{userId}` rule allowed any signed-in user to create or
   update user documents, while `isClubAdmin()` trusted the profile document's
   `role == 'club_admin'`. That can create a privilege-escalation path if a
   client can change its own (or another user's) role.

Fix both as part of this loop. Do not preserve those vulnerabilities for
compatibility.

## 3. Things you may need from the human

Ask only if genuinely blocked:

1. Confirmation that the named Firestore database exists in Firebase console.
2. A terminal authenticated with Firebase CLI (`firebase login`) and access to
   project `chief-of-staff-api`.
3. For one-time bot provisioning only: an authorized local/admin environment
   capable of setting Firebase Auth custom claims. Do not request that a
   service-account private key be pasted into chat or committed to the repo.
4. If provisioning a password-based bot identity for GitHub Actions, the bot
   email/password must be placed in GitHub Actions secrets by the human or an
   authorized secret-management path. Never commit them.

Do NOT ask for the Firebase browser web API key merely because it is visible in
client config; it is not the privileged credential used to secure Firestore.

## 4. Tasks, in order

### Task 1 — Inspect current state before editing

Re-read at minimum:

- `firebase-applet-config.json`
- `firebase-blueprint.json`
- `firestore.rules`
- `src/lib/firebase.ts`
- `src/context/AuthContext.tsx`
- `src/types.ts`
- `src/data/seedData.ts`
- `.github/workflows/deploy-pages.yml`
- `public/activity.json`
- any existing `firebase.json`, `.firebaserc`, or Firestore helper added since
  this prompt was written

Record the current commit SHA and `git status`. If later work has already
implemented part of this prompt, preserve correct later state rather than
blindly overwriting it.

### Task 2 — Configure Firebase CLI for the NAMED Firestore database

Create or update `.firebaserc` so the default project is
`chief-of-staff-api`.

Create or update `firebase.json` using the multi-database Firestore form so
`firestore.rules` is explicitly associated with this database ID, e.g. the
conceptual structure:

```json
{
  "firestore": [
    {
      "database": "ai-studio-spotsydiscgolfdi-9ba4b12c-c2d9-4100-a858-c5aef837e6ef",
      "rules": "firestore.rules"
    }
  ]
}
```

If the installed Firebase CLI requires a slightly different current schema,
use `firebase --help` / official CLI behavior to resolve it, but preserve the
hard requirement: deployment must target the named database, never
`(default)`.

Deploy rules explicitly to that database. Prefer the named-database target:

```bash
firebase deploy --only firestore:ai-studio-spotsydiscgolfdi-9ba4b12c-c2d9-4100-a858-c5aef837e6ef --project chief-of-staff-api
```

If the installed CLI version uses different syntax, determine the supported
syntax and show evidence that the named database—not `(default)`—received the
rules.

### Task 3 — Harden Firestore authorization before provisioning the bot

Refactor `firestore.rules` around explicit trust boundaries.

At minimum introduce a helper equivalent to:

```text
isSignedIn()
isFeedSyncBot()  // request.auth.token.feedSync == true
isClubAdmin()    // trusted auth claim and/or explicitly trusted admin email,
                 // NOT a mutable Firestore profile role controlled by clients
isOwner(userId)
```

Required security behavior:

- The feed-sync identity can write **only** `facebookFeed`.
- All other authenticated write paths must explicitly reject the feed bot or be
  restricted in a way that inherently excludes it.
- `isClubAdmin()` must not derive backend authority solely from a mutable
  `users/{uid}.role` field.
- A normal user must not be able to promote itself or another user to
  `club_admin` by writing a profile document.
- Demo/localStorage roles are UI-only and grant no Firestore authorization.

Use the app's actual call sites to preserve intended behavior, but the expected
baseline policy is:

- `events`: public read; writes club-admin only.
- `courses`: public read; writes club-admin only.
- `officers`: public read; writes club-admin only.
- `rounds`: public read; create by authenticated non-bot users; update/delete
  only by the round organizer or club admin unless current product behavior
  demonstrably requires something else. Do not grant the feed bot access.
- `rounds/{roundId}/messages`: read/write by authenticated non-bot users as
  required by current product behavior; tighten further if organizer/
  participant semantics already exist.
- `users/{userId}`: public read only if current product needs it; create/update
  by the authenticated owner with UID integrity enforced. A normal owner may
  update profile fields but may not change a privileged role. Club admins may
  perform required administrative role changes. Delete admin-only unless the
  product explicitly supports safe self-delete.
- `beginnerSignups`: public create if required; reads/admin management should
  be club-admin only rather than any signed-in user.
- `announcementSubscriptions`: public create if required; reads/admin
  management should be club-admin only rather than any signed-in user.

For profile creation, account for the current app behavior in
`AuthContext.tsx`: the trusted admin email may need to create an initial
`club_admin` profile for UI purposes. It is acceptable for UI profile role and
backend authorization to coexist, but backend admin authority must come from a
trusted Auth token claim / trusted email rule, not from the editable profile
field alone.

Before moving on, use the Firestore emulator/rules unit tests if feasible, or
another deterministic rules test harness, to prove at least these cases:

1. unauthenticated user cannot write protected collections;
2. ordinary signed-in user cannot alter another user's profile;
3. ordinary signed-in user cannot promote itself to `club_admin`;
4. feed bot cannot write `events`, `courses`, `officers`, `rounds`, `users`,
   `beginnerSignups`, or `announcementSubscriptions`;
5. club admin can perform intended admin writes;
6. intended normal-user round/profile flows still work.

### Task 4 — Create `facebookFeed` schema + least-privilege rule

Prepare a `facebookFeed` collection as the Firestore sink for Facebook posts.
Do not remove the existing `public/activity.json` flow in this task.

Document schema:

- doc ID = Facebook post ID (string)
- fields from `FacebookPost` in `src/types.ts`:
  `id`, `url`, `created_at`, `text`, `reactions`, `comments`
- plus `synced_at` as an ISO timestamp/string representing the sync write time
  (or a Firestore server timestamp if you deliberately update the client type
  and reader accordingly)

Add a rule equivalent to:

```text
match /facebookFeed/{postId} {
  allow read: if true;
  allow create, update, delete: if isFeedSyncBot();
}
```

If deletes are not required by the sync design, deny deletes and document why.
The important invariant is that ONLY the dedicated feed-sync principal (plus a
separately justified club-admin override, if truly needed) can mutate this
collection.

### Task 5 — Provision the feed-sync identity safely

Use a dedicated Firebase Auth identity with custom claim:

```json
{ "feedSync": true }
```

Provision the claim from an authorized Admin SDK / Firebase admin environment.
Do not commit the provisioning credential.

Document the exact commands/script actually used under
`## Bot provisioning runbook` at the bottom of this file. The runbook must
explain:

- how the Firebase Auth user is created/identified;
- how `feedSync: true` is assigned;
- how the bot authenticates at runtime so requests are evaluated by Firestore
  Security Rules (for example, a dedicated email/password Auth user with its
  credentials stored as GitHub Actions secrets);
- how to revoke the bot quickly;
- how to rotate any bot password/secret;
- that Admin SDK/server credentials bypass Firestore Security Rules and must
  NOT be used as the routine sync writer if the design goal is collection-level
  least privilege enforced by rules.

After setting the custom claim, refresh/re-authenticate the bot token before
verification so the new claim is present.

### Task 6 — Seed/verify the named database

Ensure the seven blueprint collections exist in the NAMED database with docs
matching `src/types.ts`. Seed `courses` and `events` from
`src/data/seedData.ts` only where the mapping is clear.

Firestore collections are created by documents, not as empty schema objects.
Do not create meaningless placeholder documents merely to make a collection
name appear. If a collection legitimately has no records yet (for example no
signups), record that fact instead of inventing production data.

Create at least one legitimate `facebookFeed` document only if there is a
real post available from `public/activity.json`; preserve the Facebook post ID
as the document ID and record `synced_at`.

Verify all reads/writes against the named database ID explicitly.

### Task 7 — Client read helper

Add `src/lib/facebookFeed.ts` if it does not already exist. It should:

- use the existing named-database `db` export from `src/lib/firebase.ts`;
- return typed feed records;
- read `facebookFeed` ordered by `created_at` descending;
- remain read-only; the browser client must never write this collection;
- account for the `synced_at` field in its returned type without corrupting the
  existing `FacebookPost` contract.

Do not switch the visible UI from `public/activity.json` to Firestore unless
that migration is explicitly required by current repo state. The purpose here
is to create the safe adapter/seam first.

### Task 8 — Verify build + security + deployment

Run and capture real output for:

```bash
npx tsc --noEmit
npm run build
```

Then:

- re-deploy the final rules to the NAMED database;
- prove the database target in output/config;
- run the authorization tests from Task 3;
- verify a feed bot write to `facebookFeed` succeeds;
- verify the same bot is denied on every other mutable collection;
- verify an ordinary user is denied from self-promoting role/admin authority;
- verify intended ordinary user flows still succeed;
- verify public feed reads work if public read is intended.

### Task 9 — Hygiene and regression check

Before commit:

- `git diff -- .github/workflows/deploy-pages.yml` must be empty.
- Existing `public/activity.json` sync path must still be intact unless a
  separate, explicit migration already exists.
- Search the diff for privileged secrets: private-key blocks, service-account
  JSON, bot password, refresh/access tokens, GitHub PATs, etc.
- Do NOT classify the Firebase browser `apiKey` alone as a leaked secret.
- Confirm no service-account credential was added to client-side code.
- Confirm the feed bot claim is used only to authorize `facebookFeed`, never to
  broaden access elsewhere.
- `git status` must show only intended files.

Only after all applicable checks pass: commit and push.

## 5. Loop protocol

For each task:

1. Inspect current state.
2. Make the smallest correct change.
3. Verify with real output/tests.
4. If verification fails, diagnose and retry.
5. Do not mark a checkbox from inference alone.

If a task is impossible because required human authorization is missing, stop
only at that boundary, report exactly what is blocked, and leave the repo in a
safe buildable state. Do not substitute weaker permissions or hard-coded
credentials.

## 6. Completion checklist

- [ ] Current repo state inspected; starting commit SHA recorded
- [ ] `.firebaserc` targets `chief-of-staff-api`
- [ ] `firebase.json` explicitly maps rules to the NAMED Firestore database
- [ ] Final rules deploy verified against the NAMED database, not `(default)`
- [ ] Existing privilege-escalation path through writable profile `role` removed
- [ ] Non-feed write permissions exclude the feed-sync bot
- [ ] Ordinary users cannot edit other users or self-promote to admin
- [ ] Intended ordinary round/profile flows still work
- [ ] Feed bot can mutate `facebookFeed` and no other collection
- [ ] Bot provisioning/revocation/rotation runbook documented
- [ ] Seven blueprint collection states verified without fake placeholder data
- [ ] `facebookFeed` schema established from real feed data when available
- [ ] `src/lib/facebookFeed.ts` exists, typed, read-only, uses named `db`
- [ ] Existing `public/activity.json` sync remains intact unless separately migrated
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes
- [ ] `.github/workflows/deploy-pages.yml` untouched
- [ ] No privileged credentials/secrets committed
- [ ] Final `git status` contains only intended changes
- [ ] Changes committed and pushed

## Bot provisioning runbook

_(Fill this in during Task 5 with the exact safe commands/process actually
used. Never paste or commit privileged credential values.)_
