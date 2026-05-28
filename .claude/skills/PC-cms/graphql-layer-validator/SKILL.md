---
name: graphql-layer-validator
description: Validates the Strapi GraphQL layer by introspecting the schema, verifying all content types are exposed, and running graphql-codegen to generate TypeScript types for the frontend.
argument-hint: "<site-slug>"
user-invocable: true
---

# GraphQL Layer Validator

Phase: **C — CMS Provisioning** (Step 4 of 4)

Validate the Strapi GraphQL API and generate TypeScript types for frontend consumption.

## Precondition

- Strapi running with content seeded (from `content-etl-pipeline`)
- GraphQL plugin enabled (from `strapi-bootstrapper`)

## Execution

### Step 1: Introspect GraphQL Schema

```bash
# Fetch introspection query
curl -X POST http://localhost:<port>/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __schema { types { name fields { name type { name kind } } } } }"}'
```

### Step 2: Validate Content Type Coverage

For each content type in the Content Model Spec, verify:
- Type exists in GraphQL schema
- All fields are exposed
- Relations are queryable with nested selection
- Query operations work: `find`, `findOne`

### Step 3: Run graphql-codegen

Install and configure graphql-codegen:

```bash
cd output/<site>/frontend
npm install -D @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations @graphql-codegen/typescript-graphql-request
```

Create `codegen.ts`:

```typescript
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: `http://localhost:<port>/graphql`,
  documents: 'src/**/*.graphql',
  generates: {
    'src/generated/graphql.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
      ],
    },
  },
};
export default config;
```

Run codegen:

```bash
npx graphql-codegen
```

### Step 4: Verify Generated Types

- Check that generated types match Content Model Spec
- Verify no missing fields or incorrect types
- Ensure nullable/required matches spec

## Output Contract

- GraphQL schema validation report
- Generated TypeScript types at `output/<site>/frontend/src/generated/graphql.ts`
- Type coverage report:
  - Content types covered: N/N
  - Fields covered: N/N
  - Relations queryable: N/N
- Any mismatches or gaps documented

## Downstream

Output feeds into:
- Phase D: `cms-adapter-generator` (uses generated types)
- Phase D: `page-component-generator` (uses types for component props)
