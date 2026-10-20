# jtl-management-frontend

React 18 + Vite 5 + MUI 5 admin and POS website with a Thai UI, at https://home.pueyleng.com.
Talks only to the backend API (https://api-home.pueyleng.com). For architecture, deploy,
database and business rules see the workspace `../CLAUDE.md` (and `../AGENTS.md` for agent
work). Default branch: `main`.

## Commands

```bash
yarn install
yarn dev        # local dev server
yarn build      # tsc && vite build - the only check (no tests); strict, noUnused* on
yarn preview
```

`.env` (keys in `.example.env`): `VITE_BASE_URL` = API base URL (falls back to
`http://localhost:3000`), `VITE_APP_*` = Firebase web config for login.
Production values are set in the Cloudflare Pages project.

## Layout

- `src/app/Router.tsx` - routes: `/login`, `/calendar` (attendance), `/employees`, `/payroll`,
  `/products`, `/pos`, `/pos/history`, `/members`, `/points`, `/settings/shop`,
  `/print/documents/:id`; everything except login is wrapped in `ProtectedRoute`.
- `src/pages/*Page.tsx` - one component per route.
- `src/modules/<domain>/` - `services/` (API calls), `hooks/`, `components/`, `types.ts` for
  advance, attendance, auth, document, employee, member, payroll, points, pos, product.
- `src/services/api.client.ts` - fetch wrapper; adds the Bearer JWT from localStorage, throws
  `ApiError` with the HTTP status (`isApiError(err, 409)`).
- `src/modules/auth/services/auth.service.ts` - Firebase email/password sign-in, then
  `POST /auth/login` to get the backend JWT.
- `src/modules/document/` - receipt / delivery note rendering (`bahtText.ts` = amount in Thai words).
- `src/modules/pos/config.ts` - `STOCK_TRACKING_ENABLED = false` (POS ignores stock for now).
- `src/shared/`, `src/theme/theme.ts` - shared components/utils and the MUI theme.
- Alias `@/` -> `src/`.

## Deploy

Cloudflare Pages builds and deploys every push to `main`. No PRs: branch, `yarn build`, merge
into `main`, push.

## Gotchas

- UI text is Thai; keep labels consistent with existing pages (e.g. แต้มสะสม, ข้อมูลร้าน,
  ใบส่งของ/ใบเสร็จรับเงิน).
- Shop is not VAT-registered: no VAT lines on documents. Receipt for persons/walk-ins, delivery
  note for shop customers. Deleted employees are soft-deleted and still shown in history.
- Product images are URLs served by the API (`/upload/files/...`), not public R2 URLs.
- Ids of members, notes and point transactions are strings (BigInt on the server).
- `src/services/firestore.client.ts` is an unused placeholder; data comes only from the API.
- `planning.md` / `ApiRequirement.md` are early planning notes; trust the code.
- Testing against production: fake data only (phones `0999999xxx`, names `TEST ...`), delete it after.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
