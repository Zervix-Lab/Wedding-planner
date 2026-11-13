# Wedding Planner (සිංහල / English)

A simple, fast wedding-planning web app for families. Built for people who are **not** comfortable with technology:
big text, big buttons, plain words, Sinhala by default, and a Sinhala/English switch on every page.

**Stack:** Next.js 15 (App Router, TypeScript) · Tailwind CSS 4 · MongoDB Atlas + Mongoose · custom JWT auth (`jose` + `bcryptjs`) · Cloudinary images · deploys to Vercel.

## What's inside

| Page | Who | What |
|---|---|---|
| `/` | Public | Redirects to `/dashboard` when logged in, otherwise to `/login`. There is no public home page: the app is only for the people planning the wedding. |
| `/login` | Public | Email + password |
| `/dashboard` | Admin + editors | Days left, guests (bride/groom split), replies and invitation status, vendors, latest guests (with who added them), and the **complete final budget: every item, every price calculation, service charges and the grand total**. Admin also edits the couple's names, message and event details here. |
| `/dashboard/budget` | Admin + editors | Budget Builder (live total), saved plans, compare up to 3. **Only the admin can save plans / mark Final.** |
| `/dashboard/guests` | Admin + editors | Form on top, table below. Search, filters, paging, who added each guest. |
| `/dashboard/vendors` | Admin, and editors the admin allows | Table + form, up to 3 photos, packages, **add a new category on the spot**. Other editors see it read-only. |
| `/dashboard/users` | Admin only | Create members with an email + password, choose their role, switch vendor access on/off |

Every list (guests, vendors, plans, members) has a **Download Excel** button.

### Roles

| | Admin | Editor |
|---|---|---|
| See overview and budget | yes | yes |
| Try the budget builder | yes | yes (cannot save) |
| Save / delete plans, mark Final | yes | no |
| Add and edit guests | yes | yes |
| Delete guests | any | only the ones they added |
| Add / edit / delete vendors and categories | yes | only if the admin ticks **"Can add and change vendors"** for that person |
| Couple's names and date, members | yes | no |

These rules are enforced on the server for every action (`src/lib/permissions.ts`), not just hidden in the menus.

## 1. Run it on your computer

Requirements: Node.js 20+ and free accounts at [MongoDB Atlas](https://www.mongodb.com/atlas) and [Cloudinary](https://cloudinary.com).

```bash
npm install
cp .env.example .env.local     # then fill in the values (see below)
npm run seed                   # creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD
npm run dev                    # http://localhost:3000
```

Log in with the admin email/password from `.env.local`, then:
1. **Dashboard** → type the bride's name, groom's name, a short message, and the date / time / place of the wedding (paste a Google Maps link if you like) → Save.
2. **Family members** → add accounts for parents/relatives: name, email, password, role (**Editor** by default) and side. Tick *Can add and change vendors* only for people you trust with the vendor list.
3. **Vendors** → add hotels, photographers, etc.

### Environment variables

| Name | What it is |
|---|---|
| `MONGODB_URI` | Atlas → *Database → Connect → Drivers* connection string (put your database name in it, e.g. `.../wedding?...`) |
| `JWT_SECRET` | Long random text, **32+ characters**. `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Cloudinary dashboard → *API Keys* |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Used **only** by `npm run seed` to create the first admin |

`npm run seed` is safe to run again: it creates the admin and the 8 built-in vendor categories if missing, and renames any old `member` accounts to `editor`. Nothing else is changed.

## 2. Deploy to Vercel

1. **MongoDB Atlas → Network Access** → add `0.0.0.0/0` (Vercel's IPs change; the database is still protected by its username/password).
2. Push this folder to a GitHub repository.
3. On [vercel.com](https://vercel.com) → **Add New → Project** → import the repo (framework is detected automatically).
4. **Settings → Environment Variables**: add `MONGODB_URI`, `JWT_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
   (`ADMIN_*` are only needed on your own computer for the seed.)
5. **Deploy.**
6. Create the admin **once**, from your computer, pointing at the same Atlas database: `npm run seed`.
7. Open your Vercel URL, log in, and finish the setup from step 1 above.

Tip: set a **region close to your Atlas cluster** (Vercel → Settings → Functions → Region) for faster pages.

## How it works (for whoever maintains it)

- **Auth:** `POST /api/auth/login` checks the password with bcrypt and sets an `httpOnly`, `sameSite=lax` (and `secure` in production) cookie holding a 7-day JWT. `src/middleware.ts` runs on the Edge runtime and **only verifies the JWT** (no Mongoose). It protects `/dashboard/*` and keeps `/dashboard/users` admin-only. Server pages and actions additionally re-check that the user still exists, so deleting an account locks that person out immediately.
- **Names are saved exactly as typed.** Type in Sinhala and it is stored as Sinhala; type in English and it is stored as English. Nothing is translated automatically. The 8 built-in categories and all screen text exist in both languages.
- **Categories** are data, not code: the 8 built-ins plus any the admin (or an allowed editor) adds while creating a vendor. They appear in the vendor form, the budget builder and the exports.
- **Excel export** (`/api/export/[kind]`) is generated on the server by a small built-in writer (`src/lib/xlsx.ts`, no library): real `.xlsx` with styled headers, frozen header row, filters, number formats and totals. The guest export follows the filters on screen.
- **Data changes** use Next.js Server Actions (`actions.ts` next to each page). Every action re-checks login/role and re-validates all input (`src/lib/validate.ts`). Errors travel as translation keys so toasts appear in the chosen language.
- **Budget maths** lives in one pure file, `src/lib/calc.ts`, used by the browser (instant totals, no server round-trip) and the server (dashboard total). **Totals are never stored**; plans keep only the selections, so a price change in Vendors updates every plan.
  - `fixed` → the option price (service charge is not applied to fixed prices)
  - `per_plate` → `adults × price + kids × (kidsPrice ?? price)`; if `adults + kids < minPlates` it charges `minPlates × price`; then adds the vendor's service-charge %.
- **Images:** the browser shrinks photos to ≤1600px wide (JPEG), asks `/api/upload/sign` for a signature, then uploads **directly to Cloudinary**. Only the `public_id` is saved. `next/image` uses a custom Cloudinary loader (`f_auto,q_auto`, sized per device). Replaced/deleted photos are removed from Cloudinary.
- **Languages:** `locales/si.json` + `locales/en.json`, a ~20-line `t()` function, language kept in the `lang` cookie (default Sinhala), Noto Sans Sinhala via `next/font`. Only the active language is sent to the browser. Run `npm run check:i18n` after editing translations: it fails if a key is missing in either language or used in code but not defined.

## Speed and freshness

Pages are fast because data is read from a **server-side cache** that is refreshed the instant something changes:

- Every save, edit or delete in the app clears exactly the data it affects (`guests`, `vendors`, `plans`, `users`, `settings` tags), so you and everyone else see the new data on the next screen. An editor's new guest shows on the admin's dashboard immediately.
- The browser keeps visited pages for 30 seconds, so moving between pages and using Back is instant. Your own saves always clear it.
- The signed-in user is re-checked against the database every 30 seconds (and immediately after the admin changes or deletes a member). A deleted member is locked out right away on the server that handled the deletion, and within 30 seconds on any other.
- **Edits made outside the app** (for example directly in the Atlas web page) can take up to 2 minutes to appear. Use the app for changes.
- Deleting something removes it from the screen instantly; if the server refuses, it comes back with an error message.

Measured against a database with a 60 ms round trip (like a remote Atlas cluster): page response 154-239 ms -> 15-25 ms, click-to-page 200-325 ms -> 53-84 ms, delete-a-guest 500 ms -> 56 ms. For the fastest results put the Vercel region close to your Atlas cluster.

## Scripts

| Command | |
|---|---|
| `npm run dev` | development server |
| `npm run build` / `npm start` | production build / server |
| `npm run seed` | create the first admin |
| `npm run typecheck` | TypeScript check |
| `npm run check:i18n` | translation completeness check |

## Known limits

- No password-reset email. An admin sets a new password in *Family members → Edit*.
- Login has no brute-force throttling (serverless functions have no shared memory). Use long passwords; add Vercel Firewall rate-limiting if exposed widely.
- A signed-in token lasts 7 days. Deleting a user, or demoting an admin, is re-checked against the database at least every 30 seconds (immediately on the server that handled the change). Promoting a member to admin only opens `/dashboard/users` after they log in again, because the Edge middleware reads the role from the token.
