<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Commands

```bash
npm run dev       # next dev (Turbopack default in v16)
npm run build     # next build
npm run start     # next start
npm run lint      # eslint .  (next lint was removed in v16)
npx tsc --noEmit  # manual typecheck (no script exists)
```

No test framework is configured.

# Routes

| Route | File | Notes |
|-------|------|-------|
| `/` | `app/page.tsx` | Public fleet listing. Fetches from Firestore `cars` collection. Arabic/English search with transliteration. LocalStorage cache (5 min TTL). PWA install banner (once/week). |
| `/login` | `app/login/page.tsx` | Admin login. Firebase email/password auth. Client-side only. |
| `/admin` | `app/admin/page.tsx` | CRUD dashboard. Client-side auth guard via `onAuthStateChanged`. Real-time updates via `onSnapshot`. |
| `/api/chat` (POST) | `app/api/chat/route.ts` | Proxies to n8n webhook at `http://localhost:5678/webhook-test/car-booking`. Requires n8n running locally. |

# Auth

No `middleware.ts` (or `proxy.ts` — v16 rename). Route protection is entirely client-side: `/admin` checks `onAuthStateChanged` in a `useEffect` and redirects to `/login`. The admin page is briefly accessible before the redirect fires.

# Known quirks

- `ChatWidget.tsx:73` has `return null` — the widget never renders.
- `// @ts-nocheck` at top of `app/page.tsx` and `app/admin/page.tsx`.
- Phone field in admin auto-prefixes `0` → `20` (Egypt country code).
- `@vercel/speed-insights/next` is used in the root layout.
- Smart search: 150+ model→brand mappings (e.g. "النترا" / "elantra" → matches Hyundai cars). Arabic and English both supported.
- Search supports Arabic brand names (e.g. "بي ام" → BMW).
- Partial Arabic matching: "بي" → matches BMW, "هيو" → matches Hyundai.

# Firebase data model

**Collection `cars`**: `{ name, price, description, image[], phone, bookedDays[], views, isVIP, createdAt, updatedAt }`

**Document `stats/global`**: `{ total_visits }`

Exports `db` (Firestore) and `auth` (Auth) from `@/lib/firebase`. API keys are public (standard for Firebase web SDK).

# Cloudinary

Images hosted on Cloudinary via `next-cloudinary`. Config allows `res.cloudinary.com` as a remote image pattern. Public keys in `.env.local`.
