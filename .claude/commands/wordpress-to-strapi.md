---
description: WordPress → Strapi command 1 — content model + preview data in Strapi (not full migration). Use /wordpress-to-strapi-full for complete site import after checkpoints.
argument-hint: "<wordpress-url> [--cms-only] [--with-frontend] [--skip-tests]"
---

## `/wordpress-to-strapi`

**Command 1 — Preview setup:** content model, Strapi schemas, and a **small dataset** so you can review types and entries in Strapi.

This is **not** the full site migration. Command 2 (`/wordpress-to-strapi-full`) is a separate migration with its own data paths and import — it does not sync from preview state.

Optional flags: `--cms-only`, `--with-frontend`, `--skip-tests`

### Skill

- `.claude/skills/orchestrators/wordpress-to-strapi/SKILL.md`

### Script

```bash
node scripts/wp-migration/migrate-sample.mjs <site-slug> <wordpress-url>
STRAPI_URL=... STRAPI_API_TOKEN=... \
  node scripts/wp-migration/migrate-sample.mjs <site-slug> <wordpress-url> --import
```

Data lives under `output/<site>/wp-migration/preview/`.

### Arguments

`$ARGUMENTS` — WordPress URL plus optional flags.

If the URL is missing, stop and ask:

`/wordpress-to-strapi <wordpress-url> [--cms-only] [--with-frontend] [--skip-tests]`
