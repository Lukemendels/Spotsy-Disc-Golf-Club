# Spotsy Disc Golf Club adoption demo

An isolated, synthetic demonstration for discussing club adoption with Bob Cannon. This extends the existing React/Vite UI and keeps Firebase configuration/rules as historical scaffolding for future approved work. The demo does **not** initialize Firebase, authenticate real users, send email, confirm membership, process money or write to a live service.

Use Node 24 or newer:

```sh
npm ci
npm test
npm run lint
npm run build
npm run preview -- --host 127.0.0.1
```

Open the local URL printed by Vite. For a reproducible browser walkthrough:

```sh
npx playwright install chromium
npm run test:browser
```

An existing Chrome installation can be selected with `BROWSER_EXECUTABLE`. The browser script runs one headless session and records screenshots under `docs/screenshots`. No Office application is involved.

The existing Pages deployment workflow is unchanged. This branch's new checks run locally/on PRs; they do not deploy. Do not merge or deploy this branch as part of the demonstration review.

- [Demo walkthrough and adoption discussion](docs/adoption-demo.md)
- [Demo boundaries and future production decisions](docs/demo-boundaries.md)

The repository uses `package-lock.json` and npm as its dependency baseline. Unused AI Studio server/model dependencies were removed; Firebase remains a dependency for the existing planned stack, but the demo runtime uses an explicitly local document adapter.
