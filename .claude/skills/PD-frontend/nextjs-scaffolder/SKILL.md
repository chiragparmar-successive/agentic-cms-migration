---
name: nextjs-scaffolder
description: Scaffold a Next.js 15 project on Node 22 with TypeScript strict mode, Tailwind CSS, App Router, and React Server Components. Sets up the project foundation for CMS-driven frontend generation.
argument-hint: "<site-slug>"
user-invocable: true
---

# Next.js 15 Scaffolder (Node 22)

Phase: **D — Frontend Generation** (Step 1 of 4)

Create the Next.js project foundation with production-ready defaults.

## Precondition

- Phase C complete (Strapi + GraphQL ready)

## Execution

### Step 1: Initialise Project

```bash
cd output/<site>
npx create-next-app@latest frontend \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --eslint
```

After scaffold, enforce version pins:

- Next.js: `15.x`
- Node.js runtime: `22.x` (local + CI)

### Step 2: TypeScript Strict Mode

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### Step 3: Environment Configuration (required)

Create **both** files under `output/<site>/frontend/`:

1. `.env.local.example` — committed template (commented placeholders for humans/agents)
2. `.env.local` — local runtime values (gitignored; copy from example and fill after Phase C)

Use the **actual CMS port** from Phase C bootstrap — never assume `1337` without checking.

#### `.env.local.example` (committed)

```env
# =============================================================================
# Frontend local environment (copy to .env.local)
# Generated/updated during Phase C (Strapi bootstrap) + Phase D (frontend).
# =============================================================================

# --- Strapi API (server-side; never prefix with NEXT_PUBLIC_) ---
# GraphQL endpoint used by src/lib/cms/strapi-adapter.ts
STRAPI_GRAPHQL_URL=http://localhost:<cms-port>/graphql
# REST base used for media/upload helpers (optional)
STRAPI_REST_URL=http://localhost:<cms-port>/api
# API token: Strapi Admin → Settings → API Tokens → Create (Full access or scoped)
STRAPI_API_TOKEN=

# --- Strapi admin (local dev reference only — comment out in shared repos) ---
# Fill from first Strapi `npm run develop` registration OR bootstrap output:
# STRAPI_ADMIN_EMAIL=admin@example.com
# STRAPI_ADMIN_PASSWORD=your-generated-password
# STRAPI_ADMIN_URL=http://localhost:<cms-port>/admin

# --- Public site (safe for browser; NEXT_PUBLIC_*) ---
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=
NEXT_PUBLIC_SITE_TAGLINE=

# STRAPI_URL=http://localhost:<cms-port>  # optional; Phase C content-etl-pipeline
```

#### `.env.local` (gitignored, filled with real values)

After Strapi bootstrap, write **actual** values into `.env.local` and keep **commented copies** of admin credentials on adjacent lines so developers can see them without opening Strapi admin:

```env
STRAPI_GRAPHQL_URL=http://localhost:1337/graphql
STRAPI_REST_URL=http://localhost:1337/api
STRAPI_API_TOKEN=<paste-token-here>

# Admin login (local only — from Strapi first-run / bootstrap)
# STRAPI_ADMIN_EMAIL=admin@example.com
# STRAPI_ADMIN_PASSWORD=Abcd1234!Generated
# STRAPI_ADMIN_URL=http://localhost:1337/admin

NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=My Site
NEXT_PUBLIC_SITE_TAGLINE=From approved content model
```

Rules:

- Store **base URLs**, **GraphQL URL**, **API token**, and **site identity** in env — never hardcode in components.
- Store **Strapi admin email/password as commented lines** in `.env.local` for local visibility (do not commit real passwords to `.env.local.example`).
- Add `frontend/.env.local` to `.gitignore` if not already present.
- Document the same keys in `output/<site>/docs/FRONTEND-ENV.md` with CMS admin URL, GraphQL URL, and frontend dev URL.

### Step 4: Project Structure (CMS API best-practice)

```
output/<site>/frontend/
  src/
    app/
      layout.tsx
      page.tsx
      loading.tsx
      error.tsx
      not-found.tsx
    components/
      ui/
      sections/
      layouts/
    lib/
      cms/
        client.ts         # low-level HTTP/GraphQL client
        adapter.ts        # ICMSAdapter contract
        strapi.ts         # Strapi implementation
        index.ts          # stable exports
        types.ts          # CMS/domain types
        queries/          # query documents/builders
        mappers/          # DTO -> UI mapping
    generated/
      graphql.ts        # from graphql-codegen
    styles/
      globals.css
  public/
  next.config.ts
  tailwind.config.ts
  tsconfig.json
```

### Step 5: Vercel Best Practices Setup

Apply vendored skill packs as quality foundations:

1. `next-best-practices` — file conventions, RSC boundaries, metadata
2. `vercel-react-best-practices` — performance, bundle, rerender hygiene
3. `vercel-composition-patterns` — component API design
4. `next-cache-components` — optional advanced cache guidance (only when compatible with chosen Next.js version)

### Step 6: Scaffold Placeholder Page (CMS-ready only)

The default `app/page.tsx` must NOT ship marketing copy. Use a minimal shell that will be replaced by `page-component-generator`, or a thin server component that calls `cms.getHomePage()` once the adapter exists. Never leave create-next-app boilerplate (“Get started by editing…”) in the final deliverable.

Dynamic-data rule:

- Never ship static arrays/objects/literals as the primary source of user-visible content.
- Primary content must come from CMS adapter methods.

### Step 7: Build Verification

```bash
cd output/<site>/frontend
npm install
npm run build
```

## Output Contract

- Scaffolded project at `output/<site>/frontend/`
- Build succeeds with zero errors
- Next.js pinned to 15.x
- Node runtime pinned to 22.x
- TypeScript strict mode enabled
- Tailwind configured
- App Router + RSC defaults
- `.env.local.example` committed with commented Strapi admin + API placeholders
- `.env.local` created locally with real URLs/token (admin creds commented for visibility)
- `output/<site>/docs/FRONTEND-ENV.md` documents runtime URLs and env keys

## Downstream

Output feeds into:
- `cms-adapter-generator` (adds CMS data layer)
