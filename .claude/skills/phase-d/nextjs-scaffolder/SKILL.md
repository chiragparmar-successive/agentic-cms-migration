---
name: nextjs-scaffolder
description: Scaffold a Next.js 16 project with TypeScript strict mode, Tailwind CSS, App Router, and React Server Components. Sets up the project foundation for CMS-driven frontend generation.
argument-hint: "<site-slug>"
user-invocable: true
---

# Next.js 16 Scaffolder

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

### Step 4: Project Structure

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
        adapter.ts
        strapi.ts
        types.ts
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
4. `next-cache-components` — cache components (Next.js 16)

### Step 6: Build Verification

```bash
cd output/<site>/frontend
npm install
npm run build
```

## Output Contract

- Scaffolded project at `output/<site>/frontend/`
- Build succeeds with zero errors
- TypeScript strict mode enabled
- Tailwind configured
- App Router + RSC defaults
- Environment variables documented

## Downstream

Output feeds into:
- `cms-adapter-generator` (adds CMS data layer)
