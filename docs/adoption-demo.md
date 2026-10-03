# Walkthrough for Luke and Bob

This is a club-specific adoption conversation, not a production launch or permission to operate real membership/payments. Use one browser and fictional inputs. A QR opened on a second phone has separate local state; it cannot demonstrate shared attendance.

## Start with the reason for the platform

1. Open Dashboard, Events, New Players and Courses. Discuss how someone can discover the club and enter the local scene without Facebook.
2. Open Community Feed. It reads the repository's current `public/activity.json`, preserving post source links and sync timestamp. This complements official information; it does not confer official authority on every social post.
3. Open Casual Rounds as a demo member. Join a card, send a short coordination message, leave, then organize a new round. Participant/admin visibility and completed/cancelled read-only threads are local simulations. There is no permanent general chat or direct messaging added.

## Returning member and profile once

4. Choose **Profile & League → Return as Alex A**. The synthetic profile has UDisc username `sample.alex.a` and fictional PDGA `900001`. Expand the saved profile to edit; PDGA and UDisc are optional. Save the profile, check in, refresh, and check in again. The stable member ID and attendance ID remain; a second row is not created.
5. Choose **New member setup** to use a separate simulated auth identity. Set up the display name and optional UDisc/PDGA details. After saving, the profile collapses and subsequent visits offer quick division/tag check-in.
6. Request ace-pot entry. This is a request, not confirmed payment or club membership.

## Organizer and walk-ups

7. Choose **Club Ops → Enter organizer demo**. The role is explicitly simulated, never written to Firebase. **Load synthetic roster** creates 11 attendees, including two people both named Alex River. Their stable IDs and exact UDisc handles distinguish them.
8. Select either existing Alex by ID. Add a fictional guest with **Create guest record**; UDisc and PDGA can be omitted. Then check the guest in at the table. No phone/app/account is required.
9. The roster lets staff correct division/tags, remove an attendance record, and confirm synthetic ace-pot payment. Incoming tags and payments are event records, not fields on auth identity. Correct duplicate tag numbers before handoff.
10. Lock/build cards. Three-player mode uses 3s wherever possible; remainder 1 gets a 4, remainder 2 uses two 4s. The existing five-player small-field exception is 3+2; one/two-player fields remain an explicit small-field organizer discussion. No 5-person card is generated. Starting holes take the every-other-hole wave first. Manual duplicate holes, empty/oversized cards and more than 18 cards prevent finalization.

The displayed 5:45/6:00 times are sample operating targets inherited from the prototype, not verified policy. League leadership must confirm times, divisions and small-field exceptions.

## Results preview and reconciliation

11. For the standard 11-person walkthrough, reload the synthetic roster before importing (this resets event attendance/results, retaining profiles). Upload `tests/fixtures/synthetic-udisc.xlsx`, or choose **Load synthetic sample**. The workbook is fictional and contains the same 11 attendees. XLSX is read locally; multi-sheet workbooks offer a worksheet selector.
12. Preview shows Name, Username, optional PDGA, selected score column and mapping. Exact username is the only automatic identity match. Similar names never merge people; PDGA corroborates a known match but is not a matching fallback. Unknown/changed usernames, missing usernames, duplicate usernames, two rows assigned to one member, invalid scores, conflicting PDGA and missing attendees remain exceptions.
13. Use the organizer row selector to review a guest/changed handle against an attendee ID. A reviewed changed handle may be saved as an alias. A duplicate/non-event row may be explicitly excluded; missing attendee results still block settlement. Correct attendance if a person did not play, then re-preview/re-import.
14. Save the reviewed import. Re-save/re-upload it: one local batch and one result per member remain. Row order and filename do not create new identities. A corrected export replaces event results after review and records its own batch provenance.
15. Inspect the independent Spotsy/Stafford tag handoff previews. The inherited prototype policy orders by score then incoming tag for ties. It needs leadership approval before real use. Ace detection requires hole-level scores; staff-confirmed entry is shown, but no monetary payout or carry-forward is asserted.

## Later account claim

16. Reopen check-in, add/check in Guest Nova without UDisc, then switch to **New member setup**. Select the guest ID and **Request review**. Nothing merges or links automatically.
17. Switch back to organizer and inspect **Pending account claims**. After discussing identity evidence, approve or reject. Approval links the demo auth identity to that stable guest member record and retains attendance. A member already linked elsewhere, or a requesting account with its own attendance, requires conflict review and cannot be silently combined.
18. Return as the new demo member, complete the profile, and check in again. The same guest attendance remains.

## Event quicklinks and public facts

Organizers can create a local demo event with a sample HTTPS quicklink. Links are stored per event and rendered on Events; sample links are labeled and use `example.com`. No live UDisc event connection is inferred. Membership amount/benefits/course access/leadership and contact details remain subject to club approval. Payment destinations are withheld.

## Verified evidence

- Eight unit/invariant tests cover stable identity, duplicate names, optional profile fields, claims/conflicts, exact username reconciliation, exceptions, idempotent/corrected imports, cards/holes and no Firebase SDK entry imports.
- `npm run lint` and `npm run build` validate types and the Vite bundle.
- Browser walkthrough uses a real synthetic XLSX, verifies local source-feed rendering, member return, casual round create/join/chat/leave, organizer cards, guest claim approval and a 390px mobile screen. It asserts no Firebase requests and no page errors.
- Screenshots: [member desktop](screenshots/member-desktop.png), [organizer cards](screenshots/organizer-cards-desktop.png), [reconciliation](screenshots/organizer-reconciliation-desktop.png), [organizer results](screenshots/organizer-import-desktop.png), [member mobile](screenshots/member-mobile.png).

## Questions for adoption

Who approves public information and event details? Who confirms membership/payment, claims and result exceptions? What are the actual tag tie and ace-pot rules? Does staff want these table screens? What should two club representatives be able to maintain/recover/export without Luke? Which controlled pilot would be worth approving after production ownership, security and content decisions?

## WHY provenance

- [Spotsy digital platform concept](https://github.com/Lukemendels/StickShift_Wiki/blob/main/builds/spotsy-disc-golf-digital-platform.md): discovery → information → casual participation → relationships → organized events → membership; leadership retains institutional authority.
- [Teaching/community/handoff journal](https://github.com/Lukemendels/StickShift_Wiki/blob/main/journal/2026-08-28-teaching-community-builders-and-managed-bespoke-software.md): responsible club-specific handoff rather than premature generalization.
- [Welcome to Disc Golf Day recap](https://github.com/Lukemendels/StickShift_Wiki/blob/main/programs/welcome-to-disc-golf-day-2026-recap.md): reduce beginner/social entry friction.

August concepts are historical context, not permission to provision Firebase or override later approved features. The current demo-first instruction governs this branch.
