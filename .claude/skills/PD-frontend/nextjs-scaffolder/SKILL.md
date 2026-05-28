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

### Step 3: Environment Configuration

Create `.env.local`:

```env
NEXT_PUBLIC_STRAPI_URL=http://localhost:<port>
STRAPI_API_TOKEN=<token>
```

Use the actual CMS port from Phase C — never hardcode.

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
- Environment variables documented

## Downstream

Output feeds into:
- `cms-adapter-generator` (adds CMS data layer)
