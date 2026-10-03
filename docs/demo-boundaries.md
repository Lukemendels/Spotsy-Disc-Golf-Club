# Demo boundary and future production work

## What this branch does

React/Vite pages and the established visual/navigation design are retained. Every existing document operation in the demo routes through `src/lib/demoDatabase.ts`, a localStorage adapter; `src/lib/firebase.ts` does not initialize an SDK. AuthContext exposes only simulated identities/roles. There is no email-based admin inference, Google popup/fallback or live profile/role write. `connect-src` is restricted to the site's own origin plus localhost development sockets as defense in depth. Tests check the source import graph and browser requests.

The existing Firebase config, historical provisioning docs and checked-in rules remain available for future review; **no deployed rules, settings or ownership were inspected or changed**. The config belongs to another-purpose project and is not the club's production boundary. The broad checked-in rules remain a production blocker and must not be deployed as-is.

Demo records separate:

| Record | Key / relationship |
| --- | --- |
| Auth identity | simulated authId → stable memberId |
| Member profile | memberId, display name, optional PDGA, profile completion |
| UDisc mapping | exact username → memberId; reviewed aliases preserve identity when handles change |
| Attendance | attendanceId + eventId + memberId; division, incoming tags, ace request |
| Payment confirmation | attendanceId + simulated confirming staff identity |
| Account claim | requesting authId + target memberId + review status |
| Results | eventId + memberId + import fingerprint; workbook filename/time/score-field provenance |

Storage is local to one origin/browser profile. Same-origin tabs can refresh from storage events; different devices cannot share state. Closing/reopening preserves local records; clearing site storage removes them. This is an insecure, editable local simulation, not an authorization system, payment ledger, backup or production data store. Do not enter real personal/member/payment data.

The demo has one fixed sample league event. New public demo events/quicklinks are stored separately; multi-event league selection/history is future work. Cards/callout drafts are session UI state. Local signup forms demonstrate intake and admin review, not real mailing or clinic enrollment. Push reminders remain a labeled concept. Existing source-linked Facebook content is separate from synthetic league data.

## Results boundary

Ordinary check-in, division/tag edits and payment confirmation preserve imported score rows and workbook history. Tag and ace previews use the current tags and staff payment confirmations. Adding/removing attendees marks results as needing reconciliation and hides those previews until a reviewed import covers the current roster. Loading the synthetic roster is an explicitly labeled scenario reset that clears sample results/history.

The automated browser walkthrough blocks service workers and external requests to verify the isolated online demo deterministically. It does not establish offline/PWA installation, stale-cache recovery or upgrade behavior; these remain unverified acceptance work.

Manual XLSX upload only, maximum 5 MB. No UDisc OAuth/API has been established. No scraping, live synchronization or invented PDGA integration is implemented. Select one worksheet/round with compatible score headers; do not combine multiple rounds and infer tag policy. Duplicate/guest/changed-handle exceptions require explicit reconciliation. PDGA is optional corroboration, and display name is never an identity key.

Tag handoff implements the prior prototype policy as a **preview**, not club-approved settlement. Separate incoming tag pools remain separate. Duplicate tags block that pool's preview. Hole scores of 1 identify possible aces; absent hole columns cannot establish no ace. The demo does not assert prize amounts, actual payments or paid membership.

## Muse's source feed

Remote main was observed at `0474934c763c79aee5ccfa030a8c203a2241aff5`, a “Sync Facebook group activity feed” commit changing only `public/activity.json`. Recent prior commits have the same message; authorship is not inferred from the GitHub identity. The checked-in feed has 20 posts and `updated_at` of `2026-10-02T23:21:55.089967+00:00`.

Current contract: top-level `group`, `group_url`, `updated_at`, `posts`; each post contains `id`, `url`, `created_at`, `text`, `reactions`, `comments`. There are no image URL, photo, attachment or base64 fields. CommunityFeedPage already fetches this JSON using the Vite base path, renders text/counts/timestamps and links to the original Facebook post. It does not currently render post images. The ingestion script/token remains outside this branch; no token was read or changed, and no pipeline was duplicated.

An optional future contract could add `images: [{url, alt, source_url}]` for club-approved public URLs or approved repository assets, with provenance/permission and expiry handling. This is a proposal, not a schema change Muse must already support. Base64 could package an image that was legitimately obtained; it cannot grant access to Facebook media or solve permission/expiry, and would enlarge JSON/Git history. Private images should remain source links unless an authorized source provides assets for republication. This branch preserves current ingestion paths and JSON unchanged.

## Production/adoption decisions requiring approval

- Club adoption, authoritative content, actual league times/divisions, small-field cards, tag ties and ace-pot policy; treasurer-approved membership/payment process.
- Club-owned development/production Firebase projects, domain, billing/recovery contacts and at least two institutional maintainers. Technical deployment authority remains distinct from speaking for the club.
- Real Auth identities, trusted role assignment, deny-by-default Firestore rules and emulator tests; member-private data, participant-only chat and organizer ownership enforced server-side.
- Transaction-safe shared capacity/check-in, durable imports/audit history, claim evidence/conflict/duplicate-account review, backups/export/retention, consent and moderation.
- Verified UDisc XLSX schema samples supplied through an approved process; explicit multi-round/event selection. No promised integration without documented access.
- PWA caching/update/offline truthfulness, notifications/delivery, accessibility, Android/iPhone and low-connectivity pilot verification.

No project/account creation, deployed permission changes, domains, purchases, contact with Bob or public deployment is included in this PR.
