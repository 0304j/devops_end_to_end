# AutoCare – Kfz-Werkstatt Website & Buchungsplattform

Website and (later) appointment booking platform for an independent car garage.
The public site is in **German**; owner notifications will be in **Arabic** (Phase 4).

The project is built incrementally, one phase at a time (see [Roadmap](#roadmap)).

## Current status: Phase 7 – Docker

- Responsive German landing page and `/termin` booking form.
- Booking requests are **stored in PostgreSQL** via a Next.js Server Action.
- Availability is read from the database; requested and confirmed slots show
  as "belegt".
- For every new request the garage owner receives an **Arabic notification**
  (RTL e-mail) with the customer's description machine-translated to Arabic.
- **Admin area** at `/admin` (login required): list, filter, confirm, reject,
  reschedule, cancel requests and re-send failed notifications.

### Admin area

Create the garage owner's account (password input is hidden):

```bash
npm run admin:create -- inhaber@example.com
```

Running it again for the same e-mail sets a new password and ends all
existing sessions of that account.

| Protection        | How                                                                                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Passwords         | scrypt hash (`src/lib/auth/password.ts`), min. 12 characters                                                                       |
| Sessions          | random token in an HttpOnly, SameSite=Strict cookie; only its SHA-256 hash is stored; 8 h lifetime; logout deletes it              |
| Authorization     | `requireAdmin()` on every admin page **and** in every admin Server Action; `src/proxy.ts` only redirects requests without a cookie |
| Status changes    | allowed transitions are part of the SQL `WHERE` clause (no overwriting changes made elsewhere)                                     |
| Login brute force | max. 5 failures per e-mail / 20 per IP in 15 min (database-backed, works with several replicas)                                    |
| Booking spam      | max. 5 successful requests per IP and hour                                                                                         |
| Privacy           | rate-limit keys use an HMAC of IP/e-mail (`AUTH_SECRET`), never the plain values                                                   |
| Headers           | `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, CSP `frame-ancestors`; `/admin` is `no-store` and `noindex` |

### Arabic notifications

After the booking is stored, the Server Action schedules
`processBookingNotification` with Next.js `after()` – it runs once the
customer already has their answer:

1. **Translate** the German description (`src/lib/translation/`). The original
   stays in `description`; the result goes to `description_ar`. If the
   provider fails, `translation_status = failed` and **no text is invented** –
   the notification shows the German original with an Arabic notice.
2. **Render** the Arabic RTL e-mail (`src/lib/notifications/booking-template.ts`).
   Fixed texts (labels, service names) are written in the template;
   all customer input is HTML-escaped.
3. **Send** it (`src/lib/notifications/`) and record `notification_status`,
   attempts and a technical error code. A failure never affects the booking.

| Variable                                           | Values                                                                                      |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `TRANSLATION_PROVIDER`                             | `mock` (marked test text, **not** a translation) · `deepl` (needs `DEEPL_API_KEY`) · `none` |
| `NOTIFICATION_PROVIDER`                            | `mock` (writes HTML to `.notifications/`) · `smtp` (needs `SMTP_*`, `NOTIFY_EMAIL_TO`)      |
| `MOCK_TRANSLATION_FAIL` / `MOCK_NOTIFICATION_FAIL` | `true` simulates a failure of the mock providers                                            |

With the mock notifier, open the newest file in `.notifications/` in a browser
to see the e-mail. The folder is git-ignored because it contains personal data.

### How a booking request flows

1. `/termin` is partially prerendered: the page shell is static, the form is
   streamed per request by `BookingSection`, which loads availability from the
   database (only slot times, never customer data).
2. The customer submits; the browser validates with the Zod schema.
3. The Server Action `requestBooking` (`src/app/termin/actions.ts`) validates
   **again** on the server, checks the slot is inside the booking window and
   inserts the row.
4. A **partial unique index** (`booking_requests_active_slot_uq`) allows only
   one `requested`/`confirmed` request per slot. If two customers submit the
   same slot simultaneously, PostgreSQL rejects the second insert and the
   customer is asked to pick another time.

### Time handling

Slots are configured as garage-local wall-clock times (`Europe/Berlin`) and
stored as `timestamptz` (an absolute instant, UTC). PostgreSQL does the
conversion (`'2026-10-26 08:00'::timestamp at time zone 'Europe/Berlin'`),
so daylight-saving changes are handled by its time-zone database.

### Booking code

| File                                           | Purpose                                                                   |
| ---------------------------------------------- | ------------------------------------------------------------------------- |
| `src/lib/booking/schema.ts`                    | Zod validation rules + German error messages (browser and server).        |
| `src/lib/booking/availability.ts`              | Bookable days/slots in the garage's time zone.                            |
| `src/lib/booking/repository.ts`                | Server-only database access: availability, insert.                        |
| `src/app/termin/actions.ts`                    | Server Action: validate → insert → result → schedule notification.        |
| `src/lib/translation/*`                        | Translator interface, mock and DeepL providers.                           |
| `src/lib/auth/*`, `src/lib/security/*`         | Password hashing, sessions, rate limiting.                                |
| `src/lib/admin/bookings.ts`, `src/app/admin/*` | Admin queries, Server Actions and pages.                                  |
| `src/lib/notifications/*`                      | Arabic template, notifier interface, mock and SMTP providers, processing. |
| `src/lib/db/schema.ts`                         | Drizzle table definition, constraints and indexes.                        |
| `drizzle/`                                     | Generated SQL migrations (committed, reviewed).                           |

## Requirements

- Node.js 20.9+ (developed with Node 24)
- npm

## Getting started

Requires Docker Desktop (for PostgreSQL).

```bash
npm install
cp .env.example .env.local     # then set a password in BOTH places in .env.local
npm run db:up                  # start PostgreSQL (localhost:5432 only)
npm run db:migrate             # create / update tables
npm run dev                    # http://localhost:3000
```

### Database commands

| Command                             | What it does                                                  |
| ----------------------------------- | ------------------------------------------------------------- |
| `npm run db:up` / `npm run db:down` | Start / stop PostgreSQL (data is kept in a Docker volume).    |
| `npm run db:generate`               | Create a new migration after changing `src/lib/db/schema.ts`. |
| `npm run db:migrate`                | Apply pending migrations.                                     |
| `npm run db:studio`                 | Browse the data in Drizzle Studio.                            |
| `docker compose down -v`            | Stop PostgreSQL and **delete all local data**.                |

Production build locally:

```bash
npm run build
npm run start        # http://localhost:3000
```

Quality checks:

```bash
npm run lint
npm run typecheck
```

## Project structure

```
src/
  app/
    layout.tsx          # <html lang="de">, fonts, metadata, skip link
    page.tsx            # landing page (composes the sections)
    termin/page.tsx     # booking page (Phase 1 placeholder)
    globals.css         # Tailwind v4 + design tokens (@theme)
  components/
    site-header.tsx     # sticky header + desktop navigation
    mobile-nav.tsx      # client component: accessible mobile menu
    site-footer.tsx     # footer incl. image credits
    section-heading.tsx
    sections/           # hero, services, approach, process, contact
  config/
    site.ts             # ALL business content (name, address, hours, services)
public/images/          # locally stored, licensed photos
```

### Changing the business content

Everything a garage would customise lives in [`src/config/site.ts`](src/config/site.ts).
The current values are **example data** (`Musterstraße`, `.example` e-mail
domain, placeholder phone number) and must be replaced before going live.

## Docker

The production image (`Dockerfile`) is a multi-stage build:

1. **deps** – `npm ci` (cached while `package*.json` are unchanged)
2. **builder** – `next build` with `output: "standalone"`
3. **runner** – only the standalone server, static assets, migrations and the
   admin/migration scripts; runs as the unprivileged `node` user (uid 1000),
   with a `HEALTHCHECK` on `/api/health`

The image contains **no secrets**; `.dockerignore` excludes all `.env*` files.
Configuration is passed as environment variables at runtime.

```bash
npm run docker:up      # build image, start db → migrate → app on http://localhost:3000
npm run docker:down    # stop
docker build -t autocare:local .   # build the image only
```

Commands available inside the image:

| Purpose                        | Command                                                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Start the web server (default) | `node server.js`                                                                                                                |
| Apply migrations               | `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/migrate.ts`                                                        |
| Create/reset an admin          | `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/create-admin.ts <email>` (password via `ADMIN_PASSWORD` or prompt) |

Example: `docker compose --env-file .env.local exec app node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/create-admin.ts inhaber@example.com`

| Endpoint          | Meaning                        | Database checked?                                    |
| ----------------- | ------------------------------ | ---------------------------------------------------- |
| `GET /api/health` | Liveness – the process answers | no (a DB outage must not restart healthy containers) |
| `GET /api/ready`  | Readiness – can serve requests | yes (`select 1`, 503 when unavailable)               |

## Tests and quality checks

| Command                                   | What it runs                                                               |
| ----------------------------------------- | -------------------------------------------------------------------------- |
| `npm run check`                           | Everything below except e2e: format, lint, types, unit + integration tests |
| `npm run format` / `npm run format:check` | Prettier (incl. Tailwind class order)                                      |
| `npm run lint`                            | ESLint                                                                     |
| `npm run typecheck`                       | TypeScript                                                                 |
| `npm test`                                | Unit tests (`src/**/*.test.ts`) – no database needed                       |
| `npm run test:integration`                | Integration tests (`tests/integration/`) against PostgreSQL                |
| `npm run build && npm run test:e2e`       | Browser tests (`tests/e2e/`) with Playwright against the production build  |

Integration and e2e tests use a **separate database** (`<name>_test`, created
and migrated automatically; override with `TEST_DATABASE_URL`). They never
touch development data – truncation refuses databases not ending in `_test`.

What is covered:

- **Unit:** booking calendar and time zones (run with `TZ=America/New_York`
  to prove nothing depends on the machine's zone), validation rules, Arabic
  template (RTL, escaping, failure notices), password hashing, DeepL client
  (success, HTTP/network errors, no secrets in errors).
- **Integration:** UTC storage across DST, 5 simultaneous requests for one
  slot (exactly one wins), availability without personal data, status
  transitions, rescheduling conflicts, translation/notification success,
  failure and retry, real SMTP delivery to an in-process SMTP server, rate
  limiting.
- **E2E:** landing page → booking form, validation summary, booking stored
  and slot shown as taken, admin redirect, wrong password, owner confirms a
  request, logout.

## Tech choices

| Technology                           | Why                                                                                                              |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Next.js 16 (App Router) + React 19   | One framework for pages now and server-side booking logic later (Phase 3). Pages are prerendered as static HTML. |
| TypeScript                           | Catches mistakes early; shared types between UI and server later.                                                |
| Tailwind CSS v4                      | Utility styling with a small set of design tokens defined in `globals.css`.                                      |
| `next/font` (Archivo, IBM Plex Mono) | Self-hosted fonts at build time, no runtime request to Google.                                                   |
| `next/image`                         | Responsive, optimised images with blur placeholders.                                                             |
| PostgreSQL 17 (Docker)               | Relational database with real constraints (unique/check) to protect data integrity.                              |
| Drizzle ORM + drizzle-kit            | Type-safe queries and plain SQL migration files you can read and review.                                         |
| `pg` (node-postgres)                 | The PostgreSQL driver used by Drizzle.                                                                           |
| nodemailer 8                         | Sends the owner notification through any SMTP server.                                                            |
| DeepL API                            | German → Arabic machine translation (optional; free tier available).                                             |
| Zod 4                                | Declarative validation; the same schema validates in the browser now and on the server later.                    |
| ESLint (`eslint-config-next`)        | Linting incl. React / accessibility rules.                                                                       |

## Image credits

| Image                | Author       | License                                                         | Source                                                                                                                                              |
| -------------------- | ------------ | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `werkstatt-hero.jpg` | Martin Vorel | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Car_repair_shop.jpg)                                                                    |
| `motor-detail.jpg`   | Shixart1985  | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/)       | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Old_car_engine_showing_various_parts_and_tools_during_maintenance_work_in_a_garage.jpg) |

Both images were resized to 2400 px width. Attribution is shown in the site footer.

## Roadmap

0. Discovery & architecture ✅
1. Landing page ✅
2. Booking interface ✅
3. Backend + PostgreSQL ✅
4. Arabic notifications ✅
5. Admin dashboard & security ✅
6. Quality assurance ✅
7. Docker ✅
8. CI/CD (GitHub Actions)
9. Kubernetes
10. Argo CD GitOps
11. GCP deployment (GKE, Cloud SQL, Artifact Registry)

## Open items before going live

- Replace example data in `src/config/site.ts`.
- Add public holidays to `site.booking.closedDates`.
- `npm audit` reports a moderate advisory in an `esbuild` copy bundled with
  `drizzle-kit` (dev-only CLI, not shipped). Re-check when drizzle-kit updates.
- Have a native Arabic speaker review the fixed texts in
  `src/lib/notifications/booking-template.ts`.
- Configure a real translation provider (`deepl`) and SMTP account.
- Failed notifications are not retried automatically; use "Benachrichtigung
  erneut senden" in the admin area.
- Customers are not yet informed automatically when a request is confirmed,
  rejected or moved – the owner contacts them.
- A full Content-Security-Policy (script nonces) is not configured yet.
- German law requires an **Impressum** and a **Datenschutzerklärung**; both
  need real legal content from the business and will be added as pages.
