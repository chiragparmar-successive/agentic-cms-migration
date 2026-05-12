---
name: strapi-schema-generator
description: Generates Strapi 5 JSON schema files from the approved canonical content model specification. Creates schema.json, controller, route, and service files for every content type and component.
argument-hint: "<site-slug>"
user-invocable: true
---

# Strapi Schema Generator

Phase: **C — CMS Provisioning** (Step 1 of 4)

Convert the approved Content Model Spec into concrete Strapi 5 schema files.

## Precondition

- CHECKPOINT 1 cleared (content model spec approved).
- CHECKPOINT 2 cleared (test suite approved).
- Content Model Spec at `output/<site>/docs/content-model/SCHEMA-DESIGN.md`

## Execution

### Step 1: Read Content Model Spec

Parse the approved SCHEMA-DESIGN.md to extract:
- Collection types with fields, types, validations
- Single types
- Components
- Relationships and cardinality

### Step 2: Generate Schema Files

For each **collection type**, create:

```
output/<site>/cms/src/api/<type-name>/
  content-types/<type-name>/schema.json
  controllers/<type-name>.ts
  routes/<type-name>.ts
  services/<type-name>.ts
```

For each **single type**, create the same structure with `"kind": "singleType"`.

For each **component**, create:

```
output/<site>/cms/src/components/<category>/<component-name>.json
```

### Step 3: Schema Format (Strapi 5)

Collection type schema.json example:

```json
{
  "kind": "collectionType",
  "collectionName": "<plural_snake_case>",
  "info": {
    "singularName": "<kebab-case>",
    "pluralName": "<kebab-case-plural>",
    "displayName": "<Display Name>",
    "description": "<from content model spec>"
  },
  "options": {
    "draftAndPublish": true
  },
  "attributes": {
    "<fieldName>": {
      "type": "<strapi-type>",
      "required": true|false,
      ...validations
    }
  }
}
```

### Step 4: Controller/Route/Service Templates

Use Strapi factory patterns:

```typescript
// controllers/<type-name>.ts
import { factories } from '@strapi/strapi';
export default factories.createCoreController('api::<type>.<type>');

// routes/<type-name>.ts
import { factories } from '@strapi/strapi';
export default factories.createCoreRouter('api::<type>.<type>');

// services/<type-name>.ts
import { factories } from '@strapi/strapi';
export default factories.createCoreService('api::<type>.<type>');
```

### Step 5: Type Mapping Reference

| Content Model Type | Strapi Attribute Type |
|---|---|
| String | `string` |
| Text | `text` |
| Rich Text | `richtext` |
| Number | `integer` / `float` / `decimal` |
| Boolean | `boolean` |
| Date | `date` / `datetime` |
| Email | `email` |
| URL | `string` with URL regex |
| Enum | `enumeration` |
| Media (single) | `media` (multiple: false) |
| Media (multiple) | `media` (multiple: true) |
| Slug | `uid` (targetField) |
| Relation 1:1 | `relation` (oneToOne) |
| Relation 1:N | `relation` (oneToMany / manyToOne) |
| Relation N:M | `relation` (manyToMany) |
| Component | `component` |
| Dynamic Zone | `dynamiczone` |

## Output Contract

- Schema files for all content types in `output/<site>/cms/src/api/`
- Component files in `output/<site>/cms/src/components/`
- Schema generation report:
  - Collection types generated: N
  - Single types generated: N
  - Components generated: N
  - Total fields: N
  - Total relationships: N

## Downstream

Output feeds into:
- `strapi-bootstrapper` (applies schemas to Strapi project)
