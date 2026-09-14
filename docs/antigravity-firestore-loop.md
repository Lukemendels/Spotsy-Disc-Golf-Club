# LOOP PROMPT — Firestore setup for Spotsy Disc Golf Club PWA

Paste this whole file into your agentic coding session (e.g. Antigravity) running
at the repo root. Work it as a loop: attempt each task in order, VERIFY it with
real command output, fix and retry on failure, and do not stop until every box
in the Completion checklist is checked.

Repo: `Lukemendels/Spotsy-Disc-Golf-Club`, branch `main`.
Stack: React 19 + Vite 6 + TypeScript, `firebase` JS SDK v12.17.0, deployed to
GitHub Pages via `.github/workflows/deploy-pages.yml`.

---

## 1. Facts about this repo (do not re-derive these — trust them)

- **Firebase project:** `chief-of-staff-api`
- **Firestore database is a NAMED database, not `(default)`:**
  `ai-studio-spotsydiscgolfdi-9ba4b12c-c2d9-4100-a858-c5aef837e6ef`
  Every console page, `gcloud`, Admin SDK call, and `firebase` command must
  target this database ID. If you use `(default)` anywhere, you are in the
  wrong database.
- **Client config:** `firebase-applet-config.json` at repo root, imported by
  `src/lib/firebase.ts`, which calls `getFirestore(app, firestoreDatabaseId)`.
  The `apiKey` in the committed file is **redacted** — the human must supply
  the real web API key (Firebase console → Project settings → General →
  Your apps → web app `1:334659703073:web:ecd39c8778c9de7748ee60`).
  **Never commit the real key.** Use a local untracked file or env var.
- **Rules:** `firestore.rules` at repo root (`rules_version = '2'`). Current
  posture: public reads on `events`, `courses`, `officers`, `rounds`,
  `users`; writes require `request.auth != null`; user delete and some admin
  paths require `club_admin` role or the admin email
  `lukemendelsohn@gmail.com`. There is **no rule yet for a `facebookFeed`
  collection** — you will add one (see task 5).
- **Collections (per `firebase-blueprint.json`):** `events`, `courses`,
  `rounds` (with `rounds/{roundId}/messages` subcollection), `users`,
  `officers`, `beginnerSignups`, `announcementSubscriptions`.
- **Document shapes:** `src/types.ts` — `Event`, `Course`, `Round`, `Message`,
  `UserProfile`, `Officer`, `BeginnerSignup`, `AnnouncementSubscription`,
  plus `FacebookPost` / `FacebookActivityFeed` (the feed schema).
- **Auth:** Google sign-in via `signInWithPopup` + `GoogleAuthProvider`
  (`src/context/AuthContext.tsx`). A user profile doc is auto-created at
  `users/{uid}` on first sign-in. There is a **demo-user fallback** stored in
  `localStorage` (`spotsy_demo_user`) — do not break it.
- **Seed data:** `src/data/seedData.ts` has the shape of real docs; use it
  when seeding.
- **Missing infra:** there is **no `firebase.json` and no `.firebaserc`** —
  `firebase-tools` has nothing to deploy with yet. You must create them.
- **Do not touch** `.github/workflows/deploy-pages.yml` or break the
  GitHub Pages build.

## 2. Things you need from the human (ask if blocked)

1. The real Firebase **web API key** (see above). Never commit it.
2. Confirmation the named Firestore database exists in the Firebase console
   (create it if not — again: the named ID, not `(default)`).
3. A terminal where `firebase login` has been run (`firebase-tools`).

## 3. Tasks, in order

### Task 1 — Deployable rules config
Create `firebase.json` (firestore rules → `firestore.rules`, scoped to this
project) and `.firebaserc` (default project `chief-of-staff-api`). Then run
`firebase deploy --only firestore:rules --project chief-of-staff-api` and
verify it succeeds with no errors.

### Task 2 — Collections exist
Ensure all 7 blueprint collections exist in the **named** database with docs
matching the shapes in `src/types.ts`. Seed `courses` and `events` from
`src/data/seedData.ts` where it clearly maps. Verify by reading the
collections back (console or a script against the named database).

### Task 3 — `facebookFeed` collection (the sync target)
A separate automation syncs the club's Facebook group posts into Firestore.
Create the `facebookFeed` collection. Each doc:
- doc ID = Facebook post ID (string)
- fields per the `FacebookPost` interface in `src/types.ts`
  (`id`, `url`, `created_at`, `text`, `reactions`, `comments`)
- plus `synced_at` (ISO string, when the sync wrote it)

### Task 4 — Least-privilege rules for the sync bot (the security-critical part)
The sync runs under a **dedicated bot identity** that must be able to write
**only** to `facebookFeed` — never to `events`, `users`, `officers`, or any
other collection. Implement this with a Firebase Auth user + custom claim:
1. Add to `firestore.rules`, inside the existing `match /databases/{database}/documents` block:
   ```
   match /facebookFeed/{postId} {
     allow read: if true;
     allow write: if isSignedIn() && request.auth.token.feedSync == true;
   }
   ```
   (`isSignedIn()` already exists in the rules file.)
2. Document the exact commands to provision the bot (create the Auth user,
   set the custom claim `feedSync: true` via Admin SDK or `firebase auth`),
   and append that runbook to this file under "## Bot provisioning runbook".
3. Verify no other collection's rules grant the bot write access — the claim
   must appear **only** in the `facebookFeed` block.

### Task 5 — Client read helper
Add `src/lib/facebookFeed.ts`: a typed helper that reads `facebookFeed`
ordered by `created_at` descending (use the existing `db` export from
`src/lib/firebase.ts` and the `FacebookPost` type). Keep it read-only —
the client never writes this collection.

### Task 6 — Verify everything
- `npx tsc --noEmit` passes.
- `npm run build` passes.
- Rules deploy clean (re-run Task 1's deploy to confirm the final file).
- Read check against the named database for each collection; write check
  only where rules allow (do not weaken rules to make a check pass).

### Task 7 — Hygiene
- No secrets committed (grep the diff for `AIza`, private keys, tokens).
- `deploy-pages.yml` untouched. `git status` shows only intended files.

## 4. Loop protocol

Work the tasks in order. After each task, verify it with **real output**
(command results, console screenshots of the named database, build logs) —
not assumptions. If verification fails, diagnose, fix, retry. Loop until the
checklist below is fully checked. Only then commit and push.

## 5. Completion checklist

- [ ] `firebase.json` + `.firebaserc` committed; `firestore:rules` deploys clean
- [ ] All 7 blueprint collections exist in the named database with correct shapes
- [ ] `facebookFeed` collection created with the documented schema
- [ ] `facebookFeed` rules deployed: public read, write only with `feedSync == true` claim
- [ ] Bot provisioning runbook documented in this file; claim appears in no other rule
- [ ] `src/lib/facebookFeed.ts` exists, typed, read-only, uses named-database `db`
- [ ] `tsc --noEmit` and `vite build` pass
- [ ] No secrets in the diff; Pages workflow untouched

## Bot provisioning runbook

_(To be filled in by the agent during Task 4 with the exact commands used.)_
